/**
 * Utilitaire de télé-diagnostic des notifications Push et du Contrat Permanent (`pushOptInContract`).
 * Identifie pourquoi un membre ne reçoit pas les alertes Push et synchronise cet état dans `users/{uid}`.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const sessionDiagnosticsCache = new Map();

/**
 * Vérifie si le membre a signé le Contrat Permanent de notifications Push
 * (et ne s'est pas explicitement désabonné via son profil).
 */
export function hasSignedPushContract(uid, profileData) {
  if (profileData?.pushOptInContract === false) return false;
  if (profileData?.pushOptInContract === true) return true;
  if (Array.isArray(profileData?.fcmTokens) && profileData.fcmTokens.length > 0) return true;
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('push_contract_signed') === 'true') return true;
    if (uid && localStorage.getItem(`girador_device_fcm_token_${uid}`)) return true;
  } catch { /* Ignorer */ }
  return false;
}

/**
 * Analyse l'appareil et l'environnement navigateur du membre pour établir son diagnostic Push.
 */
export function collectClientPushDiagnostics({ hasActiveTokenInDb = false, lastError = null } = {}) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      permission: 'unsupported',
      platform: 'Desktop',
      isStandalonePwa: false,
      isInAppBrowser: false,
      blockerReason: hasActiveTokenInDb ? 'OK' : 'NEVER_ANSWERED',
      updatedAt: new Date().toISOString()
    };
  }

  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const platform = isIos ? 'iOS' : isAndroid ? 'Android' : 'Desktop';
  const isStandalonePwa = Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
  );
  const isInAppBrowser = /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\//i.test(ua);
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';

  let blockerReason = 'NEVER_ANSWERED';
  if (hasActiveTokenInDb && permission === 'granted') blockerReason = 'OK';
  else if (isInAppBrowser) blockerReason = 'IN_APP_BROWSER';
  else if (isIos && !isStandalonePwa) blockerReason = 'IOS_NOT_INSTALLED';
  else if (permission === 'denied') blockerReason = 'PERMISSION_DENIED';
  else if (permission === 'granted' && !hasActiveTokenInDb) blockerReason = 'TOKEN_SYNC_ERROR';

  const diagnostics = {
    permission,
    platform,
    isStandalonePwa,
    isInAppBrowser,
    blockerReason,
    updatedAt: new Date().toISOString()
  };
  if (lastError) diagnostics.lastError = String(lastError).slice(0, 180);
  return diagnostics;
}

/**
 * Enregistre `pushDiagnostics` (et `pushOptInContract: true` si applicable) sur `users/{uid}`.
 */
export async function syncPushDiagnosticsToFirestore(
  uid,
  profileData,
  { lastError = null, force = false, hasActiveTokenOverride = null } = {}
) {
  if (!uid || !db) return null;
  const hasActiveTokenInDb =
    hasActiveTokenOverride !== null
      ? Boolean(hasActiveTokenOverride)
      : Array.isArray(profileData?.fcmTokens) && profileData.fcmTokens.length > 0;

  const diagnostics = collectClientPushDiagnostics({ hasActiveTokenInDb, lastError });
  const shouldSignContract =
    profileData?.pushOptInContract !== false &&
    (hasActiveTokenInDb || diagnostics.permission === 'granted' || hasSignedPushContract(uid, profileData));

  const sig = `${diagnostics.permission}|${diagnostics.blockerReason}|${hasActiveTokenInDb}|${shouldSignContract}|${diagnostics.lastError || ''}`;
  if (!force && sessionDiagnosticsCache.get(uid) === sig) return diagnostics;
  sessionDiagnosticsCache.set(uid, sig);

  try {
    const payload = { pushDiagnostics: diagnostics };
    if (shouldSignContract && profileData?.pushOptInContract !== true) payload.pushOptInContract = true;
    if (shouldSignContract && typeof window !== 'undefined') {
      try { localStorage.setItem('push_contract_signed', 'true'); } catch { /* Ignorer */ }
    }
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (err) {
    sessionDiagnosticsCache.delete(uid);
    console.warn('syncPushDiagnosticsToFirestore - Échec écriture diagnostic :', err?.message || err);
  }
  return diagnostics;
}

/**
 * Retourne le badge explicite de télé-diagnostic d'un membre pour les vues Administrateur.
 */
export function getMemberPushDiagnosticBadge(member) {
  if (Array.isArray(member?.fcmTokens) && member.fcmTokens.length > 0) {
    return { code: 'OK', icon: '🔔', shortLabel: '🔔 Push', label: '🔔 Push actif', isReachable: true };
  }
  const diag = member?.pushDiagnostics;
  const reason = diag?.blockerReason;
  if (reason === 'IOS_NOT_INSTALLED') return { code: reason, icon: '🍎', shortLabel: '🍎 iPhone non installé', label: "🍎 iPhone : non ajouté à l'écran d'accueil", isReachable: false };
  if (reason === 'IN_APP_BROWSER') return { code: reason, icon: '💬', shortLabel: '💬 Navigateur WhatsApp', label: '💬 Ouvre les liens dans WhatsApp', isReachable: false };
  if (reason === 'PERMISSION_DENIED') return { code: reason, icon: '🚫', shortLabel: '🚫 Bloqué navigateur', label: '🚫 A bloqué les notifications dans son navigateur', isReachable: false };
  if (reason === 'TOKEN_SYNC_ERROR' || diag?.permission === 'granted' || member?.pushOptInContract === true) {
    return { code: 'TOKEN_SYNC_ERROR', icon: '⏳', shortLabel: '⏳ Autorisé (attente ouverture)', label: '⏳ Autorisé — en attente de prochaine ouverture', isReachable: false };
  }
  if (reason === 'NEVER_ANSWERED') return { code: reason, icon: '🔔', shortLabel: '🔔 Non activé', label: "🔔 N'a pas encore cliqué sur Activer", isReachable: false };
  return { code: 'NOT_RECONNECTED', icon: '💤', shortLabel: '💤 Pas reconnecté', label: '💤 Pas encore reconnecté depuis la mise à jour', isReachable: false };
}
