import React from 'react';
import { createPortal } from 'react-dom';
import { useModalEscape } from '../../hooks/useModalEscape';
import { useTranslation } from '../LanguageContext';

/**
 * Composant : CinemaVideoModal
 *
 * Modale plein écran façon salle obscure / lightbox vidéo pour la vidéo « À la une ».
 * Permet d'afficher en très grand aussi bien les vidéos 16:9 paysage sur PC
 * que les vidéos filmées à la verticale (portrait) sur toute la hauteur d'un smartphone.
 *
 * @param {boolean} isOpen - État d'ouverture de la modale Cinéma
 * @param {Function} onClose - Callback de fermeture
 * @param {string} videoId - Identifiant YouTube de la vidéo
 * @param {string} [url] - URL YouTube externe complète
 * @param {string} [title] - Titre de la vidéo affiché en barre supérieure
 */
export default function CinemaVideoModal({
  isOpen,
  onClose,
  videoId,
  url,
  title = 'Vidéo à la une'
}) {
  const { t } = useTranslation();
  // Fermeture au clavier via la touche Échap
  useModalEscape(onClose, isOpen);

  if (!isOpen || !videoId || typeof document === 'undefined') {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  const externalYoutubeUrl = url || `https://www.youtube.com/watch?v=${videoId}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mode Cinéma : ${title}`}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-fadeIn"
    >
      {/* Barre supérieure de la modale */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 pb-2 border-b border-white/15 shrink-0"
      >
        {/* Gauche : Badge Mode Cinéma + Titre de la vidéo */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded bg-[var(--color-cordel-ocre,#c05621)] text-white border border-amber-300/60 shadow-sm shrink-0">
            🎬 {t('dashboard.btnCinemaMode')}
          </span>
          <h2
            className="text-[#f4ecd8] font-bold text-xs sm:text-base uppercase tracking-wide truncate"
            title={title}
          >
            {title}
          </h2>
        </div>

        {/* Droite : Lien externe YouTube + Bouton Fermer contrasté */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <a
            href={externalYoutubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 hover:text-white px-2 py-1 rounded border border-amber-300/30 hover:border-white/60 transition-colors"
            title="Ouvrir directement sur YouTube dans un nouvel onglet"
          >
            <span>YOUTUBE</span>
            <span>↗</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-amber-300 hover:bg-amber-200 text-[#181716] border-2 border-[#181716] rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.35)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1.5 transition-all"
            title={t('dashboard.btnExitCinemaMode')}
          >
            <span>✕</span>
            <span>{t('dashboard.btnExitCinemaMode')}</span>
          </button>
        </div>
      </div>

      {/* Conteneur central adaptatif Portrait & Paysage */}
      <div className="flex-1 flex items-center justify-center w-full my-2">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl h-[75dvh] sm:h-[82dvh] rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl bg-black relative"
        >
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Pied de modale discret : indication de fermeture intuitive */}
      <div className="w-full max-w-6xl mx-auto text-center shrink-0">
        <span className="text-[10px] font-semibold text-white/50 tracking-wide">
          Touchez l&apos;arrière-plan noir, appuyez sur Échap ou cliquez sur « ✕ FERMER » pour quitter la salle obscure.
        </span>
      </div>
    </div>,
    document.body
  );
}

