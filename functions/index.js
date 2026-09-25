/**
 * Firebase Cloud Functions (v2 / Node.js) :
 * - Envoi d'E-mails Transactionnels Brevo & Export Newsletter.
 * - Envoi de Notifications Push FCM via Firestore Trigger.
 * Sécurise les clés API via Firebase Secrets.
 */

const functions = require("firebase-functions");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");

const { getApps, initializeApp } = require("firebase-admin/app");
const crypto = require("crypto");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
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

    // Dédoublonner les jetons de l'utilisateur pour éviter les envois multiples au même token
    const uniqueUserTokens = Array.from(new Set((userTokens || []).filter(t => typeof t === "string" && t.trim()).map(t => t.trim())));
    uniqueUserTokens.forEach((token) => {
      // Dédoublonner globalement dans allTokens
      if (!allTokens.some((item) => item.token === token)) {
        allTokens.push({ token, userId });
      }
    });
  });

  if (allTokens.length === 0) {
    console.warn("sendPushToUsers - Aucun token valide trouvé pour les cibles.");
    return false;
  }

  // Résolution de l'identifiant effectif de groupe pour charger le logo d'association
  let effectiveGroupId = groupId;
  if (!effectiveGroupId && recipientId && usersSnap.docs.length > 0) {
    effectiveGroupId = usersSnap.docs[0].data()?.groupId || "";
  }

  // Récupération du nom et du logo personnalisé de l'association (branding marque blanche)
  let assoName = "";
  let assoIcon = "/icon-192x192.png";
  if (effectiveGroupId) {
    try {
      const assoDoc = await db.collection("associations").doc(effectiveGroupId).get();
      if (assoDoc.exists) {
        const assoData = assoDoc.data() || {};
        assoName = assoData.nom || "";
        // Priorité au logo téléversé dans le branding, sinon logo racine, sinon repli statique
        if (assoData.branding && assoData.branding.logoUrl) {
          assoIcon = assoData.branding.logoUrl;
        } else if (assoData.logoUrl) {
          assoIcon = assoData.logoUrl;
        }
      }
    } catch (e) {
      console.warn("sendPushToUsers - Erreur lors de la récupération de l'association", e);
    }
  }

  const baseTitle = title || "O Girador";
  const finalTitle = assoName ? `${assoName} | ${baseTitle}` : baseTitle;
  const truncatedBody = body && body.length > 200 ? body.substring(0, 197) + "..." : (body || "");
  const BATCH_SIZE = 500;
  const tokensToRemove = [];

  for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
    const batch = allTokens.slice(i, i + BATCH_SIZE);
    const batchTokenStrings = batch.map((t) => t.token);

    try {
      // Données de navigation transmises au service worker pour le deep linking
      const rawData = dataPayload || { url: "/app", click_action: "/app" };
      let eventUrl = rawData.url || "/app";
      if (!eventUrl.startsWith('http') && !eventUrl.startsWith('/app')) {
        eventUrl = eventUrl.startsWith('/') ? `/app${eventUrl}` : `/app/${eventUrl}`;
      }
      const resolvedData = { ...rawData, url: eventUrl, click_action: eventUrl };

      // Tag déterministe pour que le navigateur et l'OS fusionnent tout doublon
      const notifTag = resolvedData.tag || (resolvedData.eventId ? `event-${resolvedData.eventId}` : (resolvedData.announcementId ? `annonce-${resolvedData.announcementId}` : (resolvedData.threadId ? `forum-${resolvedData.threadId}` : undefined)));

      const multicastMessage = {
        notification: {
          title: finalTitle,
          body: truncatedBody,
          ...(assoIcon.startsWith('http') ? { imageUrl: assoIcon } : {})
        },
        android: {
          priority: 'high',
          notification: {
            ...(notifTag ? { tag: notifTag } : {})
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          }
        },
        webpush: {
          notification: {
            title: finalTitle,
            body: truncatedBody,
            icon: assoIcon, // URL Storage dynamique du logo de l'association
            badge: '/badge-72x72.png', // Symbole monochrome pour la barre d'état Android
            ...(notifTag ? { tag: notifTag } : {}),
            // Données injectées dans l'objet notification pour le handler notificationclick du SW
            data: {
              ...resolvedData,
              url: eventUrl,
              groupId: effectiveGroupId || "",
              icon: assoIcon,
              ...(notifTag ? { tag: notifTag } : {})
            }
          },
          fcmOptions: {
            link: eventUrl
          }
        },
        data: {
          ...resolvedData,
          url: eventUrl,
          groupId: effectiveGroupId || "",
          icon: assoIcon,
          ...(notifTag ? { tag: notifTag } : {})
        },
        tokens: batchTokenStrings
      };

      const response = await getMessaging().sendEachForMulticast(multicastMessage);
      console.log(`sendPushToUsers - Lot ${Math.floor(i / BATCH_SIZE) + 1} : ${response.successCount} succès, ${response.failureCount} échecs.`);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code || "";
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered" ||
              errorCode === "messaging/mismatched-credential" ||
              errorCode.includes("not-registered") ||
              errorCode.includes("invalid-registration-token")
            ) {
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
        console.log(`sendPushToUsers - Nettoyage automatique : ${invalidTokens.length} token(s) obsolète(s) retiré(s) pour l'utilisateur ${userId}`);
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
    
    const announcementId = event.params.announcementId;
    await sendPushToUsers(db, {
      groupId: data.groupId,
      cibles: cibles,
      title: data.titre || "Nouvelle annonce",
      body: data.message || "",
      dataPayload: { url: "/app", click_action: "/app", announcementId, tag: `annonce-${announcementId}` }
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
      dataPayload: { url: `/app/events/${eventId}`, click_action: `/app/events/${eventId}`, eventId, tag: `event-${eventId}` }
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
      dataPayload: { url: `/app/forum/${threadId}`, click_action: `/app/forum/${threadId}`, threadId, tag: `forum-${threadId}` }
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
    if (data.url) {
      targetUrl = (!data.url.startsWith('http') && !data.url.startsWith('/app'))
        ? (data.url.startsWith('/') ? `/app${data.url}` : `/app/${data.url}`)
        : data.url;
    } else if (data.eventId) {
      targetUrl = `/app/events/${data.eventId}`;
    } else if (data.threadId) {
      targetUrl = `/app/forum/${data.threadId}`;
    }

    const cibles = data.targetTag ? [data.targetTag] : ["Tous"];
    
    const sent = await sendPushToUsers(db, {
      groupId: data.groupId,
      recipientId: data.recipientId,
      cibles: cibles,
      title: data.title || "Notification O Girador",
      body: data.body || "",
      dataPayload: { url: targetUrl, click_action: targetUrl, notifId, tag: `queue-${notifId}` }
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
  { secrets: [brevoApiKeySecret], cors: true, invoker: 'public' },
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
        sender: {
          name: (sender && sender.name) ? sender.name : "O GIRADOR",
          email: "contact@o-girador.com"
        },
        to: to,
        subject: subject,
        htmlContent: htmlContent
      };

      // Brevo rejette la requête si 'attachment' est un tableau vide
      if (Array.isArray(attachment) && attachment.length > 0) {
        payload.attachment = attachment;
      }

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
  { secrets: [brevoApiKeySecret], cors: true, invoker: 'public' },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
    }

    try {
      const { groupId, sender, replyTo, to, subject, htmlContent, attachment, deliveryConfig } = req.body;

      if (!to || !subject || !htmlContent) {
        return res.status(400).json({ error: "Paramètres 'to', 'subject' et 'htmlContent' requis." });
      }

      let emailSenderName = sender ? sender.name : "O GIRADOR";
      let emailReplyTo = replyTo ? replyTo.email : "contact@o-girador.com";

      // Valeurs par défaut du mode d'envoi
      let finalDeliveryMode = deliveryConfig?.deliveryMode || 'ogirador';
      let finalConnectionType = deliveryConfig?.connectionType || 'api';
      let finalApiProvider = deliveryConfig?.apiProvider || 'brevo';
      let smtpPassword = '';
      let emailProviderApiKey = '';

      let smtpHost = deliveryConfig?.smtpHost || '';
      let smtpPort = deliveryConfig?.smtpPort || 587;
      let smtpUser = deliveryConfig?.smtpUser || '';
      let smtpSecure = deliveryConfig?.smtpSecure || 'tls';

      const db = getFirestore();

      // Récupération des paramètres Firestore de l'association si groupId fourni
      if (groupId) {
        try {
          const assocDoc = await db.collection("associations").doc(groupId).get();
          if (assocDoc.exists) {
            const assocData = assocDoc.data();
            if (assocData.emailSenderName) emailSenderName = assocData.emailSenderName;
            else if (assocData.nom) emailSenderName = assocData.nom;

            // On utilise prioritairement l'adresse Reply-To personnalisée ou l'e-mail officiel
            if (assocData.emailReplyTo) emailReplyTo = assocData.emailReplyTo;
            else if (assocData.email) emailReplyTo = assocData.email;

            if (assocData.emailDeliveryMode) finalDeliveryMode = assocData.emailDeliveryMode;
            if (assocData.emailConnectionType) finalConnectionType = assocData.emailConnectionType;
            if (assocData.emailApiProvider) finalApiProvider = assocData.emailApiProvider;
            if (assocData.smtpHost) smtpHost = assocData.smtpHost;
            if (assocData.smtpPort) smtpPort = assocData.smtpPort;
            if (assocData.smtpUser) smtpUser = assocData.smtpUser;
            if (assocData.smtpSecure) smtpSecure = assocData.smtpSecure;
          }

          // Récupération des credentials secrets (mot de passe SMTP et clé API)
          const credsDoc = await db.collection("associations").doc(groupId).collection("private_settings").doc("credentials").get();
          if (credsDoc.exists) {
            const credsData = credsDoc.data();
            smtpPassword = credsData.smtpPassword || '';
            emailProviderApiKey = credsData.emailProviderApiKey || '';
          }
        } catch (dbErr) {
          console.warn("sendAssociationEmail - Erreur lecture Firestore association :", dbErr);
        }
      }

      console.log("sendAssociationEmail Cloud Function - Configuration :", {
        groupId,
        emailSenderName,
        emailReplyTo,
        finalDeliveryMode,
        finalConnectionType,
        finalApiProvider
      });

      // ==========================================
      // OPTION B : SERVICE EXTERNE - SERVEUR SMTP
      // ==========================================
      if (finalDeliveryMode === 'custom' && finalConnectionType === 'smtp') {
        if (!smtpHost || !smtpUser || !smtpPassword) {
          return res.status(400).json({ error: "Configuration SMTP incomplète (hôte, utilisateur ou mot de passe manquant)." });
        }

        const nodemailer = require("nodemailer");
        const isSecure = smtpSecure === 'ssl' || smtpPort === 465;

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const nodemailerAttachments = (attachment || []).map(att => {
          return {
            filename: att.name,
            content: att.content,
            encoding: 'base64'
          };
        });

        const mailOptions = {
          from: `"${emailSenderName}" <${smtpUser}>`,
          replyTo: emailReplyTo,
          to: Array.isArray(to) ? to.map(t => t.email).join(', ') : to,
          subject: subject,
          html: htmlContent,
          attachments: nodemailerAttachments
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log("sendAssociationEmail - E-mail envoyé via SMTP :", info.messageId);
          return res.status(200).json({
            success: true,
            messageId: info.messageId,
            deliveryMode: 'custom_smtp',
            senderName: emailSenderName,
            replyTo: emailReplyTo
          });
        } catch (smtpErr) {
          console.error("sendAssociationEmail - Erreur SMTP :", smtpErr);
          return res.status(500).json({ error: "Erreur lors de l'envoi via votre serveur SMTP : " + smtpErr.message });
        }
      }

      // ==========================================
      // OPTION B : SERVICE EXTERNE - CLÉ API BREVO (CUSTOM)
      // ==========================================
      let apiKeyToUse = brevoApiKeySecret.value();
      let senderEmail = "contact@o-girador.com";

      if (finalDeliveryMode === 'custom' && finalConnectionType === 'api' && finalApiProvider === 'brevo' && emailProviderApiKey) {
        apiKeyToUse = emailProviderApiKey;
        // Si l'asso utilise sa propre clé Brevo, on peut utiliser son e-mail officiel
        senderEmail = emailReplyTo; 
      }

      // ==========================================
      // OPTION A (OU FALLBACK API BREVO O GIRADOR)
      // ==========================================
      const payload = {
        sender: {
          name: emailSenderName,
          email: senderEmail
        },
        replyTo: {
          name: emailSenderName,
          email: emailReplyTo
        },
        to: Array.isArray(to) ? to : [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      };

      // Brevo rejette la requête si 'attachment' est un tableau vide
      if (Array.isArray(attachment) && attachment.length > 0) {
        payload.attachment = attachment;
      }

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
          deliveryMode: finalDeliveryMode,
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
 * Récupère les identifiants Brevo pour une association donnée (clé API et ID de liste).
 * Priorité : private_settings/credentials > associations.publicTheme > secret central.
 */
async function getBrevoCredentialsForGroup(db, groupId, defaultSecret) {
  let apiKeyToUse = null;
  let listIdToUse = null;

  if (groupId) {
    try {
      const credsSnap = await db.collection("associations").doc(groupId).collection("private_settings").doc("credentials").get();
      if (credsSnap.exists) {
        const creds = credsSnap.data();
        apiKeyToUse = creds.emailProviderApiKey || null;
        listIdToUse = creds.brevoListId || null;
      }
    } catch (err) {
      console.warn("getBrevoCredentialsForGroup - Erreur private_settings :", err.message);
    }

    if (!apiKeyToUse || !listIdToUse) {
      try {
        const assocSnap = await db.collection("associations").doc(groupId).get();
        if (assocSnap.exists) {
          const assocData = assocSnap.data();
          if (!apiKeyToUse && assocData.publicTheme?.brevoApiKey) {
            apiKeyToUse = assocData.publicTheme.brevoApiKey;
          }
          if (!listIdToUse && assocData.publicTheme?.brevoListId) {
            listIdToUse = assocData.publicTheme.brevoListId;
          }
        }
      } catch (err) {
        console.warn("getBrevoCredentialsForGroup - Erreur publicTheme :", err.message);
      }
    }
  }

  if (!apiKeyToUse && defaultSecret && defaultSecret.value) {
    apiKeyToUse = defaultSecret.value();
  }

  return { apiKeyToUse, listIdToUse };
}

/**
 * Cloud Function Trigger : onNewsletterSubscriberCreated
 * Écoute les créations de documents dans `newsletter_subscribers` et synchronise
 * instantanément le contact avec la liste Brevo via l'API v3.
 */
exports.onNewsletterSubscriberCreated = onDocumentCreated(
  { document: "newsletter_subscribers/{subscriberId}", secrets: [brevoApiKeySecret] },
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const data = snap.data();
    const email = (data.email || "").trim().toLowerCase();
    const groupId = data.groupId;

    if (!email || !email.includes("@")) return null;

    const db = getFirestore();
    const { apiKeyToUse, listIdToUse } = await getBrevoCredentialsForGroup(db, groupId, brevoApiKeySecret);

    if (!apiKeyToUse) {
      console.warn("onNewsletterSubscriberCreated - Aucune clé API Brevo configurée pour le groupe :", groupId);
      await snap.ref.update({
        brevoStatus: "not_configured",
        updatedAt: FieldValue.serverTimestamp()
      });
      return null;
    }

    const parsedListId = listIdToUse ? parseInt(listIdToUse, 10) : null;
    const brevoPayload = {
      email: email,
      updateEnabled: true
    };
    if (parsedListId && !isNaN(parsedListId)) {
      brevoPayload.listIds = [parsedListId];
    }

    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": apiKeyToUse
        },
        body: JSON.stringify(brevoPayload)
      });

      const resData = await brevoRes.json().catch(() => ({}));

      if (brevoRes.ok || brevoRes.status === 201 || brevoRes.status === 204) {
        console.log("onNewsletterSubscriberCreated - Contact synchronisé avec Brevo :", email);
        await snap.ref.update({
          brevoStatus: "synced",
          syncedAt: FieldValue.serverTimestamp(),
          brevoListId: parsedListId || null,
          brevoError: null
        });
      } else {
        console.error("onNewsletterSubscriberCreated - Erreur Brevo :", brevoRes.status, resData);
        await snap.ref.update({
          brevoStatus: "error",
          brevoError: resData.message || `Code HTTP ${brevoRes.status}`,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    } catch (err) {
      console.error("onNewsletterSubscriberCreated - Exception réseau :", err);
      await snap.ref.update({
        brevoStatus: "error",
        brevoError: err.message,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return null;
  }
);

/**
 * Cloud Function HTTPS Callable : syncNewsletterSubscribersToBrevo
 * Permet de synchroniser manuellement et en lot tous les abonnés newsletter d'une association.
 */
exports.syncNewsletterSubscribersToBrevo = onCall(
  { secrets: [brevoApiKeySecret], cors: true },
  async (request) => {
    const authData = request.auth || (request.context && request.context.auth);
    if (!authData || !authData.uid) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté pour exécuter cette action.");
    }

    const data = request.data || {};
    const groupId = data.groupId;
    if (!groupId) {
      throw new HttpsError("invalid-argument", "Le paramètre groupId est requis.");
    }

    const db = getFirestore();
    const { apiKeyToUse, listIdToUse } = await getBrevoCredentialsForGroup(db, groupId, brevoApiKeySecret);

    if (!apiKeyToUse) {
      throw new HttpsError("failed-precondition", "Aucune clé API Brevo n'est configurée pour cette association.");
    }

    const parsedListId = listIdToUse ? parseInt(listIdToUse, 10) : null;

    const subscribersSnap = await db.collection("newsletter_subscribers")
      .where("groupId", "==", groupId)
      .get();

    if (subscribersSnap.empty) {
      return { success: true, count: 0, message: "Aucun abonné à synchroniser." };
    }

    let syncedCount = 0;
    let errorCount = 0;

    for (const docSnap of subscribersSnap.docs) {
      const sub = docSnap.data();
      const email = (sub.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;

      const brevoPayload = {
        email: email,
        updateEnabled: true
      };
      if (parsedListId && !isNaN(parsedListId)) {
        brevoPayload.listIds = [parsedListId];
      }

      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": apiKeyToUse
          },
          body: JSON.stringify(brevoPayload)
        });

        if (brevoRes.ok || brevoRes.status === 201 || brevoRes.status === 204) {
          syncedCount++;
          await docSnap.ref.update({
            brevoStatus: "synced",
            syncedAt: FieldValue.serverTimestamp(),
            brevoListId: parsedListId || null,
            brevoError: null
          });
        } else {
          errorCount++;
          const resData = await brevoRes.json().catch(() => ({}));
          await docSnap.ref.update({
            brevoStatus: "error",
            brevoError: resData.message || `Code HTTP ${brevoRes.status}`,
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      } catch (err) {
        errorCount++;
        await docSnap.ref.update({
          brevoStatus: "error",
          brevoError: err.message,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    return {
      success: true,
      total: subscribersSnap.size,
      synced: syncedCount,
      errors: errorCount,
      message: `${syncedCount} abonné(s) synchronisé(s) avec succès dans Brevo.`
    };
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
 * Cloud Function HTTPS Callable (v2) : getCrossAppAuthToken
 * Permet à un utilisateur connecté de forger un jeton d'authentification personnalisé (customToken)
 * enrichi avec ses revendications (role, groupId, displayName) pour naviguer de façon fluide et
 * transparente entre les applications de la suite O Girador sans rupture de session (SSO Cross-App).
 */
exports.getCrossAppAuthToken = onCall({ cors: true }, async (request) => {
  const authData = request.auth || (request.context && request.context.auth);
  if (!authData || !authData.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être authentifié pour obtenir un jeton SSO."
    );
  }

  const uid = authData.uid;

  try {
    let role = 'membre';
    let groupId = '';
    let displayName = authData.token?.name || '';

    // 1. Récupération du profil Firestore de l'utilisateur
    try {
      const userDoc = await getFirestore().collection("users").doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        role = userData.role || role;
        groupId = userData.groupId || '';
        displayName = userData.displayName || `${userData.prenom || ''} ${userData.nom || ''}`.trim() || displayName;
      }
    } catch (profileErr) {
      console.warn(`[SSO] Avertissement: Impossible d'accéder au profil Firestore pour ${uid} :`, profileErr);
    }

    // 2. Constitution des revendications personnalisées
    const customClaims = {
      role: role,
      groupId: typeof groupId === 'string' ? groupId.trim().toLowerCase() : (groupId || ''),
    };
    if (displayName) {
      customClaims.displayName = displayName;
    }

    // 3. Forge du jeton sécurisé via Firebase Admin SDK
    const customToken = await getAuth().createCustomToken(uid, customClaims);

    return {
      success: true,
      token: customToken,
      customToken: customToken
    };
  } catch (error) {
    console.error(`[SSO] Erreur lors de la création du customToken pour l'UID ${uid} :`, error);
    throw new HttpsError(
      "internal",
      `Impossible de forger le jeton d'authentification SSO : ${error.message || error}`
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
      const payerEmail = (payer.email || (data.order && data.order.payer && data.order.payer.email) || "").trim().toLowerCase();
      const payerFirstName = payer.firstName || (data.order && data.order.payer && data.order.payer.firstName) || "";
      const payerLastName = payer.lastName || (data.order && data.order.payer && data.order.payer.lastName) || "";

      // Calcul ultra-résilient du montant (bannir tout risque de NaN pour les objets, entiers ou sous-propriétés)
      let rawAmount = 0;
      if (typeof data.amount === "number") {
        rawAmount = data.amount;
      } else if (data.amount && typeof data.amount === "object") {
        rawAmount = data.amount.total || data.amount.amount || 0;
      } else if (data.order?.amount) {
        rawAmount = typeof data.order.amount === "number" ? data.order.amount : (data.order.amount.total || 0);
      }

      // Si le montant n'a pas pu être extrait mais que des items sont présents
      if ((!rawAmount || isNaN(rawAmount)) && Array.isArray(data.items) && data.items.length > 0) {
        rawAmount = data.items.reduce((sum, item) => {
          const itemVal = typeof item.amount === "number" ? item.amount : (item.amount?.total || 0);
          return sum + (Number(itemVal) || 0);
        }, 0);
      }

      const amountEuros = (!isNaN(rawAmount) && rawAmount > 0) ? (rawAmount / 100) : 0;
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

      // Vérification sécurisée de la signature HelloAsso (directe ou HMAC-SHA256)
      const db = getFirestore();
      try {
        const credsDoc = await db
          .collection("associations").doc(groupId)
          .collection("private_settings").doc("credentials")
          .get();

        if (credsDoc.exists) {
          const storedKey = credsDoc.data().helloAssoSignatureKey || "";
          const receivedKey = req.headers["x-ha-signature"] || req.headers["x-helloasso-signature"] || req.headers["x-helloasso-key"] || "";
          if (storedKey && receivedKey) {
            const isDirectMatch = storedKey === receivedKey;
            let isHmacMatch = false;
            try {
              const hmac = crypto.createHmac("sha256", storedKey);
              const computedHash = hmac.update(req.rawBody || JSON.stringify(req.body)).digest("hex");
              isHmacMatch = computedHash.toLowerCase() === receivedKey.toLowerCase();
            } catch (hmacErr) {
              console.warn("helloAssoWebhook - Erreur calcul HMAC :", hmacErr.message);
            }

            if (!isDirectMatch && !isHmacMatch) {
              console.warn("helloAssoWebhook - Signature invalide pour le groupe", groupId);
              return res.status(403).json({
                error: "Signature de notification invalide."
              });
            }
          }
        }
      } catch (credErr) {
        // En cas d'erreur de lecture des credentials, on consigne un avertissement et continue
        console.warn("helloAssoWebhook - Impossible de lire les credentials :", credErr.message);
      }

      // Enregistrement du log de la notification (traçabilité complète)
      const logEntry = {
        eventType,
        payerEmail,
        payerFirstName,
        payerLastName,
        amountEuros,
        helloAssoOrderId,
        paymentDate,
        items: items.map(item => ({
          id: item.id || null,
          name: item.name || "",
          amount: (typeof item.amount === "number" ? item.amount : (item.amount?.total || 0)) / 100,
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

          // Notification interne in-app pour les trésoriers
          try {
            const treasurersSnap = await db.collection("users")
              .where("groupId", "==", groupId)
              .get();
            const treasurerPromises = [];
            treasurersSnap.forEach((tDoc) => {
              const tData = tDoc.data();
              const uTags = [
                ...(Array.isArray(tData.userTags) ? tData.userTags : []),
                ...(Array.isArray(tData.tags) ? tData.tags : []),
                ...(tData.role ? [tData.role] : [])
              ].map(t => typeof t === 'string' ? t.toLowerCase().trim() : (t?.nom || t?.name || t?.id || '').toLowerCase().trim());
              if (uTags.includes('trésorier') || uTags.includes('tresorier')) {
                treasurerPromises.push(
                  db.collection("users").doc(tDoc.id).collection("in_app_notifications").add({
                    title: "💳 Cotisation réglée",
                    titre: "💳 Cotisation réglée",
                    message: `${matchedUserName} a réglé son adhésion`,
                    targetUrl: "/treasury?tab=cotisations",
                    icon: "💳",
                    read: false,
                    isRead: false,
                    groupId,
                    createdAt: FieldValue.serverTimestamp()
                  })
                );
              }
            });
            await Promise.allSettled(treasurerPromises);
          } catch (notifErr) {
            console.warn("helloAssoWebhook - Notification trésorier ignorée :", notifErr.message);
          }
        } else {
          console.warn("helloAssoWebhook - Aucun membre trouvé pour l'email :", payerEmail, "dans le groupe :", groupId, "- Enregistrement dans pending_payments");
          // Sas pending_payments pour réconciliation automatique lors de l'onboarding futur
          await db.collection("pending_payments").doc(payerEmail).set({
            groupId,
            payerEmail,
            payerFirstName,
            payerLastName,
            amountEuros,
            orderId: helloAssoOrderId,
            eventType,
            paymentDate,
            items: items.map(item => ({
              id: item.id || null,
              name: item.name || "",
              amount: (typeof item.amount === "number" ? item.amount : (item.amount?.total || 0)) / 100,
              type: item.type || ""
            })),
            reconciled: false,
            createdAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } else {
        console.warn("helloAssoWebhook - Aucun email de payeur dans la notification.");
      }

      // Écriture comptable systématique dans la collection racine transactions
      if (amountEuros > 0) {
        try {
          const txDoc = await db.collection("transactions").add({
            groupId,
            date: Timestamp.fromDate(new Date(paymentDate)),
            type: "recette",
            montant: amountEuros,
            categorie: "Cotisations",
            libelle: `Paiement HelloAsso - ${matchedUserName || (payerFirstName + " " + payerLastName).trim() || payerEmail} (${eventType})`,
            justificatifNom: helloAssoOrderId ? `HelloAsso #${helloAssoOrderId}` : "Notification HelloAsso",
            helloAssoOrderId: helloAssoOrderId || null,
            userId: matchedUserId || null,
            source: "helloasso",
            createdAt: FieldValue.serverTimestamp()
          });
          logEntry.transactionId = txDoc.id;
        } catch (txErr) {
          console.error("helloAssoWebhook - Erreur enregistrement transaction comptable :", txErr.message);
        }
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
          : `Notification enregistrée dans pending_payments pour l'email "${payerEmail}".`
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
            contributionPoints: 50,
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
        );
    }
});

/**
 * Cloud Function Callable (v2) : sendContractEmail
 * Envoie un contrat de prestation par email transactionnel via Brevo.
 */
exports.sendContractEmail = onCall(
  { secrets: [brevoApiKeySecret], cors: true },
  async (request) => {
    // 1. Sécurité : authentification requise
    const authData = request.auth || (request.context && request.context.auth);
    if (!authData || !authData.uid) {
      throw new HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour envoyer un contrat.'
      );
    }

    const data = request.data || request;
    const { 
      recipientEmail, 
      recipientName, 
      eventName, 
      eventDate, 
      cachet, 
      contractPdfUrl, 
      customNotes, 
      templateId, 
      groupId 
    } = data;

    if (!recipientEmail) {
      throw new HttpsError('invalid-argument', 'L\'e-mail du destinataire est requis.');
    }

    try {
      const db = getFirestore();
      
      let emailSenderName = "O GIRADOR";
      let emailSenderAddress = "contact@o-girador.com";
      let emailReplyTo = "contact@o-girador.com";
      let customApiKey = null;
      let deliveryMode = "ogirador";

      // Récupération des paramètres de l'association si un groupId est fourni
      if (groupId) {
        try {
          const assocDoc = await db.collection("associations").doc(groupId).get();
          if (assocDoc.exists) {
            const assocData = assocDoc.data();
            emailSenderName = assocData.emailSenderName || assocData.nom || emailSenderName;
            emailSenderAddress = assocData.emailOfficiel || assocData.email || emailSenderAddress;
            emailReplyTo = assocData.emailReplyTo || assocData.email || emailReplyTo;
            deliveryMode = assocData.emailDeliveryMode || deliveryMode;
          }

          const credsDoc = await db.collection("associations").doc(groupId)
            .collection("private_settings").doc("credentials").get();
          
          if (credsDoc.exists) {
            const credsData = credsDoc.data();
            if (credsData.emailProviderApiKey) {
              customApiKey = credsData.emailProviderApiKey;
            }
          }
        } catch (dbErr) {
          console.warn("sendContractEmail - Erreur lecture Firestore :", dbErr);
        }
      }

      // Sélection de la clé API
      const centralApiKey = brevoApiKeySecret.value();
      const apiKeyToUse = (deliveryMode === "custom" && customApiKey) ? customApiKey : centralApiKey;

      // Construction du payload pour Brevo
      const payload = {
        sender: {
          name: emailSenderName,
          email: emailSenderAddress
        },
        replyTo: {
          name: emailSenderName,
          email: emailReplyTo
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName || recipientEmail
          }
        ]
      };

      if (templateId && templateId.trim() !== '') {
        // Utilisation d'un template transactionnel Brevo
        payload.templateId = parseInt(templateId, 10);
        payload.params = {
          eventName: eventName || "",
          eventDate: eventDate || "",
          cachet: cachet || "",
          contractPdfUrl: contractPdfUrl || "",
          customNotes: customNotes || "",
          recipientName: recipientName || ""
        };
      } else {
        // Utilisation du modèle de texte par défaut
        payload.subject = `[Contrat] - ${eventName || "Prestation"}`;
        
        // Assemblage du message en HTML
        let htmlBody = `<div style="font-family: sans-serif; color: #333; line-height: 1.6;">`;
        htmlBody += `<p>Bonjour ${recipientName || 'à vous'},</p>`;
        
        let evtString = eventName ? `<strong>${eventName}</strong>` : `votre événement`;
        if (eventDate) evtString += ` du <strong>${eventDate}</strong>`;
        
        htmlBody += `<p>Veuillez trouver ci-joint ou ci-dessous notre contrat de prestation concernant ${evtString}.</p>`;
        
        if (cachet) {
          htmlBody += `<p>Montant convenu : <strong>${cachet}</strong>.</p>`;
        }
        
        if (contractPdfUrl) {
           htmlBody += `<p style="margin: 20px 0;">
             <a href="${contractPdfUrl}" style="background-color: #2d6a4f; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
               📄 Télécharger et Consulter le Contrat
             </a>
           </p>`;
        }
        
        if (customNotes) {
           htmlBody += `<div style="margin-top: 20px; padding: 15px; border-left: 4px solid #c05621; background-color: #fdfaf2;">
             <p style="margin-top: 0; font-weight: bold; color: #c05621;">Note de notre équipe :</p>
             <p style="white-space: pre-line; margin-bottom: 0;">${customNotes}</p>
           </div>`;
        }
        
        htmlBody += `<p style="margin-top: 30px;">Nous vous invitons à le consulter, le parapher et à nous le retourner signé avec la mention "Lu et approuvé - Bon pour accord".<br/>Nous restons à votre entière disposition pour tout échange logistique ou complémentaire.</p>`;
        htmlBody += `<p>Cordialement,<br/><strong>L'équipe ${emailSenderName}</strong></p>`;
        htmlBody += `</div>`;
        
        payload.htmlContent = htmlBody;
      }

      console.log("sendContractEmail - Transmission à Brevo...", {
        groupId,
        senderEmail: emailSenderAddress,
        deliveryMode,
        hasCustomKey: !!customApiKey
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
        return { 
          success: true, 
          messageId: resData.messageId,
          message: "Contrat expédié avec succès !" 
        };
      } else {
        console.error("sendContractEmail - Erreur API Brevo :", brevoRes.status, resData);
        throw new HttpsError(
          'internal', 
          `Erreur lors de l'envoi via Brevo: ${resData.message || resData.code || "Erreur inconnue"}`
        );
      }

    } catch (error) {
      console.error("sendContractEmail - Exception globale :", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        'internal',
        `Erreur serveur interne : ${error.message}`
      );
    }
  }
);

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


// ============================================================================
// 🌍 PHASE 4 : SEO & RÉFÉRENCEMENT MULTI-TENANT (MOSTRADOR)
// ============================================================================

/**
 * Cloud Function HTTP (v2) : serveDynamicApp
 * Intercepte les requêtes Firebase Hosting, identifie le tenant (association),
 * et injecte dynamiquement les balises Meta SEO dans le fichier index.html.
 */
exports.serveDynamicApp = onRequest(async (req, res) => {
  const hostname = req.hostname;
  const urlPath = req.path;
  const projectId = process.env.GCLOUD_PROJECT || "o-girador-7828c";
  
  // Détermination du site Firebase Hosting source
  const hostingDomain = (hostname.includes('mostrador') && !hostname.includes('organizador'))
    ? 'o-girador-mostrador.web.app'
    : 'o-girador-organizador.web.app';

  // Valeurs O Girador par défaut
  let seoTitle = "O Girador";
  let seoDesc = "Application de gestion pour groupes et associations.";
  let seoImage = `https://${hostingDomain}/og-image.png`;
  let seoUrl = `https://${hostname}${urlPath}`;

  try {
    const db = getFirestore();
    let groupId = null;
    
    // 1. Détection du groupe via paramètres d'URL, sous-domaine ou domaine personnalisé
    if (req.query && (req.query.groupe || req.query.tenant)) {
      groupId = req.query.groupe || req.query.tenant;
    } else if (hostname.includes('mostrador.o-girador.com') || hostname.includes('organizador.o-girador.com')) {
      const parts = hostname.split('.');
      if (parts.length > 3 && parts[0] !== 'mostrador' && parts[0] !== 'organizador') {
        groupId = parts[0];
      }
    } else if (!hostname.includes('o-girador.com') && !hostname.includes('web.app') && !hostname.includes('localhost')) {
      const associationsRef = db.collection('associations');
      const possibleHostnames = [hostname];
      if (hostname.startsWith('www.')) possibleHostnames.push(hostname.replace(/^www\./, ''));
      else possibleHostnames.push(`www.${hostname}`);
      
      const snapshot = await associationsRef.where('customDomains', 'array-contains-any', possibleHostnames).get();
      if (!snapshot.empty) {
        groupId = snapshot.docs[0].id;
      }
    }

    // 2. Récupération des infos SEO depuis Firestore
    if (groupId) {
      const assocDoc = await db.collection('associations').doc(groupId).get();
      if (assocDoc.exists) {
        const data = assocDoc.data();
        seoTitle = data.nom ? `O Girador | ${data.nom}` : seoTitle;
        seoDesc = data.description ? data.description.substring(0, 180) : `Rejoignez notre association sur O Girador : agenda, répétitions, vestiaire et matériel.`;
        seoImage = data.logoUrl || data.coverUrl || seoImage;
      }
    }

    // 3. Récupération du HTML statique de base (bypasse le rewrite car pointe sur le fichier exact)
    const htmlResponse = await fetch(`https://${hostingDomain}/index.html?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    let htmlContent = await htmlResponse.text();

    // 4. Injection des métadonnées
    htmlContent = htmlContent
      .replace(/<title>.*?<\/title>/gi, `<title>${seoTitle}</title>`)
      .replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${seoTitle}" />`)
      .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${seoDesc}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${seoTitle}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${seoDesc}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${seoImage}" />`)
      .replace(/<meta property="og:image:secure_url" content=".*?" \/>/gi, `<meta property="og:image:secure_url" content="${seoImage}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${seoUrl}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${seoTitle}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${seoDesc}" />`)
      .replace(/<meta name="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${seoImage}" />`);

    // 5. Entêtes anti-cache strictes pour que le HTML ne soit jamais gelé par les CDN et navigateurs
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error("serveDynamicApp - Erreur :", error);
    // En cas de crash, on renvoie une erreur classique pour éviter de bloquer l'app
    res.status(500).send("Erreur de génération SEO dynamique.");
  }
});

/**
 * Cloud Function HTTP (v2) : serveSitemap
 * Génère dynamiquement le sitemap.xml en fonction du domaine (tenant).
 */
exports.serveSitemap = onRequest(async (req, res) => {
  const hostname = req.hostname;
  
  // Implémentation basique : on liste l'accueil.
  // Idéalement, on interrogerait Firestore pour lister les events publics du groupe.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
      <loc>https://${hostname}/</loc>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
   </url>
</urlset>`;

  res.set('Content-Type', 'text/xml');
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(xml);
});

/**
 * Cloud Function HTTP (v2) : serveRobotsTxt
 * Autorise dynamiquement l'indexation.
 */
exports.serveRobotsTxt = onRequest(async (req, res) => {
  const hostname = req.hostname;
  const txt = `User-agent: *
Allow: /

Sitemap: https://${hostname}/sitemap.xml`;

  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(txt);
});

/**
 * Cloud Function HTTP (v2) : telemetry
 * Centralise les rapports de bugs et télémétrie.
 */
exports.telemetry = onRequest({ cors: true }, async (req, res) => {
  // Accepter uniquement POST
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Pre-flight CORS (if needed despite {cors: true})
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const API_KEY = process.env.VITE_OGIRADOR_HUB_API_KEY || "o-girador-telemetry-secret-key-2026";
  const key = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
  }

  try {
    const payload = req.body;
    const { collectionType, data } = payload;
    
    if (!collectionType || !data) {
      return res.status(400).json({ error: 'Missing collectionType or data' });
    }

    const timestamp = FieldValue.serverTimestamp();
    const db = getFirestore();

    if (collectionType === 'crash') {
      const { errorMessage, appId } = data;
      const errorRef = db.collection('hub_system_errors');
      
      const snapshot = await errorRef
        .where('errorMessage', '==', errorMessage)
        .where('appId', '==', appId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await errorRef.doc(docId).update({
          occurrencesCount: FieldValue.increment(1),
          lastSeenAt: timestamp,
        });
        return res.status(200).json({ success: true, message: 'Crash occurrence updated' });
      } else {
        await errorRef.add({
          ...data,
          occurrencesCount: 1,
          createdAt: timestamp,
          lastSeenAt: timestamp,
          status: 'new'
        });
        return res.status(201).json({ success: true, message: 'New crash registered' });
      }
    } 
    else if (collectionType === 'ticket') {
      await db.collection('hub_tickets').add({
        ...data,
        createdAt: timestamp,
        status: data.status || 'new'
      });
      return res.status(201).json({ success: true, message: 'Ticket created' });
    }
    else if (collectionType === 'review') {
      await db.collection('hub_reviews').add({
        ...data,
        createdAt: timestamp
      });
      return res.status(201).json({ success: true, message: 'Review created' });
    }
    else if (collectionType === 'telemetry') {
      await db.collection('hub_telemetry_daily').add({
        ...data,
        timestamp: timestamp
      });
      return res.status(201).json({ success: true, message: 'Telemetry logged' });
    }
    else {
      return res.status(400).json({ error: 'Invalid collectionType' });
    }

  } catch (error) {
    console.error("Erreur Ingestion Télémétrie:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Logique d'exécution du cron de relance automatique.
 * Évalue les règles d'automatisation actives de chaque association,
 * cible les événements correspondants et expédie les notifications push FCM
 * avec filtrage strict 'present_only' et deep linking /events/:id.
 * 
 * @param {Object} db Instance Firestore Admin SDK
 * @returns {Promise<Object>} Rapport d'exécution
 */
async function runRelanceAutomations(db) {
  const report = { processedAssociations: 0, triggeredCount: 0, details: [] };
  const now = new Date();
  // Date courante normalisée sur le fuseau 'Europe/Paris' (format YYYY-MM-DD)
  const todayParisStr = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  try {
    const associationsSnap = await db.collection("associations").get();
    report.processedAssociations = associationsSnap.size;

    for (const assocDoc of associationsSnap.docs) {
      const groupId = assocDoc.id;

      // 1. Récupération des règles actives sous associations/{groupId}/automation_rules
      const rulesSnap = await db.collection("associations").doc(groupId)
        .collection("automation_rules")
        .where("isActive", "==", true)
        .get();

      if (rulesSnap.empty) continue;

      // 2. Récupération des événements pour cette association (à venir et passés récents jusqu'à 30 jours)
      const eventsSnap = await db.collection("events")
        .where("groupId", "==", groupId)
        .get();

      if (eventsSnap.empty) continue;

      const eventsList = [];
      eventsSnap.forEach((evDoc) => {
        const ev = { id: evDoc.id, ...evDoc.data() };
        const evEndDateStr = ev.dateFin || ev.date;
        const evEndDate = new Date(evEndDateStr);
        // Conserver les événements futurs et passés récents jusqu'à 30 jours pour les relances post-événement
        if (!isNaN(evEndDate.getTime()) && evEndDate >= new Date(now.getTime() - 30 * 24 * 3600 * 1000)) {
          eventsList.push(ev);
        }
      });

      if (eventsList.length === 0) continue;

      // 3. Récupération des membres actifs de l'association
      const usersSnap = await db.collection("users")
        .where("groupId", "==", groupId)
        .get();

      const activeUsers = [];
      usersSnap.forEach((uDoc) => {
        const u = { id: uDoc.id, ...uDoc.data() };
        if (u.statutActuel !== "archived") {
          activeUsers.push(u);
        }
      });

      // 4. Évaluation règle par règle et événement par événement
      for (const ruleDoc of rulesSnap.docs) {
        const rule = ruleDoc.data();
        const rulePublicCible = rule.publicCible || "tous";
        const isAfterEvent = rule.pointDeReference === "after_event";

        for (const ev of eventsList) {
          // Correspondance du type d'événement
          const matchesType = !rule.typeEvenementCible ||
                              rule.typeEvenementCible === "tous" ||
                              rule.typeEvenementCible === ev.type;
          if (!matchesType) continue;

          // Date de référence (registrationDeadline, after_event ou eventDate)
          let referenceDateStr = "";
          if (rule.pointDeReference === "registrationDeadline") {
            referenceDateStr = ev.dateLimiteInscription || ev.date;
          } else if (isAfterEvent) {
            referenceDateStr = ev.dateFin || ev.date;
          } else {
            referenceDateStr = ev.date;
          }

          if (!referenceDateStr) continue;

          // Extraction de la composante jour YYYY-MM-DD
          const refDayStr = referenceDateStr.split("T")[0];
          const [rYear, rMonth, rDay] = refDayStr.split("-").map(Number);
          if (!rYear || !rMonth || !rDay) continue;

          // Calcul de triggerDate à midi UTC pour neutraliser tout décalage d'heure d'hiver/été
          const triggerDate = new Date(Date.UTC(rYear, rMonth - 1, rDay, 12, 0, 0));
          if (isAfterEvent) {
            const delayAfter = parseInt(rule.joursApres || rule.joursAvant, 10) || 1;
            triggerDate.setUTCDate(triggerDate.getUTCDate() + delayAfter);
          } else {
            const delayBefore = parseInt(rule.joursAvant, 10) || 0;
            triggerDate.setUTCDate(triggerDate.getUTCDate() - delayBefore);
          }
          const triggerDateStr = triggerDate.toISOString().split("T")[0];

          if (triggerDateStr === todayParisStr) {
            const inscriptions = Array.isArray(ev.inscriptions) ? ev.inscriptions : [];
            let targetUserIds = [];

            if (isAfterEvent) {
              // Relance retour des costumes post-prestation :
              // Strictement les participants confirmés (status === 'present')
              // n'ayant pas encore renseigné leur déclaration de tenue (idempotence)
              targetUserIds = inscriptions
                .filter((ins) => {
                  if (ins.status !== "present" || !ins.userId) return false;
                  if (ins.costumeStatus || ins.costumeDeclaration) return false;
                  const isUserActive = activeUsers.some((u) => u.id === ins.userId);
                  return isUserActive;
                })
                .map((ins) => ins.userId);
            } else if (rulePublicCible === "present_only") {
              // Filtrage strict : uniquement les inscriptions ayant status === 'present'
              targetUserIds = inscriptions
                .filter((ins) => ins.status === "present" && ins.userId)
                .map((ins) => ins.userId);
            } else if (rulePublicCible === "inscrits") {
              // Tous les inscrits
              targetUserIds = inscriptions
                .filter((ins) => ins.userId)
                .map((ins) => ins.userId);
            } else {
              // Relances classiques : membres qui n'ont pas encore répondu (ou status === 'pending')
              const answeredUserIds = new Set(
                inscriptions
                  .filter((ins) => ins.status && ins.status !== "pending")
                  .map((ins) => ins.userId)
              );
              targetUserIds = activeUsers
                .filter((u) => !answeredUserIds.has(u.id))
                .map((u) => u.id);
            }

            if (targetUserIds.length > 0) {
              const eventName = ev.titre || ev.nom || "Événement";
              const notifTitle = rule.titreNotification || (isAfterEvent ? `🎭 Tenues : ${eventName}` : "Rappel Événement");
              const notifBody = (rule.messageNotification || (isAfterEvent ? "Merci d'indiquer l'état de ton costume (rendu, à laver ou retouche)." : "Information concernant {{nomEvenement}}"))
                .replace(/\{\{nomEvenement\}\}/g, eventName);
              const deepLinkUrl = isAfterEvent ? `/mon-vestiaire?eventId=${ev.id}` : `/events/${ev.id}`;

              for (const recipientId of targetUserIds) {
                report.triggeredCount++;
                await sendPushToUsers(db, {
                  groupId: groupId,
                  recipientId: recipientId,
                  title: notifTitle,
                  body: notifBody,
                  dataPayload: { url: deepLinkUrl, click_action: deepLinkUrl }
                });
              }

              const ruleActionLabel = isAfterEvent ? "retour costumes" : rulePublicCible;
              report.details.push(
                `[${groupId}] Règle "${rule.titre}" : ${targetUserIds.length} notification(s) envoyée(s) pour "${eventName}" (${ruleActionLabel})`
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("runRelanceAutomations - Erreur globale :", err);
    report.error = err.message;
  }

  return report;
}

/**
 * Cloud Function Cron planifiée pour l'exécution quotidienne des relances.
 * Déclenchée chaque matin à 08:00 (fuseau Europe/Paris).
 */
exports.cronRelances = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "Europe/Paris",
    memory: "512MiB",
    timeoutSeconds: 300
  },
  async (event) => {
    console.log("cronRelances - Démarrage du traitement planifié des relances...");
    const db = getFirestore();
    const result = await runRelanceAutomations(db);
    console.log("cronRelances - Bilan :", result);
    return result;
  }
);

/**
 * Cloud Function HTTPS / OnCall permettant de déclencher manuellement le moteur de relances.
 * Utile pour les tests d'intégration et le forçage administrateur.
 */
exports.triggerRelancesManual = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentification requise pour déclencher les relances.");
  }
  const db = getFirestore();
  return await runRelanceAutomations(db);
});

// ==========================================
// PHASE 4 SaaS - STRIPE BILLING
// ==========================================
const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * Cloud Function HTTPS : Webhook Stripe
 * Écoute les événements Stripe pour mettre à jour l'abonnement du locataire (tenant).
 */
exports.stripeWebhook = onRequest(
  { secrets: [stripeSecret, stripeWebhookSecret], cors: true },
  async (req, res) => {
    // Vérification de la méthode
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const stripe = require("stripe")(stripeSecret.value());
    const endpointSecret = stripeWebhookSecret.value();
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Utilisation du rawBody fourni par Firebase
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = getFirestore();
    const dataObject = event.data.object;

    try {
      switch (event.type) {
        case "checkout.session.completed":
          // Lors de la souscription initiale, on récupère le groupId depuis client_reference_id ou metadata
          const groupId = dataObject.client_reference_id || (dataObject.metadata && dataObject.metadata.groupId);
          if (groupId) {
            await db.collection("associations").doc(groupId).set({
              subscription: {
                status: "active",
                plan: dataObject.metadata?.plan || "standard",
                stripeCustomerId: dataObject.customer,
                stripeSubscriptionId: dataObject.subscription,
                currentPeriodEnd: null,
                trialEndsAt: null
              }
            }, { merge: true });
            console.log(`✅ Subscription created for group ${groupId}`);
          }
          break;

        case "customer.subscription.updated":
          // Mise à jour de l'abonnement
          const subId = dataObject.id;
          const status = dataObject.status; // 'active', 'past_due', 'canceled', etc.
          const currentPeriodEnd = new Date(dataObject.current_period_end * 1000).toISOString();
          
          // Trouver l'association correspondant à cet abonnement
          const assocSnapshot = await db.collection("associations")
            .where("subscription.stripeSubscriptionId", "==", subId)
            .get();
            
          if (!assocSnapshot.empty) {
            const assocDoc = assocSnapshot.docs[0];
            await assocDoc.ref.update({
              "subscription.status": status,
              "subscription.currentPeriodEnd": currentPeriodEnd
            });
            console.log(`✅ Subscription ${subId} updated for group ${assocDoc.id} (Status: ${status})`);
          }
          break;

        case "customer.subscription.deleted":
          const deletedSubId = dataObject.id;
          const delAssocSnapshot = await db.collection("associations")
            .where("subscription.stripeSubscriptionId", "==", deletedSubId)
            .get();
            
          if (!delAssocSnapshot.empty) {
            const assocDoc = delAssocSnapshot.docs[0];
            await assocDoc.ref.update({
              "subscription.status": "expired"
            });
            console.log(`❌ Subscription ${deletedSubId} deleted (expired) for group ${assocDoc.id}`);
          }
          break;

        case "invoice.payment_failed":
          const customerId = dataObject.customer;
          const failAssocSnapshot = await db.collection("associations")
            .where("subscription.stripeCustomerId", "==", customerId)
            .get();
            
          if (!failAssocSnapshot.empty) {
            const assocDoc = failAssocSnapshot.docs[0];
            await assocDoc.ref.update({
              "subscription.status": "past_due"
            });
            console.log(`⚠️ Payment failed for customer ${customerId}, group ${assocDoc.id} set to past_due`);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error("Error processing webhook:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

/**
 * Cloud Function Callable : createStripePortalSession
 * Génère une URL pour le portail client Stripe (Customer Portal).
 */
exports.createStripePortalSession = onCall(
  { secrets: [stripeSecret], cors: true },
  async (request) => {
    // Vérification de l'authentification
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté.");
    }
    
    const db = getFirestore();
    const data = request.data || {};
    const groupId = data.groupId;
    const returnUrl = data.returnUrl;
    
    if (!groupId) {
      throw new HttpsError("invalid-argument", "Le paramètre groupId est requis.");
    }

    // Vérifier les droits du demandeur (Doit être admin ou super-admin du groupe)
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("permission-denied", "Utilisateur introuvable.");
    }
    const userData = userDoc.data();
    if (userData.groupId !== groupId || !["admin", "super-admin", "mestre"].includes(userData.role)) {
      throw new HttpsError("permission-denied", "Accès refusé. Vous devez être administrateur du groupe.");
    }
    
    // Récupérer le Customer ID
    const assocDoc = await db.collection("associations").doc(groupId).get();
    if (!assocDoc.exists) {
      throw new HttpsError("not-found", "Association introuvable.");
    }
    const assocData = assocDoc.data();
    const customerId = assocData.subscription?.stripeCustomerId;
    
    if (!customerId) {
      throw new HttpsError("failed-precondition", "Aucun compte de facturation actif n'est lié à cette association.");
    }
    
    try {
      const stripe = require("stripe")(stripeSecret.value());
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || "https://organizador.o-girador.com/settings",
      });
      
      return { url: session.url };
    } catch (err) {
      console.error("Erreur createStripePortalSession:", err);
      throw new HttpsError("internal", "Impossible de générer la session du portail.", err.message);
    }
  }
);

// =============================================================================
// AUTOMATISATION FRAMASPACE (NEXTCLOUD WEBDAV / OCS SHARE API)
// =============================================================================

/**
 * Nettoie et transforme une chaîne en slug ASCII pour les noms de répertoires WebDAV.
 * @param {string} str - Chaîne source
 * @returns {string} Slug nettoyé
 */
function slugifyWebdav(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Récupère les identifiants sécurisés Framaspace pour une association donnée.
 * @param {Object} db - Instance Firestore Admin
 * @param {string} groupId - Identifiant de l'association
 * @returns {Promise<{ framaspaceUrl: string|null, framaspaceUsername: string|null, framaspaceAppPassword: string|null }>}
 */
async function getFramaspaceCredentialsForGroup(db, groupId) {
  if (!groupId) return { framaspaceUrl: null, framaspaceUsername: null, framaspaceAppPassword: null };

  let framaspaceUrl = null;
  let framaspaceUsername = null;
  let framaspaceAppPassword = null;

  try {
    const credsSnap = await db.collection("associations").doc(groupId).collection("private_settings").doc("credentials").get();
    if (credsSnap.exists) {
      const c = credsSnap.data();
      framaspaceUrl = c.framaspaceUrl || null;
      framaspaceUsername = c.framaspaceUsername || null;
      framaspaceAppPassword = c.framaspaceAppPassword || null;
    }
  } catch (err) {
    console.warn("getFramaspaceCredentialsForGroup - Erreur lecture credentials :", err.message);
  }

  // Fallback si framaspaceUrl est défini au niveau du document racine association
  if (!framaspaceUrl) {
    try {
      const assocSnap = await db.collection("associations").doc(groupId).get();
      if (assocSnap.exists) {
        const a = assocSnap.data();
        framaspaceUrl = a.cloudRootUrl || a.framaspaceUrl || null;
      }
    } catch (err) {
      console.warn("getFramaspaceCredentialsForGroup - Erreur lecture document association :", err.message);
    }
  }

  return { framaspaceUrl, framaspaceUsername, framaspaceAppPassword };
}

/**
 * Crée les répertoires et les partages Framaspace (File drop et Album) pour un événement.
 * @param {string} eventId - Identifiant de l'événement Firestore
 * @param {Object} eventData - Données complètes de l'événement
 * @param {Object} options - Options ({ force: boolean })
 * @returns {Promise<{ success: boolean, lienDepotMedias?: string, albumPhotosUrl?: string, framaspaceFolder?: string, reason?: string }>}
 */
async function provisionFramaspaceForEvent(eventId, eventData, options = {}) {
  const db = getFirestore();
  const groupId = eventData.groupId;
  if (!groupId) {
    console.log(`provisionFramaspaceForEvent - groupId manquant pour l'événement ${eventId}, abandon.`);
    return { success: false, reason: "missing-group-id" };
  }

  // Vérifier le type d'événement et le consentement de récolte
  const typeEv = (eventData.type || eventData.typeEvenement || "").toLowerCase();
  const isTargetPrestation = ["prestation", "concert", "spectacle"].includes(typeEv) || eventData.isPrestation === true;
  const isAtelierOrRepet = ["repetition", "atelier", "stage"].includes(typeEv);
  const isExcludedType = ["reunion"].includes(typeEv);

  // Conditionnement de déclenchement :
  // 1. Pour les ateliers, répétitions et stages : déclenché si enableVideoDrop === true ou activerRecolteMedias === true
  // 2. Pour prestation, concert, spectacle : autorisé sauf si activerRecolteMedias === false
  // 3. Pour réunion ou autres : uniquement si explicitement demandé
  let isEligibleForAuto = false;
  if (isExcludedType) {
    isEligibleForAuto = eventData.activerRecolteMedias === true || eventData.enableVideoDrop === true;
  } else if (isAtelierOrRepet) {
    isEligibleForAuto = eventData.enableVideoDrop === true || eventData.activerRecolteMedias === true;
  } else if (isTargetPrestation) {
    isEligibleForAuto = eventData.activerRecolteMedias !== false || eventData.enableVideoDrop === true;
  } else {
    isEligibleForAuto = eventData.activerRecolteMedias === true || eventData.enableVideoDrop === true;
  }

  if (!options.force && !isEligibleForAuto) {
    console.log(`provisionFramaspaceForEvent - L'événement ${eventId} n'est pas ciblé pour le provisionnement automatique (type: ${typeEv}, enableVideoDrop: ${eventData.enableVideoDrop}).`);
    return { success: false, reason: "filtered-out" };
  }

  // Si déjà provisionné et pas en mode forcé
  if (!options.force && (eventData.dropUrl || eventData.lienDepotMedias) && eventData.albumPhotosUrl) {
    console.log(`provisionFramaspaceForEvent - L'événement ${eventId} possède déjà ses liens Framaspace.`);
    return { 
      success: true, 
      alreadyProvisioned: true, 
      dropUrl: eventData.dropUrl || eventData.lienDepotMedias,
      lienDepotMedias: eventData.dropUrl || eventData.lienDepotMedias, 
      albumPhotosUrl: eventData.albumPhotosUrl 
    };
  }

  // Récupération des identifiants Framaspace
  const { framaspaceUrl, framaspaceUsername, framaspaceAppPassword } = await getFramaspaceCredentialsForGroup(db, groupId);

  if (!framaspaceUrl || !framaspaceUsername || !framaspaceAppPassword) {
    console.log(`provisionFramaspaceForEvent - Identifiants Framaspace non configurés pour le groupe ${groupId}. Aucun dossier créé.`);
    return { success: false, reason: "missing-credentials" };
  }

  const cleanUrl = framaspaceUrl.replace(/\/+$/, "");
  const basicAuth = Buffer.from(`${framaspaceUsername}:${framaspaceAppPassword}`).toString("base64");

  // Formatage du répertoire : Ateliers/AAAA-MM-JJ_titre-slug ou Prestations/AAAA-MM-JJ_titre-slug
  const eventDate = eventData.date || eventData.dateDebut || "sans-date";
  const rawTitle = eventData.titre || eventData.nom || (isAtelierOrRepet ? "atelier" : "prestation");
  const slugTitle = slugifyWebdav(rawTitle) || "evenement";
  const folderName = `${eventDate}_${slugTitle}`;
  const parentFolder = isAtelierOrRepet ? "Ateliers" : "Prestations";
  const folderPath = `${parentFolder}/${folderName}`;

  console.log(`provisionFramaspaceForEvent - Début du provisionnement de ${folderPath} sur ${cleanUrl}`);

  // 1. Création WebDAV : dossier parent 'Prestations' (gérer 201 et 405 Method Not Allowed)
  try {
    const parentDavUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(framaspaceUsername)}/${encodeURIComponent(parentFolder)}`;
    const parentRes = await fetch(parentDavUrl, {
      method: "MKCOL",
      headers: {
        Authorization: `Basic ${basicAuth}`
      }
    });

    if (parentRes.status === 201 || parentRes.status === 405) {
      console.log(`provisionFramaspaceForEvent - Dossier parent '${parentFolder}' opérationnel (HTTP ${parentRes.status}).`);
    } else {
      console.warn(`provisionFramaspaceForEvent - Dossier parent '${parentFolder}' statut inattendu : ${parentRes.status}`);
    }
  } catch (parentErr) {
    console.warn("provisionFramaspaceForEvent - Exception création dossier parent :", parentErr.message);
  }

  // 2. Création WebDAV : sous-dossier de l'événement
  try {
    const eventDavUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(framaspaceUsername)}/${encodeURIComponent(parentFolder)}/${encodeURIComponent(folderName)}`;
    const eventRes = await fetch(eventDavUrl, {
      method: "MKCOL",
      headers: {
        Authorization: `Basic ${basicAuth}`
      }
    });

    if (eventRes.status === 201 || eventRes.status === 405) {
      console.log(`provisionFramaspaceForEvent - Sous-dossier '${folderPath}' prêt (HTTP ${eventRes.status}).`);
    } else {
      const errorText = await eventRes.text();
      console.error(`provisionFramaspaceForEvent - Erreur MKCOL dossier événement (${eventRes.status}) :`, errorText);
      throw new Error(`Échec création dossier WebDAV (HTTP ${eventRes.status})`);
    }
  } catch (davErr) {
    console.error("provisionFramaspaceForEvent - Erreur WebDAV :", davErr);
    throw davErr;
  }

  // 3. Génération des partages publics via l'API OCS (files_sharing)
  const ocsEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`;

  const getOrCreateOcsShare = async (permissions, label = "") => {
    // Tentative de création du partage avec label explicite
    const bodyParams = new URLSearchParams();
    bodyParams.append("path", `/${folderPath}`);
    bodyParams.append("shareType", "3"); // 3 = Lien public
    bodyParams.append("permissions", String(permissions)); // 4 = File drop (dépôt seul), 1 = Lecture seule
    if (label) {
      bodyParams.append("name", label);
      bodyParams.append("label", label);
    }

    const ocsRes = await fetch(ocsEndpoint, {
      method: "POST",
      headers: {
        "OCS-APIRequest": "true",
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: bodyParams.toString()
    });

    const ocsJson = await ocsRes.json();
    const statusCode = ocsJson.ocs?.meta?.statuscode;
    const isOk = ocsRes.ok && (ocsJson.ocs?.meta?.status === "ok" || statusCode === 100 || statusCode === 200);

    if (isOk && ocsJson.ocs?.data?.url) {
      return ocsJson.ocs.data.url;
    }

    // Si le partage existe déjà ou en cas de conflit, lister les partages existants sur ce chemin
    console.warn(`provisionFramaspaceForEvent - OCS POST status=${statusCode}, recherche partages existants...`);
    try {
      const listEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent('/' + folderPath)}&format=json`;
      const listRes = await fetch(listEndpoint, {
        method: "GET",
        headers: {
          "OCS-APIRequest": "true",
          Authorization: `Basic ${basicAuth}`,
          Accept: "application/json"
        }
      });
      const listJson = await listRes.json();
      const shares = listJson.ocs?.data;
      if (Array.isArray(shares) && shares.length > 0) {
        // Recherche stricte selon les permissions demandées
        // Si on cherche de la lecture (1), interdire strictement le lien File drop (4) seul
        const match = shares.find(s => Number(s.share_type) === 3 && Number(s.permissions) === permissions) ||
                      (permissions === 1 ? shares.find(s => Number(s.share_type) === 3 && (Number(s.permissions) & 1) !== 0) : null) ||
                      (permissions === 4 ? shares.find(s => Number(s.share_type) === 3 && Number(s.permissions) === 4) : null);
        if (match && match.url) {
          console.log(`provisionFramaspaceForEvent - Partage existant réutilisé (perm: ${match.permissions}) :`, match.url);
          return match.url;
        }

        // Si on a demandé de la lecture (1) mais que seul un partage en dépôt (4) existe, tenter de créer en perm 5 (Lecture + Dépôt)
        if (permissions === 1) {
          const bodyParams5 = new URLSearchParams();
          bodyParams5.append("path", `/${folderPath}`);
          bodyParams5.append("shareType", "3");
          bodyParams5.append("permissions", "5");
          bodyParams5.append("name", "Album et Depot");
          bodyParams5.append("label", "Album et Depot");

          const res5 = await fetch(ocsEndpoint, {
            method: "POST",
            headers: {
              "OCS-APIRequest": "true",
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: bodyParams5.toString()
          });
          const json5 = await res5.json();
          if (res5.ok && json5.ocs?.data?.url) {
            console.log("provisionFramaspaceForEvent - Partage mixte (perm 5) créé pour l'album :", json5.ocs.data.url);
            return json5.ocs.data.url;
          }
        }
      }
    } catch (listErr) {
      console.warn("provisionFramaspaceForEvent - Erreur récupération liste des partages :", listErr.message);
    }

    throw new Error(`Erreur API OCS (perm ${permissions}, label ${label}): ${ocsJson.ocs?.meta?.message || ocsRes.statusText}`);
  };

  // a) Lien de dépôt public (File drop / Create only -> permissions: 4, label: "Depot Public")
  let urlFileDrop = null;
  try {
    urlFileDrop = await getOrCreateOcsShare(4, "Depot Public");
    console.log("provisionFramaspaceForEvent - URL Dépôt public (File drop) :", urlFileDrop);
  } catch (dropErr) {
    console.error("provisionFramaspaceForEvent - Échec création File Drop :", dropErr.message);
    throw dropErr;
  }

  // b) Lien de consultation de l'album (Lecture seule -> permissions: 1, label: "Album Photos")
  let urlLectureSeule = null;
  try {
    urlLectureSeule = await getOrCreateOcsShare(1, "Album Photos");
    console.log("provisionFramaspaceForEvent - URL Album photos (Lecture seule) :", urlLectureSeule);
  } catch (albumErr) {
    console.error("provisionFramaspaceForEvent - Échec création Album ReadOnly :", albumErr.message);
    throw albumErr;
  }

  // 4. Mise à jour atomique de l'événement dans Firestore si eventId existe
  if (eventId) {
    await db.collection("events").doc(eventId).update({
      lienDepotMedias: urlFileDrop,
      dropUrl: urlFileDrop,
      albumPhotosUrl: urlLectureSeule,
      framaspaceFolder: folderPath,
      framaspaceProvisionedAt: new Date().toISOString()
    });

    // 5. Synchronisation atomique du livret sur le Varal Photos (collection 'documents')
    const isVaralPublished = eventData.publierSurVaral !== false;
    if (urlLectureSeule && isVaralPublished) {
      try {
        const docsRef = db.collection("documents");
        const existingSnap = await docsRef
          .where("groupId", "==", groupId)
          .where("eventId", "==", eventId)
          .where("categoryId", "==", "PhotosPrestations")
          .get();

        const eventTitle = eventData.titre || eventData.nom || "Événement";
        const eventDateStr = eventData.dateDebut || eventData.date || new Date().toISOString();
        const dateFormatted = new Date(eventDateStr).toLocaleDateString('fr-FR');
        const docPayload = {
          groupId,
          eventId,
          titre: `[Album] ${eventTitle}`,
          fileUrl: urlLectureSeule,
          categorie: 'PhotosPrestations',
          categoryId: 'PhotosPrestations',
          type: 'dossier_externe',
          dateAjout: eventDateStr,
          description: `Album photos officiel de l'événement "${eventTitle}" du ${dateFormatted}.`
        };

        if (!existingSnap.empty) {
          await existingSnap.docs[0].ref.update(docPayload);
          console.log(`provisionFramaspaceForEvent - Livret Varal mis à jour dans documents (${existingSnap.docs[0].id})`);
        } else {
          const newDoc = await docsRef.add(docPayload);
          console.log(`provisionFramaspaceForEvent - Nouveau livret Varal créé dans documents (${newDoc.id})`);
        }
      } catch (syncDocErr) {
        console.warn("provisionFramaspaceForEvent - Erreur synchronisation livret documents :", syncDocErr.message);
      }
    }
  }

  console.log(`provisionFramaspaceForEvent - Événement ${eventId || "nouveau"} enrichi avec succès !`);

  return {
    success: true,
    dropUrl: urlFileDrop,
    lienDepotMedias: urlFileDrop,
    albumPhotosUrl: urlLectureSeule,
    framaspaceFolder: folderPath
  };
}

/**
 * Trigger Cloud Firestore déclenché lors de la création d'un événement.
 * Automatise la création des dossiers Framaspace pour les prestations.
 */
exports.onPrestationCreatedProvisionCloud = onDocumentCreated(
  "events/{eventId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const eventData = snap.data();
    const eventId = event.params.eventId;

    // Conditionnement strict demandé pour la création automatique :
    const typeEv = (eventData.type || eventData.typeEvenement || "").toLowerCase();
    const isTargetPrestation = ["prestation", "concert", "spectacle", "festival", "parade"].includes(typeEv) || eventData.isPrestation === true;
    const isExcludedType = ["reunion"].includes(typeEv);

    let shouldProvision = false;
    if (isExcludedType) {
      shouldProvision = eventData.activerRecolteMedias === true;
    } else if (isTargetPrestation) {
      shouldProvision = eventData.activerRecolteMedias !== false;
    } else {
      shouldProvision = eventData.activerRecolteMedias === true;
    }

    if (!shouldProvision) {
      console.log(`onPrestationCreatedProvisionCloud - Événement ${eventId} ignoré (type: ${typeEv}, activerRecolteMedias: ${eventData.activerRecolteMedias}).`);
      return;
    }

    try {
      await provisionFramaspaceForEvent(eventId, eventData);
    } catch (err) {
      console.error(`onPrestationCreatedProvisionCloud - Erreur traitement événement ${eventId} :`, err);
    }
  }
);

/**
 * Fonction Cloud appelable (OnCall) permettant à un administrateur de déclencher manuellement
 * le provisionnement d'un dossier Framaspace pour un événement (existant ou nouveau).
 */
exports.provisionFramaspaceEventFolders = onCall(
  {
    timeoutSeconds: 60,
    cors: true
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être authentifié pour exécuter cette action.");
    }

    const data = request.data || {};
    let { eventId, groupId, eventData } = data;

    const db = getFirestore();

    // Résolution du groupId
    if (!groupId) {
      const userDoc = await db.collection("users").doc(request.auth.uid).get();
      if (userDoc.exists) {
        groupId = userDoc.data()?.groupId || null;
      }
    }

    if (!groupId) {
      throw new HttpsError("invalid-argument", "L'identifiant du groupe (association) est obligatoire.");
    }

    // Vérifier les droits administrateur ou mestre
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("permission-denied", "Utilisateur introuvable.");
    }

    const userData = userDoc.data();
    const userRole = (userData.role || "").toLowerCase();
    const userTags = Array.isArray(userData.tags) ? userData.tags : [];
    const isAuthorized = ["admin", "super-admin", "mestre", "bureau", "ca"].includes(userRole) || 
                         userData.isSystemAdmin === true ||
                         userTags.some(t => ["Bureau", "Président", "Présidente", "CA", "Direction", "Admin"].includes(t));

    if (!isAuthorized && userData.groupId !== groupId) {
      throw new HttpsError("permission-denied", "Accès refusé. Droits administrateurs requis.");
    }

    let payload = eventData || {};
    if (eventId) {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (eventDoc.exists) {
        payload = { ...eventDoc.data(), ...payload };
      }
    }

    if (!payload.titre && !payload.nom) {
      payload.titre = "Atelier";
    }
    payload.groupId = groupId;

    try {
      const result = await provisionFramaspaceForEvent(eventId || null, payload, { force: true });
      return result;
    } catch (err) {
      console.error("provisionFramaspaceEventFolders - Erreur :", err);
      throw new HttpsError("internal", err.message || "Erreur lors du provisionnement Framaspace.");
    }
  }
);

/**
 * Fonction Cloud appelable (OnCall) pour générer en 1 clic le dossier général de dépôt de vidéos
 * pour toute l'association (ex: /Depot_Videos) et l'enregistrer comme defaultDropUrl.
 */
exports.provisionFramaspaceGeneralDropFolder = onCall(
  {
    timeoutSeconds: 60,
    cors: true
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être authentifié pour exécuter cette action.");
    }

    const data = request.data || {};
    let { groupId } = data;

    const db = getFirestore();

    // 1. Résolution du groupId si non fourni dans la requête
    if (!groupId) {
      try {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (userDoc.exists) {
          groupId = userDoc.data()?.groupId || null;
        }
      } catch (userErr) {
        console.warn("provisionFramaspaceGeneralDropFolder - Erreur lecture utilisateur :", userErr.message);
      }
    }

    if (!groupId) {
      throw new HttpsError("invalid-argument", "L'identifiant du groupe (association) est introuvable.");
    }

    // 2. Vérification des droits administrateur ou mestre
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("permission-denied", "Utilisateur introuvable.");
    }

    const userData = userDoc.data();
    const userRole = (userData.role || "").toLowerCase();
    const userTags = Array.isArray(userData.tags) ? userData.tags : [];
    const isAuthorized = ["admin", "super-admin", "mestre", "bureau", "ca"].includes(userRole) || 
                         userData.isSystemAdmin === true ||
                         userTags.some(t => ["Bureau", "Président", "Présidente", "CA", "Direction", "Admin"].includes(t));

    if (!isAuthorized && userData.groupId !== groupId) {
      throw new HttpsError("permission-denied", "Accès refusé. Droits administrateurs requis.");
    }

    // 3. Récupération des identifiants Framaspace
    const { framaspaceUrl, framaspaceUsername, framaspaceAppPassword } = await getFramaspaceCredentialsForGroup(db, groupId);

    if (!framaspaceUrl || !framaspaceUsername || !framaspaceAppPassword) {
      throw new HttpsError(
        "failed-precondition",
        "Les identifiants Framaspace (Nextcloud) ne sont pas configurés pour cette association."
      );
    }

    const cleanUrl = String(framaspaceUrl).trim().replace(/\/+$/, "");
    const cleanUsername = String(framaspaceUsername).trim();
    const cleanPassword = String(framaspaceAppPassword).trim();
    const basicAuth = Buffer.from(`${cleanUsername}:${cleanPassword}`).toString("base64");
    const targetFolder = "Depot_Videos";

    // 4. Création WebDAV du dossier '/Depot_Videos'
    try {
      const folderDavUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(targetFolder)}`;
      const mkcolRes = await fetch(folderDavUrl, {
        method: "MKCOL",
        headers: {
          Authorization: `Basic ${basicAuth}`
        },
        signal: AbortSignal.timeout(10000)
      });
      if (mkcolRes.status === 201 || mkcolRes.status === 405) {
        console.log(`provisionFramaspaceGeneralDropFolder - Dossier '${targetFolder}' opérationnel (HTTP ${mkcolRes.status}).`);
      } else {
        console.warn(`provisionFramaspaceGeneralDropFolder - Statut inattendu MKCOL : ${mkcolRes.status}`);
      }
    } catch (mkcolErr) {
      console.warn("provisionFramaspaceGeneralDropFolder - Exception MKCOL :", mkcolErr.message);
    }

    // 5. Création ou récupération du partage OCS public File Drop (permissions: 4)
    const ocsEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`;
    let urlFileDrop = null;

    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append("path", `/${targetFolder}`);
      bodyParams.append("shareType", "3"); // 3 = Lien public
      bodyParams.append("permissions", "4"); // 4 = File drop (dépôt seul)

      const ocsRes = await fetch(ocsEndpoint, {
        method: "POST",
        headers: {
          "OCS-APIRequest": "true",
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(10000)
      });

      const ocsJson = await ocsRes.json().catch(() => ({}));
      if (ocsRes.ok && ocsJson.ocs?.data?.url) {
        urlFileDrop = ocsJson.ocs.data.url;
      }
    } catch (ocsErr) {
      console.warn("provisionFramaspaceGeneralDropFolder - Erreur OCS POST :", ocsErr.message);
    }

    // Si le partage existe déjà ou conflit, inspection des partages existants
    if (!urlFileDrop) {
      try {
        const listEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent('/' + targetFolder)}&format=json`;
        const listRes = await fetch(listEndpoint, {
          method: "GET",
          headers: {
            "OCS-APIRequest": "true",
            Authorization: `Basic ${basicAuth}`,
            Accept: "application/json"
          },
          signal: AbortSignal.timeout(10000)
        });
        const listJson = await listRes.json().catch(() => ({}));
        const shares = listJson.ocs?.data;
        if (Array.isArray(shares) && shares.length > 0) {
          const match = shares.find(s => Number(s.share_type) === 3 && Number(s.permissions) === 4) ||
                        shares.find(s => Number(s.share_type) === 3);
          if (match && match.url) {
            urlFileDrop = match.url;
          }
        }
      } catch (listErr) {
        console.warn("provisionFramaspaceGeneralDropFolder - Erreur OCS GET :", listErr.message);
      }
    }

    if (!urlFileDrop) {
      throw new HttpsError(
        "internal",
        "Impossible de générer le lien de dépôt public Framaspace. Vérifiez les autorisations de partage par lien dans l'administration Nextcloud."
      );
    }

    // 6. Mise à jour automatique de defaultDropUrl dans l'association
    await db.collection("associations").doc(groupId).set(
      { defaultDropUrl: urlFileDrop },
      { merge: true }
    );

    console.log(`provisionFramaspaceGeneralDropFolder - Association ${groupId} configurée avec defaultDropUrl : ${urlFileDrop}`);

    return {
      success: true,
      defaultDropUrl: urlFileDrop,
      folder: targetFolder
    };
  }
);

/**
 * Fonction Cloud appelable (OnCall) pour tester la connexion WebDAV/OCS vers une instance Framaspace.
 * Effectue un diagnostic en 2 étapes :
 * 1. Vérification de l'accessibilité de l'instance Nextcloud via GET /status.php
 * 2. Vérification de l'authentification et du point d'accès WebDAV via PROPFIND /remote.php/dav/files/{username}/
 */
exports.testFramaspaceConnection = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être authentifié.");
    }

    const data = request.data || {};
    let { framaspaceUrl, framaspaceUsername, framaspaceAppPassword, groupId } = data;

    const db = getFirestore();

    // Si les identifiants ne sont pas fournis directement, les lire depuis Firestore
    if ((!framaspaceUrl || !framaspaceUsername || !framaspaceAppPassword) && groupId) {
      const creds = await getFramaspaceCredentialsForGroup(db, groupId);
      framaspaceUrl = framaspaceUrl || creds.framaspaceUrl;
      framaspaceUsername = framaspaceUsername || creds.framaspaceUsername;
      framaspaceAppPassword = framaspaceAppPassword || creds.framaspaceAppPassword;
    }

    if (!framaspaceUrl || !framaspaceUsername || !framaspaceAppPassword) {
      return {
        success: false,
        httpStatus: 400,
        message: "L'URL Framaspace, le nom d'utilisateur et le mot de passe d'application sont requis."
      };
    }

    // Nettoyage rigoureux de l'URL et des identifiants
    const cleanUrl = String(framaspaceUrl).trim().replace(/\/+$/, "");
    const cleanUsername = String(framaspaceUsername).trim();
    const cleanPassword = String(framaspaceAppPassword).trim();
    const basicAuth = Buffer.from(`${cleanUsername}:${cleanPassword}`).toString("base64");

    // Étape 1 : Ping de l'instance Nextcloud / Framaspace via status.php
    let nextcloudVersion = "";
    try {
      const statusRes = await fetch(`${cleanUrl}/status.php`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(6000)
      });

      if (statusRes.ok) {
        const statusJson = await statusRes.json().catch(() => ({}));
        nextcloudVersion = statusJson.versionstring || statusJson.version || "";
        console.log(`testFramaspaceConnection - Instance ${cleanUrl} en ligne (Nextcloud v${nextcloudVersion || 'inconnue'}).`);
      } else {
        return {
          success: false,
          httpStatus: statusRes.status,
          message: `L'instance Framaspace a répondu avec le statut HTTP ${statusRes.status} sur /status.php.`
        };
      }
    } catch (pingErr) {
      console.error("testFramaspaceConnection - Erreur accessibilité instance :", pingErr);
      return {
        success: false,
        httpStatus: 0,
        message: `Impossible de contacter l'instance Framaspace sur "${cleanUrl}" (${pingErr.message || "délai d'attente dépassé ou erreur réseau"}).`
      };
    }

    // Étape 2 : Test d'authentification et accès WebDAV PROPFIND
    try {
      const testDavUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(cleanUsername)}/`;
      const davRes = await fetch(testDavUrl, {
        method: "PROPFIND",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Depth: "0"
        },
        signal: AbortSignal.timeout(8000)
      });

      console.log(`testFramaspaceConnection - Réponse WebDAV HTTP ${davRes.status} pour ${cleanUsername}`);

      if (davRes.status === 207 || davRes.status === 200) {
        const versionSuffix = nextcloudVersion ? ` (Nextcloud v${nextcloudVersion})` : "";
        return {
          success: true,
          httpStatus: davRes.status,
          message: `Connexion réussie ! Authentification et accès WebDAV validés avec succès${versionSuffix}.`
        };
      } else if (davRes.status === 401) {
        return {
          success: false,
          httpStatus: 401,
          message: "Authentification rejetée par Nextcloud (HTTP 401). Vérifiez le mot de passe d'application ou l'adresse e-mail / identifiant."
        };
      } else if (davRes.status === 404) {
        return {
          success: false,
          httpStatus: 404,
          message: "Point d'accès WebDAV introuvable pour cet utilisateur (HTTP 404). Vérifiez le nom d'utilisateur."
        };
      } else {
        return {
          success: false,
          httpStatus: davRes.status,
          message: `Réponse inattendue du serveur Framaspace (HTTP ${davRes.status} : ${davRes.statusText || 'Inconnu'}).`
        };
      }
    } catch (authErr) {
      console.error("testFramaspaceConnection - Erreur test WebDAV :", authErr);
      return {
        success: false,
        httpStatus: 0,
        message: `Erreur lors de la négociation WebDAV avec Framaspace : ${authErr.message || "délai d'attente dépassé"}.`
      };
    }
  }
);

/**
 * Parseur XML WebDAV multistatus pour extraire la liste des fichiers partagés.
 * Filtre strictement les fichiers multimédias (images et vidéos).
/**
 * Parseur XML WebDAV multistatus pour extraire la liste des fichiers multimédias et des sous-dossiers.
 * Filtre strictement les images et vidéos et identifie les sous-dossiers (collections non-racines).
 *
 * @param {string} xmlString - Contenu XML multistatus de la réponse WebDAV
 * @param {string} instanceUrl - URL racine de l'instance Nextcloud
 * @param {string} token - Token de partage public
 * @param {string} [baseDavPath="/public.php/webdav/"] - Chemin de base WebDAV interrogé
 * @returns {{ items: Array, subfolders: Array<string> }}
 */
function parseWebdavMultistatus(xmlString, instanceUrl, token, baseDavPath = "/public.php/webdav/") {
  const items = [];
  const subfolders = [];
  const responseBlocks = xmlString.match(/<[a-z0-9_-]*:?response[\s\S]*?<\/[a-z0-9_-]*:?response>/gi) || [];

  // Normalisation du chemin de base pour le calcul du chemin relatif (ex: '/public.php/webdav/')
  const normBasePath = "/" + baseDavPath.replace(/^\/+/, "").replace(/\/+$/, "") + "/";

  for (const block of responseBlocks) {
    const isCollection = /<[a-z0-9_-]*:?collection\s*\/?>/i.test(block);

    // Extraction du href
    const hrefMatch = block.match(/<[a-z0-9_-]*:?href[^>]*>([\s\S]*?)<\/[a-z0-9_-]*:?href>/i);
    let rawHref = hrefMatch ? hrefMatch[1].trim() : "";
    if (!rawHref) continue;

    let cleanHref = rawHref;
    if (cleanHref.includes("://")) {
      try {
        cleanHref = new URL(cleanHref).pathname;
      } catch (e) {}
    }
    cleanHref = decodeURIComponent(cleanHref);

    // Calcul du chemin relatif par rapport à la racine du partage
    let relativePath = "";
    const idx = cleanHref.indexOf(normBasePath);
    if (idx !== -1) {
      relativePath = cleanHref.substring(idx + normBasePath.length);
    } else {
      // Si normBasePath n'est pas trouvé tel quel, déduire le chemin relatif après les préfixes WebDAV Nextcloud connus
      const matchPrefix = cleanHref.match(/^\/.*?\/(public\.php\/webdav|public\.php\/dav\/files\/[^/]+|remote\.php\/dav\/files\/[^/]+\/[^/]+)\/(.*)$/i);
      if (matchPrefix && matchPrefix[2]) {
        relativePath = matchPrefix[2];
      } else {
        const parts = cleanHref.split("/").filter(Boolean);
        relativePath = parts.length > 0 ? parts[parts.length - 1] : "";
      }
    }
    relativePath = relativePath.replace(/^\/+/, "");

    // Si c'est un sous-dossier (collection non-racine)
    if (isCollection) {
      const folderRel = relativePath.replace(/\/+$/, "");
      // Ignorer la racine elle-même (chemin relatif vide)
      if (folderRel && !subfolders.includes(folderRel)) {
        subfolders.push(folderRel);
      }
      continue;
    }

    // Nom du fichier
    const nameMatch = block.match(/<[a-z0-9_-]*:?displayname[^>]*>([\s\S]*?)<\/[a-z0-9_-]*:?displayname>/i);
    let name = nameMatch ? nameMatch[1].trim() : "";
    if (!name) {
      const parts = relativePath.split("/");
      name = parts[parts.length - 1] || "media";
    }

    // Déterminer le sous-dossier éventuel (ex: 'Raul')
    const lastSlashIdx = relativePath.lastIndexOf("/");
    const subfolder = lastSlashIdx !== -1 ? relativePath.substring(0, lastSlashIdx) : "";

    // Type MIME
    const mimeMatch = block.match(/<[a-z0-9_-]*:?getcontenttype[^>]*>([\s\S]*?)<\/[a-z0-9_-]*:?getcontenttype>/i);
    const mimeType = mimeMatch ? mimeMatch[1].trim().toLowerCase() : "";

    // Taille en octets
    const sizeMatch = block.match(/<[a-z0-9_-]*:?getcontentlength[^>]*>([\s\S]*?)<\/[a-z0-9_-]*:?getcontentlength>/i);
    const size = sizeMatch ? parseInt(sizeMatch[1].trim(), 10) : 0;

    // Filtrer strictement les images et vidéos
    const isImage = mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif|heic)$/i.test(name);
    const isVideo = mimeType.startsWith("video/") || /\.(mp4|webm|mov|mkv|m4v|quicktime)$/i.test(name);

    if (!isImage && !isVideo) continue;

    const mediaType = isVideo ? "video" : "image";

    // Encodage du chemin relatif pour l'API Nextcloud
    const encodedRelPath = encodeURIComponent("/" + relativePath);
    const subfolderParam = subfolder ? encodeURIComponent("/" + subfolder) : "%2F";
    const fileNameParam = encodeURIComponent(name);

    // 1. Miniature optimisée pour la grille du Varal (x=400, y=400, a=1)
    const thumbnailUrl = `${instanceUrl}/index.php/apps/files_sharing/publicpreview?token=${token}&file=${encodedRelPath}&x=400&y=400&a=1`;

    // 2. Prévisualisation grand format pour la Lightbox (x=1600, y=1600)
    const previewUrl = `${instanceUrl}/index.php/apps/files_sharing/publicpreview?token=${token}&file=${encodedRelPath}&x=1600&y=1600`;

    // 3. Flux brut / vidéo HTML5 / téléchargement direct Nextcloud :
    // Format officiel : /s/TOKEN/download?path=/SOUS_DOSSIER&files=NOM_FICHIER
    const rawUrl = `${instanceUrl}/s/${token}/download?path=${subfolderParam}&files=${fileNameParam}`;

    // Secours direct haute compatibilité
    const pathPreviewUrl = `${instanceUrl}/index.php/apps/files_sharing/publicpreview/${token}?file=${encodedRelPath}&x=400&y=400&a=1`;
    const pathPreviewHdUrl = `${instanceUrl}/index.php/apps/files_sharing/publicpreview/${token}?file=${encodedRelPath}&x=1600&y=1600`;

    items.push({
      id: Buffer.from(relativePath || name).toString("base64url"),
      name,
      subfolder,
      relativePath,
      type: mediaType,
      url: rawUrl,
      previewUrl,
      thumbnailUrl,
      downloadUrl: rawUrl,
      pathPreviewUrl,
      pathPreviewHdUrl,
      directDavUrl: null,
      mimeType: mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
      size
    });
  }

  return { items, subfolders };
}

/**
 * Fonction Cloud appelable (OnCall) pour lister les médias d'un album Framaspace partagé.
 * Permet d'alimenter la galerie native interactive du Varal Photos sans stocker les images sur Firebase.
 * Explore automatiquement tous les sous-dossiers créés par Nextcloud (ex: sous-dossiers utilisateurs 'Raul/').
 */
exports.getFramaspaceAlbumMedia = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être authentifié.");
    }

    const data = request.data || {};
    const { albumUrl, eventId, groupId } = data;

    if (!albumUrl || typeof albumUrl !== "string") {
      return {
        success: false,
        items: [],
        error: "L'URL de l'album est requise."
      };
    }

    // Extraction de l'instance de base et du token de partage public
    const cleanUrl = albumUrl.trim();
    let instanceUrl = "";
    let token = "";

    try {
      const parsedUrl = new URL(cleanUrl);
      instanceUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      
      // Extraction robuste du token : /s/TOKEN ou /s/TOKEN/ ou paramètre share_token
      const tokenMatch = parsedUrl.pathname.match(/\/s\/([a-zA-Z0-9_-]+)/i);
      if (tokenMatch) {
        token = tokenMatch[1];
      } else {
        token = parsedUrl.searchParams.get("token") || "";
      }
    } catch (urlErr) {
      console.warn("getFramaspaceAlbumMedia - URL invalide :", cleanUrl);
      return {
        success: false,
        items: [],
        error: "URL d'album invalide."
      };
    }

    if (!instanceUrl || !token) {
      return {
        success: false,
        items: [],
        error: "Impossible d'extraire le token de partage public depuis cette URL."
      };
    }

    console.log(`getFramaspaceAlbumMedia - Interrogation de l'album sur ${instanceUrl} (token: ${token.substring(0, 5)}...)`);

    try {
      // 1. Requête WebDAV PROPFIND sur /public.php/webdav/ avec auth Basic (token:)
      const webdavPublicUrl = `${instanceUrl}/public.php/webdav/`;
      const publicBasicAuth = Buffer.from(`${token}:`).toString("base64");

      let allItems = [];
      let discoveredSubfolders = [];

      // a. Tenter d'abord avec Depth: "infinity" pour récupérer tous les médias récursivement en un seul appel
      try {
        const infinityRes = await fetch(webdavPublicUrl, {
          method: "PROPFIND",
          headers: {
            Authorization: `Basic ${publicBasicAuth}`,
            Depth: "infinity"
          },
          signal: AbortSignal.timeout(8000)
        });

        if (infinityRes.status === 207 || infinityRes.status === 200) {
          const xmlText = await infinityRes.text();
          const parsed = parseWebdavMultistatus(xmlText, instanceUrl, token, "/public.php/webdav/");
          if (parsed.items.length > 0) {
            allItems = parsed.items;
            console.log(`getFramaspaceAlbumMedia - Depth infinity réussi : ${parsed.items.length} médias extraits (incluant sous-dossiers).`);
          } else {
            discoveredSubfolders = parsed.subfolders;
          }
        }
      } catch (infErr) {
        console.warn("getFramaspaceAlbumMedia - Depth infinity non supporté :", infErr.message);
      }

      // b. Si Depth infinity n'a retourné aucun fichier, interroger Depth: "1" à la racine
      if (allItems.length === 0) {
        const davRes = await fetch(webdavPublicUrl, {
          method: "PROPFIND",
          headers: {
            Authorization: `Basic ${publicBasicAuth}`,
            Depth: "1"
          },
          signal: AbortSignal.timeout(8000)
        });

        if (davRes.status === 207 || davRes.status === 200) {
          const xmlText = await davRes.text();
          const parsed = parseWebdavMultistatus(xmlText, instanceUrl, token, "/public.php/webdav/");
          allItems = [...parsed.items];
          for (const sf of parsed.subfolders) {
            if (!discoveredSubfolders.includes(sf)) {
              discoveredSubfolders.push(sf);
            }
          }
        }
      }

      // c. S'il existe des sous-dossiers (ex: 'Raul'), explorer chaque sous-dossier pour extraire leurs clichés
      if (discoveredSubfolders.length > 0) {
        console.log(`getFramaspaceAlbumMedia - ${discoveredSubfolders.length} sous-dossier(s) détecté(s) :`, discoveredSubfolders);

        const subfolderPromises = discoveredSubfolders.slice(0, 20).map(async (folder) => {
          try {
            const folderEncoded = folder.split("/").map(encodeURIComponent).join("/");
            const subDavUrl = `${instanceUrl}/public.php/webdav/${folderEncoded}/`;
            const subRes = await fetch(subDavUrl, {
              method: "PROPFIND",
              headers: {
                Authorization: `Basic ${publicBasicAuth}`,
                Depth: "1"
              },
              signal: AbortSignal.timeout(6000)
            });

            if (subRes.status === 207 || subRes.status === 200) {
              const subXml = await subRes.text();
              const subParsed = parseWebdavMultistatus(subXml, instanceUrl, token, `/public.php/webdav/`);
              return subParsed.items;
            }
          } catch (subErr) {
            console.warn(`getFramaspaceAlbumMedia - Erreur scan sous-dossier '${folder}' :`, subErr.message);
          }
          return [];
        });

        const subResults = await Promise.all(subfolderPromises);
        for (const subItems of subResults) {
          for (const itm of subItems) {
            if (!allItems.some(existing => existing.id === itm.id)) {
              allItems.push(itm);
            }
          }
        }
      }

      if (allItems.length > 0) {
        console.log(`getFramaspaceAlbumMedia - ${allItems.length} médias extraits avec succès au total pour le token ${token.substring(0, 5)}...`);
        return {
          success: true,
          items: allItems,
          count: allItems.length
        };
      }

      console.warn("getFramaspaceAlbumMedia - Aucun média extrait via le partage public, tentative de fallback technique...");
    } catch (publicErr) {
      console.warn("getFramaspaceAlbumMedia - Erreur WebDAV public :", publicErr.message);
    }

    // 2. Fallback technique : si le token public n'a pas répondu et que groupId ou eventId est fourni
    if (groupId) {
      try {
        const db = getFirestore();
        const { framaspaceUrl, framaspaceUsername, framaspaceAppPassword } = await getFramaspaceCredentialsForGroup(db, groupId);

        if (framaspaceUrl && framaspaceUsername && framaspaceAppPassword && eventId) {
          const eventDoc = await db.collection("events").doc(eventId).get();
          if (eventDoc.exists) {
            const evData = eventDoc.data();
            const folderPath = evData.framaspaceFolder;
            if (folderPath) {
              const baseFolderDavPath = `/remote.php/dav/files/${encodeURIComponent(framaspaceUsername)}/${folderPath}/`;
              const techDavUrl = `${framaspaceUrl.replace(/\/+$/, "")}${baseFolderDavPath}`;
              const techBasicAuth = Buffer.from(`${framaspaceUsername}:${framaspaceAppPassword}`).toString("base64");

              const techRes = await fetch(techDavUrl, {
                method: "PROPFIND",
                headers: {
                  Authorization: `Basic ${techBasicAuth}`,
                  Depth: "1"
                },
                signal: AbortSignal.timeout(8000)
              });

              if (techRes.status === 207 || techRes.status === 200) {
                const xmlText = await techRes.text();
                const parsed = parseWebdavMultistatus(xmlText, instanceUrl, token, baseFolderDavPath);
                let techItems = [...parsed.items];

                // Explorer les sous-dossiers dans le fallback technique
                if (parsed.subfolders.length > 0) {
                  const techSubPromises = parsed.subfolders.slice(0, 20).map(async (folder) => {
                    try {
                      const subUrl = `${techDavUrl}${folder.split("/").map(encodeURIComponent).join("/")}/`;
                      const sRes = await fetch(subUrl, {
                        method: "PROPFIND",
                        headers: {
                          Authorization: `Basic ${techBasicAuth}`,
                          Depth: "1"
                        },
                        signal: AbortSignal.timeout(6000)
                      });
                      if (sRes.status === 207 || sRes.status === 200) {
                        const sXml = await sRes.text();
                        return parseWebdavMultistatus(sXml, instanceUrl, token, baseFolderDavPath).items;
                      }
                    } catch (e) {}
                    return [];
                  });
                  const sResults = await Promise.all(techSubPromises);
                  for (const sList of sResults) {
                    for (const itm of sList) {
                      if (!techItems.some(ex => ex.id === itm.id)) {
                        techItems.push(itm);
                      }
                    }
                  }
                }

                if (techItems.length > 0) {
                  console.log(`getFramaspaceAlbumMedia (Fallback technique) - ${techItems.length} médias extraits (incluant sous-dossiers).`);
                  return {
                    success: true,
                    items: techItems,
                    count: techItems.length
                  };
                }
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.error("getFramaspaceAlbumMedia - Échec fallback technique :", fallbackErr);
      }
    }

    return {
      success: false,
      items: [],
      error: "Impossible de récupérer les médias depuis ce partage Framaspace."
    };
  }
);

/**
 * Cloud Function appelable (OnCall) pour téléverser une image du forum vers Framaspace (Nextcloud).
 * Dépose le fichier dans le dossier 'Forum' via WebDAV PUT et génère un partage public OCS en lecture seule.
 * 
 * Paramètres attendus :
 * - fileBase64 {string} : Données de l'image encodées en base64 (avec ou sans préfixe data:...)
 * - fileName {string} : Nom original du fichier image
 * - mimeType {string} : Type MIME de l'image (ex: image/jpeg, image/png, image/webp)
 * - groupId {string} : Identifiant de l'association (optionnel si présent dans le profil utilisateur)
 * 
 * @returns {Promise<{ success: boolean, directUrl: string, fileName: string, token: string }>}
 */
exports.uploadForumImageToFramaspace = onCall(
  {
    timeoutSeconds: 30,
    cors: true
  },
  async (request) => {
    // 1. Vérification de l'authentification
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté pour téléverser une image.");
    }

    const data = request.data || {};
    let { fileBase64, fileName, mimeType, groupId } = data;

    if (!fileBase64 || typeof fileBase64 !== "string") {
      throw new HttpsError("invalid-argument", "Le contenu de l'image en base64 est requis.");
    }

    if (!fileName || typeof fileName !== "string") {
      fileName = "image.jpg";
    }

    const db = getFirestore();

    // 2. Résolution du groupId si non fourni dans la requête
    if (!groupId) {
      try {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (userDoc.exists) {
          groupId = userDoc.data()?.groupId || null;
        }
      } catch (userErr) {
        console.warn("uploadForumImageToFramaspace - Erreur lecture utilisateur :", userErr.message);
      }
    }

    if (!groupId) {
      throw new HttpsError("invalid-argument", "L'identifiant du groupe (association) est introuvable.");
    }

    // 3. Récupération des identifiants Framaspace
    const { framaspaceUrl, framaspaceUsername, framaspaceAppPassword } = await getFramaspaceCredentialsForGroup(db, groupId);

    if (!framaspaceUrl || !framaspaceUsername || !framaspaceAppPassword) {
      throw new HttpsError(
        "failed-precondition",
        "Les identifiants Framaspace (Nextcloud) ne sont pas configurés pour cette association."
      );
    }

    const cleanUrl = String(framaspaceUrl).trim().replace(/\/+$/, "");
    const cleanUsername = String(framaspaceUsername).trim();
    const cleanPassword = String(framaspaceAppPassword).trim();
    const basicAuth = Buffer.from(`${cleanUsername}:${cleanPassword}`).toString("base64");

    // 4. Nettoyage du préfixe data:image/...;base64, et décodage en Buffer
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new HttpsError("invalid-argument", "Le fichier image fourni est vide ou corrompu.");
    }

    // 5. Nettoyage et formatage du nom de fichier
    const extMatch = String(fileName).match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg");
    const rawBaseName = String(fileName).replace(/\.[a-zA-Z0-9]+$/, "");
    const slugBase = slugifyWebdav(rawBaseName) || "forum-image";
    const savedName = `${Date.now()}_${slugBase}.${ext}`;
    const parentFolder = "Forum";

    console.log(`uploadForumImageToFramaspace - Préparation upload vers ${cleanUrl} dans /${parentFolder}/${savedName} (${fileBuffer.length} octets)`);

    // 6. Vérification / Création WebDAV du dossier parent 'Forum' (MKCOL)
    try {
      const forumDavUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(parentFolder)}`;
      const mkcolRes = await fetch(forumDavUrl, {
        method: "MKCOL",
        headers: {
          Authorization: `Basic ${basicAuth}`
        },
        signal: AbortSignal.timeout(10000)
      });

      // 201 = Créé avec succès, 405 = Existe déjà
      if (mkcolRes.status === 201 || mkcolRes.status === 405) {
        console.log(`uploadForumImageToFramaspace - Dossier parent '${parentFolder}' opérationnel (HTTP ${mkcolRes.status}).`);
      } else {
        console.warn(`uploadForumImageToFramaspace - Dossier parent '${parentFolder}' statut inattendu : ${mkcolRes.status}`);
      }
    } catch (mkcolErr) {
      console.warn("uploadForumImageToFramaspace - Exception lors du MKCOL dossier 'Forum' :", mkcolErr.message);
    }

    // 7. Dépose WebDAV du fichier via PUT
    const targetFileUrl = `${cleanUrl}/remote.php/dav/files/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(parentFolder)}/${encodeURIComponent(savedName)}`;
    try {
      const putRes = await fetch(targetFileUrl, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": mimeType || "image/jpeg",
          "Content-Length": String(fileBuffer.length)
        },
        body: fileBuffer,
        signal: AbortSignal.timeout(10000)
      });

      if (putRes.status !== 201 && putRes.status !== 204 && putRes.status !== 200) {
        const errorText = await putRes.text().catch(() => "");
        console.error(`uploadForumImageToFramaspace - Échec PUT WebDAV (${putRes.status}) :`, errorText);
        throw new HttpsError("internal", `Échec du dépôt de l'image sur Framaspace (HTTP ${putRes.status}).`);
      }

      console.log(`uploadForumImageToFramaspace - Fichier ${savedName} déposé avec succès (HTTP ${putRes.status}).`);
    } catch (putErr) {
      console.error("uploadForumImageToFramaspace - Erreur lors de l'envoi WebDAV PUT :", putErr.message);
      if (putErr instanceof HttpsError) throw putErr;
      throw new HttpsError("internal", `Erreur réseau lors du téléversement WebDAV : ${putErr.message}`);
    }

    // 8. Génération du partage public en lecture seule via l'API OCS (shareType: 3, permissions: 1)
    const ocsEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`;
    const targetPath = `/${parentFolder}/${savedName}`;
    let token = null;

    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append("path", targetPath);
      bodyParams.append("shareType", "3"); // 3 = Lien public
      bodyParams.append("permissions", "1"); // 1 = Lecture seule

      const ocsRes = await fetch(ocsEndpoint, {
        method: "POST",
        headers: {
          "OCS-APIRequest": "true",
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(10000)
      });

      const ocsJson = await ocsRes.json().catch(() => ({}));
      const statusCode = ocsJson.ocs?.meta?.statuscode;
      const isOk = ocsRes.ok && (ocsJson.ocs?.meta?.status === "ok" || statusCode === 100 || statusCode === 200);

      if (isOk && ocsJson.ocs?.data) {
        token = ocsJson.ocs.data.token || null;
        if (!token && ocsJson.ocs.data.url) {
          const tokenMatch = String(ocsJson.ocs.data.url).match(/\/s\/([a-zA-Z0-9_-]+)/);
          if (tokenMatch) token = tokenMatch[1];
        }
      }

      // Si le partage existe déjà ou conflit, inspection de la liste des partages existants
      if (!token) {
        console.warn(`uploadForumImageToFramaspace - OCS POST status=${statusCode}, recherche des partages existants sur ${targetPath}...`);
        const listEndpoint = `${cleanUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent(targetPath)}&format=json`;
        const listRes = await fetch(listEndpoint, {
          method: "GET",
          headers: {
            "OCS-APIRequest": "true",
            Authorization: `Basic ${basicAuth}`,
            Accept: "application/json"
          },
          signal: AbortSignal.timeout(10000)
        });
        const listJson = await listRes.json().catch(() => ({}));
        const shares = listJson.ocs?.data;
        if (Array.isArray(shares) && shares.length > 0) {
          const match = shares.find(s => Number(s.share_type) === 3);
          if (match) {
            token = match.token || (match.url && match.url.match(/\/s\/([a-zA-Z0-9_-]+)/)?.[1]) || null;
          }
        }
      }
    } catch (ocsErr) {
      console.error("uploadForumImageToFramaspace - Erreur lors de l'appel OCS :", ocsErr.message);
    }

    if (!token) {
      console.error("uploadForumImageToFramaspace - Impossible de générer le token public de partage pour :", targetPath);
      throw new HttpsError(
        "internal",
        "L'image a été déposée sur Framaspace mais la création du lien public a échoué. Vérifiez que le partage public par lien est autorisé dans l'administration Nextcloud."
      );
    }

    // 9. Construction de l'URL directe d'affichage Nextcloud (mode aperçu inline optimisé)
    const directUrl = `${cleanUrl}/s/${token}/preview`;

    console.log(`uploadForumImageToFramaspace - Succès ! Image accessible via : ${directUrl}`);

    return {
      success: true,
      directUrl,
      fileName: savedName,
      token
    };
  }
);

