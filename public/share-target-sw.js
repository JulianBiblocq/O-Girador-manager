// Service Worker d'interception pour l'API Web Share Target (Organizador)
// Intercepte les partages entrants (POST multipart/form-data), stocke le payload
// dans IndexedDB et redirige vers /app?share-target=1.

const SHARE_DB_NAME = 'organizador_share_target';
const SHARE_STORE_NAME = 'shared_payloads';
const SHARE_RECORD_KEY = 'pending_share';

/**
 * Ouvre la base IndexedDB dédiée au partage entrant et y enregistre le payload.
 */
function saveSharedPayloadToIdb(payload) {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return resolve();
    const openReq = indexedDB.open(SHARE_DB_NAME, 1);

    openReq.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        db.createObjectStore(SHARE_STORE_NAME);
      }
    };

    openReq.onsuccess = (event) => {
      try {
        const db = event.target.result;
        const tx = db.transaction(SHARE_STORE_NAME, 'readwrite');
        tx.objectStore(SHARE_STORE_NAME).put(payload, SHARE_RECORD_KEY);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = (err) => { db.close(); reject(err); };
      } catch (err) {
        reject(err);
      }
    };

    openReq.onerror = (err) => reject(err);
  });
}

// Interception des requêtes POST issues du menu système « Partager »
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') return;

  let reqUrl;
  try {
    reqUrl = new URL(event.request.url);
  } catch {
    return;
  }

  const isShareTargetRequest =
    reqUrl.searchParams.has('share-target') ||
    reqUrl.pathname === '/share-target' ||
    reqUrl.href.includes('share-target');
  if (!isShareTargetRequest) return;

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();
        const title = String(formData.get('title') || '').trim();
        const text = String(formData.get('text') || '').trim();
        const url = String(formData.get('url') || '').trim();
        const rawFiles = formData.getAll('media') || [];
        const files = rawFiles.filter((f) => f && typeof f === 'object' && f.size > 0);
        await saveSharedPayloadToIdb({ title, text, url, files, createdAt: Date.now() });
      } catch (err) {
        console.warn('[share-target-sw] Erreur lors de la réception du partage :', err);
      }
      return Response.redirect('/app?share-target=1', 303);
    })()
  );
});
