// Tableau synthétique de Percussion à l'échelle Morceau de saison
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import PercussionPieceRow from './PercussionPieceRow';
import { PERCUSSION_FAMILIES, getUsersForFamily } from '../../utils/pedagogyDashboardCalculations';

export default function PercussionRepertoireAnalytics({
  repertoire = [],
  percuUsers = [],
  evaluationsMap = {},
  userAisanceMap = {},
  resolvedTrainings = [],
  revisionsCountMap = {},
  onProgramDirect = null,
  onPinNote = null
}) {
  // 1. Filtrage sur les morceaux officiels de la saison (ou non archivés)
  const seasonPieces = useMemo(() => {
    const saisons = (repertoire || []).filter((p) => p.statutSaison === 'saison');
    if (saisons.length > 0) return saisons;
    const active = (repertoire || []).filter((p) => p.statutSaison !== 'archive' && !p.isArchived);
    return active.length > 0 ? active : repertoire || [];
  }, [repertoire]);

  // 2. Découpage préalable des adhérents par famille de percussion
  const familyUsersMap = useMemo(() => {
    const map = {};
    PERCUSSION_FAMILIES.forEach((f) => {
      map[f.id] = getUsersForFamily(f.id, percuUsers);
    });
    return map;
  }, [percuUsers]);

  if (seasonPieces.length === 0) {
    return (
      <CordelCard variant="default" className="p-8 text-center text-xs font-bold text-cordel-master-dark/60 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
        <span className="text-3xl block mb-2">🥁</span>
        <p className="text-sm font-black uppercase text-encre-noire mb-1">
          Aucun morceau officiel de saison
        </p>
        <p className="text-xs text-encre-noire/60">
          Ajoutez des morceaux dans le Répertoire de l'association ou assignez-leur le statut « En saison » pour visualiser la matrice de confort par famille d'instruments.
        </p>
      </CordelCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* En-tête explicatif synthétique */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-white border border-dashed border-encre-noire/20 rounded shadow-xs">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🥁</span>
            <span>Matrice Percussion de Saison ({seasonPieces.length} morceaux)</span>
          </h3>
          <p className="text-[10.5px] font-bold text-encre-noire/70 mt-0.5">
            1 ligne par morceau • Synthèse du niveau de confort de la troupe par famille d'instruments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white shadow-2xs">
            ≥ 75% À l'aise
          </span>
          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-cordel-ocre)] text-white shadow-2xs">
            50-74% Travail
          </span>
          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-cordel-rouge)] text-white shadow-2xs">
            &lt; 50% Fragile
          </span>
        </div>
      </div>

      {/* Tableau synthétique */}
      <div className="w-full overflow-x-auto bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30 rounded-xl p-3 shadow-xs">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead>
            <tr className="border-b-2 border-encre-noire/20">
              <th className="p-2 font-black uppercase tracking-widest text-cordel-wood">
                Morceau de Saison
              </th>
              <th className="p-2 font-black uppercase tracking-widest text-center text-encre-noire/60">
                Global
              </th>
              {PERCUSSION_FAMILIES.map((f) => (
                <th key={f.id} className="p-2 font-bold uppercase text-center text-encre-noire">
                  <span className="flex items-center justify-center gap-1">
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </span>
                </th>
              ))}
              <th className="p-2 font-black uppercase tracking-widest text-right text-encre-noire/60">
                Détail &amp; Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {seasonPieces.map((piece) => (
              <PercussionPieceRow
                key={piece.id}
                piece={piece}
                familyUsersMap={familyUsersMap}
                evaluationsMap={evaluationsMap}
                userAisanceMap={userAisanceMap}
                resolvedTrainings={resolvedTrainings}
                revisionsCount={revisionsCountMap[piece.id] || 0}
                onProgramDirect={onProgramDirect}
                onPinNote={onPinNote}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
