import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * Formulaire de proposition d'un véhicule dans le covoiturage.
 * Intègre la capacité, les places réservées et la case simple "Retour direct".
 *
 * @param {Object} props
 */
export default function CarpoolProposerForm({
  voitureForm,
  setVoitureForm,
  submittingCovoit = false,
  handleProposerVoiture,
  onCancel
}) {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleProposerVoiture} className="flex flex-col gap-3 theme-inner-panel p-4 rounded text-left">
      <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood">
        {t('agenda.carpoolProposeVehicle') || "Je propose mon véhicule"}
      </h5>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Places passagers totales
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={voitureForm.passengerSeats}
            onChange={(e) => setVoitureForm((prev) => ({ ...prev, passengerSeats: parseInt(e.target.value, 10) || 0 }))}
            disabled={submittingCovoit}
            required
            className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Volume coffre (Alfaias)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={voitureForm.trunkAlfayaCapacity}
            onChange={(e) => setVoitureForm((prev) => ({ ...prev, trunkAlfayaCapacity: parseInt(e.target.value, 10) || 0 }))}
            disabled={submittingCovoit}
            required
            className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
          />
        </div>
      </div>

      {/* Option Retour direct simplifié */}
      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-amber-950 bg-amber-50 p-2 rounded border border-amber-200">
          <input
            type="checkbox"
            checked={Boolean(voitureForm.retourDirect)}
            onChange={(e) => setVoitureForm((prev) => ({ ...prev, retourDirect: e.target.checked }))}
            disabled={submittingCovoit}
            className="accent-amber-700 w-4 h-4 cursor-pointer"
          />
          <span>⚡ Retour direct après le jeu (impératif horaire)</span>
        </label>
      </div>

      {/* Places réservées hors association */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dashed border-cordel-master-dark/15 pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Places réservées hors-asso
          </label>
          <input
            type="number"
            min="0"
            max={Math.max(0, (voitureForm.passengerSeats || 1) - 1)}
            value={voitureForm.placesReserveesExternes || 0}
            onChange={(e) =>
              setVoitureForm((prev) => ({
                ...prev,
                placesReserveesExternes: Math.max(0, Math.min((prev.passengerSeats || 1) - 1, parseInt(e.target.value, 10) || 0))
              }))
            }
            disabled={submittingCovoit}
            className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Motif réservation externe
          </label>
          <input
            type="text"
            placeholder="Ex: Caméraman officiel"
            value={voitureForm.motifReserveesExternes || ''}
            onChange={(e) => setVoitureForm((prev) => ({ ...prev, motifReserveesExternes: e.target.value }))}
            disabled={submittingCovoit || !voitureForm.placesReserveesExternes}
            className="theme-input text-xs font-bold py-1 bg-cordel-bg-light disabled:opacity-50"
          />
        </div>
      </div>

      {/* Matériel */}
      <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Matériel collectif pris en charge
        </label>
        <input
          type="text"
          placeholder="Ex: sac de baguettes, 3 caixas..."
          value={voitureForm.materielCharge || ''}
          onChange={(e) => setVoitureForm((prev) => ({ ...prev, materielCharge: e.target.value }))}
          disabled={submittingCovoit}
          className="theme-input text-xs font-bold py-1 bg-cordel-bg-light"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Matériel transporté (Coffre)
        </label>
        <input
          type="text"
          placeholder="Ex: Je prends 2 Alfaias, mon coffre est plein..."
          value={voitureForm.materielTransporte || ''}
          onChange={(e) => setVoitureForm((prev) => ({ ...prev, materielTransporte: e.target.value }))}
          disabled={submittingCovoit}
          className="theme-input text-xs font-bold py-1 bg-cordel-bg-light"
        />
      </div>

      <div className="flex gap-2 justify-end mt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submittingCovoit}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submittingCovoit}
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-vert border border-encre-noire px-3.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
        >
          {submittingCovoit ? 'Envoi...' : 'Valider'}
        </button>
      </div>
    </form>
  );
}
