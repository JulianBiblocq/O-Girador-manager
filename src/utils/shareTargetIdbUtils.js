/**
 * Utilitaires IndexedDB et d'analyse de texte/URL pour la Web Share Target API (Organizador).
 */

export const SHARE_DB_NAME = 'organizador_share_target';
export const SHARE_STORE_NAME = 'shared_payloads';
export const SHARE_RECORD_KEY = 'pending_share';

/**
 * Détecte proprement une URL (ex: YouTube, WhatsApp, site web) glissée à l'intérieur
 * du champ `text` par le système de partage mobile, et sépare le texte d'accompagnement.
 *
 * @param {string} [rawText=''] - Texte brut partagé
 * @param {string} [rawUrl=''] - URL brute partagée
 * @returns {{ cleanText: string, extractedUrl: string, isYouTube: boolean }}
 */
export function extractUrlFromSharedText(rawText = '', rawUrl = '') {
  const initialText = String(rawText || '').trim();
  const explicitUrl = String(rawUrl || '').trim();
  const matches = initialText.match(/https?:\/\/[^\s<>"']+/gi) || [];

  let extractedUrl = explicitUrl;
  let rawMatchedToken = explicitUrl;
  if (!extractedUrl && matches.length > 0) {
    rawMatchedToken = matches[0];
    extractedUrl = rawMatchedToken.replace(/[.,;:!?)]+$/, '');
  }

  let cleanText = initialText;
  if (extractedUrl) {
    cleanText = cleanText
      .replace(rawMatchedToken || extractedUrl, '')
      .replace(extractedUrl, '')
      .trim()
      .replace(/[\s\-–—:]+$/, '')
      .trim();
  }

  const isYouTube = Boolean(
    extractedUrl && /(?:youtube(?:-nocookie)?\.com|youtu\.be)\//i.test(extractedUrl)
  );

  return { cleanText, extractedUrl, isYouTube };
}

/**
 * Lit l'objet de partage en attente depuis IndexedDB (`organizador_share_target`).
 * @returns {Promise<Object|null>}
 */
export function readSharedPayloadFromIdb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const openReq = indexedDB.open(SHARE_DB_NAME, 1);
      openReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
          db.createObjectStore(SHARE_STORE_NAME);
        }
      };
      openReq.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const tx = db.transaction(SHARE_STORE_NAME, 'readonly');
          const getReq = tx.objectStore(SHARE_STORE_NAME).get(SHARE_RECORD_KEY);
          getReq.onsuccess = () => { db.close(); resolve(getReq.result || null); };
          getReq.onerror = () => { db.close(); resolve(null); };
        } catch { resolve(null); }
      };
      openReq.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

/**
 * Purge l'objet de partage en attente dans IndexedDB après traitement ou fermeture.
 * @returns {Promise<void>}
 */
export function clearSharedPayloadFromIdb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve();
    try {
      const openReq = indexedDB.open(SHARE_DB_NAME, 1);
      openReq.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const tx = db.transaction(SHARE_STORE_NAME, 'readwrite');
          tx.objectStore(SHARE_STORE_NAME).delete(SHARE_RECORD_KEY);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
        } catch { resolve(); }
      };
      openReq.onerror = () => resolve();
    } catch { resolve(); }
  });
}
