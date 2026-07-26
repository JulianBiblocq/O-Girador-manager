import React from 'react';
import { XiloShield, XiloLock, XiloInfo, XiloHanger } from '../XiloIcons';

/**
 * OnboardingPrivateBlock - Bloc 3 : Informations Confidentielles (Réservé au Bureau)
 * Regroupe la latéralité, les mensurations (costumes), et les attestations administratives.
 */
export default function OnboardingPrivateBlock({
  formData,
  handleChange,
  submitting,
  isFieldVisible,
  isFieldRequired,
  demanderDroitImage,
  demanderAttestationSante,
  droitImageDocUrl,
  aptitudeMedicaleDocUrl,
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <div className="flex flex-col gap-3.5 border-2 border-dashed border-red-900/30 dark:border-red-500/30 p-3.5 rounded bg-amber-50/50 dark:bg-amber-950/20">
      {/* Title & Reassurance Disclaimer */}
      <div className="flex flex-col gap-1 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700">
            <XiloLock size={20} />
          </span>
          <h3 className="font-cactus font-bold text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            🔒 Informations Confidentielles <span className="text-[10px] lowercase font-normal opacity-80">(Réservé au Bureau)</span>
          </h3>
        </div>
        <p className="text-[10.5px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed bg-white/70 dark:bg-black/40 p-2.5 rounded border border-cordel-master-dark/15 text-left flex items-start gap-2">
          <XiloShield size={16} className="shrink-0 text-red-600 mt-0.5" />
          <span>
            Ces données sont strictement privées. Elles ne seront jamais affichées publiquement et servent uniquement à l'administration (ex: confection des costumes pour les mensurations).
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* Latéralité Dropdown */}
        {isFieldVisible('lateralite') && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.lateralite', 'Latéralité (Main dominante)')}
              {isFieldRequired('lateralite') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <select
              name="lateralite"
              value={formData.lateralite}
              onChange={handleChange}
              disabled={submitting}
              className="theme-input w-full font-semibold text-xs bg-cordel-bg-light disabled:opacity-50"
            >
              <option value="droitier">{translate('onboarding.handRight', 'Droitier / Droitière')}</option>
              <option value="gaucher">{translate('onboarding.handLeft', 'Gaucher / Gauchère')}</option>
            </select>
          </div>
        )}

        {/* Section Mensurations */}
        {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
          <div className="sm:col-span-2 flex flex-col gap-2 p-2.5 rounded bg-white/50 dark:bg-black/20 border border-cordel-master-dark/10">
            <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <XiloHanger size={14} />
              <span>Mensurations pour les costumes</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* T-Shirt Size Dropdown */}
              {isFieldVisible('tailleTshirt') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('onboarding.tshirtSize', 'Taille T-shirt')}
                    {isFieldRequired('tailleTshirt') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="tailleTshirt"
                    value={formData.tailleTshirt}
                    onChange={handleChange}
                    disabled={submitting}
                    className="theme-input w-full font-bold text-xs bg-cordel-bg-light disabled:opacity-50"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              )}

              {/* Pantalon Size Dropdown */}
              {isFieldVisible('taillePantalon') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('onboarding.pantSize', 'Taille Pantalon')}
                    {isFieldRequired('taillePantalon') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="taillePantalon"
                    value={formData.taillePantalon}
                    onChange={handleChange}
                    disabled={submitting}
                    className="theme-input w-full font-bold text-xs bg-cordel-bg-light disabled:opacity-50"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Rights Checkbox */}
      {demanderDroitImage && (
        <div className="flex flex-col gap-1 mt-1 text-left p-2.5 rounded bg-white/50 dark:bg-black/20 border border-cordel-master-dark/10">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="droitImage"
              id="droitImage"
              checked={formData.droitImage}
              onChange={handleChange}
              disabled={submitting}
              className="mt-0.5 cursor-pointer"
            />
            <label htmlFor="droitImage" className="text-xs font-semibold leading-snug cursor-pointer select-none">
              {translate('onboarding.imageRights', "J'autorise l'exploitation de mon image (Droit à l'image)")}
              {isFieldRequired('droitImage') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
          </div>
          {droitImageDocUrl && (
            <div className="pl-6 text-[10px] font-bold">
              📄 <a href={droitImageDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">
                {translate('onboarding.imageRightsDoc', "Consulter la charte du droit à l'image")}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Medical Certificate Checkbox */}
      {demanderAttestationSante && (
        <div className="flex flex-col gap-1 text-left p-2.5 rounded bg-red-50/60 dark:bg-red-950/30 border border-red-300 dark:border-red-700">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="aptitudeMedicale"
              id="aptitudeMedicale"
              checked={formData.aptitudeMedicale}
              onChange={handleChange}
              required={demanderAttestationSante || isFieldRequired('aptitudeMedicale')}
              disabled={submitting}
              className="mt-0.5 cursor-pointer"
            />
            <label htmlFor="aptitudeMedicale" className="text-xs font-bold leading-snug cursor-pointer select-none text-red-700 dark:text-red-300">
              {translate('onboarding.medicalCert', "J'atteste n'avoir aucune contre-indication médicale à la pratique du Maracatu")}
              {(demanderAttestationSante || isFieldRequired('aptitudeMedicale')) && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
          </div>
          {aptitudeMedicaleDocUrl && (
            <div className="pl-6 text-[10px] font-bold">
              📄 <a href={aptitudeMedicaleDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">
                {translate('onboarding.medicalCertDoc', "Lire le règlement de santé")}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
