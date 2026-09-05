import React from 'react';

/**
 * Sous-composant : ReportVolunteerCard
 * 
 * Carte thématique Cordel valorisant le volume d'heures de bénévolat selon la norme Cerfa n° 12156 :
 * - Compteur géant des heures de bénévolat valorisées (activité collective + forfaits statutaires).
 * - Heures cumulées de jeu en représentation publique (sur scène).
 * - Répartition détaillée en 3 pastilles d'activité.
 * 
 * @param {Object} props
 * @param {Object} props.volunteeringStats Données calculées par secretariatMetrics.js
 * @param {string} [props.className] Classes CSS additionnelles
 */
export default function ReportVolunteerCard({ volunteeringStats = {}, className = '' }) {
  const {
    totalPublicPlayingHours = 0,
    totalCollectiveVolunteerHours = 0,
    forfaitHeuresAdmin = 120,
    forfaitHeuresArtisanat = 80,
    totalCerfaVolunteerHours = 0,
    eventsAuditedCount = 0
  } = volunteeringStats;

  return (
    <div className={`bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card text-left ${className}`}>
      {/* En-tête de la carte */}
      <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🤝</span>
            <span>Bénévolat & Vie de Troupe (Cerfa 12156)</span>
          </h3>
          <p className="text-[10px] text-encre-noire/70 font-medium">
            Valorisation du temps bénévole et des représentations publiques pour les dossiers de subvention.
          </p>
        </div>

        <span className="hidden sm:inline-block text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-cordel-bg border border-encre-noire/30 rounded-[3px_5px_3px_4px] text-encre-noire/80">
          {eventsAuditedCount} événement{eventsAuditedCount > 1 ? 's' : ''} analysé{eventsAuditedCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Compteur géant du total bénévole Cerfa */}
      <div className="p-4 bg-emerald-50/90 border-2 border-[#2d6a4f]/50 rounded-[4px_8px_5px_7px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2d6a4f]">
            Volume Global Valorisable Cerfa
          </span>
          <span className="text-xs font-semibold text-emerald-950/80">
            Temps cumulé d'engagement associatif (heures-participants + forfaits statutaires)
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 self-end sm:self-center shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-[#2d6a4f] tracking-tight">
            {totalCerfaVolunteerHours.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-black uppercase text-[#2d6a4f]">heures</span>
        </div>
      </div>

      {/* Détail en 3 pastilles d'activité */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Heures d'activité collective */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">
              Activité collective
            </span>
            <span className="text-base font-black text-cordel-wood mt-0.5 block">
              {totalCollectiveVolunteerHours.toLocaleString('fr-FR')} h
            </span>
          </div>
          <span className="text-[8.5px] text-encre-noire/60 font-medium mt-1">
            Répétitions, ateliers, concerts & AG
          </span>
        </div>

        {/* 2. Heures de jeu public (sur scène) */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">
              Jeu en public (scène)
            </span>
            <span className="text-base font-black text-emerald-800 mt-0.5 block">
              {totalPublicPlayingHours} h
            </span>
          </div>
          <span className="text-[8.5px] text-emerald-900/70 font-medium mt-1">
            Durée cumulée des concerts & sorties
          </span>
        </div>

        {/* 3. Forfaits administratifs & artisanat */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">
              Forfaits bureau & atelier
            </span>
            <span className="text-base font-black text-[#c05621] mt-0.5 block">
              {forfaitHeuresAdmin + forfaitHeuresArtisanat} h
            </span>
          </div>
          <span className="text-[8.5px] text-[#c05621] font-medium mt-1">
            {forfaitHeuresAdmin}h gestion + {forfaitHeuresArtisanat}h lutherie/couture
          </span>
        </div>
      </div>

      {/* Note d'aide au dossier Cerfa */}
      <div className="text-[9px] font-medium text-encre-noire/60 bg-cordel-bg/50 border border-dashed border-cordel-master-dark/20 p-2 rounded flex items-center gap-1.5">
        <span>ℹ️</span>
        <span>
          Pour le Cerfa 12156, le bénévolat est valorisé au compte 864 / 875 (taux horaire indicatif SMIC chargé ou valorisation statutaire).
        </span>
      </div>
    </div>
  );
}
