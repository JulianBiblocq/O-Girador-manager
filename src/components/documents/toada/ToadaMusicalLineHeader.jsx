import React from 'react';

export default function ToadaMusicalLineHeader({
  measureLabel = 'M1',
  effectiveSignature = '4/4',
  lineSignature = null,
  onChangeLineSignature,
  isSilence = false,
  isPuxador = false,
  isRepeated = false,
  onAddLineAfter,
  onDeleteLine,
  disabled = false
}) {
  return (
    <div className="flex items-center justify-between text-[9px] font-bold text-stone-500">
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded font-mono font-black bg-stone-200 text-stone-800 text-[10px]">
          {measureLabel}
        </span>
        {onChangeLineSignature && (
          <select
            value={lineSignature || ''}
            onChange={(e) => onChangeLineSignature(e.target.value || null)}
            disabled={disabled}
            className="text-[9px] font-mono font-bold bg-white text-stone-700 border border-stone-300 rounded px-1 py-0.2 cursor-pointer shadow-2xs"
            title="Changer la métrique à partir de cette ligne"
          >
            <option value="">🎼 {effectiveSignature}</option>
            <option value="4/4">🎼 4/4</option>
            <option value="2/4">🎼 2/4</option>
            <option value="3/4">🎼 3/4</option>
            <option value="6/8">🎼 6/8</option>
            <option value="12/8">🎼 12/8</option>
          </select>
        )}
        {isSilence && <span className="bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-black text-[8px] uppercase">🔇 Silence</span>}
        {isPuxador && <span className="bg-amber-100 text-cordel-wood px-1.5 py-0.2 rounded font-black text-[8px] uppercase">Puxador</span>}
        {isRepeated && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black text-[8px]">🔁 x2</span>}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onAddLineAfter} disabled={disabled} className="text-stone-400 hover:text-cordel-wood text-xs px-1 cursor-pointer" title="Ajouter une ligne">+</button>
        <button type="button" onClick={onDeleteLine} disabled={disabled} className="text-stone-400 hover:text-red-600 text-xs px-1 cursor-pointer" title="Supprimer">✕</button>
      </div>
    </div>
  );
}
