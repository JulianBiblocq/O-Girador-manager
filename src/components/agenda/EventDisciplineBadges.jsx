import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * EventDisciplineBadges displays visual indicators for events including Percussion and/or Dance.
 * 
 * @param {Object} props
 * @param {Object} props.event - The event object containing includesPercussion and includesDance
 * @param {boolean} [props.compact=false] - Whether to render in ultra-compact mode for grids or tight spaces
 * @param {string} [props.className=''] - Optional additional CSS classes
 */
export default function EventDisciplineBadges({ event, compact = false, className = '' }) {
  const { t } = useTranslation();
  if (!event) return null;

  const { includesPercussion, includesDance } = event;

  if (!includesPercussion && !includesDance) return null;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 select-none ${className}`}>
        {includesPercussion && (
          <span 
            className="inline-flex items-center justify-center text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-extrabold leading-none"
            title={t('widgetAgenda.includesPercussionLabel') || "Inclut de la percussion"}
          >
            <img src="/icones/alfaia.svg" alt="Percussion" className="w-2.5 h-2.5 object-contain dark:invert inline-block shrink-0" />
          </span>
        )}
        {includesDance && (
          <span 
            className="inline-flex items-center justify-center text-[9px] px-1 py-0.2 rounded bg-pink-100 dark:bg-pink-950/60 text-pink-900 dark:text-pink-200 border border-pink-300 dark:border-pink-700/60 font-extrabold leading-none"
            title={t('widgetAgenda.includesDanceLabel') || "Inclut de la danse"}
          >
            💃
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap select-none ${className}`}>
      {includesPercussion && (
        <span 
          className="inline-flex items-center gap-1 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-[4px_6px_3px_5px] bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-[0.5px_0.5px_0px_0px_rgba(24,23,22,0.3)] leading-none"
          title={t('widgetAgenda.includesPercussionLabel') || "Événement avec percussion"}
        >
          <img src="/icones/alfaia.svg" alt="Percussion" className="w-3 h-3 object-contain dark:invert inline-block shrink-0" />
          <span className="hidden md:inline">{t('agendaFilter.percussion') || "Percussion"}</span>
        </span>
      )}
      {includesDance && (
        <span 
          className="inline-flex items-center gap-1 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-[4px_6px_3px_5px] bg-pink-100/90 dark:bg-pink-950/70 text-pink-900 dark:text-pink-200 border border-pink-300 dark:border-pink-700/60 shadow-[0.5px_0.5px_0px_0px_rgba(24,23,22,0.3)] leading-none"
          title={t('widgetAgenda.includesDanceLabel') || "Événement avec danse"}
        >
          <span className="text-[10px] leading-none">💃</span>
          <span className="hidden md:inline">{t('agendaFilter.dance') || "Danse"}</span>
        </span>
      )}
    </div>
  );
}
