import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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
  const [filterType, setFilterType] = useState('all'); // 'all', 'prestation', 'past', 'future'
  
  // États de saisie locale par événement { [eventId]: { lienDepotMedias, albumPhotosUrl, savingDepot, savingAlbum, savedDepot, savedAlbum } }
  const [rowStates, setRowStates] = useState({});

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
      // A. Mise à jour de l'événement dans 'events'
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        albumPhotosUrl: cleanUrl
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

      if (cleanUrl) {
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
        // Si l'URL a été vidée, supprimer le document associé s'il existait
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

  // 5. Filtrage des événements
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

      // Filtre de type / chronologie
      const evDate = (ev.dateDebut || ev.date || '').split('T')[0];
      if (filterType === 'prestation') {
        return ev.type === 'prestation' || ev.isPrestation;
      } else if (filterType === 'past') {
        return evDate && evDate < todayStr;
      } else if (filterType === 'future') {
        return evDate && evDate >= todayStr;
      }

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
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            Toutes les dates ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('prestation')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'prestation'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            🎭 Prestations
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
            onClick={() => setFilterType('past')}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
              filterType === 'past'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/40 hover:border-encre-noire'
            }`}
          >
            🌾 Passées
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

                  {/* Badges de statut récapitulatifs */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
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
                  </div>
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
                          className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-emerald-950 bg-[#2d6a4f] text-white hover:bg-emerald-800 cursor-pointer shrink-0 shadow-xs"
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
                          className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-emerald-950 bg-[#2d6a4f] text-white hover:bg-emerald-800 cursor-pointer shrink-0 shadow-xs"
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
