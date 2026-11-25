import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sélecteur chronologique 100 % anonyme des créneaux bénévoles publics
 * et option dédiée « 🔀 Je suis flexible : placez-moi là où il manque du monde ».
 * Zéro nom ou coordonnée d'inscrit n'est jamais passé ni affiché.
 */
export default function PublicVolunteerShiftsSelector({
  shifts = [],
  eventDateJour = '',
  selectedShiftIds = [],
  onToggleShift,
  isFlexible = false,
  onChangeFlexible,
  disponibilitesNote = '',
  onChangeNote,
  disabled = false
}) {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[var(--public-primary,#8B2A1A)] [font-family:var(--public-font-heading,sans-serif)]">
        🤝 {t('agenda.volunteerPublicChooseSlotsTitle') || '1. Choisis ton créneau (ou propose ton aide flexible)'}
      </h2>

      {shifts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shifts.map((shift) => {
            const checked = selectedShiftIds.includes(shift.id);
            const isFull = Boolean(shift.isFull);
            const remainingLabel = isFull
              ? (t('agenda.volunteerFull') || 'Complet')
              : shift.remaining !== null
                ? (t('agenda.volunteerPublicRemainingPlaces') || 'Reste {remaining} place(s) sur {quota}')
                  .replace('{remaining}', String(shift.remaining))
                  .replace('{quota}', String(shift.quotaRequis))
                : (t('agenda.volunteerPublicOpenPlaces') || 'Places ouvertes');

            return (
              <label
                key={shift.id}
                className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 ${
                  isFull
                    ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                    : checked
                      ? 'bg-stone-50 border-[var(--public-secondary,#2D6A4F)] shadow-xs cursor-pointer'
                      : 'bg-white border-stone-200 hover:border-stone-300 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled || isFull}
                      onChange={() => !isFull && onToggleShift(shift.id)}
                      className="mt-0.5 w-4 h-4 accent-[var(--public-secondary,#2D6A4F)] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-stone-900 block leading-snug">{shift.nomTache}</span>
                      {shift.commissionTitre && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {shift.commissionTitre}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                      isFull
                        ? 'bg-stone-300 text-stone-700'
                        : 'bg-[var(--public-secondary,#2D6A4F)] text-white'
                    }`}
                  >
                    {remainingLabel}
                  </span>
                </div>

                <div className="pl-6 flex flex-col gap-0.5 text-xs text-stone-600">
                  <span className="font-semibold">
                    ⏱️ {shift.dateJour && shift.dateJour !== eventDateJour ? `${shift.dateJour} • ` : ''}
                    {shift.horaires || (t('agenda.volunteerFreeSchedule') || 'Horaire libre')}
                  </span>
                  {shift.consigne && <span className="italic text-[11px] text-stone-500">💡 {shift.consigne}</span>}
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2.5 ${
        isFlexible ? 'bg-amber-50/70 border-[var(--public-primary,#8B2A1A)]' : 'bg-stone-50 border-dashed border-stone-300'
      }`}>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isFlexible}
            disabled={disabled}
            onChange={(e) => onChangeFlexible(e.target.checked)}
            className="w-4 h-4 accent-[var(--public-primary,#8B2A1A)] shrink-0"
          />
          <span className="font-extrabold text-xs sm:text-sm text-stone-900">
            🔀 {t('agenda.volunteerPublicFlexibleOption') || 'Je suis flexible : placez-moi là où il manque du monde'}
          </span>
        </label>

        <div className="flex flex-col gap-1 pl-6">
          <label className="text-[11px] font-semibold text-stone-600">
            {t('agenda.volunteerAvailabilityNoteLabel') || 'Disponibilités / Précisions horaires'}
          </label>
          <textarea
            rows={2}
            value={disponibilitesNote}
            disabled={disabled}
            placeholder={t('agenda.volunteerPublicFlexiblePlaceholder') || 'Précise tes créneaux horaires de disponibilité ou tes préférences...'}
            onChange={(e) => onChangeNote(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[var(--public-primary,#8B2A1A)]"
          />
        </div>
      </div>
    </section>
  );
}
