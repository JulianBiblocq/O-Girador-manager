import React from 'react';
import { BEAT_1_CLASS, BEAT_OTHER_CLASS } from '../../../utils/toadaLineEditorHelper';

export default function ToadaCharAnchorCell({
  char = '',
  cIdx = 0,
  anchor = null,
  measureNum = null,
  sigChange = null,
  isSelected = false,
  isCharPuxador = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDeleteAnchor,
  onKeyDown
}) {
  const isSpace = char === ' ';
  const isUnderScore = char === '_';
  const badgeClass = anchor === 1 ? BEAT_1_CLASS : BEAT_OTHER_CLASS;

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    if (onDeleteAnchor) onDeleteAnchor();
  };

  return (
    <div
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`flex flex-col items-center justify-end min-w-[14px] px-0.5 py-0.5 rounded cursor-pointer outline-hidden select-none transition-all ${
        isSelected
          ? 'ring-2 ring-amber-500 bg-amber-100/95 scale-105 shadow-xs z-10'
          : isHovered
          ? 'bg-amber-100/60 ring-1 ring-cordel-wood/40'
          : anchor
          ? 'bg-amber-50/40'
          : 'hover:bg-stone-100'
      }`}
      title={isUnderScore ? 'Porte-temps muet (_)' : isSpace ? 'Espace ␣' : `Caractère : ${char}`}
    >
      <div className="h-8 flex flex-col items-center justify-end">
        {sigChange && (
          <span className="text-[7.5px] font-black leading-none text-amber-900 bg-amber-100 border border-amber-300 px-0.5 rounded -mb-0.5">
            {sigChange}
          </span>
        )}
        {anchor ? (
          <span
            onClick={handleBadgeClick}
            className={`min-w-[24px] h-[22px] px-1 rounded flex items-center justify-center text-xs font-extrabold font-mono border hover:opacity-80 ${badgeClass}`}
            title={`Temps ${anchor} ${measureNum ? `(Mesure ${measureNum})` : ''} - cliquer pour effacer`}
          >
            {anchor === 1 && measureNum ? (
              <span className="text-[7.5px] opacity-75 font-normal mr-0.5">M{measureNum}·</span>
            ) : null}
            {anchor}
          </span>
        ) : (
          <div className="h-5 w-1" />
        )}
      </div>

      <div className="mt-0.5 flex items-center justify-center text-xs">
        {isUnderScore ? (
          <span className="min-w-[16px] text-center font-mono font-black text-stone-700 bg-stone-200/90 px-1 py-0.2 rounded border border-dashed border-stone-400">
            _
          </span>
        ) : isSpace ? (
          <span className="text-stone-300 font-sans min-w-[8px] text-center">␣</span>
        ) : (
          <span className={isCharPuxador ? 'font-bold text-stone-900' : 'font-normal italic text-stone-600'}>
            {char}
          </span>
        )}
      </div>
    </div>
  );
}
