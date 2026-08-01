/**
 * Firebase Cloud Function (v2 / Node.js) : Envoi d'E-mails Transactionnels Brevo (Devis, Contrats).
 * Sécurise la clé API Brevo via les Firebase Secrets (BREVO_API_KEY).
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");

// Définition du secret Firebase pour la clé API Brevo (v3)
const brevoApiKeySecret = defineSecret("BREVO_API_KEY");

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
