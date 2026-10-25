import React from 'react';
import { useTranslation } from '../../LanguageContext';
import { BEAT_1_CLASS, BEAT_OTHER_CLASS } from '../../../utils/toadaLineEditorHelper';

function getSignatureBadgeCount(sig = '4/4') {
  if (sig === '2/4') return 2;
  if (sig === '3/4') return 3;
  if (sig === '6/8') return 6;
  if (sig === '12/8') return 12;
  return 4;
}

export default function ToadaStampBadgeSelector({
  signature = '4/4',
  onChangeSignature,
  totalMeasures = 0,
  activeStamp = null,
  onSelectStamp,
  hasSelectedCell = false,
  disabled = false
}) {
  const { t } = useTranslation();
  const count = getSignatureBadgeCount(signature);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15 w-full">
      <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 text-xs shadow-2xs">
        <span className="text-[9px] font-black uppercase text-stone-600 dark:text-stone-300">
          🎼 {t('toada.metricLabel') || "Métrique :"}
        </span>
        <select
          value={signature}
          onChange={(e) => onChangeSignature && onChangeSignature(e.target.value)}
          disabled={disabled}
          className="bg-white dark:bg-stone-900 font-bold text-xs py-0.5 px-1 rounded border border-stone-300 cursor-pointer text-stone-800 dark:text-stone-100"
          title={hasSelectedCell ? "Changer la métrique sur le temps sélectionné" : "Métrique par défaut"}
        >
          <option value="4/4">4/4</option>
          <option value="2/4">2/4</option>
          <option value="3/4">3/4</option>
          <option value="6/8">6/8</option>
          <option value="12/8">12/8</option>
        </select>
      </div>

      <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs select-none">
        📏 {totalMeasures > 0 ? `${totalMeasures} ${totalMeasures > 1 ? (t('toada.measuresPlural') || 'mesures') : (t('toada.measuresSingular') || 'mesure')}` : (t('toada.anacrusis') || 'Anacrouse')}
      </span>

      <div className="h-5 w-px bg-stone-300 hidden sm:block" />

      <span className="text-[9px] font-bold uppercase text-stone-600 select-none">
        {t('toada.stampLabel') || "Temps :"}
      </span>

      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, idx) => {
          const beatNum = idx + 1;
          const isSelected = activeStamp === beatNum;
          const colorClass = beatNum === 1 ? BEAT_1_CLASS : BEAT_OTHER_CLASS;
          return (
            <button
              key={beatNum}
              type="button"
              disabled={disabled}
              onClick={() => onSelectStamp(beatNum)}
              className={`min-w-[24px] h-[24px] px-1 rounded flex items-center justify-center text-xs font-extrabold font-mono border cursor-pointer transition-transform ${colorClass} ${
                isSelected ? 'ring-2 ring-amber-400 ring-offset-1 scale-110 shadow-md' : 'opacity-90 hover:opacity-100 hover:scale-105'
              }`}
              title={`Temps ${beatNum} (${signature})`}
            >
              {beatNum}
            </button>
          );
        })}
      </div>

      <div className="ml-auto text-[9px] text-stone-500 italic select-none hidden lg:block">
        {hasSelectedCell
          ? `Tapez 1..${count} au clavier (ou ◄ ► / Suppr)`
          : activeStamp
          ? `Tampon [${activeStamp}] actif : cliquez une lettre ou un _`
          : `Cliquez une lettre ou un _ puis tapez 1..${count}`}
      </div>
    </div>
  );
}
