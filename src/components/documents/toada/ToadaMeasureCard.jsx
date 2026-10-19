import React, { useRef } from 'react';

/**
 * Boîte visuelle d'une mesure Toada (< 120 lignes).
 * Gère Anacrouse (+), Mesure liée (/), boutons rapides (*Puxador*, [+ Accord]),
 * ainsi que les touches Entrée (mesure suivante) et Shift+Entrée (retour visuel indenté).
 */
export default function ToadaMeasureCard({
  measureIndex = 1,
  text = '',
  hasAnacrusis = false,
  isLinked = false,
  onChangeText,
  onToggleAnacrusis,
  onToggleLinked,
  onAddMeasureAfter,
  onDeleteMeasure,
  disabled = false
}) {
  const textareaRef = useRef(null);

  const insertToken = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = text.slice(start, end);
    onChangeText(text.slice(0, start) + `${prefix}${selected || ''}${suffix}` + text.slice(end));
    setTimeout(() => {
      el.focus();
      const pos = start + prefix.length + (selected ? selected.length : 0);
      el.setSelectionRange(pos, pos);
    }, 40);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Entrée : retour visuel indenté avec 1 espace
        const el = textareaRef.current;
        if (!el) return;
        const { selectionStart: start, selectionEnd: end } = el;
        onChangeText(text.slice(0, start) + '\n ' + text.slice(end));
        setTimeout(() => el.setSelectionRange(start + 2, start + 2), 30);
      } else if (onAddMeasureAfter) {
        onAddMeasureAfter();
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1 p-1.5 rounded-[4px_6px_3px_5px] border transition-all ${
      isLinked ? 'bg-amber-50/60 border-cordel-master-dark/30 ml-4 border-l-4' : 'bg-white border-encre-noire/25 shadow-2xs'
    }`}>
      {/* Barre d'actions de la mesure */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
        <div className="flex items-center gap-1 font-black">
          <span className="px-1 py-0.5 rounded bg-cordel-wood/10 text-cordel-wood font-mono text-[9px]">M{measureIndex}</span>
          <button type="button" onClick={onToggleAnacrusis} disabled={disabled}
            className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border cursor-pointer ${
              hasAnacrusis ? 'bg-amber-600 text-white border-amber-700' : 'bg-stone-100 text-stone-600 border-stone-300'
            }`} title="Anacrouse (+)">+ Anacrouse</button>
          <button type="button" onClick={onToggleLinked} disabled={disabled}
            className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border cursor-pointer ${
              isLinked ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-emerald-800' : 'bg-stone-100 text-stone-600 border-stone-300'
            }`} title="Mesure liée (/)">🔗 Liée</button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => insertToken('*', '*')} disabled={disabled}
            className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300 font-bold text-[8px] cursor-pointer">*Soliste*</button>
          <button type="button" onClick={() => insertToken('[Dm7]')} disabled={disabled}
            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-700 font-bold text-[8px] cursor-pointer">[+ Accord]</button>
          {onDeleteMeasure && (
            <button type="button" onClick={onDeleteMeasure} disabled={disabled}
              className="px-1.5 py-0.5 rounded text-white bg-[var(--color-cordel-rouge,#8b2a1a)] text-[8px] font-bold cursor-pointer" title="Supprimer">🗑️</button>
          )}
        </div>
      </div>
      <textarea ref={textareaRef} value={text} onChange={(e) => onChangeText(e.target.value)} onKeyDown={handleKeyDown}
        disabled={disabled} placeholder="Paroles (Entrée = mesure suivante, Shift+Entrée = retour visuel)..." rows={2}
        className="theme-input font-mono text-xs p-1.5 w-full bg-white rounded border border-encre-noire/20 leading-relaxed resize-y focus:outline-none" />
    </div>
  );
}
