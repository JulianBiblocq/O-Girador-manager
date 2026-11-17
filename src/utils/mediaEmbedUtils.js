import { isExternalCloudUrl, isFramaspaceAlbumUrl } from './cloudProviderUtils';

/**
 * Utilitaires pour analyser les URLs vidéo (YouTube, Vimeo, fichiers directs).
 */
export function getMediaEmbedInfo(url, cloudRootUrl = '') {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();

  // 1. Playlist YouTube (ex: youtube.com/playlist?list=PLBaYhFEJG6Pw1i2dneM6Vkjsll9SSv3vH)
  const playlistMatch = cleanUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (playlistMatch && cleanUrl.includes('youtube')) {
    return {
      type: 'youtube-playlist',
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}`,
      directUrl: cleanUrl
    };
  }

  // 2. Vidéo YouTube standard (watch?v=...) ou courte (youtu.be/...)
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (ytMatch) {
    return {
      type: 'youtube-video',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
      directUrl: cleanUrl
    };
  }

  // 3. Vidéo Vimeo (ex: vimeo.com/123456789)
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[3] || vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      directUrl: cleanUrl
    };
  }

  // 4. Fichier vidéo direct (MP4, WebM, Ogg)
  if (cleanUrl.match(/\.(mp4|webm|ogg|m4v)(\?.*)?$/i)) {
    return {
      type: 'video-file',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 5. Fichier audio direct (MP3, WAV, OGG, M4A)
  if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
    return {
      type: 'audio-file',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 6. Image directe
  if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
    return {
      type: 'image',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 7. Fichier PDF
  if (cleanUrl.toLowerCase().includes('.pdf')) {
    return {
      type: 'pdf',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 8. Dossier partagé Framaspace / Nextcloud reconnu (hôte vérifié + /s/TOKEN)
  if (isFramaspaceAlbumUrl(cleanUrl, cloudRootUrl)) {
    return {
      type: 'framaspace-gallery',
      embedUrl: null,
      directUrl: cleanUrl
    };
  }

  // 9. Dossier externe / Cloud Drive (Drive, Dropbox, OneDrive, kDrive) : ouverture externe
  if (isExternalCloudUrl(cleanUrl)) {
    return {
      type: 'cloud-drive',
      embedUrl: null,
      directUrl: cleanUrl
    };
  }

  return {
    type: 'web-link',
    embedUrl: null,
    directUrl: cleanUrl
  };
}
