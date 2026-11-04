/**
 * Modale tutoriel guidé étape par étape pour débloquer et activer les notifications Push
 * selon l'appareil de l'adhérent (Navigateur interne WhatsApp/Instagram, iPhone/iPad iOS, Android/Chrome).
 */

import React, { useState, useEffect } from 'react';

export function detectPushTutorialDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { mode: 'android', isInAppBrowser: false, isIosNotStandalone: false, isPermissionDenied: false };
  }
  const ua = navigator.userAgent || '';
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram|Messenger|Line/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    Boolean(window.navigator.standalone) ||
    Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  const isIosNotStandalone = isIos && !isStandalone;
  const isPermissionDenied = 'Notification' in window && Notification.permission === 'denied';
  const mode = isInAppBrowser ? 'whatsapp' : (isIosNotStandalone || isIos ? 'ios' : 'android');
  return { mode, isInAppBrowser, isIosNotStandalone, isPermissionDenied };
}

export function openPushTutorialModal(preferredMode = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-push-tutorial-modal', { detail: { mode: preferredMode } }));
  }
}

const TUTORIAL_SECTIONS = {
  whatsapp: {
    label: '💬 WhatsApp / Insta',
    title: 'Tu es dans le navigateur interne WhatsApp / Instagram',
    badge: '••• ➔ Ouvrir dans Chrome / Safari',
    steps: [
      { icon: '1️⃣', text: 'Appuie sur les 3 petits points ••• (ou ⋮ / 🧭) tout en haut à droite de ton écran.' },
      { icon: '2️⃣', text: 'Choisis « Ouvrir dans Chrome » (Android) ou « Ouvrir dans Safari » (iPhone).' },
      { icon: '3️⃣', text: 'Une fois dans ton vrai navigateur, reclique sur le bouton d\'activation des alertes.' }
    ]
  },
  ios: {
    label: '🍎 iPhone / iPad',
    title: 'Débloquer les notifications sur iPhone / iPad (iOS)',
    badge: 'Safari ➔ [↑] Partager ➔ Sur l\'écran d\'accueil',
    steps: [
      { icon: '1️⃣', text: 'Ouvre cette adresse directement dans l\'application Safari sur ton iPhone ou iPad.' },
      { icon: '2️⃣', text: 'Appuie sur l\'icône Partager [↑] (le carré avec une flèche vers le haut en bas de l\'écran).' },
      { icon: '3️⃣', text: 'Fais défiler et choisis « Sur l\'écran d\'accueil ➕ », puis ouvre Organizador depuis cette nouvelle icône.' }
    ]
  },
  android: {
    label: '🤖 Android / Chrome',
    title: 'Débloquer les notifications dans Chrome / Android',
    badge: '🔒 Cadenas ➔ Autorisations ➔ Autoriser',
    steps: [
      { icon: '1️⃣', text: 'Clique sur l\'icône des réglages ou le cadenas 🔒 situé tout en haut à gauche de l\'adresse web.' },
      { icon: '2️⃣', text: 'Appuie sur « Autorisations » (ou « Paramètres des sites ») puis sur « Notifications ».' },
      { icon: '3️⃣', text: 'Coche « Autoriser », puis rafraîchis la page pour recevoir les alertes du groupe.' }
    ]
  }
};

export default function PushTutorialModal({ isOpen: controlledOpen, onClose, initialMode = null }) {
  const env = detectPushTutorialDevice();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialMode || env.mode);

  useEffect(() => {
    if (initialMode) setActiveTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const handleGlobalOpen = (e) => {
      setActiveTab(e?.detail?.mode || detectPushTutorialDevice().mode);
      setInternalOpen(true);
    };
    window.addEventListener('open-push-tutorial-modal', handleGlobalOpen);
    return () => window.removeEventListener('open-push-tutorial-modal', handleGlobalOpen);
  }, []);

  const visible = controlledOpen !== undefined ? controlledOpen : internalOpen;
  if (!visible) return null;

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
  };

  const currentSection = TUTORIAL_SECTIONS[activeTab] || TUTORIAL_SECTIONS.android;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none" onClick={handleClose}>
      <div
        className="max-w-md w-full p-5 bg-[var(--cordel-paper,#fffdf8)] text-[var(--cordel-text,#181716)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,10px)] shadow-[5px_5px_0px_0px_var(--theme-shadow-color,#181716)] space-y-3.5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-dashed border-[var(--theme-border-color,#181716)]/25 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Comment débloquer les alertes ?</h3>
          </div>
          <button type="button" onClick={handleClose} className="text-sm font-black opacity-65 hover:opacity-100 cursor-pointer px-1" aria-label="Fermer">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(TUTORIAL_SECTIONS).map(([key, sec]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-[var(--theme-border-radius,6px)] border transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-[var(--theme-border-color,#181716)] shadow-[1.5px_1.5px_0px_0px_var(--theme-shadow-color,#181716)]'
                  : 'bg-[var(--cordel-bg,#f4ecd8)] text-[var(--cordel-text,#181716)] border-[var(--theme-border-color,#181716)]/30 hover:opacity-90'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,8px)] space-y-2.5">
          <div className="text-[11px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)]">{currentSection.title}</div>
          <div className="inline-block px-2 py-0.5 text-[10px] font-black bg-[var(--cordel-paper,#fffdf8)] border border-[var(--theme-border-color,#181716)] rounded">
            {currentSection.badge}
          </div>
          <div className="space-y-2 pt-1">
            {currentSection.steps.map((s) => (
              <div key={s.icon} className="flex items-start gap-2.5 p-2 bg-[var(--cordel-paper,#fffdf8)] border border-[var(--theme-border-color,#181716)]/20 rounded">
                <span className="text-base leading-none shrink-0">{s.icon}</span>
                <p className="text-xs font-semibold leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-4 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-xs uppercase tracking-wider border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,6px)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] cursor-pointer"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
