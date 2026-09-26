import React, { useEffect } from 'react';

/**
 * Boutons de navigation Flèche Gauche (◀) et Flèche Droite (▶)
 * pour parcourir successivement les fiches morceaux du Répertoire.
 *
 * Implémente le positionnement fixe au centre vertical de l'écran (50% de hauteur),
 * situé à l'extérieur de la modale sur PC ("en dehors de la fiche"),
 * immuable quel que soit le défilement vertical haut/bas de la fiche.
 *
 * @param {Object} props
 * @param {Array} props.piecesList - Liste ordonnée des morceaux du répertoire
 * @param {Object} props.currentPiece - Morceau actuellement affiché
 * @param {Function} props.onNavigate - Callback de navigation recevant le nouveau morceau ciblé
 * @param {boolean} [props.disabled=false] - Désactive les clics pendant la sauvegarde
 */
export default function RepertoireModalNavArrows({
  piecesList = [],
  currentPiece = null,
  onNavigate,
  disabled = false
}) {
  if (!piecesList || piecesList.length <= 1 || !currentPiece) {
    return null;
  }

  const currentIndex = piecesList.findIndex((p) => p.id === currentPiece.id);
  if (currentIndex === -1) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < piecesList.length - 1;

  const prevPiece = hasPrev ? piecesList[currentIndex - 1] : null;
  const nextPiece = hasNext ? piecesList[currentIndex + 1] : null;

  // Gestion des raccourcis clavier Flèche Gauche (←) et Flèche Droite (→)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer si le focus est actuellement dans un champ de saisie de texte
      const target = e.target;
      const tag = (target?.tagName || '').toLowerCase();
      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        Boolean(target?.isContentEditable);

      if (isInput || disabled) return;

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onNavigate(prevPiece);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNavigate(nextPiece);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, prevPiece, nextPiece, onNavigate, disabled]);

  return (
    <>
      {/* Flèche Gauche : Morceau précédent */}
      <div className="fixed left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-60 pointer-events-auto">
        <button
          type="button"
          disabled={!hasPrev || disabled}
          onClick={() => hasPrev && onNavigate(prevPiece)}
          className={`group relative flex items-center justify-center w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-encre-noire transition-all select-none ${
            hasPrev && !disabled
              ? 'bg-[#fdfaf2] text-encre-noire hover:bg-amber-100 hover:text-cordel-wood shadow-[3px_3px_0px_0px_#181716] hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-stone-200/50 text-stone-400 border-stone-400/40 cursor-not-allowed opacity-35 shadow-none'
          }`}
          title={
            hasPrev
              ? `Morceau précédent : « ${prevPiece.titre} » (Touche Flèche Gauche ←)`
              : 'Premier morceau du classeur'
          }
          aria-label="Morceau précédent"
        >
          <span className="text-lg md:text-xl font-black">◀</span>

          {/* Infobulle contextuelle au survol sur écran moyen/large */}
          {hasPrev && (
            <div className="hidden md:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 flex-col items-start p-2.5 bg-[#fdfaf2] border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[3px_3px_0px_0px_#181716] whitespace-nowrap pointer-events-none z-70 animate-fade-in text-left">
              <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
                Précédent ({currentIndex} / {piecesList.length})
              </span>
              <span className="text-xs font-black text-encre-noire max-w-[220px] truncate">
                {prevPiece.titre}
              </span>
              <span className="text-[8.5px] text-stone-500 italic mt-0.5">
                Raccourci : touche ←
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Flèche Droite : Morceau suivant */}
      <div className="fixed right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-60 pointer-events-auto">
        <button
          type="button"
          disabled={!hasNext || disabled}
          onClick={() => hasNext && onNavigate(nextPiece)}
          className={`group relative flex items-center justify-center w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-encre-noire transition-all select-none ${
            hasNext && !disabled
              ? 'bg-[#fdfaf2] text-encre-noire hover:bg-amber-100 hover:text-cordel-wood shadow-[3px_3px_0px_0px_#181716] hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-stone-200/50 text-stone-400 border-stone-400/40 cursor-not-allowed opacity-35 shadow-none'
          }`}
          title={
            hasNext
              ? `Morceau suivant : « ${nextPiece.titre} » (Touche Flèche Droite →)`
              : 'Dernier morceau du classeur'
          }
          aria-label="Morceau suivant"
        >
          <span className="text-lg md:text-xl font-black">▶</span>

          {/* Infobulle contextuelle au survol sur écran moyen/large */}
          {hasNext && (
            <div className="hidden md:group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 flex-col items-end p-2.5 bg-[#fdfaf2] border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[3px_3px_0px_0px_#181716] whitespace-nowrap pointer-events-none z-70 animate-fade-in text-right">
              <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
                Suivant ({currentIndex + 2} / {piecesList.length})
              </span>
              <span className="text-xs font-black text-encre-noire max-w-[220px] truncate">
                {nextPiece.titre}
              </span>
              <span className="text-[8.5px] text-stone-500 italic mt-0.5">
                Raccourci : touche →
              </span>
            </div>
          )}
        </button>
      </div>
    </>
  );
}
