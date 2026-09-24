import React, { useRef, useEffect } from 'react';
import ConductorMeasureSlot from './ConductorMeasureSlot';

/**
 * Frise chronologique (Timeline) du jeu du Conducteur à trous.
 * Découpe horizontale par blocs de mesures, scrollable sur mobile.
 *
 * @param {Object} props
 * @param {number} props.totalMeasures - Nombre total de mesures sur la frise
 * @param {Object} props.slotsByMeasure - Table des emplacements de signaux par mesure
 * @param {Object} props.userSlots - Table des signaux choisis par l'élève ({ [mesure]: signal })
 * @param {Object|null} props.validationResults - Table de validation ({ [mesure]: boolean })
 * @param {number|null} props.currentPlayheadMeasure - Mesure active en lecture audio
 * @param {Function} props.onClickSlot - Clic sur un emplacement
 */
export default function ConductorTimeline({
  totalMeasures = 16,
  slotsByMeasure = {},
  userSlots = {},
  validationResults = null,
  currentPlayheadMeasure = null,
  onClickSlot
}) {
  const containerRef = useRef(null);

  // Auto-scroll doux pour suivre la tête de lecture si l'audio défile
  useEffect(() => {
    if (!currentPlayheadMeasure || !containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-measure="${currentPlayheadMeasure}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentPlayheadMeasure]);

  const measuresArray = Array.from({ length: totalMeasures }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/70 flex items-center gap-1.5">
          <span>📜</span>
          <span>Frise Chronologique ({totalMeasures} mesures)</span>
        </span>
        <span className="text-[9px] font-bold text-encre-noire/50 italic">
          ↔ Défilement horizontal
        </span>
      </div>

      {/* Rail horizontal scrollable avec design Cordel */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto p-3 bg-cordel-bg-light/90 border-2 border-encre-noire rounded-lg shadow-inner varal-scrollbar flex items-center gap-1.5 select-none"
      >
        {measuresArray.map((m) => {
          const slot = slotsByMeasure[m] || null;
          const assignedSignal = userSlots[m] || null;
          const validation = validationResults ? validationResults[m] : null;
          const isPlayhead = currentPlayheadMeasure === m;

          return (
            <div key={m} data-measure={m} className="shrink-0">
              <ConductorMeasureSlot
                measure={m}
                slot={slot}
                assignedSignal={assignedSignal}
                validation={validation}
                isCurrentPlayhead={isPlayhead}
                onClickSlot={onClickSlot}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
