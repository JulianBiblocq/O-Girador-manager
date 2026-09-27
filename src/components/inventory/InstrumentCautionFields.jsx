import React from 'react';
import { CAUTION_STATUS_OPTIONS, CAUTION_TYPES } from './inventoryConstants';

/**
 * Sous-composant pour les champs détaillés d'une caution (montant, statut, type, référence).
 *
 * @param {Object} props
 * @param {Object} props.caution Données de caution
 * @param {Function} props.onChange Gestionnaire de modification
 * @param {boolean} props.saving État de sauvegarde
 * @param {Function} props.t Fonction de traduction
 */
export default function InstrumentCautionFields({ caution, onChange, saving = false, t }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 animate-fadeIn">
      {/* Montant de la caution */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">
          {(t && t('inventory.cautionMontantLabel')) || "Montant (€)"}
        </label>
        <input
          type="number"
          min="0"
          step="5"
          value={caution.montant !== undefined ? caution.montant : 150}
          onChange={(e) => onChange('montant', parseFloat(e.target.value) || 0)}
          disabled={saving}
          className="theme-input text-xs font-bold py-1 px-2 bg-white dark:bg-stone-800"
          placeholder="150"
        />
      </div>

      {/* Statut de la caution */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">
          {(t && t('inventory.cautionStatutLabel')) || "Statut caution"}
        </label>
        <select
          value={caution.statut && caution.statut !== 'non_requise' ? caution.statut : 'en_attente'}
          onChange={(e) => onChange('statut', e.target.value)}
          disabled={saving}
          className={`theme-input text-xs font-black py-1 px-2 ${
            caution.statut === 'recue'
              ? 'bg-green-50 text-[var(--color-cordel-vert)] border-[#2d6a4f]/40'
              : caution.statut === 'restituee'
                ? 'bg-stone-100 text-stone-600 border-stone-300'
                : 'bg-amber-50 text-[var(--color-cordel-ocre)] border-[#c05621]/40'
          }`}
        >
          {CAUTION_STATUS_OPTIONS.filter((s) => s.id !== 'non_requise').map((sOpt) => (
            <option key={sOpt.id} value={sOpt.id}>
              {sOpt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Type de garantie */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">
          {(t && t('inventory.cautionTypeLabel')) || "Type de garantie"}
        </label>
        <select
          value={caution.type || caution.typeGarantie || 'cheque'}
          onChange={(e) => onChange('type', e.target.value)}
          disabled={saving}
          className="theme-input text-xs font-bold py-1 px-2 bg-white dark:bg-stone-800"
        >
          {CAUTION_TYPES.map((tOpt) => (
            <option key={tOpt.id} value={tOpt.id}>
              {tOpt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Référence / N° de chèque */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">
          {(t && t('inventory.cautionRefLabel')) || "Réf. / N° Chèque"}
        </label>
        <input
          type="text"
          value={caution.referencePiece || caution.reference || ''}
          onChange={(e) => {
            onChange('referencePiece', e.target.value);
            onChange('reference', e.target.value);
          }}
          disabled={saving}
          placeholder="ex: CHQ-849201"
          className="theme-input text-xs font-bold py-1 px-2 bg-white dark:bg-stone-800"
        />
      </div>
    </div>
  );
}
