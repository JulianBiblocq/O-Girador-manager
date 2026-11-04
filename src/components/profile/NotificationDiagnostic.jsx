import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';
import CordelCard from '../CordelCard';
import { XiloSparkles, XiloShield, XiloEyeOff } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import PushTutorialModal, {
  detectPushTutorialDevice,
  openPushTutorialModal
} from '../dashboard/PushTutorialModal';

export default function NotificationDiagnostic({
  notificationPermission,
  isSubscribingPush,
  onEnableNotifications
}) {
  const { t } = useTranslation();
  const [livePermission, setLivePermission] = useState(notificationPermission || 'default');
  const env = detectPushTutorialDevice();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setLivePermission(Notification.permission);
    }
  }, [notificationPermission]);

  const getStatusDisplay = () => {
    switch (livePermission) {
      case 'granted':
        return {
          label: t('userProfile.statusActive'),
          color: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-500/40',
          icon: <XiloSparkles size={20} />
        };
      case 'denied':
        return {
          label: t('userProfile.statusInactive'),
          color: 'text-red-700 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-500/40',
          icon: <XiloEyeOff size={20} />
        };
      default:
        return {
          label: t('userProfile.statusInactive'),
          color: 'text-amber-700 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-500/40',
          icon: <XiloShield size={20} />
        };
    }
  };

  const status = getStatusDisplay();

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

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="flex flex-col gap-3">
      <div className={`p-3 rounded-[6px] text-left border-2 border-dashed ${status.bg} ${status.border}`}>
        <div className="flex items-center gap-2.5">
          <div className={status.color}>{status.icon}</div>
          <div className="flex-1">
            <h4 className={`font-black text-xs uppercase flex items-center justify-between gap-1.5 ${status.color}`}>
              {t('userProfile.diagnosticTitle')}
              <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded border border-current/20 font-black">
                {livePermission === 'granted' ? t('userProfile.statusActive') : t('userProfile.statusInactive')}
              </span>
            </h4>
            <p className={`text-[10px] opacity-90 font-medium ${status.color}`}>
              {t('userProfile.diagnosticSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-encre-noire font-medium text-left flex flex-col gap-3">
        {livePermission === 'granted' ? (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
            {t('userProfile.diagnosticConfiguredSuccess')}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
            <CordelButton
              type="button"
              variant="danger"
              useExtremeBorder={true}
              onClick={handleActivateClick}
              disabled={isSubscribingPush}
              className="flex-1 py-2.5 font-black uppercase tracking-wider text-[11px] shadow-[3px_3px_0px_0px_#181716] disabled:opacity-50"
            >
              {isSubscribingPush ? "⏳ Activation en cours..." : "🔔 Activer les alertes"}
            </CordelButton>
            <button
              type="button"
              onClick={() => openPushTutorialModal(env.mode)}
              className="text-[11px] font-black underline text-[var(--color-cordel-rouge,#8b2a1a)] hover:opacity-80 cursor-pointer py-1.5 px-2 text-center"
            >
              ❓ Comment débloquer sur mon téléphone ?
            </button>
          </div>
        )}
      </div>

      <PushTutorialModal />
    </CordelCard>
  );
}
