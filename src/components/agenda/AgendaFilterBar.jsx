import React from 'react';
import { XiloEye, XiloEyeOff } from '../XiloIcons';

/**
 * Calcule le résumé visuel des filtres actifs de l'Agenda pour le bouton tiroir mobile.
 */
export function getActiveAgendaFilterSummary({ disciplineFilter, selectedTypeFilter, hiddenTypes = [], t }) {
  const activeLabels = [];
  if (disciplineFilter === 'percussion') {
    activeLabels.push(t ? t('agendaFilter.percussion') : 'Percussion');
  } else if (disciplineFilter === 'dance') {
    activeLabels.push(t ? t('agendaFilter.dance') : 'Danse');
  }

  const standardTypes = {
    prestation: t ? t('widgetAgenda.typePrestation') : 'Prestation',
    repetition: t ? t('widgetAgenda.typeRepetition') : 'Répétition',
    stage: t ? t('widgetAgenda.typeStage') : 'Stage',
    atelier: t ? t('widgetAgenda.typeAtelier') : 'Atelier',
    reunion: t ? t('widgetAgenda.typeReunion') : 'Réunion'
  };

  if (selectedTypeFilter && selectedTypeFilter !== 'all' && selectedTypeFilter !== 'custom') {
    activeLabels.push(standardTypes[selectedTypeFilter] || selectedTypeFilter);
  } else if (Array.isArray(hiddenTypes) && hiddenTypes.length > 0) {
    activeLabels.push(`${hiddenTypes.length} masqué${hiddenTypes.length > 1 ? 's' : ''}`);
  }

  return {
    hasActiveFilter: activeLabels.length > 0,
    activeCount: activeLabels.length,
    summaryText: activeLabels.length > 0 ? `${activeLabels.join(' • ')} (${activeLabels.length})` : ''
  };
}

/**
 * Barre de filtrage à 2 étages pour l'Agenda (Discipline + Type d'événement).
 * Sur PC/Tablette (>= 768px), affichée directement en ligne.
 * Sur Mobile (< 768px), affichée dans un tiroir replié par défaut commandé depuis l'en-tête.
 */
export default function AgendaFilterBar({
  disciplineFilter,
  setDisciplineFilter,
  selectedTypeFilter,
  setSelectedTypeFilter,
  hiddenTypes,
  setHiddenTypes,
  eventTypes,
  isMobileOpen = false,
  t
}) {
  return (
    <div
      className={`${
        isMobileOpen
          ? 'flex max-md:p-2.5 max-md:bg-cordel-bg-light max-md:border-2 max-md:border-encre-noire max-md:rounded-[6px_10px_6px_8px] max-md:shadow-[2px_2px_0px_0px_#181716]'
          : 'hidden md:flex'
      } flex-col gap-2 select-none text-[9px] font-black uppercase mt-1 pl-1`}
    >
      {/* Étage 1 : Filtrage par Discipline (Percussion / Danse) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-extrabold tracking-wider text-cordel-master-dark/60 mr-1 uppercase">
          {t ? t('agendaFilter.disciplineLabel') : 'Discipline :'}
        </span>

        {/* Option Toutes */}
        <button
          type="button"
          onClick={() => setDisciplineFilter('all')}
          className={`px-3 py-1 rounded-[4px_6px_3px_5px] border transition-all cursor-pointer flex items-center gap-1 ${
            disciplineFilter === 'all'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
              : 'bg-white border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-neutral-100'
          }`}
        >
          <span>{t ? t('agendaFilter.allDisciplines') : 'Toutes'}</span>
        </button>

        {/* Option Percussion */}
        <button
          type="button"
          onClick={() => setDisciplineFilter('percussion')}
          className={`px-3 py-1 rounded-[4px_6px_3px_5px] border transition-all cursor-pointer flex items-center gap-1.5 ${
            disciplineFilter === 'percussion'
              ? 'bg-amber-700 text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
              : 'bg-amber-50/90 border-dashed border-amber-300 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <img src="/icones/alfaia.svg" alt="Percussion" className={`w-3 h-3 object-contain inline-block shrink-0 ${disciplineFilter === 'percussion' ? 'invert' : ''}`} />
          <span>{t ? t('agendaFilter.percussion') : 'Percussion'}</span>
        </button>

        {/* Option Danse */}
        <button
          type="button"
          onClick={() => setDisciplineFilter('dance')}
          className={`px-3 py-1 rounded-[4px_6px_3px_5px] border transition-all cursor-pointer flex items-center gap-1.5 ${
            disciplineFilter === 'dance'
              ? 'bg-pink-700 text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
              : 'bg-pink-50/90 border-dashed border-pink-300 text-pink-900 hover:bg-pink-100'
          }`}
        >
          <span className="text-[11px]">💃</span>
          <span>{t ? t('agendaFilter.dance') : 'Danse'}</span>
        </button>
      </div>

      {/* Étage 2 : Filtrage par Type d'événement */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-dashed border-cordel-master-dark/15">
        <span className="text-[9px] font-extrabold tracking-wider text-cordel-master-dark/60 mr-1 uppercase">
          {t ? t('agendaFilter.typeLabel') : 'Type :'}
        </span>

        {/* Type Filtrer "Tous" */}
        <button
          type="button"
          onClick={() => {
            setSelectedTypeFilter('all');
            setHiddenTypes([]);
          }}
          className={`px-3 py-1 rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTypeFilter === 'all' && hiddenTypes.length === 0
              ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
              : 'bg-white border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-neutral-100'
          }`}
        >
          {t ? t('common.all') : 'Tous'}
        </button>

        {/* Boutons dynamiques par type d'événement */}
        {eventTypes.map(type => {
          const standardTypes = {
            prestation: t ? t('widgetAgenda.typePrestation') : 'Prestation',
            repetition: t ? t('widgetAgenda.typeRepetition') : 'Répétition',
            stage: t ? t('widgetAgenda.typeStage') : 'Stage',
            atelier: t ? t('widgetAgenda.typeAtelier') : 'Atelier',
            reunion: t ? t('widgetAgenda.typeReunion') : 'Réunion'
          };
          const labelRaw = standardTypes[type];
          const label = labelRaw || (type.charAt(0).toUpperCase() + type.slice(1));
          const isHidden = hiddenTypes.includes(type);
          const isFocused = selectedTypeFilter === type && hiddenTypes.length === eventTypes.length - 1;

          const handleTextClick = () => {
            if (isFocused) {
              setSelectedTypeFilter('all');
              setHiddenTypes([]);
            } else {
              setSelectedTypeFilter(type);
              setHiddenTypes(eventTypes.filter(tItem => tItem !== type));
            }
          };

          const handleToggleHide = (e) => {
            e.stopPropagation();
            if (isHidden) {
              const nextHidden = hiddenTypes.filter(tItem => tItem !== type);
              setHiddenTypes(nextHidden);
              if (nextHidden.length === 0) {
                setSelectedTypeFilter('all');
              } else {
                setSelectedTypeFilter('custom');
              }
            } else {
              const nextHidden = [...hiddenTypes, type];
              setHiddenTypes(nextHidden);
              if (nextHidden.length === eventTypes.length - 1) {
                const remaining = eventTypes.find(tItem => !nextHidden.includes(tItem));
                setSelectedTypeFilter(remaining || 'custom');
              } else {
                setSelectedTypeFilter('custom');
              }
            }
          };

          return (
            <div
              key={type}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px_6px_3px_5px] border transition-all ${
                isHidden
                  ? 'bg-neutral-200/70 border-dashed border-neutral-400 text-neutral-400 line-through opacity-65'
                  : isFocused || (selectedTypeFilter === type && hiddenTypes.length === 0)
                    ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                    : 'bg-white border-dashed border-cordel-master-dark/30 text-cordel-master-dark hover:bg-neutral-100'
              }`}
            >
              <button
                type="button"
                onClick={handleTextClick}
                title={`Voir uniquement ${label}`}
                className="cursor-pointer font-extrabold hover:underline"
              >
                {label}
              </button>

              <button
                type="button"
                onClick={handleToggleHide}
                title={isHidden ? `Afficher les ${label}s` : `Masquer les ${label}s`}
                className="cursor-pointer ml-0.5 opacity-80 hover:opacity-100 hover:scale-110 transition-transform p-0.5 select-none flex items-center justify-center"
              >
                {isHidden ? (
                  <XiloEyeOff size={13} className="shrink-0 opacity-60" />
                ) : (
                  <XiloEye size={13} className="shrink-0" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
