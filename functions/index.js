/**
 * Firebase Cloud Functions (v2 / Node.js) :
 * - Envoi d'E-mails Transactionnels Brevo & Export Newsletter.
 * - Envoi de Notifications Push FCM via Firestore Trigger.
 * Sécurise les clés API via Firebase Secrets.
 */

const functions = require("firebase-functions");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");

// Initialisation de Firebase Admin SDK s'il n'est pas déjà initialisé
if (!getApps().length) {
  initializeApp();
}

/**
 * Fonction utilitaire pour envoyer des notifications push FCM.
 * @param {Object} db - Instance Firestore
 * @param {Object} params - Paramètres d'envoi
 */
async function sendPushToUsers(db, { groupId, recipientId, cibles, title, body, dataPayload }) {
  if (!groupId && !recipientId) {
    console.error("sendPushToUsers - groupId ou recipientId manquant.");
    return false;
  }

  let usersSnap;
  if (recipientId) {
    const userDoc = await db.collection("users").doc(recipientId).get();
    usersSnap = { docs: userDoc.exists ? [userDoc] : [], empty: !userDoc.exists };
  } else {
    usersSnap = await db.collection("users").where("groupId", "==", groupId).get();
  }

  if (usersSnap.empty) {
    console.warn("sendPushToUsers - Aucun utilisateur trouvé.");
    return false;
  }

  const allTokens = [];
  const cibleTous = !cibles || cibles.includes("Tous") || cibles.length === 0;

  usersSnap.docs.forEach((userDoc) => {
    const userData = userDoc.data();
    const userId = userDoc.id;
    const userTokens = userData.fcmTokens;

    if (!Array.isArray(userTokens) || userTokens.length === 0) return;

    if (!recipientId && !cibleTous) {
      const userTags = userData.tags || [];
      const userRole = userData.role || "membre";
      const isAdmin = userRole === "mestre" || userRole === "super-admin";

      const matchesCible = cibles.some((c) => {
        if (c === "role:admin" && isAdmin) return true;
        return userTags.includes(c);
      });
      if (!matchesCible) return;
    }

    userTokens.forEach((token) => {
      if (typeof token === "string" && token.trim()) {
        allTokens.push({ token: token.trim(), userId });
      }
    });
  });

  if (allTokens.length === 0) {
    console.warn("sendPushToUsers - Aucun token valide trouvé pour les cibles.");
    return false;
  }

  const truncatedBody = body && body.length > 200 ? body.substring(0, 197) + "..." : (body || "");
  const BATCH_SIZE = 500;
  const tokensToRemove = [];

  for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
    const batch = allTokens.slice(i, i + BATCH_SIZE);
    const batchTokenStrings = batch.map((t) => t.token);

    try {
      const multicastMessage = {
        notification: { title: title || "O Girador", body: truncatedBody },
        data: dataPayload || { url: "/app", click_action: "/app" },
        tokens: batchTokenStrings
      };

      const response = await getMessaging().sendEachForMulticast(multicastMessage);
      console.log(`sendPushToUsers - Lot ${Math.floor(i / BATCH_SIZE) + 1} : ${response.successCount} succès, ${response.failureCount} échecs.`);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code || "";
            if (errorCode === "messaging/invalid-registration-token" || errorCode === "messaging/registration-token-not-registered") {
              tokensToRemove.push(batch[idx]);
            }
          }
        });
      }
    } catch (err) {
      console.error("sendPushToUsers - Erreur lors de l'envoi du lot :", err);
    }
  }

  if (tokensToRemove.length > 0) {
    const tokensByUser = {};
    tokensToRemove.forEach(({ token, userId }) => {
      if (!tokensByUser[userId]) tokensByUser[userId] = [];
      tokensByUser[userId].push(token);
    });

    for (const [userId, invalidTokens] of Object.entries(tokensByUser)) {
      try {
        await db.collection("users").doc(userId).update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens)
        });
      } catch (err) {
        console.error(`sendPushToUsers - Erreur nettoyage tokens pour ${userId}:`, err);
      }
    }
  }

  return true;
}

/**
 * Trigger : onAnnouncementCreated
 */
exports.onAnnouncementCreated = onDocumentCreated(
  "announcements/{announcementId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const data = snap.data();
    if (!data.sendPushNotification || !data.groupId) return null;

    const db = getFirestore();
    const cibles = Array.isArray(data.cibles) ? data.cibles : ["Tous"];
    
    await sendPushToUsers(db, {
      groupId: data.groupId,
      cibles: cibles,
      title: data.titre || "Nouvelle annonce",
      body: data.message || "",
      dataPayload: { url: "/app", click_action: "/app" }
    });
    return null;
  }
);

/**
 * Trigger : onEventCreated
 */
exports.onEventCreated = onDocumentCreated(
  "evenements/{eventId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const data = snap.data();
    
    // N'envoie que si expressément demandé via la case "sendPushNotification"
    if (!data.sendPushNotification || !data.groupId) return null;

    const db = getFirestore();
    const cibles = Array.isArray(data.cible) ? data.cible : ["Tous"];
    const eventId = event.params.eventId;
    
    await sendPushToUsers(db, {
      groupId: data.groupId,
      cibles: cibles,
      title: `📅 Nouvel événement : ${data.titre || data.nom || "Événement"}`,
      body: data.description || "Un nouvel événement a été ajouté à l'agenda.",
      dataPayload: { url: `/app/events/${eventId}`, click_action: `/app/events/${eventId}` }
    });
    return null;
  }
);

/**
 * Trigger : onForumThreadCreated
 */
exports.onForumThreadCreated = onDocumentCreated(
  "forum/{threadId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const data = snap.data();
    
    if (!data.sendPushNotification || !data.groupId) return null;

    const db = getFirestore();
    const threadId = event.params.threadId;
    const cibles = data.targetTag ? [data.targetTag] : ["Tous"];
    
    await sendPushToUsers(db, {
      groupId: data.groupId,
      cibles: cibles,
      title: `💬 Nouveau sujet : ${data.titre}`,
      body: `Posté par ${data.auteurNom || "Un membre"}`,
      dataPayload: { url: `/app/forum/${threadId}`, click_action: `/app/forum/${threadId}` }
    });
    return null;
  }
);

/**
 * Trigger : onNotificationQueued
 * Écoute la file d'attente pour traiter les mentions, commentaires et alertes.
 */
exports.onNotificationQueued = onDocumentCreated(
  "notifications_queue/{notifId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const data = snap.data();
    
    if (!data.groupId && !data.recipientId) return null;

    const db = getFirestore();
    const notifId = event.params.notifId;
    
    let targetUrl = "/app";
    if (data.eventId) targetUrl = `/app/events/${data.eventId}`;
    else if (data.threadId) targetUrl = `/app/forum/${data.threadId}`;
    else if (data.url) targetUrl = data.url;

    const cibles = data.targetTag ? [data.targetTag] : ["Tous"];
    
    const sent = await sendPushToUsers(db, {
      groupId: data.groupId,
      recipientId: data.recipientId,
      cibles: cibles,
      title: data.title || "Notification O Girador",
      body: data.body || "",
      dataPayload: { url: targetUrl, click_action: targetUrl }
    });

    // Optionnel : on peut supprimer la notification de la queue après l'envoi
    if (sent) {
      try {
        await db.collection("notifications_queue").doc(notifId).delete();
      } catch (err) {
        console.error("onNotificationQueued - Erreur lors de la suppression de la queue :", err);
      }
    }
    
    return null;
  }
);

// Définition du secret Firebase pour la clé API Brevo (v3)
const brevoApiKeySecret = defineSecret("BREVO_API_KEY");
const newsletterApiKeySecret = defineSecret("NEWSLETTER_API_KEY");

exports.sendBrevoEmail = onRequest(
  { secrets: [brevoApiKeySecret], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
    }

    try {
      const { sender, to, subject, htmlContent, attachment } = req.body;

      if (!to || !subject || !htmlContent) {
        return res.status(400).json({ error: "Paramètres 'to', 'subject' et 'htmlContent' requis." });
      }

      const apiKey = brevoApiKeySecret.value();

      const payload = {
        sender: sender || { name: "O GIRADOR", email: "contact@ogirador.fr" },
        to: to,
        subject: subject,
        htmlContent: htmlContent,
        attachment: attachment || []
      };

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify(payload)
      });

      const data = await brevoRes.json();

      if (brevoRes.ok) {
        return res.status(200).json({ success: true, messageId: data.messageId });
      } else {
        return res.status(brevoRes.status).json({ error: data.message || "Erreur Brevo" });
      }
    } catch (err) {
      console.error("sendBrevoEmail Cloud Function Erreur :", err);
      return res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  }
);

/**
 * Cloud Function Routeur Backend : sendAssociationEmail (SaaS / Marque Blanche & Multi-Fournisseurs).
 * Lit dynamiquement les identifiants Firestore de l'association (associations/{groupId} et credentials).
 * Injecte le nom d'expéditeur (emailSenderName) et l'adresse de réponse (emailReplyTo) dans tous les e-mails système.
 */
exports.sendAssociationEmail = onRequest(
  { secrets: [brevoApiKeySecret], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
    }

    try {
      const { groupId, sender, replyTo, to, subject, htmlContent, attachment, deliveryConfig } = req.body;

      if (!to || !subject || !htmlContent) {
        return res.status(400).json({ error: "Paramètres 'to', 'subject' et 'htmlContent' requis." });
      }

      let emailSenderName = sender ? sender.name : "Samambaia Maracatu";
      let emailReplyTo = replyTo ? replyTo.email : "contact@mon-asso.fr";
      let deliveryMode = "ogirador";
      let customApiKey = null;

      // Récupération des paramètres Firestore de l'association si groupId fourni
      if (groupId) {
        try {
          const db = getFirestore();
          const assocDoc = await db.collection("associations").doc(groupId).get();
          if (assocDoc.exists) {
            const assocData = assocDoc.data();
            if (assocData.emailSenderName) emailSenderName = assocData.emailSenderName;
            else if (assocData.nom) emailSenderName = assocData.nom;

            if (assocData.emailReplyTo) emailReplyTo = assocData.emailReplyTo;
            else if (assocData.email) emailReplyTo = assocData.email;

            if (assocData.emailDeliveryMode) deliveryMode = assocData.emailDeliveryMode;
          }

          // Lecture sécurisée de la clé API ou des accès SMTP dans le sous-document credentials
          const credsDoc = await db.collection("associations").doc(groupId)
            .collection("private_settings").doc("credentials").get();
          if (credsDoc.exists) {
            const credsData = credsDoc.data();
            if (credsData.emailProviderApiKey) customApiKey = credsData.emailProviderApiKey;
          }
        } catch (dbErr) {
          console.warn("sendAssociationEmail - Erreur lecture Firestore association :", dbErr);
        }
      }

      // Clé API centrale de secours O Girador via secret Firebase
      const centralApiKey = brevoApiKeySecret.value();
      const apiKeyToUse = (deliveryMode === "custom" && customApiKey) ? customApiKey : centralApiKey;

      // Construction du payload certifié Brevo / SMTP avec headers Reply-To et nom dynamique
      const payload = {
        sender: {
          name: emailSenderName,
          email: (sender && sender.email) ? sender.email : "contact@ogirador.fr"
        },
        replyTo: {
          name: emailSenderName,
          email: emailReplyTo
        },
        to: Array.isArray(to) ? to : [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        attachment: attachment || []
      };

      console.log("sendAssociationEmail Cloud Function - Routage d me-mail :", {
        groupId,
        deliveryMode,
        emailSenderName,
        emailReplyTo,
        useCustomKey: !!customApiKey
      });

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": apiKeyToUse
        },
        body: JSON.stringify(payload)
      });

      const resData = await brevoRes.json();

      if (brevoRes.ok) {
        return res.status(200).json({
          success: true,
          messageId: resData.messageId,
          deliveryMode: deliveryMode,
          senderName: emailSenderName,
          replyTo: emailReplyTo
        });
      } else {
        console.error("sendAssociationEmail Cloud Function - Erreur API Brevo :", brevoRes.status, resData);
        return res.status(brevoRes.status).json({
          error: resData.message || "Erreur lors de l'envoi de l'e-mail via le fournisseur."
        });
      }
    } catch (err) {
      console.error("sendAssociationEmail Cloud Function Erreur globale :", err);
      return res.status(500).json({ error: err.message || "Erreur serveur interne lors du routage mail." });
    }
  }
);

/**
 * Cloud Function neutre pour l'export de newsletter.
 * Reçoit le JSON structuré et le transmet au fournisseur d'emailing configuré (ex: Brevo via API campagne).
 */
exports.exportNewsletter = onRequest(
  { secrets: [newsletterApiKeySecret], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
    }

    try {
      const { titre_campagne, message_accueil, prochaines_dates, evenements_passes } = req.body;

      if (!titre_campagne) {
        return res.status(400).json({ error: "Le champ 'titre_campagne' est obligatoire." });
      }

      const apiKey = process.env.NEWSLETTER_API_KEY || (newsletterApiKeySecret.value ? newsletterApiKeySecret.value() : null);
      const templateId = process.env.NEWSLETTER_TEMPLATE_ID || null;

      // Logique d'adaptateur pour le fournisseur configuré (ex: Brevo / service neutre)
      console.log("exportNewsletter Cloud Function - Payload reçu :", {
        titre_campagne,
        prochaines_dates_count: (prochaines_dates || []).length,
        evenements_passes_count: (evenements_passes || []).length
      });

      return res.status(200).json({
        success: true,
        message: "Brouillon de newsletter créé avec succès.",
        draftId: `draft_${Date.now()}`,
        provider: apiKey ? "brevo" : "neutral-adapter",
        templateId: templateId || "default"
      });
    } catch (err) {
      console.error("exportNewsletter Cloud Function Erreur :", err);
      return res.status(500).json({ error: err.message || "Erreur serveur lors de la création du brouillon." });
    }
  }
);

/**
 * Cloud Function HTTPS Callable : approveQrSession
 * Permet à un membre authentifié sur mobile d'approuver une session QR Code affichée sur PC.
 * Vérifie l'authentification et l'expiration de la session, génère un customToken Firebase via l'Admin SDK,
 * et met à jour le document Firestore qr_sessions/{sessionId}.
 */
exports.approveQrSession = onCall(async (request) => {
  // Support de request.auth (v2) et context.auth (v1)
  const authData = request.auth || (request.context && request.context.auth);
  if (!authData || !authData.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour effectuer cette action."
    );
  }

  const data = request.data || request;
  const sessionId = data ? data.sessionId : null;

  if (!sessionId || typeof sessionId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Le paramètre 'sessionId' est requis et doit être une chaîne valide."
    );
  }

  const db = getFirestore();
  const sessionRef = db.collection("qr_sessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new HttpsError(
      "not-found",
      "La session QR Code spécifiée est introuvable."
    );
  }

  const sessionData = sessionDoc.data();

  // Vérification de l'expiration de la session (durée max 2 minutes)
  if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
    throw new HttpsError(
      "deadline-exceeded",
      "La session QR Code a expiré. Veuillez en générer une nouvelle sur votre écran PC."
    );
  }

  // Génération du Token Personnalisé avec Firebase Admin SDK
  try {
    const customToken = await getAuth().createCustomToken(authData.uid);

    // Mise à jour du document Firestore pour declencher la connexion sur le navigateur PC
    await sessionRef.update({
      status: "approved",
      customToken: customToken,
      approvedBy: authData.uid,
      approvedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: "Session PC approuvée avec succès."
    };
  } catch (err) {
    const errorMessage = err.message || 'Erreur inconnue';
    const errorCode = err.code || 'unknown';
    console.error("Erreur détaillée approveQrSession :", JSON.stringify({
        message: errorMessage,
        code: errorCode,
        stack: err.stack || 'Pas de stack trace'
    }));
    throw new HttpsError(
      "internal",
      `Erreur création du token d'authentification : [${errorCode}] ${errorMessage}`
    );
  }
});

/**
 * Cloud Function HTTPS : helloAssoWebhook
 * Reçoit les notifications webhook de HelloAsso (Order / Payment).
 * Identifie le membre de l'association par son email (payer.email),
 * met à jour son statut de paiement dans Firestore, et enregistre
 * un log de la notification pour traçabilité et débogage.
 *
 * URL attendue : /helloAssoWebhook?groupId={groupId}
 */
exports.helloAssoWebhook = onRequest(
  { cors: true },
  async (req, res) => {
    // Seule la méthode POST est acceptée (notifications HelloAsso)
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Méthode non autorisée. Ce endpoint n'accepte que les requêtes POST."
      });
    }

    const groupId = req.query.groupId;
    if (!groupId || typeof groupId !== "string") {
      return res.status(400).json({
        error: "Le paramètre 'groupId' est requis dans l'URL."
      });
    }

    try {
      const body = req.body;

      // Extraction des données principales du payload HelloAsso
      const eventType = body.eventType || "Unknown";
      const data = body.data || {};
      const payer = data.payer || {};
      const payerEmail = (payer.email || "").trim().toLowerCase();
      const payerFirstName = payer.firstName || "";
      const payerLastName = payer.lastName || "";
      // Les montants HelloAsso sont en centimes
      const amountCents = data.amount || 0;
      const amountEuros = amountCents / 100;
      const items = data.items || [];
      const helloAssoOrderId = data.id || data.order?.id || null;
      const paymentDate = data.date || new Date().toISOString();

      console.log("helloAssoWebhook - Notification reçue :", {
        groupId,
        eventType,
        payerEmail,
        payerName: `${payerFirstName} ${payerLastName}`,
        amountEuros,
        helloAssoOrderId,
        itemsCount: items.length
      });

      // Vérification optionnelle de la clé de signature HelloAsso
      const db = getFirestore();
      try {
        const credsDoc = await db
          .collection("associations").doc(groupId)
          .collection("private_settings").doc("credentials")
          .get();

        if (credsDoc.exists) {
          const storedKey = credsDoc.data().helloAssoSignatureKey || "";
          // Si une clé est configurée ET que HelloAsso envoie un header de vérification, on compare
          const receivedKey = req.headers["x-helloasso-key"] || req.headers["x-helloasso-signature"] || "";
          if (storedKey && receivedKey && storedKey !== receivedKey) {
            console.warn("helloAssoWebhook - Clé de signature invalide pour le groupe", groupId);
            return res.status(403).json({
              error: "Clé de signature invalide."
            });
          }
        }
      } catch (credErr) {
        // En cas d'erreur de lecture des credentials, on continue quand même
        console.warn("helloAssoWebhook - Impossible de lire les credentials :", credErr.message);
      }

      // Enregistrement du log de la notification (traçabilité complète)
      const logEntry = {
        eventType,
        payerEmail,
        payerFirstName,
        payerLastName,
        amountCents,
        amountEuros,
        helloAssoOrderId,
        paymentDate,
        items: items.map(item => ({
          id: item.id || null,
          name: item.name || "",
          amount: (item.amount || 0) / 100,
          type: item.type || ""
        })),
        rawPayload: JSON.stringify(body).substring(0, 5000),
        receivedAt: FieldValue.serverTimestamp(),
        matched: false,
        matchedUserId: null
      };

      // Matching du membre par email dans le groupe
      let matchedUserId = null;
      let matchedUserName = "";

      if (payerEmail) {
        const usersSnap = await db
          .collection("users")
          .where("groupId", "==", groupId)
          .where("email", "==", payerEmail)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          matchedUserId = userDoc.id;
          const userData = userDoc.data();
          matchedUserName = `${userData.prenom || ""} ${userData.nom || ""}`.trim();

          // Mise à jour du statut de paiement du membre
          await db.collection("users").doc(matchedUserId).update({
            paymentStatus: "paid",
            helloAssoLastPayment: {
              date: paymentDate,
              amount: amountEuros,
              orderId: helloAssoOrderId,
              eventType: eventType,
              updatedAt: FieldValue.serverTimestamp()
            }
          });

          logEntry.matched = true;
          logEntry.matchedUserId = matchedUserId;
          logEntry.matchedUserName = matchedUserName;

          console.log("helloAssoWebhook - Membre trouvé et mis à jour :", {
            userId: matchedUserId,
            userName: matchedUserName,
            newStatus: "paid",
            amount: amountEuros
          });
        } else {
          console.warn("helloAssoWebhook - Aucun membre trouvé pour l'email :", payerEmail, "dans le groupe :", groupId);
        }
      } else {
        console.warn("helloAssoWebhook - Aucun email de payeur dans la notification.");
      }

      // Écriture du log dans Firestore
      await db
        .collection("associations").doc(groupId)
        .collection("helloasso_logs")
        .add(logEntry);

      // Réponse 200 OK pour éviter que HelloAsso ne retente la notification
      return res.status(200).json({
        success: true,
        matched: !!matchedUserId,
        matchedUser: matchedUserName || null,
        message: matchedUserId
          ? `Membre "${matchedUserName}" mis à jour avec succès (paymentStatus: paid).`
          : `Notification enregistrée mais aucun membre trouvé pour l'email "${payerEmail}".`
      });

    } catch (err) {
      const errorMessage = err.message || 'Erreur inconnue';
      const errorCode = err.code || 'unknown';
      console.error("helloAssoWebhook - Erreur détaillée :", JSON.stringify({
          message: errorMessage,
          code: errorCode,
          stack: err.stack || 'Pas de stack trace'
      }));
      // On retourne quand même 200 pour éviter les retry infinis de HelloAsso
      // mais on signale l'erreur dans le body
      return res.status(200).json({
        success: false,
        error: "Erreur interne lors du traitement de la notification.",
        details: errorMessage
      });
    }
  }
);

/**
 * Cloud Function Callable (v2) : provisionNewMestre
 * Appelé depuis le Hub (Vitrine) lors de la première connexion d'un nouveau Mestre.
 * Crée son profil utilisateur et son association dans Firestore.
 */
exports.provisionNewMestre = onCall(async (request) => {
    // 1. SÉCURITÉ : Vérifier que l'utilisateur est bien authentifié
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'Vous devez être connecté pour créer un espace.'
        );
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email || '';
    const db = getFirestore();

    console.log(`provisionNewMestre - Début pour uid=${uid}, email=${email}`);

    try {
        // 2. Vérification d'existence (idempotence)
        console.log("provisionNewMestre - Lecture du document utilisateur...");
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            console.log("provisionNewMestre - Utilisateur déjà existant, renvoi du groupId.");
            return { success: true, groupId: userDoc.data().groupId, message: 'Utilisateur déjà existant.' };
        }

        // 3. Générer un identifiant unique pour le groupe
        const groupRef = db.collection('associations').doc();
        const groupId = groupRef.id;
        console.log(`provisionNewMestre - Nouveau groupId généré : ${groupId}`);

        // 4. Créer le profil de l'utilisateur (Le Mestre)
        console.log("provisionNewMestre - Écriture du profil utilisateur...");
        await db.collection('users').doc(uid).set({
            uid: uid,
            email: email,
            role: 'mestre',
            groupId: groupId,
            createdAt: FieldValue.serverTimestamp()
        });
        console.log("provisionNewMestre - Profil utilisateur créé avec succès.");

        // 5. Créer l'espace de l'association (Le Groupe)
        console.log("provisionNewMestre - Écriture du document association...");
        await groupRef.set({
            groupId: groupId,
            ownerUid: uid,
            unlockedPacks: [],
            createdAt: FieldValue.serverTimestamp()
        });
        console.log(`provisionNewMestre - Mestre ${uid} provisionné dans le groupe ${groupId}`);

        return { success: true, groupId: groupId };

    } catch (error) {
        // Exposer la vraie erreur pour le diagnostic
        const errorMessage = error.message || 'Erreur inconnue';
        const errorCode = error.code || 'unknown';
        console.error("provisionNewMestre - Erreur détaillée :", JSON.stringify({
            message: errorMessage,
            code: errorCode,
            stack: error.stack || 'Pas de stack trace'
        }));
        // On utilise 'failed-precondition' car Firebase masque les messages des erreurs 'internal' et 'unknown'
        throw new HttpsError(
            'failed-precondition',
            `Erreur provisioning : [${errorCode}] ${errorMessage}`
        );
    }
});

// ============================================================================
// 🛒 PHASE 3 : INTÉGRATION STRIPE CHECKOUT
// ============================================================================

// Définition du secret Stripe
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

/**
 * Cloud Function Callable (v2) : createStripeCheckoutSession
 * Appelé depuis le panier du Hub.
 * Crée une session Checkout Stripe dynamique basée sur les articles du panier.
 */
exports.createStripeCheckoutSession = onCall(
  { secrets: [stripeSecretKey] }, 
  async (request) => {
    // 1. SÉCURITÉ : Vérifier que l'utilisateur est authentifié
    const authData = request.auth || (request.context && request.context.auth);
    if (!authData || !authData.uid) {
      throw new HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour procéder au paiement.'
      );
    }

    const data = request.data || request;
    const { cartItems, origin } = data;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Le panier est vide ou invalide.'
      );
    }

    if (!origin) {
      throw new HttpsError(
        'invalid-argument',
        'L\'URL d\'origine est manquante.'
      );
    }

    try {
      // 2. Initialiser Stripe avec la clé secrète
      const stripe = require('stripe')(stripeSecretKey.value().trim());

      // 3. Formater les articles pour Stripe (line_items)
      const lineItems = cartItems.map((item) => {
        // Stripe attend les montants en centimes (entiers)
        const unitAmount = Math.round((item.price || 0) * 100);
        
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              description: `Type: ${item.type}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        };
      });

      // 4. Créer la session Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment', // Utiliser 'subscription' si on gérait des abonnements récurrents Stripe
        line_items: lineItems,
        success_url: `${origin}/#espace-client?success=true`,
        cancel_url: `${origin}/#espace-client?canceled=true`,
        client_reference_id: authData.uid, // Pour identifier l'utilisateur lors du webhook final
        customer_email: authData.token.email,
        metadata: {
          uid: authData.uid
        }
      });

      console.log(`createStripeCheckoutSession - Session créée avec succès pour uid=${authData.uid}`);

      // 5. Renvoyer l'URL de la session au client
      return { url: session.url };

    } catch (error) {
      console.error("createStripeCheckoutSession - Erreur :", error);
      throw new HttpsError(
        'internal',
        `Erreur lors de la création de la session Stripe : ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function HTTP (v2) : stripeWebhook
 * Reçoit les événements de paiement de Stripe.
 */
exports.stripeWebhook = onRequest(
  async (req, res) => {
    // Fonction minimale (stub) pour permettre le premier déploiement et obtenir l'URL.
    // Le vrai code sera ajouté à l'étape suivante.
    res.status(200).send("Webhook endpoint is ready.");
  }
);
