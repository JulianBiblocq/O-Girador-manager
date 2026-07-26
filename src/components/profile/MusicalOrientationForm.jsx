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
      <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/20 p-2.5 rounded text-xs text-cordel-master-dark font-medium leading-relaxed">
        💡 Indique tes préférences. Le Mestre validera ton rôle définitif (Principal/Secondaire) en fonction de l'équilibre du groupe.
      </div>

      {isAncien ? (
        /* Logic for existing members (Ancien) */
        <div className="flex flex-col gap-3">
          {/* Display current definitive instruments */}
          <div className="bg-white/40 dark:bg-black/10 p-2.5 rounded border border-dashed border-cordel-master-dark/20 flex flex-col gap-1 text-xs">
            <div>
              <span className="font-extrabold text-cordel-wood uppercase text-[10px] tracking-wider block">
                Instrument principal actuel :
              </span>
              <span className="font-black text-cordel-master-dark">
                {formData.instrument || 'Non attribué'}
              </span>
            </div>
            {formData.instrumentSecondaire && (
              <div className="mt-1 pt-1 border-t border-dashed border-cordel-master-dark/10">
                <span className="font-extrabold text-cordel-wood uppercase text-[10px] tracking-wider block">
                  Instrument secondaire actuel :
                </span>
                <span className="font-bold text-cordel-master-dark">
                  {formData.instrumentSecondaire}
                </span>
              </div>
            )}
          </div>

          {/* Optional dropdown 1: Change main instrument */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Souhaites-tu changer d'instrument principal cette année ?
            </label>
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

          {/* Optional dropdown 2: Learn secondary instrument */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Souhaites-tu apprendre un instrument secondaire ?
            </label>
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
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Choix 1 (Vœu principal)
            </label>
            <select
              name="voeuPrincipal"
              value={formData.voeuPrincipal || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light font-semibold"
            >
              <option value="">-- Choisir un premier voeu --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-p-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Wish 2 */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Choix 2 (Vœu secondaire)
            </label>
            <select
              name="voeuSecondaire"
              value={formData.voeuSecondaire || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Aucun / Pas de second choix --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-s-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Wish 3 */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Choix 3 (Vœu tertiaire)
            </label>
            <select
              name="voeuTertiaire"
              value={formData.voeuTertiaire || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Aucun / Pas de troisième choix --</option>
              {instrumentsList.map(inst => (
                <option key={`nouveau-t-${inst}`} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
