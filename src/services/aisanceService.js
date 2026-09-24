import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { computeTrainingStages } from '../utils/aisanceStagesUtils';

export { computeTrainingStages };
export { resolvePieceTrainings } from '../utils/repertoireMatcher.js';

/**
 * Service de gestion de l'aisance et des entraînements.
 * Collection racine Firestore : /trainings (gérée par sequenciador)
 * Sous-collection utilisateur : /users/${userId}/aisance/${trainingId}
 */

/**
 * Écoute en temps réel les entraînements configurés pour un groupe.
 *
 * @param {string} groupId - Identifiant de l'association / groupe
 * @param {Function} callback - Reçoit la liste des entraînements du groupe
 * @returns {Function} Fonction de désinscription (unsubscribe)
 */
export function subscribeGroupTrainings(groupId, callback) {
  if (!groupId) {
    if (typeof callback === 'function') callback([]);
    return () => {};
  }

  const normalizedGroupId = groupId.trim().toLowerCase();
  const q = query(
    collection(db, 'trainings'),
    where('groupId', '==', normalizedGroupId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trainings = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      if (typeof callback === 'function') {
        callback(trainings);
      }
    },
    (error) => {
      console.error('[aisanceService] Erreur lors de subscribeGroupTrainings :', error);
      if (typeof callback === 'function') {
        callback([]);
      }
    }
  );
}

/**
 * Écoute en temps réel la sous-collection d'aisance d'un adhérent.
 * Retourne une table { [trainingId]: stagesCompleted[] }.
 *
 * @param {string} userId - Identifiant de l'adhérent
 * @param {Function} callback - Reçoit la table d'avancement par entraînement
 * @returns {Function} Fonction de désinscription (unsubscribe)
 */
export function subscribeUserAisance(userId, callback) {
  if (!userId) {
    if (typeof callback === 'function') callback({});
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'aisance');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const aisanceMap = {};
      snapshot.docs.forEach((d) => {
        if (d.id === 'reflexes' || d.id === 'conducteurs') return; // Réservé aux Défis Réflexes et Conducteurs à trous
        const data = d.data();
        aisanceMap[d.id] = Array.isArray(data.stagesCompleted) ? data.stagesCompleted : [];
      });
      if (typeof callback === 'function') {
        callback(aisanceMap);
      }
    },
    (error) => {
      console.error('[aisanceService] Erreur lors de subscribeUserAisance :', error);
      if (typeof callback === 'function') {
        callback({});
      }
    }
  );
}

/**
 * Bascule l'état de complétion d'un palier pour un entraînement donné.
 * Écrit dans /users/${userId}/aisance/${trainingId} avec { merge: true }.
 *
 * @param {string} userId - Identifiant de l'utilisateur connecté
 * @param {string} trainingId - Identifiant de l'entraînement
 * @param {number} stageIndex - Index numérique du palier (0, 1, 2, ...)
 * @param {Array<number>} currentStages - Liste actuelle des paliers complétés
 * @param {string} groupId - Identifiant de l'association / groupe
 * @returns {Promise<Array<number>>} Nouvelle liste des paliers complétés
 */
export async function toggleStageCompletion(userId, trainingId, stageIndex, currentStages = [], groupId = '') {
  if (!userId || !trainingId) return [];

  const normalizedGroupId = (groupId || '').trim().toLowerCase();
  const safeCurrent = Array.isArray(currentStages) ? [...currentStages] : [];
  const numIndex = Number(stageIndex);

  const isCompleted = safeCurrent.includes(numIndex);
  const newStages = isCompleted
    ? safeCurrent.filter((idx) => idx !== numIndex)
    : [...safeCurrent, numIndex].sort((a, b) => a - b);

  const docRef = doc(db, 'users', userId, 'aisance', trainingId);

  await setDoc(
    docRef,
    {
      trainingId,
      stagesCompleted: newStages,
      lastUpdated: Date.now(),
      groupId: normalizedGroupId
    },
    { merge: true }
  );

  return newStages;
}

/**
 * Enregistre la progression d'un élève au Défi Réflexe « Temps 1 »
 * dans users/{uid}/aisance/reflexes.
 *
 * @param {string} userId - Identifiant de l'utilisateur
 * @param {Object} progress - Détails de la partie
 * @returns {Promise<void>}
 */
export async function saveReflexProgress(userId, {
  pieceId,
  pieceTitle = '',
  pupitre = '',
  score = 0,
  totalSignals = 0,
  perfectScore = false,
  groupId = ''
}) {
  if (!userId || !pieceId) return;

  const docRef = doc(db, 'users', userId, 'aisance', 'reflexes');
  const recordKey = `${pieceId}_${(pupitre || 'general').toLowerCase()}`;

  await setDoc(
    docRef,
    {
      [recordKey]: {
        pieceId,
        pieceTitle,
        pupitre,
        date: new Date().toISOString(),
        score,
        totalSignals,
        perfectScore: Boolean(perfectScore),
        lastUpdated: Date.now()
      },
      lastUpdated: Date.now(),
      groupId: (groupId || '').trim().toLowerCase()
    },
    { merge: true }
  );
}

/**
 * Écoute en temps réel les progrès aux Défis Réflexes pour un utilisateur.
 *
 * @param {string} userId - Identifiant de l'élève
 * @param {Function} callback - Reçoit les données de users/{uid}/aisance/reflexes
 * @returns {Function} Désinscription onSnapshot
 */
export function subscribeUserReflexes(userId, callback) {
  if (!userId) {
    if (typeof callback === 'function') callback({});
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'aisance', 'reflexes');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (typeof callback === 'function') {
        callback(snapshot.exists() ? snapshot.data() : {});
      }
    },
    (error) => {
      console.error('[aisanceService] Erreur lors de subscribeUserReflexes :', error);
      if (typeof callback === 'function') {
        callback({});
      }
    }
  );
}

/**
 * Enregistre la validation d'un morceau au jeu du « Conducteur à trous »
 * dans users/{uid}/aisance/conducteurs.
 *
 * @param {string} userId - Identifiant de l'élève
 * @param {Object} progress - { pieceId, pieceTitle, totalSignals, perfectScore, groupId }
 * @returns {Promise<void>}
 */
export async function saveConductorProgress(userId, {
  pieceId,
  pieceTitle = '',
  totalSignals = 0,
  perfectScore = true,
  groupId = ''
}) {
  if (!userId || !pieceId) return;

  const docRef = doc(db, 'users', userId, 'aisance', 'conducteurs');
  const recordKey = `${pieceId}_conductor`;

  await setDoc(
    docRef,
    {
      [recordKey]: {
        pieceId,
        pieceTitle,
        date: new Date().toISOString(),
        totalSignals,
        perfectScore: Boolean(perfectScore),
        lastUpdated: Date.now()
      },
      lastUpdated: Date.now(),
      groupId: (groupId || '').trim().toLowerCase()
    },
    { merge: true }
  );
}

/**
 * Écoute en temps réel les validations du jeu du « Conducteur à trous » pour un élève.
 *
 * @param {string} userId - Identifiant de l'élève
 * @param {Function} callback - Reçoit les données de users/{uid}/aisance/conducteurs
 * @returns {Function} Désinscription onSnapshot
 */
export function subscribeUserConducteurs(userId, callback) {
  if (!userId) {
    if (typeof callback === 'function') callback({});
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'aisance', 'conducteurs');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (typeof callback === 'function') {
        callback(snapshot.exists() ? snapshot.data() : {});
      }
    },
    (error) => {
      console.error('[aisanceService] Erreur lors de subscribeUserConducteurs :', error);
      if (typeof callback === 'function') {
        callback({});
      }
    }
  );
}
