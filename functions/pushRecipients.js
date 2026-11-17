/**
 * Résolution des destinataires et des jetons FCM pour les Push (module extrait de index.js).
 * Garantit l'unicité des destinataires (`recipientUids`) et des jetons (`Set` global).
 */

/** Variantes de casse d'un groupId (ex. `Samambaia`, `samambaia`) pour la requête Firestore. */
function buildGroupVariants(groupId) {
  const rawGroup = String(groupId || "").trim();
  const lowerGroup = rawGroup.toLowerCase();
  const capGroup = lowerGroup ? lowerGroup.charAt(0).toUpperCase() + lowerGroup.slice(1) : "";
  return Array.from(new Set([rawGroup, lowerGroup, capGroup])).filter(Boolean);
}

/** Charge les documents `users` ciblés, dédupliqués par identifiant. */
async function loadUserDocs(db, { groupId, recipientId }) {
  let docs = [];
  if (recipientId) {
    const userDoc = await db.collection("users").doc(recipientId).get();
    docs = userDoc.exists ? [userDoc] : [];
  } else {
    const snap = await db.collection("users").where("groupId", "in", buildGroupVariants(groupId)).get();
    docs = snap.docs;
  }
  const byId = new Map();
  docs.forEach((d) => { if (!byId.has(d.id)) byId.set(d.id, d); });
  return Array.from(byId.values());
}

/** Indique si un utilisateur est visé par les `cibles` (tags/rôle) ou par `recipientUids`. */
function isUserTargeted(userData, userId, { recipientId, cibleTous, cibles, recipientUids }) {
  if (recipientId || cibleTous) return true;
  const userTags = userData.tags || [];
  const isAdmin = ["mestre", "super-admin"].includes(userData.role || "membre");
  if (recipientUids.includes(userId)) return true;
  return Boolean(cibles && cibles.some((c) => {
    if (c === "Tous") return false;
    if (c === "role:admin" && isAdmin) return true;
    return userTags.includes(c);
  }));
}

/**
 * Retourne `{ tokens: [{ token, userId }], effectiveGroupId }` avec un jeton unique par appareil
 * (`[...new Set(allTokens)]` : un même jeton n'est jamais notifié deux fois, même partagé entre comptes).
 */
async function collectPushTargets(db, { groupId, recipientId, cibles, targetUserIds }) {
  const userDocs = await loadUserDocs(db, { groupId, recipientId });
  const recipientUids = [...new Set((Array.isArray(targetUserIds) ? targetUserIds : []).filter(Boolean))];
  const cibleTous = (!cibles || cibles.includes("Tous") || cibles.length === 0) && recipientUids.length === 0;

  const allTokens = [];
  const ownerByToken = new Map();
  userDocs.forEach((userDoc) => {
    const userData = userDoc.data();
    if (!Array.isArray(userData.fcmTokens)) return;
    if (!isUserTargeted(userData, userDoc.id, { recipientId, cibleTous, cibles, recipientUids })) return;
    userData.fcmTokens
      .filter((t) => typeof t === "string" && t.trim())
      .map((t) => t.trim())
      .forEach((token) => {
        allTokens.push(token);
        if (!ownerByToken.has(token)) ownerByToken.set(token, userDoc.id);
      });
  });

  const tokens = [...new Set(allTokens)].map((token) => ({ token, userId: ownerByToken.get(token) }));
  const effectiveGroupId = groupId || (userDocs[0] ? userDocs[0].data()?.groupId || "" : "");
  return { tokens, effectiveGroupId, hasUsers: userDocs.length > 0 };
}

module.exports = { collectPushTargets };
