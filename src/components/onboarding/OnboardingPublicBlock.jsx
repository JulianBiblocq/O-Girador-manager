import React from 'react';
import { XiloTrombinoscope, XiloEye } from '../XiloIcons';

/**
 * OnboardingPublicBlock - Bloc 1 : Ton Profil Public (Trombinoscope)
 * Regroupe le Prénom, Nom, Surnom et Genre qui figureront dans la fiche publique.
 */
export default function OnboardingPublicBlock({
  formData,
  handleChange,
  submitting,
  isFieldVisible,
  isFieldRequired,
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <div className="flex flex-col gap-3.5 border-2 border-dashed border-cordel-wood/30 p-3.5 rounded bg-cordel-bg-light/40">
      {/* Title with Xilo Icon */}
      <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/60 text-cordel-wood border border-cordel-wood/40">
          <XiloTrombinoscope size={20} />
        </span>
        <div>
          <h3 className="font-cactus font-bold text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            Ton Profil Public <span className="text-[10px] lowercase font-normal opacity-80">(Trombinoscope)</span>
          </h3>
          <p className="text-[10px] text-cordel-master-dark/80 font-medium">
            Ces informations de base te permettront d'être identifié(e) par la communauté.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* First Name Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.firstName', 'Prénom')} <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Ex: Clara"
            className="theme-input w-full font-bold text-xs disabled:opacity-50"
          />
        </div>

        {/* Last Name Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.lastName', 'Nom')} <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Ex: Dupont"
            className="theme-input w-full font-bold text-xs disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* Surnom Input */}
        {isFieldVisible('surnom') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.surnom', 'Surnom dans le groupe')}
              {isFieldRequired('surnom') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="text"
              name="surnom"
              placeholder="Facultatif (ex: Ritinha)"
              value={formData.surnom}
              onChange={handleChange}
              disabled={submitting}
              className="theme-input w-full text-xs disabled:opacity-50"
            />
          </div>
        )}

        {/* Genre / Civilité Select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.genre', 'Genre (pour accorder les termes)')}
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            disabled={submitting}
            className="theme-input w-full text-xs font-semibold bg-cordel-bg-light disabled:opacity-50"
          >
            <option value="femme">{translate('onboarding.genderFemale', 'Femme')}</option>
            <option value="homme">{translate('onboarding.genderMale', 'Homme')}</option>
            <option value="autre">{translate('onboarding.genderOther', 'Autre')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
