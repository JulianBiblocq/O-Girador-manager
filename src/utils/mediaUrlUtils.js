/**
 * Utilitaires pour la gestion et la validation des URLs multimédias
 * (dépôt Framaspace/Nextcloud et restitution YouTube).
 */

/**
 * Valide si une chaîne est une URL HTTP/HTTPS bien formée.
 * Écarte les protocoles non sécurisés ou invalides (ex: javascript:).
 *
 * @param {string} urlString - URL à tester
 * @returns {boolean} - true si l'URL est valide
 */
export function isValidHttpUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extrait strictement l'identifiant YouTube de 11 caractères à partir de divers formats d'URL :
 * - youtube.com/watch?v=ID (avec ou sans paramètres supplémentaires : ?si=..., &t=..., &feature=shared)
 * - youtu.be/ID (liens courts de partage)
 * - youtube.com/shorts/ID (YouTube Shorts)
 * - youtube.com/embed/ID
 *
 * @param {string} url - URL YouTube brute
 * @returns {string|null} - Identifiant unique de 11 caractères ou null si invalide
 */
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Cas 1 : Saisie directe d'un identifiant YouTube de 11 caractères
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Cas 2 : Analyse des différents formats d'URL et partages (classique, live, shorts, embed, v, youtu.be)
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}

/**
 * Extrait l'identifiant d'une playlist YouTube à partir de n'importe quel format d'URL.
 *
 * @param {string} url - URL YouTube brute
 * @returns {string|null} - Identifiant de la playlist ou null
 */
export function extractYouTubePlaylistId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Analyse une URL YouTube et renvoie sa structure (vidéo seule, playlist seule ou vidéo dans une playlist).
 *
 * @param {string} url - URL YouTube brute
 * @returns {{
 *   isValid: boolean,
 *   videoId: string|null,
 *   playlistId: string|null,
 *   isPlaylistOnly: boolean,
 *   isVideoWithPlaylist: boolean,
 *   isSingleVideo: boolean,
 *   embedUrl: string|null,
 *   directUrl: string
 * } | null}
 */
export function parseYouTubeMedia(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const playlistId = extractYouTubePlaylistId(trimmed);
  const videoId = extractYouTubeVideoId(trimmed);

  if (!videoId && !playlistId) {
    return null;
  }

  const isPlaylistOnly = Boolean(playlistId && !videoId);
  const isVideoWithPlaylist = Boolean(videoId && playlistId);
  const isSingleVideo = Boolean(videoId && !playlistId);

  let embedUrl = null;
  if (isPlaylistOnly) {
    embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;
  } else if (videoId) {
    const listParam = playlistId ? `?list=${encodeURIComponent(playlistId)}` : '';
    embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}${listParam}`;
  }

  return {
    isValid: true,
    videoId,
    playlistId,
    isPlaylistOnly,
    isVideoWithPlaylist,
    isSingleVideo,
    isPlaylist: Boolean(playlistId),
    embedUrl,
    directUrl: trimmed
  };
}

/**
 * Résout l'URL effective de dépôt Framaspace avec cascade de repli :
 * 1. Champ dropUrl spécifique de l'événement
 * 2. Champ historique lienDepotMedias de l'événement
 * 3. URL de dépôt par défaut de l'association (defaultDropUrl)
 *
 * @param {string} [dropUrl] - URL spécifique de l'événement
 * @param {string} [lienDepotMedias] - URL historique de l'événement
 * @param {string} [defaultDropUrl] - URL par défaut configurée au niveau de l'association
 * @returns {string} - URL finale résolue ou chaîne vide si invalide
 */
export function resolveEffectiveDropUrl(dropUrl, lienDepotMedias, defaultDropUrl) {
  if (isValidHttpUrl(dropUrl)) return dropUrl.trim();
  if (isValidHttpUrl(lienDepotMedias)) return lienDepotMedias.trim();
  if (isValidHttpUrl(defaultDropUrl)) return defaultDropUrl.trim();
  return '';
}
