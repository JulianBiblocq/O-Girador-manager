/**
 * Modale d'activation des notifications Push en 1 clic sur le Dashboard.
 * S'adapte automatiquement entre l'activation directe et l'ouverture du tutoriel
 * illustré étape par étape (PushTutorialModal) en cas de blocage.
 */

import React, { useState, useEffect } from 'react';
import { messaging } from '../../firebase';
import { activateAndPersistPushToken } from '../../utils/pushNotificationHelper';
import { detectPushTutorialDevice, openPushTutorialModal } from './PushTutorialModal';

const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export default function PushActivationModal({ user, profileData }) {
  const uid = user?.uid || profileData?.uid || profileData?.id;
  const hasFcmTokens = Array.isArray(profileData?.fcmTokens) && profileData.fcmTokens.length > 0;

  const [isOpen, setIsOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!uid || !profileData) return;
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('setup-push') === '1') {
      setIsOpen(true);
      return;
    }
    if (hasFcmTokens) {
      setIsOpen(false);
      return;
    }
    try {
      const snoozedUntil = Number(localStorage.getItem(`girador_push_snooze_${uid}`) || 0);
      if (Date.now() > snoozedUntil) setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, [uid, profileData, hasFcmTokens]);

  useEffect(() => {
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('open-push-activation-modal', handleOpenModal);
    return () => window.removeEventListener('open-push-activation-modal', handleOpenModal);
  }, []);

  if (!isOpen || !uid) return null;

  const env = detectPushTutorialDevice();
  const canDirectActivate =
    !env.isInAppBrowser &&
    !env.isIosNotStandalone &&
    !env.isPermissionDenied &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Boolean(messaging);

  const cleanUrlParam = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('setup-push')) {
      url.searchParams.delete('setup-push');
      window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleSnooze = () => {
    try {
      localStorage.setItem(`girador_push_snooze_${uid}`, String(Date.now() + SNOOZE_DURATION_MS));
    } catch {}
    cleanUrlParam();
    setIsOpen(false);
  };

  const handleOneClickActivate = async () => {
    if (!canDirectActivate) {
      setIsOpen(false);
      openPushTutorialModal(env.mode);
      return;
    }
    setActivating(true);
    setErrorMsg('');
    const result = await activateAndPersistPushToken(uid);
    setActivating(false);
    if (result.ok) {
      setActivatedSuccess(true);
      cleanUrlParam();
      setTimeout(() => setIsOpen(false), 1600);
    } else {
      setErrorMsg("Les notifications sont bloquées ou requièrent une manipulation sur ton téléphone.");
      setIsOpen(false);
      openPushTutorialModal(env.mode);
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn">
      <div className="max-w-md w-full p-5 bg-[var(--cordel-paper,#fffdf8)] text-[var(--cordel-text,#181716)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,10px)] shadow-[5px_5px_0px_0px_var(--theme-shadow-color,#181716)] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">🔔</span>
            <h3 className="text-sm font-black uppercase tracking-wider">Ne manque aucune info du groupe !</h3>
          </div>
          <button type="button" onClick={handleSnooze} className="text-sm font-black opacity-60 hover:opacity-100 cursor-pointer" aria-label="Fermer">✕</button>
        </div>
        <p className="text-xs font-medium opacity-85 leading-relaxed">
          Active les alertes sur ton téléphone ou ordinateur pour recevoir en temps réel les convocations, sondages, changements de lieu et messages d'Organizador.
        </p>
        {activatedSuccess ? (
          <div className="p-3 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-xs rounded-[var(--theme-border-radius,6px)] text-center">
            ✅ Alertes activées avec succès sur cet appareil !
          </div>
        ) : (
          <div className="space-y-2.5">
            <button type="button" onClick={handleOneClickActivate} disabled={activating} className="w-full py-3 px-4 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black text-xs uppercase tracking-wider border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,8px)] shadow-[3px_3px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer disabled:opacity-60">
              {activating ? '⏳ Activation en cours...' : '🔔 Activer les alertes en 1 clic'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsOpen(false); openPushTutorialModal(env.mode); }}
                className="text-[11px] font-black underline text-[var(--color-cordel-rouge,#8b2a1a)] hover:opacity-80 cursor-pointer"
              >
                ❓ Comment débloquer sur mon téléphone ?
              </button>
            </div>
            {errorMsg && <p className="text-[11px] font-bold text-[var(--color-cordel-rouge,#8b2a1a)]">{errorMsg}</p>}
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button type="button" onClick={handleSnooze} className="text-[11px] font-extrabold uppercase tracking-wider opacity-65 hover:opacity-100 underline cursor-pointer py-1 px-2">Plus tard</button>
        </div>
      </div>
    </div>
  );
}
