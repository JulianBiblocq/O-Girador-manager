import React, { useEffect } from 'react';
import CordelButton from './CordelButton';
import { XiloShield, XiloClose } from './XiloIcons';

/**
 * ConfirmModal - Composant de confirmation modale style Cordel / Xilo
 * Remplaçant élégant et immersif pour window.confirm native.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Oui, confirmer",
  cancelText = "Annuler",
  variant = "danger", // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-[#fcf8f2] dark:bg-[#1a1918] border-2 border-dashed border-cordel-master-dark/40 shadow-2xl rounded-lg p-5 max-w-md w-full text-left overflow-hidden flex flex-col gap-3.5">
        
        {/* Header with Xilo Icon */}
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded border shadow-xs shrink-0 ${
              isDanger 
                ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800' 
                : isWarning 
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
            }`}>
              <XiloShield size={22} />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood opacity-80">
                {isDanger ? '⚠️ Action irréversible' : '📋 Confirmation'}
              </span>
              <h3 className="font-cactus font-bold text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg">
                {title || (isDanger ? 'Confirmation de suppression' : 'Confirmer l\'action')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5"
            title="Fermer (Échap)"
          >
            <XiloClose size={18} />
          </button>
        </div>

        {/* Body Message */}
        <div className="bg-white/60 dark:bg-black/30 p-3 rounded border border-cordel-master-dark/15">
          <p className="text-xs font-semibold text-encre-noire dark:text-cordel-bg leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1 mt-1">
          <CordelButton
            variant="default"
            onClick={onCancel}
            className="text-xs px-4 py-2 opacity-90 hover:opacity-100"
          >
            {cancelText}
          </CordelButton>

          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs font-black uppercase tracking-wider px-4 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer ${
              isDanger
                ? 'bg-red-700 hover:bg-red-800 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
