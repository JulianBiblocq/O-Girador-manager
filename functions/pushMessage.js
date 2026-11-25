/**
 * Construction du message FCM multicast (module extrait de index.js).
 * - `tag` applicatif unique `organizador-alfaia` (+ `renotify: true`) sur Android, Web et APNs afin d'afficher
 *   toujours une seule icône Alfaia dans la barre d'état Android (zéro regroupement `GroupSummary` carré blanc).
 * - Pastille Android Terracotta `#8B2A1A`.
 * - Badge barre d'état Android : `https://organizador.o-girador.com/icons/badge-alfaia-mono.png`
 *   (silhouette tambour Alfaia monochrome `#FFFFFF` sur fond transparent `rgba(0,0,0,0)`).
 */
const ANDROID_NOTIFICATION_COLOR = "#8B2A1A";
const ORGANIZADOR_PUBLIC_ORIGIN = "https://organizador.o-girador.com";
const ANDROID_ALFAIA_BADGE_URL = `${ORGANIZADOR_PUBLIC_ORIGIN}/icons/badge-alfaia-mono.png`;
const DEFAULT_PUSH_ICON_URL = `${ORGANIZADOR_PUBLIC_ORIGIN}/icon-192-v2.png`;
const UNIFIED_ALFAIA_NOTIF_TAG = "organizador-alfaia";

/** Normalise l'URL de navigation interne sous `/app`. */
function resolveNotificationUrl(rawUrl) {
  const url = rawUrl || "/app";
  if (url.startsWith("http") || url.startsWith("/app")) return url;
  return url.startsWith("/") ? `/app${url}` : `/app/${url}`;
}

/** Normalise l'icône couleur déroulée vers une URL HTTPS absolue. */
function resolveNotificationIconUrl(assoIcon) {
  const raw = String(assoIcon || "").trim();
  if (!raw) return DEFAULT_PUSH_ICON_URL;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${ORGANIZADOR_PUBLIC_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

/**
 * Tag fixe unique au niveau de l'application pour remplacer l'alerte active dans la barre Android
 * au lieu d'empiler plusieurs notifications déclenchant un `GroupSummary` carré translucide.
 */
function buildNotifTag() {
  return UNIFIED_ALFAIA_NOTIF_TAG;
}

/** Assemble le message multicast FCM pour un lot de jetons. */
function buildMulticastMessage({ dataPayload, groupId, title, body, assoIcon, tokens }) {
  const rawData = dataPayload || {};
  const url = resolveNotificationUrl(rawData.url);
  const iconUrl = resolveNotificationIconUrl(assoIcon);
  const tag = buildNotifTag();

  const fcmStringData = {};
  Object.entries({
    ...rawData,
    title,
    body,
    url,
    click_action: url,
    groupId: groupId || "",
    icon: iconUrl,
    badge: ANDROID_ALFAIA_BADGE_URL,
    tag,
    renotify: "true"
  }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fcmStringData[k] = typeof v === "string" ? v : String(v);
  });

  return {
    notification: {
      title,
      body,
      ...(iconUrl.startsWith("http") ? { imageUrl: iconUrl } : {})
    },
    android: {
      priority: "high",
      notification: { channelId: "default", sound: "default", color: ANDROID_NOTIFICATION_COLOR, tag }
    },
    apns: {
      headers: { "apns-priority": "10", "apns-collapse-id": tag },
      payload: { aps: { sound: "default", "content-available": 1 } }
    },
    webpush: {
      headers: { Urgency: "high" },
      notification: {
        title,
        body,
        icon: iconUrl,
        badge: ANDROID_ALFAIA_BADGE_URL,
        tag,
        renotify: true,
        data: fcmStringData
      },
      fcmOptions: { link: url }
    },
    data: fcmStringData,
    tokens
  };
}

module.exports = {
  buildMulticastMessage,
  buildNotifTag,
  resolveNotificationUrl,
  resolveNotificationIconUrl,
  ANDROID_NOTIFICATION_COLOR,
  ANDROID_ALFAIA_BADGE_URL,
  UNIFIED_ALFAIA_NOTIF_TAG
};
