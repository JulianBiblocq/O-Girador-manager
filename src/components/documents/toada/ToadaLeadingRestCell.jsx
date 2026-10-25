import React, { useRef } from 'react';
import { BEAT_1_CLASS, BEAT_OTHER_CLASS } from '../../../utils/toadaLineEditorHelper';

export default function ToadaLeadingRestCell({
  hasLeadingRest = false,
  leadingRestBeat = 1,
  isSelected = false,
  onSelectCell,
  onSelectBeat,
  onNavigateRight,
  activeStamp = null,
  disabled = false,
  signature = '4/4'
}) {
  const lastKeyTimeRef = useRef({ key: '', time: 0 });

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (activeStamp) {
      if (hasLeadingRest && leadingRestBeat === activeStamp) onSelectBeat(null);
      else onSelectBeat(activeStamp);
    } else {
      if (onSelectCell) onSelectCell();
    }
  };

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onSelectBeat(null);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (['Backspace', 'Delete', '0'].includes(e.key)) {
      e.preventDefault();
      onSelectBeat(null);
      return;
    }
    if (e.key === 'ArrowRight' && onNavigateRight) {
      e.preventDefault();
      onNavigateRight();
      return;
    }
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const now = Date.now(), last = lastKeyTimeRef.current;
      const maxBeats = signature === '2/4' ? 2 : signature === '3/4' ? 3 : signature === '6/8' ? 6 : signature === '12/8' ? 12 : 4;
      let targetBeat = parseInt(e.key, 10);
      if (last.key === '1' && now - last.time < 500) {
        const combo = parseInt(`1${e.key}`, 10);
        if (combo <= maxBeats) targetBeat = combo;
      }
      lastKeyTimeRef.current = { key: e.key, time: now };
      if (targetBeat <= maxBeats) onSelectBeat(targetBeat);
    }
  };

  const badgeClass = leadingRestBeat === 1 ? BEAT_1_CLASS : BEAT_OTHER_CLASS;

  return (
    <div
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative flex flex-col items-center justify-end px-1 py-0.5 rounded cursor-pointer outline-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-amber-500 bg-amber-100/90 scale-105 shadow-xs'
          : 'hover:bg-stone-100'
      }`}
      title="Silence / Anacrouse initiale (cliquez pour sélectionner, tapez 1..4 ou flèche droite)"
    >
      <div className="h-7 flex items-center justify-center">
        {hasLeadingRest ? (
          <span
            onClick={handleBadgeClick}
            className={`min-w-[24px] h-[24px] px-1 rounded flex items-center justify-center text-sm font-extrabold font-mono border hover:opacity-80 ${badgeClass}`}
            title="Temps posé (cliquer sur le badge pour effacer)"
          >
            {leadingRestBeat}
          </span>
        ) : (
          <span className="min-w-[24px] h-[24px] rounded border border-dashed border-stone-300 text-stone-300 flex items-center justify-center text-xs">
            +
          </span>
        )}
      </div>

      <div className="text-xs font-mono font-bold text-stone-400 mt-0.5 select-none">
        {hasLeadingRest ? '_' : '∅'}
      </div>
    </div>
  );
}
