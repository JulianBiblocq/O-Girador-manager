/**
 * Fonctions utilitaires pures pour les notifications des discussions d'événements.
 * Sans dépendance externe pour faciliter les tests unitaires et la réutilisabilité.
 */

/**
 * Tronque un message à un nombre maximum de caractères (80 par défaut) avec points de suspension.
 *
 * @param {string} text Texte source
 * @param {number} [maxLength=80] Nombre maximal de caractères
 * @returns {string} Texte tronqué
 */
export function formatMessageExcerpt(text, maxLength = 80) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 3) + '...';
}

/**
 * Résout la liste des destinataires à notifier lors d'un message de discussion d'événement.
 * Récupère les inscrits confirmés / présents ainsi que les organisateurs et référents,
 * en excluant strictement l'expéditeur du message.
 *
 * @param {Object} event Événement avec inscriptions et contacts
 * @param {string} currentUserId UID de l'expéditeur à exclure
 * @returns {string[]} Liste unique d'identifiants UID de destinataires
 */
export function getEventDiscussionRecipients(event, currentUserId) {
  if (!event) return [];

  const recipients = new Set();
  const validConfirmedStatuses = new Set(['present', 'inscrit', 'confirme', 'confirm']);

  // 1. Inscrits confirmés (statut present ou confirm/inscrit)
  if (Array.isArray(event.inscriptions)) {
    event.inscriptions.forEach((ins) => {
      const uid = ins?.userId || ins?.uid || ins?.id;
      const status = String(ins?.status || '').toLowerCase().trim();
      if (uid && validConfirmedStatuses.has(status)) {
        recipients.add(String(uid).trim());
      }
    });
  }

  // 2. Créateur / Auteur de l'événement
  if (event.createdBy) recipients.add(String(event.createdBy).trim());
  if (event.auteurId) recipients.add(String(event.auteurId).trim());
  if (event.referentId) recipients.add(String(event.referentId).trim());

  // 3. Référents et organisateurs Jour J
  if (event.contactsJourJ?.referentGroupeId) {
    recipients.add(String(event.contactsJourJ.referentGroupeId).trim());
  }

  if (Array.isArray(event.contactsJourJ?.referentsPupitres)) {
    event.contactsJourJ.referentsPupitres.forEach((ref) => {
      const refUid = typeof ref === 'string' ? ref : (ref?.userId || ref?.uid || ref?.id);
      if (refUid) {
        recipients.add(String(refUid).trim());
      }
    });
  }

  // 4. Liste explicite d'organisateurs s'ils existent
  if (Array.isArray(event.organisateurs)) {
    event.organisateurs.forEach((orga) => {
      const orgaUid = typeof orga === 'string' ? orga : (orga?.userId || orga?.uid || orga?.id);
      if (orgaUid) {
        recipients.add(String(orgaUid).trim());
      }
    });
  }

  // 5. Exclusion stricte de l'expéditeur
  if (currentUserId) {
    recipients.delete(String(currentUserId).trim());
  }

  return Array.from(recipients).filter(Boolean);
}

/**
 * Construit le payload standardisé d'une notification de discussion d'événement.
 *
 * @param {Object} params Paramètres de la notification
 * @param {string} params.recipientUid UID du destinataire
 * @param {Object} params.event Objet événement
 * @param {string} params.authorName Nom de l'expéditeur
 * @param {string} params.text Texte du commentaire
 * @param {string} [params.groupId] Identifiant du groupe
 * @param {string} [params.createdAtIso] Horodatage ISO
 * @returns {Object} Payload complet de notification
 */
export function buildEventDiscussionNotificationPayload({
  recipientUid,
  event,
  authorName = 'Membre',
  text = '',
  groupId = '',
  createdAtIso = null
}) {
  const eventTitle = event?.titre || event?.nom || event?.title || 'Événement';
  const excerpt = formatMessageExcerpt(text, 80);
  const nowIso = createdAtIso || new Date().toISOString();
  const discussionLink = `/agenda?eventId=${event?.id || ''}&tab=discussion`;

  return {
    userId: recipientUid,
    type: 'event_discussion',
    title: `Nouveau message — ${eventTitle}`,
    body: `${authorName} : ${excerpt}`,
    message: `${authorName} : ${excerpt}`,
    link: discussionLink,
    targetUrl: discussionLink,
    eventId: event?.id || '',
    read: false,
    isRead: false,
    groupId: groupId || event?.groupId || '',
    createdAt: nowIso
  };
}
