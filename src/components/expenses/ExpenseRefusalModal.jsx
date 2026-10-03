import React, { useState } from 'react';
import CordelButton from '../CordelButton';
import useModalEscape from '../../hooks/useModalEscape';

/**
 * Modale permettant au trésorier de justifier le refus d'une note de frais.
 * 
 * La saisie d'un motif clair est requise avant validation du refus. Ce motif
 * est ensuite notifié à l'adhérent par notification push FCM et visible sur son profil.
 */
export default function ExpenseRefusalModal({
  isOpen,
  claim,
  onClose,
  onConfirmRefusal,
  submitting
}) {
  const [motifRefus, setMotifRefus] = useState('');
  const [error, setError] = useState('');

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose, submitting);

  if (!isOpen || !claim) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motifRefus.trim()) {
      setError("Veuillez impérativement préciser la raison du refus.");
      return;
    }

    try {
      await onConfirmRefusal(claim, motifRefus.trim());
      setMotifRefus('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du refus.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-encre-noire shadow-2xl overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg-light">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-rouge)] flex items-center gap-1.5">
            🛑 Refuser la note de frais
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-sm font-black text-cordel-master-dark hover:text-cordel-wood p-1 cursor-pointer transition-colors shrink-0"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-3.5 text-xs">

          {/* Rappel de la note */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-dashed border-red-700/30 p-2.5 rounded text-xs flex flex-col gap-1">
            <span className="font-bold text-encre-noire dark:text-cordel-bg-light">
              Demande de : <span className="text-cordel-wood">{claim.userName || 'Membre'}</span>
            </span>
            <span className="text-[11px] text-cordel-master-dark">
              Montant : <strong>{(parseFloat(claim.montant) || 0).toFixed(2)} €</strong> — Motif : <em>{claim.motif}</em>
            </span>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-2 rounded text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* Formulaire */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Motif du refus (transmis à l'adhérent) *
              </label>
              <textarea
                rows={3}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Justificatif illisible, dépense non autorisée par le bureau, ticket manquant..."
                disabled={submitting}
                required
                className="theme-input text-xs font-semibold py-1.5 w-full bg-cordel-bg-light resize-none leading-relaxed"
              />
            </div>

            <p className="text-[9px] text-cordel-master-dark/70 italic">
              ℹ️ Une notification push sera immédiatement envoyée à l'adhérent avec cette explication.
            </p>
          </div>
        </div>

        {/* 3. Footer Actions (Fixe) */}
        <div className="shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] flex gap-2.5 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider shrink-0"
            >
              Annuler
            </CordelButton>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-rouge)] text-white rounded border border-red-900 shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer select-none shrink-0"
            >
              {submitting ? "Envoi..." : "Confirmer le refus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
