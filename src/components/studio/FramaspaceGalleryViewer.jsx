import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

/**
 * Composant : FramaspaceGalleryViewer
 * 
 * Galerie native interactive pour les albums photos de prestations hébergés sur Framaspace (Nextcloud).
 * Interroge l'API WebDAV public via Cloud Function, affiche les clichés en mosaïque
 * et permet une consultation grand format via une Lightbox réactive (images HD et vidéos HTML5).
 * 
 * @param {string} albumUrl URL publique de partage de l'album Framaspace
 * @param {string} eventId Identifiant de l'événement lié
 * @param {string} groupId Identifiant de l'association
 * @param {string} title Titre de l'album pour l'en-tête et l'accessibilité
 */
export default function FramaspaceGalleryViewer({
  albumUrl,
  eventId,
  groupId,
  title = "Album Photos"
}) {
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);

  // Chargement des médias depuis Framaspace WebDAV via Cloud Function
  useEffect(() => {
    let isMounted = true;

    async function fetchMedia() {
      if (!albumUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const getMediaFn = httpsCallable(functions, 'getFramaspaceAlbumMedia');
        const res = await getMediaFn({
          albumUrl: albumUrl.trim(),
          eventId,
          groupId
        });

        if (!isMounted) return;

        const data = res?.data || {};
        if (data.success && Array.isArray(data.items)) {
          setMediaItems(data.items);
        } else {
          setError(data.error || "Aucun cliché accessible dans cet album.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("FramaspaceGalleryViewer - Erreur récupération médias :", err);
        setError("Impossible de charger la galerie. Vous pouvez consulter l'album directement sur Framaspace.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [albumUrl, eventId, groupId]);

  // Navigation Lightbox : Précédente
  const handlePrevMedia = useCallback((e) => {
    if (e) e.stopPropagation();
    if (mediaItems.length <= 1) return;
    setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  }, [mediaItems.length]);

  // Navigation Lightbox : Suivante
  const handleNextMedia = useCallback((e) => {
    if (e) e.stopPropagation();
    if (mediaItems.length <= 1) return;
    setSelectedMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  }, [mediaItems.length]);

  // Fermeture de la Lightbox
  const handleCloseLightbox = useCallback((e) => {
    if (e) e.stopPropagation();
    setSelectedMediaIndex(null);
  }, []);

  // Gestion des raccourcis clavier dans la Lightbox (Échap, Flèches Gauche / Droite)
  useEffect(() => {
    if (selectedMediaIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMediaIndex, handleCloseLightbox, handlePrevMedia, handleNextMedia]);

  const currentMedia = selectedMediaIndex !== null ? mediaItems[selectedMediaIndex] : null;

  return (
    <div className="w-full flex flex-col gap-3 text-left select-none">
      {/* Barre d'en-tête de la galerie */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📸</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {loading ? "Chargement des clichés..." : `${mediaItems.length} souvenir(s) multimédia`}
          </span>
        </div>

        {albumUrl && (
          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border border-encre-noire bg-cordel-bg hover:bg-amber-100 text-encre-noire flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Ouvrir l'album complet dans un nouvel onglet sécurisé"
          >
            <span>↗ Ouvrir sur Framaspace</span>
          </a>
        )}
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 bg-cordel-bg-light/60 rounded border border-encre-noire/15 animate-pulse">
          <span className="text-3xl animate-spin">⏳</span>
          <p className="text-xs font-bold text-encre-noire/70">
            Connexion au dossier Framaspace et récupération des clichés...
          </p>
        </div>
      )}

      {/* État d'erreur avec secours externe */}
      {!loading && error && mediaItems.length === 0 && (
        <div className="p-6 bg-amber-50/80 border-2 border-dashed border-cordel-master-dark/30 rounded-[6px_10px_4px_8px] text-center flex flex-col items-center gap-3">
          <span className="text-3xl">📂</span>
          <p className="text-xs font-bold text-encre-noire/80 max-w-md">
            {error}
          </p>
          {albumUrl && (
            <a
              href={albumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Consulter l'album en ligne</span>
              <span>➜</span>
            </a>
          )}
        </div>
      )}

      {/* État vide si aucun média trouvé */}
      {!loading && !error && mediaItems.length === 0 && (
        <div className="py-10 text-center bg-cordel-bg-light/50 border border-dashed border-encre-noire/20 rounded p-6 flex flex-col items-center gap-2">
          <span className="text-3xl">🌾</span>
          <p className="text-xs font-bold text-encre-noire/70">
            Cet album est encore vide pour le moment. Les photos et vidéos y apparaîtront dès leur téléversement.
          </p>
        </div>
      )}

      {/* Mosaïque responsive avec conteneur de défilement isolé et cellules div aspect-square */}
      {!loading && mediaItems.length > 0 && (
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaItems.map((item, idx) => {
              const isVideo = item.type === 'video';

              return (
                <div
                  key={item.id || idx}
                  className="relative aspect-square w-full overflow-hidden rounded-md border border-[var(--color-cordel-encre,#181716)] bg-[var(--color-cordel-kraft-sombre,#e2d6b5)] shadow-[2px_2px_0px_0px_#181716]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMediaIndex(idx)}
                    className="absolute inset-0 w-full h-full p-0 block overflow-hidden cursor-pointer group focus:outline-hidden"
                    aria-label={item.name}
                  >
                    {isVideo ? (
                      <div className="absolute inset-0 w-full h-full bg-neutral-900">
                        <video
                          src={item.url}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                          className="block opacity-85 group-hover:opacity-100 transition-opacity"
                          preload="metadata"
                          muted
                          playsInline
                          onError={(e) => {
                            if (item.directDavUrl && e.target.src !== item.directDavUrl) {
                              e.target.src = item.directDavUrl;
                            }
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-10 h-10 rounded-full bg-black/60 border border-white/80 flex items-center justify-center text-white text-base shadow-md font-black pl-0.5">
                            ▶
                          </span>
                        </span>
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono uppercase pointer-events-none">
                          Vidéo
                        </span>
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailUrl || item.url}
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
                        className="block transition-transform duration-200 group-hover:scale-105"
                      />
                    )}

                    {/* Légende discrète au survol */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white pointer-events-none">
                      <span className="text-[9px] font-bold truncate max-w-[80%]">
                        {item.name}
                      </span>
                      <span className="text-[9px] opacity-75">
                        🔍
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISIONNEUSE LIGHTBOX PLEIN ÉCRAN
          ========================================================================= */}
      {selectedMediaIndex !== null && currentMedia && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 animate-fadeIn select-none"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseLightbox}
        >
          {/* Barre d'actions supérieure */}
          <div
            className="w-full flex items-center justify-between text-white pb-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate max-w-[70%]">
              <span className="text-base">{currentMedia.type === 'video' ? '🎥' : '📷'}</span>
              <span className="text-xs sm:text-sm font-black truncate">
                {currentMedia.name}
              </span>
              <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                ({selectedMediaIndex + 1} / {mediaItems.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Téléchargement direct individuel */}
              <a
                href={currentMedia.url}
                download={currentMedia.name}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded bg-stone-800 hover:bg-stone-700 text-white border border-stone-600 transition-all flex items-center gap-1.5"
                title="Télécharger ce fichier en haute qualité"
              >
                <span>📥</span>
                <span className="hidden sm:inline">Télécharger</span>
              </a>

              {/* Bouton Fermer */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-base font-black flex items-center justify-center transition-all cursor-pointer"
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Zone d'affichage central du média (Image HD ou Lecteur Vidéo) */}
          <div
            className="relative flex-1 w-full flex items-center justify-center p-1 sm:p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Flèche Précédente */}
            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={handlePrevMedia}
                className="absolute left-2 sm:left-4 z-20 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white text-xl font-black flex items-center justify-center border border-white/30 transition-all cursor-pointer active:scale-95 shadow-lg"
                title="Précédente (Flèche gauche)"
              >
                ‹
              </button>
            )}

            {/* Contenu principal */}
            <div className="max-w-full max-h-full flex items-center justify-center">
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  onError={(e) => {
                    if (currentMedia.directDavUrl && e.target.src !== currentMedia.directDavUrl) {
                      e.target.src = currentMedia.directDavUrl;
                    }
                  }}
                  className="max-h-[78vh] max-w-[92vw] rounded shadow-2xl bg-black"
                >
                  Votre navigateur ne supporte pas la lecture de cette vidéo.
                </video>
              ) : (
                <img
                  src={currentMedia.previewUrl || currentMedia.url}
                  alt={currentMedia.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const fallback = currentMedia.pathPreviewHdUrl || currentMedia.pathPreviewUrl || currentMedia.directDavUrl || currentMedia.url;
                    if (fallback && e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                  className="max-h-[78vh] max-w-[92vw] object-contain rounded shadow-2xl"
                />
              )}
            </div>

            {/* Bouton Flèche Suivante */}
            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={handleNextMedia}
                className="absolute right-2 sm:right-4 z-20 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white text-xl font-black flex items-center justify-center border border-white/30 transition-all cursor-pointer active:scale-95 shadow-lg"
                title="Suivante (Flèche droite)"
              >
                ›
              </button>
            )}
          </div>

          {/* Pied de la Lightbox : Indicateurs et astuces */}
          <div
            className="w-full flex items-center justify-between text-stone-400 text-[10px] pt-2 border-t border-white/10 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate">
              {title}
            </span>
            <span className="hidden sm:inline italic">
              Astuce : Utilisez les touches ◀ et ▶ du clavier pour naviguer, et Échap pour quitter.
            </span>
            <span className="font-mono">
              {selectedMediaIndex + 1} / {mediaItems.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
