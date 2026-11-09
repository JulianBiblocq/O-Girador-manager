/**
 * Utilitaire de télé-diagnostic des notifications Push et du Contrat Permanent (`pushOptInContract`).
 * Identifie pourquoi un membre ne reçoit pas les alertes Push et synchronise cet état dans `users/{uid}`.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getTimestampMs } from './readReceiptUtils';

const sessionDiagnosticsCache = new Map();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Vérifie si le membre a signé le Contrat Permanent de notifications Push.
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
 * Analyse l'appareil et l'environnement navigateur AVANT tout filtrage sur `messaging` ou `Notification`.
 */
export function collectClientPushDiagnostics({
  hasActiveTokenInDb = false,
  lastError = null,
  isMessagingSupported = Boolean(messaging)
} = {}) {
  const updatedAt = new Date().toISOString();
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      status: hasActiveTokenInDb ? 'active' : 'unsupported',
      label: hasActiveTokenInDb ? '🔔 PUSH' : '🌐 Navigateur non compatible',
      permission: 'unsupported', platform: 'Desktop', isStandalonePwa: false,
      isInAppBrowser: false, blockerReason: hasActiveTokenInDb ? 'OK' : 'UNSUPPORTED',
      userAgentSummary: 'SSR', updatedAt
    };
  }

  const ua = navigator.userAgent || '';
  const userAgentSummary = ua.slice(0, 140);
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const platform = isIos ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'Desktop';
  const isStandalonePwa = Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
  );
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram|FB_IAB|Messenger|Line\//i.test(ua);
  const hasNotificationApi = 'Notification' in window;
  const permission = hasNotificationApi ? Notification.permission : 'unsupported';

  let status = 'prompt_pending';
  let label = '⏳ Connecté · N’a pas encore cliqué sur Activer';
  let blockerReason = 'NEVER_ANSWERED';

  if (isInAppBrowser) {
    status = 'webview_blocked'; label = '💬 Bloqué (Ouvert via WhatsApp/Réseaux)'; blockerReason = 'IN_APP_BROWSER';
  } else if (isIos && !isStandalonePwa) {
    status = 'ios_not_installed'; label = '📱 iPhone non installé sur l’écran d’accueil'; blockerReason = 'IOS_NOT_INSTALLED';
  } else if (!hasNotificationApi || !isMessagingSupported) {
    status = 'unsupported'; label = '🌐 Navigateur non compatible'; blockerReason = 'UNSUPPORTED';
  } else if (permission === 'denied') {
    status = 'browser_denied'; label = '🚫 Refusé dans le cadenas du navigateur'; blockerReason = 'PERMISSION_DENIED';
  } else if (permission === 'default') {
    status = 'prompt_pending'; label = '⏳ Connecté · N’a pas encore cliqué sur Activer'; blockerReason = 'NEVER_ANSWERED';
  } else if (permission === 'granted' && !hasActiveTokenInDb) {
    status = 'token_error';
    label = '⚠️ ERREUR NAVIGATEUR (SW)';
    blockerReason = 'TOKEN_SYNC_ERROR';
  } else if (permission === 'granted' && hasActiveTokenInDb) {
    status = 'active'; label = '🔔 PUSH'; blockerReason = 'OK';
  }

  const diagnostics = {
    status, label, permission, platform, isStandalonePwa, isInAppBrowser, blockerReason, userAgentSummary, updatedAt
  };
  if (lastError) diagnostics.lastError = String(lastError).slice(0, 220);
  return diagnostics;
}

/**
 * Enregistre systématiquement `pushDiagnostics` dans `users/{uid}` dès que `status` change ou manque en base.
 */
export async function syncPushDiagnosticsToFirestore(
  uid, profileData, { lastError = null, force = false, hasActiveTokenOverride = null } = {}
) {
  if (!uid || !db) return null;
  const hasActiveTokenInDb = hasActiveTokenOverride !== null
    ? Boolean(hasActiveTokenOverride)
    : Array.isArray(profileData?.fcmTokens) && profileData.fcmTokens.length > 0;

  const diagnostics = collectClientPushDiagnostics({ hasActiveTokenInDb, lastError, isMessagingSupported: Boolean(messaging) });
  const existingDiag = profileData?.pushDiagnostics;
  const isMissingOrChanged = !existingDiag?.status || !existingDiag?.label || existingDiag.status !== diagnostics.status || existingDiag.label !== diagnostics.label || (lastError && existingDiag.lastError !== diagnostics.lastError);
  const sig = `${diagnostics.status}|${diagnostics.label}|${diagnostics.lastError || ''}|${hasActiveTokenInDb}`;
  if (!force && !isMissingOrChanged && sessionDiagnosticsCache.get(uid) === sig) return diagnostics;
  sessionDiagnosticsCache.set(uid, sig);

  try {
    await updateDoc(doc(db, 'users', uid), { pushDiagnostics: diagnostics });
  } catch (err) {
    sessionDiagnosticsCache.delete(uid);
    console.warn('syncPushDiagnosticsToFirestore - Échec écriture diagnostic :', err?.message || err);
  }
  return diagnostics;
}

/**
 * Retourne le badge explicite de télé-diagnostic d'un membre en croisant `pushDiagnostics`, `lastActive` et `lastPushDelivery`.
 */
export function getMemberPushDiagnosticBadge(member) {
  if (Array.isArray(member?.fcmTokens) && member.fcmTokens.length > 0) {
    const d = member?.lastPushDelivery;
    let tooltip = '🔔 Notifications Push activées sur au moins un appareil';
    if (d?.sentAt) {
      const dateStr = new Date(d.sentAt).toLocaleString('fr-FR');
      tooltip = d.successCount > 0
        ? `✅ Dernier Push délivré le ${dateStr} (${d.successCount} succès${d.failureCount ? `, ${d.failureCount} échec` : ''})`
        : `⚠️ Dernier Push en échec le ${dateStr} (${d.lastErrorCode || 'erreur FCM'})`;
    }
    return { code: 'OK', status: 'active', icon: '🔔', shortLabel: '🔔 PUSH', label: '🔔 PUSH', tooltip, isReachable: true };
  }
  const diag = member?.pushDiagnostics;
  if (diag?.label) {
    const isSwTokenError =
      diag.status === 'token_error' ||
      /erreur de jeton|failed to execute|pushmanager|erreur navigateur|aborterror/i.test(diag.label || '');
    if (isSwTokenError) {
      const fullTooltip = diag.lastError
        ? `⚠️ Erreur navigateur (SW) — ${diag.lastError} (${diag.platform || 'Appareil'})`
        : diag.label;
      return {
        code: 'TOKEN_ERROR',
        status: 'token_error',
        icon: '🔕',
        shortLabel: '⚠️ ERREUR NAVIGATEUR (SW)',
        label: '🔕 MUET · ⚠️ ERREUR NAVIGATEUR (SW)',
        tooltip: fullTooltip,
        isReachable: false
      };
    }
    const fullTooltip = diag.lastError ? `${diag.label} — ${diag.lastError}` : diag.label;
    return { code: diag.status || 'DIAG', status: diag.status || 'diag', icon: '🔕', shortLabel: diag.label, label: diag.label, tooltip: fullTooltip, isReachable: false };
  }
  const lastActiveMs = getTimestampMs(member?.lastActive || member?.lastLoginAt || member?.derniereConnexion || member?.updatedAt);
  if (lastActiveMs && Date.now() - lastActiveMs <= SEVEN_DAYS_MS) {
    return { code: 'RECENT_UNACTIVATED', status: 'recent_unactivated', icon: '⏳', shortLabel: '⏳ Non activé', label: '⏳ Non activé', tooltip: 'Connecté au cours des 7 derniers jours · Notifications non activées', isReachable: false };
  }
  return { code: 'NOT_RECONNECTED', status: 'not_reconnected', icon: '💤', shortLabel: '💤 PAS RECONNECTÉ', label: '💤 PAS RECONNECTÉ', tooltip: 'Pas reconnecté au cours des 7 derniers jours', isReachable: false };
}
