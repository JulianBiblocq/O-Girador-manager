import React from 'react';

/**
 * Case individuelle représentant une mesure sur la timeline du conducteur.
 * Affiche soit un repère discret (mesure neutre),
 * soit un emplacement interactif à combler avec retour visuel d'état et de correction.
 *
 * @param {Object} props
 * @param {number} props.measure - Numéro de mesure (1-indexé)
 * @param {Object|null} props.slot - Données de l'emplacement si signal attendu
 * @param {Object|null} props.assignedSignal - Signal actuellement posé par l'élève
 * @param {boolean|null} props.validation - État de correction (true = bon, false = faux, null = neutre)
 * @param {boolean} props.isCurrentPlayhead - Mesure actuellement jouée par l'audio
 * @param {Function} props.onClickSlot - Clic sur la case pour ouvrir le sélecteur
 */
export default function ConductorMeasureSlot({
  measure,
  slot = null,
  assignedSignal = null,
  validation = null,
  isCurrentPlayhead = false,
  onClickSlot
}) {
  const hasSignalTarget = Boolean(slot);

  // Cas 1 : Mesure neutre sans annonce de signal
  if (!hasSignalTarget) {
    return (
      <div
        className={`flex flex-col items-center justify-between w-11 h-20 py-1.5 px-0.5 rounded border transition-all shrink-0 select-none ${
          isCurrentPlayhead
            ? 'bg-amber-100/90 border-amber-500 shadow-xs'
            : 'bg-[#fdfaf2]/60 border-cordel-master-dark/15 text-encre-noire/50'
        }`}
      >
        <span className="text-[9px] font-mono font-bold">
          {measure}
        </span>
        <div className="flex flex-col gap-1 items-center opacity-40">
          <span className="w-1 h-1 rounded-full bg-current" />
          <span className="w-1 h-1 rounded-full bg-current" />
        </div>
        <span className="text-[8px] opacity-30">·</span>
      </div>
    );
  }

  // Cas 2 : Mesure avec signal à combler
  let borderClass = 'border-2 border-dashed border-cordel-wood/50 hover:border-cordel-wood bg-white hover:bg-[#fbf7ee]';
  let badge = null;

  if (validation === true) {
    borderClass = 'border-2 border-[var(--color-cordel-vert,#2d6a4f)] bg-emerald-50 shadow-[1.5px_1.5px_0px_0px_#2d6a4f]';
    badge = (
      <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
        ✓
      </span>
    );
  } else if (validation === false) {
    borderClass = 'border-2 border-[var(--color-cordel-rouge,#8b2a1a)] bg-red-50 shadow-[1.5px_1.5px_0px_0px_#8b2a1a] animate-shake';
    badge = (
      <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
        ✗
      </span>
    );
  } else if (assignedSignal) {
    borderClass = 'border-2 border-encre-noire bg-[#fdfaf2] shadow-[2px_2px_0px_0px_#181716] hover:translate-y-[-1px]';
  }

  return (
    <button
      type="button"
      onClick={() => onClickSlot && onClickSlot(slot)}
      className={`relative flex flex-col justify-between w-20 sm:w-22 h-20 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-left select-none ${borderClass} ${
        isCurrentPlayhead ? 'ring-2 ring-amber-500' : ''
      }`}
      title={`Mesure ${measure} : ${assignedSignal ? assignedSignal.name : 'Cliquer pour choisir le signal'}`}
    >
      {badge}

      {/* En-tête de la case */}
      <div className="flex items-center justify-between w-full border-b border-dashed border-current/20 pb-0.5">
        <span className="text-[9.5px] font-black font-mono text-cordel-wood">
          M{measure}
        </span>
        <span className="text-[10px]">🖐️</span>
      </div>

      {/* Corps : Signal affecté ou case vide [ ? ] */}
      {assignedSignal ? (
        <div className="flex flex-col items-center justify-center w-full flex-1 overflow-hidden px-0.5">
          {assignedSignal.imageUrl ? (
            <img
              src={assignedSignal.imageUrl}
              alt={assignedSignal.name}
              className="w-7 h-7 object-cover rounded border border-encre-noire/20"
            />
          ) : (
            <span className="text-base leading-none">✋</span>
          )}
          <span className="text-[9px] font-black text-center leading-tight truncate w-full mt-0.5 text-encre-noire">
            {assignedSignal.name}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full flex-1 text-center py-1">
          <span className="text-xs font-black text-cordel-wood animate-pulse">
            [ ? ]
          </span>
          <span className="text-[8px] font-bold text-encre-noire/60 uppercase">
            Choisir
          </span>
        </div>
      )}
    </button>
  );
}
