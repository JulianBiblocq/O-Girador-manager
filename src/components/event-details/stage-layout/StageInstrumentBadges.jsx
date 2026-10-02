import React from 'react';
import { getCompactInstrumentStats } from './stageLayoutUtils';

/**
 * En-tête compact des pupitres d'instruments
 * Affiche des cartouches d'étiquettes abrégées (ex: "4 Marc. | 1 Meio. | 1 Rep.")
 * avec flex-wrap pour s'adapter parfaitement à l'écran mobile sans déborder.
 *
 * @param {object} props
 * @param {object} props.activePlacements Placements actifs sur la scène
 * @param {Array} props.presentMembers Membres présents
 * @param {object} props.groupNomenclature Nomenclature personnalisée
 */
export default function StageInstrumentBadges({
  activePlacements,
  presentMembers,
  groupNomenclature
}) {
  const stats = getCompactInstrumentStats({
    activePlacements,
    presentMembers,
    groupNomenclature
  });

  const hasAnyBadge = stats.alfaiasBadge || stats.caixasBadge || stats.danceBadge;
  if (!hasAnyBadge) {
    return null;
  }

  return (
    <div className="w-full flex flex-wrap justify-center items-center gap-1.5 mb-2.5 select-none">
      {/* Badge compact Alfaias */}
      {stats.alfaiasBadge && (
        <div
          title={`Alfaias : ${stats.alfaiasBadge} (Total : ${stats.totalAlfaias})`}
          className="bg-cordel-wood/10 border border-cordel-wood text-cordel-wood text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5"
        >
          <span>🥁</span>
          <span className="font-extrabold">{stats.alfaiasBadge}</span>
          <span className="opacity-50 text-[8px]">({stats.totalAlfaias})</span>
        </div>
      )}

      {/* Badge compact Caixas */}
      {stats.caixasBadge && (
        <div
          title={`Caixas : ${stats.caixasBadge} (Total : ${stats.totalCaixas})`}
          className="bg-[#2d6a4f]/10 border border-[#2d6a4f] text-[#2d6a4f] text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5"
        >
          <span>🥁</span>
          <span className="font-extrabold">{stats.caixasBadge}</span>
          <span className="opacity-50 text-[8px]">({stats.totalCaixas})</span>
        </div>
      )}

      {/* Badge Danse si présente */}
      {stats.danceBadge && (
        <div
          title={`Danse : ${stats.totalDance} participant(s)`}
          className="bg-amber-500/10 border border-amber-600 text-amber-800 dark:text-amber-300 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5"
        >
          <span>💃</span>
          <span className="font-extrabold">{stats.danceBadge}</span>
        </div>
      )}
    </div>
  );
}
