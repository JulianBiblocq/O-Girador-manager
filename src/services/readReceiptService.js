/**
 * readReceiptService.js
 * Service d'accusé de lecture passif et horodaté (façon WhatsApp)
 * pour les messages critiques du Porte-Voix et les annonces du Mégaphone.
 *
 * Conforme aux règles d'architecture et de sémantique O-Girador-manager.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { formatReadReceiptDate, getReadReceiptStats } from '../utils/readReceiptUtils.js';

export { formatReadReceiptDate, getReadReceiptStats };

/**
 * Enregistre l'accusé de lecture dans Firestore sur le document du message.
 * Utilise updateDoc avec champ imbriqué pour ne pas réécrire tout le document.
 *
 * @param {Object} params
 * @param {string} params.collectionName - Nom de la collection ('announcements' ou 'forum')
 * @param {string} params.documentId - Identifiant du document Firestore
 * @param {string} params.currentUserId - Identifiant de l'utilisateur qui lit
 * @param {string} params.currentUserName - Nom complet ou prénom de l'utilisateur
 * @param {string} [params.authorId] - Auteur du message (exclu des déclenchements)
 * @param {boolean} [params.isAlreadyRead=false] - Indique si l'utilisateur a déjà validé sa lecture
 * @returns {Promise<{ success: boolean, luLe?: string }>}
 */
export async function recordReadReceipt({
  collectionName,
  documentId,
  currentUserId,
  currentUserName,
  authorId,
  isAlreadyRead = false
}) {
  if (!collectionName || !documentId || !currentUserId) {
    return { success: false, reason: "Paramètres manquants." };
  }

  // Règle 1 : Exclure l'auteur du message du déclencheur d'accusé
  if (authorId && currentUserId === authorId) {
    return { success: false, reason: "L'auteur ne peut pas déclencher son propre accusé de lecture." };
  }

  // Si déjà lu, inutile de réécrire
  if (isAlreadyRead) {
    return { success: false, reason: "Message déjà marqué comme lu." };
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const nowIso = new Date().toISOString();
    const cleanUserName = (currentUserName || 'Membre').trim();

    // Enregistrement de l'accusé de lecture dans la map 'lectures' via clé imbriquée
    await updateDoc(docRef, {
      [`lectures.${currentUserId}`]: {
        luLe: nowIso,
        nom: cleanUserName
      }
    });

    return {
      success: true,
      luLe: nowIso
    };
  } catch (err) {
    console.error(`recordReadReceipt - Erreur d'enregistrement sur ${collectionName}/${documentId} :`, err);
    return {
      success: false,
      error: err.message || err
    };
  }
}
