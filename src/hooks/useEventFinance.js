import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook réactif gérant les données financières d'un événement.
 * - Récupère les devis et factures liés dans la collection `invoices`.
 * - Récupère les paramètres d'association pour les indemnités kilométriques.
 * - Calcule les frais automatiques de covoiturage (Partie Automatique).
 * - Calcule les frais annexes manuels (Partie Manuelle).
 * - Détermine le total des rentrées, le total des sorties et la marge nette estimée.
 *
 * @param {Object} event - Document événement Firestore
 * @param {string} groupId - Identifiant de l'association / du groupe
 */
export function useEventFinance(event, groupId) {
  const [invoices, setInvoices] = useState([]);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Écoute des devis et factures rattachés à cet événement
  useEffect(() => {
    if (!groupId || !event?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, where('groupId', '==', groupId));

    const unsubscribeInvoices = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Vérification du rattachement par eventId ou gigId (avec support rétrocompatible createdFromGigId)
          const targetGigId = event.gigId || event.createdFromGigId;
          if (
            data.eventId === event.id ||
            (targetGigId && data.gigId === targetGigId) ||
            (event.devisId && docSnap.id === event.devisId) ||
            (event.factureId && docSnap.id === event.factureId) ||
            (event.invoiceId && docSnap.id === event.invoiceId)
          ) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        setInvoices(list);
        setLoading(false);
      },
      (err) => {
        console.error('useEventFinance - Erreur chargement factures :', err);
        setLoading(false);
      }
    );

    // 2. Écoute des paramètres d'indemnités kilométriques de l'association
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAssociationSettings(docSnap.data());
      }
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeAssoc();
    };
  }, [groupId, event?.id, event?.gigId, event?.createdFromGigId, event?.devisId, event?.factureId, event?.invoiceId]);

  // 3. Détermination du document lié (Priorité Facture > Devis)
  const linkedInvoice = useMemo(() => {
    if (invoices.length === 0) return null;

    // Préférer les factures validées/payées/émises puis les devis
    const factures = invoices.filter((i) => i.type === 'facture');
    if (factures.length > 0) {
      return factures[0];
    }
    return invoices[0]; // retourne le premier devis trouvé
  }, [invoices]);

  // 4. Calcul du Total des Rentrées (Devis/Facture ou Legacy Archive)
  const { totalRecettes, isLegacyRevenue, documentStatusLabel } = useMemo(() => {
    if (linkedInvoice) {
      const amount =
        parseFloat(linkedInvoice.montantTTC) ||
        parseFloat(linkedInvoice.totalTTC) ||
        parseFloat(linkedInvoice.montantHT) ||
        parseFloat(linkedInvoice.montant) ||
        0;

      const typeLabel = linkedInvoice.type === 'facture' ? 'Facture' : 'Devis';
      const refStr = linkedInvoice.numero ? `#${linkedInvoice.numero}` : '';
      const statusStr = linkedInvoice.statut ? ` - ${linkedInvoice.statut}` : '';

      return {
        totalRecettes: amount,
        isLegacyRevenue: false,
        documentStatusLabel: `${typeLabel} ${refStr}${statusStr}`
      };
    }

    // Rétrocompatibilité (Legacy) si aucun document lié mais ancien montantRecette > 0
    const legacyRecette = parseFloat(event?.montantRecette) || 0;
    if (legacyRecette > 0) {
      return {
        totalRecettes: legacyRecette,
        isLegacyRevenue: true,
        documentStatusLabel: 'Revenus archivés (Saisie manuelle historique)'
      };
    }

    return {
      totalRecettes: 0,
      isLegacyRevenue: false,
      documentStatusLabel: 'Aucun document rattaché'
    };
  }, [linkedInvoice, event?.montantRecette]);

  // 5. Calcul de la partie automatique : Frais kilométriques de covoiturage
  const covoiturageAmount = useMemo(() => {
    if (!event) return 0;

    const distance = parseFloat(event.distanceAllerRetourKm) || 0;
    if (distance <= 0) return 0;

    const indemniteKm = parseFloat(associationSettings?.indemniteKilometrique) || 0;
    const enableReimbursement = associationSettings?.enableCarpoolReimbursement !== false;

    if (!enableReimbursement || indemniteKm <= 0) return 0;

    // Compter les conducteurs ayant demandé un remboursement
    const eligibleDriverIds = new Set();

    // A. Conducteurs dans le convoi
    if (event.covoiturage?.voitures) {
      event.covoiturage.voitures.forEach((voiture) => {
        if (voiture.chauffeurId) {
          const userIns = event.inscriptions?.find((ins) => ins.userId === voiture.chauffeurId);
          if (userIns?.demandeRemboursementKm === true) {
            eligibleDriverIds.add(voiture.chauffeurId);
          }
        }
      });
    }

    // B. Conducteurs en transport individuel
    if (event.inscriptions) {
      event.inscriptions.forEach((ins) => {
        if (ins.transport === 'propre' && ins.demandeRemboursementKm === true) {
          eligibleDriverIds.add(ins.userId);
        }
      });
    }

    return eligibleDriverIds.size * distance * indemniteKm;
  }, [event, associationSettings]);

  // 6. Calcul de la partie manuelle : Frais annexes
  const manualDepensesAmount = useMemo(() => {
    const budgetDepenses = Array.isArray(event?.budgetDepenses) ? event.budgetDepenses : [];
    return budgetDepenses.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
  }, [event?.budgetDepenses]);

  // 7. Total des sorties & Marge nette
  const totalDepenses = covoiturageAmount + manualDepensesAmount;
  const soldeNet = totalRecettes - totalDepenses;

  return {
    linkedInvoice,
    hasLinkedInvoice: !!linkedInvoice,
    totalRecettes,
    isLegacyRevenue,
    documentStatusLabel,
    covoiturageAmount,
    manualDepensesAmount,
    totalDepenses,
    soldeNet,
    loading
  };
}
