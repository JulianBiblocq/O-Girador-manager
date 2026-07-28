import React, { useEffect } from 'react';
import CordelButton from './CordelButton';
import { XiloShield, XiloSparkles, XiloClose } from './XiloIcons';

/**
 * ConfirmModal - Composant de confirmation et d'alerte modale style Cordel / Xilo
 * Remplaçant élégant et immersif pour window.confirm et window.alert natifs.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Oui, confirmer",
  cancelText = "Annuler",
  variant = "danger", // 'danger' | 'warning' | 'info' | 'success'
  isAlert = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const showCancel = !isAlert && cancelText !== null && cancelText !== '';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onConfirm}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-[#fcf8f2] dark:bg-[#1a1918] border-2 border-dashed border-cordel-master-dark/40 shadow-2xl rounded-lg p-5 max-w-md w-full text-left overflow-hidden flex flex-col gap-3.5">
        
        {/* Header with Xilo Icon */}
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded border shadow-xs shrink-0 ${
              isSuccess
                ? 'bg-[#2d6a4f]/15 text-[#2d6a4f] dark:text-emerald-400 border-[#2d6a4f]/30'
                : isDanger 
                ? 'bg-[#8b2a1a]/15 text-[#8b2a1a] dark:text-red-400 border-[#8b2a1a]/30' 
                : isWarning 
                ? 'bg-[#c05621]/15 text-[#c05621] dark:text-amber-400 border-[#c05621]/30'
                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
            }`}>
              {isSuccess ? <XiloSparkles size={22} /> : <XiloShield size={22} />}
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood opacity-80">
                {isSuccess ? '✨ Message de confirmation' : isDanger ? '⚠️ Action irréversible' : isWarning ? '📋 Attention' : 'ℹ️ Information'}
              </span>
              <h3 className="font-cactus font-bold text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg">
                {title || (isSuccess ? 'Opération réussie' : isDanger ? 'Confirmation de suppression' : 'Information')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5"
            title="Fermer (Entrée / Échap)"
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
          {showCancel && (
            <CordelButton
              variant="default"
              onClick={onCancel}
              className="text-xs px-4 py-2 opacity-90 hover:opacity-100"
            >
              {cancelText}
            </CordelButton>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs font-black uppercase tracking-wider px-5 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer ${
              isSuccess
                ? 'bg-[#2d6a4f] hover:brightness-110 text-white'
                : isDanger
                ? 'bg-[#8b2a1a] hover:brightness-110 text-white'
                : 'bg-[#c05621] hover:brightness-110 text-white'
            }`}
          >
            {confirmText || (isAlert ? "OK" : "Confirmer")}
          </button>
        </div>
      </div>
    </div>
  );
}
