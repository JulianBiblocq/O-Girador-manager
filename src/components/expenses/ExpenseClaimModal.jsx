import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { getSeasonFromDate } from '../../utils/seasonUtils';

/**
 * Modale de déclaration d'une note de frais par l'adhérent.
 * 
 * Permet de saisir la date, le montant, le motif, de téléverser un justificatif
 * (photo ou PDF) et de renseigner ou confirmer son IBAN pour le virement.
 */
export default function ExpenseClaimModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  profileData
}) {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [dateDepense, setDateDepense] = useState(todayStr);
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [userIban, setUserIban] = useState(profileData?.iban || profileData?.ribIban || '');
  const [formError, setFormError] = useState('');

  // Calcul dynamique de la saison en fonction de la date saisie
  const computedSeason = useMemo(() => {
    return getSeasonFromDate(dateDepense);
  }, [dateDepense]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }

    // Vérification de la taille (max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Le fichier justificatif est trop volumineux (10 Mo maximum).");
      setReceiptFile(null);
      return;
    }

    setFormError('');
    setReceiptFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!dateDepense) {
      setFormError("Veuillez sélectionner la date de la dépense.");
      return;
    }

    const parsedAmount = parseFloat(montant);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Veuillez saisir un montant valide supérieur à 0 €.");
      return;
    }

    if (!motif.trim()) {
      setFormError("Veuillez préciser le motif ou la nature de l'achat.");
      return;
    }

    if (!receiptFile) {
      setFormError("Veuillez joindre une photo ou un fichier PDF du justificatif.");
      return;
    }

    try {
      await onSubmit({
        dateDepense,
        montant: parsedAmount,
        motif: motif.trim(),
        receiptFile,
        userIban: userIban.trim()
      });
      // Réinitialisation du formulaire à la fermeture
      setMontant('');
      setMotif('');
      setReceiptFile(null);
      onClose();
    } catch (err) {
      setFormError(err.message || "Erreur lors de l'enregistrement de la note de frais.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fadeIn">
      <div className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left">
          {/* En-tête de la modale */}
          <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              🧾 Déclarer une note de frais
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-sm font-black text-cordel-master-dark hover:text-cordel-wood p-1 cursor-pointer transition-colors"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Bannière d'information saison */}
          <div className="bg-[#fdfaf2] dark:bg-[#201d1a] border border-dashed border-cordel-master-dark/25 p-2.5 rounded-[4px_6px_3px_5px] flex items-center justify-between text-xs">
            <span className="font-bold text-cordel-master-dark">
              Associé à la saison :
            </span>
            <span className="theme-stamp-badge font-black uppercase text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-600/30">
              📅 {computedSeason}
            </span>
          </div>

          {formError && (
            <div className="bg-red-100 border-l-4 border-red-600 text-red-900 dark:bg-red-950/40 dark:text-red-300 p-2.5 rounded text-xs font-bold animate-fadeIn">
              ⚠️ {formError}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Date de la dépense */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Date de l'achat / dépense *
              </label>
              <input
                type="date"
                value={dateDepense}
                onChange={(e) => setDateDepense(e.target.value)}
                disabled={submitting}
                required
                className="theme-input text-xs font-bold py-1.5 w-full bg-cordel-bg-light"
              />
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Montant total (€ TTC) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex : 24.50"
                  disabled={submitting}
                  required
                  className="theme-input text-xs font-bold py-1.5 pr-8 w-full bg-cordel-bg-light"
                />
                <span className="absolute right-3 top-2 text-xs font-extrabold text-cordel-master-dark opacity-60">
                  €
                </span>
              </div>
            </div>

            {/* Motif */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Motif / Description de l'achat *
              </label>
              <textarea
                rows={2}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex : Corde pour alfaias, peaux de rechange, pharmacie défilé..."
                disabled={submitting}
                required
                className="theme-input text-xs font-semibold py-1.5 w-full bg-cordel-bg-light resize-none leading-relaxed"
              />
            </div>

            {/* Justificatif */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Justificatif (Ticket de caisse, Facture, PDF ou Photo) *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={submitting}
                required
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-cordel-master-dark/30 file:text-[10px] file:font-black file:uppercase file:bg-cordel-wood file:text-cordel-bg-light hover:file:opacity-90 cursor-pointer"
              />
              {receiptFile && (
                <span className="text-[10px] text-green-700 dark:text-green-400 font-bold mt-0.5">
                  📎 {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} Ko)
                </span>
              )}
            </div>

            {/* IBAN du membre */}
            <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/20">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>Mon IBAN pour le virement</span>
                <span className="text-[8px] font-semibold text-cordel-master-dark/60 lowercase italic">
                  (facultatif mais recommandé)
                </span>
              </label>
              <input
                type="text"
                value={userIban}
                onChange={(e) => setUserIban(e.target.value.toUpperCase())}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                disabled={submitting}
                className="theme-input text-xs font-mono font-bold py-1.5 w-full bg-cordel-bg-light tracking-wider"
              />
              <span className="text-[9px] text-cordel-master-dark/70 italic">
                💡 Cet IBAN sera mis à jour sur votre profil pour accélérer vos futurs remboursements.
              </span>
            </div>

            {/* Boutons d'action */}
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
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={submitting}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider"
              >
                {submitting ? "Téléversement..." : "Envoyer la demande"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
