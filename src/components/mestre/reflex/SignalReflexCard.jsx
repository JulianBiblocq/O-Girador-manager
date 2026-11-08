import React, { useState, useMemo } from 'react';
import PatternVisualizer from '../../pedagogy/PatternVisualizer';
import { useTranslation } from '../../LanguageContext';
import { extractPupitrePattern, generateDistractors } from '../../../utils/reflexGameUtils';

const PREVIEW_PUPITRES = [
  { key: 'caixa', label: 'Caixa' }, { key: 'tarol', label: 'Tarol' },
  { key: 'gongue', label: 'Gonguê' }, { key: 'alfaia', label: 'Alfaia' },
  { key: 'marcante', label: 'Alfaia Marcante' }, { key: 'agbe', label: 'Agbe / Shekere' },
  { key: 'mineiro', label: 'Mineiro' }, { key: 'timbal', label: 'Timbal' }
];

/**
 * Carte d'arbitrage Mestre pour un signal du morceau (< 120 lignes).
 * Permet de basculer entre 🎯 Défi interactif (pause au temps 1 + 4 grilles PatternVisualizer)
 * et 👁️ Simple repère (mode: 'cueOnly'), et de régénérer ou verrouiller les leurres.
 */
export default function SignalReflexCard({ signal, presetData, override = {}, onChangeOverride }) {
  const { t } = useTranslation();
  const [previewPupitre, setPreviewPupitre] = useState('caixa');
  const [localDistractors, setLocalDistractors] = useState(null);

  const isCueOnly = override.mode === 'cueOnly' || override.mode === 'repere' || override.isInteractive === false;
  const isInteractive = !isCueOnly;
  const isLocked = Boolean(override.locked);

  const correctPattern = useMemo(
    () => extractPupitrePattern(presetData, previewPupitre, signal.targetMeasureIndex),
    [presetData, previewPupitre, signal.targetMeasureIndex]
  );

  const currentDistractors = useMemo(() => {
    if (isLocked && Array.isArray(override.distractors) && override.distractors.length === 3) return override.distractors;
    if (Array.isArray(localDistractors) && localDistractors.length === 3) return localDistractors;
    return generateDistractors(correctPattern, presetData, previewPupitre, [], null, signal.targetMeasureIndex);
  }, [correctPattern, presetData, previewPupitre, signal.targetMeasureIndex, isLocked, override.distractors, localDistractors]);

  const handleToggleMode = (nextInteractive) => {
    onChangeOverride({ ...override, isInteractive: nextInteractive, mode: nextInteractive ? 'pause' : 'cueOnly' });
  };

  const handleRegenerate = () => {
    const fresh = generateDistractors(correctPattern, presetData, previewPupitre, [], null, signal.targetMeasureIndex);
    setLocalDistractors(fresh);
    onChangeOverride({ ...override, distractors: fresh, locked: true });
  };

  const handleToggleLock = () => {
    onChangeOverride({ ...override, locked: !isLocked, distractors: !isLocked ? currentDistractors : null });
  };

  return (
    <div className="p-3.5 bg-[#fdfaf2] border-2 border-encre-noire rounded-lg shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🖐️</span>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase text-encre-noire">
              {t('mestre.sequenceur.barMeasureWord')} {signal.mesure} : {signal.name}
            </h4>
            <p className="text-[10px] font-bold text-cordel-master-dark/70">
              {t('mestre.sequenceur.targetedDownbeatColon')} <strong>{t('mestre.sequenceur.barMeasureWord')} {signal.targetMeasure}</strong> (~{Number(signal.pauseTime || 0).toFixed(1)}s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded border border-encre-noire/20 shrink-0">
          <button type="button" onClick={() => handleToggleMode(true)} className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${isInteractive ? 'bg-[var(--color-cordel-vert)] text-white shadow-2xs' : 'text-stone-700 hover:text-stone-900'}`}>
            🎯 {t('mestre.sequenceur.interactiveChallengeBtn')}
          </button>
          <button type="button" onClick={() => handleToggleMode(false)} className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${!isInteractive ? 'bg-[var(--color-cordel-ocre)] text-white shadow-2xs' : 'text-stone-700 hover:text-stone-900'}`}>
            👁️ {t('mestre.sequenceur.simpleGuideBtn')}
          </button>
        </div>
      </div>

      {isInteractive ? (
        <div className="flex flex-col gap-2.5 pt-0.5">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-cordel-wood">{t('mestre.sequenceur.sectionPreviewColon')}</span>
              <select value={previewPupitre} onChange={(e) => setPreviewPupitre(e.target.value)} className="theme-input text-xs font-bold py-0.5 px-2 bg-white border border-encre-noire/30 rounded">
                {PREVIEW_PUPITRES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handleRegenerate} className="px-2 py-1 text-[9px] font-black uppercase rounded bg-stone-100 hover:bg-stone-200 border border-encre-noire/30 text-stone-800 cursor-pointer flex items-center gap-1">
                <span>🎲</span><span>{t('mestre.sequenceur.renewBtn')}</span>
              </button>
              <button type="button" onClick={handleToggleLock} className={`px-2 py-1 text-[9px] font-black uppercase rounded border cursor-pointer flex items-center gap-1 ${isLocked ? 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold' : 'bg-white text-stone-700 border-encre-noire/30'}`}>
                <span>{isLocked ? t('pedagogy.admin.fige') : t('pedagogy.admin.dynamique')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 rounded bg-emerald-50/80 border-2 border-[var(--color-cordel-vert)] flex flex-col gap-1">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--color-cordel-vert)]">✓ {t('mestre.sequenceur.correctTablatureHeading')} {signal.targetMeasure})</span>
              <div className="pointer-events-none scale-90 -my-1"><PatternVisualizer patternArray={correctPattern} beatResolution={4} /></div>
            </div>
            {currentDistractors.map((dist, dIdx) => (
              <div key={dIdx} className="p-2 rounded bg-white border border-dashed border-encre-noire/30 flex flex-col gap-1">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-cordel-wood">⚠️ {t('mestre.sequenceur.distractorPrefix')}{dIdx + 1}</span>
                <div className="pointer-events-none scale-90 -my-1"><PatternVisualizer patternArray={dist} beatResolution={4} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-amber-50/70 border border-dashed border-amber-300 rounded text-center text-[11px] font-bold text-amber-900 italic">
          {t('mestre.sequenceur.signalVisualGuideNotice')} {signal.mesure} {t('mestre.sequenceur.withoutInterruptingSound')}
        </div>
      )}
    </div>
  );
}
