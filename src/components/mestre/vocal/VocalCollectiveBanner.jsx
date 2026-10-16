import React from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import VocalKeyboardBar from './VocalKeyboardBar';

export default function VocalCollectiveBanner({ overlap, breakdown }) {
  const { t } = useTranslation();

  return (
    <CordelCard variant="default" className="flex flex-col gap-3">
      <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1">
        {t('mestre.casting.vocalSynthesisTitle')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Unisson & Recouvrement */}
        <div className="p-3 bg-amber-500/10 rounded border border-cordel-master-dark/15 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-cordel-wood">
              {t('mestre.casting.choirOverlapHeading')}
            </span>
            <span className="text-[10px] font-bold text-cordel-master-dark/80">
              {t('mestre.casting.choirCoverageNotice', { pct: overlap?.coveragePct })}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-cordel-master-dark">
              {overlap?.startNote} ➔ {overlap?.endNote}
            </span>
            <span className="text-xs font-semibold text-cordel-master-dark/70">
              ({t('mestre.casting.semitonesCount', { count: overlap?.rangeSemitones })})
            </span>
          </div>
          <div className="text-[10px] font-bold text-cordel-wood flex items-center gap-1.5">
            <span>🎯 {t('mestre.casting.idealGroupCenter')}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-black">{overlap?.centerNote}</span>
          </div>
          {overlap && (
            <VocalKeyboardBar
              lowestMidi={overlap.startMidi}
              highestMidi={overlap.endMidi}
              centerMidi={overlap.centerMidi}
              lowestNote={overlap.startNote}
              highestNote={overlap.endNote}
              centerNote={overlap.centerNote}
              isCollective
            />
          )}
        </div>

        {/* Répartition Tessitures */}
        <div className="p-3 bg-white/40 dark:bg-black/20 rounded border border-cordel-master-dark/15 flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase text-cordel-wood">
            {t('mestre.casting.tessituresBreakdownHeading')}
          </span>
          <div className="grid grid-cols-3 gap-2 text-center mt-1">
            <div className="p-2 bg-stone-100 dark:bg-stone-800/60 rounded">
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('mestre.casting.voicesGraves')}</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-400">{breakdown.graves}</span>
            </div>
            <div className="p-2 bg-stone-100 dark:bg-stone-800/60 rounded">
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('mestre.casting.voicesMediums')}</span>
              <span className="text-lg font-black text-cordel-wood">{breakdown.mediums}</span>
            </div>
            <div className="p-2 bg-stone-100 dark:bg-stone-800/60 rounded">
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('mestre.casting.voicesAigues')}</span>
              <span className="text-lg font-black text-orange-600 dark:text-orange-400">{breakdown.aigues}</span>
            </div>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
