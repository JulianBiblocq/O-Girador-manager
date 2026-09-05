import React from 'react';

/**
 * Sous-composant : ReportTerritoryCard
 * 
 * Carte thématique Cordel affichant l'ancrage territorial de l'association :
 * - Taux d'adhérents résidant dans la commune du siège vs extérieurs (dossier Cerfa n° 12156).
 * - Jauge proportionnelle bicolore Cordel (Vert communal vs Rouge extérieur).
 * - Top 5 des communes d'origine des membres actifs.
 * 
 * @param {Object} props
 * @param {Object} props.territorialStats Statistiques calculées par secretariatMetrics.js
 * @param {string} [props.className] Classes CSS additionnelles
 */
export default function ReportTerritoryCard({ territorialStats = {}, className = '' }) {
  const {
    totalAudited = 0,
    totalActiveMembers = 0,
    communeMembersCount = 0,
    communeMembersPercent = 0,
    externalMembersCount = 0,
    externalMembersPercent = 0,
    topCommunes = [],
    siegeCP = null,
    siegeVille = null
  } = territorialStats;

  return (
    <div className={`bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card text-left ${className}`}>
      {/* En-tête de la carte */}
      <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>📍</span>
            <span>Ancrage Territorial & Commune (Cerfa)</span>
          </h3>
          <p className="text-[10px] text-encre-noire/70 font-medium">
            Répartition géographique des adhérents par rapport au siège social associatif.
          </p>
        </div>

        {siegeVille && (
          <span className="hidden sm:inline-block text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-cordel-bg border border-encre-noire/30 rounded-[3px_5px_3px_4px] text-cordel-wood">
            Siège : {siegeVille} {siegeCP ? `(${siegeCP})` : ''}
          </span>
        )}
      </div>

      {/* Cartes métriques proportionnelles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Adhérents de la commune du siège */}
        <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">Commune siège</span>
          <span className="text-lg font-black text-[#2d6a4f]">
            {communeMembersCount} <span className="text-xs font-bold text-encre-noire/60">({communeMembersPercent}%)</span>
          </span>
          <span className="text-[8.5px] text-[#2d6a4f] font-bold mt-0.5">Critère subvention</span>
        </div>

        {/* Adhérents extérieurs */}
        <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">Communes extérieures</span>
          <span className="text-lg font-black text-[#8b2a1a]">
            {externalMembersCount} <span className="text-xs font-bold text-encre-noire/60">({externalMembersPercent}%)</span>
          </span>
          <span className="text-[8.5px] text-[#8b2a1a] font-bold mt-0.5">Rayonnement extra-communal</span>
        </div>

        {/* Total adhérents audités */}
        <div className="col-span-2 sm:col-span-1 p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">Adresses auditées</span>
          <span className="text-lg font-black text-cordel-wood">
            {totalAudited} <span className="text-xs font-bold text-encre-noire/50">/ {totalActiveMembers}</span>
          </span>
          <span className="text-[8.5px] text-encre-noire/60 font-medium mt-0.5">Fiches profils complètes</span>
        </div>
      </div>

      {/* Barre proportionnelle bicolore Cordel */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-cordel-master-dark/15">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-[#2d6a4f] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" />
            Commune ({communeMembersPercent}%)
          </span>
          <span className="text-[#8b2a1a] flex items-center gap-1">
            Extérieurs ({externalMembersPercent}%)
            <span className="w-2 h-2 rounded-full bg-[#8b2a1a]" />
          </span>
        </div>

        <div className="w-full h-3 bg-cordel-bg border border-encre-noire/30 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-[#2d6a4f] transition-all duration-500"
            style={{ width: `${communeMembersPercent}%` }}
            title={`Commune : ${communeMembersCount} adhérent(s)`}
          />
          <div
            className="h-full bg-[#8b2a1a] transition-all duration-500"
            style={{ width: `${externalMembersPercent}%` }}
            title={`Extérieurs : ${externalMembersCount} adhérent(s)`}
          />
        </div>
      </div>

      {/* Classement des principales communes représentées */}
      {topCommunes.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
          <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/70">
            Top communes des adhérents :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {topCommunes.map((c, idx) => (
              <span
                key={c.ville || idx}
                className="text-[10px] font-bold px-2.5 py-1 bg-cordel-bg border border-encre-noire/25 rounded-[3px_5px_4px_4px] text-encre-noire flex items-center gap-1.5 shadow-2xs"
              >
                <span className="text-cordel-wood font-black">{idx + 1}.</span>
                <span>{c.ville}</span>
                <span className="text-encre-noire/60 font-semibold">({c.count} • {c.percent}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
