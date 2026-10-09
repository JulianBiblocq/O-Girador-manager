import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Service utilitaire pour la gestion et résolution du salon Porte-Voix officiel d'un événement.
 * Chemin Firestore : forum_channels/{channelId}
 */

/**
 * Récupère ou crée automatiquement le salon officiel dédié à un événement dans `forum_channels`.
 * Associe également l'identifiant du salon au document `events/{eventId}` via `forumChannelId`.
 *
 * @param {Object} params Paramètres de résolution
 * @param {string} params.eventId Identifiant de l'événement
 * @param {string} [params.eventTitle] Titre de l'événement
 * @param {string} [params.groupId] Groupe d'appartenance
 * @param {string} [params.channelId] ID de salon forcé ou déjà existant
 * @returns {Promise<{ id: string, name: string }>} Métadonnées du salon résolu
 */
export async function getOrCreateEventForumChannel({
  eventId,
  eventTitle = 'Événement',
  groupId = null,
  channelId = null
}) {
  const cleanEventId = String(eventId || '').trim();
  const cleanTitle = String(eventTitle || 'Événement').trim();
  const cleanGroupId = String(groupId || '').trim();
  const nowIso = new Date().toISOString();
  const defaultChannelName = cleanTitle.startsWith('🎪') ? cleanTitle : `🎪 ${cleanTitle}`.trim();

  let resolvedId = String(channelId || '').trim();
  let resolvedName = '';

  // 1. Si un channelId est fourni, vérifier son existence dans forum_channels
  if (resolvedId) {
    try {
      const snap = await getDoc(doc(db, 'forum_channels', resolvedId));
      if (snap.exists()) {
        resolvedName = snap.data()?.name || defaultChannelName;
        return { id: resolvedId, name: resolvedName };
      }
    } catch (e) {
      console.warn('Vérification channelId existant :', e);
    }
    resolvedId = '';
  }

  // 2. Si eventId est renseigné, vérifier si events/{eventId} a déjà un forumChannelId
  if (cleanEventId) {
    try {
      const evSnap = await getDoc(doc(db, 'events', cleanEventId));
      if (evSnap.exists()) {
        const storedChId = evSnap.data()?.forumChannelId;
        if (storedChId) {
          const chSnap = await getDoc(doc(db, 'forum_channels', storedChId));
          if (chSnap.exists()) {
            return { id: storedChId, name: chSnap.data()?.name || defaultChannelName };
          }
        }
      }
    } catch (e) {
      console.warn('Lecture forumChannelId sur event :', e);
    }
  }

  // 3. Chercher si un salon associé à cet eventId existe déjà dans forum_channels
  if (cleanEventId && cleanGroupId) {
    try {
      const qEvent = query(
        collection(db, 'forum_channels'),
        where('groupId', '==', cleanGroupId),
        where('eventId', '==', cleanEventId)
      );
      const qSnap = await getDocs(qEvent);
      if (!qSnap.empty) {
        const found = qSnap.docs[0];
        resolvedId = found.id;
        resolvedName = found.data()?.name || defaultChannelName;
      }
    } catch (e) {
      console.warn('Recherche salon par eventId :', e);
    }
  }

  // 4. Chercher si un salon avec le même nom existe déjà dans forum_channels
  if (!resolvedId && cleanGroupId) {
    try {
      const qName = query(
        collection(db, 'forum_channels'),
        where('groupId', '==', cleanGroupId),
        where('name', '==', defaultChannelName)
      );
      const qSnap = await getDocs(qName);
      if (!qSnap.empty) {
        const found = qSnap.docs[0];
        resolvedId = found.id;
        resolvedName = found.data()?.name || defaultChannelName;
      }
    } catch (e) {
      console.warn('Recherche salon par nom :', e);
    }
  }

  // 5. Création automatique si aucun salon n'existe (visible par tous les membres)
  if (!resolvedId && cleanGroupId) {
    try {
      const newChannelDoc = {
        name: defaultChannelName,
        groupId: cleanGroupId,
        eventId: cleanEventId || null,
        readRoles: ['all'],
        writeRoles: ['all'],
        isTransparent: true,
        allowedTags: [],
        dateCreation: nowIso
      };
      const chRef = await addDoc(collection(db, 'forum_channels'), newChannelDoc);
      resolvedId = chRef.id;
      resolvedName = defaultChannelName;
    } catch (e) {
      console.warn('Création salon dédié forum_channels :', e);
    }
  }

  // 6. Liaison dans le document de l'événement si non encore faite
  if (resolvedId && cleanEventId) {
    try {
      await updateDoc(doc(db, 'events', cleanEventId), {
        forumChannelId: resolvedId,
        derniereModif: nowIso
      });
    } catch (e) {
      console.warn('Liaison forumChannelId sur event non bloquante :', e);
    }
  }

  return {
    id: resolvedId || 'projets',
    name: resolvedName || defaultChannelName
  };
}

/**
 * Associe manuellement un salon existant au document d'événement.
 *
 * @param {string} eventId Identifiant de l'événement
 * @param {string} channelId Identifiant du salon dans forum_channels
 */
export async function linkEventToForumChannel(eventId, channelId) {
  if (!eventId || !channelId) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(db, 'events', String(eventId)), {
    forumChannelId: String(channelId),
    derniereModif: nowIso
  });
}
