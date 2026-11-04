import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';
import CordelCard from '../CordelCard';
import { XiloShield, XiloEyeOff } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import PushTutorialModal, {
  detectPushTutorialDevice,
  openPushTutorialModal
} from '../dashboard/PushTutorialModal';

/**
 * Bloc de diagnostic des notifications Push sur la fiche profil.
 * Lorsque le statut est ACTIVÉ, s'affiche sur une seule ligne compacte dépliable au clic.
 */
export default function NotificationDiagnostic({
  notificationPermission,
  isSubscribingPush,
  onEnableNotifications
}) {
  const { t } = useTranslation();
  const [livePermission, setLivePermission] = useState(notificationPermission || 'default');
  const [isExpanded, setIsExpanded] = useState(false);
  const env = detectPushTutorialDevice();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setLivePermission(Notification.permission);
    }
  }, [notificationPermission]);

  const handleActivateClick = async () => {
    const currentEnv = detectPushTutorialDevice();
    if (
      currentEnv.isInAppBrowser ||
      currentEnv.isIosNotStandalone ||
      currentEnv.isPermissionDenied ||
      livePermission === 'denied'
    ) {
      openPushTutorialModal(currentEnv.mode);
      return;
    }
    if (onEnableNotifications) {
      await onEnableNotifications();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        openPushTutorialModal(currentEnv.mode);
      }
    }
  };

  if (livePermission === 'granted') {
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 flex flex-col gap-2 text-left">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-xs font-black uppercase text-[var(--color-cordel-vert)] truncate">
            ✨ Notifications : STATUT {t('userProfile.statusActive')} ✅
          </span>
          <span className="text-[10px] font-black uppercase text-cordel-wood shrink-0">
            Diagnostic {isExpanded ? '▴' : '▾'}
          </span>
        </button>
        {isExpanded && (
          <div className="pt-2 border-t border-dashed border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex flex-col gap-1">
            <p className="font-semibold">{t('userProfile.diagnosticSubtitle')}</p>
            <p className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
              {t('userProfile.diagnosticConfiguredSuccess')}
            </p>
          </div>
        )}
        <PushTutorialModal />
      </CordelCard>
    );
  }

  const isDenied = livePermission === 'denied';
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col gap-3 text-left">
      <div
        className={`p-2.5 rounded-[6px] border-2 border-dashed flex items-center gap-2.5 ${
          isDenied
            ? 'bg-red-50 dark:bg-red-950/30 border-red-500/40 text-red-700 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/40 text-amber-700 dark:text-amber-400'
        }`}
      >
        <div>{isDenied ? <XiloEyeOff size={18} /> : <XiloShield size={18} />}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-xs uppercase flex items-center justify-between gap-1.5">
            <span className="truncate">{t('userProfile.diagnosticTitle')}</span>
            <span className="text-[9px] bg-white/60 px-1.5 py-0.5 rounded border border-current/20 font-black shrink-0">
              {t('userProfile.statusInactive')}
            </span>
          </h4>
          <p className="text-[10px] opacity-90 font-medium">{t('userProfile.diagnosticSubtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <CordelButton
          type="button"
          variant="danger"
          useExtremeBorder={true}
          onClick={handleActivateClick}
          disabled={isSubscribingPush}
          className="flex-1 py-2 font-black uppercase tracking-wider text-[11px] shadow-[2.5px_2.5px_0px_0px_#181716] disabled:opacity-50"
        >
          {isSubscribingPush ? '⏳ Activation en cours...' : '🔔 Activer les alertes'}
        </CordelButton>
        <button
          type="button"
          onClick={() => openPushTutorialModal(env.mode)}
          className="text-[11px] font-black underline text-[var(--color-cordel-rouge,#8b2a1a)] hover:opacity-80 cursor-pointer py-1 px-2 text-center"
        >
          ❓ Comment débloquer sur mon téléphone ?
        </button>
      </div>

      <PushTutorialModal />
    </CordelCard>
  );
}
