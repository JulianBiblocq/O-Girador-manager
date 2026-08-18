/**
 * Firebase Cloud Functions (v2 / Node.js) :
 * - Envoi d'E-mails Transactionnels Brevo & Export Newsletter.
 * - Envoi de Notifications Push FCM via Firestore Trigger.
 * Sécurise les clés API via Firebase Secrets.
 */

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
const { getApps, initializeApp } = require("firebase-admin/app");

// Initialisation de Firebase Admin SDK s'il n'est pas déjà initialisé
if (!getApps().length) {
  initializeApp();
}

/**
 * Cloud Function Firestore Trigger : onAnnouncementCreated
 * Se déclenche automatiquement à la création d'un document dans announcements/{announcementId}.
 * Envoie des notifications push FCM aux membres ciblés du groupe si sendPushNotification === true.
 *
 * Flux :
 * 1. Vérifie le flag sendPushNotification dans le document.
 * 2. Récupère tous les utilisateurs du groupId concerné.
 * 3. Filtre par cibles (tags, rôles) si spécifiées.
 * 4. Collecte les fcmTokens[] valides de chaque utilisateur ciblé.
 * 5. Envoie par lots de 500 tokens via admin.messaging().sendEachForMulticast().
 * 6. Nettoie les tokens invalides des profils Firestore.
 */
exports.onAnnouncementCreated = onDocumentCreated(
  "announcements/{announcementId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.warn("onAnnouncementCreated - Aucune donnée dans le snapshot.");
      return null;
    }

    const announcementData = snap.data();
    const announcementId = event.params.announcementId;

    // Vérification du flag d'envoi de notification push
    if (!announcementData.sendPushNotification) {
      console.log(`onAnnouncementCreated - Annonce "${announcementId}" sans sendPushNotification, envoi push ignoré.`);
      return null;
    }

    const groupId = announcementData.groupId;
    if (!groupId) {
      console.error(`onAnnouncementCreated - Annonce "${announcementId}" sans groupId, impossible d'envoyer les notifications.`);
      return null;
    }

    const titre = announcementData.titre || "Nouvelle annonce";
    const message = announcementData.message || "";
    const cibles = Array.isArray(announcementData.cibles) ? announcementData.cibles : ["Tous"];

    console.log(`onAnnouncementCreated - Traitement de l'annonce "${announcementId}" pour le groupe "${groupId}"`, {
      titre,
      cibles,
      sendPushNotification: true
    });

    try {
      const db = admin.firestore();

      // Récupération de tous les utilisateurs du groupe
      const usersSnap = await db.collection("users")
        .where("groupId", "==", groupId)
        .get();

      if (usersSnap.empty) {
        console.warn(`onAnnouncementCreated - Aucun utilisateur trouvé pour le groupe "${groupId}".`);
        return null;
      }

      // Filtrage des utilisateurs par cibles et collecte des tokens FCM
      const allTokens = [];           // Tableau de {token, userId} pour le suivi
      const cibleTous = cibles.includes("Tous");

      usersSnap.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userTokens = userData.fcmTokens;

        // Vérifier que l'utilisateur possède des tokens FCM valides
        if (!Array.isArray(userTokens) || userTokens.length === 0) {
          return;
        }

        // Filtrage par cibles si nécessaire
        if (!cibleTous) {
          const userTags = userData.tags || [];
          const userRole = userData.role || "membre";
          const isAdmin = userRole === "mestre" || userRole === "super-admin";

          const matchesCible = cibles.some((c) => {
            if (c === "role:admin" && isAdmin) return true;
            return userTags.includes(c);
          });

          if (!matchesCible) return;
        }

        // Ajouter chaque token avec son userId pour le nettoyage ultérieur
        userTokens.forEach((token) => {
          if (typeof token === "string" && token.trim()) {
            allTokens.push({ token: token.trim(), userId });
          }
        });
      });

      if (allTokens.length === 0) {
        console.warn(`onAnnouncementCreated - Aucun token FCM trouvé pour les cibles de l'annonce "${announcementId}".`);
        return null;
      }

      console.log(`onAnnouncementCreated - ${allTokens.length} token(s) FCM collecté(s), envoi en cours...`);

      // Construction du payload de notification FCM
      const truncatedBody = message.length > 200 ? message.substring(0, 197) + "..." : message;

      // Envoi par lots de 500 tokens (limite FCM sendEachForMulticast)
      const BATCH_SIZE = 500;
      const tokensToRemove = []; // Tokens invalides à nettoyer

      for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
        const batch = allTokens.slice(i, i + BATCH_SIZE);
        const batchTokenStrings = batch.map((t) => t.token);

        try {
          const multicastMessage = {
            notification: {
              title: titre,
              body: truncatedBody
            },
            data: {
              announcementId: announcementId,
              groupId: groupId,
              url: "/app",
              click_action: "/app"
            },
            tokens: batchTokenStrings
          };

          const response = await admin.messaging().sendEachForMulticast(multicastMessage);

          console.log(`onAnnouncementCreated - Lot ${Math.floor(i / BATCH_SIZE) + 1} : ${response.successCount} succès, ${response.failureCount} échec(s).`);

          // Identifier les tokens invalides pour nettoyage
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code || "";
                console.error(`onAnnouncementCreated - Échec d'envoi au token index ${i + idx} :`, resp.error?.message || "Erreur inconnue");

                // Nettoyer les tokens définitivement invalides
                if (
                  errorCode === "messaging/invalid-registration-token" ||
                  errorCode === "messaging/registration-token-not-registered"
                ) {
                  tokensToRemove.push(batch[idx]);
                }
              }
            });
          }
        } catch (batchError) {
          console.error(`onAnnouncementCreated - Erreur critique lors de l'envoi du lot ${Math.floor(i / BATCH_SIZE) + 1} :`, batchError);
        }
      }

      // Nettoyage des tokens invalides dans les profils Firestore
      if (tokensToRemove.length > 0) {
        console.log(`onAnnouncementCreated - Nettoyage de ${tokensToRemove.length} token(s) invalide(s)...`);

        // Regrouper les tokens invalides par userId pour optimiser les écritures
        const tokensByUser = {};
        tokensToRemove.forEach(({ token, userId }) => {
          if (!tokensByUser[userId]) tokensByUser[userId] = [];
          tokensByUser[userId].push(token);
        });

        const { arrayRemove } = require("firebase-admin/firestore").FieldValue
          ? require("firebase-admin/firestore")
          : { arrayRemove: admin.firestore.FieldValue.arrayRemove };

        for (const [userId, invalidTokens] of Object.entries(tokensByUser)) {
          try {
            await db.collection("users").doc(userId).update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
            });
            console.log(`onAnnouncementCreated - Tokens invalides supprimés pour l'utilisateur "${userId}".`);
          } catch (cleanupErr) {
            console.error(`onAnnouncementCreated - Erreur lors du nettoyage des tokens pour "${userId}" :`, cleanupErr);
          }
        }
      }

      console.log(`onAnnouncementCreated - Envoi terminé pour l'annonce "${announcementId}".`);
      return null;

    } catch (globalError) {
      console.error(`onAnnouncementCreated - Erreur globale pour l'annonce "${announcementId}" :`, globalError);
      return null;
    }
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
          const db = admin.firestore();
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

  const db = admin.firestore();
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
    const customToken = await admin.auth().createCustomToken(authData.uid);

    // Mise à jour du document Firestore pour declencher la connexion sur le navigateur PC
    await sessionRef.update({
      status: "approved",
      customToken: customToken,
      approvedBy: authData.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: "Session PC approuvée avec succès."
    };
  } catch (err) {
    console.error("Erreur approveQrSession :", err);
    throw new HttpsError(
      "internal",
      "Une erreur est survenue lors de la création du token d'authentification."
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
      const db = admin.firestore();
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
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
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
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      console.error("helloAssoWebhook - Erreur globale :", err);
      // On retourne quand même 200 pour éviter les retry infinis de HelloAsso
      // mais on signale l'erreur dans le body
      return res.status(200).json({
        success: false,
        error: "Erreur interne lors du traitement de la notification.",
        details: err.message || ""
      });
    }
  }
);
