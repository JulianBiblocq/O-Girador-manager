import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { getSeasonFromDate, DEFAULT_SEASON_START_MONTH } from '../utils/seasonUtils';
import { createInAppNotification } from '../utils/inAppNotificationService';

/**
 * Hook personnalisé pour la gestion des notes de frais associatives (expense_claims).
 * 
 * Assure la synchronisation en temps réel, l'isolation par groupId, le téléversement
 * des justificatifs dans Firebase Storage, ainsi que le workflow complet trésorier
 * (validation, refus avec motif, remboursement, écriture automatique dans transactions
 * et déclenchement des notifications push FCM).
 * 
 * @param {string} groupId Identifiant de l'association
 * @param {string} [userId=null] Optionnel : filtre spécifique à un adhérent
 * @param {number} [startMonth=DEFAULT_SEASON_START_MONTH] Optionnel : mois de rentrée de saison associative (1 à 12)
 */
export function useExpenseClaims(groupId, userId = null, startMonth = DEFAULT_SEASON_START_MONTH) {
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [associationSeasonStartMonth, setAssociationSeasonStartMonth] = useState(startMonth);

  // Synchronisation du mois de démarrage de la saison associative depuis les réglages
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.saisonDebutMois !== undefined) {
          setAssociationSeasonStartMonth(Number(data.saisonDebutMois));
        }
      }
    }, (err) => {
      console.warn("useExpenseClaims - Erreur lecture saisonDebutMois assoc:", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 1. Écoute temps réel de la collection expense_claims isolée par groupId
  useEffect(() => {
    if (!groupId) {
      return;
    }

    // Requête simple sur groupId sans imposer d'index composite complexe Firestore
    const claimsQuery = query(
      collection(db, 'expense_claims'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      claimsQuery,
      (snapshot) => {
        const claims = [];
        snapshot.forEach((docSnap) => {
          claims.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        // Tri en mémoire JavaScript par date de dépense antéchronologique puis création
        claims.sort((a, b) => {
          const dateA = a.dateDepense || '';
          const dateB = b.dateDepense || '';
          if (dateB !== dateA) {
            return dateB.localeCompare(dateA);
          }
          const createdA = a.createdAt || '';
          const createdB = b.createdAt || '';
          return createdB.localeCompare(createdA);
        });

        setAllClaims(claims);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useExpenseClaims - Erreur lors de l'écoute des notes de frais :", err);
        setError("Impossible de charger les notes de frais.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // 2. Filtrage en mémoire par userId si spécifié (espace profil adhérent)
  const claims = useMemo(() => {
    if (!userId) {
      return allClaims;
    }
    return allClaims.filter((c) => c.userId === userId);
  }, [allClaims, userId]);

  /**
   * Déclare une nouvelle note de frais avec upload de justificatif.
   * 
   * @param {object} params Paramètres de la dépense
   * @param {string} params.dateDepense Date de la dépense (YYYY-MM-DD)
   * @param {number|string} params.montant Montant déboursé
   * @param {string} params.motif Justification de la dépense
   * @param {File} params.receiptFile Fichier justificatif (image ou PDF)
   * @param {string} [params.userIban] IBAN de remboursement fourni par le membre
   * @param {object} params.currentUser Utilisateur Firebase Auth actif
   * @param {object} [params.profileData] Données de profil du membre
   * @returns {Promise<string>} Identifiant de la note de frais créée
   */
  const addExpenseClaim = async ({
    dateDepense,
    montant,
    motif,
    receiptFile,
    userIban,
    currentUser,
    profileData,
    startMonth: customStartMonth
  }) => {
    if (!groupId) throw new Error("Identifiant de groupe manquant.");
    if (!currentUser?.uid) throw new Error("Utilisateur non authentifié.");
    if (!dateDepense) throw new Error("La date de la dépense est requise.");
    if (!motif || !motif.trim()) throw new Error("Le motif est requis.");
    if (!receiptFile) throw new Error("Un justificatif (photo ou PDF) est obligatoire.");

    const parsedAmount = parseFloat(montant);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Le montant saisi doit être un nombre positif supérieur à zéro.");
    }

    setSubmitting(true);
    try {
      // Génération de l'identifiant unique Firestore
      const claimRef = doc(collection(db, 'expense_claims'));
      const claimId = claimRef.id;

      // Calcul automatique de la saison associative selon le mois configuré
      const effectiveStartMonth = customStartMonth !== undefined
        ? Number(customStartMonth)
        : (startMonth !== DEFAULT_SEASON_START_MONTH ? startMonth : associationSeasonStartMonth);
      const saison = getSeasonFromDate(dateDepense, effectiveStartMonth);


      // Téléversement du justificatif dans Firebase Storage
      // Format de chemin : associations/{groupId}/expenses/{userId}/{claimId}_{Date.now()}_{nomFichier}
      const safeFilename = receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `associations/${groupId}/expenses/${currentUser.uid}/${claimId}_${Date.now()}_${safeFilename}`;
      const fileRef = ref(storage, storagePath);

      const uploadSnap = await uploadBytes(fileRef, receiptFile, {
        contentType: receiptFile.type || 'application/octet-stream'
      });
      const receiptUrl = await getDownloadURL(uploadSnap.ref);

      // Mise à jour de l'IBAN dans le profil utilisateur si renseigné et différent
      const cleanIban = (userIban || profileData?.iban || '').trim();
      if (cleanIban && cleanIban !== (profileData?.iban || '')) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            iban: cleanIban
          });
        } catch (ibanErr) {
          console.warn("useExpenseClaims - Impossible de mettre à jour l'IBAN du profil :", ibanErr);
        }
      }

      const userName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 
                       currentUser.displayName || 
                       'Adhérent';

      const payload = {
        claimId,
        groupId,
        userId: currentUser.uid,
        userName,
        userEmail: currentUser.email || profileData?.email || '',
        userIban: cleanIban,
        dateDepense,
        saison,
        montant: parsedAmount,
        motif: motif.trim(),
        receiptUrl,
        receiptNom: receiptFile.name,
        status: 'pending',
        motifRefus: '',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reimbursedAt: null
      };

      await setDoc(claimRef, payload);
      return claimId;
    } catch (err) {
      console.error("useExpenseClaims - Erreur lors de l'enregistrement de la note de frais :", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Valide une note de frais (statut 'approved').
   * 
   * @param {string} claimId Identifiant de la note
   */
  const approveExpenseClaim = async (claimId) => {
    if (!claimId) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'expense_claims', claimId), {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("useExpenseClaims - Erreur lors de la validation :", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Refuse une note de frais avec motif justificatif et envoie un push FCM à l'adhérent.
   * 
   * @param {object} claim Note de frais concernée
   * @param {string} motifRefus Justification du refus saisie par le trésorier
   */
  const rejectExpenseClaim = async (claim, motifRefus) => {
    const claimId = claim?.claimId || claim?.id;
    if (!claimId) return;
    if (!motifRefus || !motifRefus.trim()) {
      throw new Error("Veuillez renseigner le motif du refus.");
    }

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const cleanRefus = motifRefus.trim();

      // 1. Mise à jour de la note de frais
      await updateDoc(doc(db, 'expense_claims', claimId), {
        status: 'rejected',
        motifRefus: cleanRefus,
        reviewedAt: nowIso
      });

      // 2. Notification push FCM via la file de traitement
      if (claim.userId && claim.groupId) {
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: claim.groupId,
            recipientId: claim.userId,
            userId: claim.userId,
            title: "❌ Note de frais refusée",
            body: `Votre note de frais pour "${claim.motif}" a été refusée : ${cleanRefus}`,
            url: '/profil?tab=frais',
            type: 'expense_rejected',
            createdAt: nowIso
          });
        } catch (pushErr) {
          console.warn("useExpenseClaims - Push notification non transmise :", pushErr);
        }

        // Notification in-app interne pour l'historique du membre
        try {
          await createInAppNotification({
            userId: claim.userId,
            groupId: claim.groupId,
            type: 'expense_status',
            titre: "❌ Note de frais refusée",
            message: `Votre note de frais pour "${claim.motif}" a été refusée : ${cleanRefus}`,
            targetUrl: '/profil?tab=frais'
          });
        } catch (notifErr) {
          console.warn("useExpenseClaims - Notification in-app non transmise :", notifErr);
        }
      }
    } catch (err) {
      console.error("useExpenseClaims - Erreur lors du refus :", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Marque une note comme remboursée, insère automatiquement la dépense dans
   * la collection racine 'transactions', et envoie un push FCM à l'adhérent.
   * 
   * @param {object} claim Note de frais à rembourser
   */
  const markAsReimbursed = async (claim) => {
    const claimId = claim?.claimId || claim?.id;
    if (!claimId) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const montantFloat = parseFloat(claim.montant) || 0;

      // 1. Mise à jour du statut de la note
      await updateDoc(doc(db, 'expense_claims', claimId), {
        status: 'reimbursed',
        reimbursedAt: nowIso
      });

      // 2. Insertion automatique d'une écriture dans la collection racine 'transactions'
      await addDoc(collection(db, 'transactions'), {
        groupId: claim.groupId,
        date: Timestamp.fromDate(now),
        type: 'depense',
        categorie: 'Remboursement frais membre',
        libelle: `${claim.motif || 'Frais'} - ${claim.userName || 'Membre'}`,
        montant: montantFloat,
        justificatifUrl: claim.receiptUrl || null,
        justificatifNom: claim.receiptNom || 'Justificatif_note_de_frais',
        claimId: claimId
      });

      // 3. Notification push FCM envoyée au membre avec redirection vers son profil
      if (claim.userId && claim.groupId) {
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: claim.groupId,
            recipientId: claim.userId,
            userId: claim.userId,
            title: "💸 Note de frais remboursée !",
            body: `Votre note de frais de ${montantFloat.toFixed(2)} € (${claim.motif}) a été marquée comme remboursée.`,
            url: '/profil?tab=frais',
            type: 'expense_reimbursed',
            createdAt: nowIso
          });
        } catch (pushErr) {
          console.warn("useExpenseClaims - Push notification remboursement non transmise :", pushErr);
        }

        // Notification in-app interne pour le membre
        try {
          await createInAppNotification({
            userId: claim.userId,
            groupId: claim.groupId,
            type: 'expense_status',
            titre: "💸 Note de frais remboursée !",
            message: `Votre note de frais de ${montantFloat.toFixed(2)} € (${claim.motif}) a été marquée comme remboursée.`,
            targetUrl: '/profil?tab=frais'
          });
        } catch (notifErr) {
          console.warn("useExpenseClaims - Notification in-app non transmise :", notifErr);
        }
      }
    } catch (err) {
      console.error("useExpenseClaims - Erreur lors du marquage comme remboursé :", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    claims,
    allClaims,
    loading,
    error,
    submitting,
    saisonDebutMois: associationSeasonStartMonth,
    addExpenseClaim,
    approveExpenseClaim,
    rejectExpenseClaim,
    markAsReimbursed
  };
}
