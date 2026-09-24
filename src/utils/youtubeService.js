/**
 * Service de communication avec l'API YouTube Data v3 (playlistItems.list)
 * avec mise en cache mémoire et sessionStorage pour préserver les quotas API.
 */

// Cache mémoire local de session pour éviter toute requête redondante
const MEMORY_CACHE = new Map();

/**
 * Récupère les vidéos d'une playlist YouTube via l'API Data v3.
 *
 * @param {string} playlistId - Identifiant YouTube de la playlist (ex: PL...)
 * @param {string} apiKey - Clé API YouTube Data v3
 * @returns {Promise<Array<{ videoId: string, title: string, publishedAt: string, thumbnail: string, url: string }>>}
 */
export async function fetchPlaylistVideos(playlistId, apiKey) {
  if (!playlistId) return [];

  // 1. Vérification du cache mémoire
  if (MEMORY_CACHE.has(playlistId)) {
    return MEMORY_CACHE.get(playlistId);
  }

  // 2. Vérification du sessionStorage du navigateur
  try {
    const cachedSession = sessionStorage.getItem(`yt_cache_${playlistId}`);
    if (cachedSession) {
      const parsed = JSON.parse(cachedSession);
      if (Array.isArray(parsed) && parsed.length > 0) {
        MEMORY_CACHE.set(playlistId, parsed);
        return parsed;
      }
    }
  } catch (err) {
    // sessionStorage indisponible ou désactivé
  }

  // 3. Validation de la clé API
  const effectiveKey = apiKey || import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
  if (!effectiveKey) {
    throw new Error("Clé API YouTube manquante (VITE_YOUTUBE_API_KEY). Veuillez la renseigner dans l'environnement.");
  }

  // 4. Appel réseau vers l'endpoint YouTube Data v3
  const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(effectiveKey)}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson?.error?.message || `Erreur YouTube API (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();

  // 5. Normalisation et assainissement des éléments (élimination des vidéos privées ou supprimées)
  const items = (data.items || [])
    .map((item) => {
      const snippet = item?.snippet;
      const videoId = snippet?.resourceId?.videoId;
      const title = snippet?.title;

      if (!videoId || title === 'Private video' || title === 'Deleted video') {
        return null;
      }

      const thumbnail =
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId,
        title,
        publishedAt: snippet?.publishedAt || '',
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    })
    .filter(Boolean);

  // 6. Mise en cache
  MEMORY_CACHE.set(playlistId, items);
  try {
    sessionStorage.setItem(`yt_cache_${playlistId}`, JSON.stringify(items));
  } catch (err) {
    // Quota sessionStorage dépassé ou bloqué
  }

  return items;
}
