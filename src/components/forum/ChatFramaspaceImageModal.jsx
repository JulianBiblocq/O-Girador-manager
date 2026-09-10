import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import CordelButton from '../CordelButton';

/**
 * Composant : ChatFramaspaceImageModal
 * 
 * Modale de sélection et de partage d'images pour les discussions privées et de groupes.
 * Propose exclusivement les photos hébergées sur le cloud externe de l'association (Framaspace / Nextcloud).
 * Garantit 0 Mo consommé sur Firebase Storage.
 * 
 * @param {boolean} isOpen - Indique si la modale est ouverte
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} onSelectImage - Callback appelé lors du partage : ({ imageUrl, thumbnailUrl, mediaName, caption })
 * @param {string} groupId - Identifiant de l'association
 */
export default function ChatFramaspaceImageModal({
  isOpen,
  onClose,
  onSelectImage,
  groupId
}) {
  // Liste des albums disponibles (issus des événements et du Cloud racine)
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumUrl, setSelectedAlbumUrl] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  // Médias de l'album sélectionné
  const [mediaItems, setMediaItems] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [errorMedia, setErrorMedia] = useState(null);

  // Média actuellement sélectionné par l'utilisateur
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [caption, setCaption] = useState('');

  // 1. Chargement des événements avec albums et du Cloud racine de l'association
  useEffect(() => {
    if (!isOpen || !groupId) return;

    let isMounted = true;
    async function fetchAlbums() {
      setLoadingAlbums(true);
      const albumList = [];

      try {
        // A. Vérifier le Cloud racine de l'association
        const assocRef = doc(db, 'associations', groupId);
        const assocSnap = await getDoc(assocRef);
        if (assocSnap.exists()) {
          const aData = assocSnap.data();
          const rootUrl = aData.cloudRootUrl || aData.cloudStorageUrl;
          if (rootUrl && rootUrl.includes('/s/')) {
            albumList.push({
              id: 'root_cloud',
              title: '📁 Dossier Cloud racine de l\'association',
              url: rootUrl,
              eventId: null
            });
          }
        }

        // B. Récupérer les événements avec album photos
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('groupId', '==', groupId));
        const snap = await getDocs(q);

        snap.forEach((d) => {
          const ev = d.data();
          const albumUrl = ev.albumPhotosUrl || ev.lienDepotMedias;
          if (albumUrl && (albumUrl.includes('/s/') || ev.framaspaceFolder)) {
            albumList.push({
              id: d.id,
              title: ev.nom || ev.title || 'Événement',
              url: albumUrl,
              eventId: d.id,
              date: ev.dateDebut || ev.date || ''
            });
          }
        });

        // Tri par date décroissante
        albumList.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });

        if (isMounted) {
          setAlbums(albumList);
          if (albumList.length > 0) {
            setSelectedAlbumUrl(albumList[0].url);
            setSelectedEventId(albumList[0].eventId || '');
          }
        }
      } catch (err) {
        console.error("ChatFramaspaceImageModal - Erreur chargement albums :", err);
      } finally {
        if (isMounted) setLoadingAlbums(false);
      }
    }

    fetchAlbums();
    return () => {
      isMounted = false;
    };
  }, [isOpen, groupId]);

  // 2. Chargement des photos lorsque l'album sélectionné change
  useEffect(() => {
    if (!isOpen || (!selectedAlbumUrl && !customUrl)) {
      setMediaItems([]);
      return;
    }

    let isMounted = true;
    const targetUrl = (customUrl.trim() || selectedAlbumUrl || '').trim();

    async function loadAlbumMedia() {
      if (!targetUrl) return;
      setLoadingMedia(true);
      setErrorMedia(null);
      setSelectedMedia(null);

      try {
        const getMediaFn = httpsCallable(functions, 'getFramaspaceAlbumMedia');
        const res = await getMediaFn({
          albumUrl: targetUrl,
          eventId: selectedEventId || null,
          groupId
        });

        if (!isMounted) return;

        const data = res?.data || {};
        if (data.success && Array.isArray(data.items)) {
          // Ne conserver que les images pour le chat
          const imagesOnly = data.items.filter(item => !item.isVideo && item.type !== 'video');
          setMediaItems(imagesOnly);
          if (imagesOnly.length === 0) {
            setErrorMedia("Aucune photo trouvée dans cet album.");
          }
        } else {
          setErrorMedia(data.error || "Impossible d'accéder aux clichés de cet album.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("ChatFramaspaceImageModal - Erreur récupération clichés :", err);
        setErrorMedia("Échec de connexion à l'album Framaspace.");
      } finally {
        if (isMounted) setLoadingMedia(false);
      }
    }

    loadAlbumMedia();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedAlbumUrl, selectedEventId, customUrl, groupId]);

  if (!isOpen) return null;

  // Validation et envoi de la photo choisie
  const handleConfirmSend = () => {
    if (!selectedMedia || !onSelectImage) return;

    onSelectImage({
      imageUrl: selectedMedia.previewUrl || selectedMedia.url,
      thumbnailUrl: selectedMedia.thumbnailUrl || selectedMedia.previewUrl || selectedMedia.url,
      mediaName: selectedMedia.name || 'photo.jpg',
      caption: caption.trim()
    });

    onClose();
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none outline-none"
    >
      <div className="max-w-2xl w-full bg-cordel-bg text-left relative rounded-[8px_12px_10px_9px] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête Cordel de la modale */}
        <div className="p-3.5 sm:p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex items-center justify-between bg-cordel-bg shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">📸</span>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wide text-cordel-wood truncate">
                Partager une photo du Cloud Framaspace
              </h3>
              <p className="text-[10px] text-cordel-master-dark/75 font-semibold mt-0.5 truncate">
                Sélectionnez une photo parmi les albums de la troupe (0 Mo stocké sur Firebase).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer shrink-0 ml-2"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Barre de sélection de l'album */}
        <div className="p-3 bg-white/60 border-b border-cordel-master-dark/20 flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-cordel-wood shrink-0">
            Album :
          </label>

          {loadingAlbums ? (
            <span className="text-xs italic text-cordel-master-dark/70 animate-pulse">
              Recherche des albums de la troupe...
            </span>
          ) : albums.length > 0 ? (
            <select
              value={selectedAlbumUrl}
              onChange={(e) => {
                const found = albums.find(a => a.url === e.target.value);
                setSelectedAlbumUrl(e.target.value);
                setSelectedEventId(found?.eventId || '');
                setCustomUrl('');
              }}
              className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-xs"
            >
              {albums.map((alb) => (
                <option key={alb.id} value={alb.url}>
                  {alb.title} {alb.date ? `(${alb.date})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Collez ici le lien de partage Framaspace (https://mon-asso.framaspace.org/s/...)"
              className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-xs"
            />
          )}
        </div>

        {/* Grille des photos de l'album */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 custom-scrollbar min-h-[220px]">
          {loadingMedia ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-cordel-master-dark/60">
              <span className="text-3xl animate-spin">⏳</span>
              <span className="text-xs font-bold uppercase tracking-wider">Chargement des clichés Framaspace...</span>
            </div>
          ) : errorMedia ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <span className="text-2xl">📁</span>
              <p className="text-xs font-bold text-[var(--color-cordel-ocre,#c05621)]">
                {errorMedia}
              </p>
              <p className="text-[10px] text-cordel-master-dark/70 max-w-sm">
                Assurez-vous que le dossier Framaspace est public ou provisionné pour cet événement.
              </p>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-cordel-master-dark/60">
              <span className="text-2xl mb-1">🖼️</span>
              <span className="text-xs font-semibold">Aucun cliché disponible dans cet album.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {mediaItems.map((item) => {
                const isSelected = selectedMedia?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMedia(isSelected ? null : item)}
                    className={`relative aspect-square w-full rounded overflow-hidden border-2 transition-all cursor-pointer group bg-neutral-200 ${
                      isSelected
                        ? 'border-[var(--color-cordel-vert,#2d6a4f)] ring-2 ring-[var(--color-cordel-vert,#2d6a4f)] shadow-[2px_2px_0px_0px_#181716] scale-[0.98]'
                        : 'border-encre-noire/30 hover:border-encre-noire hover:shadow-xs'
                    }`}
                  >
                    <img
                      src={item.thumbnailUrl || item.previewUrl || item.url}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                      onError={(e) => {
                        const fallback = item.pathPreviewUrl || item.previewUrl || item.directDavUrl || item.url;
                        if (fallback && e.target.src !== fallback) {
                          e.target.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200 block"
                    />

                    {/* Badge de sélection vert */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)] border border-white text-white flex items-center justify-center text-xs font-black shadow-sm">
                        ✓
                      </div>
                    )}

                    {/* Nom en surimpression au survol */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de modale : Légende et validation */}
        <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg shrink-0 flex flex-col gap-2.5">
          {selectedMedia && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs">
              <span className="font-bold shrink-0">Photo sélectionnée :</span>
              <span className="truncate font-mono text-[11px] flex-1">{selectedMedia.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajouter une légende ou un commentaire (optionnel)..."
              disabled={!selectedMedia}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood disabled:opacity-50 shadow-inner"
            />

            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-2 shrink-0"
            >
              Annuler
            </CordelButton>

            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleConfirmSend}
              disabled={!selectedMedia}
              className="text-[10px] font-black uppercase tracking-wider px-4 py-2 shadow-[2px_2px_0px_0px_#181716] shrink-0"
            >
              📤 Partager la photo
            </CordelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
