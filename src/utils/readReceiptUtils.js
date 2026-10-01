/**
 * Utilitaires pour la gestion et le calcul des accusés de lecture (read receipts)
 * dans le module Le Porte-Voix (Messages privés 1-à-1 et Groupes fermés).
 *
 * Conforme à la règle d'or de performance : ZÉRO écriture Firestore par message individuel.
 * Tout le calcul se fait dynamiquement côté client par comparaison chronologique
 * avec la carte `readStatus` du document parent de la discussion.
 */

/**
 * Convertit de manière sécurisée n'importe quel horodatage (ISO string, Timestamp Firestore, Date, number)
 * en millisecondes depuis l'époque Unix.
 *
 * @param {string|number|Date|Object} timestamp - Valeur d'horodatage à convertir
 * @returns {number} Horodatage en millisecondes, ou 0 si invalide/absent
 */
export function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();

  const parsed = new Date(timestamp).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Détermine si un message envoyé par l'utilisateur connecté a été lu par tous les destinataires requis.
 *
 * Cas 1-à-1 (Discussion privée) :
 * - Vrai si l'horodatage de lecture du destinataire unique est >= à la date de création du message.
 *
 * Cas Groupe fermé (Multi-destinataires) :
 * - Vrai si 100 % des membres du groupe (hors auteur connecté) ont un horodatage de lecture >= à la date du message.
 *
 * @param {Object} params
 * @param {Object} params.message - Document du message (senderId, timestamp, dateCreation, etc.)
 * @param {string} params.currentUserId - Identifiant de l'utilisateur connecté
 * @param {Object} [params.readStatus={}] - Dictionnaire { [uid]: isoString } stocké sur la conversation
 * @param {string[]} [params.participantIds=[]] - Liste des membres participants de la conversation
 * @param {boolean} [params.isGroup=false] - Indique s'il s'agit d'une boucle de groupe
 * @param {string} [params.otherUserId=null] - Identifiant de l'interlocuteur dans le cas d'une discussion 1-à-1
 * @returns {boolean} Vrai si le message a été lu par tous les destinataires
 */
export function isMessageReadByAll({
  message,
  currentUserId,
  readStatus = {},
  participantIds = [],
  isGroup = false,
  otherUserId = null
}) {
  if (!message || !currentUserId) return false;

  // Prise en charge des messages historiques de la collection legacy `private_messages`
  if (message.isLegacy && message.read === true) {
    return true;
  }

  // Horodatage du message (supporte timestamp, dateCreation ou createdAt)
  const messageTime = getTimestampMs(
    message.timestamp || message.dateCreation || message.createdAt
  );

  // Si le message n'a pas encore d'horodatage valide (ex. en cours d'envoi local), statut envoyé
  if (!messageTime) return false;

  // Marge de tolérance de 1000 ms pour compenser d'éventuels décalages d'horloge réseau
  const LEEWAY_MS = 1000;
  const targetThreshold = messageTime - LEEWAY_MS;

  // Cas 1 : Groupe fermé (multi-destinataires)
  if (isGroup) {
    const rawParticipants = Array.isArray(participantIds) ? participantIds : [];
    const recipients = rawParticipants.filter(
      (id) => Boolean(id) && typeof id === 'string' && id !== currentUserId
    );

    // S'il n'y a aucun autre participant dans le groupe, on reste sur simple coche
    if (recipients.length === 0) {
      return false;
    }

    // Le message n'est considéré lu que si 100 % des destinataires l'ont ouvert
    return recipients.every((recipientId) => {
      const recipientReadTime = getTimestampMs(readStatus?.[recipientId]);
      return recipientReadTime >= targetThreshold;
    });
  }

  // Cas 2 : Discussion privée 1-à-1
  const effectiveRecipientId =
    otherUserId ||
    (Array.isArray(participantIds)
      ? participantIds.find((id) => id && id !== currentUserId)
      : null);

  if (!effectiveRecipientId) {
    return false;
  }

  const recipientReadTime = getTimestampMs(readStatus?.[effectiveRecipientId]);
  return recipientReadTime >= targetThreshold;
}

/**
 * Garde-fou pour l'acquittement de lecture d'une conversation.
 * Évite les écritures Firestore superflues ou en boucle infinie.
 *
 * @param {Object} params
 * @param {Array<Object>} params.activeMessages - Liste chronologique des messages de la discussion
 * @param {string} params.currentUserId - Identifiant de l'utilisateur connecté
 * @param {Object} [params.readStatus={}] - Carte des dates de lecture de la conversation
 * @returns {boolean} Vrai s'il est légitime d'émettre une mise à jour de readStatus
 */
export function shouldMarkConversationAsRead({
  activeMessages = [],
  currentUserId,
  readStatus = {}
}) {
  if (!Array.isArray(activeMessages) || activeMessages.length === 0 || !currentUserId) {
    return false;
  }

  const lastMsg = activeMessages[activeMessages.length - 1];
  if (!lastMsg) return false;

  // Si le dernier message a été rédigé par l'utilisateur connecté, aucun acquittement requis
  if (lastMsg.senderId === currentUserId || lastMsg.auteurId === currentUserId) {
    return false;
  }

  const lastMsgTime = getTimestampMs(
    lastMsg.timestamp || lastMsg.dateCreation || lastMsg.createdAt
  );
  if (!lastMsgTime) return false;

  const myLastReadTime = getTimestampMs(readStatus?.[currentUserId]);

  // Déclencher UNIQUEMENT si le dernier message est plus récent que le dernier enregistrement
  return lastMsgTime > myLastReadTime;
}

/**
 * Formate une date d'accusé de lecture au format convivial en français
 * (ex: « Lu le 20 mai à 14:32 »).
 *
 * @param {string|number|Date|Object} dateValue - Horodatage à formater
 * @returns {string} Chaîne formatée en français
 */
export function formatReadReceiptDate(dateValue) {
  if (!dateValue) return '';
  const ms = getTimestampMs(dateValue);
  if (!ms) return '';

  const date = new Date(ms);
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return `Lu le ${dateStr} à ${timeStr}`;
}

/**
 * Calcule les statistiques de lecture d'un message pour le volet détaillé
 * (utilisé notamment pour les annonces du Mégaphone et ReadReceiptBadge).
 *
 * @param {Object} [lectures={}] - Carte des lectures { [userId]: { luLe, nom } }
 * @param {Array<Object>} [allMembers=[]] - Liste de tous les membres de l'association
 * @param {string} [authorId=null] - Identifiant de l'auteur (exclu du calcul)
 * @returns {{ readCount: number, readers: Array<Object>, unreadMembers: Array<Object> }}
 */
export function getReadReceiptStats(lectures = {}, allMembers = [], authorId = null) {
  const safeLectures = lectures && typeof lectures === 'object' ? lectures : {};
  const safeMembers = Array.isArray(allMembers) ? allMembers : [];

  // Indexation rapide des membres par identifiant
  const membersMap = new Map();
  safeMembers.forEach((m) => {
    const uid = m?.id || m?.uid || m?.userId;
    if (uid) {
      membersMap.set(uid, m);
    }
  });

  // Liste des lecteurs ayant validé
  const readers = [];
  Object.entries(safeLectures).forEach(([userId, data]) => {
    if (authorId && userId === authorId) return;

    const member = membersMap.get(userId);
    const luLe = typeof data === 'string' ? data : data?.luLe || '';
    const nom =
      (typeof data === 'object' && data?.nom) ||
      (member?.prenom ? `${member.prenom} ${member.nom || ''}`.trim() : null) ||
      member?.displayName ||
      member?.email ||
      'Membre';
    const photoURL = member?.photoURL || '';

    readers.push({
      userId,
      nom,
      photoURL,
      luLe
    });
  });

  // Tri par date de lecture la plus récente en premier
  readers.sort((a, b) => getTimestampMs(b.luLe) - getTimestampMs(a.luLe));

  // Liste des membres n'ayant pas encore validé
  const unreadMembers = [];
  safeMembers.forEach((m) => {
    const uid = m?.id || m?.uid || m?.userId;
    if (!uid || (authorId && uid === authorId)) return;

    if (!safeLectures[uid]) {
      const nom =
        (m?.prenom ? `${m.prenom} ${m.nom || ''}`.trim() : null) ||
        m?.displayName ||
        m?.email ||
        'Membre';

      unreadMembers.push({
        userId: uid,
        nom,
        photoURL: m?.photoURL || ''
      });
    }
  });

  return {
    readCount: readers.length,
    readers,
    unreadMembers
  };
}

