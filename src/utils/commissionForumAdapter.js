import { collection, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { getOrCreateEventForumChannel, linkEventToForumChannel } from './eventForumService.js';

export { getOrCreateEventForumChannel, linkEventToForumChannel };

/**
 * Adaptateur transversal pour la passerelle Commissions ➔ Porte-Voix (Forum).
 * Crée ou retrouve le fil de la commission rattaché au salon dédié de l'événement.
 */
export async function getOrCreateCommissionForumThread({
  eventId,
  commission,
  eventTitle = 'Événement',
  userProfile = null,
  groupId = null,
  channelId = null
}) {
  // Sécurisation stricte anti-PointerEvent / SyntheticEvent
  if (!commission || commission.nativeEvent || commission.target || typeof commission.preventDefault === 'function') {
    throw new Error('Objet commission invalide ou événement DOM intercepté');
  }

  const cleanCommissionId = String(commission.id || '').trim();
  const cleanEventId = String(eventId || commission.eventId || '').trim();
  if (!cleanEventId || !cleanCommissionId) {
    throw new Error('Identifiants eventId et commission requis pour le fil de discussion');
  }

  // 1. Résolution du salon dédié dans forum_channels
  const cleanGroupId = String(groupId || commission.groupId || '').trim();
  const cleanEventTitle = String(eventTitle || '').trim();
  const targetChannel = await getOrCreateEventForumChannel({
    eventId: cleanEventId,
    eventTitle: cleanEventTitle,
    groupId: cleanGroupId,
    channelId
  });

  const nowIso = new Date().toISOString();

  // 2. Vérification si un threadId est déjà associé à la commission
  if (commission.threadId && typeof commission.threadId === 'string') {
    try {
      const threadRef = doc(db, 'forum', commission.threadId.trim());
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        const threadData = threadSnap.data();
        if (targetChannel.id && threadData?.channelId !== targetChannel.id) {
          await updateDoc(threadRef, {
            channelId: targetChannel.id,
            categorie: targetChannel.name,
            channelName: targetChannel.name,
            derniereModification: nowIso
          });
        }
        return commission.threadId.trim();
      }
    } catch (err) {
      console.warn("Vérification threadId existant impossible, création d'un nouveau fil :", err);
    }
  }

  // 3. Préparation assainie des métadonnées (chaînes et primitives pures)
  const auteurId = String(userProfile?.uid || userProfile?.id || 'system').trim();
  const auteurNom = String(
    userProfile?.displayName ||
    `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() ||
    'Membre de la commission'
  ).trim();
  const commIcone = String(commission.icone || '📌').trim();
  const commTitre = String(commission.titre || 'Commission').trim();

  // 4. Création du sujet dans la collection 'forum' (rattaché au salon dédié)
  const newThreadPayload = {
    titre: `${commIcone} ${commTitre}`.trim(),
    channelId: targetChannel.id,
    categorie: targetChannel.name,
    channelName: targetChannel.name,
    commissionId: cleanCommissionId,
    commissionSourceId: cleanCommissionId,
    eventId: cleanEventId,
    groupId: cleanGroupId || null,
    auteurId,
    authorId: auteurId,
    auteurNom,
    authorName: auteurNom,
    dateCreation: nowIso,
    derniereModification: nowIso,
    reponses: [
      {
        auteurId,
        authorId: auteurId,
        auteurNom,
        authorName: auteurNom,
        dateCreation: nowIso,
        message: `Espace d'échange pour la commission ${commTitre}.`
      }
    ]
  };

  const forumCol = collection(db, 'forum');
  const threadDocRef = await addDoc(forumCol, newThreadPayload);
  const newThreadId = threadDocRef.id;

  // 5. Mémorisation de la référence du fil dans le document de la commission
  try {
    const commissionRef = doc(db, 'events', cleanEventId, 'commissions', cleanCommissionId);
    await updateDoc(commissionRef, {
      threadId: String(newThreadId),
      derniereModif: nowIso
    });
  } catch (updateErr) {
    console.warn("Liaison du threadId à la commission non bloquante :", updateErr);
  }

  return newThreadId;
}

/** Alias pour la création et ouverture du fil de discussion */
export const openOrCreateCommissionForumThread = getOrCreateCommissionForumThread;
