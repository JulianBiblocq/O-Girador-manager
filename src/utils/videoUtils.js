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

/**
 * Vérifie si une URL provenant des serveurs CDN Facebook/Instagram est expirée
 * via le paramètre de validité hexadécimal `oe=`.
 *
 * @param {string} url - URL du média distant
 * @returns {boolean} - true si l'URL est expirée et renverra un 403 Forbidden
 */
export function isExpiredFbcdnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const isFbDomain = url.includes('fbcdn.net') || url.includes('cdninstagram.com') || url.includes('facebook.com');
  if (!isFbDomain) return false;

  try {
    const match = url.match(/[?&]oe=([0-9a-fA-F]+)/);
    if (match && match[1]) {
      const expiryTimestampSec = parseInt(match[1], 16);
      const nowSec = Math.floor(Date.now() / 1000);
      return expiryTimestampSec < nowSec;
    }
  } catch {
    // En cas d'erreur de parsing, on laisse passer
  }
  return false;
}

/**
 * Résout l'URL de miniature la plus pertinente pour un événement en éliminant
 * préventivement les URLs de réseaux sociaux expirées afin d'éviter les erreurs 403 en console.
 *
 * @param {Object} event - Objet événement
 * @returns {string|null} - URL sécurisée de miniature ou null
 */
export function getValidEventThumbnailUrl(event) {
  if (!event) return null;
  const videoUrl = event.socialVideoUrl || event.videoUrl;
  const ytThumb = videoUrl ? getSocialVideoThumbnail(videoUrl) : null;
  
  const candidates = [
    event.socialThumbnailUrl,
    ytThumb,
    event.imageUrl
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
      if (!isExpiredFbcdnUrl(candidate)) {
        return candidate.trim();
      }
    }
  }

  return null;
}

/**
 * Résout une URL vidéo (YouTube, Vimeo, Google Drive, MP4 directe)
 * en URL intégrable (iframe embed) ou URL brute pour lecteur vidéo HTML5.
 *
 * @param {string} url - URL d'origine de la vidéo
 * @returns {{ type: 'youtube' | 'vimeo' | 'drive' | 'direct' | 'unknown', embedUrl: string | null }}
 */
export function getEmbedVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', embedUrl: null };
  }

  const trimmed = url.trim();

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`
    };
  }

  // 2. Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // 3. Google Drive
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // 4. Fichier vidéo direct (MP4, WebM, OGG)
  if (trimmed.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return {
      type: 'direct',
      embedUrl: trimmed
    };
  }

  // 5. Autre URL web externe
  return {
    type: 'unknown',
    embedUrl: trimmed
  };
}
