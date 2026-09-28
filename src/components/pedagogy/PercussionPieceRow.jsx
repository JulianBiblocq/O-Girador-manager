// Ligne synthétique d'un morceau de répertoire de percussion avec accordéon des variations
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useState } from 'react';
import {
  PERCUSSION_FAMILIES,
  computeFamilyComfort,
  resolvePieceVariationsAndBreaks
} from '../../utils/pedagogyDashboardCalculations';

export default function PercussionPieceRow({
  piece,
  familyUsersMap = {},
  evaluationsMap = {},
  userAisanceMap = {},
  resolvedTrainings = [],
  revisionsCount = 0,
  onProgramDirect = null,
  onPinNote = null
}) {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Calcul du confort par famille
  const familyScores = {};
  let totalScore = 0;
  let countFamilies = 0;

  PERCUSSION_FAMILIES.forEach((f) => {
    const fUsers = familyUsersMap[f.id] || [];
    const score = computeFamilyComfort(piece, fUsers, evaluationsMap, userAisanceMap, resolvedTrainings);
    familyScores[f.id] = score;
    if (score !== null) {
      totalScore += score;
      countFamilies++;
    }
  });

  const globalScore = countFamilies > 0 ? Math.round(totalScore / countFamilies) : 0;
  const variations = resolvePieceVariationsAndBreaks(piece);

  const getHeatmapBadge = (score) => {
    if (score === null || score === undefined) {
      return <span className="text-encre-noire/30 font-bold text-[11px]">-</span>;
    }
    let bg = 'bg-[var(--color-cordel-vert)] text-white';
    if (score < 50) bg = 'bg-[var(--color-cordel-rouge)] text-white';
    else if (score < 75) bg = 'bg-[var(--color-cordel-ocre)] text-white';

    return (
      <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${bg} shadow-2xs`}>
        {score}%
      </span>
    );
  };

  return (
    <React.Fragment>
      <tr className="hover:bg-neutral-100/50 transition-colors border-b border-encre-noire/10">
        {/* Colonne 1 : Morceau */}
        <td className="p-2.5 font-bold text-encre-noire">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black">{piece.titre}</span>
              {revisionsCount > 0 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30 flex items-center gap-0.5">
                  <span>🙋</span>
                  <span>{revisionsCount}</span>
                </span>
              )}
            </div>
            {piece.statutSaison && (
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-encre-noire/50">
                Saison officielle
              </span>
            )}
          </div>
        </td>

        {/* Colonne 2 : Score Global */}
        <td className="p-2.5 text-center font-black">
          {getHeatmapBadge(countFamilies > 0 ? globalScore : null)}
        </td>

        {/* Colonnes 3-6 : Familles d'instruments */}
        {PERCUSSION_FAMILIES.map((f) => (
          <td key={f.id} className="p-2.5 text-center">
            {getHeatmapBadge(familyScores[f.id])}
          </td>
        ))}

        {/* Colonne 7 : Actions & Dépliage accordéon */}
        <td className="p-2.5 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-encre-noire/30 rounded hover:bg-neutral-100 cursor-pointer shadow-2xs flex items-center gap-1"
              title="Voir le détail des variations et breaks"
            >
              <span>{isOpen ? '▲' : '▼'}</span>
              <span>{variations.length} var.</span>
            </button>

            {onProgramDirect && (
              <button
                type="button"
                onClick={() => onProgramDirect(piece)}
                className="text-[10px] font-black px-1.5 py-1 bg-[var(--color-cordel-vert)] text-white border border-[#1b4332] rounded hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Programmer directement en répétition"
              >
                ⚡
              </button>
            )}

            {onPinNote && (globalScore < 75 || revisionsCount > 0) && (
              <button
                type="button"
                onClick={() => onPinNote(piece.titre, 'Percussion', revisionsCount)}
                className="text-[10px] font-black px-1.5 py-1 bg-white text-encre-noire border border-encre-noire/30 rounded hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Épingler au bloc-notes"
              >
                📌
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Accordéon repliable des variations et breaks (fermé par défaut) */}
      {isOpen && (
        <tr className="bg-amber-50/40 border-b-2 border-encre-noire/20 animate-fadeIn">
          <td colSpan={7} className="p-3 pl-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-cordel-wood tracking-wider flex items-center gap-1">
                <span>📑</span>
                <span>Détail des Variations &amp; Conventions ({variations.length}) :</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {variations.map((v) => (
                  <div
                    key={v.id}
                    className="p-2 bg-white border border-dashed border-encre-noire/20 rounded flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px]">
                        {v.type === 'break' ? '🛑' : v.type === 'base' ? '🥁' : '🔄'}
                      </span>
                      <span className="font-bold text-encre-noire truncate">{v.nom}</span>
                    </div>
                    <span className="text-[9px] font-bold text-encre-noire/50 uppercase ml-2 shrink-0">
                      {v.type === 'break' ? 'Signal' : 'Motif'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
