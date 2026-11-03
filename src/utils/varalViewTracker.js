import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * Enregistre de manière idempotente la consultation d'un document du Varal
 * (1 seule écriture par couple document + adhérent).
 * Ignore les documents virtuels ou temporaires.
 *
 * @param {Object} docItem - Document ou fiche Toada/Culture du Varal
 * @param {string} [explicitUserId=null] - Identifiant de l'adhérent connecté
 */
export function recordVaralDocumentView(docItem, explicitUserId = null) {
  if (!docItem || typeof docItem !== 'object') return;

  const docId = docItem.id;
  if (!docId || typeof docId !== 'string') return;

  // Ignorer les documents virtuels projetés depuis l'Agenda ou temporaires
  if (
    docItem.isWorkshopVirtualDoc ||
    docItem.isVirtualEventMedia ||
    docId.startsWith('virtual_') ||
    docId.startsWith('temp')
  ) {
    return;
  }

  const uid = explicitUserId || auth?.currentUser?.uid;
  if (!uid) return;

  // Garde-fou 1 : déjà présent dans la carte `lectures` du document en mémoire
  if (docItem.lectures && docItem.lectures[uid]) {
    return;
  }

  // Garde-fou 2 : cache local persistant pour éviter toute écriture redondante
  const storageKey = `varal_viewed_${docId}_${uid}`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, '1');
    }
  } catch {
    // Ignorer si localStorage est indisponible
  }

  // Mise à jour atomique et silencieuse sur Firestore
  const docRef = doc(db, 'documents', docId);
  updateDoc(docRef, {
    [`lectures.${uid}`]: new Date().toISOString(),
    viewCount: increment(1)
  }).catch(() => {
    // Ignorer silencieusement si le document provient d'une autre collection ou si hors-ligne
  });
}

