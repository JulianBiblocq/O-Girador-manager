import { collection, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Adaptateur transversal pour la passerelle Commissions ➔ Porte-Voix (Forum).
 * Permet de récupérer ou créer à la volée le sujet de discussion officiel
 * dédié à une commission d'événement.
 *
 * @param {Object} params Paramètres de synchronisation
 * @param {string} params.eventId Identifiant de l'événement parent
 * @param {Object} params.commission Données de la commission
 * @param {string} [params.eventTitle] Titre de l'événement pour nommer le fil
 * @param {Object} [params.userProfile] Profil de l'utilisateur déclenchant l'action
 * @param {string} [params.groupId] Identifiant du groupe/tenant associatif
 * @returns {Promise<string>} Identifiant du sujet dans la collection 'forum'
 */
export async function getOrCreateCommissionForumThread({
  eventId,
  commission,
  eventTitle = 'Événement',
  userProfile = null,
  groupId = null
}) {
  if (!eventId || !commission?.id) {
    throw new Error('Identifiants eventId et commission requis pour le fil de discussion');
  }

  const effGroupId = groupId || commission.groupId || null;

  // 1. Vérification si un threadId est déjà associé à la commission
  if (commission.threadId) {
    try {
      const threadSnap = await getDoc(doc(db, 'forum', commission.threadId));
      if (threadSnap.exists()) {
        return commission.threadId;
      }
    } catch (err) {
      console.warn("Vérification threadId existant impossible, création d'un nouveau fil :", err);
    }
  }

  // 2. Préparation des métadonnées de l'auteur
  const auteurId = userProfile?.uid || userProfile?.id || 'system';
  const auteurNom = (
    userProfile?.displayName ||
    `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() ||
    'Membre de la commission'
  );
  const nowIso = new Date().toISOString();
  const commIcone = commission.icone || '📌';
  const commTitre = commission.titre || 'Commission';
  const threadTitre = `${commIcone} ${commTitre} — ${eventTitle}`;

  // 3. Création du sujet dans la collection 'forum'
  const newThreadPayload = {
    titre: threadTitre,
    categorie: 'Projets',
    channelName: 'Projets',
    channelId: 'projets',
    groupId: effGroupId,
    auteurId,
    authorId: auteurId,
    auteurNom,
    authorName: auteurNom,
    dateCreation: nowIso,
    derniereModification: nowIso,
    commissionSourceId: commission.id,
    eventId,
    reponses: [
      {
        auteurId,
        authorId: auteurId,
        auteurNom,
        authorName: auteurNom,
        dateCreation: nowIso,
        message: `Espace de discussion et de préparation pour la commission ${commTitre}.`
      }
    ]
  };

  const forumCol = collection(db, 'forum');
  const threadDocRef = await addDoc(forumCol, newThreadPayload);
  const newThreadId = threadDocRef.id;

  // 4. Mémorisation de la référence du fil dans le document de la commission
  try {
    const commissionRef = doc(db, 'events', eventId, 'commissions', commission.id);
    await updateDoc(commissionRef, {
      threadId: newThreadId,
      derniereModif: nowIso
    });
  } catch (updateErr) {
    console.warn("Liaison du threadId à la commission non bloquante :", updateErr);
  }

  return newThreadId;
}
