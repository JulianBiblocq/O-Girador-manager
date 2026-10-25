import React from 'react';
import CordelCard from '../CordelCard';
import { XiloMegaphone } from '../XiloIcons';

/**
 * Composant de bannière d'incitation à l'activation des notifications push.
 */
export default function AnnoncePushBanner({
  onEnableNotifications,
  isSubscribingPush,
  t
}) {
  // Détection iOS hors mode PWA autonome
  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
  const showIosWarning = isIos && !isStandalone;

  return (
    <CordelCard
      variant="ocre"
      useExtremeBorder={true}
      className="p-3 text-left border-dashed flex flex-col gap-2 bg-[#fdfaf2] dark:bg-black/10"
    >
      <div className="flex gap-2 items-start">
        <XiloMegaphone size={18} className="text-cordel-wood shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-extrabold text-[11px] text-encre-noire uppercase tracking-wider">
            {t('widgetAnnonces.bannerTitle')}
          </h4>
          <p className="text-[10px] font-semibold leading-relaxed text-encre-noire/80 mt-0.5">
            {t('widgetAnnonces.bannerText')}
          </p>
        </div>
      </div>

      {/* Avertissement spécifique pour iOS */}
      {showIosWarning && (
        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-[var(--color-cordel-ocre)]/10 border border-dashed border-[var(--color-cordel-ocre)]/30">
          <span className="text-sm shrink-0">📱</span>
          <p className="text-[9px] italic font-semibold leading-relaxed text-encre-noire/80">
            {t('widgetAnnonces.bannerIosWarning')}
          </p>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={isSubscribingPush || showIosWarning}
          onClick={onEnableNotifications}
          className={`text-[9px] font-black uppercase border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all whitespace-nowrap ${
            showIosWarning
              ? 'bg-encre-noire/20 text-encre-noire/40 cursor-not-allowed'
              : 'bg-cordel-wood text-cordel-bg-light cursor-pointer'
          }`}
        >
          {isSubscribingPush ? '...' : t('widgetAnnonces.bannerBtn')}
        </button>
      </div>
    </CordelCard>
  );
}
