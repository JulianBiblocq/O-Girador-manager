// Vue synthétique macro de la dynamique d'entraînement de la troupe
// Règle anti-monolithe (< 200 lignes) - Zéro listing nominatif, vision globale troupe

import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import EntrainementSegmentsBar from './EntrainementSegmentsBar';

export default function EntrainementMacroAnalytics({
  usersData = [],
  resolvedTrainings = [],
  userAisanceMap = {},
  evaluationsMap = {},
  pupitres = []
}) {
  const [selectedPupitre, setSelectedPupitre] = useState('ALL');

  // Filtrage éventuel des membres par pupitre
  const filteredUsers = useMemo(() => {
    if (selectedPupitre === 'ALL') return usersData;
    return usersData.filter((u) => {
      const userPupitre = (u.instrument || u.instrumentPrincipal || u.pupitre || '').trim();
      return userPupitre.toLowerCase() === selectedPupitre.toLowerCase();
    });
  }, [usersData, selectedPupitre]);

  const totalMembers = filteredUsers.length;

  // Calculs macro d'assiduité, de complétion et de répartition
  const metrics = useMemo(() => {
    if (totalMembers === 0) {
      return {
        assiduitePct: 0,
        completionPct: 0,
        totalValidatedStages: 0,
        activeCount: 0,
        segments: { decouverte: 0, pratique: 0, alaise: 0, referent: 0 },
        pctSegments: { decouverte: 0, pratique: 0, alaise: 0, referent: 0 }
      };
    }

    const totalStagesPerUser = resolvedTrainings.reduce(
      (sum, t) => sum + (t.stages?.length || 0),
      0
    );
    const totalSlots = totalStagesPerUser * totalMembers;

    let activeCount = 0;
    let totalValidatedStages = 0;
    const segments = { decouverte: 0, pratique: 0, alaise: 0, referent: 0 };

    filteredUsers.forEach((u) => {
      const uAisance = userAisanceMap[u.id] || {};
      const uEvals = evaluationsMap[u.id] || {};

      let userStagesCount = 0;
      Object.values(uAisance).forEach((stages) => {
        if (Array.isArray(stages)) userStagesCount += stages.length;
      });

      const hasEval = Object.keys(uEvals).length > 0;
      if (userStagesCount > 0 || hasEval) activeCount++;
      totalValidatedStages += userStagesCount;

      // Répartition macro en 4 segments Cordel
      if (totalStagesPerUser > 0) {
        const ratio = userStagesCount / totalStagesPerUser;
        if (userStagesCount === 0) segments.decouverte++;
        else if (ratio < 0.35) segments.pratique++;
        else if (ratio < 0.80) segments.alaise++;
        else segments.referent++;
      } else {
        const evalValues = Object.values(uEvals);
        if (evalValues.length === 0) segments.decouverte++;
        else if (evalValues.includes('referent')) segments.referent++;
        else if (evalValues.includes('alaise') || evalValues.includes('oui')) segments.alaise++;
        else segments.pratique++;
      }
    });

    const assiduitePct = Math.round((activeCount / totalMembers) * 100);
    const completionPct = totalSlots > 0 ? Math.round((totalValidatedStages / totalSlots) * 100) : 0;

    const pctSegments = {
      decouverte: Math.round((segments.decouverte / totalMembers) * 100),
      pratique: Math.round((segments.pratique / totalMembers) * 100),
      alaise: Math.round((segments.alaise / totalMembers) * 100),
      referent: Math.round((segments.referent / totalMembers) * 100)
    };

    return {
      assiduitePct,
      completionPct,
      totalValidatedStages,
      activeCount,
      segments,
      pctSegments
    };
  }, [filteredUsers, resolvedTrainings, userAisanceMap, evaluationsMap, totalMembers]);

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
      {/* En-tête et filtre de pupitre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dashed border-cordel-master-dark/20 pb-3 gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire flex items-center gap-2">
            <span>⚡</span>
            <span>Dynamique d'Entraînement de la Troupe</span>
          </h3>
          <p className="text-[10.5px] font-bold text-encre-noire/70 mt-0.5">
            Indicateur macro de l'assiduité métronomique et de la progression collective (vue anonymisée).
          </p>
        </div>

        {pupitres.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-encre-noire/60">Pupitre :</span>
            <select
              value={selectedPupitre}
              onChange={(e) => setSelectedPupitre(e.target.value)}
              className="px-2 py-1 text-xs font-black bg-white border border-encre-noire/30 rounded cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tous les pupitres ({usersData.length})</option>
              {pupitres.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trio d'indicateurs synthétiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-encre-noire/20 rounded flex flex-col gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
            🎯 Assiduité Troupe
          </span>
          <span className="text-2xl font-black text-encre-noire">
            {metrics.assiduitePct}%
          </span>
          <span className="text-[10px] font-bold text-encre-noire/60">
            {metrics.activeCount} / {totalMembers} membres engagés
          </span>
        </div>

        <div className="p-3.5 bg-white border border-encre-noire/20 rounded flex flex-col gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-vert)]">
            📊 Complétion Paliers
          </span>
          <span className="text-2xl font-black text-[var(--color-cordel-vert)]">
            {metrics.completionPct}%
          </span>
          <span className="text-[10px] font-bold text-encre-noire/60">
            Taux global de paliers métronomiques validés
          </span>
        </div>

        <div className="p-3.5 bg-white border border-encre-noire/20 rounded flex flex-col gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-ocre)]">
            ⚡ Paliers Franchis
          </span>
          <span className="text-2xl font-black text-[var(--color-cordel-ocre)]">
            {metrics.totalValidatedStages}
          </span>
          <span className="text-[10px] font-bold text-encre-noire/60">
            Sur {resolvedTrainings.length} morceau{resolvedTrainings.length > 1 ? 'x' : ''} actif{resolvedTrainings.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Ruban horizontal et répartition macro */}
      <EntrainementSegmentsBar metrics={metrics} totalMembers={totalMembers} />

      {/* Rappel concis des morceaux d'entraînement actifs (zéro nom d'élève) */}
      {resolvedTrainings.length > 0 && (
        <div className="pt-2 border-t border-dashed border-cordel-master-dark/15 flex flex-wrap gap-2 items-center">
          <span className="text-[9.5px] font-black uppercase text-encre-noire/60 tracking-wider">
            Morceaux à l'étude :
          </span>
          {resolvedTrainings.map((t) => {
            const stagesCount = t.stages?.length || 0;
            return (
              <span
                key={t.id}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-encre-noire/20 text-encre-noire shadow-2xs"
              >
                🎵 {t.repertoireTitle} ({stagesCount} paliers)
              </span>
            );
          })}
        </div>
      )}
    </CordelCard>
  );
}
