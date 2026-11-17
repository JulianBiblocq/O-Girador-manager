/**
 * Construction du message FCM multicast (module extrait de index.js).
 * - `tag` déterministe (`notif_${eventId || queueDocId}`) sur Android, Web et APNs pour fusionner tout doublon.
 * - Pastille Android Terracotta `#8B2A1A`.
 * - Badge barre d'état Android : `/badge-notif.png` (silhouette Alfaia monochrome, canal alpha seul).
 */
const crypto = require("crypto");

const ANDROID_NOTIFICATION_COLOR = "#8B2A1A";

/** Normalise l'URL de navigation interne sous `/app`. */
function resolveNotificationUrl(rawUrl) {
  const url = rawUrl || "/app";
  if (url.startsWith("http") || url.startsWith("/app")) return url;
  return url.startsWith("/") ? `/app${url}` : `/app/${url}`;
}

/**
 * Tag déterministe : identifiant métier (événement, annonce, fil, file d'attente) sinon empreinte stable
 * du contenu, de sorte que deux envois identiques se fusionnent en une seule alerte.
 */
function buildNotifTag(data, { groupId, title, body, url }) {
  const businessId = data.eventId || data.announcementId || data.threadId || data.notifId || data.queueDocId;
  if (businessId) return `notif_${businessId}`;
  const fingerprint = `${groupId || ""}|${title}|${body}|${url}`;
  return `notif_${crypto.createHash("sha1").update(fingerprint).digest("hex").slice(0, 20)}`;
}

/** Assemble le message multicast FCM pour un lot de jetons. */
function buildMulticastMessage({ dataPayload, groupId, title, body, assoIcon, tokens }) {
  const rawData = dataPayload || {};
  const url = resolveNotificationUrl(rawData.url);
  const tag = buildNotifTag(rawData, { groupId, title, body, url });

  const fcmStringData = {};
  Object.entries({ ...rawData, title, body, url, click_action: url, groupId: groupId || "", icon: assoIcon, tag })
    .forEach(([k, v]) => {
      if (v !== undefined && v !== null) fcmStringData[k] = typeof v === "string" ? v : String(v);
    });

  return {
    notification: {
      title,
      body,
      ...(assoIcon.startsWith("http") ? { imageUrl: assoIcon } : {})
    },
    android: {
      priority: "high",
      notification: { channelId: "default", sound: "default", color: ANDROID_NOTIFICATION_COLOR, tag }
    },
    apns: {
      headers: { "apns-priority": "10", ...(tag.length <= 64 ? { "apns-collapse-id": tag } : {}) },
      payload: { aps: { sound: "default", "content-available": 1 } }
    },
    webpush: {
      headers: { Urgency: "high" },
      notification: { title, body, icon: assoIcon, badge: "/badge-notif.png", tag, data: fcmStringData },
      fcmOptions: { link: url }
    },
    data: fcmStringData,
    tokens
  };
}

module.exports = { buildMulticastMessage, buildNotifTag, resolveNotificationUrl, ANDROID_NOTIFICATION_COLOR };
