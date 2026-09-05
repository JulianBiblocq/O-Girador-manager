import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Liste des types de véhicules disponibles pour la sélection
 */
export const VEHICLE_TYPES = [
  'Citadine',
  'Berline',
  'Break / Ludospace',
  'Monospace / SUV',
  'Van / Utilitaire'
];

/**
 * Composant : ProfileVehicleSection
 * 
 * Permet à un membre de déclarer les caractéristiques de son véhicule
 * pour les convois et déplacements associatifs.
 * 
 * @param {Object} props Propriétés du composant
 * @param {Object} props.formData État du formulaire profil
 * @param {Function} props.handleChange Gestionnaire de changement de champ
 * @param {boolean} props.disabled Indique si le formulaire est en cours de sauvegarde
 */
export default function ProfileVehicleSection({ formData, handleChange, disabled = false }) {
  const hasVehicle = Boolean(formData.hasVehicle);

  const handleSeatsStep = (delta) => {
    const current = parseInt(formData.defaultPassengerSeats, 10) || 0;
    const next = Math.max(1, Math.min(8, current + delta));
    handleChange({ target: { name: 'defaultPassengerSeats', value: next } });
  };

  const handleTrunkStep = (delta) => {
    const current = parseInt(formData.defaultTrunkCapacity, 10) || 0;
    const next = Math.max(0, Math.min(10, current + delta));
    handleChange({ target: { name: 'defaultTrunkCapacity', value: next } });
  };

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>🚗</span>
          <span>Véhicule & Déplacements Associatifs</span>
        </h4>

        {/* Badge récapitulatif */}
        {hasVehicle && (
          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 border border-emerald-500 text-emerald-900 px-2 py-0.5 rounded shadow-xs">
            Motorisé
          </span>
        )}
      </div>

      {/* Switch principal : Véhicule disponible pour l'association */}
      <label className="flex items-start gap-3 cursor-pointer select-none p-2.5 rounded border border-dashed border-cordel-master-dark/15 bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors">
        <input 
          type="checkbox"
          name="hasVehicle"
          checked={hasVehicle}
          onChange={(e) => handleChange({ target: { name: 'hasVehicle', value: e.target.checked } })}
          disabled={disabled}
          className="w-4 h-4 rounded border border-encre-noire bg-white accent-cordel-wood mt-0.5 shrink-0 cursor-pointer"
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-encre-noire">
            Je dispose d'un véhicule utilisable pour les trajets de l'association
          </span>
          <span className="text-[10px] text-cordel-master-dark/75 leading-relaxed">
            Permet de pré-remplir automatiquement vos propositions de covoiturage lors des événements et informe le pôle logistique des capacités de transport disponibles.
          </span>
        </div>
      </label>

      {/* Détails du véhicule (affichés uniquement si hasVehicle est activé) */}
      {hasVehicle && (
        <div className="flex flex-col gap-3.5 pt-1 animate-fade-in">
          {/* Type de véhicule */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Catégorie de véhicule
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType || 'Berline'}
              onChange={handleChange}
              disabled={disabled}
              className="theme-input w-full text-xs font-bold py-1.5 cursor-pointer bg-cordel-bg-light"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Places assises et Coffre Alfaias avec boutons ergonomiques +/- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Places passagers libres */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-encre-noire/15 bg-cordel-bg/40">
              <label className="text-[9.5px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>Places assises passagers</span>
                <span className="text-[8.5px] font-normal italic opacity-75">(hors conducteur)</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleSeatsStep(-1)}
                  disabled={disabled || (parseInt(formData.defaultPassengerSeats, 10) || 0) <= 1}
                  className="w-7 h-7 rounded border border-encre-noire bg-cordel-bg font-black text-xs hover:bg-cordel-hover cursor-pointer disabled:opacity-40 select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  name="defaultPassengerSeats"
                  min="1"
                  max="8"
                  value={formData.defaultPassengerSeats !== undefined ? formData.defaultPassengerSeats : 3}
                  onChange={handleChange}
                  disabled={disabled}
                  className="theme-input text-xs font-black text-center py-1 flex-1 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSeatsStep(1)}
                  disabled={disabled || (parseInt(formData.defaultPassengerSeats, 10) || 0) >= 8}
                  className="w-7 h-7 rounded border border-encre-noire bg-cordel-bg font-black text-xs hover:bg-cordel-hover cursor-pointer disabled:opacity-40 select-none"
                >
                  +
                </button>
              </div>
              <span className="text-[8.5px] text-cordel-master-dark/65 mt-0.5">
                Places réelles pour les autres membres de la troupe.
              </span>
            </div>

            {/* Capacité coffre pour Alfaias */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-encre-noire/15 bg-cordel-bg/40">
              <label className="text-[9.5px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>Capacité coffre (Alfaias)</span>
                <span className="text-[8.5px] font-normal italic opacity-75">(gros fûts)</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleTrunkStep(-1)}
                  disabled={disabled || (parseInt(formData.defaultTrunkCapacity, 10) || 0) <= 0}
                  className="w-7 h-7 rounded border border-encre-noire bg-cordel-bg font-black text-xs hover:bg-cordel-hover cursor-pointer disabled:opacity-40 select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  name="defaultTrunkCapacity"
                  min="0"
                  max="10"
                  value={formData.defaultTrunkCapacity !== undefined ? formData.defaultTrunkCapacity : 1}
                  onChange={handleChange}
                  disabled={disabled}
                  className="theme-input text-xs font-black text-center py-1 flex-1 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleTrunkStep(1)}
                  disabled={disabled || (parseInt(formData.defaultTrunkCapacity, 10) || 0) >= 10}
                  className="w-7 h-7 rounded border border-encre-noire bg-cordel-bg font-black text-xs hover:bg-cordel-hover cursor-pointer disabled:opacity-40 select-none"
                >
                  +
                </button>
              </div>
              <span className="text-[8.5px] text-cordel-master-dark/65 mt-0.5">
                Nombre de fûts logeables dans le coffre sans encombrer les sièges.
              </span>
            </div>
          </div>

          {/* Équipements spécifiques (Barres de toit / Attelage) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Équipements spécifiques
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded border border-dashed border-cordel-master-dark/15 bg-white/60 cursor-pointer select-none hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  name="hasRoofBars"
                  checked={Boolean(formData.hasRoofBars)}
                  onChange={(e) => handleChange({ target: { name: 'hasRoofBars', value: e.target.checked } })}
                  disabled={disabled}
                  className="w-3.5 h-3.5 rounded border border-encre-noire accent-cordel-wood cursor-pointer"
                />
                <span className="text-xs font-semibold text-encre-noire">
                  📦 Barres de toit / Galerie
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded border border-dashed border-cordel-master-dark/15 bg-white/60 cursor-pointer select-none hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  name="hasTowHitch"
                  checked={Boolean(formData.hasTowHitch)}
                  onChange={(e) => handleChange({ target: { name: 'hasTowHitch', value: e.target.checked } })}
                  disabled={disabled}
                  className="w-3.5 h-3.5 rounded border border-encre-noire accent-cordel-wood cursor-pointer"
                />
                <span className="text-xs font-semibold text-encre-noire">
                  🔗 Crochet d'attelage (remorque)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
