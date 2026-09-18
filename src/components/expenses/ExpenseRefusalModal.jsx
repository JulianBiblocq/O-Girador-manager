import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fadeIn">
      <div className="max-w-md w-full">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left">
          {/* Titre */}
          <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-rouge)] flex items-center gap-1.5">
              🛑 Refuser la note de frais
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-sm font-black text-cordel-master-dark hover:text-cordel-wood p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

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
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

            {/* Actions */}
            <div className="flex gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                type="button"
                variant="default"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider"
              >
                Annuler
              </CordelButton>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-rouge)] text-white rounded border border-red-900 shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer select-none"
              >
                {submitting ? "Envoi..." : "Confirmer le refus"}
              </button>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
