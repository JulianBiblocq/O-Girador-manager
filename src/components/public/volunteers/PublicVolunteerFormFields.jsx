import React from 'react';
import { useTranslation } from '../../LanguageContext';
import VolunteerLogisticFields from '../../event-details/volunteers/VolunteerLogisticFields';

/**
 * Formulaire candidat public : socle obligatoire (Prénom, Nom, E-mail, Téléphone, Lien asso),
 * champ anti-spam honeypot invisible, questions logistiques à la carte et consentement RGPD.
 */
export default function PublicVolunteerFormFields({
  config = {},
  form = {},
  onChangeForm,
  honeypot = '',
  onChangeHoneypot,
  isValid = false,
  submitting = false,
  onSubmit
}) {
  const { t } = useTranslation();
  const patch = (next) => onChangeForm({ ...form, ...next });
  const inputCls = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-[var(--public-primary,#8B2A1A)]';

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[var(--public-primary,#8B2A1A)] [font-family:var(--public-font-heading,sans-serif)]">
        📝 {t('agenda.volunteerPublicCoordsTitle') || '2. Tes coordonnées & informations pratiques'}
      </h2>

      {/* Champ anti-spam Honeypot strictement masqué aux humains */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="og_volunteer_website">Website</label>
        <input
          id="og_volunteer_website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => onChangeHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-700">{t('agenda.volunteerGuestFirstName') || 'Prénom'} *</label>
          <input type="text" required value={form.prenom} disabled={submitting} onChange={(e) => patch({ prenom: e.target.value })} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-700">{t('agenda.volunteerGuestLastName') || 'Nom'} *</label>
          <input type="text" required value={form.nom} disabled={submitting} onChange={(e) => patch({ nom: e.target.value })} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-700">{t('agenda.volunteerPublicEmailLabel') || 'E-mail'} *</label>
          <input type="email" required value={form.email} disabled={submitting} onChange={(e) => patch({ email: e.target.value })} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-700">{t('agenda.volunteerGuestPhone') || 'Téléphone (contact Jour J)'} *</label>
          <input type="tel" required value={form.telephone} disabled={submitting} onChange={(e) => patch({ telephone: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-stone-700">
          {t('agenda.volunteerPublicRelationLabel') || "De la part de qui viens-tu ? / Ton lien avec l'asso"} *
        </label>
        <input
          type="text" required value={form.lienAsso} disabled={submitting}
          placeholder={t('agenda.volunteerExternalRelationPlaceholder') || 'Ex. : Ami de la présidente, voisin...'}
          onChange={(e) => patch({ lienAsso: e.target.value })}
          className={inputCls}
        />
      </div>

      <VolunteerLogisticFields config={config} form={form} onChange={onChangeForm} disabled={submitting} tr={t} />

      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer select-none">
        <input
          type="checkbox"
          required
          checked={Boolean(form.rgpdConsent)}
          disabled={submitting}
          onChange={(e) => patch({ rgpdConsent: e.target.checked })}
          className="mt-0.5 w-4 h-4 accent-[var(--public-secondary,#2D6A4F)] shrink-0"
        />
        <span className="text-xs text-stone-700 leading-relaxed">
          {t('agenda.volunteerPublicRgpdConsent') || "J'accepte que mes coordonnées soient utilisées exclusivement par l'équipe organisatrice pour coordonner le bénévolat de cet événement."} *
        </span>
      </label>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full sm:w-auto sm:self-end px-6 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md hover:brightness-110 disabled:opacity-45 transition-all cursor-pointer bg-[var(--public-btn-bg,var(--public-primary,#8B2A1A))] text-[var(--public-btn-text,#FFFFFF)]"
      >
        {submitting ? '...' : `🙌 ${t('agenda.volunteerPublicSubmitBtn') || 'Envoyer ma proposition de coup de main'}`}
      </button>
    </form>
  );
}
