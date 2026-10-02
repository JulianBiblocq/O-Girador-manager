import React, { useState, useEffect } from 'react';

/**
 * Modale Plein Écran / Zoom pour la consultation mobile du plan de scène
 * Permet d'afficher la scène sans contrainte d'encart ni de hauteur,
 * avec option de zoom agrandi à la demande.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Indique si la modale est affichée
 * @param {Function} props.onClose Fonction de fermeture
 * @param {string} props.eventTitle Titre de l'événement
 * @param {React.ReactNode} props.children Contenu complet de la scène à afficher
 */
export default function StageLayoutFullscreenModal({
  isOpen,
  onClose,
  eventTitle,
  children
}) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fermeture par touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquer le scroll d'arrière-plan quand la modale est active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setZoomLevel(1);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.35 : 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between p-2 sm:p-4 animate-fadeIn select-none"
    >
      {/* Barre supérieure d'actions */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between bg-cordel-bg-light dark:bg-neutral-900 border-2 border-encre-noire rounded-lg px-3 py-2 shadow-[2px_2px_0px_0px_#181716] mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg">🎭</span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-cordel-wood uppercase tracking-wider truncate">
              {eventTitle || 'Plan de Scène'}
            </span>
            <span className="text-[9px] font-bold text-encre-noire/70">
              Vue Agrandie & Plein Écran
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bouton de bascule de zoom */}
          <button
            type="button"
            onClick={toggleZoom}
            className="text-[10px] font-black uppercase px-2.5 py-1 rounded border border-encre-noire bg-cordel-ocre text-encre-noire shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer hover:brightness-95 flex items-center gap-1"
            title="Agrandir / Réduire la taille de la scène"
          >
            <span>{zoomLevel > 1 ? '🔍 Normal (1x)' : '🔎 Zoom (+)'}</span>
          </button>

          {/* Bouton de fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-black uppercase px-2.5 py-1 rounded border border-encre-noire bg-neutral-200 hover:bg-neutral-300 text-encre-noire shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
            title="Fermer (ou touche Échap)"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>
      </div>

      {/* Conteneur défilable contenant la scène */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-auto bg-cordel-bg-light/95 dark:bg-neutral-900/95 border-2 border-encre-noire rounded-lg p-3 sm:p-5 shadow-[3px_3px_0px_0px_#181716] flex flex-col items-center justify-start">
        <div
          className="w-full flex flex-col items-center transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {children}
        </div>
      </div>

      {/* Barre inférieure de confort pour smartphone */}
      <div className="w-full max-w-2xl mx-auto pt-2 flex justify-center shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-black uppercase tracking-wider px-5 py-1.5 rounded-full border border-encre-noire bg-white dark:bg-neutral-800 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
        >
          ✕ Fermer le plein écran
        </button>
      </div>
    </div>
  );
}
