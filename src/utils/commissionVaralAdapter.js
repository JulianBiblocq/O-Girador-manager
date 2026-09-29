import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where 
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { DEFAULT_VARAL_CATEGORIES } from '../hooks/useAssociationSettings.js';

/**
 * Adaptateur de synchronisation entre les Commissions d'un Événement et le Varal (Bloc 2).
 * Convertit une commission en Livret Cordel structuré et initialise la corde dédiée.
 */

import { generateCommissionMarkdown } from '../components/event-details/commissions/commissionUtils.js';

export { generateCommissionMarkdown };

/**
 * Vérifie et initialise si besoin la corde d'événement dans le document de réglages de l'association.
 *
 * @param {string} groupId Identifiant du groupe
 * @param {Object} event Données de l'événement
 * @returns {Promise<string>} Identifiant de la catégorie Varal (ex: projet_eventId)
 */
export async function ensureProjectVaralRope(groupId, event) {
  if (!groupId || !event?.id) return null;
  const ropeId = `projet_${event.id}`;
  const ropeNom = `🎪 Projet : ${event.titre || event.title || 'Événement'}`;

  try {
    const assocRef = doc(db, 'associations', groupId);
    const assocSnap = await getDoc(assocRef);

    let categories = DEFAULT_VARAL_CATEGORIES;
    if (assocSnap.exists() && Array.isArray(assocSnap.data()?.varalCategories)) {
      categories = assocSnap.data().varalCategories;
    }

    const ropeExists = categories.some((c) => c.id === ropeId || c.nom === ropeNom);
    if (!ropeExists) {
      const newRope = {
        id: ropeId,
        nom: ropeNom,
        icone: '🎪',
        actif: true,
        order: 95
      };
      await updateDoc(assocRef, {
        varalCategories: [...categories, newRope]
      });
    }

    return ropeId;
  } catch (err) {
    console.warn("ensureProjectVaralRope - Avertissement initialisation corde :", err);
    return ropeId;
  }
}

/**
 * Publie ou met à jour le livret Cordel d'une commission dans la collection documents du Varal.
 * Opération idempotente : réutilise le document existant si déjà publié.
 *
 * @param {Object} params Paramètres de synchronisation
 * @returns {Promise<{success: boolean, docId: string, isNew: boolean}>}
 */
export async function syncCommissionToVaral({ event, commission, usersMap = {}, groupId }) {
  if (!event?.id || !commission?.id || !groupId) {
    throw new Error('Paramètres manquants pour la synchronisation Varal');
  }

  // 1. Garantir l'existence de la corde Varal du projet
  const categoryId = await ensureProjectVaralRope(groupId, event);

  // 2. Préparation des métadonnées du livret
  const markdownContent = generateCommissionMarkdown(commission, { usersMap, event });
  const referents = (commission.referentsIds || []).map((id) => {
    const u = usersMap[id] || {};
    return u.displayName || u.nom || u.prenom || 'Référent';
  });
  const auteurText = referents.length > 0 ? referents.join(' & ') : 'Référents commission';
  const nowIso = new Date().toISOString();

  const docPayload = {
    titre: `${commission.icone || '📋'} ${commission.titre}`,
    categoryId,
    categorie: categoryId,
    sousCategorie: `Chantier : ${commission.titre}`,
    auteur: auteurText,
    type: 'report',
    texte: markdownContent,
    commissionSourceId: commission.id,
    eventId: event.id,
    groupId,
    dateMiseAJour: nowIso,
    order: 50
  };

  // 3. Recherche d'un document existant pour idempotence
  const docsCol = collection(db, 'documents');
  const qDoc = query(
    docsCol,
    where('groupId', '==', groupId),
    where('commissionSourceId', '==', commission.id)
  );
  const snap = await getDocs(qDoc);

  let targetDocId = null;
  let isNew = false;

  if (!snap.empty) {
    targetDocId = snap.docs[0].id;
    await updateDoc(doc(db, 'documents', targetDocId), docPayload);
  } else {
    isNew = true;
    docPayload.dateAjout = nowIso;
    const newDocRef = await addDoc(docsCol, docPayload);
    targetDocId = newDocRef.id;
  }

  // 4. Mettre à jour la commission avec les métadonnées de synchro
  const commRef = doc(db, 'events', event.id, 'commissions', commission.id);
  await updateDoc(commRef, {
    varalDocId: targetDocId,
    varalDerniereSynchro: nowIso
  });

  return { success: true, docId: targetDocId, isNew };
}
