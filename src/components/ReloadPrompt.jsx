import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from './LanguageContext';
import CordelButton from './CordelButton';

/**
 * ReloadPrompt component using virtual:pwa-register to detect SW updates
 * and prompt the user to force reload and fetch the latest files.
 */
export default function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for updates (every hour)
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('ReloadPrompt - SW Registration Error:', error);
    },
  });

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
    // Explicit force reload to guarantee bypass of any intermediate browser caches
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] max-w-sm w-[90%] sm:w-80 p-4 bg-[var(--cordel-bg)] text-[var(--cordel-text)] border-4 border-[var(--cordel-border)] rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_var(--cordel-shadow-color)] flex flex-col gap-3 text-left font-sans animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-extrabold text-sm text-cordel-wood uppercase tracking-wider">
          {t('pwa.newVersion')}
        </span>
        <span className="text-[10px] opacity-75 font-semibold leading-relaxed">
          {t('pwa.newVersionDesc') || 'Une mise à jour est disponible pour cette application. Cliquez pour charger les nouveautés.'}
        </span>
      </div>
      <div className="flex gap-2 justify-end items-center">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="theme-btn px-3 py-1.5 text-xs font-bold rounded-[4px_6px_3px_5px] border border-[var(--cordel-border)]/20 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] hover:brightness-95 cursor-pointer bg-[var(--cordel-master-bg)] text-[var(--cordel-text)] transition-all"
        >
          {t('common.close')}
        </button>
        <CordelButton
          variant="ocre"
          useExtremeBorder={false}
          onClick={handleUpdate}
          className="text-xs font-black px-4 py-1.5 uppercase tracking-wider"
        >
          {t('pwa.updateBtn')}
        </CordelButton>
      </div>
    </div>
  );
}
