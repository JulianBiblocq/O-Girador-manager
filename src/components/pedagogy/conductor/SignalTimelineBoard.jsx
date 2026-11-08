import React, { useRef, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Plateau interactif de la Timeline des Signaux + Bac à Signaux (< 130 lignes).
 * Supporte le clic sur une mesure pour réécouter l'audio, l'ergonomie Mobile-First
 * « clic-clic » (case [ ? ] <-> vignette du bac, ou clic sur case remplie pour vider)
 * et le glisser-déposer (drag-and-drop) sur PC.
 */
export default function SignalTimelineBoard({
  totalMeasures = 16, slotsByMeasure = {}, signalTray = [], userSlots = {},
  validationResults = null, currentPlayheadMeasure = null, selectedMeasure = null,
  selectedTraySignal = null, onClickSlot, onDropSignalOnMeasure, onClickTraySignal, onSeekMeasure
}) {
  const { t } = useTranslation();
  const railRef = useRef(null);

  useEffect(() => {
    if (!currentPlayheadMeasure || !railRef.current) return;
    const el = railRef.current.querySelector(`[data-measure="${currentPlayheadMeasure}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentPlayheadMeasure]);

  const measures = Array.from({ length: totalMeasures }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3.5 text-left select-none">
      {/* 1. Frise des mesures avec cases crantées [ ? ] */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1 flex-wrap gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
            📜 {t('pedagogy.reflex.friseChronologique')}{totalMeasures} {t('pedagogy.reflex.mesuresFermante')}
          </span>
          <span className="text-[9.5px] font-bold text-encre-noire/65 italic">{t('pedagogy.reflex.signalTrayHint')}</span>
        </div>

        <div ref={railRef} className="w-full overflow-x-auto p-3 bg-cordel-bg-light/90 border-2 border-encre-noire rounded-lg shadow-inner varal-scrollbar flex items-center gap-1.5">
          {measures.map((m) => {
            const slot = slotsByMeasure[m] || null;
            const assigned = userSlots[m] || null;
            const valid = validationResults ? validationResults[m] : null;
            const isPlayhead = currentPlayheadMeasure === m;
            const isSelected = selectedMeasure === m;

            if (!slot) {
              return (
                <button
                  key={m} type="button" data-measure={m} onClick={() => onSeekMeasure && onSeekMeasure(m)}
                  className={`flex flex-col items-center justify-between w-10 h-20 py-1.5 px-0.5 rounded border transition-all shrink-0 cursor-pointer ${isPlayhead ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-xs' : 'bg-[#fdfaf2]/70 border-cordel-master-dark/15 text-encre-noire/55 hover:bg-amber-50/70'}`}
                  title={`Mesure ${m} — Cliquer pour écouter à partir d'ici`}
                >
                  <span className="text-[9px] font-mono font-bold">M{m}</span>
                  <span className="text-[9px] opacity-60">▶</span>
                  <span className="text-[8px] opacity-30">·</span>
                </button>
              );
            }

            let borderStyle = 'border-2 border-dashed border-cordel-wood/60 bg-white hover:bg-[#fbf7ee]';
            if (valid === true) borderStyle = 'border-2 border-[var(--color-cordel-vert,#2d6a4f)] bg-emerald-50 shadow-[1.5px_1.5px_0px_0px_#2d6a4f]';
            else if (valid === false) borderStyle = 'border-2 border-[var(--cordel-wood,#8b2a1a)] bg-red-50 shadow-[1.5px_1.5px_0px_0px_#8b2a1a]';
            else if (isSelected) borderStyle = 'border-2 border-[var(--color-cordel-ocre,#c05621)] bg-amber-50 ring-2 ring-amber-400';
            else if (assigned) borderStyle = 'border-2 border-encre-noire bg-[#fdfaf2] shadow-[2px_2px_0px_0px_#181716]';

            return (
              <div
                key={m} data-measure={m}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData('application/json');
                  if (raw && onDropSignalOnMeasure) { try { onDropSignalOnMeasure(m, JSON.parse(raw)); } catch {} }
                }}
                className={`relative flex flex-col justify-between w-22 h-20 p-1.5 rounded-lg transition-all shrink-0 ${borderStyle} ${isPlayhead ? 'ring-2 ring-amber-500' : ''}`}
              >
                <div className="flex items-center justify-between w-full border-b border-dashed border-current/20 pb-0.5">
                  <button type="button" onClick={() => onSeekMeasure && onSeekMeasure(m)} className="text-[9px] font-black font-mono text-cordel-wood hover:underline cursor-pointer flex items-center gap-0.5" title={`Réécouter la mesure ${m}`}>
                    <span>M{m}</span><span>▶</span>
                  </button>
                  {valid === true && <span className="text-[10px] font-black text-[var(--color-cordel-vert,#2d6a4f)]">✓</span>}
                  {valid === false && <span className="text-[10px] font-black text-[var(--cordel-wood,#8b2a1a)]">✗</span>}
                </div>

                <button type="button" onClick={() => onClickSlot && onClickSlot(m, assigned)} className="flex flex-col items-center justify-center w-full flex-1 overflow-hidden cursor-pointer" title={assigned ? 'Taper pour vider cette case' : 'Taper pour sélectionner cette case [ ? ]'}>
                  {assigned ? (
                    <>
                      {assigned.imageUrl ? <img src={assigned.imageUrl} alt={assigned.name} className="w-6 h-6 object-cover rounded border border-encre-noire/20" /> : <span className="text-sm leading-none">✋</span>}
                      <span className="text-[8.5px] font-black text-center leading-tight truncate w-full mt-0.5 text-encre-noire">{assigned.name}</span>
                    </>
                  ) : (
                    <span className="text-xs font-black text-cordel-wood">[ ? ]</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Bac à Signaux (clic-clic mobile + drag-and-drop PC) */}
      <div className="p-3 rounded-lg bg-[#fdfaf2] border-2 border-dashed border-cordel-master-dark/30 flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🖐️</span><span>{t('pedagogy.reflex.signalTrayTitle')}</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {signalTray.map((sig) => {
            const isPicked = selectedTraySignal?.id === sig.id;
            return (
              <button
                key={sig.id} type="button" draggable
                onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(sig))}
                onClick={() => onClickTraySignal && onClickTraySignal(sig)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 text-xs font-black cursor-pointer transition-all ${isPicked ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-encre-noire shadow-xs scale-105' : 'bg-white text-encre-noire border-encre-noire hover:bg-amber-50 shadow-[1.5px_1.5px_0px_0px_#181716]'}`}
              >
                {sig.imageUrl ? <img src={sig.imageUrl} alt={sig.name} className="w-6 h-6 object-cover rounded border border-encre-noire/20" /> : <span>✋</span>}
                <span>{sig.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
