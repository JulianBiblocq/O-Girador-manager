/**
 * Moteur de gestion du Mode Démo (In-Memory / SessionStorage)
 * Assure la manipulation des données locales pour Maracatu Na Chuva
 * sans aucun contact avec les serveurs Firebase Firestore.
 */

import { INITIAL_DEMO_DATA, DEMO_GROUP_ID, createDemoTimestamp } from '../data/demoData';

const DEMO_ACTIVE_KEY = 'ogirador_demo_active';
const DEMO_STATE_KEY = 'ogirador_demo_state';
const DEMO_VERSION_KEY = 'ogirador_demo_version';
const DEMO_CURRENT_VERSION = 'v7_vitrine';
const DEMO_EVENT_NAME = 'ogirador_demo_state_change';

/**
 * Détecte si le mode démo est actuellement actif
 * (soit via l'URL /demo, ?demo=true ou via la session active en sessionStorage).
 */
export const isDemoMode = () => {
  if (typeof window === 'undefined') return false;

  try {
    const pathname = window.location.pathname || '';
    const searchParams = new URLSearchParams(window.location.search || '');

    // Désactivation explicite du mode démo
    if (searchParams.get('demo') === 'false' || searchParams.get('mode') === 'real') {
      sessionStorage.removeItem(DEMO_ACTIVE_KEY);
      sessionStorage.removeItem(DEMO_STATE_KEY);
      sessionStorage.removeItem(DEMO_VERSION_KEY);
      return false;
    }

    // Le mode démo est actif uniquement sur les routes /demo ou avec ?demo=true ou ?mode=demo
    if (
      pathname === '/demo' ||
      pathname === '/demo/' ||
      pathname.startsWith('/demo/') ||
      searchParams.get('demo') === 'true' ||
      searchParams.get('mode') === 'demo'
    ) {
      if (sessionStorage.getItem(DEMO_ACTIVE_KEY) !== 'true') {
        sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
      }
      return true;
    }

    // Si on navigue sur l'application normale (hors /demo et sans ?demo=true),
    // nettoyer impérativement le drapeau pour ne pas piéger l'utilisateur dans la démo
    if (sessionStorage.getItem(DEMO_ACTIVE_KEY) === 'true') {
      sessionStorage.removeItem(DEMO_ACTIVE_KEY);
      sessionStorage.removeItem(DEMO_STATE_KEY);
      sessionStorage.removeItem(DEMO_VERSION_KEY);
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Utilisateur Firebase Auth simulé pour le Mestre
 */
export const getDemoAuthUser = () => ({
  uid: 'demo_mestre_nachuva',
  email: 'mestre@maracatu-nachuva.bzh',
  displayName: 'Mestre da Ria',
  photoURL: '/Pictures/tambour.png',
  isAnonymous: false,
  emailVerified: true
});

/**
 * Profil complet simulé pour Mestre da Ria
 */
export const getDemoProfileData = () => {
  const mestre = INITIAL_DEMO_DATA.users.find((u) => u.id === 'demo_mestre_nachuva');
  return mestre ? JSON.parse(JSON.stringify(mestre)) : null;
};

/**
 * Récupère l'état complet du bac à sable depuis le sessionStorage
 */
export const getDemoState = () => {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  }

  try {
    const savedVersion = sessionStorage.getItem(DEMO_VERSION_KEY);
    const raw = sessionStorage.getItem(DEMO_STATE_KEY);

    // Si pas de données ou version obsolète (ex: ancien jeu de 6 membres), réinitialiser avec les 18+ profils
    if (!raw || savedVersion !== DEMO_CURRENT_VERSION) {
      const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
      sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(initial));
      sessionStorage.setItem(DEMO_VERSION_KEY, DEMO_CURRENT_VERSION);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Mode Démo - Erreur lecture sessionStorage, réinitialisation :", err);
    const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    try {
      sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(initial));
      sessionStorage.setItem(DEMO_VERSION_KEY, DEMO_CURRENT_VERSION);
    } catch {}
    return initial;
  }
};

/**
 * Enregistre un nouvel état dans le sessionStorage et émet l'événement de mise à jour
 */
export const saveDemoState = (newState) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(newState));
    sessionStorage.setItem(DEMO_VERSION_KEY, DEMO_CURRENT_VERSION);
    window.dispatchEvent(new CustomEvent(DEMO_EVENT_NAME, { detail: newState }));
  } catch (err) {
    console.error("Mode Démo - Erreur écriture sessionStorage :", err);
  }
};

/**
 * Initialise la session du mode démo
 * Écrase tout résidu de session précédente si les données sont obsolètes
 */
export const initDemoSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
  const savedVersion = sessionStorage.getItem(DEMO_VERSION_KEY);
  if (!sessionStorage.getItem(DEMO_STATE_KEY) || savedVersion !== DEMO_CURRENT_VERSION) {
    saveDemoState(JSON.parse(JSON.stringify(INITIAL_DEMO_DATA)));
  }
};

/**
 * Réinitialise les données du bac à sable avec les données factices initiales
 */
export const resetDemoData = () => {
  if (typeof window === 'undefined') return;
  const initial = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  saveDemoState(initial);
  console.log("[Mode Démo] Données réinitialisées avec succès (version 18 profils).");
};

/**
 * Quitte le mode démo et redirige vers l'accueil de connexion standard
 */
export const exitDemoMode = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DEMO_ACTIVE_KEY);
    sessionStorage.removeItem(DEMO_STATE_KEY);
    sessionStorage.removeItem(DEMO_VERSION_KEY);
  } catch {}
  window.location.href = '/login';
};

// ============================================================================
// OPÉRATIONS CRUD FACTICES POUR LES ADAPTATEURS FIRESTORE
// ============================================================================

/**
 * Décompose un chemin de document ou collection (ex: 'events/demo_1' ou 'events')
 */
export const parseFirestorePath = (pathString) => {
  const cleanPath = (pathString || '').replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const isDoc = segments.length % 2 === 0;
  const collectionName = segments[segments.length - (isDoc ? 2 : 1)] || 'unknown';
  const docId = isDoc ? segments[segments.length - 1] : null;
  return { cleanPath, segments, isDoc, collectionName, docId };
};

/**
 * Récupère un document unique depuis l'état démo
 */
export const getDemoDoc = (collectionName, docId, rawPath = '') => {
  const state = getDemoState();
  let collection = Array.isArray(state[collectionName]) ? state[collectionName] : [];

  // Repli automatique sur alias de collections
  if (collection.length === 0) {
    if (collectionName === 'treasury' && Array.isArray(state.transactions)) {
      collection = state.transactions;
    } else if (collectionName === 'transactions' && Array.isArray(state.treasury)) {
      collection = state.treasury;
    } else if (collectionName === 'varal' && Array.isArray(state.documents)) {
      collection = state.documents;
    } else if (collectionName === 'documents' && Array.isArray(state.varal)) {
      collection = state.varal;
    }
  }

  // Prise en charge des sous-collections de parcours utilisateur (users/{userId}/parcours/{groupId})
  if (collectionName === 'parcours' && rawPath) {
    const clean = rawPath.replace(/^\/+|\/+$/g, '');
    const segments = clean.split('/').filter(Boolean);
    if (segments.length >= 4 && segments[0] === 'users' && segments[2] === 'parcours') {
      const compositeId = `${segments[1]}_${segments[3]}`;
      const foundComposite = collection.find((item) => item.id === compositeId);
      if (foundComposite) return JSON.parse(JSON.stringify(foundComposite));
    }
  }

  let found = collection.find((item) => item.id === docId);
  // Deuxième tentative pour la collection parcours
  if (!found && collectionName === 'parcours') {
    found = collection.find((item) => item.id?.endsWith(`_${docId}`) || item.groupId === docId);
  }

  return found ? JSON.parse(JSON.stringify(found)) : null;
};

/**
 * Récupère une collection complète depuis l'état démo
 */
export const getDemoCollection = (collectionName) => {
  const state = getDemoState();
  let collection = Array.isArray(state[collectionName]) ? state[collectionName] : [];

  // Repli automatique sur alias de collections
  if (collection.length === 0) {
    if (collectionName === 'treasury' && Array.isArray(state.transactions)) {
      collection = state.transactions;
    } else if (collectionName === 'transactions' && Array.isArray(state.treasury)) {
      collection = state.treasury;
    } else if (collectionName === 'varal' && Array.isArray(state.documents)) {
      collection = state.documents;
    } else if (collectionName === 'documents' && Array.isArray(state.varal)) {
      collection = state.varal;
    }
  }

  return JSON.parse(JSON.stringify(collection));
};

/**
 * Définit ou remplace un document dans l'état démo
 */
export const setDemoDoc = (collectionName, docId, data, options = {}) => {
  const state = getDemoState();
  if (!Array.isArray(state[collectionName])) {
    state[collectionName] = [];
  }

  const existingIdx = state[collectionName].findIndex((item) => item.id === docId);
  const cleanData = JSON.parse(JSON.stringify(data));

  if (existingIdx >= 0) {
    if (options.merge) {
      state[collectionName][existingIdx] = {
        ...state[collectionName][existingIdx],
        ...cleanData,
        id: docId
      };
    } else {
      state[collectionName][existingIdx] = { ...cleanData, id: docId };
    }
  } else {
    state[collectionName].push({ ...cleanData, id: docId });
  }

  saveDemoState(state);
};

/**
 * Met à jour partiellement un document (avec gestion des clés imbriquées ex: 'attendees.userId')
 */
export const updateDemoDoc = (collectionName, docId, updates) => {
  const state = getDemoState();
  if (!Array.isArray(state[collectionName])) {
    state[collectionName] = [];
  }

  const existingIdx = state[collectionName].findIndex((item) => item.id === docId);
  if (existingIdx === -1) {
    // Si le document n'existe pas encore, on le crée
    setDemoDoc(collectionName, docId, updates, { merge: true });
    return;
  }

  const targetDoc = { ...state[collectionName][existingIdx] };

  // Traiter chaque champ en gérant la notation pointée (ex: "attendees.demo_user")
  Object.keys(updates).forEach((key) => {
    const val = updates[key];
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = targetDoc;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
    } else {
      targetDoc[key] = val;
    }
  });

  state[collectionName][existingIdx] = targetDoc;
  saveDemoState(state);
};

/**
 * Ajoute un nouveau document avec un identifiant généré
 */
export const addDemoDoc = (collectionName, data) => {
  const state = getDemoState();
  if (!Array.isArray(state[collectionName])) {
    state[collectionName] = [];
  }

  const newId = `demo_${collectionName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanData = JSON.parse(JSON.stringify(data));
  const newDoc = {
    ...cleanData,
    id: newId,
    createdAt: createDemoTimestamp(new Date().toISOString())
  };

  state[collectionName].push(newDoc);
  saveDemoState(state);
  return newId;
};

/**
 * Supprime un document de l'état démo
 */
export const deleteDemoDoc = (collectionName, docId) => {
  const state = getDemoState();
  if (!Array.isArray(state[collectionName])) return;

  state[collectionName] = state[collectionName].filter((item) => item.id !== docId);
  saveDemoState(state);
};
