import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';
import CordelCard from '../CordelCard';
import { XiloSparkles, XiloShield, XiloEyeOff } from '../XiloIcons';

export default function NotificationDiagnostic({ 
  notificationPermission, 
  isSubscribingPush, 
  onEnableNotifications 
}) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [livePermission, setLivePermission] = useState(notificationPermission || 'default');

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || (userAgent.includes("mac") && "ontouchend" in document);
    setIsIOS(isIOSDevice);

    // Detect Standalone (PWA)
    const isStandaloneMode = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
  }, []);

  useEffect(() => {
    // Keep internal permission state in sync, but also re-evaluate just in case
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setLivePermission(Notification.permission);
    }
  }, [notificationPermission]);

  const getStatusDisplay = () => {
    switch (livePermission) {
      case 'granted':
        return {
          label: 'Activé',
          color: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-500/40',
          icon: <XiloSparkles size={20} />
        };
      case 'denied':
        return {
          label: 'Bloqué par votre appareil',
          color: 'text-red-700 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-500/40',
          icon: <XiloEyeOff size={20} />
        };
      default:
        return {
          label: 'Non configuré',
          color: 'text-amber-700 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-500/40',
          icon: <XiloShield size={20} />
        };
    }
  };

  const status = getStatusDisplay();

  const handleManualCheck = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setLivePermission(Notification.permission);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
      <div className={`p-3 rounded-[6px] text-left border-2 border-dashed ${status.bg} ${status.border}`}>
        <div className="flex items-center gap-2.5">
          <div className={status.color}>{status.icon}</div>
          <div className="flex-1">
            <h4 className={`font-black text-xs uppercase flex items-center justify-between gap-1.5 ${status.color}`}>
              Diagnostic des Notifications
              <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded border border-current/20">
                Statut : {status.label}
              </span>
            </h4>
            <p className={`text-[10px] opacity-90 font-medium ${status.color}`}>
              Outil de déblocage pour la réception des alertes (répétitions, sondages, etc.)
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-encre-noire font-medium text-left flex flex-col gap-3">
        {/* Dynamic Tutorials / Warnings */}
        
        {isIOS && !isStandalone && (
          <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 p-2.5 rounded text-sky-900 dark:text-sky-300">
            <p className="font-bold mb-1">🍎 Utilisateur iPhone / iPad détecté :</p>
            <p className="text-[10px] leading-relaxed">
              Sur iPhone/iPad, vous devez impérativement ajouter l'application à votre écran d'accueil avant d'activer les alertes.
              <br/><br/>
              <strong>Action requise :</strong> Appuyez sur le bouton de partage (le carré avec une flèche) dans Safari, puis choisissez <em>"Sur l'écran d'accueil"</em>. Ouvrez ensuite l'application depuis votre écran d'accueil.
            </p>
          </div>
        )}

        {livePermission === 'denied' && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2.5 rounded text-amber-900 dark:text-amber-300">
            <p className="font-bold mb-1">🔒 Notifications bloquées par le navigateur :</p>
            <p className="text-[10px] leading-relaxed">
              Il semblerait que vous ayez précédemment refusé les notifications, ou que votre navigateur les bloque automatiquement.
              <br/><br/>
              <strong>Comment débloquer :</strong> 
              <br/>1. Cliquez sur le petit cadenas (ou l'icône de paramètres) dans la barre d'adresse de votre navigateur (en haut).
              <br/>2. Allez dans "Paramètres des sites" ou cherchez "Notifications".
              <br/>3. Changez l'option sur <strong>Autoriser</strong>.
              <br/>4. Rechargez la page.
            </p>
            <button 
              onClick={handleManualCheck}
              className="mt-2 text-[10px] font-bold underline text-amber-700 dark:text-amber-400 hover:text-amber-900"
            >
              🔄 Re-vérifier le statut après modification
            </button>
          </div>
        )}

        {livePermission === 'granted' && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
            Tout est parfaitement configuré. Vous êtes prêt(e) à recevoir les alertes importantes du groupe.
          </p>
        )}

        {/* Action Button */}
        {livePermission !== 'granted' && (!isIOS || isStandalone) && (
          <div className="flex flex-col gap-2 mt-1">
            <CordelButton 
              type="button" 
              variant="vert" 
              useExtremeBorder={true}
              onClick={onEnableNotifications}
              disabled={isSubscribingPush || livePermission === 'denied'}
              className="w-full py-2.5 font-black uppercase tracking-wider text-[11px] shadow-[3px_3px_0px_0px_#181716] disabled:opacity-50"
            >
              {isSubscribingPush ? "⏳ Activation en cours..." : "🔔 Forcer l'activation manuelle"}
            </CordelButton>
            {livePermission === 'denied' && (
              <p className="text-[9px] text-center text-cordel-master-dark opacity-80">
                Le bouton est désactivé car votre navigateur bloque la demande. Suivez les instructions ci-dessus pour débloquer.
              </p>
            )}
          </div>
        )}
      </div>
    </CordelCard>
  );
}
