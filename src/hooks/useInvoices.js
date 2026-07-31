import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  runTransaction,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useInvoices(groupId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Synchronisation Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubAuth();
  }, []);

  // Écoute en temps réel de la collection `invoices`
  useEffect(() => {
    if (!groupId || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const invoicesRef = collection(db, 'invoices');
    const qInvoices = query(invoicesRef, where('groupId', '==', groupId));

    const unsub = onSnapshot(
      qInvoices,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Tri chronologique décroissant (plus récentes en premier)
        list.sort((a, b) => {
          const dateA = a.dateEmission ? new Date(a.dateEmission) : new Date(0);
          const dateB = b.dateEmission ? new Date(b.dateEmission) : new Date(0);
          return dateB - dateA;
        });

        setInvoices(list);
        setLoading(false);
      },
      (err) => {
        console.error("useInvoices - Erreur lors de l'écoute Firestore :", err);
        setError("Impossible de charger les factures et devis.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [groupId, currentUser?.uid]);

  /**
   * Calcul automatique du prochain numéro chronologique (DEV-2026-001 ou FAC-2026-001)
   */
  const getNextNumber = (type = 'facture') => {
    const currentYear = new Date().getFullYear();
    const prefix = type === 'devis' ? 'DEV' : 'FAC';

    // Filtrer les documents de l'année en cours du type spécifié
    const currentYearInvoices = invoices.filter((item) => {
      const isTypeMatch = item.type === type;
      const numStr = item.numero || '';
      return isTypeMatch && numStr.includes(`${prefix}-${currentYear}-`);
    });

    let maxCounter = 0;
    currentYearInvoices.forEach((item) => {
      const parts = item.numero.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxCounter) {
          maxCounter = num;
        }
      }
    });

    const nextCounter = maxCounter + 1;
    return `${prefix}-${currentYear}-${String(nextCounter).padStart(3, '0')}`;
  };

  /**
   * Créer un nouveau Devis ou Facture
   */
  const createInvoice = async (invoiceForm) => {
    if (!groupId) return;
    setSaving(true);
    try {
      const type = invoiceForm.type || 'facture';
      const autoNum = invoiceForm.numero?.trim() || getNextNumber(type);

      const newDoc = {
        groupId,
        type,
        numero: autoNum,
        client: {
          nom: invoiceForm.clientNom?.trim() || '',
          email: invoiceForm.clientEmail?.trim() || '',
          adresse: invoiceForm.clientAdresse?.trim() || '',
          siret: invoiceForm.clientSiret?.trim() || ''
        },
        dateEmission: invoiceForm.dateEmission || new Date().toISOString().split('T')[0],
        dateEcheance: invoiceForm.dateEcheance || '',
        statut: invoiceForm.statut || 'brouillon',
        lignes: Array.isArray(invoiceForm.lignes) ? invoiceForm.lignes : [],
        montantHT: parseFloat(invoiceForm.montantHT) || 0,
        montantTTC: parseFloat(invoiceForm.montantTTC) || 0,
        notes: invoiceForm.notes?.trim() || '',
        paidTransactionId: null,
        datePaiement: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'invoices'), newDoc);
      return docRef.id;
    } catch (err) {
      console.error("useInvoices - Erreur création document :", err);
      throw new Error("Erreur lors de la création du document.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Mettre à jour un Devis ou une Facture existante
   */
  const updateInvoice = async (invoiceId, updates) => {
    setSaving(true);
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("useInvoices - Erreur mise à jour document :", err);
      throw new Error("Erreur lors de la mise à jour du document.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Supprimer un Devis ou une Facture
   */
  const deleteInvoice = async (invoiceId) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
    } catch (err) {
      console.error("useInvoices - Erreur suppression document :", err);
      throw new Error("Erreur lors de la suppression du document.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * PONT TRÉSORERIE ANTI-DOUBLON (TRANSACTION ATOMIQUE FIRESTORE)
   * Passe le statut de la facture à "paye" ET insère automatiquement une recette dans transactions.
   */
  const markInvoiceAsPaid = async (invoice) => {
    if (!invoice || !invoice.id) return;
    setSaving(true);

    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(db, 'invoices', invoice.id);
        const invoiceSnap = await transaction.get(invoiceRef);

        if (!invoiceSnap.exists()) {
          throw new Error("La facture n'existe plus.");
        }

        const data = invoiceSnap.data();

        // 🛡️ VÉRIFICATION ATOMIQUE ANTI-DOUBLON
        if (data.statut === 'paye' || data.paidTransactionId) {
          throw new Error("Cette facture a déjà été marquée comme payée.");
        }

        // Création d'une nouvelle référence de transaction dans la collection `transactions`
        const newTxRef = doc(collection(db, 'transactions'));
        const amount = data.montantTTC || data.montantHT || 0;
        const clientNom = data.client?.nom || 'Client';

        // 1. Inscription de la recette dans la Trésorerie
        transaction.set(newTxRef, {
          groupId: data.groupId || groupId,
          date: Timestamp.fromDate(new Date()),
          type: 'recette',
          montant: amount,
          categorie: 'Prestations / Factures',
          libelle: `Paiement Facture ${data.numero} - ${clientNom}`,
          source: 'facturation',
          invoiceId: invoice.id,
          createdAt: serverTimestamp()
        });

        // 2. Verrouillage et mise à jour de la facture
        transaction.update(invoiceRef, {
          statut: 'paye',
          paidTransactionId: newTxRef.id,
          datePaiement: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      });
    } catch (err) {
      console.error("useInvoices - Erreur transaction markInvoiceAsPaid :", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Transformer un Devis validé en Facture officielle
   */
  const convertDevisToInvoice = async (devis) => {
    if (!devis || !devis.id) return;
    setSaving(true);
    try {
      const nextFacNum = getNextNumber('facture');
      const invoiceRef = doc(db, 'invoices', devis.id);

      await updateDoc(invoiceRef, {
        type: 'facture',
        numero: nextFacNum,
        convertedFromDevisNumero: devis.numero || null,
        statut: 'en_attente',
        dateEmission: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      });
      return nextFacNum;
    } catch (err) {
      console.error("useInvoices - Erreur transformation devis en facture :", err);
      throw new Error("Erreur lors de la transformation du devis en facture.");
    } finally {
      setSaving(false);
    }
  };

  return {
    invoices,
    loading,
    error,
    saving,
    getNextNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
    convertDevisToInvoice
  };
}
