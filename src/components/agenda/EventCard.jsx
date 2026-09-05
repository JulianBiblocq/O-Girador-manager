import React from 'react';
import EventDisciplineBadges from './EventDisciplineBadges';
import { formatLocationShort } from '../../utils/locationUtils';
import { formatDateWithDay } from '../../utils/dateUtils';

import EventThumbnail from './EventThumbnail';

/**
 * Composant de carte/billet d'événement individuel (EventCard).
 * 
 * Affiche les informations synthétiques d'un événement sous forme de ticket :
 * date, heure, titre, type, disciplines, statut d'inscription, miniature vidéo
 * et localisation court-formaterée (Règle 1 : lieu pré-enregistré / Règle 2 : nom de la ville).
 */
export default function EventCard({
  event,
  lieuxImportants = [],
  onSelectEvent,
  user = null,
  t = (key) => key
}) {
  if (!event) return null;

  // Calcul de la date et des libellés d'affichage
  const eventDateObj = event.date ? new Date(event.date) : new Date();
  const day = eventDateObj.getDate();
  const month = eventDateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
  
  const rawTime = event.heureDebut || (event.date && event.date.includes('T') ? event.date.split('T')[1].substring(0, 5) : null);
  const time = rawTime ? rawTime.replace(':', 'h') : '';

  // Variante de couleur selon le type d'événement
  const variants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };
  const variant = variants[event.type] || 'kraft';

  // Statut d'inscription de l'utilisateur connecté
  const userInscription = user && (event.inscriptions || []).find(ins => ins.userId === user.uid);
  const userStatus = userInscription ? userInscription.status : null;
  const presentCount = (event.inscriptions || []).filter(i => i.status === 'present').length + (event.invitesExternes || []).length;



  // Libellé du lieu raccourci avec l'utilitaire
  const locationShort = formatLocationShort(event, lieuxImportants);

  return (
    <div 
      onClick={() => onSelectEvent && onSelectEvent(event)}
      className={`
        relative flex items-stretch border-2 border-encre-noire rounded-[8px_14px_6px_12px] bg-cordel-bg-light 
        shadow-[4px_4px_0px_0px_#181716] overflow-hidden select-none min-h-[105px]
        cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[2px_2px_0px_0px_#181716] transition-all
      `}
    >
      {/* Tampon de statut en filigrane (Annulé / À confirmer) */}
      {event.status === 'annule' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span 
            style={{ transform: 'rotate(-15deg)' }}
            className="text-red-600 dark:text-red-500 border-[3.5px] border-red-600 dark:border-red-500 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5"
          >
            ANNULÉ
          </span>
        </div>
      )}
      {event.status === 'a_confirmer' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span 
            style={{ transform: 'rotate(-15deg)' }}
            className="text-orange-600 dark:text-orange-400 border-[3.5px] border-orange-600 dark:border-orange-400 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5"
          >
            À CONFIRMER
          </span>
        </div>
      )}
      {/* Tampon de validation distinctif (Règle 4: Vert Validation) */}
      {event.status === 'confirme' && event.wasConfirmedLater && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span 
            style={{ transform: 'rotate(-10deg)', color: 'var(--color-cordel-vert)', borderColor: 'var(--color-cordel-vert)' }}
            className="border-[3.5px] px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5"
          >
            VALIDÉ
          </span>
        </div>
      )}
      {event.status === 'sondage' && (
        <div className="absolute top-2 right-2 flex gap-1 select-none z-10">
          <span className="text-amber-900 bg-amber-100/90 border border-amber-600 font-black uppercase text-[8px] px-2 py-0.5 rounded shadow-sm">
            📊 SONDAGE ({event.optionIndex || 1}/{event.totalOptions || 1}) {event.pollTarget ? `• ${event.pollTarget}` : ''}
          </span>
        </div>
      )}

      {/* Côté gauche : Bloc Date */}
      <div className="w-16 sm:w-20 shrink-0 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-encre-noire/30 px-1 sm:px-2 select-none">
        <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none">{day}</span>
        <span className="text-[9px] sm:text-[10px] font-bold tracking-widest mt-0.5">{month}</span>
        <span className="text-[8px] sm:text-[9px] font-semibold opacity-75 mt-0.5 sm:mt-1">{time}</span>
      </div>

      {/* Côté droit : Détails du billet */}
      <div className="flex-1 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 text-left pl-3.5 sm:pl-5 pr-7 sm:pr-8 min-w-0">
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Titre de l'événement */}
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <h4 className="font-bold text-sm leading-tight truncate" title={event.titre}>{event.titre}</h4>
          </div>

          {/* Date complète ou intervalle */}
          <span className="text-[9px] font-extrabold text-encre-noire/70 mb-1 leading-none select-none">
            {event.dateFin ? (
              `Du ${formatDateWithDay(event.date, true)} au ${formatDateWithDay(event.dateFin, false)}`
            ) : (
              `${formatDateWithDay(event.date, true)}`
            )}
          </span>

          {/* Lieu raccourci intelligent avec icône 📍 */}
          {locationShort && (
            <div className="text-[10px] font-bold text-encre-noire flex items-center gap-1 my-0.5 truncate" title={event.lieu}>
              <span className="shrink-0">📍</span>
              <span className="truncate">{locationShort}</span>
            </div>
          )}

          {/* Type, badges de disciplines et statut de présence */}
          <div className="flex justify-between items-center mt-1.5 border-t border-dashed border-encre-noire/10 pt-1.5 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] text-[8px] uppercase tracking-widest font-black theme-bg-${variant}`}>
                {event.type}
              </span>
              <EventDisciplineBadges event={event} />
            </div>

            {/* Badge de statut utilisateur */}
            {(() => {
              if (event.enableInscriptions === false) {
                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-neutral-200 text-neutral-700 leading-none select-none">📢 Informatif</span>;
              }
              if (userStatus === 'present') {
                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider badge-status-present leading-none select-none">Présent</span>;
              } else if (userStatus === 'pending') {
                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300 leading-none select-none">En attente</span>;
              } else if (userStatus === 'refused') {
                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider badge-status-absent leading-none select-none">Refusé</span>;
              } else if (userStatus === 'absent') {
                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider badge-status-absent leading-none select-none">Absent</span>;
              } else if (userStatus === 'confirm') {
                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider badge-status-confirm leading-none select-none">À confirmer</span>;
              } else {
                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider badge-status-pending leading-none select-none">Sans réponse</span>;
              }
            })()}

            {/* Nombre de présents */}
            {event.enableInscriptions !== false && presentCount > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 bg-encre-noire text-cordel-bg-light rounded-sm shrink-0">
                {presentCount} présent(s)
              </span>
            )}
          </div>
        </div>

        {/* Miniature résiliente avec détection anti-403 et support vidéo */}
        <EventThumbnail event={event} />
      </div>

      {/* Encoches latérales style ticket Cordel */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-r-2 border-encre-noire"></div>
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-l-2 border-encre-noire"></div>
    </div>
  );
}
