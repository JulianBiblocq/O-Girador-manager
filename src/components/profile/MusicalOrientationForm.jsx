import React from 'react';

const DEFAULT_INSTRUMENTS = [
  "Alfaia Marcante",
  "Alfaia Meião",
  "Alfaia Repique",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant",
  "Danse"
];

/**
 * MusicalOrientationForm component renders the "Évolution & Souhaits d'Instruments" section
 * inside the ProfileEditForm.
 *
 * @param {Object} props
 * @param {Object} props.formData Form state containing voeuPrincipal, voeuSecondaire, voeuTertiaire, instrument, instrumentSecondaire
 * @param {Function} props.handleChange Field change handler
 * @param {boolean} props.saving Saving state
 * @param {Array<string>} [props.instrumentsDisponibles] List of available instruments
 * @param {boolean} props.isAncien Whether member already has a definitive main instrument
 * @param {Function} [props.t] Optional translation function
 */
export default function MusicalOrientationForm({
  formData,
  handleChange,
  saving,
  instrumentsDisponibles = DEFAULT_INSTRUMENTS,
  isAncien = false,
  t = (key, fallback) => fallback
}) {
  const instrumentsList = Array.isArray(instrumentsDisponibles) && instrumentsDisponibles.length > 0
    ? instrumentsDisponibles
    : DEFAULT_INSTRUMENTS;

  return (
    <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 flex flex-col gap-3 text-left">
      <h5 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
        🎵 Évolution & Souhaits d'Instruments
      </h5>

      {/* Help text */}
      <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/20 p-2.5 rounded text-xs text-cordel-master-dark font-medium leading-relaxed flex flex-col gap-1">
        <span>💡 Veuillez sélectionner au moins 2 instruments (un choix principal et un second choix) pour faciliter la répartition des pupitres par le Mestre.</span>
      </div>

      {isAncien ? (
        /* Logic for existing members (Ancien) */
        <div className="flex flex-col gap-3">
          {/* Display current definitive instruments */}
          <div className="bg-white/40 dark:bg-black/10 p-2.5 rounded border border-dashed border-cordel-master-dark/20 flex flex-col gap-1 text-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-extrabold text-cordel-wood uppercase text-[10px] tracking-wider block">
                  Instrument principal actuel :
                </span>
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 font-bold">
                  Choix 1 (Actuel)
                </span>
              </div>
              <span className="font-black text-cordel-master-dark">
                {formData.instrument || 'Non attribué'}
              </span>
            </div>
            {formData.instrumentSecondaire && (
              <div className="mt-1 pt-1 border-t border-dashed border-cordel-master-dark/10">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-extrabold text-cordel-wood uppercase text-[10px] tracking-wider block">
                    Instrument secondaire actuel :
                  </span>
                  <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] px-2 py-0.5 font-bold">
                    Choix 2 (Actuel)
                  </span>
                </div>
                <span className="font-bold text-cordel-master-dark">
                  {formData.instrumentSecondaire}
                </span>
              </div>
            )}
          </div>

          {/* Optional dropdown 1: Change main instrument */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Souhaites-tu changer d'instrument principal cette année ?
              </label>
              {formData.voeuPrincipal && (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 font-bold shrink-0">
                  Nouveau Choix 1
                </span>
              )}
            </div>
            <select
              name="voeuPrincipal"
              value={formData.voeuPrincipal || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Non, conserver mon instrument actuel --</option>
              {instrumentsList.map(inst => (
                <option key={`voeu-p-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Conditional checkbox for reinforcement on former main instrument */}
          {isAncien && formData.instrument && formData.voeuPrincipal && formData.voeuPrincipal !== formData.instrument && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded border border-dashed border-amber-500/40 flex flex-col gap-1.5 text-left text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer font-semibold text-encre-noire select-none">
                <input
                  type="checkbox"
                  name="accordRenfortAncienInstrument"
                  checked={formData.accordRenfortAncienInstrument || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleChange({
                      target: {
                        name: 'accordRenfortAncienInstrument',
                        type: 'checkbox',
                        checked: checked,
                        value: checked
                      }
                    });
                    // If checked and no secondary wish set, pre-fill voeuSecondaire with former instrument
                    if (checked && !formData.voeuSecondaire) {
                      handleChange({
                        target: {
                          name: 'voeuSecondaire',
                          value: formData.instrument
                        }
                      });
                    }
                  }}
                  disabled={saving}
                  className="accent-cordel-wood scale-110 mt-0.5"
                />
                <span>
                  🤝 <strong>Renfort en prestation :</strong> J'accepte de venir en renfort sur mon ancien instrument (<strong>{formData.instrument}</strong>) si besoin lors des prestations.
                </span>
              </label>
              <span className="text-[10px] italic text-cordel-master-dark/80 pl-6">
                💡 Cet instrument sera proposé au Mestre comme instrument secondaire.
              </span>
            </div>
          )}

          {/* Optional dropdown 2: Learn secondary instrument */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Souhaites-tu apprendre un instrument secondaire ?
              </label>
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] px-2 py-0.5 font-bold shrink-0">
                Choix 2
              </span>
            </div>
            <select
              name="voeuSecondaire"
              value={formData.voeuSecondaire || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Aucun / Pas de souhait d'instrument secondaire --</option>
              {instrumentsList.map(inst => (
                <option key={`voeu-s-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* Logic for new members (Nouveau) */
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-cordel-wood uppercase tracking-wider">
            Quels instruments aimerais-tu jouer ?
          </p>

          {/* Wish 1 */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Vœu principal <span className="text-red-500 font-bold">*</span>
              </label>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2.5 py-0.5 font-black uppercase">
                Choix 1
              </span>
            </div>
            <select
              name="voeuPrincipal"
              value={formData.voeuPrincipal || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light font-semibold"
            >
              <option value="">-- Choisir un premier voeu (Choix 1) --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-p-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Wish 2 */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Vœu secondaire <span className="text-red-500 font-bold">*</span>
              </label>
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] px-2.5 py-0.5 font-black uppercase">
                Choix 2
              </span>
            </div>
            <select
              name="voeuSecondaire"
              value={formData.voeuSecondaire || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light font-semibold"
            >
              <option value="">-- Choisir un second voeu (Choix 2 obligatoire) --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-s-${inst}`} value={inst} disabled={inst === formData.voeuPrincipal}>
                  {inst} {inst === formData.voeuPrincipal ? '(Déjà choisi en Choix 1)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Wish 3 */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood opacity-80">
                Vœu tertiaire (Optionnel)
              </label>
              <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2 py-0.5 font-bold opacity-75 shrink-0">
                Choix 3
              </span>
            </div>
            <select
              name="voeuTertiaire"
              value={formData.voeuTertiaire || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Aucun / Pas de troisième choix --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-t-${inst}`} value={inst} disabled={inst === formData.voeuPrincipal || inst === formData.voeuSecondaire}>
                  {inst} {(inst === formData.voeuPrincipal || inst === formData.voeuSecondaire) ? '(Déjà choisi)' : ''}
                </option>
              ))}
            </select>
          </div>

          {(!formData.voeuPrincipal || !formData.voeuSecondaire || formData.voeuPrincipal === formData.voeuSecondaire) && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-500/50 rounded text-[11px] font-bold text-amber-800 dark:text-amber-300">
              ⚠️ Veuillez sélectionner au moins 2 instruments différents (Choix 1 et Choix 2).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
