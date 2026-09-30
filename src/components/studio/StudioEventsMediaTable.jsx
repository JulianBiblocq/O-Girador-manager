import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import StudioPhotoQrPrintModal from './StudioPhotoQrPrintModal';
import StudioEventMediaAccordionRow from './StudioEventMediaAccordionRow';
import useConfirm from '../../hooks/useConfirm';

/**
 * Composant : StudioEventsMediaTable
 * 
 * Tableau de bord opérationnel du Pôle Studio permettant de relier les événements
 * de la troupe à leurs dossiers de stockage Cloud :
 * 1. "Lien de dépôt public" (lienDepotMedias) pour récolter les prises de vue via QR-Code.
 * 2. "Lien de l'album finalisé" (albumPhotosUrl) synchronisé automatiquement avec le Varal Photos.
 * 
 * @param {string} groupId Identifiant de l'association
 * @param {boolean} canWrite Droit d'édition des métadonnées événements
 */
export default function StudioEventsMediaTable({ groupId, canWrite = false, onSwitchToVaral }) {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('recolte_active'); // 'recolte_active' (défaut), 'prestation', 'varal', 'past', 'future', 'all'
  
  // États de saisie locale par événement { [eventId]: { lienDepotMedias, albumPhotosUrl, savingDepot, savingAlbum, savedDepot, savedAlbum } }
  const [rowStates, setRowStates] = useState({});

  // États du provisionnement automatique Framaspace { [eventId]: { loading: boolean, error: string|null, success: boolean } }
  const [provisioningMap, setProvisioningMap] = useState({});

  // Modale QR-Code active
  const [activeQrModal, setActiveQrModal] = useState(null); // { qrUrl, eventTitle, eventDate, eventLocation, mode }

  // Liste des identifiants d'événements dépliés en accordéon (pliés par défaut)
  const [expandedEventIds, setExpandedEventIds] = useState(new Set());

  const toggleExpandEvent = (id) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 1. Écoute en temps réel des événements du groupe
  useEffect(() => {
    if (!groupId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });

      // Tri par date décroissante (les plus récents d'abord)
      list.sort((a, b) => {
        const dateA = new Date(a.dateDebut || a.date || 0).getTime();
        const dateB = new Date(b.dateDebut || b.date || 0).getTime();
        return dateB - dateA;
      });

      setEvents(list);
      setLoading(false);

      // Initialiser / synchroniser les états de saisie locaux
      setRowStates((prev) => {
        const updated = { ...prev };
        list.forEach((ev) => {
          if (!updated[ev.id]) {
            updated[ev.id] = {
              lienDepotMedias: ev.lienDepotMedias || '',
              albumPhotosUrl: ev.albumPhotosUrl || '',
              savingDepot: false,
              savingAlbum: false,
              savedDepot: false,
              savedAlbum: false
            };
          } else {
            // Mettre à jour si pas en cours d'édition
            if (!updated[ev.id].isEditingDepot) {
              updated[ev.id].lienDepotMedias = ev.lienDepotMedias || '';
            }
            if (!updated[ev.id].isEditingAlbum) {
              updated[ev.id].albumPhotosUrl = ev.albumPhotosUrl || '';
            }
          }
        });
        return updated;
      });
    }, (err) => {
      console.error("StudioEventsMediaTable - Erreur écoute events :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 2. Gestion de la saisie d'un champ
  const handleInputChange = (eventId, field, value) => {
    setRowStates((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value,
        [field === 'lienDepotMedias' ? 'isEditingDepot' : 'isEditingAlbum']: true,
        [field === 'lienDepotMedias' ? 'savedDepot' : 'savedAlbum']: false
      }
    }));
  };

  // 3. Sauvegarde atomique du Lien de Dépôt Public (lienDepotMedias)
  const handleSaveDepot = useCallback(async (eventId) => {
    if (!groupId || !canWrite) return;
    const currentState = rowStates[eventId];
    if (!currentState) return;

    const cleanUrl = (currentState.lienDepotMedias || '').trim();

    setRowStates((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], savingDepot: true }
    }));

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        lienDepotMedias: cleanUrl
      });

      setRowStates((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          savedDepot: true,
          isEditingDepot: false
        }
      }));

      setTimeout(() => {
        setRowStates((prev) => ({
          ...prev,
          [eventId]: { ...prev[eventId], savedDepot: false }
        }));
      }, 2000);
    } catch (err) {
      console.error("Erreur sauvegarde lienDepotMedias :", err);
      alert("Erreur lors de l'enregistrement du lien de dépôt.");
    } finally {
      setRowStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], savingDepot: false }
      }));
    }
  }, [groupId, canWrite, rowStates]);

  // 4. Sauvegarde atomique du Lien d'Album Finalisé (albumPhotosUrl)
  // et synchronisation automatique avec la collection 'documents' (Varal Photos)
  const handleSaveAlbumDirect = useCallback(async (event, specificUrl = null) => {
    if (!groupId || !canWrite || !event?.id) return;
    const eventId = event.id;
    const currentState = rowStates[eventId];
    const cleanUrl = (specificUrl !== null ? specificUrl : (currentState?.albumPhotosUrl || '')).trim();

    setRowStates((prev) => ({
      ...prev,
      [eventId]: { 
        ...prev[eventId], 
        albumPhotosUrl: cleanUrl, 
        savingAlbum: true 
      }
    }));

    try {
      const isVaralPublished = event.publierSurVaral === true || (event.publierSurVaral !== false && cleanUrl);

      // A. Mise à jour de l'événement dans 'events'
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        albumPhotosUrl: cleanUrl,
        ...(cleanUrl && event.publierSurVaral === undefined ? { publierSurVaral: true } : {})
      });

      // B. Synchronisation dans la collection 'documents' pour le Varal Photos
      const docsRef = collection(db, 'documents');
      const qDoc = query(
        docsRef,
        where('groupId', '==', groupId),
        where('eventId', '==', eventId),
        where('categoryId', '==', 'PhotosPrestations')
      );
      const existingSnap = await getDocs(qDoc);

      if (cleanUrl && isVaralPublished) {
        // Si l'album existe déjà dans documents, mettre à jour le lien
        if (!existingSnap.empty) {
          const docItem = existingSnap.docs[0];
          await updateDoc(doc(db, 'documents', docItem.id), {
            titre: `[Album] ${event.titre || 'Événement'}`,
            fileUrl: cleanUrl,
            dateAjout: event.dateDebut || event.date || new Date().toISOString()
          });
        } else {
          // Sinon créer un nouveau livret Cordel sur la corde PhotosPrestations
          await addDoc(docsRef, {
            groupId,
            eventId,
            titre: `[Album] ${event.titre || 'Événement'}`,
            fileUrl: cleanUrl,
            categorie: 'PhotosPrestations',
            categoryId: 'PhotosPrestations',
            type: 'dossier_externe',
            dateAjout: event.dateDebut || event.date || new Date().toISOString(),
            description: `Album photos officiel de l'événement "${event.titre || ''}" du ${new Date(event.dateDebut || event.date || Date.now()).toLocaleDateString('fr-FR')}.`
          });
        }
      } else {
        // Si l'URL a été vidée ou si publierSurVaral est désactivé, supprimer le document associé s'il existait
        if (!existingSnap.empty) {
          for (const d of existingSnap.docs) {
            await deleteDoc(doc(db, 'documents', d.id));
          }
        }
      }

      setRowStates((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          albumPhotosUrl: cleanUrl,
          savedAlbum: true,
          isEditingAlbum: false
        }
      }));

      setTimeout(() => {
        setRowStates((prev) => ({
          ...prev,
          [eventId]: { ...prev[eventId], savedAlbum: false }
        }));
      }, 2000);
    } catch (err) {
      console.error("Erreur synchronisation albumPhotosUrl / documents :", err);
      alert("Erreur lors de la synchronisation de l'album avec le Varal.");
    } finally {
      setRowStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], savingAlbum: false }
      }));
    }
  }, [groupId, canWrite, rowStates]);

  const handleSaveAlbum = useCallback(async (event) => {
    return handleSaveAlbumDirect(event);
  }, [handleSaveAlbumDirect]);

  // 4b. Alignement immédiat vers l'album Varal si une URL de dépôt est présente
  const handleAlignDepotToAlbum = useCallback(async (event) => {
    if (!groupId || !canWrite || !event?.id) return;
    const currentState = rowStates[event.id];
    const depotUrl = (currentState?.lienDepotMedias || event.lienDepotMedias || '').trim();
    if (!depotUrl) {
      alert("Aucun lien de dépôt n'est disponible pour cet événement.");
      return;
    }

    // Aligner l'URL et synchroniser immédiatement avec le Varal
    await handleSaveAlbumDirect(event, depotUrl);
  }, [groupId, canWrite, rowStates, handleSaveAlbumDirect]);

  // 5. Bascule instantanée des options booléennes de récolte et de publication Varal
  const handleToggleEventField = useCallback(async (ev, fieldName, currentValue) => {
    if (!groupId || !canWrite || !ev?.id) return;
    const nextValue = !currentValue;

    try {
      const eventRef = doc(db, 'events', ev.id);
      await updateDoc(eventRef, {
        [fieldName]: nextValue
      });

      // Si on désactive la publication Varal, nettoyer documents
      if (fieldName === 'publierSurVaral' && nextValue === false) {
        const docsRef = collection(db, 'documents');
        const qDoc = query(
          docsRef,
          where('groupId', '==', groupId),
          where('eventId', '==', ev.id)
        );
        const existingSnap = await getDocs(qDoc);
        for (const d of existingSnap.docs) {
          await deleteDoc(doc(db, 'documents', d.id));
        }
      } else if (fieldName === 'publierSurVaral' && nextValue === true) {
        // Si on active la publication Varal, utiliser l'album ou à défaut le lien de dépôt
        const targetUrl = ev.albumPhotosUrl || ev.lienDepotMedias;
        if (targetUrl) {
          const docsRef = collection(db, 'documents');
          const qDoc = query(
            docsRef,
            where('groupId', '==', groupId),
            where('eventId', '==', ev.id),
            where('categoryId', '==', 'PhotosPrestations')
          );
          const existingSnap = await getDocs(qDoc);
          if (existingSnap.empty) {
            await addDoc(docsRef, {
              groupId,
              eventId: ev.id,
              titre: `[Album] ${ev.titre || 'Événement'}`,
              fileUrl: targetUrl,
              categorie: 'PhotosPrestations',
              categoryId: 'PhotosPrestations',
              type: 'dossier_externe',
              dateAjout: ev.dateDebut || ev.date || new Date().toISOString(),
              description: `Album photos officiel de l'événement "${ev.titre || ''}" du ${new Date(ev.dateDebut || ev.date || Date.now()).toLocaleDateString('fr-FR')}.`
            });
          }
        }
      }
    } catch (err) {
      console.error(`Erreur mise à jour ${fieldName} pour l'événement ${ev.id} :`, err);
      alert(`Erreur lors de la mise à jour : ${err.message}`);
    }
  }, [groupId, canWrite]);

  // 6. Réinitialisation complète / Délier les dossiers Cloud et retirer du Varal
  const handleResetCloudMedia = useCallback(async (ev) => {
    if (!groupId || !canWrite || !ev?.id) return;
    const ok = await confirm({
      title: "Délier les dossiers Cloud ?",
      message: `Êtes-vous sûr de vouloir délier les dossiers Cloud et retirer "${ev.titre || 'cet événement'}" du Varal Photos ?`,
      confirmLabel: "Délier et retirer",
      cancelLabel: "Annuler",
      variant: "danger"
    });
    if (!ok) return;

    try {
      // A. Réinitialisation des champs Cloud de l'événement
      const eventRef = doc(db, 'events', ev.id);
      await updateDoc(eventRef, {
        lienDepotMedias: '',
        albumPhotosUrl: '',
        publierSurVaral: false,
        framaspaceFolder: null,
        framaspaceProvisionedAt: null
      });

      // B. Suppression du livret associé sur la corde PhotosPrestations du Varal
      const docsRef = collection(db, 'documents');
      const qDoc = query(
        docsRef,
        where('groupId', '==', groupId),
        where('eventId', '==', ev.id)
      );
      const existingSnap = await getDocs(qDoc);
      for (const d of existingSnap.docs) {
        await deleteDoc(doc(db, 'documents', d.id));
      }

      // C. Réinitialisation de l'état local d'édition
      setRowStates((prev) => ({
        ...prev,
        [ev.id]: {
          ...prev[ev.id],
          lienDepotMedias: '',
          albumPhotosUrl: '',
          savedDepot: false,
          savedAlbum: false
        }
      }));
    } catch (err) {
      console.error("Erreur lors de la réinitialisation Cloud :", err);
      alert("Erreur lors de la réinitialisation Cloud : " + err.message);
    }
  }, [groupId, canWrite]);

  // 7. Provisionnement automatique Framaspace (Création dossiers WebDAV & Liens OCS)
  const handleProvisionFramaspace = async (ev) => {
    if (!groupId || !canWrite || !ev?.id) return;

    setProvisioningMap((prev) => ({
      ...prev,
      [ev.id]: { loading: true, error: null, success: false }
    }));

    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
      const res = await provisionFn({
        eventId: ev.id,
        groupId
      });

      const data = res?.data;
      if (data && data.success) {
        setProvisioningMap((prev) => ({
          ...prev,
          [ev.id]: { loading: false, error: null, success: true }
        }));

        const newLienDepot = data.lienDepotMedias || ev.lienDepotMedias || '';
        const newAlbumUrl = data.albumPhotosUrl || ev.albumPhotosUrl || '';
        const finalUrl = newAlbumUrl || newLienDepot;
        const hasAlbum = Boolean(newAlbumUrl);

        // Mise à jour immédiate de l'affichage local si nouveaux liens reçus
        if (newLienDepot || newAlbumUrl) {
          setRowStates((prev) => ({
            ...prev,
            [ev.id]: {
              ...prev[ev.id],
              lienDepotMedias: newLienDepot,
              albumPhotosUrl: newAlbumUrl,
              savedDepot: Boolean(newLienDepot),
              savedAlbum: Boolean(newAlbumUrl)
            }
          }));
        }

        // Relier et synchroniser automatiquement le livret dans 'documents' (PhotosPrestations) au provisionnement
        try {
          const eventRef = doc(db, 'events', ev.id);
          await updateDoc(eventRef, {
            ...(newLienDepot ? { lienDepotMedias: newLienDepot } : {}),
            ...(newAlbumUrl ? { albumPhotosUrl: newAlbumUrl } : {}),
            publierSurVaral: true,
            activerRecolteMedias: true,
            ...(data.folderSlug ? { framaspaceFolder: data.folderSlug } : {}),
            framaspaceProvisionedAt: new Date().toISOString()
          });

          if (finalUrl) {
            const docsRef = collection(db, 'documents');
            const qDoc = query(
              docsRef,
              where('groupId', '==', groupId),
              where('eventId', '==', ev.id),
              where('categoryId', '==', 'PhotosPrestations')
            );
            const existingSnap = await getDocs(qDoc);

            if (!existingSnap.empty) {
              const docItem = existingSnap.docs[0];
              await updateDoc(doc(db, 'documents', docItem.id), {
                titre: hasAlbum ? `[Album] ${ev.titre || 'Événement'}` : `[Collecte Photos] ${ev.titre || 'Événement'}`,
                fileUrl: finalUrl,
                dateAjout: ev.dateDebut || ev.date || new Date().toISOString(),
                isDropOnly: !hasAlbum,
                hasAlbum
              });
            } else {
              await addDoc(docsRef, {
                groupId,
                eventId: ev.id,
                titre: hasAlbum ? `[Album] ${ev.titre || 'Événement'}` : `[Collecte Photos] ${ev.titre || 'Événement'}`,
                fileUrl: finalUrl,
                categorie: 'PhotosPrestations',
                categoryId: 'PhotosPrestations',
                type: 'dossier_externe',
                dateAjout: ev.dateDebut || ev.date || new Date().toISOString(),
                description: hasAlbum
                  ? `Album photos officiel de l'événement "${ev.titre || ''}" du ${new Date(ev.dateDebut || ev.date || Date.now()).toLocaleDateString('fr-FR')}.`
                  : `Dossier partagé pour déposer et collecter des médias liés à l'événement "${ev.titre || ''}".`,
                isDropOnly: !hasAlbum,
                hasAlbum
              });
            }
          }
        } catch (syncErr) {
          console.warn("StudioEventsMediaTable - Avertissement synchronisation Firestore côté client :", syncErr);
        }

        // Réinitialisation du statut de succès après 3.5 secondes
        setTimeout(() => {
          setProvisioningMap((prev) => ({
            ...prev,
            [ev.id]: { loading: false, error: null, success: false }
          }));
        }, 3500);
      } else {
        throw new Error(data?.error || "Échec du provisionnement Framaspace.");
      }
    } catch (err) {
      console.error("Erreur lors du provisionnement Framaspace :", err);
      const errMsg = err?.message || "Erreur de connexion avec Framaspace.";
      setProvisioningMap((prev) => ({
        ...prev,
        [ev.id]: { loading: false, error: errMsg, success: false }
      }));
    } finally {
      // Sécurité anti-spinner infini : garantir que le loading ne reste jamais bloqué
      setProvisioningMap((prev) => {
        if (prev[ev.id]?.loading) {
          return {
            ...prev,
            [ev.id]: { ...prev[ev.id], loading: false }
          };
        }
        return prev;
      });
    }
  };

  // 8. Filtrage des événements (Prestations & Récoltes actives par défaut)
  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return events.filter((ev) => {
      // Recherche textuelle
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const titreMatch = (ev.titre || '').toLowerCase().includes(queryLower);
        const lieuMatch = (ev.lieu || '').toLowerCase().includes(queryLower);
        if (!titreMatch && !lieuMatch) return false;
      }

      // Filtre de type / chronologie / statut média
      const evDate = (ev.dateDebut || ev.date || '').split('T')[0];
      const isTargetPresta = ev.type === 'prestation' || ev.type === 'concert' || ev.type === 'spectacle' || ev.isPrestation;
      const hasRecolte = ev.activerRecolteMedias === true || (isTargetPresta && ev.activerRecolteMedias !== false);
      const hasCloudMedia = Boolean((ev.lienDepotMedias || '').trim()) || Boolean((ev.albumPhotosUrl || '').trim());

      if (filterType === 'recolte_active') {
        // Par défaut : prestations et événements avec boîte photos activée ou médias existants
        return hasRecolte || hasCloudMedia;
      } else if (filterType === 'prestation') {
        return isTargetPresta;
      } else if (filterType === 'varal') {
        return ev.publierSurVaral === true;
      } else if (filterType === 'past') {
        return evDate && evDate < todayStr;
      } else if (filterType === 'future') {
        return evDate && evDate >= todayStr;
      }

      // 'all' : toutes les dates sans exception
      return true;
    });
  }, [events, searchQuery, filterType]);

  return (
    <div 
      data-tour="studio-events-media-table"
      className="w-full flex flex-col gap-4 text-left select-none animate-fade-in"
    >
      {/* Barre de filtrage et recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_10px_5px_8px] shadow-[2px_2px_0px_0px_#181716]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un concert, répétition ou lieu..."
            className="theme-input w-full px-2.5 py-1 text-xs font-bold rounded border border-encre-noire bg-white text-encre-noire"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-encre-noire/60 hover:text-encre-noire px-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Boutons de filtre rapide */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('recolte_active')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'recolte_active'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            📸 Prestations & Récoltes actives
          </button>
          <button
            type="button"
            onClick={() => setFilterType('varal')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'varal'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            🪢 Sur le Varal
          </button>
          <button
            type="button"
            onClick={() => setFilterType('future')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'future'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            🌱 À venir
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            📋 Toutes les dates ({events.length})
          </button>
        </div>
      </div>

      {/* Liste des événements avec édition des liens médias */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 bg-cordel-card-bg border-2 border-dashed border-encre-noire/30 rounded p-6">
          <span className="text-2xl animate-spin">⏳</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Chargement des événements de l'association...
          </span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-10 text-center text-xs font-bold text-encre-noire/60 bg-cordel-card-bg border-2 border-dashed border-encre-noire/30 rounded p-6">
          Aucun événement trouvé pour ces critères de recherche.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredEvents.map((ev) => (
            <StudioEventMediaAccordionRow
              key={ev.id}
              ev={ev}
              rowState={rowStates[ev.id] || {}}
              canWrite={canWrite}
              isExpanded={expandedEventIds.has(ev.id)}
              onToggleExpand={() => toggleExpandEvent(ev.id)}
              provisioningStatus={provisioningMap[ev.id] || {}}
              handleInputChange={handleInputChange}
              handleToggleEventField={handleToggleEventField}
              handleResetCloudMedia={handleResetCloudMedia}
              handleSaveDepot={handleSaveDepot}
              handleSaveAlbum={handleSaveAlbum}
              handleAlignDepotToAlbum={handleAlignDepotToAlbum}
              handleProvisionFramaspace={handleProvisionFramaspace}
              setActiveQrModal={setActiveQrModal}
              onSwitchToVaral={onSwitchToVaral}
            />
          ))}
        </div>
      )}

      {/* Modale d'affichage / impression QR Code si ouverte */}
      {activeQrModal && (
        <StudioPhotoQrPrintModal
          qrUrl={activeQrModal.qrUrl}
          eventTitle={activeQrModal.eventTitle}
          eventDate={activeQrModal.eventDate}
          eventLocation={activeQrModal.eventLocation}
          mode={activeQrModal.mode}
          onClose={() => setActiveQrModal(null)}
        />
      )}
    </div>
  );
}
