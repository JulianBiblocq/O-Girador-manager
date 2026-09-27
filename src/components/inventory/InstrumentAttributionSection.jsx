import React from 'react';
import { REGIME_ATTRIBUTION_OPTIONS } from './inventoryConstants';
import InstrumentCautionFields from './InstrumentCautionFields';

/**
 * Sous-composant dédié au régime d'attribution de l'instrument et à la gestion du dépôt de garantie (caution).
 * Respecte scrupuleusement la règle anti-monolithe (< 200 lignes) et les variables sémantiques Cordel.
 *
 * @param {Object} props
 * @param {Object} props.formData - Données courantes du formulaire instrument
 * @param {Function} props.setFormData - Setter pour modifier les champs du formulaire
 * @param {boolean} [props.saving] - État de sauvegarde en cours
 * @param {Function} [props.t] - Fonction de traduction
 */
export default function InstrumentAttributionSection({
  formData = {},
  setFormData,
  saving = false,
  t
}) {
  const regime = formData.regimeMiseADisposition || 'pret_gratuit';
  const cautionRequise = Boolean(formData.cautionRequise);
  const caution = formData.caution || {
    montant: 150,
    statut: 'non_requise',
    type: 'cheque',
    referencePiece: '',
    dateReception: null,
    encaisse: false
  };

  // Gestion du changement de régime
  const handleRegimeChange = (e) => {
    const newRegime = e.target.value;
    setFormData((prev) => ({
      ...prev,
      regimeMiseADisposition: newRegime
    }));
  };

  // Bascule du toggle d'exigence de caution
  const handleToggleCautionRequise = (e) => {
    const isChecked = e.target.checked;
    setFormData((prev) => {
      const prevCaution = prev.caution || {};
      return {
        ...prev,
        cautionRequise: isChecked,
        caution: {
          ...prevCaution,
          statut: isChecked
            ? (prevCaution.statut && prevCaution.statut !== 'non_requise' ? prevCaution.statut : 'en_attente')
            : 'non_requise',
          montant: prevCaution.montant !== undefined && prevCaution.montant !== null ? prevCaution.montant : 150,
          type: prevCaution.type || 'cheque'
        }
      };
    });
  };

  // Modification d'un champ interne à la caution
  const handleCautionFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      caution: {
        ...(prev.caution || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15">
      {/* 1. Sélecteur du régime d'attribution */}
      <div className="flex flex-col gap-1">
        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
          <span>{(t && t('inventory.regimeMiseADispositionLabel')) || "Régime d'attribution & Prêt"}</span>
          <span className="text-[7.5px] font-semibold text-stone-500 italic">
            {regime === 'pret_gratuit' && "Gracieux (aucune cotisation)"}
            {regime === 'cotisation' && "Cotisation matériel applicable"}
            {regime === 'personnel' && "Propriété du membre"}
          </span>
        </label>

        <select
          name="regimeMiseADisposition"
          value={regime}
          onChange={handleRegimeChange}
          disabled={saving}
          className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
        >
          {REGIME_ATTRIBUTION_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Interrupteur Caution / Dépôt de garantie */}
      <div className="p-2.5 bg-cordel-bg-light/60 border border-encre-noire/15 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cautionRequise}
              onChange={handleToggleCautionRequise}
              disabled={saving}
              className="w-4 h-4 text-cordel-wood rounded cursor-pointer accent-[var(--color-cordel-ocre)]"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-encre-noire">
              {(t && t('inventory.cautionRequiseLabel')) || "🛡️ Caution / Dépôt de garantie exigé"}
            </span>
          </div>

          <span
            className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
              cautionRequise
                ? 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border-[#c05621]/30'
                : 'bg-stone-200/60 text-stone-500 border-stone-300'
            }`}
          >
            {cautionRequise ? "Exigée" : "Non requise"}
          </span>
        </label>

        {/* 3. Champs conditionnels si caution requise */}
        {cautionRequise && (
          <InstrumentCautionFields
            caution={caution}
            onChange={handleCautionFieldChange}
            saving={saving}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
