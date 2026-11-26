import React from 'react';
import { usePublicThemeContext } from '../../PublicThemeProvider';
import { useTranslation } from '../../LanguageContext';
import {
  openVolunteerShiftGoogleCalendar,
  downloadVolunteerShiftsIcs
} from '../../../utils/volunteerCalendarUtils';

/**
 * Écrans d'état en marque blanche de la page publique `/benevoles/:eventId` :
 * - `mode === 'closed'` : Appel clôturé / événement introuvable + retour Vitrine
 * - `mode === 'confirmed'` : Remerciement, récapitulatif et ajout Google Agenda / .ics
 */
export default function PublicVolunteerStatusScreen({
  mode = 'closed',
  event = null,
  eventTitle = '',
  summary = null,
  onBackToVitrine
}) {
  const { publicTheme } = usePublicThemeContext();
  const { t } = useTranslation();
  const logoSrc = publicTheme?.logoUrl || '';
  const assoName = publicTheme?.associationName || '';
  const selectedShifts = Array.isArray(summary?.selectedShifts) ? summary.selectedShifts : [];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[var(--public-bg)] text-[var(--public-text)]">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8 text-center flex flex-col items-center gap-4">
        {logoSrc && <img src={logoSrc} alt={assoName} className="w-16 h-16 object-contain rounded-full border border-stone-200 bg-stone-50 p-1" />}
        {assoName && <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--public-secondary)]">{assoName}</span>}

        <div className="text-4xl select-none">{mode === 'confirmed' ? '🙌' : '🤝'}</div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--public-primary)] [font-family:var(--public-font-heading,sans-serif)]">
          {mode === 'confirmed'
            ? (t('agenda.volunteerPublicThankYouTitle') || 'Merci infiniment pour ton coup de main !')
            : (t('agenda.volunteerPublicClosedTitle') || 'Appel à bénévoles clôturé')}
        </h1>

        {eventTitle && <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{eventTitle}</p>}

        <p className="text-sm text-stone-700 leading-relaxed">
          {mode === 'confirmed'
            ? (t('agenda.volunteerPublicThankYouDesc') || "Ta proposition a bien été transmise à l'équipe de coordination. Un référent de l'association te recontactera et t'enverra ton mémo récapitulatif dès validation.")
            : (t('agenda.volunteerPublicClosedDesc') || "L'équipe bénévole de cet événement est désormais au complet ou l'appel n'est plus ouvert. Merci chaleureusement pour votre intérêt !")}
        </p>

        {mode === 'confirmed' && summary && (
          <div className="w-full text-left bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col gap-2 text-xs text-stone-800">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-stone-500">
              {t('agenda.volunteerPublicSummaryTitle') || 'Récapitulatif de ta proposition'}
            </span>
            <p className="font-bold">👤 {summary.prenom} {summary.nom}</p>

            {summary.isFlexible ? (
              <p className="font-semibold text-[var(--public-primary)]">
                🔀 {t('agenda.volunteerFlexibleBadge') || 'Poste flexible'}{summary.disponibilitesNote ? ` — ${summary.disponibilitesNote}` : ''}
              </p>
            ) : selectedShifts.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {selectedShifts.map((sh) => (
                  <div key={sh.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-stone-200 flex-wrap">
                    <span className="font-semibold">{sh.nomTache}{sh.horaires ? ` (${sh.horaires})` : ''}</span>
                    {event && (
                      <button
                        type="button"
                        onClick={() => openVolunteerShiftGoogleCalendar(sh, { event, associationName: assoName })}
                        className="px-2 py-0.5 rounded border border-stone-300 bg-stone-50 hover:bg-stone-100 text-[10px] font-bold cursor-pointer"
                      >
                        🔵 {t('agenda.volunteerCalendarGoogle') || 'Google Agenda'}
                      </button>
                    )}
                  </div>
                ))}
                {event && (
                  <button
                    type="button"
                    onClick={() => downloadVolunteerShiftsIcs(selectedShifts, { event, associationName: assoName })}
                    className="mt-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-[11px] font-bold text-center cursor-pointer"
                  >
                    🍏 {selectedShifts.length >= 2
                      ? (t('agenda.volunteerAddAllShiftsIcsBtn') || 'Ajouter tous mes créneaux (.ics)')
                      : (t('agenda.volunteerCalendarIcs') || 'Apple & Outlook (.ics)')}
                  </button>
                )}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-0.5 font-medium">
                {(summary.shiftLabels || []).map((lbl, i) => <li key={i}>{lbl}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onBackToVitrine}
          className="mt-2 px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:brightness-110 transition-all cursor-pointer bg-[var(--public-btn-bg,var(--public-primary))] text-[var(--public-btn-text)]"
        >
          ← {t('agenda.volunteerPublicBackToVitrine') || "Retourner sur le site de l'association"}
        </button>
      </div>
    </div>
  );
}
