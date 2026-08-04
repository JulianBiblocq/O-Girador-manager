import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { exportNewsletterDraft } from '../services/newsletterService';

/**
 * Hook personnalisé gérant la logique et le cycle de vie des données du module Newsletter.
 * Charge les événements Firestore, gère les états du Stepper, la sélection des événements/photos,
 * et assemble le payload JSON standardisé.
 *
 * @param {string} groupId - ID du groupe / de l'association
 */
export function useNewsletterData(groupId) {
  // Étape actuelle du Stepper (1 à 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Étape 1 : Message d'accueil
  const [titreCampagne, setTitreCampagne] = useState('Newsletter Roda de Maracatu');
  const [messageAccueil, setMessageAccueil] = useState('');

  // Étape 2 : Événements futurs sélectionnés (IDs)
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState([]);

  // Étape 3 : Événements passés sélectionnés (IDs), bilans et photos
  const [selectedPastIds, setSelectedPastIds] = useState([]);
  const [pastEventBilans, setPastEventBilans] = useState({});
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Chargement Firestore des événements
  const [events, setEvents] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État de la soumission de l'export
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // Écoute en temps réel des événements Firestore
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));

    const unsubscribeEvents = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setEvents(fetched);
        setLoading(false);
      },
      (err) => {
        console.error('useNewsletterData - Erreur lecture événements :', err);
        setError('Impossible de charger les événements depuis Firestore.');
        setLoading(false);
      }
    );

    // Chargement optionnel des photos de la galerie publique
    const assocRef = doc(db, 'associations', groupId);
    getDoc(assocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const photos = data.publicTheme?.galleryPhotos || [];
        setGalleryPhotos(photos);
      }
    }).catch((err) => {
      console.warn('useNewsletterData - Erreur lecture galerie publique :', err);
    });

    return () => unsubscribeEvents();
  }, [groupId]);

  // Tri et séparation des événements à venir vs événements passés
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const upcoming = events
      .filter((evt) => (evt.date >= todayStr || (evt.endDate && evt.endDate >= todayStr)))
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    const past = events
      .filter((evt) => (evt.date < todayStr && (!evt.endDate || evt.endDate < todayStr)))
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  // Extraction de toutes les photos disponibles (issues des événements passés + galerie publique)
  const availablePhotos = useMemo(() => {
    const photoSet = new Set();

    // Photos issues des événements
    events.forEach((evt) => {
      if (Array.isArray(evt.photos)) {
        evt.photos.forEach((p) => p && photoSet.add(p));
      }
      if (Array.isArray(evt.photoUrls)) {
        evt.photoUrls.forEach((p) => p && photoSet.add(p));
      }
      if (evt.imageUrl) photoSet.add(evt.imageUrl);
      if (evt.photoUrl) photoSet.add(evt.photoUrl);
    });

    // Photos de la galerie publique
    galleryPhotos.forEach((p) => {
      if (typeof p === 'string' && p) photoSet.add(p);
      if (p && p.url) photoSet.add(p.url);
    });

    return Array.from(photoSet);
  }, [events, galleryPhotos]);

  // Basculer la sélection d'un événement à venir
  const toggleUpcomingEvent = (eventId) => {
    setSelectedUpcomingIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Basculer la sélection d'un événement passé
  const togglePastEvent = (eventId) => {
    setSelectedPastIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Mise à jour du bilan texte pour un événement passé
  const setPastBilan = (eventId, text) => {
    setPastEventBilans((prev) => ({
      ...prev,
      [eventId]: text
    }));
  };

  // Basculer la sélection d'une photo (limite stricte 2 à 4 photos max)
  const togglePhotoSelection = (photoUrl) => {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoUrl)) {
        return prev.filter((url) => url !== photoUrl);
      }
      if (prev.length >= 4) {
        return prev; // Respect du plafond de 4 photos maximum
      }
      return [...prev, photoUrl];
    });
  };

  // Assemblage du payload JSON structuré et neutre
  const payloadJSON = useMemo(() => {
    const prochaines_dates = upcomingEvents
      .filter((evt) => selectedUpcomingIds.includes(evt.id))
      .map((evt) => ({
        titre: evt.title || evt.titre || evt.nom || 'Sans titre',
        date: evt.date || evt.startDate || '',
        lieu: evt.location || evt.lieu || evt.adresse || 'Lieu non spécifié',
        description: evt.description || evt.details || evt.publicDescription || ''
      }));

    const evenements_passes = pastEvents
      .filter((evt) => selectedPastIds.includes(evt.id))
      .map((evt) => {
        // Associer les photos sélectionnées rattachées à cet événement ou répartir les photos globales
        const evtPhotos = selectedPhotos.filter((url) => {
          if (Array.isArray(evt.photos) && evt.photos.includes(url)) return true;
          if (Array.isArray(evt.photoUrls) && evt.photoUrls.includes(url)) return true;
          if (evt.imageUrl === url || evt.photoUrl === url) return true;
          return false;
        });

        return {
          titre: evt.title || evt.titre || evt.nom || 'Sans titre',
          bilan: pastEventBilans[evt.id] || evt.report || evt.bilan || '',
          photos: evtPhotos.length > 0 ? evtPhotos : selectedPhotos // Si pas de filtre spécifique par événement, inclure les photos sélectionnées
        };
      });

    return {
      titre_campagne: titreCampagne,
      message_accueil: messageAccueil,
      prochaines_dates,
      evenements_passes
    };
  }, [
    titreCampagne,
    messageAccueil,
    upcomingEvents,
    selectedUpcomingIds,
    pastEvents,
    selectedPastIds,
    pastEventBilans,
    selectedPhotos
  ]);

  // Déclencher l'export vers l'endpoint backend neutre
  const submitNewsletterExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await exportNewsletterDraft(payloadJSON);
      setExportResult({ success: true, data: res });
      return res;
    } catch (err) {
      setExportResult({ success: false, error: err.message });
      throw err;
    } finally {
      setExporting(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    titreCampagne,
    setTitreCampagne,
    messageAccueil,
    setMessageAccueil,
    upcomingEvents,
    selectedUpcomingIds,
    toggleUpcomingEvent,
    pastEvents,
    selectedPastIds,
    togglePastEvent,
    pastEventBilans,
    setPastBilan,
    availablePhotos,
    selectedPhotos,
    togglePhotoSelection,
    payloadJSON,
    loading,
    error,
    exporting,
    exportResult,
    submitNewsletterExport
  };
}
