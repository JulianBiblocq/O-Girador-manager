/**
 * Sceau Multi-Associations : fond « Matrice » officiel (anneau ★ O GIRADOR ★ sur parchemin chaud)
 * + logo de l'association centré dans la zone de parchemin libre.
 * Aucun cercle procédural ni texte Canvas : l'anneau et la gravure sont portés par l'image
 * `public/brandings/organizador-matrice.png` (512x512, coins transparents).
 */

export const MATRICE_SRC = '/brandings/organizador-matrice.png';

/**
 * Zone libre du parchemin, en fractions de la taille du canvas (carré).
 * Centre légèrement relevé pour laisser la gravure « O GIRADOR » intacte en bas.
 */
export const MATRICE_ZONE = Object.freeze({ cx: 0.5, cy: 0.47, box: 0.46, clipRadius: 0.3 });

let matricePromise = null;

/** Charge (et met en cache) l'image Matrice côté navigateur. Retourne null hors navigateur / en cas d'échec. */
export function loadMatriceImage(src = MATRICE_SRC) {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  if (!matricePromise) {
    matricePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { matricePromise = null; resolve(null); };
      img.src = src;
    });
  }
  return matricePromise;
}

/** Peint la Matrice en fond (repli minimal : disque parchemin uni si l'image est indisponible). */
export function drawSealMatrice(ctx, size, matriceImg) {
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

/** Centre le logo (ajustement « contain », ratio préservé) dans la zone libre du parchemin. */
export function drawSealLogoZone(ctx, size, img) {
  const { cx, cy, box, clipRadius } = MATRICE_ZONE;
  const centerX = size * cx;
  const centerY = size * cy;
  const target = size * box;
  const imgW = img.naturalWidth || img.width || target;
  const imgH = img.naturalHeight || img.height || target;
  const ratio = imgW / imgH;
  const w = ratio >= 1 ? target : target * ratio;
  const h = ratio >= 1 ? target / ratio : target;

  ctx.save();
  // Simple garde-fou : un logo opaque (fond blanc/JPEG) ne doit jamais mordre sur la gravure ni l'anneau.
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * clipRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, centerX - w / 2, centerY - h / 2, w, h);
  ctx.restore();
}
