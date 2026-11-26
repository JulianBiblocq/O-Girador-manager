import imageCompression from 'browser-image-compression';

/** Compression et conversion d'images côté client (Organizador : Porte-Voix & Le Zap, inclut HEIC/HEIF iOS). */
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const EXT_TO_MIME = { heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const MAX_SIZE_MB = 0.12;
const MAX_DIMENSION = 1200;
let webpEncodingSupported = null;

/** Détecte si le navigateur sait réellement encoder en WebP (repli JPEG/PNG sur anciens Safari). */
export const supportsWebpEncoding = () => {
  if (webpEncodingSupported !== null) return webpEncodingSupported;
  try {
    const c = Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
    webpEncodingSupported = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch { webpEncodingSupported = false; }
  return webpEncodingSupported;
};

/** Résout le type MIME compressible (inclut HEIC/HEIF et extensions quand file.type est vide sur iOS). */
export const resolveCompressibleMime = (file) => {
  if (!file) return null;
  const raw = (file.type || '').toLowerCase().trim();
  if (COMPRESSIBLE_TYPES.includes(raw)) return raw === 'image/jpg' ? 'image/jpeg' : raw;
  const ext = ((file.name || '').toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  if (!raw && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  return raw === 'application/octet-stream' && (ext === 'heic' || ext === 'heif') ? EXT_TO_MIME[ext] : null;
};

const renameForMime = (name, mimeType) => {
  const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
  return `${(name || 'photo').replace(/\.[a-zA-Z0-9]+$/, '') || 'photo'}.${ext}`;
};

/** Décode via le moteur natif (Image / createImageBitmap) et exporte en WebP avec repli JPEG. */
const decodeViaCanvas = async (file, preferredMime) => {
  let source = null;
  const url = typeof Image !== 'undefined' && typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
  try {
    if (url) {
      source = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
      }).catch(() => (typeof createImageBitmap === 'function' ? createImageBitmap(file) : null));
    } else if (typeof createImageBitmap === 'function') {
      source = await createImageBitmap(file);
    }
    if (!source) return null;
    const w = source.naturalWidth || source.width;
    const h = source.naturalHeight || source.height;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h, 1));
    const c = Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) });
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(source, 0, 0, c.width, c.height);
    let blob = await new Promise((r) => c.toBlob(r, preferredMime, 0.82));
    if ((!blob || blob.type !== preferredMime) && preferredMime === 'image/webp') blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
    c.width = 0; c.height = 0;
    return blob && /^image\/(webp|jpeg|png)$/.test(blob.type) ? blob : null;
  } finally {
    if (url) URL.revokeObjectURL(url);
    if (source?.close) source.close();
  }
};

/** Compresse et convertit une image (HEIC/HEIF forcé en WebP/JPEG) ; laisse GIF/PDF intacts. */
export const compressImageClientSide = async (file) => {
  const sourceMime = resolveCompressibleMime(file);
  if (!sourceMime) return file;
  const isHeic = sourceMime === 'image/heic' || sourceMime === 'image/heif';
  const targetType = supportsWebpEncoding() ? 'image/webp' : (sourceMime === 'image/png' ? 'image/png' : 'image/jpeg');
  let fallback = file;
  try {
    let working = file.type === sourceMime ? file : new File([file], file.name || 'photo', { type: sourceMime, lastModified: file.lastModified });
    if (isHeic) {
      const blob = await decodeViaCanvas(working, targetType).catch(() => null);
      if (blob) {
        working = new File([blob], renameForMime(file.name, blob.type), { type: blob.type });
        fallback = working;
        if (working.size <= MAX_SIZE_MB * 1024 * 1024) return working;
      }
    }
    const desiredType = working.type === 'image/jpeg' && isHeic ? 'image/jpeg' : targetType;
    const compressed = await imageCompression(working, { maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION, useWebWorker: !isHeic, fileType: desiredType });
    if (!isHeic && file.type && compressed.size >= file.size && sourceMime === desiredType) return file;
    const finalType = /^image\/(webp|jpeg|png)$/.test(compressed.type) ? compressed.type : desiredType;
    return new File([compressed], renameForMime(file.name, finalType), { type: finalType });
  } catch (err) {
    console.warn('Échec compression image, repli :', err);
    return fallback;
  }
};
