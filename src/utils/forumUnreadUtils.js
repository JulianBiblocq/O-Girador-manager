/**
 * Utilitaires pour le calcul des statuts de lecture et des cascades de non-lus dans le Porte-Voix.
 * Respecte les règles d'architecture du projet (modularité, fonctions pures, commentaires en français).
 */

/**
 * Convertit en toute sécurité une date hétérogène (string ISO, Timestamp Firestore {seconds}, Date) en millisecondes.
 * @param {any} val 
 * @returns {number} Timestamp en millisecondes (0 si invalide)
 */
export function toTimestamp(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return isNaN(val.getTime()) ? 0 : val.getTime();
  if (typeof val.toDate === 'function') {
    try { return val.toDate().getTime(); } catch { return 0; }
  }
  if (typeof val === 'object' && ('seconds' in val || '_seconds' in val)) {
    const secs = val.seconds ?? val._seconds;
    return (typeof secs === 'number' && !isNaN(secs)) ? secs * 1000 : 0;
  }
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Récupère le dictionnaire local de lecture depuis localStorage pour un utilisateur.
 * @param {string} userId 
 * @returns {Object<string, string>} { [threadId]: timestampIso }
 */
export function getLocalReadThreads(userId) {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = localStorage.getItem(`forum_read_threads_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Enregistre localement la lecture d'un sujet avec zéro latence réseau et émet un événement.
 * @param {string} userId 
 * @param {string} threadId 
 * @param {string} [timestampIso] 
 */
export function saveLocalReadThread(userId, threadId, timestampIso) {
  if (typeof window === 'undefined' || !userId || !threadId) return;
  try {
    const key = `forum_read_threads_${userId}`;
    const current = getLocalReadThreads(userId);
    const ts = timestampIso || new Date().toISOString();
    current[threadId] = ts;
    localStorage.setItem(key, JSON.stringify(current));

    window.dispatchEvent(new CustomEvent('forum_thread_read', {
      detail: { userId, threadId, timestamp: ts }
    }));
  } catch {
    // silence
  }
}

/**
 * Enregistre localement la lecture de plusieurs sujets en masse et émet un événement.
 * @param {string} userId 
 * @param {Array<string>} threadIds 
 * @param {string} [timestampIso] 
 */
export function saveLocalAllReadThreads(userId, threadIds = [], timestampIso) {
  if (typeof window === 'undefined' || !userId || !Array.isArray(threadIds)) return;
  try {
    const key = `forum_read_threads_${userId}`;
    const current = getLocalReadThreads(userId);
    const nowIso = timestampIso || new Date().toISOString();
    threadIds.forEach(id => {
      if (id) current[id] = nowIso;
    });
    localStorage.setItem(key, JSON.stringify(current));

    window.dispatchEvent(new CustomEvent('forum_all_threads_read', {
      detail: { userId, threadIds, timestamp: nowIso }
    }));
  } catch {
    // silence
  }
}

/**
 * Fusionne la lecture locale (localStorage) et distante (profileData.readThreads).
 * @param {string} userId 
 * @param {Object} profileReadThreads 
 * @returns {Object<string, string>}
 */
export function getEffectiveReadThreads(userId, profileReadThreads = {}) {
  const local = getLocalReadThreads(userId);
  return { ...local, ...(profileReadThreads || {}) };
}

/**
 * Calcule le nombre exact de messages non lus dans un sujet pour un utilisateur donné.
 * Un message rédigé par l'utilisateur connecté n'est jamais comptabilisé comme non lu pour lui-même.
 *
 * @param {Object} thread - Objet représentant le sujet (avec son tableau reponses)
 * @param {string} userId - UID de l'utilisateur connecté
 * @param {string|null|undefined} userLastReadDate - Chaîne ISO ou timestamp de dernière lecture du sujet
 * @returns {number} Nombre de messages non lus
 */
export function countThreadUnreadMessages(thread, userId, userLastReadDate) {
  if (!thread) return 0;

  const lastReadTime = toTimestamp(userLastReadDate);

  // Cas 1 : Le thread a un tableau de réponses
  if (Array.isArray(thread.reponses) && thread.reponses.length > 0) {
    if (!lastReadTime) {
      return thread.reponses.filter(r => userId ? r.auteurId !== userId : true).length;
    }
    return thread.reponses.filter(r => {
      const msgTime = toTimestamp(r.dateCreation);
      return msgTime > lastReadTime && (userId ? r.auteurId !== userId : true);
    }).length;
  }

  // Cas 2 : Le thread sans tableau reponses
  if (!lastReadTime) {
    return (userId && thread.auteurId === userId) ? 0 : 1;
  }

  const threadModTime = toTimestamp(thread.derniereModification || thread.dateCreation);
  if (threadModTime > lastReadTime && (!userId || thread.auteurId !== userId)) {
    return 1;
  }

  return 0;
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

  const lastReadTime = toTimestamp(userLastReadDate);

  if (!lastReadTime) {
    return thread.reponses.findIndex(r => userId ? r.auteurId !== userId : true);
  }

  return thread.reponses.findIndex(r => {
    const msgTime = toTimestamp(r.dateCreation);
    return msgTime > lastReadTime && (userId ? r.auteurId !== userId : true);
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
