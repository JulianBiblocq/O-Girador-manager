import React from 'react';

/**
 * Champs logistiques à la carte (régime/allergies, t-shirt, véhicule, statut majeur/mineur)
 * affichés dynamiquement selon `event.publicVolunteerConfig`.
 */
export default function VolunteerLogisticFields({ config = {}, form = {}, onChange, disabled = false, tr }) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  if (!config.askDietary && !config.askTshirtSize && !config.askVehicle && !config.askAdultStatus) {
    return null;
  }

  const patch = (next) => onChange({ ...form, ...next });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded bg-[var(--cordel-bg)] border border-dashed border-[var(--theme-border)]/30">
      {config.askDietary && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">
            🍽️ {t('agenda.volunteerAskDietary') || 'Régime alimentaire / allergies'}
          </label>
          <input
            type="text" value={form.regimeAlimentaire || ''} disabled={disabled}
            placeholder={t('agenda.volunteerDietaryPlaceholder') || 'Ex. : Végétarien, sans arachides...'}
            onChange={(e) => patch({ regimeAlimentaire: e.target.value })}
            className="theme-input py-1 px-2 text-xs"
          />
        </div>
      )}

      {config.askTshirtSize && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">
            👕 {t('agenda.volunteerTshirtLabel') || 'Taille T-shirt'}
          </label>
          <select
            value={form.tailleTshirt || ''} disabled={disabled}
            onChange={(e) => patch({ tailleTshirt: e.target.value })}
            className="theme-input py-1 px-2 text-xs"
          >
            <option value="">—</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
          </select>
        </div>
      )}

      {config.askVehicle && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer">
            <input
              type="checkbox" checked={Boolean(form.hasVehicle)} disabled={disabled}
              onChange={(e) => patch({ hasVehicle: e.target.checked })}
              className="accent-[var(--color-cordel-vert)]"
            />
            🚗 {t('agenda.volunteerVehicleAvailable') || 'Véhicule / remorque disponible'}
          </label>
          {form.hasVehicle && (
            <input
              type="text" value={form.vehicleDetails || ''} disabled={disabled}
              placeholder={t('agenda.volunteerVehicleDetailsPlaceholder') || 'Ex. : Break + attelage, permis B'}
              onChange={(e) => patch({ vehicleDetails: e.target.value })}
              className="theme-input py-1 px-2 text-xs"
            />
          )}
        </div>
      )}

      {config.askAdultStatus && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">
            🪪 {t('agenda.volunteerAskAdultStatus') || 'Confirmation Majeur / Mineur (assurance)'}
          </label>
          <select
            value={form.isAdult === null || form.isAdult === undefined ? '' : String(form.isAdult)}
            disabled={disabled}
            onChange={(e) => patch({ isAdult: e.target.value === '' ? null : e.target.value === 'true' })}
            className="theme-input py-1 px-2 text-xs"
          >
            <option value="">{t('agenda.volunteerAdultUnspecified') || 'Non précisé'}</option>
            <option value="true">{t('agenda.volunteerAdultYes') || 'Majeur (+18 ans)'}</option>
            <option value="false">{t('agenda.volunteerAdultNo') || 'Mineur (-18 ans)'}</option>
          </select>
        </div>
      )}
    </div>
  );
}
