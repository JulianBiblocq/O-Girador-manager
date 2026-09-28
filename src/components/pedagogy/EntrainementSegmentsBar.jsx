// Ruban de répartition macro et cartes statistiques anonymisées
// Règle anti-monolithe (< 200 lignes)

import React from 'react';

export default function EntrainementSegmentsBar({ metrics, totalMembers }) {
  const { pctSegments, segments } = metrics;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-encre-noire">
        <span>Répartition Macro de l'Aisance</span>
        <span className="text-encre-noire/60">{totalMembers} adhérents</span>
      </div>

      <div className="h-4 w-full bg-neutral-200 rounded overflow-hidden flex shadow-inner">
        <div
          style={{ width: `${pctSegments.referent}%` }}
          className="bg-[var(--color-cordel-vert)] h-full transition-all"
          title={`👑 Référent : ${pctSegments.referent}%`}
        />
        <div
          style={{ width: `${pctSegments.alaise}%` }}
          className="bg-[var(--color-cordel-ocre)] h-full transition-all"
          title={`🌳 À l'aise : ${pctSegments.alaise}%`}
        />
        <div
          style={{ width: `${pctSegments.pratique}%` }}
          className="bg-amber-400 h-full transition-all"
          title={`🌿 En pratique : ${pctSegments.pratique}%`}
        />
        <div
          style={{ width: `${pctSegments.decouverte}%` }}
          className="bg-neutral-300 h-full transition-all"
          title={`🌱 Découverte : ${pctSegments.decouverte}%`}
        />
      </div>

      {/* 4 Cartes de segments sans noms */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 bg-white border border-neutral-200 rounded flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-neutral-600">🌱 Découverte</span>
          <span className="text-lg font-black text-encre-noire">{pctSegments.decouverte}%</span>
          <span className="text-[9.5px] font-bold text-neutral-500">
            {segments.decouverte} membre{segments.decouverte > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-2.5 bg-amber-50/60 border border-amber-300/60 rounded flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-amber-800">🌿 En pratique</span>
          <span className="text-lg font-black text-amber-900">{pctSegments.pratique}%</span>
          <span className="text-[9.5px] font-bold text-amber-700">
            {segments.pratique} membre{segments.pratique > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-2.5 bg-orange-50/60 border border-orange-300/60 rounded flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-[var(--color-cordel-ocre)]">🌳 À l'aise</span>
          <span className="text-lg font-black text-[var(--color-cordel-ocre)]">{pctSegments.alaise}%</span>
          <span className="text-[9.5px] font-bold text-orange-700">
            {segments.alaise} membre{segments.alaise > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-2.5 bg-emerald-50/60 border border-emerald-300/60 rounded flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-[var(--color-cordel-vert)]">👑 Référent</span>
          <span className="text-lg font-black text-[var(--color-cordel-vert)]">{pctSegments.referent}%</span>
          <span className="text-[9.5px] font-bold text-emerald-700">
            {segments.referent} membre{segments.referent > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
