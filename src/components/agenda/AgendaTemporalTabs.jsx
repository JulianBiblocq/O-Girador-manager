import React from 'react';

/**
 * Composant de navigation temporelle et de filtrage par saison de l'Agenda.
 * 
 * Responsabilités :
 * 1. Sélecteur d'état exclusif à deux onglets : [ 📅 À venir ] et [ 🏛️ Passés ].
 * 2. Bandeau contextuel de sélection de saison pour les événements passés.
 * 3. Gestion de l'option « Toutes les saisons » avec plafonnement réactif.
 * 4. Message bienveillant et raccourci direct vers la saison N-1 si la saison courante n'a pas d'archives.
 * 
 * @param {Object} props Propriétés du composant
 * @param {'upcoming'|'past'} props.temporalTab Onglet actif ('upcoming' ou 'past')
 * @param {Function} props.setTemporalTab Modificateur d'onglet
 * @param {number} props.upcomingCount Nombre d'événements à venir après filtrage
 * @param {number} props.pastCount Nombre total d'événements passés
 * @param {string} props.currentSeason Saison courante calculée (ex. "2026-2027")
 * @param {string} props.previousSeason Saison précédente calculée (ex. "2025-2026")
 * @param {string|null} props.selectedPastSeason Saison passée actuellement filtrée (null = saison courante)
 * @param {Function} props.setSelectedPastSeason Modificateur de saison passée
 * @param {Array<string>} props.pastSeasonOptions Liste des saisons disponibles ordonnées par ordre antéchronologique
 * @param {number} props.pastInCurrentSeasonCount Nombre d'événements passés sur la saison courante
 * @param {number} props.pastSeasonCount Nombre d'événements passés actuellement visibles
 * @param {number} props.totalPastEventsCount Nombre total d'événements passés sans filtre de saison
 * @param {Function} props.t Fonction de traduction
 */
export default function AgendaTemporalTabs({
  temporalTab,
  setTemporalTab,
  upcomingCount = 0,
  pastCount = 0,
  currentSeason,
  previousSeason,
  selectedPastSeason,
  setSelectedPastSeason,
  pastSeasonOptions = [],
  pastInCurrentSeasonCount = 0,
  pastSeasonCount = 0,
  totalPastEventsCount = 0,
  t
}) {
  const activePastSeason = selectedPastSeason || currentSeason;

  return (
    <div className="flex flex-col gap-2.5 w-full select-none">
      {/* 1. Sélecteur d'état exclusif : À venir vs Passés */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center border-2 border-encre-noire rounded-[6px_9px_5px_8px] overflow-hidden bg-cordel-bg shadow-[2px_2px_0px_0px_#181716] text-xs font-extrabold uppercase">
          <button
            type="button"
            onClick={() => setTemporalTab('upcoming')}
            className={`px-3 py-1.5 cursor-pointer transition-all flex items-center gap-1.5 ${
              temporalTab === 'upcoming'
                ? 'bg-cordel-wood text-white font-black'
                : 'bg-cordel-bg-light text-encre-noire hover:bg-amber-100/60'
            }`}
            title={t('agendaTemporal.upcomingTab') || "Événements à venir"}
          >
            <span className="text-sm">📅</span>
            <span>{t('agendaTemporal.upcomingTab') || "À venir"}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              temporalTab === 'upcoming' 
                ? 'bg-white/20 text-white' 
                : 'bg-cordel-master-dark/10 text-encre-noire'
            }`}>
              {upcomingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTemporalTab('past')}
            className={`px-3 py-1.5 cursor-pointer transition-all border-l-2 border-encre-noire flex items-center gap-1.5 ${
              temporalTab === 'past'
                ? 'bg-cordel-wood text-white font-black'
                : 'bg-cordel-bg-light text-encre-noire hover:bg-amber-100/60'
            }`}
            title={t('agendaTemporal.pastTab') || "Événements passés"}
          >
            <span className="text-sm">🏛️</span>
            <span>{t('agendaTemporal.pastTab') || "Passés"}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              temporalTab === 'past' 
                ? 'bg-white/20 text-white' 
                : 'bg-cordel-master-dark/10 text-encre-noire'
            }`}>
              {pastCount}
            </span>
          </button>
        </div>

        {/* Indication contextuelle discrète pour le mode Passés */}
        {temporalTab === 'past' && (
          <div className="text-[11px] font-bold text-encre-noire/70 flex items-center gap-1">
            <span>🏛️</span>
            <span>
              {activePastSeason === 'all'
                ? (t('agendaTemporal.allSeasons') || 'Toutes les saisons')
                : `${t('agendaTemporal.seasonLabel') || 'Saison'} ${activePastSeason}`
              }
            </span>
            <span className="opacity-60 font-semibold">
              ({pastSeasonCount} {t('agendaTemporal.pastEventsCount') || 'événement(s)'})
            </span>
          </div>
        )}
      </div>

      {/* 2. Navigation par saison (visible exclusivement en mode Passés) */}
      {temporalTab === 'past' && (
        <div className="flex flex-col gap-2 p-2.5 bg-cordel-master-light/10 border-2 border-dashed border-cordel-master-dark/30 rounded-[8px_11px_7px_10px]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
              <span>📜</span>
              <span>{t('agendaTemporal.seasonLabel') || "Saison archivée :"}</span>
            </span>

            {/* Pilules des saisons disponibles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {pastSeasonOptions.map((season) => {
                const isSelected = activePastSeason === season;
                const isCurrent = season === currentSeason;
                
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => setSelectedPastSeason(season)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-[5px_7px_4px_6px] border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] font-black'
                        : 'bg-cordel-bg-light text-encre-noire border-encre-noire/30 hover:bg-amber-100/60'
                    }`}
                  >
                    <span>{season}</span>
                    {isCurrent && (
                      <span className={`text-[8px] font-black px-1 py-0.2 rounded ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-cordel-wood/15 text-cordel-wood'
                      }`}>
                        {t('agendaTemporal.currentSeasonBadge') || "En cours"}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Option "Toutes les saisons" (plafonnée à 30 événements) */}
              <button
                type="button"
                onClick={() => setSelectedPastSeason('all')}
                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-[5px_7px_4px_6px] border transition-all cursor-pointer flex items-center gap-1 ${
                  activePastSeason === 'all'
                    ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] font-black'
                    : 'bg-cordel-bg-light text-encre-noire border-encre-noire/30 hover:bg-amber-100/60'
                }`}
              >
                <span>{t('agendaTemporal.allSeasons') || "Toutes les saisons"}</span>
              </button>
            </div>
          </div>

          {/* Note sur le plafonnement aux 30 derniers événements si "Toutes les saisons" est actif */}
          {activePastSeason === 'all' && totalPastEventsCount > 30 && (
            <div className="text-[10px] font-semibold text-encre-noire/70 bg-amber-100/70 border border-amber-300 rounded px-2 py-1 flex items-center gap-1.5">
              <span>⚡</span>
              <span>{t('agendaTemporal.cappedPastNotice') || "Affichage limité aux 30 derniers événements passés pour garantir la fluidité."}</span>
            </div>
          )}

          {/* 3. Message bienveillant si la saison courante ne compte aucun événement passé */}
          {activePastSeason === currentSeason && pastInCurrentSeasonCount === 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_9px_5px_8px] shadow-[2px_2px_0px_0px_#181716] mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍂</span>
                <span className="text-xs font-bold text-encre-noire">
                  {(t('agendaTemporal.noPastInCurrentSeason') || "Aucun événement passé pour la saison en cours ({{season}}).")
                    .replace('{{season}}', currentSeason)}
                </span>
              </div>

              {previousSeason && (
                <button
                  type="button"
                  onClick={() => setSelectedPastSeason(previousSeason)}
                  className="px-3 py-1.5 bg-cordel-wood text-white text-xs font-extrabold uppercase rounded-[5px_7px_4px_6px] border-2 border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:bg-cordel-wood/90 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>📜</span>
                  <span>
                    {(t('agendaTemporal.goToPreviousSeason') || "Consulter la saison précédente ({{prevSeason}})")
                      .replace('{{prevSeason}}', previousSeason)}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
