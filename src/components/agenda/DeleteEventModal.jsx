import React, { useEffect } from 'react';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel de suppression définitive d'un événement ou d'un sondage complet.
 * Propose 3 actions explicites : suppression silencieuse, suppression avec notification aux membres, ou annulation.
 */
export default function DeleteEventModal({
  isOpen = false,
  onClose,
  onConfirmDelete,
  eventTitle = '',
  isPoll = false,
  deleting = false,
  t: propT
}) {
  const { t: contextT } = useTranslation();
  const t = typeof propT === 'function' ? propT : contextT;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleting, onClose]);

  if (!isOpen) return null;

  const tr = (key, fallback) => {
    if (typeof t === 'function') {
      const val = t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-event-modal-title"
    >
      <div className="relative z-10 bg-cordel-bg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_7px_10px] p-5 max-w-md w-full text-left flex flex-col gap-4">
        {/* En-tête Cordel */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded border-2 border-encre-noire flex items-center justify-center text-base shrink-0 bg-cordel-wood text-white shadow-[1.5px_1.5px_0px_0px_#181716]">
              🗑️
            </span>
            <div className="flex flex-col min-w-0">
              <h3 id="delete-event-modal-title" className="text-sm font-black uppercase tracking-wider text-cordel-wood leading-snug">
                {tr('agenda.deleteModalTitle', 'Supprimer définitivement cet événement ?')}
              </h3>
              {eventTitle && (
                <span className="text-[11px] font-bold text-encre-noire/80 truncate">
                  {isPoll ? `📊 ${eventTitle}` : eventTitle}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-encre-noire/70 hover:text-encre-noire p-1 text-sm font-black cursor-pointer transition-colors shrink-0"
            aria-label={tr('common.close', 'Fermer')}
          >
            ✕
          </button>
        </div>

        {/* Message explicatif */}
        <p className="text-xs font-semibold leading-relaxed text-encre-noire bg-cordel-bg-light p-3 rounded-[6px_8px_6px_8px] border border-dashed border-encre-noire/30">
          {tr(
            'agenda.deleteModalMessage',
            "Cette date sera effacée de l'agenda. Souhaitez-vous envoyer une notification aux membres ou supprimer en silence (recommandé en cas d'erreur de saisie) ?"
          )}
        </p>

        {/* 3 boutons d'action explicites */}
        <div className="flex flex-col gap-2.5 pt-1">
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            disabled={deleting}
            onClick={() => onConfirmDelete && onConfirmDelete({ sendPush: false })}
            className="w-full py-2.5 px-3 text-xs font-black uppercase tracking-wider justify-center"
          >
            {deleting ? '...' : tr('agenda.deleteModalSilentBtn', '🗑️ Supprimer sans notifier')}
          </CordelButton>

          <CordelButton
            type="button"
            variant="rouge"
            useExtremeBorder={true}
            disabled={deleting}
            onClick={() => onConfirmDelete && onConfirmDelete({ sendPush: true })}
            className="w-full py-2.5 px-3 text-xs font-black uppercase tracking-wider justify-center"
          >
            {deleting ? '...' : tr('agenda.deleteModalNotifyBtn', '🔔 Supprimer et notifier les membres')}
          </CordelButton>

          <CordelButton
            type="button"
            variant="default"
            disabled={deleting}
            onClick={onClose}
            className="w-full py-2 px-3 text-xs font-bold uppercase tracking-wider justify-center"
          >
            {tr('agenda.deleteModalCancelBtn', 'Annuler')}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
