/**
 * Modale Cordel d'annulation tardive (Désistement après date limite).
 * Propose un sas d'échange bienveillant et sensibilise l'adhérent
 * avant de basculer son statut en absent et d'alerter les responsables.
 *
 * Conforme à la charte graphique Cordel et à la règle anti-monolithe.
 */

import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * @param {boolean} isOpen Indique si la modale est affichée
 * @param {Function} onClose Callback de fermeture / annulation
 * @param {Function} onConfirm Callback de confirmation avec le mot de l'adhérent (motTexte)
 * @param {string} [eventName] Intitulé de l'événement concerné
 * @param {boolean} [submitting=false] Indique si la requête est en cours
 * @param {Function} [t] Fonction de traduction optionnelle
 */
export default function LateCancellationModal({
  isOpen,
  onClose,
  onConfirm,
  eventName = '',
  submitting = false,
  t: propT
}) {
  const { t: contextT } = useTranslation();
  const t = typeof propT === 'function' ? propT : contextT;
  const [message, setMessage] = useState('');

  // Réinitialisation du message à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setMessage('');
    }
  }, [isOpen]);

  // Fermeture sur la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    await onConfirm(message.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="late-cancel-modal-title"
    >
      <div className="relative z-10 bg-cordel-bg dark:bg-[#1a1918] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_7px_10px] p-5 max-w-lg w-full text-left overflow-hidden flex flex-col gap-4 max-h-[90vh]">
        {/* En-tête avec titre et bouton fermer */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded border flex items-center justify-center text-base shrink-0 bg-[#8b2a1a]/15 text-[#8b2a1a] border-[#8b2a1a]/30 shadow-xs">
              ⚠️
            </span>
            <div className="flex flex-col">
              <h3 id="late-cancel-modal-title" className="text-sm font-black uppercase tracking-wider text-cordel-wood">
                {t('agenda.absenceReasonTitle') || "Motif de l'absence"}
              </h3>
              {eventName && (
                <span className="text-[11px] font-bold text-cordel-master-dark/80 truncate max-w-[280px]">
                  {eventName}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-stone-500 hover:text-encre-noire p-1 text-sm font-black cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Message de sensibilisation bienveillant */}
        <div className="p-3 bg-amber-500/10 dark:bg-amber-950/20 border-2 border-dashed border-[#8b2a1a]/30 rounded-[6px_8px_6px_8px] text-xs leading-relaxed text-encre-noire">
          <p className="font-medium">
            Les inscriptions sont désormais closes et l'organisation de la sortie a été calée avec toi.
            Un désistement bouscule un peu l'équilibre de la troupe, mais nous savons bien que les imprévus arrivent !
          </p>
        </div>

        {/* Formulaire de mot pour l'équipe */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="late-cancel-message" className="text-[11px] font-black uppercase tracking-wide text-cordel-wood">
              {t('agenda.absenceReasonTitle') || "Motif de l'absence"} (optionnel) :
            </label>
            <textarea
              id="late-cancel-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting}
              placeholder={t('agenda.absenceReasonPlaceholder') || "Précise la raison de ton absence..."}
              className="w-full text-xs font-semibold p-2.5 rounded-[4px_6px_5px_4px] bg-cordel-bg-light border-2 border-encre-noire/40 focus:border-encre-noire outline-none resize-none leading-relaxed text-encre-noire"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-bold text-encre-noire/75 hover:text-encre-noire hover:bg-black/5 rounded cursor-pointer transition-colors"
            >
              Garder ma place
            </button>
            <CordelButton
              type="submit"
              variant="danger"
              useExtremeBorder={true}
              disabled={submitting}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider"
            >
              {submitting ? "Enregistrement..." : (t('agenda.confirmAbsence') || "Confirmer l'absence")}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
