/**
 * Utilitaires pour la gestion et l'extraction des médias vidéo (YouTube, etc.)
 */

/**
 * Extrait l'identifiant unique d'une vidéo YouTube à partir de n'importe quel format d’URL
 * @param {string} url - L'URL du lien vidéo (YouTube, Shorts, embed...)
 * @returns {string|null} - L'identifiant à 11 caractères YouTube ou null
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}

/**
 * Génère l'URL de la miniature haute qualité pour une vidéo (YouTube ou fallback)
 * @param {string} videoUrl - L'URL source de la vidéo
 * @returns {string|null} - L'URL de la miniature d'illustration
 */
export function getSocialVideoThumbnail(videoUrl) {
  if (!videoUrl) return null;
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}
