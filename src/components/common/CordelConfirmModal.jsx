/**
 * Composant de confirmation et d'alerte modale style Cordel / Xilo.
 * Remplace avantageusement les boîtes de dialogue natives window.confirm et window.alert.
 * Conforme à la charte Cordel (fond papier kraft, bordures franches, encre noire).
 */

import React, { useEffect } from 'react';
import CordelButton from '../CordelButton';
import { XiloShield, XiloSparkles, XiloClose } from '../XiloIcons';

/**
 * CordelConfirmModal
 *
 * @param {boolean} isOpen Indique si la modale est visible
 * @param {string} title Titre affiché en en-tête
 * @param {string} message Message explicatif principal
 * @param {string} [confirmLabel] Texte du bouton d'action
 * @param {string} [confirmText] Alias pour confirmLabel
 * @param {string} [cancelLabel] Texte du bouton d'annulation
 * @param {string} [cancelText] Alias pour cancelLabel
 * @param {'danger' | 'warning' | 'info' | 'success'} [variant='danger'] Variante sémantique
 * @param {boolean} [isAlert=false] Si true, mode alerte simple sans bouton annuler
 * @param {Function} onConfirm Callback déclenché à la validation
 * @param {Function} onCancel Callback déclenché à l'annulation ou fermeture
 */
export default function CordelConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'danger',
  isAlert = false,
  onConfirm,
  onCancel
}) {
  const resolvedConfirmText = confirmLabel || confirmText || (isAlert ? 'OK' : 'Confirmer');
  const resolvedCancelText = cancelLabel || cancelText || 'Annuler';

  // Gestion des raccourcis clavier : Échap annule, Entrée confirme
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const showCancel = !isAlert && resolvedCancelText !== null && resolvedCancelText !== '';

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={(e) => {
        // Fermeture sécurisée : uniquement si le clic provient directement du backdrop
        if (e.target === e.currentTarget) {
          onCancel?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cordel-modal-title"
    >
      {/* Carte centrale Cordel avec texture kraft et bordures franches */}
      <div className="relative z-10 bg-cordel-bg dark:bg-[#1a1918] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_7px_10px] p-5 max-w-md w-full text-left overflow-hidden flex flex-col gap-3.5 max-h-[90vh]">
        
        {/* En-tête avec icône gravée Xilo */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded border shadow-xs shrink-0 ${
                isSuccess
                  ? 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] dark:text-emerald-400 border-[var(--color-cordel-vert)]/30'
                  : isDanger
                  ? 'bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] dark:text-red-400 border-[var(--color-cordel-rouge)]/30'
                  : isWarning
                  ? 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] dark:text-amber-400 border-[var(--color-cordel-ocre)]/30'
                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              }`}
            >
              {isSuccess ? <XiloSparkles size={22} /> : <XiloShield size={22} />}
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood opacity-85">
                {isSuccess
                  ? '✨ Confirmation'
                  : isDanger
                  ? '⚠️ Action irréversible'
                  : isWarning
                  ? '📋 Attention'
                  : 'ℹ️ Information'}
              </span>
              <h3
                id="cordel-modal-title"
                className="font-heading font-black text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg"
              >
                {title || (isSuccess ? 'Opération réussie' : isDanger ? 'Confirmation requise' : 'Information')}
              </h3>
            </div>
          </div>

          {/* Bouton de fermeture d'angle */}
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Fermer (Échap)"
          >
            <XiloClose size={18} />
          </button>
        </div>

        {/* Corps du message explicatif */}
        <div className="bg-white/70 dark:bg-black/30 p-3.5 rounded border border-cordel-master-dark/15 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-encre-noire dark:text-cordel-bg leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Boutons d'action Cordel */}
        <div className="flex items-center justify-end gap-2.5 pt-1 shrink-0">
          {showCancel && (
            <CordelButton
              variant="default"
              onClick={onCancel}
              className="text-xs px-4 py-2 opacity-90 hover:opacity-100"
            >
              {resolvedCancelText}
            </CordelButton>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs font-black uppercase tracking-wider px-5 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer ${
              isSuccess
                ? 'bg-[var(--color-cordel-vert)] hover:brightness-110 text-white'
                : isDanger
                ? 'bg-[var(--color-cordel-rouge)] hover:brightness-110 text-white'
                : isWarning
                ? 'bg-[var(--color-cordel-ocre)] hover:brightness-110 text-white'
                : 'bg-encre-noire hover:bg-neutral-800 text-white'
            }`}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
