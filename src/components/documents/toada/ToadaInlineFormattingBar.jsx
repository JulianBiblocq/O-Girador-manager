import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Barre d'aide compacte pour le Cahier Ligné (< 75 lignes).
 * Rappelle le raccourci Ctrl+B pour le Puxador et les symboles de mesure.
 */
export default function ToadaInlineFormattingBar({
  onBold,
  onUnderline,
  totalMeasures = 1,
  disabled = false
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-cordel-bg-light/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] text-[10px]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onBold}
          disabled={disabled}
          title={t('toada.boldPuxadorTooltip') || "Sélectionnez du texte et cliquez ou pressez Ctrl+B pour marquer le Puxador (*Soliste*)"}
          className="px-2 py-0.5 rounded font-black bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
        >
          <span className="font-serif font-black text-[11px]">B</span>
          <span>{t('toada.boldPuxador') || "Puxador (Gras)"}</span>
        </button>

        <button
          type="button"
          onClick={onUnderline}
          disabled={disabled}
          title={t('toada.underlineTooltip') || "Souligner la 1re lettre d'une syllabe (Ctrl+U)"}
          className="px-2 py-0.5 rounded font-bold bg-white text-stone-900 hover:bg-stone-100 border border-stone-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
        >
          <span className="font-serif font-bold text-[11px] underline">U</span>
          <span>{t('toada.underlineSyllable') || "Syllabe"}</span>
        </button>

        <span className="text-[9px] text-stone-600 hidden sm:inline">
          <kbd className="px-1 py-0.2 bg-white border border-stone-300 rounded font-mono text-[8.5px]">Ctrl+B</kbd> : Solo / <kbd className="px-1 py-0.2 bg-white border border-stone-300 rounded font-mono text-[8.5px]">Ctrl+U</kbd> : Syllabe
        </span>
      </div>

      <div className="flex items-center gap-2 text-[9px] text-cordel-wood font-bold">
        <span className="px-1.5 py-0.5 rounded bg-white border border-encre-noire/15 font-mono">
          {totalMeasures} {totalMeasures > 1 ? (t('toada.measuresCountPlural') || "mesures") : (t('toada.measuresCountSingular') || "mesure")}
        </span>
      </div>
    </div>
  );
}
