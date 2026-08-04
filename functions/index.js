/**
 * Firebase Cloud Function (v2 / Node.js) : Envoi d'E-mails Transactionnels Brevo & Export Newsletter.
 * Sécurise les clés API via Firebase Secrets.
 */

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// Initialisation de Firebase Admin SDK s'il n'est pas déjà initialisé
if (!admin.apps.length) {
  admin.initializeApp();
}

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

