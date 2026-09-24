import React from 'react';
import OnboardingToggleSwitch from './OnboardingToggleSwitch';
import { XiloEye, XiloInfo } from '../XiloIcons';

import AddressAutocomplete from '../AddressAutocomplete';

/**
 * OnboardingVisibilityBlock - Bloc 2 : Paramètres de Visibilité dans le Trombinoscope
 * Permet au membre d'indiquer son téléphone, adresse et date de naissance
 * tout en choisissant précisément ce qui sera partagé via des interrupteurs directs.
 */
export default function OnboardingVisibilityBlock({
  formData,
  setFormData,
  handleChange,
  submitting,
  isFieldVisible,
  isFieldRequired,
  missingFields = new Set(),
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const isPhoneMissing = missingFields.has('telephone');
  const isAddressMissing = missingFields.has('adresse');
  const isBirthdateMissing = missingFields.has('dateNaissance');

  const isCityOnlyVisible = formData.visibiliteAdresse === 'ville' || formData.visibiliteAdresse === 'complete';

  const handleCityToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      visibiliteAdresse: checked ? 'ville' : 'masquee'
    }));
  };

  return (
    <div className="flex flex-col gap-3.5 border-2 border-dashed border-cordel-wood/30 p-3.5 rounded bg-cordel-bg-light/40">
      {/* Title & Reassurance Disclaimer */}
      <div className="flex flex-col gap-1 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/60 text-cordel-wood border border-cordel-wood/40">
            <XiloEye size={20} />
          </span>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-cordel-wood">
            Visibilité & Partage (Trombinoscope)
          </h3>
        </div>
        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold italic flex items-center gap-1.5 mt-0.5 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200/50">
          <XiloInfo size={14} className="shrink-0 text-amber-600" />
          <span>"C'est toi qui décides, tu peux changer d'avis plus tard."</span>
        </p>
      </div>

      {/* Téléphone & Interrupteur */}
      {isFieldVisible('telephone') && (
        <div id="field-telephone" className={`flex flex-col gap-2 p-2.5 rounded border ${isPhoneMissing ? 'bg-red-50/80 border-2 border-red-500' : 'bg-white/50 dark:bg-black/20 border-cordel-master-dark/10'}`}>
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.phone', 'Numéro de téléphone')}
              {isFieldRequired('telephone') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={handleChange}
              required={isFieldRequired('telephone')}
              disabled={submitting}
              className={`theme-input w-full text-xs font-semibold disabled:opacity-50 ${isPhoneMissing ? 'border-2 border-red-500 bg-red-50 text-red-900' : ''}`}
            />
            {isPhoneMissing && (
              <span className="text-[10px] text-red-600 font-black mt-0.5">
                ⚠️ Veuillez renseigner votre numéro de téléphone
              </span>
            )}
          </div>

          <OnboardingToggleSwitch
            id="toggle-phone"
            checked={Boolean(formData.afficherTelephone)}
            onChange={(checked) => setFormData(prev => ({ ...prev, afficherTelephone: checked, publierTelephone: checked }))}
            disabled={submitting}
            label="Afficher mon numéro dans le Trombinoscope"
            sublabel="Permet aux autres membres de te contacter en cas de besoin"
          />
        </div>
      )}

      {/* Adresse & Interrupteur Ville */}
      {isFieldVisible('adresse') && (
        <div id="field-adresse" className={`flex flex-col gap-2.5 p-2.5 rounded border text-left ${isAddressMissing ? 'bg-red-50/80 border-2 border-red-500' : 'bg-white/50 dark:bg-black/20 border-cordel-master-dark/10'}`}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.adresseRue', 'Adresse (Rue & Numéro)')}
              {isFieldRequired('adresse') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <React.Suspense fallback={
              <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                ⏳ Chargement de l'autoplétion d'adresse...
              </div>
            }>
              <AddressAutocomplete
                name="adresseRue"
                value={formData.adresseRue}
                onChange={handleChange}
                onSelect={(addressData) => {
                  setFormData(prev => ({
                    ...prev,
                    adresseRue: addressData.street,
                    adresseCP: addressData.zipcode,
                    adresseVille: addressData.city
                  }));
                }}
                required={isFieldRequired('adresse')}
                disabled={submitting}
                placeholder="123 Rue de la Roda"
                className={`theme-input w-full text-xs disabled:opacity-50 ${isAddressMissing ? 'border-2 border-red-500 bg-red-50 text-red-900' : ''}`}
              />
            </React.Suspense>
            {isAddressMissing && (
              <span className="text-[10px] text-red-600 font-black mt-0.5">
                ⚠️ Veuillez renseigner votre adresse
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {translate('onboarding.adresseCP', 'Code Postal')}
              </label>
              <input
                type="text"
                name="adresseCP"
                placeholder="75000"
                value={formData.adresseCP}
                onChange={handleChange}
                required={isFieldRequired('adresse')}
                disabled={submitting}
                className="theme-input w-full font-bold text-xs disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {translate('onboarding.adresseVille', 'Ville')}
              </label>
              <input
                type="text"
                name="adresseVille"
                placeholder="Paris"
                value={formData.adresseVille}
                onChange={handleChange}
                required={isFieldRequired('adresse')}
                disabled={submitting}
                className="theme-input w-full font-semibold text-xs disabled:opacity-50"
              />
            </div>
          </div>

          <OnboardingToggleSwitch
            id="toggle-adresse-ville"
            checked={isCityOnlyVisible}
            onChange={handleCityToggle}
            disabled={submitting}
            label="Afficher la ville dans le Trombinoscope"
            sublabel="Seule ta ville sera visible sur la carte/annuaire, ton adresse exacte reste confidentielle"
          />
        </div>
      )}

      {/* Date de Naissance & Interrupteur Anniversaire */}
      {isFieldVisible('dateNaissance') && (
        <div id="field-dateNaissance" className={`flex flex-col gap-2 p-2.5 rounded border text-left ${isBirthdateMissing ? 'bg-red-50/80 border-2 border-red-500' : 'bg-white/50 dark:bg-black/20 border-cordel-master-dark/10'}`}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.birthdate', 'Date de naissance')}
              {isFieldRequired('dateNaissance') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="date"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={handleChange}
              required={isFieldRequired('dateNaissance')}
              disabled={submitting}
              className={`theme-input w-full font-bold text-xs disabled:opacity-50 ${isBirthdateMissing ? 'border-2 border-red-500 bg-red-50 text-red-900' : ''}`}
            />
            {isBirthdateMissing && (
              <span className="text-[10px] text-red-600 font-black mt-0.5">
                ⚠️ Veuillez renseigner votre date de naissance
              </span>
            )}
          </div>

          <OnboardingToggleSwitch
            id="toggle-anniversaire"
            checked={Boolean(formData.afficherDateNaissance)}
            onChange={(checked) => setFormData(prev => ({ ...prev, afficherDateNaissance: checked, publierDateNaissance: checked }))}
            disabled={submitting}
            label="Afficher mon anniversaire dans le Trombinoscope"
            sublabel="🔒 Note : Seuls le jour et le mois seront notés, ton année de naissance ne sera jamais affichée !"
          />
        </div>
      )}
    </div>
  );
}
