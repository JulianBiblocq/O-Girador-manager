import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { getEmbedVideoUrl } from '../../utils/videoUtils';

/**
 * Modale de lecture vidéo Cordel pour les pièces du répertoire.
 * Prise en charge universelle des flux YouTube, Vimeo, Google Drive et MP4 direct.
 *
 * @param {boolean} isOpen - État d'ouverture de la modale
 * @param {Function} onClose - Callback de fermeture
 * @param {Object|null} video - Objet vidéo { titre, url }
 */
export default function RepertoireVideoModal({ isOpen, onClose, video }) {
  if (!isOpen || !video || !video.url) return null;

  const { type, embedUrl } = getEmbedVideoUrl(video.url);

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn select-none">
      <CordelCard className="w-full max-w-3xl p-4 md:p-6 flex flex-col gap-3 bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[95vh] overflow-hidden text-left">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-wood/30 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">🎥</span>
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-encre-noire truncate">
              {video.titre || "Vidéo du morceau"}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase text-cordel-wood hover:underline inline-flex items-center gap-1 bg-amber-100/60 px-2 py-1 rounded border border-amber-300"
              title="Ouvrir dans un nouvel onglet"
            >
              <span>↗</span>
              <span className="hidden sm:inline">Plein écran externe</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 font-black text-lg px-1.5 py-0.5 cursor-pointer transition-colors"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Zone de lecture vidéo responsive 16:9 */}
        <div className="relative w-full aspect-video bg-black rounded-[4px_6px_3px_5px] border-2 border-encre-noire overflow-hidden shadow-inner flex items-center justify-center">
          {type === 'direct' ? (
            <video
              controls
              autoPlay
              playsInline
              src={embedUrl}
              className="w-full h-full object-contain"
            >
              Votre navigateur ne supporte pas la lecture directe de vidéos.
            </video>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.titre || "Lecteur vidéo"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-white text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-xs font-bold opacity-80">
                Impossible d'intégrer ce lien directement dans l'application.
              </p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-xs font-black rounded"
              >
                Ouvrir la vidéo dans un nouvel onglet ↗
              </a>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        <div className="flex justify-end pt-1">
          <CordelButton
            type="button"
            variant="default"
            useExtremeBorder={false}
            onClick={onClose}
            className="py-1 px-4 text-xs font-black uppercase tracking-wider bg-stone-100 hover:bg-stone-200"
          >
            Fermer
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
