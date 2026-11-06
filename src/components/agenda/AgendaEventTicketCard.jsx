import React from 'react';
import { XiloMegaphone } from '../XiloIcons';
import EventDisciplineBadges from './EventDisciplineBadges';
import ReunionPrivacyBadge from './ReunionPrivacyBadge';
import EventThumbnail from './EventThumbnail';
import { formatLocationShort } from '../../utils/locationUtils';
import { getSeasonFromDate } from '../../utils/seasonUtils';

/**
 * Vérifie si deux dates tombent exactement le même jour calendaire.
 */
function isSameCalendarDay(dateA, dateB) {
  if (!dateA || !dateB) return false;
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  if (!isNaN(dA.getTime()) && !isNaN(dB.getTime())) {
    return (
      dA.getFullYear() === dB.getFullYear() &&
      dA.getMonth() === dB.getMonth() &&
      dA.getDate() === dB.getDate()
    );
  }
  return String(dateA).slice(0, 10) === String(dateB).slice(0, 10);
}

/**
 * Billet cranté d'événement pour la grille Agenda (Accueil et Page dédiée).
 * Assure un contraste optimal en crème clair (#F5EFE6) sur les billets vert foncé (Répétition)
 * et évite la répétition "Du ... au ..." lorsque le début et la fin tombent le même jour.
 */
export default function AgendaEventTicketCard({
  event,
  user,
  locale,
  variants,
  effectiveTemporalTab,
  saisonDebutMois,
  lieuxImportants,
  formatDateWithDay,
  onSelectEvent,
  t
}) {
  const dateObj = new Date(event.date);
  const day = isNaN(dateObj.getTime()) ? '?' : dateObj.getDate();
  const dateLocale = locale === 'pt' ? 'pt-BR' : 'fr-FR';
  const month = isNaN(dateObj.getTime())
    ? '???'
    : dateObj.toLocaleDateString(dateLocale, { month: 'short' }).toUpperCase().replace('.', '');
  const time = isNaN(dateObj.getTime())
    ? '--h--'
    : dateObj.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const variant = variants[event.type] || 'kraft';
  const isDarkGreenTicket = variant === 'vert';
  const secondaryTextClass = isDarkGreenTicket ? 'text-[#F5EFE6]' : 'text-encre-noire/75';
  const locationTextClass = isDarkGreenTicket ? 'text-[#F5EFE6]' : 'text-encre-noire';
  const hasDistinctEndDate = Boolean(event.dateFin && !isSameCalendarDay(event.date, event.dateFin));

  const userInscription = (event.inscriptions || []).find((ins) => ins.userId === user?.uid);
  const userStatus = userInscription ? userInscription.status : null;
  const presentCount =
    (event.inscriptions || []).filter((i) => i.status === 'present').length +
    (event.invitesExternes || []).length;

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className={`relative overflow-hidden border-2 border-encre-noire theme-bg-${variant} shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_9px_11px] flex items-stretch min-h-[90px] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[2px_2px_0px_0px_#181716] transition-all ${
        effectiveTemporalTab === 'past' ? 'border-dashed border-cordel-master-dark/40 opacity-95' : ''
      }`}
    >
      {/* Tampons d'état en biais */}
      {event.status === 'annule' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span style={{ transform: 'rotate(-15deg)' }} className="text-red-600 border-[3.5px] border-red-600 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5">
            {t('agenda.canceledStamp') || 'ANNULÉ'}
          </span>
        </div>
      )}
      {event.status === 'a_confirmer' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span style={{ transform: 'rotate(-15deg)' }} className="text-orange-600 border-[3.5px] border-orange-600 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5">
            {t('agenda.confirm') || 'À CONFIRMER'}
          </span>
        </div>
      )}
      {event.status === 'confirme' && event.wasConfirmedLater && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span style={{ transform: 'rotate(-10deg)', color: 'var(--color-cordel-vert)', borderColor: 'var(--color-cordel-vert)' }} className="border-[3.5px] px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5">
            {t('agenda.confirmedStamp') || 'CONFIRMÉ'}
          </span>
        </div>
      )}
      {event.status === 'sondage' && (
        <div className="absolute top-2 right-2 flex gap-1 select-none z-10">
          <span className="text-amber-900 bg-amber-100/90 border border-amber-600 font-black uppercase text-[8px] px-2 py-0.5 rounded shadow-sm">
            📊 {t('widgetAgenda.poll', 'Sondage') || 'SONDAGE'} ({event.optionIndex || 1}/{event.totalOptions || 1}) {event.pollTarget ? `• ${event.pollTarget}` : ''}
          </span>
        </div>
      )}

      {/* Bloc Date à gauche */}
      <div className="w-16 sm:w-20 shrink-0 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-encre-noire/30 px-1 sm:px-2 select-none">
        <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none">{day}</span>
        <span className="text-[9px] sm:text-[10px] font-bold tracking-widest mt-0.5">{month}</span>
        <span className="text-[8px] sm:text-[9px] font-semibold opacity-85 mt-0.5 sm:mt-1">{time}</span>
      </div>

      {/* Détails à droite */}
      <div className="flex-1 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 text-left pl-3.5 sm:pl-5 pr-7 sm:pr-8 min-w-0">
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h4 className="font-bold text-sm leading-tight mb-0.5">{event.titre}</h4>
          <span className={`text-[9px] font-extrabold ${secondaryTextClass} mb-1 leading-none select-none`}>
            {hasDistinctEndDate
              ? locale === 'pt'
                ? `De ${formatDateWithDay(event.date, true, locale)} até ${formatDateWithDay(event.dateFin, false, locale)}`
                : `Du ${formatDateWithDay(event.date, true, locale)} au ${formatDateWithDay(event.dateFin, false, locale)}`
              : formatDateWithDay(event.date, true, locale)}
          </span>
          {event.lieu && (
            <div className={`text-[10px] font-bold ${locationTextClass} flex items-center gap-1 my-0.5 truncate`} title={event.lieu}>
              <span className="shrink-0">📍</span>
              <span className="truncate">{formatLocationShort(event, lieuxImportants)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-1.5 border-t border-dashed border-encre-noire/15 pt-1.5 gap-2">
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[8px] uppercase tracking-widest font-black ${isDarkGreenTicket ? 'text-[#F5EFE6]/85' : 'opacity-65'}`}>{event.type}</span>
                <EventDisciplineBadges event={event} />
                <ReunionPrivacyBadge event={event} />
                {effectiveTemporalTab === 'past' && (
                  <span className="text-[8px] font-black uppercase tracking-wider bg-cordel-master-dark/10 text-encre-noire px-1.5 py-0.5 rounded-[4px_6px_3px_5px] border border-encre-noire/20 select-none inline-flex items-center gap-0.5">
                    <span>🏛️</span>
                    <span>{getSeasonFromDate(event.dateDebut || event.date, saisonDebutMois)}</span>
                  </span>
                )}
              </div>
              {event.enableInscriptions === false ? (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider bg-neutral-200 text-neutral-700 leading-none select-none"><XiloMegaphone size={10} className="text-cordel-wood" /> {t('widgetAgenda.informative', 'Informatif') || 'Informatif'}</span>
              ) : userStatus === 'present' ? (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-present leading-none select-none">{t('agenda.present')}</span>
              ) : userStatus === 'pending' ? (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300 leading-none select-none">{t('agenda.waitingResponse') || 'En attente'}</span>
              ) : userStatus === 'refused' || userStatus === 'absent' ? (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-absent leading-none select-none">{userStatus === 'refused' ? (t('userProfile.refused') || 'Refusé') : t('agenda.absent')}</span>
              ) : userStatus === 'confirm' ? (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-confirm leading-none select-none">{t('agenda.confirm')}</span>
              ) : (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-pending leading-none select-none">{t('agenda.waitingResponse') || t('common.pending')}</span>
              )}
            </div>
            {event.enableInscriptions !== false && presentCount > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 bg-encre-noire text-cordel-bg-light rounded-sm self-end shrink-0">
                {presentCount} {t('common.presentCountLabel')}
              </span>
            )}
          </div>
        </div>
        <EventThumbnail event={event} />
      </div>

      {/* Encoches circulaires latérales du billet */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-r-2 border-encre-noire" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-l-2 border-encre-noire" />
    </div>
  );
}
