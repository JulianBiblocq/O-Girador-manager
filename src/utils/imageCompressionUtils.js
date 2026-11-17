import imageCompression from 'browser-image-compression';

/**
 * Utilitaire de compression d'images côté client (Organizador).
 * Toutes les photos de discussion (Le Zap, messages privés, Porte-Voix) sont
 * réduites en WebP (~100-120 Ko, 1200 px max) avant l'envoi sur Firebase Storage.
 */

// Types d'images compressés ; les GIF animés et les non-images sont laissés intacts
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_SIZE_MB = 0.12;
const MAX_DIMENSION = 1200;

// Résultat mémorisé du test d'encodage WebP du navigateur
let webpEncodingSupported = null;

/**
 * Détecte si le navigateur sait encoder du WebP (les anciens Safari renvoient du PNG).
 * @returns {boolean}
 */
export const supportsWebpEncoding = () => {
  if (webpEncodingSupported !== null) return webpEncodingSupported;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpEncodingSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpEncodingSupported = false;
  }
  return webpEncodingSupported;
};

/**
 * Remplace l'extension d'un nom de fichier pour suivre le nouveau format.
 * @param {string} name - Nom d'origine
 * @param {string} mimeType - Type MIME final
 * @returns {string}
 */
const renameForMime = (name, mimeType) => {
  const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
  const base = (name || 'photo').replace(/\.[a-zA-Z0-9]+$/, '');
  return `${base}.${ext}`;
};

/**
 * Compresse une image : WebP en priorité, repli JPEG/PNG si WebP n'est pas encodable.
 * Les GIF, PDF et autres fichiers sont renvoyés tels quels.
 * En cas d'échec de compression, le fichier d'origine est conservé.
 * @param {File} file - Fichier image original
 * @returns {Promise<File>} Fichier compressé (ou original)
 */
export const compressImageClientSide = async (file) => {
  if (!file || !file.type || !COMPRESSIBLE_TYPES.includes(file.type)) return file;

  const targetType = supportsWebpEncoding()
    ? 'image/webp'
    : (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      fileType: targetType
    });
    // Garde le résultat seulement s'il est réellement plus léger que l'original
    if (compressed.size >= file.size && file.type === targetType) return file;
    const finalType = compressed.type || targetType;
    return new File([compressed], renameForMime(file.name, finalType), { type: finalType });
  } catch (err) {
    console.warn('Échec compression image, repli sur le fichier brut :', err);
    return file;
  }
};
