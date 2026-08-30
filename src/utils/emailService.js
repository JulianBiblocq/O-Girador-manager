/**
 * Service Mail & Routeur Dynamique Côté Client (Multi-Fournisseurs & Marque Blanche).
 * Permet d'injecter systématiquement le nom dynamique d'expéditeur et l'adresse Reply-To,
 * et d'acheminer le courrier via le canal dédié configuré (API externe / SMTP) ou via le service certifié O Girador.
 */

/**
 * Prépare et formate le payload d'un e-mail transactionnel en injectant les paramètres SaaS dynamiques de l'association.
 * 
 * @param {Object} params Paramètres du courrier (to, subject, htmlContent, textContent, attachment)
 * @param {Object} associationSettings Réglages complets de l'association
 * @returns {Object} Payload enrichi prêt pour l'expédition backend
 */
export function formatAssociationEmailPayload(params, associationSettings = {}) {
  const assocNom = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const senderName = (associationSettings.emailSenderName && associationSettings.emailSenderName.trim()) 
    ? associationSettings.emailSenderName.trim() 
    : assocNom;

  const replyToEmail = (associationSettings.emailReplyTo && associationSettings.emailReplyTo.trim())
    ? associationSettings.emailReplyTo.trim()
    : (associationSettings.email || associationSettings.publicContactEmail || 'contact@o-girador.com');

  const deliveryMode = associationSettings.emailDeliveryMode || 'ogirador';
  const connectionType = associationSettings.emailConnectionType || 'api';
  const apiProvider = associationSettings.emailApiProvider || 'brevo';
  const customDomain = associationSettings.customEmailDomain || '';

  return {
    groupId: associationSettings.groupId || params.groupId || '',
    sender: {
      name: senderName,
      email: params.senderEmail || replyToEmail
    },
    replyTo: {
      name: senderName,
      email: replyToEmail
    },
    to: Array.isArray(params.to) ? params.to : [{ email: params.to, name: params.recipientName || params.to }],
    subject: params.subject,
    htmlContent: params.htmlContent,
    attachment: params.attachment || [],
    deliveryConfig: {
      deliveryMode,
      connectionType,
      apiProvider,
      customDomain,
      smtpHost: associationSettings.smtpHost || '',
      smtpPort: associationSettings.smtpPort || 587,
      smtpUser: associationSettings.smtpUser || '',
      smtpSecure: associationSettings.smtpSecure || 'tls'
    }
  };
}

/**
 * Envoie un e-mail transactionnel en routant la demande vers la Cloud Function appropriée
 * selon la configuration de l'association (Option A Certifiée O Girador vs Option B Externe).
 * 
 * @param {Object} emailParams Contenu de l'e-mail (to, subject, htmlContent, attachment)
 * @param {Object} associationSettings Paramètres Firestore de l'association
 * @returns {Promise<Object>} Résultat de l'envoi { success: true, messageId: string }
 */
export async function sendAssociationEmail(emailParams, associationSettings = {}) {
  const payload = formatAssociationEmailPayload(emailParams, associationSettings);

  console.log("emailService - Routage d'envoi d'e-mail SaaS :", {
    sender: payload.sender,
    replyTo: payload.replyTo,
    deliveryMode: payload.deliveryConfig.deliveryMode,
    apiProvider: payload.deliveryConfig.apiProvider
  });

  try {
    // Si la Cloud Function centrale est configurée sur Firebase (utilisation du projet par défaut si l'URL n'est pas définie)
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || `https://us-central1-${projectId}.cloudfunctions.net/sendAssociationEmail`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json().catch(() => ({}));

    if (response.ok && resData.success) {
      return { success: true, messageId: resData.messageId || `msg_${Date.now()}` };
    }

    throw new Error(resData.error || `Erreur du serveur de messagerie (Code HTTP ${response.status})`);
  } catch (error) {
    console.error("emailService - Échec d'envoi de l'e-mail :", error);
    throw error;
  }
}
