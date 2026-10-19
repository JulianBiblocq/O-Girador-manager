import React, { useRef } from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Éditeur textuel structuré par mesure (1 paragraphe = 1 mesure).
 * Boutons rapides : [+] Anacrouse, [🔗] Mesure liée, [*] Puxador, et [+ Accord].
 */
export default function ToadaMeasureEditor({
  value = '',
  onChange,
  disabled = false,
  placeholder = '',
  minHeight = '180px'
}) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);

  // Insertion de texte ou préfixe à la position du curseur
  const insertToken = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = `${prefix}${selected || ''}${suffix}`;
    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
      const cursorTarget = start + prefix.length + (selected ? selected.length : 0);
      el.setSelectionRange(cursorTarget, cursorTarget);
    }, 50);
  };

  // Insertion en début de paragraphe/mesure courante
  const insertMeasurePrefix = (prefixChar) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const beforeCursor = value.slice(0, start);
    const lastDoubleBreak = Math.max(beforeCursor.lastIndexOf('\n\n'), -1);
    const measureStart = lastDoubleBreak === -1 ? 0 : lastDoubleBreak + 2;

    const currentMeasurePrefix = value.slice(measureStart, measureStart + 1);
    let nextValue;
    if (currentMeasurePrefix === prefixChar) {
      // Toggle off
      nextValue = value.slice(0, measureStart) + value.slice(measureStart + 1);
    } else {
      // Toggle on
      nextValue = value.slice(0, measureStart) + `${prefixChar} ` + value.slice(measureStart);
    }
    onChange(nextValue);
    setTimeout(() => el.focus(), 50);
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      {/* Barre d'outils d'édition rapide Cordel */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => insertMeasurePrefix('+')}
            disabled={disabled}
            className="px-2 py-0.5 text-[9.5px] font-black uppercase rounded bg-white hover:bg-amber-100 border border-encre-noire/30 cursor-pointer shadow-2xs"
            title={t('toada.tooltipAnacrusis') || "Ajouter une Anacrouse (+) sur la mesure courante"}
          >
            [+] Anacrouse
          </button>
          <button
            type="button"
            onClick={() => insertMeasurePrefix('/')}
            disabled={disabled}
            className="px-2 py-0.5 text-[9.5px] font-black uppercase rounded bg-white hover:bg-amber-100 border border-encre-noire/30 cursor-pointer shadow-2xs"
            title={t('toada.tooltipLinked') || "Lier cette mesure à la précédente (/)"}
          >
            [🔗] Mesure liée
          </button>
          <button
            type="button"
            onClick={() => insertToken('*', '*')}
            disabled={disabled}
            className="px-2 py-0.5 text-[9.5px] font-black uppercase rounded bg-white hover:bg-stone-100 border border-encre-noire/30 cursor-pointer shadow-2xs"
            title={t('toada.tooltipPuxador') || "Entourer avec * pour marquer le Puxador/Soliste"}
          >
            *Puxador*
          </button>
          <button
            type="button"
            onClick={() => insertToken('[Dm7]')}
            disabled={disabled}
            className="px-2 py-0.5 text-[9.5px] font-black uppercase rounded bg-white hover:bg-emerald-50 border border-emerald-800 text-emerald-900 cursor-pointer shadow-2xs"
            title={t('toada.tooltipChord') || "Insérer un accord harmonique [Accord]"}
          >
            [+ Accord]
          </button>
        </div>

        <span className="text-[8.5px] text-stone-500 font-semibold italic hidden sm:inline">
          1 paragraphe = 1 mesure (sauter 2 lignes)
        </span>
      </div>

      {/* Zone de texte de saisie par mesure */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || "+ *Soliste* [Dm7] texte de la mesure...\n\n/ Suite du chœur dans la mesure liée..."}
        style={{ minHeight }}
        className="theme-input font-mono text-xs font-semibold p-2.5 bg-white leading-relaxed resize-y w-full rounded-[4px_6px_3px_5px] border border-encre-noire/30 shadow-inner"
      />
    </div>
  );
}
