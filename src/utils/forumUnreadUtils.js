/**
 * Utilitaires pour le calcul des statuts de lecture et des cascades de non-lus dans le Porte-Voix.
 * Respecte les règles d'architecture du projet (modularité, fonctions pures, commentaires en français).
 */

/**
 * Calcule le nombre exact de messages non lus dans un sujet pour un utilisateur donné.
 * Un message rédigé par l'utilisateur connecté n'est jamais comptabilisé comme non lu pour lui-même.
 *
 * @param {Object} thread - Objet représentant le sujet (avec son tableau reponses)
 * @param {string} userId - UID de l'utilisateur connecté
 * @param {string|null|undefined} userLastReadDate - Chaîne ISO de dernière lecture du sujet
 * @returns {number} Nombre de messages non lus
 */
export function countThreadUnreadMessages(thread, userId, userLastReadDate) {
  if (!thread || !Array.isArray(thread.reponses) || thread.reponses.length === 0) {
    return 0;
  }

  const lastReadTime = userLastReadDate ? new Date(userLastReadDate).getTime() : 0;

  // Si le sujet n'a jamais été lu par cet utilisateur
  if (!lastReadTime) {
    return thread.reponses.filter(r => r.auteurId !== userId).length;
  }

  // Filtrer les messages créés après la dernière lecture et écrits par d'autres membres
  return thread.reponses.filter(r => {
    const msgTime = new Date(r.dateCreation).getTime();
    return msgTime > lastReadTime && r.auteurId !== userId;
  }).length;
}

/**
 * Détermine l'index du premier message non lu dans le tableau de réponses d'un sujet.
 * Utilisé pour positionner la ligne de repère '── Nouveaux messages ──'.
 *
 * @param {Object} thread - Objet représentant le sujet
 * @param {string} userId - UID de l'utilisateur connecté
 * @param {string|null|undefined} userLastReadDate - Horodatage ISO de lecture
 * @returns {number} Index du premier message non lu, ou -1 si tout est déjà lu
 */
export function getFirstUnreadIndex(thread, userId, userLastReadDate) {
  if (!thread || !Array.isArray(thread.reponses) || thread.reponses.length === 0) {
    return -1;
  }

  const lastReadTime = userLastReadDate ? new Date(userLastReadDate).getTime() : 0;

  if (!lastReadTime) {
    return thread.reponses.findIndex(r => r.auteurId !== userId);
  }

  return thread.reponses.findIndex(r => {
    const msgTime = new Date(r.dateCreation).getTime();
    return msgTime > lastReadTime && r.auteurId !== userId;
  });
}

/**
 * Calcule récursivement les statistiques de non-lus pour un salon et l'ensemble de ses sous-dossiers.
 *
 * @param {string} channelId - Identifiant du salon
 * @param {Array} channels - Liste de l'ensemble des salons accessibles
 * @param {Array} allThreads - Liste de tous les sujets accessibles
 * @param {string} userId - UID de l'utilisateur connecté
 * @param {Object} readThreads - Dictionnaire { [threadId]: dateIsoDerniereLecture }
 * @returns {{ unreadMessages: number, unreadThreadsCount: number }} Statistiques agrégées
 */
export function getChannelUnreadStats(channelId, channels, allThreads, userId, readThreads = {}) {
  const currentChannel = channels.find(c => c.id === channelId);

  // 1. Sujets directs appartenant à ce salon (ou rétro-compatibilité par nom de catégorie)
  const directThreads = allThreads.filter(t => {
    if (t.channelId) return t.channelId === channelId;
    if (currentChannel && currentChannel.name === (t.categorie || 'Général')) return true;
    return false;
  });

  let totalUnreadMessages = 0;
  let totalUnreadThreads = 0;

  directThreads.forEach(thread => {
    const lastRead = readThreads[thread.id];
    const unread = countThreadUnreadMessages(thread, userId, lastRead);
    if (unread > 0) {
      totalUnreadMessages += unread;
      totalUnreadThreads += 1;
    }
  });

  // 2. Sous-dossiers / salons enfants (cascade récursive)
  const childChannels = channels.filter(c => c.parentId === channelId);
  childChannels.forEach(child => {
    const childStats = getChannelUnreadStats(child.id, channels, allThreads, userId, readThreads);
    totalUnreadMessages += childStats.unreadMessages;
    totalUnreadThreads += childStats.unreadThreadsCount;
  });

  return {
    unreadMessages: totalUnreadMessages,
    unreadThreadsCount: totalUnreadThreads
  };
}

/**
 * Précalcule en une seule passe les statistiques de non-lus pour tous les salons.
 *
 * @param {Array} channels - Liste des salons
 * @param {Array} allThreads - Liste des sujets
 * @param {string} userId - UID de l'utilisateur
 * @param {Object} readThreads - Dictionnaire des lectures
 * @returns {Object<string, { unreadMessages: number, unreadThreadsCount: number }>}
 */
export function getAllChannelsUnreadStats(channels, allThreads, userId, readThreads = {}) {
  const statsMap = {};
  if (!Array.isArray(channels)) return statsMap;

  channels.forEach(channel => {
    statsMap[channel.id] = getChannelUnreadStats(channel.id, channels, allThreads, userId, readThreads);
  });

  return statsMap;
}
