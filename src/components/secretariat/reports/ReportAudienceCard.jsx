import React from 'react';

/**
 * Sous-composant : ReportAudienceCard
 * 
 * Carte thématique Cordel affichant l'audience et le rayonnement de la Vitrine publique :
 * - Compteur de consultations uniques de la vitrine (associations/{groupId}.vitrineViews).
 * - Demandes de prestations / booking reçues via le formulaire public.
 * - Volume et taux de concrétisation en devis/contrats/prestations validées.
 * 
 * @param {Object} props
 * @param {Object} props.audienceStats Données calculées par secretariatMetrics.js
 * @param {string} [props.className] Classes CSS additionnelles
 */
export default function ReportAudienceCard({ audienceStats = {}, className = '' }) {
  const {
    vitrineViews = 0,
    vitrineRequestsTotal = 0,
    vitrineRequestsConverted = 0,
    conversionRate = 0
  } = audienceStats;

  return (
    <div className={`bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card text-left ${className}`}>
      {/* En-tête de la carte */}
      <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🌐</span>
            <span>Rayonnement & Vitrine Publique</span>
          </h3>
          <p className="text-[10px] text-encre-noire/70 font-medium">
            Trafic du site vitrine, demandes de dates reçues et concrétisation des sollicitations.
          </p>
        </div>

        <span className="hidden sm:inline-block text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-cordel-bg border border-encre-noire/30 rounded-[3px_5px_3px_4px] text-cordel-wood">
          Diffusion SaaS
        </span>
      </div>

      {/* Cartes métriques de rayonnement */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Consultations vitrine */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">
            Consultations vitrine
          </span>
          <span className="text-xl font-black text-cordel-wood mt-0.5">
            {vitrineViews.toLocaleString('fr-FR')}
          </span>
          <span className="text-[8.5px] text-encre-noire/60 font-medium mt-0.5">
            Visites uniques cumulées
          </span>
        </div>

        {/* 2. Demandes de booking reçues */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">
            Demandes reçues
          </span>
          <span className="text-xl font-black text-encre-noire mt-0.5">
            {vitrineRequestsTotal}
          </span>
          <span className="text-[8.5px] text-encre-noire/60 font-medium mt-0.5">
            Via le site public sur la période
          </span>
        </div>

        {/* 3. Concrétisation / Devis émis */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">
            Concrétisations
          </span>
          <span className="text-xl font-black text-[#2d6a4f] mt-0.5">
            {vitrineRequestsConverted} <span className="text-xs font-bold text-encre-noire/60">({conversionRate}%)</span>
          </span>
          <span className="text-[8.5px] text-[#2d6a4f] font-bold mt-0.5">
            Devis, contrats ou dates confirmées
          </span>
        </div>
      </div>

      {/* Jauge de concrétisation */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-cordel-master-dark/15">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-encre-noire/80">
            Taux de concrétisation des demandes du site web :
          </span>
          <span className="font-black text-[#2d6a4f]">
            {conversionRate}%
          </span>
        </div>

        <div className="w-full h-2.5 bg-cordel-bg border border-encre-noire/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2d6a4f] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, conversionRate))}%` }}
          />
        </div>
      </div>

      {/* Note explicative subvention */}
      <div className="text-[9px] font-medium text-encre-noire/60 bg-cordel-bg/50 border border-dashed border-cordel-master-dark/20 p-2 rounded flex items-center gap-1.5">
        <span>ℹ️</span>
        <span>
          Indicateur clé pour attester auprès des financeurs publics de la visibilité numérique et de la capacité de captation d'opportunités culturelles.
        </span>
      </div>
    </div>
  );
}
