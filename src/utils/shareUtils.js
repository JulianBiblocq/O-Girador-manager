/**
 * Utilitaires de partage et génération dynamique du Sceau Combiné O Girador × Association.
 * Conforme aux règles d'architecture Cordel et d'isolation de thème.
 */

import { canonicalizeGroupId } from './tenantUtils.js';
import {
  MATRICE_SRC,
  MATRICE_MASKABLE_SRC,
  MATRICE_MASKABLE_SCALE,
  MATRICE_ZONE,
  MATRICE_MASKABLE_ZONE,
  loadMatriceImage,
  drawSealMatrice,
  drawSealLogoZone,
  enforceOpaqueMaskableCanvas
} from './sealMatrice.js';
export {
  uploadCombinedSealToStorage,
  uploadDualCombinedSealsToStorage,
  ensureDualCombinedSealsIfMissing
} from './sealStorageSync.js';

/**
 * Construit les chemins Firebase Storage standardisés pour les variantes `any` et `maskable` d'une association.
 */
export function getCombinedSealStoragePaths(groupId) {
  return {
    anyPrimary: `brandings/${groupId}/combined-logo.png`,
    anyMirror: `associations/${groupId}/brandings/combined-logo.png`,
    maskablePrimary: `brandings/${groupId}/combined-logo-maskable.png`,
    maskableMirror: `associations/${groupId}/brandings/combined-logo-maskable.png`
  };
}

/**
 * Extrait les initiales d'un nom d'association (ex: "Samb'à Bulles" -> "SB", "Baque do Sol" -> "BS").
 */
export function getAssociationInitials(name = '') {
  const cleanName = (name || '').trim();
  if (!cleanName) return 'OG';

  const allWords = cleanName.split(/[\s'’-]+/).filter(Boolean);
  const significantWords = allWords.filter(w => !/^(a|à|de|du|des|d|l|la|le|o|do|da|e|en)$/i.test(w));
  const words = significantWords.length >= 2 ? significantWords : allWords;

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const clean = cleanName.replace(/[^a-zA-Z0-9]/g, '');
  return clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : (clean || 'OG').toUpperCase();
}

/**
 * Peint le fond officiel « Matrice » O Girador (`any` détouré ou `maskable` plein `#8B2A1A`) sur un contexte Canvas.
 */
export function drawSealNeutralFrame(ctx, size = 512, matriceImg = null, options = {}) {
  drawSealMatrice(ctx, size, matriceImg, options);
}

/**
 * Centre le logo de l'association dans la zone de parchemin libre de la Matrice (`any` ou `maskable`).
 */
export function drawSealLogoCenter(ctx, size = 512, img, options = {}) {
  drawSealLogoZone(ctx, size, img, options);
}

/**
 * Dessine les initiales artistiques au centre en cas d'absence de logo image.
 */
export function drawSealInitialsCenter(ctx, size = 512, name = '', primaryCol = '#8B2A1A', options = {}) {
  const isMaskable = Boolean(options?.maskable);
  const zone = isMaskable ? MATRICE_MASKABLE_ZONE : MATRICE_ZONE;
  const scale = (size / 512) * (isMaskable ? MATRICE_MASKABLE_SCALE : 1);
  const cx = size / 2;
  const innerCy = size * zone.cy;
  const initials = getAssociationInitials(name);

  ctx.save();
  const fontSize = Math.round(84 * scale);
  ctx.font = `bold ${fontSize}px "Cinzel Decorative", "Courier New", Georgia, serif`;
  ctx.fillStyle = primaryCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, cx, innerCy + 4 * scale);
  ctx.restore();
}

/**
 * Crée un élément Canvas vierge adapté au runtime (Navigateur ou Node.js si fourni).
 */
function createCompatibleCanvas(size, customCanvasFactory = null) {
  if (customCanvasFactory) return customCanvasFactory(size, size);
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    return c;
  }
  return null;
}

/**
 * Génère le Canvas du Sceau Combiné O Girador × Association (`any` détouré par défaut, ou `maskable` carré `#8B2A1A`).
 */
export async function generateCombinedSealCanvas(associationData = {}, options = {}) {
  const size = options.size || 512;
  const isMaskable = Boolean(options.maskable);
  const canvas = createCompatibleCanvas(size, options.canvasFactory);
  if (!canvas) {
    throw new Error("Impossible d'initialiser le Canvas : environnement non supporté.");
  }

  const ctx = canvas.getContext('2d');
  const branding = associationData?.branding || {};
  const primaryCol = branding.colors?.primary || '#8B2A1A';
  const name = associationData?.nom || associationData?.name || associationData?.associationName || '';
  const logoUrl = branding.logoUrl || associationData?.logoUrl || null;

  // 1. Fond Matrice officiel (`organizador-matrice.png` ou `organizador-matrice-maskable.png`)
  const targetMatriceSrc = isMaskable ? MATRICE_MASKABLE_SRC : MATRICE_SRC;
  const matriceImg = options.matriceImage || await loadMatriceImage(targetMatriceSrc);
  drawSealNeutralFrame(ctx, size, matriceImg, { maskable: isMaskable });

  // 2. Si un logo image est configuré, le centrer dans le parchemin intérieur
  if (logoUrl) {
    try {
      await new Promise((resolve) => {
        const img = (typeof window !== 'undefined' && window.Image)
          ? new window.Image()
          : (options.imageFactory ? options.imageFactory() : null);

        if (!img) {
          drawSealInitialsCenter(ctx, size, name, primaryCol, { maskable: isMaskable });
          return resolve();
        }

        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            drawSealLogoCenter(ctx, size, img, { maskable: isMaskable });
          } catch {
            drawSealInitialsCenter(ctx, size, name, primaryCol, { maskable: isMaskable });
          }
          resolve();
        };
        img.onerror = () => {
          drawSealInitialsCenter(ctx, size, name, primaryCol, { maskable: isMaskable });
          resolve();
        };

        const safeSrc = (logoUrl.startsWith('data:') || logoUrl.startsWith('blob:'))
          ? logoUrl
          : (logoUrl.includes('?') ? `${logoUrl}&cvs=1` : `${logoUrl}?cvs=1`);
        img.src = safeSrc;
      });
    } catch {
      drawSealInitialsCenter(ctx, size, name, primaryCol, { maskable: isMaskable });
    }
  } else {
    drawSealInitialsCenter(ctx, size, name, primaryCol, { maskable: isMaskable });
  }

  // 3. Garantie stricte d'opacité alpha = 255 sur toute la surface 512x512 en mode maskable Android
  if (isMaskable) {
    enforceOpaqueMaskableCanvas(ctx, size);
  }

  // 4. Export DataURL et Blob PNG
  const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
  const blob = await new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), 'image/png');
    } else if (canvas.toBuffer) {
      const buf = canvas.toBuffer('image/png');
      resolve(typeof Blob !== 'undefined' ? new Blob([buf], { type: 'image/png' }) : buf);
    } else {
      resolve(null);
    }
  });

  return { canvas, dataUrl, blob };
}

/** Génère directement le Blob PNG du Sceau Combiné (`any` ou `maskable` via `options.maskable`). */
export async function generateCombinedSealBlob(associationData, options = {}) {
  const result = await generateCombinedSealCanvas(associationData, options);
  return result.blob;
}

/** Génère directement la DataURL PNG du Sceau Combiné. */
export async function generateCombinedSealDataUrl(associationData, options = {}) {
  const result = await generateCombinedSealCanvas(associationData, options);
  return result.dataUrl;
}

/** Prépare un objet File prêt pour `navigator.share({ files: [file] })`. */
export async function generateCombinedSealFile(associationData, fileName = 'invitation-o-girador.png', options = {}) {
  const blob = await generateCombinedSealBlob(associationData, options);
  if (!blob) return null;
  if (typeof File !== 'undefined') {
    return new File([blob], fileName, { type: 'image/png' });
  }
  return blob;
}

/** Calcule tous les paramètres d'invitation au groupe (URL, textes, canonical ID). */
export function getGroupInvitationDetails(associationData = {}, groupId = null) {
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
  const baseUrl = isLocal ? window.location.origin : 'https://organizador.o-girador.com';
  const effectiveGroupId = groupId || associationData?.groupId || associationData?.id || '';
  const canonicalId = canonicalizeGroupId(effectiveGroupId) || '';
  const invitationUrl = canonicalId ? `${baseUrl}/?groupe=${encodeURIComponent(canonicalId)}&mode=signup` : `${baseUrl}/?mode=signup`;
  const groupName = associationData?.nom || associationData?.name || 'notre association';
  const shareTitle = `Rejoindre ${groupName} sur O Girador`;
  const shareText = `Rejoindre notre groupe sur ${groupName} : ${invitationUrl}`;

  return {
    canonicalId,
    invitationUrl,
    groupName,
    shareTitle,
    shareText
  };
}

/**
 * Partage dynamique intelligent de l'invitation de groupe (fichier image natif, lien texte ou presse-papier).
 */
export async function shareGroupInvitation({ associationData = {}, groupId = null, t: _t = null }) {
  const { invitationUrl, shareTitle, shareText } = getGroupInvitationDetails(associationData, groupId);

  let sealFile = null;
  try {
    sealFile = await generateCombinedSealFile(associationData, `sceau-${canonicalizeGroupId(groupId || associationData?.id || 'groupe')}.png`);
  } catch (err) {
    console.warn('Génération du fichier de sceau pour le partage ignorée :', err);
  }

  if (typeof navigator !== 'undefined' && navigator.share && sealFile && navigator.canShare) {
    try {
      const shareDataWithFile = { title: shareTitle, text: shareText, url: invitationUrl, files: [sealFile] };
      if (navigator.canShare(shareDataWithFile)) {
        await navigator.share(shareDataWithFile);
        return { success: true, method: 'share-file' };
      }
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.warn('Échec partage fichier, tentative sans fichier :', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: invitationUrl });
      return { success: true, method: 'share-link' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.warn('Échec partage texte, repli sur presse-papier :', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(shareText);
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'none' };
}

/** Met à jour dynamiquement les balises Meta Open Graph et Twitter du document HTML. */
export function updateDocumentOpenGraphTags({ title, description, image, url, updateDocumentTitle = true }) {
  if (typeof document === 'undefined') return;

  const setMetaTag = (property, content, isName = false) => {
    if (!content) return;
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (isName) el.setAttribute('name', property);
      else el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  if (title) {
    if (updateDocumentTitle) document.title = title;
    setMetaTag('og:title', title);
    setMetaTag('twitter:title', title, true);
  }
  if (description) {
    setMetaTag('description', description, true);
    setMetaTag('og:description', description);
    setMetaTag('twitter:description', description, true);
  }
  if (image) {
    setMetaTag('og:image', image);
    setMetaTag('og:image:secure_url', image);
    setMetaTag('twitter:image', image, true);
  }
  if (url) {
    setMetaTag('og:url', url);
    setMetaTag('twitter:url', url, true);
  }
}
