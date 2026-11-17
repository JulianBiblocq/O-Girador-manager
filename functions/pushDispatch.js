/**
 * Envoi unique des Push FCM (module extrait de index.js).
 * Canal d'émission côté serveur : `sendPushToUsers`, appelé par un seul trigger par action
 * (cf. `clientNotified` sur `events` et `announcements` pour éviter le doublon avec `notifications_queue`).
 */
const { FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { collectPushTargets } = require("./pushRecipients");
const { buildMulticastMessage } = require("./pushMessage");

const BATCH_SIZE = 500;
const INVALID_TOKEN_CODES = ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"];

/** Récupère le nom et le logo de l'association (marque blanche) pour personnaliser l'alerte. */
async function loadAssociationBranding(db, groupId) {
  const branding = { assoName: "", assoIcon: "/icon-192x192.png" };
  if (!groupId) return branding;
  try {
    const assoDoc = await db.collection("associations").doc(groupId).get();
    if (assoDoc.exists) {
      const assoData = assoDoc.data() || {};
      branding.assoName = assoData.nom || "";
      branding.assoIcon = (assoData.branding && assoData.branding.logoUrl) || assoData.logoUrl || branding.assoIcon;
    }
  } catch (e) {
    console.warn("sendPushToUsers - Erreur lors de la récupération de l'association", e);
  }
  return branding;
}

/** Persiste le statut de livraison et retire les jetons obsolètes de chaque utilisateur concerné. */
async function persistDeliveryResults(db, deliveryStatsByUser, tokensToRemove) {
  const tokensByUser = {};
  tokensToRemove.forEach(({ token, userId }) => {
    (tokensByUser[userId] = tokensByUser[userId] || []).push(token);
  });
  const affected = new Set([...Object.keys(deliveryStatsByUser), ...Object.keys(tokensByUser)]);
  for (const userId of affected) {
    try {
      const updatePayload = {};
      if (deliveryStatsByUser[userId]) updatePayload.lastPushDelivery = deliveryStatsByUser[userId];
      const invalid = tokensByUser[userId];
      if (Array.isArray(invalid) && invalid.length > 0) {
        updatePayload.fcmTokens = FieldValue.arrayRemove(...invalid);
        updatePayload.pushOptInContract = true;
      }
      if (Object.keys(updatePayload).length > 0) await db.collection("users").doc(userId).update(updatePayload);
    } catch (err) {
      console.error(`sendPushToUsers - Erreur mise à jour statut Push pour ${userId}:`, err);
    }
  }
}

/**
 * Envoie une notification Push FCM aux utilisateurs ciblés.
 * @param {Object} db - Instance Firestore Admin
 * @param {Object} params - { groupId, recipientId, cibles, targetUserIds, title, body, dataPayload }
 */
async function sendPushToUsers(db, { groupId, recipientId, cibles, targetUserIds, title, body, dataPayload }) {
  if (!groupId && !recipientId) {
    console.error("sendPushToUsers - groupId ou recipientId manquant.");
    return false;
  }
  const { tokens, effectiveGroupId, hasUsers } = await collectPushTargets(db, { groupId, recipientId, cibles, targetUserIds });
  if (!hasUsers || tokens.length === 0) {
    console.warn("sendPushToUsers - Aucun token valide trouvé pour les cibles.");
    return false;
  }

  const { assoName, assoIcon } = await loadAssociationBranding(db, effectiveGroupId);
  const baseTitle = title || "O Girador";
  const finalTitle = assoName ? `${assoName} | ${baseTitle}` : baseTitle;
  const truncatedBody = body && body.length > 200 ? body.substring(0, 197) + "..." : (body || "");
  const deliveryStatsByUser = {};
  const tokensToRemove = [];
  const sentAt = new Date().toISOString();

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    try {
      const message = buildMulticastMessage({
        dataPayload, groupId: effectiveGroupId, title: finalTitle, body: truncatedBody, assoIcon, tokens: batch.map((t) => t.token)
      });
      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`sendPushToUsers - Lot ${Math.floor(i / BATCH_SIZE) + 1} : ${response.successCount} succès, ${response.failureCount} échecs.`);
      response.responses.forEach((resp, idx) => {
        const { token, userId } = batch[idx];
        const stats = deliveryStatsByUser[userId] || (deliveryStatsByUser[userId] = { sentAt, successCount: 0, failureCount: 0, lastErrorCode: null });
        if (resp.success) { stats.successCount += 1; return; }
        const code = resp.error?.code || resp.error?.message || "unknown_error";
        stats.failureCount += 1;
        stats.lastErrorCode = code;
        if (INVALID_TOKEN_CODES.includes(code)) tokensToRemove.push({ token, userId });
      });
    } catch (err) {
      console.error("sendPushToUsers - Erreur lors de l'envoi du lot :", err);
    }
  }

  await persistDeliveryResults(db, deliveryStatsByUser, tokensToRemove);
  return true;
}

/**
 * Idempotence des triggers Firestore (livraison « au moins une fois ») : réclame atomiquement le document source.
 * Retourne `false` si le document a déjà été traité (ou supprimé), évitant tout second Push sur retry.
 */
async function claimPushSend(db, ref, field = "serverPushClaimedAt") {
  try {
    return await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists || current.data()?.[field]) return false;
      tx.update(ref, { [field]: new Date().toISOString() });
      return true;
    });
  } catch (err) {
    console.warn("claimPushSend - Réclamation impossible, envoi interrompu pour éviter un doublon :", err?.message);
    return false;
  }
}

module.exports = { sendPushToUsers, claimPushSend };
