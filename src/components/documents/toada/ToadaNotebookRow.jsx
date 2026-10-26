import React, { useRef } from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Ligne unitaire du Cahier Ligné (< 130 lignes).
 * Synchronise la mesure originale (Portugais), la phonétique et les 3 cases à cocher.
 */
export default function ToadaNotebookRow({
  index = 0,
  row,
  onUpdateRow,
  onAddRowAfter,
  onDeleteRow,
  onFocusPrevRow,
  onFocusNextRow,
  disabled = false,
  isFirst = false
}) {
  const { t } = useTranslation();
  const origTextareaRef = useRef(null);

  const hasBold = /\*[^*]+\*/.test(row.origText || '');
  const textWithoutBold = (row.origText || '').replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim();
  const hasNormal = textWithoutBold.length > 0;

  const wrapSelection = (pre, post) => {
    const el = origTextareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const val = row.origText || '', sel = val.slice(s, e);
    if (!sel) return;
    const hasTag = sel.startsWith(pre) && sel.endsWith(post) && sel.length >= pre.length + post.length;
    const nextVal = val.slice(0, s) + (hasTag ? sel.slice(pre.length, sel.length - post.length) : `${pre}${sel}${post}`) + val.slice(e);
    const [ns, ne] = hasTag ? [s, e - (pre.length + post.length)] : [s, e + pre.length + post.length];
    onUpdateRow({ origText: nextVal });
    setTimeout(() => { el.focus(); el.setSelectionRange(ns, ne); }, 20);
  };
  const toggleBoldSelection = () => wrapSelection('*', '*');
  const toggleUnderlineSelection = () => wrapSelection('<u>', '</u>');

  const handleOrigKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      toggleBoldSelection();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      toggleUnderlineSelection();
    } else if (e.key === 'Enter') {
      if (!e.shiftKey) { e.preventDefault(); onAddRowAfter(); }
    } else if (e.key === 'Backspace' && !(row.origText || '').trim() && onFocusPrevRow && !isFirst && origTextareaRef.current?.selectionStart === 0) {
      e.preventDefault(); onDeleteRow(); onFocusPrevRow();
    }
  };

  const handlePhonKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onFocusNextRow) onFocusNextRow();
    }
  };

  return (
    <div className={`grid grid-cols-12 gap-2 items-start py-2 px-1.5 border-b border-dashed border-cordel-master-dark/25 transition-colors ${
      row.isLinked ? 'bg-amber-50/50' : 'bg-transparent'
    }`}>
      {/* 1. Badge Mesure & Liaison */}
      <div className="col-span-1 flex flex-col items-center justify-start pt-1 font-mono text-[10px] select-none">
        <span className={`px-1.5 py-0.5 rounded font-black ${row.isLinked ? 'bg-cordel-master-dark text-white' : 'bg-stone-200 text-stone-700'}`}>
          M{index + 1}
        </span>
        {row.isLinked && (
          <span className="text-cordel-master-dark text-[11px] font-black leading-none mt-0.5" title={t('toada.linkedTooltip') || "Liée à la précédente"}>↳</span>
        )}
      </div>

      {/* 2. Paroles Originales (Portugais) */}
      <div className="col-span-5 flex flex-col gap-1 text-left">
        <textarea
          ref={origTextareaRef}
          value={row.origText || ''}
          onChange={(e) => onUpdateRow({ origText: e.target.value })}
          onKeyDown={handleOrigKeyDown}
          disabled={disabled}
          placeholder={index === 0 ? "+ *Soliste* Chœur..." : "Paroles..."}
          rows={Math.max(1, (row.origText || '').split('\n').length)}
          className="theme-input font-mono text-xs p-1.5 w-full bg-white rounded border border-encre-noire/25 leading-snug resize-y focus:ring-1 focus:ring-cordel-wood"
        />
        {hasBold && (
          <div className="flex items-center gap-1 text-[8px] text-cordel-wood font-bold">
            <span className="bg-amber-100/90 text-amber-950 px-1 py-0.2 rounded font-black">Solo</span>
            {hasNormal && <span className="text-stone-500 font-normal">+ Chœur</span>}
          </div>
        )}
      </div>

      {/* 3. Prononciation Phonétique */}
      <div className="col-span-4 flex flex-col gap-1 text-left">
        <textarea
          value={row.phonText || ''}
          onChange={(e) => onUpdateRow({ phonText: e.target.value })}
          onKeyDown={handlePhonKeyDown}
          disabled={disabled}
          placeholder="Phonétique..."
          rows={Math.max(1, (row.phonText || '').split('\n').length)}
          className="theme-input font-mono text-xs italic p-1.5 w-full bg-white rounded border border-encre-noire/20 leading-snug resize-y"
        />
      </div>

      {/* 4. Les 3 Cases à cocher */}
      <div className="col-span-2 flex flex-col gap-1 items-start text-[9px] pt-0.5 select-none text-left">
        <label className={`flex items-center gap-1 cursor-pointer font-bold ${isFirst ? 'opacity-40 cursor-not-allowed' : 'text-stone-700'}`}>
          <input type="checkbox" checked={Boolean(row.isLinked)} disabled={disabled || isFirst} onChange={(e) => onUpdateRow({ isLinked: e.target.checked })} className="w-3 h-3 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]" />
          <span>{t('toada.linkedCheckbox') || "Liée"}</span>
        </label>
        <label className={`flex items-center gap-1 cursor-pointer font-bold ${!hasBold ? 'opacity-40 cursor-not-allowed' : 'text-amber-900'}`}>
          <input type="checkbox" checked={Boolean(row.hasAnaSolo && hasBold)} disabled={disabled || !hasBold} onChange={(e) => onUpdateRow({ hasAnaSolo: e.target.checked })} className="w-3 h-3 cursor-pointer accent-amber-600" />
          <span>{t('toada.anaSoloCheckbox') || "Ana. Solo"}</span>
        </label>
        <label className={`flex items-center gap-1 cursor-pointer font-bold ${!hasNormal ? 'opacity-40 cursor-not-allowed' : 'text-stone-800'}`}>
          <input type="checkbox" checked={Boolean(row.hasAnaCoro && hasNormal)} disabled={disabled || !hasNormal} onChange={(e) => onUpdateRow({ hasAnaCoro: e.target.checked })} className="w-3 h-3 cursor-pointer accent-stone-700" />
          <span>{t('toada.anaCoroCheckbox') || "Ana. Chœur"}</span>
        </label>
      </div>
    </div>
  );
}
