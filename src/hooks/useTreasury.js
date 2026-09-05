import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, deleteDoc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Utilitaire local pour le calcul de l'occupation et éligibilité du covoiturage (identique à KilometricReimbursementManager et ReportsExports)
const calculateCarStatus = (car, associationSettings) => {
  const passengers = car.passengers || [];
  const totalAlfayas = passengers.reduce((sum, p) => sum + (Number(p.alfayasCount) || 0), 0);
  const alfayasInTrunk = Math.min(totalAlfayas, Number(car.trunkAlfayaCapacity) || 0);
  const alfayasOnSeats = totalAlfayas - alfayasInTrunk;
  const physicalPassengers = passengers.reduce((sum, p) => sum + (p.isPassenger ? 1 : 0), 0);
  const occupiedSeats = physicalPassengers + alfayasOnSeats;
  const availableSeats = (Number(car.passengerSeats) || 0) - occupiedSeats;
  const isFull = availableSeats === 0;

  let isEligibleForReimbursement = false;
  if (associationSettings?.enableCarpoolReimbursement !== false) {
    const rule = associationSettings?.reimbursementRule || 'full_cars_only';
    if (rule === 'all_drivers') {
      isEligibleForReimbursement = true;
    } else {
      isEligibleForReimbursement = isFull;
    }
  }
  return {
    isFull,
    isEligibleForReimbursement
  };
};

/**
 * Convertit en toute sécurité une valeur hétérogène (Timestamp Firestore, objet {seconds},
 * chaîne ISO, instance Date) en un objet Date JavaScript valide.
 * Renvoie null en cas de valeur invalide sans jamais lever d'exception.
 *
 * @param {any} val - Valeur à convertir
 * @returns {Date|null}
 */
export const toSafeDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof val === 'object') {
    const secs = val.seconds ?? val._seconds;
    if (typeof secs === 'number' && !isNaN(secs)) {
      const d = new Date(secs * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Résout la date effective d'une écriture comptable / transaction avec repli successif.
 * Priorités : tx.date -> tx.createdAt -> tx.dateCreation -> tx.timestamp
 *
 * @param {Object} tx - Transaction comptable
 * @returns {Date|null}
 */
export const getEffectiveTransactionDate = (tx) => {
  if (!tx) return null;
  return (
    toSafeDate(tx.date) ||
    toSafeDate(tx.createdAt) ||
    toSafeDate(tx.dateCreation) ||
    toSafeDate(tx.timestamp) ||
    null
  );
};

export function useTreasury(groupId) {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [helloAssoSignatureKey, setHelloAssoSignatureKey] = useState('');

  const [loadingStates, setLoadingStates] = useState({
    members: true,
    transactions: true,
    events: true,
    inventory: true,
    settings: true,
    credentials: true
  });

  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [updatingEventId, setUpdatingEventId] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const loading = Object.values(loadingStates).some(state => state === true);

  // Écoute de l'état d'authentification Firebase
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubAuth();
  }, []);

  // Synchronisation des données en temps réel depuis Firestore
  useEffect(() => {
    if (!groupId || !currentUser) {
      setLoadingStates({
        members: false,
        transactions: false,
        events: false,
        inventory: false,
        settings: false,
        credentials: false
      });
      return;
    }

    // 1. Members
    const usersRef = collection(db, 'users');
    const qMembers = query(usersRef, where('groupId', '==', groupId));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const isActive = !data.statutActuel || data.statutActuel === 'active';
        if (isActive) {
          fetched.push({ id: docSnap.id, ...data });
        }
      });
      setMembers(fetched);
      setLoadingStates(prev => ({ ...prev, members: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching members:", err);
      setError("Erreur de chargement des membres.");
      setLoadingStates(prev => ({ ...prev, members: false }));
    });

    // 2. Transactions
    const txRef = collection(db, 'transactions');
    const qTx = query(txRef, where('groupId', '==', groupId));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier chronologically desc
      fetched.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      setTransactions(fetched);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching transactions:", err);
      setError("Erreur de chargement des transactions.");
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    });

    // 3. Events
    const eventsRef = collection(db, 'events');
    const qEvents = query(eventsRef, where('groupId', '==', groupId));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier chronologically desc
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
      setLoadingStates(prev => ({ ...prev, events: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching events:", err);
      setError("Erreur de chargement des événements.");
      setLoadingStates(prev => ({ ...prev, events: false }));
    });

    // 4. Association Settings
    const assocRef = doc(db, 'associations', groupId);
    const unsubSettings = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
      setLoadingStates(prev => ({ ...prev, settings: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching association settings:", err);
      setError("Erreur de chargement des paramètres.");
      setLoadingStates(prev => ({ ...prev, settings: false }));
    });



    // 5. Inventaire du matériel (pour le suivi des prêts et cautions)
    const invRef = collection(db, 'inventory');
    const qInv = query(invRef, where('groupId', '==', groupId));
    const unsubInv = onSnapshot(qInv, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setInstruments(fetched);
      setLoadingStates(prev => ({ ...prev, inventory: false }));
    }, (err) => {
      console.error("useTreasury - Erreur chargement inventaire :", err);
      setLoadingStates(prev => ({ ...prev, inventory: false }));
    });

    // 6. HelloAsso Credentials
    const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
    getDoc(credentialsRef).then((docSnap) => {
      if (docSnap.exists()) {
        setHelloAssoSignatureKey(docSnap.data().helloAssoSignatureKey || '');
      }
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    }).catch(err => {
      console.error("useTreasury - Error fetching credentials :", err);
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    });

    return () => {
      unsubMembers();
      unsubTx();
      unsubEvents();
      unsubSettings();
      unsubInv();
    };
  }, [groupId, currentUser?.uid]);

  // Operations
  const handleAddTx = async (txForm, documentFile = null) => {
    if (!txForm.montant || !txForm.libelle) return;
    setSavingTx(true);
    try {
      const txDate = new Date(txForm.date);
      let justificatifUrl = null;
      let justificatifNom = null;

      if (documentFile && documentFile instanceof File) {
        const fileRef = ref(storage, `transactions/${groupId}/${Date.now()}_${documentFile.name}`);
        const snap = await uploadBytes(fileRef, documentFile);
        justificatifUrl = await getDownloadURL(snap.ref);
        justificatifNom = documentFile.name;
      }

      await addDoc(collection(db, 'transactions'), {
        groupId,
        date: Timestamp.fromDate(txDate),
        type: txForm.type,
        montant: parseFloat(txForm.montant) || 0,
        categorie: txForm.categorie,
        libelle: txForm.libelle,
        justificatifUrl: justificatifUrl || null,
        justificatifNom: justificatifNom || null
      });
    } catch (err) {
      console.error("useTreasury - Erreur addDoc transaction:", err);
      throw new Error("Erreur lors de l'enregistrement de l'opération.");
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    try {
      await deleteDoc(doc(db, 'transactions', txId));
    } catch (err) {
      console.error("useTreasury - Erreur suppression transaction:", err);
      throw new Error("Erreur lors de la suppression de l'opération.");
    }
  };

  const handleUpdateEventFinances = async (eventId, rec, dep) => {
    setUpdatingEventId(eventId);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        montantRecette: parseFloat(rec) || 0,
        montantDepense: parseFloat(dep) || 0
      });
    } catch (err) {
      console.error("useTreasury - Erreur update event finances:", err);
      throw new Error("Erreur lors de l'enregistrement.");
    } finally {
      setUpdatingEventId(null);
    }
  };

  const handleSaveAssociationSettings = async (updates, files = {}) => {
    setSavingSettings(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      const finalUpdates = { ...updates };

      // Upload files to Firebase Storage if provided
      if (files.droitImageFile && files.droitImageFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/droit_image.pdf`);
        const snap = await uploadBytes(docRef, files.droitImageFile);
        finalUpdates.droitImageDocUrl = await getDownloadURL(snap.ref);
      }

      if (files.aptitudeMedicaleFile && files.aptitudeMedicaleFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/aptitude_medicale.pdf`);
        const snap = await uploadBytes(docRef, files.aptitudeMedicaleFile);
        finalUpdates.aptitudeMedicaleDocUrl = await getDownloadURL(snap.ref);
      }

      await updateDoc(assocRef, finalUpdates);

      // Sauvegarder la clé HelloAsso si incluse dans les mises à jour
      if (updates.helloAssoSignatureKey !== undefined) {
        const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
        await setDoc(credentialsRef, {
          helloAssoSignatureKey: updates.helloAssoSignatureKey
        }, { merge: true });
        setHelloAssoSignatureKey(updates.helloAssoSignatureKey);
      }
    } catch (err) {
      console.error("useTreasury - Erreur update association settings:", err);
      throw new Error("Erreur lors de l'enregistrement de la configuration.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Finance logic compiler for the Dashboard
  const calculateGlobalBalance = (startDateStr, endDateStr) => {
    const entries = []; // Each entry is { date, category, label, amount, type: 'recette' | 'depense' }

    const startDateObj = toSafeDate(startDateStr);
    const endDateObj = toSafeDate(endDateStr);
    const normalizedStartStr = startDateObj ? startDateObj.toISOString().split('T')[0] : (startDateStr || '');
    const normalizedEndStr = endDateObj ? endDateObj.toISOString().split('T')[0] : (endDateStr || '');

    const isWithinRange = (dateInput) => {
      const dateVal = toSafeDate(dateInput);
      if (!dateVal) return false;
      const dateStr = dateVal.toISOString().split('T')[0];
      if (normalizedStartStr && dateStr < normalizedStartStr) return false;
      if (normalizedEndStr && dateStr > normalizedEndStr) return false;
      return dateStr;
    };

    // 1. Cotisations members (Recettes)
    const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
      ? associationSettings.montantAdhesion 
      : (associationSettings?.montantCotisation || 0);

    const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
      ? associationSettings.optionsCotisation 
      : [];

    members.forEach(member => {
      const status = member.paymentStatus || 'unpaid';
      if (status === 'unpaid' || status === 'exempted') return;

      let paymentDateObj = null;
      if (member.dateSignatureDroitImage) {
        paymentDateObj = toSafeDate(member.dateSignatureDroitImage);
      } else if (member.dateSignatureAttestationSante) {
        paymentDateObj = toSafeDate(member.dateSignatureAttestationSante);
      }
      if (!paymentDateObj) {
        paymentDateObj = startDateObj ? startDateObj : new Date();
      }

      const dateStr = isWithinRange(paymentDateObj);
      if (!dateStr) return;

      const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim();
      const baseAmount = parseFloat(baseAdhesionAmount) || 0;

      // Base membership
      if (member.adhesionBase !== false && baseAmount > 0) {
        entries.push({
          date: dateStr,
          category: 'Cotisations',
          label: `Adhésion - ${fullName}${status === 'partial' ? ' (Partielle)' : ''}`,
          amount: baseAmount,
          type: 'recette'
        });
      }

      // Options
      (member.selectedOptions || []).forEach(optId => {
        const opt = optionsCotisation.find(o => o.id === optId);
        if (opt && (parseFloat(opt.montant) || 0) > 0) {
          entries.push({
            date: dateStr,
            category: 'Cotisations',
            label: `Option ${opt.nom} - ${fullName}`,
            amount: parseFloat(opt.montant) || 0,
            type: 'recette'
          });
        }
      });
    });



    // 3. Événements (Recettes et Dépenses)
    events.forEach(event => {
      const eventDate = toSafeDate(event.date) || toSafeDate(event.dateDebut) || toSafeDate(event.createdAt);
      const dateStr = isWithinRange(eventDate);
      if (!dateStr) return;

      const rec = Number(event.montantRecette) || 0;
      const dep = Number(event.montantDepense) || 0;

      let displayType = event.type;
      if (event.type === 'prestation') displayType = "Prestation";
      else if (event.type === 'repetition') displayType = "Répétition";
      else if (event.type === 'stage') displayType = "Stage";
      else if (event.type === 'atelier') displayType = "Atelier";
      else if (event.type === 'reunion') displayType = "Réunion";

      if (rec > 0) {
        entries.push({
          date: dateStr,
          category: 'Événements',
          label: `Revenus - ${event.titre || 'Événement'} (${displayType})`,
          amount: rec,
          type: 'recette'
        });
      }
      if (dep > 0) {
        entries.push({
          date: dateStr,
          category: 'Événements',
          label: `Frais - ${event.titre || 'Événement'} (${displayType})`,
          amount: dep,
          type: 'depense'
        });
      }
    });

    // 4. Frais Kilométriques (Dépenses)
    const indemniteKilometrique = associationSettings?.indemniteKilometrique || 0;
    const enableCarpoolReimbursement = associationSettings?.enableCarpoolReimbursement !== false;

    if (indemniteKilometrique > 0 && enableCarpoolReimbursement) {
      events.forEach(event => {
        const eventDate = toSafeDate(event.date) || toSafeDate(event.dateDebut) || toSafeDate(event.createdAt);
        const dateStr = isWithinRange(eventDate);
        if (!dateStr) return;

        const distance = event.distanceAllerRetourKm || 0;
        if (distance <= 0) return;

        // Drivers in convoi
        const convoiDrivers = [];
        if (event.covoiturage?.voitures) {
          event.covoiturage.voitures.forEach(voiture => {
            if (voiture.chauffeurId && voiture.chauffeurNom) {
              const status = calculateCarStatus(voiture, associationSettings);
              const userIns = event.inscriptions?.find(ins => ins.userId === voiture.chauffeurId);
              const wantsRefund = userIns?.status === 'present' && userIns?.demandeRemboursementKm === true;

              convoiDrivers.push({
                id: voiture.chauffeurId,
                nom: voiture.chauffeurNom,
                isEligibleRefund: status.isEligibleForReimbursement && wantsRefund
              });
            }
          });
        }

        // Individual drivers
        const convoiChauffeurIds = new Set(convoiDrivers.map(d => d.id));
        const individualDrivers = [];
        if (event.inscriptions) {
          event.inscriptions.forEach(ins => {
            if (ins.status === 'present' && ins.transport === 'propre') {
              if (!convoiChauffeurIds.has(ins.userId)) {
                individualDrivers.push({
                  id: ins.userId,
                  nom: ins.userName || ins.nom || 'Membre',
                  isEligibleRefund: ins.demandeRemboursementKm === true
                });
              }
            }
          });
        }

        const allDrivers = [...convoiDrivers, ...individualDrivers];
        allDrivers.forEach(driver => {
          if (driver.isEligibleRefund) {
            const refundAmount = distance * indemniteKilometrique;
            if (refundAmount > 0) {
              entries.push({
                date: dateStr,
                category: 'Frais Kilométriques',
                label: `Remboursement Km ${driver.nom} - ${event.titre || 'Événement'}`,
                amount: refundAmount,
                type: 'depense'
              });
            }
          }
        });
      });
    }

    // 5. Opérations Diverses (Recettes et Dépenses)
    transactions.forEach(tx => {
      const effectiveDate = getEffectiveTransactionDate(tx);
      const dateStr = isWithinRange(effectiveDate);
      if (!dateStr) return;

      const amount = Number(tx.montant) || 0;
      if (amount <= 0) return;

      if (tx.type === 'recette') {
        entries.push({
          date: dateStr,
          category: 'Opérations Diverses',
          label: tx.libelle || `Opération Libre - Recette`,
          amount: amount,
          type: 'recette'
        });
      } else {
        entries.push({
          date: dateStr,
          category: 'Opérations Diverses',
          label: tx.libelle || `Opération Libre - Dépense`,
          amount: amount,
          type: 'depense'
        });
      }
    });

    // Compute totals
    const totalRecettes = entries.filter(e => e.type === 'recette').reduce((sum, e) => sum + e.amount, 0);
    const totalDepenses = entries.filter(e => e.type === 'depense').reduce((sum, e) => sum + e.amount, 0);
    const solde = totalRecettes - totalDepenses;

    // Group entries by category for dashboard breakdown
    const categoriesBreakdown = {
      recette: {
        'Cotisations': 0,
        'Événements': 0,
        'Opérations Diverses': 0
      },
      depense: {
        'Événements': 0,
        'Frais Kilométriques': 0,
        'Opérations Diverses': 0
      }
    };

    entries.forEach(e => {
      if (categoriesBreakdown[e.type] && categoriesBreakdown[e.type][e.category] !== undefined) {
        categoriesBreakdown[e.type][e.category] += e.amount;
      }
    });

    return {
      entries,
      totalRecettes,
      totalDepenses,
      solde,
      categoriesBreakdown
    };
  };

  // Agrégation réactive des cautions d'instruments par adhérent
  const cautionsByMember = useMemo(() => {
    const defaultMontant = Number(associationSettings?.montantCautionDefaut) || 150;
    const map = {};

    members.forEach(member => {
      const memberId = member.id;
      // Instruments actuellement empruntés ou détenus par ce membre
      const borrowed = (instruments || []).filter(inst => 
        (inst.status === 'Emprunté' && inst.borrowedBy === memberId) ||
        (inst.status === 'Emprunté' && inst.localisationPhysique === memberId)
      );

      if (borrowed.length === 0) {
        map[memberId] = {
          statutGlobal: 'na',
          totalCaution: 0,
          countInstruments: 0,
          instruments: []
        };
      } else {
        let allRecue = true;
        let totalCaution = 0;

        const detailedList = borrowed.map(inst => {
          const montant = inst.caution?.montant !== undefined && inst.caution?.montant !== null
            ? Number(inst.caution.montant) 
            : defaultMontant;
          const statut = inst.caution?.statut || 'non_recue';
          const typeGarantie = inst.caution?.typeGarantie || 'cheque';
          const reference = inst.caution?.reference || '';
          
          if (statut !== 'recue') {
            allRecue = false;
          }
          totalCaution += montant;

          return {
            id: inst.id,
            nom: inst.nom || 'Instrument',
            type: inst.type || '',
            montant,
            statut,
            typeGarantie,
            reference,
            dateReception: inst.caution?.dateReception || null
          };
        });

        map[memberId] = {
          statutGlobal: allRecue ? 'recue' : 'en_attente',
          totalCaution,
          countInstruments: detailedList.length,
          instruments: detailedList
        };
      }
    });

    return map;
  }, [members, instruments, associationSettings?.montantCautionDefaut]);

  // Enregistrement ou mise à jour de la caution sur un instrument physique
  const handleUpdateCaution = useCallback(async (instrumentId, cautionData) => {
    try {
      const instRef = doc(db, 'inventory', instrumentId);
      await updateDoc(instRef, {
        caution: {
          ...cautionData,
          updatedAt: Timestamp.now()
        }
      });
    } catch (err) {
      console.error("useTreasury - Erreur mise à jour caution :", err);
      throw new Error("Erreur lors de l'enregistrement de la caution.");
    }
  }, []);

  return {
    members,
    transactions,
    events,
    instruments,
    cautionsByMember,
    associationSettings,
    helloAssoSignatureKey,
    loading,
    error,
    savingSettings,
    savingTx,
    updatingEventId,
    handleAddTx,
    handleDeleteTx,
    handleUpdateEventFinances,
    handleSaveAssociationSettings,
    handleUpdateCaution,
    calculateGlobalBalance
  };
}
