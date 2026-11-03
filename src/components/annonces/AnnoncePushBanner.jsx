import React, { useMemo } from 'react';
import CordelButton from '../CordelButton';
import { messaging } from '../../firebase';

/**
 * Bannière d'incitation à l'activation des notifications push (Accueil).
 * Détecte les navigateurs intégrés (WhatsApp, Instagram, Facebook) ainsi que Safari iOS
 * hors écran d'accueil pour guider l'adhérent pas à pas.
 */
export default function AnnoncePushBanner({
  onEnableNotifications,
  isSubscribingPush,
  installPromptAvailable = false,
  onTriggerInstall = null,
  t
}) {
  const envInfo = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { isInAppBrowser: false, isIosNotStandalone: false, isPermissionDenied: false };
    }
    const ua = navigator.userAgent || '';
    const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram/i.test(ua);
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone =
      Boolean(window.navigator.standalone) ||
      Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    const isIosNotStandalone = isIos && !isStandalone;
    const isPermissionDenied = 'Notification' in window && Notification.permission === 'denied';
    return { isInAppBrowser, isIosNotStandalone, isPermissionDenied };
  }, []);

  return (
    <div className="mb-1 p-3 rounded border-2 border-[var(--color-cordel-ocre,#c05621)] bg-[#fffaf0] dark:bg-amber-950/30 shadow-[2px_2px_0px_0px_#181716] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 text-left">
        <span className="text-xl leading-none mt-0.5 select-none">
          {envInfo.isInAppBrowser ? '📱' : '🔔'}
        </span>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-encre-noire dark:text-amber-100">
            {t('widgetAnnonces.pushBannerTitle')}
          </h4>
          {envInfo.isInAppBrowser ? (
            <p className="text-[11px] font-bold text-[var(--color-cordel-rouge,#8b2a1a)] dark:text-amber-200 leading-snug mt-0.5">
              {t('widgetAnnonces.pushInAppWarning') ||
                "📱 Tu as ouvert ce lien dans WhatsApp/Instagram. Appuie sur les 3 points ⋮ (ou 🧭) pour l'ouvrir dans Chrome ou Safari et activer les alertes."}
            </p>
          ) : envInfo.isIosNotStandalone && !messaging ? (
            <p className="text-[11px] text-stone-700 dark:text-amber-200/90 leading-snug mt-0.5">
              {t('widgetAnnonces.pushIosInstallHint') ||
                "📲 Sur iPhone/iPad, touche Partager ⬆️ en bas de Safari puis « Sur l'écran d'accueil ➕ » pour recevoir les notifications du groupe."}
            </p>
          ) : envInfo.isPermissionDenied ? (
            <p className="text-[11px] text-stone-700 dark:text-amber-200/90 leading-snug mt-0.5">
              {t('widgetAnnonces.pushBlockedHint') ||
                "🔒 Les notifications sont bloquées dans les réglages de ton navigateur (icône 🔒 à gauche de l'adresse web). Autorise-les puis réessaie."}
            </p>
          ) : (
            <p className="text-[11px] text-stone-700 dark:text-amber-200/80 leading-snug mt-0.5">
              {t('widgetAnnonces.pushBannerDesc')}
            </p>
          )}
        </div>
      </div>

      {!envInfo.isInAppBrowser && (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {installPromptAvailable && onTriggerInstall && (
            <CordelButton
              variant="default"
              onClick={onTriggerInstall}
              className="text-[10px] py-1.5 px-3 shrink-0 font-black uppercase tracking-wider w-full sm:w-auto justify-center"
            >
              📲 {t('dashboard.installApp') || "Installer l'appli"}
            </CordelButton>
          )}
          <CordelButton
            variant="ocre"
            onClick={onEnableNotifications}
            disabled={isSubscribingPush}
            className="text-[10px] py-1.5 px-3 shrink-0 font-black uppercase tracking-wider w-full sm:w-auto justify-center"
          >
            {isSubscribingPush
              ? t('widgetAnnonces.activatingPush')
              : t('widgetAnnonces.enablePushBtn')}
          </CordelButton>
        </div>
      )}
    </div>
  );
}
