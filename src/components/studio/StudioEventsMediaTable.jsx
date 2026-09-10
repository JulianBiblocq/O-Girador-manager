import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import StudioPhotoQrPrintModal from './StudioPhotoQrPrintModal';

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
export default function StudioEventsMediaTable({ groupId, canWrite = false }) {
  const { t } = useTranslation();

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
          savingDepot: false,
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
      setRowStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], savingDepot: false }
      }));
      alert("Erreur lors de l'enregistrement du lien de dépôt.");
    }
  }, [groupId, canWrite, rowStates]);

  // 4. Sauvegarde atomique du Lien d'Album Finalisé (albumPhotosUrl)
  // et synchronisation automatique avec la collection 'documents' (Varal Photos)
  const handleSaveAlbum = useCallback(async (event) => {
    if (!groupId || !canWrite) return;
    const eventId = event.id;
    const currentState = rowStates[eventId];
    if (!currentState) return;

    const cleanUrl = (currentState.albumPhotosUrl || '').trim();

    setRowStates((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], savingAlbum: true }
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
          savingAlbum: false,
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
      setRowStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], savingAlbum: false }
      }));
      alert("Erreur lors de la synchronisation de l'album avec le Varal.");
    }
  }, [groupId, canWrite, rowStates]);

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
          where('eventId', '==', ev.id),
          where('categoryId', '==', 'PhotosPrestations')
        );
        const existingSnap = await getDocs(qDoc);
        for (const d of existingSnap.docs) {
          await deleteDoc(doc(db, 'documents', d.id));
        }
      } else if (fieldName === 'publierSurVaral' && nextValue === true && ev.albumPhotosUrl) {
        // Si on active et qu'un album existe déjà, s'assurer que documents est synchronisé
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
            fileUrl: ev.albumPhotosUrl,
            categorie: 'PhotosPrestations',
            categoryId: 'PhotosPrestations',
            type: 'dossier_externe',
            dateAjout: ev.dateDebut || ev.date || new Date().toISOString(),
            description: `Album photos officiel de l'événement "${ev.titre || ''}" du ${new Date(ev.dateDebut || ev.date || Date.now()).toLocaleDateString('fr-FR')}.`
          });
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
    const confirmMsg = `Êtes-vous sûr de vouloir délier les dossiers Cloud et retirer "${ev.titre || 'cet événement'}" du Varal Photos ?`;
    if (!window.confirm(confirmMsg)) return;

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
        where('eventId', '==', ev.id),
        where('categoryId', '==', 'PhotosPrestations')
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

        // Mise à jour immédiate de l'affichage local si nouveaux liens reçus
        if (data.lienDepotMedias || data.albumPhotosUrl) {
          setRowStates((prev) => ({
            ...prev,
            [ev.id]: {
              ...prev[ev.id],
              lienDepotMedias: data.lienDepotMedias || prev[ev.id]?.lienDepotMedias || '',
              albumPhotosUrl: data.albumPhotosUrl || prev[ev.id]?.albumPhotosUrl || '',
              savedDepot: Boolean(data.lienDepotMedias),
              savedAlbum: Boolean(data.albumPhotosUrl)
            }
          }));
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
        <div className="flex flex-col gap-3.5">
          {filteredEvents.map((ev) => {
            const rowState = rowStates[ev.id] || {};
            const evDate = ev.dateDebut || ev.date || '';
            const isPresta = ev.type === 'prestation' || ev.isPrestation;
            const hasDepot = Boolean((ev.lienDepotMedias || '').trim());
            const hasAlbum = Boolean((ev.albumPhotosUrl || '').trim());

            return (
              <div
                key={ev.id}
                className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3"
              >
                {/* En-tête de la carte événement */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-encre-noire/30 bg-cordel-bg">
                      {isPresta ? '🎭 Prestation' : ev.type === 'repetition' ? '🥁 Répétition' : '📅 Sortie'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-cordel-wood">
                      {ev.titre || "Événement sans titre"}
                    </h4>
                    {evDate && (
                      <span className="text-[11px] font-bold text-encre-noire/75">
                        • 📅 {new Date(evDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {ev.lieu && (
                      <span className="text-[10.5px] font-medium text-encre-noire/60 truncate max-w-xs">
                        • 📍 {ev.lieu}
                      </span>
                    )}
                  </div>

                  {/* Badges de statut récapitulatifs & Actions Framaspace */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                    {ev.framaspaceFolder && (
                      <span 
                        className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono bg-amber-50 text-amber-950 border border-amber-300 truncate max-w-[160px]"
                        title={`Dossier Nextcloud : Prestations/${ev.framaspaceFolder}`}
                      >
                        📁 {ev.framaspaceFolder}
                      </span>
                    )}

                    {hasDepot && (
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-900 border border-emerald-800/40">
                        📸 Dépôt actif
                      </span>
                    )}
                    {hasAlbum && (
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-800/40">
                        🪢 Varal relié
                      </span>
                    )}

                    {/* Déclencheur manuel Framaspace Nextcloud */}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleProvisionFramaspace(ev)}
                        disabled={provisioningMap[ev.id]?.loading}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border-2 border-encre-noire transition-all cursor-pointer flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                          hasDepot
                            ? 'bg-cordel-bg text-encre-noire hover:bg-amber-100'
                            : 'bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 border-emerald-950'
                        }`}
                        title={
                          hasDepot
                            ? "Re-générer ou vérifier les dossiers et partages Framaspace"
                            : "Générer automatiquement le dossier Framaspace, le dépôt public et le lien album"
                        }
                      >
                        {provisioningMap[ev.id]?.loading ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Framaspace...</span>
                          </>
                        ) : provisioningMap[ev.id]?.success ? (
                          <>
                            <span>✓</span>
                            <span>Créé !</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>{hasDepot ? "Re-sync Cloud" : "Créer sur Framaspace"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message d'erreur éventuel sur le provisionnement Framaspace */}
                {provisioningMap[ev.id]?.error && (
                  <div className="text-[10px] font-bold text-[var(--color-cordel-rouge)] bg-red-50 p-2 rounded border border-red-300">
                    ⚠️ Erreur Framaspace : {provisioningMap[ev.id].error}
                  </div>
                )}

                {/* Bandeau de contrôle : Boîte à photos, Publication Varal & Nettoyage Cloud */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-[4px_6px_3px_5px] bg-amber-50/60 dark:bg-amber-950/20 border border-encre-noire/20">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Toggle 1 : Activer la boîte à photos / QR Code */}
                    <label className="flex items-center gap-2 cursor-pointer select-none" title="Conditionne la génération des QR-Codes de dépôt et le provisionnement automatique">
                      <input
                        type="checkbox"
                        checked={ev.activerRecolteMedias !== undefined ? Boolean(ev.activerRecolteMedias) : isPresta}
                        onChange={() => handleToggleEventField(ev, 'activerRecolteMedias', ev.activerRecolteMedias !== undefined ? Boolean(ev.activerRecolteMedias) : isPresta)}
                        disabled={!canWrite}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                        📸 Activer la boîte à photos / QR Code
                      </span>
                    </label>

                    {/* Toggle 2 : Afficher sur le Varal Photos */}
                    <label className="flex items-center gap-2 cursor-pointer select-none" title="Si désactivé, le livret ne sera pas visible sur la corde Photos du Varal">
                      <input
                        type="checkbox"
                        checked={Boolean(ev.publierSurVaral)}
                        onChange={() => handleToggleEventField(ev, 'publierSurVaral', Boolean(ev.publierSurVaral))}
                        disabled={!canWrite}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                        🪢 Afficher sur le Varal Photos
                      </span>
                    </label>
                  </div>

                  {/* Bouton d'action Délier / Réinitialiser Cloud */}
                  {canWrite && (hasDepot || hasAlbum || ev.framaspaceFolder) && (
                    <button
                      type="button"
                      onClick={() => handleResetCloudMedia(ev)}
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border border-[var(--color-cordel-rouge)] text-[var(--color-cordel-rouge)] bg-white hover:bg-red-50 cursor-pointer flex items-center gap-1 shadow-xs transition-all active:scale-95 shrink-0"
                      title="Vider les liens Cloud de cet événement et supprimer son livret du Varal Photos"
                    >
                      <span>🗑️</span>
                      <span>Délier / Réinitialiser Cloud</span>
                    </button>
                  )}
                </div>

                {/* Formulaires d'édition directe des liens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* BLOC 1 : Lien de dépôt public & QR-Code */}
                  <div className="flex flex-col gap-1.5 p-3 bg-cordel-bg/60 border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center gap-1">
                        <span>📸 1. Dossier de dépôt public (Framaspace, Drive...)</span>
                      </label>
                      {hasDepot && (
                        <button
                          type="button"
                          onClick={() => setActiveQrModal({
                            qrUrl: ev.lienDepotMedias,
                            eventTitle: ev.titre,
                            eventDate: evDate,
                            eventLocation: ev.lieu,
                            mode: 'depot'
                          })}
                          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-encre-noire bg-amber-300 hover:bg-amber-200 text-encre-noire cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Afficher et imprimer le QR-Code de récolte"
                        >
                          <span>📱 QR-Code</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={rowState.lienDepotMedias || ''}
                        onChange={(e) => handleInputChange(ev.id, 'lienDepotMedias', e.target.value)}
                        disabled={!canWrite || rowState.savingDepot}
                        placeholder="https://mon-asso.framaspace.org/s/... (File drop)"
                        className="theme-input flex-1 px-2 py-1 text-xs font-bold rounded border border-encre-noire bg-white text-encre-noire"
                      />

                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => handleSaveDepot(ev.id)}
                          disabled={rowState.savingDepot}
                          className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-emerald-950 bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 cursor-pointer shrink-0 shadow-xs"
                        >
                          {rowState.savingDepot ? '⏳' : rowState.savedDepot ? '✓' : 'Sauver'}
                        </button>
                      )}

                      {hasDepot && (
                        <button
                          type="button"
                          onClick={() => window.open(ev.lienDepotMedias, '_blank', 'noopener,noreferrer')}
                          className="p-1 rounded border border-encre-noire/40 hover:border-encre-noire text-encre-noire text-xs cursor-pointer shrink-0"
                          title="Tester le lien dans un nouvel onglet"
                        >
                          ↗
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-encre-noire/60 font-medium">
                      Ce lien alimente automatiquement le QR-Code et le bouton de dépôt sur la fiche événement.
                    </span>
                  </div>

                  {/* BLOC 2 : Lien de l'album finalisé & Synchronisation Varal */}
                  <div className="flex flex-col gap-1.5 p-3 bg-cordel-bg/60 border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center gap-1">
                        <span>🪢 2. Album photos finalisé (Sync Varal Photos)</span>
                      </label>
                      {hasAlbum && (
                        <button
                          type="button"
                          onClick={() => setActiveQrModal({
                            qrUrl: ev.albumPhotosUrl,
                            eventTitle: ev.titre,
                            eventDate: evDate,
                            eventLocation: ev.lieu,
                            mode: 'album'
                          })}
                          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-encre-noire bg-amber-300 hover:bg-amber-200 text-encre-noire cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Afficher et imprimer le QR-Code de l'album"
                        >
                          <span>📱 QR-Code</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={rowState.albumPhotosUrl || ''}
                        onChange={(e) => handleInputChange(ev.id, 'albumPhotosUrl', e.target.value)}
                        disabled={!canWrite || rowState.savingAlbum}
                        placeholder="https://mon-asso.framaspace.org/s/... ou Drive"
                        className="theme-input flex-1 px-2 py-1 text-xs font-bold rounded border border-encre-noire bg-white text-encre-noire"
                      />

                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => handleSaveAlbum(ev)}
                          disabled={rowState.savingAlbum}
                          className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-emerald-950 bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 cursor-pointer shrink-0 shadow-xs"
                        >
                          {rowState.savingAlbum ? '⏳' : rowState.savedAlbum ? '✓ Sync' : 'Sync Varal'}
                        </button>
                      )}

                      {hasAlbum && (
                        <button
                          type="button"
                          onClick={() => window.open(ev.albumPhotosUrl, '_blank', 'noopener,noreferrer')}
                          className="p-1 rounded border border-encre-noire/40 hover:border-encre-noire text-encre-noire text-xs cursor-pointer shrink-0"
                          title="Tester le lien de l'album dans un nouvel onglet"
                        >
                          ↗
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-encre-noire/60 font-medium">
                      Génère un livret Cordel sur la corde « Photos Prestations » du Varal. Vider le champ le retire du Varal.
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
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
