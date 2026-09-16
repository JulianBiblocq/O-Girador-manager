/**
 * Adaptateur d'interception Firestore pour le Mode Démo
 *
 * Règle impérative : Toutes les importations d'origine se font EXCLUSIVEMENT
 * depuis '@firebase/firestore' afin d'éviter toute récursion infinie causée par l'alias Vite.
 *
 * En mode Démo (isDemoMode() === true) :
 * - Aucune requête n'atteint les serveurs de Google.
 * - Les mutations sont enregistrées dans le sessionStorage.
 * - Les écouteurs onSnapshot réagissent immédiatement aux changements locaux.
 *
 * Hors mode Démo :
 * - Délégation transparente et stricte aux fonctions officielles de @firebase/firestore.
 */

import * as realFirestore from '@firebase/firestore';
import {
  isDemoMode,
  parseFirestorePath,
  getDemoDoc,
  getDemoCollection,
  setDemoDoc,
  updateDemoDoc,
  addDemoDoc,
  deleteDemoDoc
} from './demoManager';
import { createDemoTimestamp } from '../data/demoData';

// Réexportation intégrale de l'API Firestore originale
export * from '@firebase/firestore';

/**
 * Hydrate les objets de date pour s'assurer qu'ils disposent de .toDate()
 * comme les vrais Timestamp Firestore.
 */
const hydrateDocData = (data) => {
  if (!data || typeof data !== 'object') return data;
  const copy = Array.isArray(data) ? [...data] : { ...data };

  Object.keys(copy).forEach((key) => {
    const val = copy[key];
    if (val && typeof val === 'object') {
      if (typeof val.seconds === 'number' && typeof val.toDate !== 'function') {
        val.toDate = () => new Date(val.seconds * 1000);
      } else {
        copy[key] = hydrateDocData(val);
      }
    }
  });

  return copy;
};

/**
 * Crée un DocumentSnapshot simulé conforme à l'API Firebase
 */
const createMockDocSnapshot = (docRef, data) => {
  const exists = Boolean(data);
  const hydrated = exists ? hydrateDocData(data) : undefined;
  return {
    id: docRef.id,
    ref: docRef,
    exists: () => exists,
    data: () => hydrated,
    get: (fieldPath) => hydrated?.[fieldPath]
  };
};

/**
 * Crée un QuerySnapshot simulé conforme à l'API Firebase
 */
const createMockQuerySnapshot = (queryOrColRef, docsList) => {
  const docs = (docsList || []).map((item) => {
    const hydrated = hydrateDocData(item);
    return {
      id: item.id,
      ref: {
        id: item.id,
        path: `${queryOrColRef.id || 'collection'}/${item.id}`
      },
      exists: () => true,
      data: () => hydrated,
      get: (fieldPath) => hydrated?.[fieldPath]
    };
  });

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (callback) => docs.forEach(callback),
    docChanges: () => []
  };
};

/**
 * Extrait le chemin canonique depuis une référence ou une query Firestore
 */
const getCanonicalPath = (target) => {
  if (!target) return '';
  if (typeof target.path === 'string') return target.path;
  if (target._query?.path) {
    return target._query.path.canonicalString ? target._query.path.canonicalString() : target._query.path.toString();
  }
  if (target._path?.canonicalString) return target._path.canonicalString();
  return target.id || '';
};

/**
 * Interception de onSnapshot()
 */
export const onSnapshot = (target, ...args) => {
  if (!isDemoMode()) {
    return realFirestore.onSnapshot(target, ...args);
  }

  let onNext = null;
  let onError = null;

  if (typeof args[0] === 'function') {
    onNext = args[0];
    onError = args[1];
  } else if (args[0] && typeof args[0].next === 'function') {
    onNext = args[0].next;
    onError = args[0].error;
  }

  const rawPath = getCanonicalPath(target);
  const { isDoc, collectionName, docId } = parseFirestorePath(rawPath);

  const dispatchCurrentSnapshot = () => {
    try {
      if (isDoc) {
        const data = getDemoDoc(collectionName, docId, rawPath);
        const docSnap = createMockDocSnapshot(target, data);
        if (onNext) onNext(docSnap);
      } else {
        const items = getDemoCollection(collectionName);
        const querySnap = createMockQuerySnapshot(target, items);
        if (onNext) onNext(querySnap);
      }
    } catch (err) {
      console.warn("[Mode Démo onSnapshot] Erreur dispatch :", err);
      if (onError) onError(err);
    }
  };

  // 1. Émission asynchrone immédiate du premier snapshot
  const timer = setTimeout(() => {
    dispatchCurrentSnapshot();
  }, 0);

  // 2. Écoute des mutations locales dans le sessionStorage
  const handleStateChange = () => {
    dispatchCurrentSnapshot();
  };

  window.addEventListener('ogirador_demo_state_change', handleStateChange);

  // Retourne la fonction de désabonnement
  return () => {
    clearTimeout(timer);
    window.removeEventListener('ogirador_demo_state_change', handleStateChange);
  };
};

/**
 * Interception de getDoc()
 */
export const getDoc = async (docRef) => {
  if (!isDemoMode()) {
    return realFirestore.getDoc(docRef);
  }

  const rawPath = getCanonicalPath(docRef);
  const { collectionName, docId } = parseFirestorePath(rawPath);
  const data = getDemoDoc(collectionName, docId, rawPath);
  return createMockDocSnapshot(docRef, data);
};

/**
 * Interception de getDocs()
 */
export const getDocs = async (queryOrColRef) => {
  if (!isDemoMode()) {
    return realFirestore.getDocs(queryOrColRef);
  }

  const rawPath = getCanonicalPath(queryOrColRef);
  const { collectionName } = parseFirestorePath(rawPath);
  const items = getDemoCollection(collectionName);
  return createMockQuerySnapshot(queryOrColRef, items);
};

/**
 * Interception de setDoc()
 */
export const setDoc = async (docRef, data, options = {}) => {
  if (!isDemoMode()) {
    return realFirestore.setDoc(docRef, data, options);
  }

  const rawPath = getCanonicalPath(docRef);
  const { collectionName, docId } = parseFirestorePath(rawPath);
  setDemoDoc(collectionName, docId, data, options);
  return Promise.resolve();
};

/**
 * Interception de updateDoc()
 */
export const updateDoc = async (docRef, dataOrField, ...rest) => {
  if (!isDemoMode()) {
    return realFirestore.updateDoc(docRef, dataOrField, ...rest);
  }

  const rawPath = getCanonicalPath(docRef);
  const { collectionName, docId } = parseFirestorePath(rawPath);

  let updates = {};
  if (typeof dataOrField === 'string') {
    updates[dataOrField] = rest[0];
    for (let i = 1; i < rest.length; i += 2) {
      if (rest[i] !== undefined) {
        updates[rest[i]] = rest[i + 1];
      }
    }
  } else if (typeof dataOrField === 'object' && dataOrField !== null) {
    updates = dataOrField;
  }

  updateDemoDoc(collectionName, docId, updates);
  return Promise.resolve();
};

/**
 * Interception de addDoc()
 */
export const addDoc = async (colRef, data) => {
  if (!isDemoMode()) {
    return realFirestore.addDoc(colRef, data);
  }

  const rawPath = getCanonicalPath(colRef);
  const { collectionName } = parseFirestorePath(rawPath);
  const newId = addDemoDoc(collectionName, data);

  return Promise.resolve({
    id: newId,
    path: `${collectionName}/${newId}`,
    parent: colRef
  });
};

/**
 * Interception de deleteDoc()
 */
export const deleteDoc = async (docRef) => {
  if (!isDemoMode()) {
    return realFirestore.deleteDoc(docRef);
  }

  const rawPath = getCanonicalPath(docRef);
  const { collectionName, docId } = parseFirestorePath(rawPath);
  deleteDemoDoc(collectionName, docId);
  return Promise.resolve();
};

/**
 * Interception de writeBatch()
 */
export const writeBatch = (firestoreInstance) => {
  if (!isDemoMode()) {
    return realFirestore.writeBatch(firestoreInstance);
  }

  const operations = [];

  return {
    set(docRef, data, options) {
      operations.push(() => setDoc(docRef, data, options));
      return this;
    },
    update(docRef, data, ...rest) {
      operations.push(() => updateDoc(docRef, data, ...rest));
      return this;
    },
    delete(docRef) {
      operations.push(() => deleteDoc(docRef));
      return this;
    },
    async commit() {
      for (const op of operations) {
        await op();
      }
      return Promise.resolve();
    }
  };
};

/**
 * Interception de runTransaction()
 */
export const runTransaction = async (firestoreInstance, updateFunction) => {
  if (!isDemoMode()) {
    return realFirestore.runTransaction(firestoreInstance, updateFunction);
  }

  const transaction = {
    get: async (docRef) => getDoc(docRef),
    set: (docRef, data, options) => setDoc(docRef, data, options),
    update: (docRef, data, ...rest) => updateDoc(docRef, data, ...rest),
    delete: (docRef) => deleteDoc(docRef)
  };

  return Promise.resolve(updateFunction(transaction));
};
