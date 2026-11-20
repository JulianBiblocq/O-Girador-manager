/**
 * Sceau Multi-Associations : matrices officielles O Girador (anneau ★ O GIRADOR ★ sur parchemin chaud)
 * + logo de l'association centré dans la zone de parchemin libre.
 * - `organizador-matrice.png` (512x512, coins transparents) : variante `purpose: "any"`, favicon PC et OpenGraph.
 * - `organizador-matrice-maskable.png` (512x512, carré 100 % opaque `#8B2A1A` calibré à ~84 %) : variante `purpose: "maskable"` Android.
 */

export const MATRICE_SRC = '/brandings/organizador-matrice.png';
export const MATRICE_MASKABLE_SRC = '/brandings/organizador-matrice-maskable.png';
export const MASKABLE_BG_HEX = '#8B2A1A';
export const MASKABLE_BG_RGB = Object.freeze([139, 42, 26]);

/** Facteur homothétique exact entre le médaillon maskable (430 px) et le canevas 512x512 (~84 %). */
export const MATRICE_MASKABLE_SCALE = 430 / 512;

/** Zone libre du parchemin pour la variante détourée `any` (en fractions du carré). */
export const MATRICE_ZONE = Object.freeze({
  cx: 0.5,
  cy: 0.47,
  box: 0.46,
  clipRadius: 0.3
});

/** Zone libre du parchemin pour la variante `maskable` (calibrée sur le médaillon ~84 % centré). */
export const MATRICE_MASKABLE_ZONE = Object.freeze({
  cx: 0.5,
  cy: 0.5 + (MATRICE_ZONE.cy - 0.5) * MATRICE_MASKABLE_SCALE,
  box: MATRICE_ZONE.box * MATRICE_MASKABLE_SCALE,
  clipRadius: MATRICE_ZONE.clipRadius * MATRICE_MASKABLE_SCALE
});

const matriceCache = new Map();

/** Charge (et met en cache par URL) une image Matrice côté navigateur. Retourne null hors navigateur / échec. */
export function loadMatriceImage(src = MATRICE_SRC) {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  const key = src || MATRICE_SRC;
  if (!matriceCache.has(key)) {
    const promise = new Promise((resolve) => {
      const img = new Image();
      if (/^https?:\/\//i.test(key)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        matriceCache.delete(key);
        resolve(null);
      };
      img.src = key;
    });
    matriceCache.set(key, promise);
  }
  return matriceCache.get(key);
}

/**
 * Peint la Matrice en fond :
 * - `maskable: false` (défaut) : coins 100 % transparents (`clearRect`).
 * - `maskable: true` : aplat intégral `#8B2A1A` jusqu'aux 4 coins avant dessin de la matrice maskable.
 */
export function drawSealMatrice(ctx, size, matriceImg, options = {}) {
  const isMaskable = Boolean(options?.maskable);
  if (isMaskable) {
    ctx.fillStyle = MASKABLE_BG_HEX;
    ctx.fillRect(0, 0, size, size);
    if (matriceImg) {
      ctx.drawImage(matriceImg, 0, 0, size, size);
      return;
    }
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (size * MATRICE_MASKABLE_SCALE) / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#f4ecd8';
    ctx.fill();
    return;
  }

  ctx.clearRect(0, 0, size, size);
  if (matriceImg) {
    ctx.drawImage(matriceImg, 0, 0, size, size);
    return;
  }
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = '#f4ecd8';
  ctx.fill();
}

/** Centre le logo (ajustement « contain », ratio préservé) dans la zone libre du parchemin (`any` ou `maskable`). */
export function drawSealLogoZone(ctx, size, img, options = {}) {
  const zone = options?.maskable ? MATRICE_MASKABLE_ZONE : MATRICE_ZONE;
  const centerX = size * zone.cx;
  const centerY = size * zone.cy;
  const target = size * zone.box;
  const imgW = img.naturalWidth || img.width || target;
  const imgH = img.naturalHeight || img.height || target;
  const ratio = imgW / imgH;
  const w = ratio >= 1 ? target : target * ratio;
  const h = ratio >= 1 ? target / ratio : target;

  ctx.save();
  // Garde-fou : un logo opaque (fond blanc/JPEG) ne doit jamais mordre sur la gravure ni l'anneau.
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * zone.clipRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, centerX - w / 2, centerY - h / 2, w, h);
  ctx.restore();
}

/** Garantit mathématiquement alpha = 255 sur chaque pixel d'un canvas maskable (aplat `#8B2A1A` sous toute semi-transparence). */
export function enforceOpaqueMaskableCanvas(ctx, size) {
  if (!ctx || typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') return;
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;
  const [bgR, bgG, bgB] = MASKABLE_BG_RGB;
  let mutated = false;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 255) {
      const alpha = a / 255;
      d[i] = Math.round(d[i] * alpha + bgR * (1 - alpha));
      d[i + 1] = Math.round(d[i + 1] * alpha + bgG * (1 - alpha));
      d[i + 2] = Math.round(d[i + 2] * alpha + bgB * (1 - alpha));
      d[i + 3] = 255;
      mutated = true;
    }
  }
  if (mutated) ctx.putImageData(imgData, 0, 0);
}
