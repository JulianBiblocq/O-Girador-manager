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
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook React pour la gestion en temps réel du pipeline de prestations (Pôle Diffusion).
 *
 * @param {string} groupId Identifiant de l'association
 * @returns {Object} Méthodes et état du pipeline de prestations
 */
export function useGigsPipeline(groupId) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Synchronisation de l'état d'authentification
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubAuth();
  }, []);

  // Écoute en temps réel de la collection `gigs_pipeline`
  useEffect(() => {
    if (!groupId || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const gigsRef = collection(db, 'gigs_pipeline');
    const qGigs = query(gigsRef, where('groupId', '==', groupId));

    const unsub = onSnapshot(
      qGigs,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Tri par date de prestation ou date de création
        list.sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateA - dateB;
        });

        setGigs(list);
        setLoading(false);
      },
      (err) => {
        console.error("useGigsPipeline - Erreur lors de l'écoute Firestore :", err);
        setError("Impossible de charger les dossiers de prestations.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [groupId, currentUser?.uid]);

  /**
   * Créer un nouveau dossier de prestation
   */
  const createGig = async (gigForm) => {
    if (!groupId) return;
    setSaving(true);
    try {
      const newDoc = {
        groupId,
        eventName: gigForm.eventName?.trim() || 'Prestation sans nom',
        organizer: gigForm.organizer?.trim() || '',
        contactId: gigForm.contactId || null,
        contactEmail: gigForm.contactEmail?.trim() || '',
        contactPhone: gigForm.contactPhone?.trim() || '',
        date: gigForm.date || '',
        location: gigForm.location?.trim() || '',
        amount: parseFloat(gigForm.amount) || 0,
        heureArrivee: gigForm.heureArrivee || '',
        heureBalances: gigForm.heureBalances || '',
        heurePassage: gigForm.heurePassage || '',
        notes: gigForm.notes?.trim() || '',
        nextRelanceDate: gigForm.nextRelanceDate || '',
        status: gigForm.status || '1_demande',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'gigs_pipeline'), newDoc);
      return docRef.id;
    } catch (err) {
      console.error("useGigsPipeline - Erreur création prestation :", err);
      throw new Error("Erreur lors de la création de la prestation.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Mettre à jour un dossier de prestation existant
   */
  const updateGig = async (gigId, updates) => {
    setSaving(true);
    try {
      const gigRef = doc(db, 'gigs_pipeline', gigId);
      await updateDoc(gigRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("useGigsPipeline - Erreur mise à jour prestation :", err);
      throw new Error("Erreur lors de la mise à jour de la prestation.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Changer le statut d'un dossier de prestation (ex: glissé-déposé ou sélection)
   */
  const updateGigStatus = async (gigId, newStatus) => {
    setSaving(true);
    try {
      const gigRef = doc(db, 'gigs_pipeline', gigId);
      await updateDoc(gigRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("useGigsPipeline - Erreur changement statut :", err);
      throw new Error("Erreur lors du changement d'étape.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Créer automatiquement une Option dans l'Agenda principal (collection `events`)
   * et passer le dossier de prestation au statut '2_option'.
   */
  const createAgendaOption = async (gig) => {
    if (!gig || !gig.id) return;
    setSaving(true);
    try {
      const eventDate = gig.date || new Date().toISOString().split('T')[0];
      const eventTitle = `[OPTION] - ${gig.eventName}`;

      const newEventDoc = {
        groupId: gig.groupId || groupId,
        titre: eventTitle,
        type: 'prestation',
        date: eventDate,
        lieu: gig.location || '',
        description: `Option de prestation posée depuis le Pôle Diffusion.\nOrganisateur: ${gig.organizer || 'Non renseigné'}\nContact: ${gig.contactEmail || ''} ${gig.contactPhone || ''}\n${gig.notes || ''}`,
        isOption: true,
        isPublic: false,
        status: 'confirme',
        inscriptions: [],
        gigId: gig.id,
        createdFromGigId: gig.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 1. Injection de l'événement dans la collection `events`
      const eventDocRef = await addDoc(collection(db, 'events'), newEventDoc);

      // 2. Passage automatique du statut du dossier à '2_option' et liaison bidirectionnelle eventId
      const gigRef = doc(db, 'gigs_pipeline', gig.id);
      await updateDoc(gigRef, {
        eventId: eventDocRef.id,
        status: '2_option',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("useGigsPipeline - Erreur création option agenda :", err);
      throw new Error("Erreur lors de la création de l'option dans l'Agenda.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Supprimer un dossier de prestation
   */
  const deleteGig = async (gigId) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'gigs_pipeline', gigId));
    } catch (err) {
      console.error("useGigsPipeline - Erreur suppression prestation :", err);
      throw new Error("Erreur lors de la suppression du dossier.");
    } finally {
      setSaving(false);
    }
  };

  return {
    gigs,
    loading,
    error,
    saving,
    createGig,
    updateGig,
    updateGigStatus,
    createAgendaOption,
    deleteGig
  };
}
