import React, { useMemo } from 'react';
import CordelButton from '../CordelButton';
import { messaging } from '../../firebase';
import PushTutorialModal, {
  detectPushTutorialDevice,
  openPushTutorialModal
} from '../dashboard/PushTutorialModal';

/**
 * Bannière d'incitation à l'activation des notifications push (Accueil).
 * Intègre la détection intelligente (WhatsApp, iOS, Chrome bloqué) et le bouton
 * d'aide permanent « ❓ Comment débloquer sur mon téléphone ? ».
 */
export default function AnnoncePushBanner({
  onEnableNotifications,
  isSubscribingPush,
  installPromptAvailable = false,
  onTriggerInstall = null,
  t
}) {
  const envInfo = useMemo(() => detectPushTutorialDevice(), []);

  return (
    <>
      <div className="mb-1 p-3 rounded-[var(--theme-border-radius,8px)] border-2 border-[var(--color-cordel-ocre,#c05621)] bg-[var(--cordel-paper,#fffaf0)] dark:bg-amber-950/30 shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  "📱 Tu as ouvert ce lien dans WhatsApp/Instagram. Appuie sur ••• en haut à droite pour l'ouvrir dans Chrome ou Safari."}
              </p>
            ) : envInfo.isIosNotStandalone && !messaging ? (
              <p className="text-[11px] text-stone-700 dark:text-amber-200/90 leading-snug mt-0.5">
                {t('widgetAnnonces.pushIosInstallHint') ||
                  "📲 Sur iPhone/iPad, touche Partager [↑] en bas de Safari puis « Sur l'écran d'accueil ➕ » pour recevoir les notifications."}
              </p>
            ) : envInfo.isPermissionDenied ? (
              <p className="text-[11px] text-stone-700 dark:text-amber-200/90 leading-snug mt-0.5">
                {t('widgetAnnonces.pushBlockedHint') ||
                  "🔒 Les notifications sont bloquées dans ton navigateur (icône 🔒 à gauche de l'adresse web)."}
              </p>
            ) : (
              <p className="text-[11px] text-stone-700 dark:text-amber-200/80 leading-snug mt-0.5">
                {t('widgetAnnonces.pushBannerDesc')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          {installPromptAvailable && onTriggerInstall && !envInfo.isInAppBrowser && (
            <CordelButton
              variant="default"
              onClick={onTriggerInstall}
              className="text-[10px] py-1.5 px-3 shrink-0 font-black uppercase tracking-wider w-full sm:w-auto justify-center"
            >
              📲 {t('dashboard.installApp') || "Installer l'appli"}
            </CordelButton>
          )}
          <CordelButton
            variant="danger"
            onClick={onEnableNotifications}
            disabled={isSubscribingPush}
            className="text-[10px] py-1.5 px-3 shrink-0 font-black uppercase tracking-wider w-full sm:w-auto justify-center"
          >
            {isSubscribingPush
              ? t('widgetAnnonces.activatingPush')
              : t('widgetAnnonces.enablePushBtn')}
          </CordelButton>
          <button
            type="button"
            onClick={() => openPushTutorialModal(envInfo.mode)}
            className="text-[10px] font-black underline text-[var(--color-cordel-rouge,#8b2a1a)] hover:opacity-80 cursor-pointer py-1 px-1.5 text-center whitespace-nowrap"
          >
            ❓ Comment débloquer sur mon téléphone ?
          </button>
        </div>
      </div>

      <PushTutorialModal />
    </>
  );
}
