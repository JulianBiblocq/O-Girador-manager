/**
 * Utilitaires de partage et génération dynamique du Sceau Combiné O Girador × Association.
 * Conforme aux règles d'architecture Cordel et d'isolation de thème.
 */

import { canonicalizeGroupId } from './tenantUtils.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase.js';

/**
 * Extrait les initiales d'un nom d'association (ex: "Samb'à Bulles" -> "SB", "Samambaia" -> "SA").
 */
export function getAssociationInitials(name = '') {
  const cleanName = (name || '').trim();
  if (!cleanName) return 'OG';

  const allWords = cleanName.split(/[\s'’\-]+/).filter(Boolean);
  const significantWords = allWords.filter(w => !/^(a|à|de|du|des|d|l|la|le|o|do|da|e|en)$/i.test(w));
  const words = significantWords.length >= 2 ? significantWords : allWords;

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const clean = cleanName.replace(/[^a-zA-Z0-9]/g, '');
  return clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : (clean || 'OG').toUpperCase();
}

/**
 * Dessine l'anneau officiel Cordel O Girador sur un contexte Canvas à n'importe quelle résolution (taille carrée).
 */
export function drawSealNeutralFrame(
  ctx,
  size = 512,
  bgCol = '#f4ecd8',
  primaryCol = '#8B2A1A',
  secondaryCol = '#c05621',
  textCol = '#181716'
) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 512;

  ctx.clearRect(0, 0, size, size);
  ctx.save();

  // 1. Découpe circulaire extérieure
  ctx.beginPath();
  ctx.arc(cx, cy, 248 * scale, 0, Math.PI * 2);
  ctx.clip();

  // 2. Fond parchemin
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, size, size);

  // 3. Bordure extérieure rouge terre cuite
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = Math.max(1, 14 * scale);
  ctx.beginPath();
  ctx.arc(cx, cy, 248 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Filet intermédiaire ocre ambré
  ctx.strokeStyle = secondaryCol;
  ctx.lineWidth = Math.max(1, 4 * scale);
  ctx.beginPath();
  ctx.arc(cx, cy, 232 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Filet pointillé Cordel
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = Math.max(1, 3 * scale);
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  ctx.arc(cx, cy, 220 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 6. Gravure circulaire "★ O GIRADOR ★" sur l'arc inférieur
  const label = '★ O GIRADOR ★';
  const fontSize = Math.round(28 * scale);
  ctx.font = `bold ${fontSize}px "Cinzel Decorative", "Courier New", Georgia, serif`;
  ctx.fillStyle = textCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textRadius = 194 * scale;
  const stepAngle = 0.17;
  const startAngle = Math.PI / 2 + ((label.length - 1) * stepAngle) / 2;

  for (let i = 0; i < label.length; i++) {
    const charAngle = startAngle - i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(charAngle) * textRadius, cy + Math.sin(charAngle) * textRadius);
    ctx.rotate(charAngle - Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }

  // 7. Disque central neutre d'accueil
  const innerCy = 235 * scale;
  const innerR = 155 * scale;
  ctx.beginPath();
  ctx.arc(cx, innerCy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#faf6ec';
  ctx.fill();
  ctx.lineWidth = Math.max(1, 2.5 * scale);
  ctx.strokeStyle = 'rgba(139, 42, 26, 0.4)';
  ctx.stroke();

  ctx.restore();
}

/**
 * Dessine un logo centré et ajusté dans le disque central.
 */
export function drawSealLogoCenter(ctx, size = 512, img) {
  const scale = size / 512;
  const cx = size / 2;
  const innerCy = 235 * scale;
  const innerR = 150 * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, innerCy, innerR, 0, Math.PI * 2);
  ctx.clip();

  const targetBox = innerR * 1.85;
  const imgW = img.naturalWidth || img.width || targetBox;
  const imgH = img.naturalHeight || img.height || targetBox;
  const ratio = imgW / imgH;

  const w = ratio >= 1 ? targetBox : targetBox * ratio;
  const h = ratio >= 1 ? targetBox / ratio : targetBox;

  ctx.drawImage(img, cx - w / 2, innerCy - h / 2, w, h);
  ctx.restore();
}

/**
 * Dessine les initiales artistiques au centre en cas d'absence de logo image.
 */
export function drawSealInitialsCenter(ctx, size = 512, name = '', primaryCol = '#8B2A1A') {
  const scale = size / 512;
  const cx = size / 2;
  const innerCy = 235 * scale;
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
 * Génère le Canvas du Sceau Combiné O Girador × Association de façon asynchrone.
 * 
 * @param {Object} associationData - Données complètes de l'association (nom, branding, logoUrl...)
 * @param {Object} [options]
 * @param {number} [options.size=512] - Résolution en pixels (carré)
 * @param {Function} [options.canvasFactory] - Factory pour tests Node.js
 * @returns {Promise<{ canvas: HTMLCanvasElement, dataUrl: string, blob: Blob }>}
 */
export async function generateCombinedSealCanvas(associationData = {}, options = {}) {
  const size = options.size || 512;
  const canvas = createCompatibleCanvas(size, options.canvasFactory);
  if (!canvas) {
    throw new Error("Impossible d'initialiser le Canvas : environnement non supporté.");
  }

  const ctx = canvas.getContext('2d');
  const branding = associationData?.branding || {};
  const colors = branding.colors || {};
  const bgCol = colors.background || '#f4ecd8';
  const primaryCol = colors.primary || '#8B2A1A';
  const secondaryCol = colors.secondary || '#c05621';
  const textCol = colors.text || '#181716';

  const name = associationData?.nom || associationData?.name || associationData?.associationName || '';
  const logoUrl = branding.logoUrl || associationData?.logoUrl || null;

  // 1. Trace le cadre Cordel neutre
  drawSealNeutralFrame(ctx, size, bgCol, primaryCol, secondaryCol, textCol);

  // 2. Si un logo image est configuré, tenter de le charger
  if (logoUrl) {
    try {
      await new Promise((resolve, reject) => {
        const img = (typeof window !== 'undefined' && window.Image) 
          ? new window.Image() 
          : (options.imageFactory ? options.imageFactory() : null);

        if (!img) {
          drawSealInitialsCenter(ctx, size, name, primaryCol);
          return resolve();
        }

        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            drawSealLogoCenter(ctx, size, img);
            resolve();
          } catch (err) {
            drawSealInitialsCenter(ctx, size, name, primaryCol);
            resolve();
          }
        };
        img.onerror = () => {
          drawSealInitialsCenter(ctx, size, name, primaryCol);
          resolve();
        };

        const safeSrc = (logoUrl.startsWith('data:') || logoUrl.startsWith('blob:'))
          ? logoUrl
          : (logoUrl.includes('?') ? `${logoUrl}&cvs=1` : `${logoUrl}?cvs=1`);
        img.src = safeSrc;
      });
    } catch {
      drawSealInitialsCenter(ctx, size, name, primaryCol);
    }
  } else {
    // Si aucun logo n'existe, graver les initiales de l'association
    drawSealInitialsCenter(ctx, size, name, primaryCol);
  }

  // 3. Export DataURL et Blob
  const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
  const blob = await new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), 'image/png');
    } else if (canvas.toBuffer) {
      // Cas Node-canvas
      const buf = canvas.toBuffer('image/png');
      resolve(typeof Blob !== 'undefined' ? new Blob([buf], { type: 'image/png' }) : buf);
    } else {
      resolve(null);
    }
  });

  return { canvas, dataUrl, blob };
}

/**
 * Génère directement le Blob PNG du Sceau Combiné.
 */
export async function generateCombinedSealBlob(associationData, options = {}) {
  const result = await generateCombinedSealCanvas(associationData, options);
  return result.blob;
}

/**
 * Génère directement la DataURL PNG du Sceau Combiné.
 */
export async function generateCombinedSealDataUrl(associationData, options = {}) {
  const result = await generateCombinedSealCanvas(associationData, options);
  return result.dataUrl;
}

/**
 * Prépare un objet File prêt pour navigator.share({ files: [file] }).
 */
export async function generateCombinedSealFile(associationData, fileName = 'invitation-o-girador.png', options = {}) {
  const blob = await generateCombinedSealBlob(associationData, options);
  if (!blob) return null;
  if (typeof File !== 'undefined') {
    return new File([blob], fileName, { type: 'image/png' });
  }
  return blob;
}

/**
 * Calcule tous les paramètres d'invitation au groupe (URL, textes, canonical ID).
 */
export function getGroupInvitationDetails(associationData = {}, groupId = null) {
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );
  const baseUrl = isLocal ? window.location.origin : 'https://organizador.o-girador.com';
  const effectiveGroupId = groupId || associationData?.groupId || associationData?.id || '';
  const canonicalId = canonicalizeGroupId(effectiveGroupId) || 'samambaia';
  const invitationUrl = `${baseUrl}/?groupe=${encodeURIComponent(canonicalId)}&mode=signup`;
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
 * Partage dynamique intelligent de l'invitation de groupe.
 * Tente d'abord le partage natif avec fichier image (macaron combiné).
 * Repli sur le partage de texte/lien natif, puis sur la copie dans le presse-papier.
 * 
 * @param {Object} params
 * @param {Object} params.associationData
 * @param {string} [params.groupId]
 * @param {Function} [params.t]
 * @returns {Promise<{ success: boolean, method: 'share-file' | 'share-link' | 'clipboard' }>}
 */
export async function shareGroupInvitation({ associationData = {}, groupId = null, t = null }) {
  const { invitationUrl, groupName, shareTitle, shareText } = getGroupInvitationDetails(associationData, groupId);

  // 1. Tenter de générer le fichier Sceau Combiné pour les réseaux supportant le partage de fichiers
  let sealFile = null;
  try {
    sealFile = await generateCombinedSealFile(associationData, `sceau-${canonicalizeGroupId(groupId || associationData?.id || 'groupe')}.png`);
  } catch (err) {
    console.warn("Génération du fichier de sceau pour le partage ignorée :", err);
  }

  // 2. Partage via navigator.share avec image
  if (typeof navigator !== 'undefined' && navigator.share && sealFile && navigator.canShare) {
    try {
      const shareDataWithFile = {
        title: shareTitle,
        text: shareText,
        url: invitationUrl,
        files: [sealFile]
      };
      if (navigator.canShare(shareDataWithFile)) {
        await navigator.share(shareDataWithFile);
        return { success: true, method: 'share-file' };
      }
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.warn("Échec partage fichier, tentative sans fichier :", err);
    }
  }

  // 3. Partage via navigator.share texte & lien
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const shareDataText = {
        title: shareTitle,
        text: shareText,
        url: invitationUrl
      };
      await navigator.share(shareDataText);
      return { success: true, method: 'share-link' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.warn("Échec partage texte, repli sur presse-papier :", err);
    }
  }

  // 4. Repli universel : copie dans le presse-papier
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(shareText);
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'none' };
}

/**
 * Met à jour dynamiquement les balises Meta Open Graph et Twitter du document HTML.
 */
export function updateDocumentOpenGraphTags({ title, description, image, url }) {
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
    document.title = title;
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

/**
 * Génère le Sceau Combiné Officiel Asso × O Girador et le sauvegarde dans Firebase Storage
 * sous `brandings/{groupId}/combined-logo.png` puis enregistre son URL dans Firestore
 * sous `branding.combinedLogoUrl`.
 * 
 * @param {string} groupId - L'identifiant du groupe (ex: 'sambabulles' ou 'samambaia')
 * @param {Object} associationData - Données de l'association (nom, branding.logoUrl, colors, etc.)
 * @param {Object} [options]
 * @param {number} [options.size=512]
 * @param {boolean} [options.updateFirestore=true]
 * @param {boolean} [options.updateMetaTags=true]
 * @returns {Promise<string|null>} - L'URL publique de téléchargement du sceau combiné
 */
export async function uploadCombinedSealToStorage(groupId, associationData, options = {}) {
  const { size = 512, updateFirestore = true, updateMetaTags = true } = options;
  if (!groupId) return null;

  try {
    const sealBlob = await generateCombinedSealBlob(associationData, { size });
    if (!sealBlob) return null;

    // Chemin Firebase Storage standardisé : brandings/{groupId}/combined-logo.png
    const fileRef = storageRef(storage, `brandings/${groupId}/combined-logo.png`);
    const snapshot = await uploadBytes(fileRef, sealBlob, { contentType: 'image/png' });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Miroir de compatibilité
    try {
      const mirrorRef = storageRef(storage, `associations/${groupId}/brandings/combined-logo.png`);
      await uploadBytes(mirrorRef, sealBlob, { contentType: 'image/png' });
    } catch (mirrorErr) {
      console.warn("Miroir stockage sceau combiné :", mirrorErr);
    }

    // Persistance dans le document Firestore du groupe : branding.combinedLogoUrl
    if (updateFirestore) {
      const groupDocRef = doc(db, 'associations', groupId);
      await setDoc(groupDocRef, {
        branding: {
          combinedLogoUrl: downloadUrl
        }
      }, { merge: true });
    }

    // Mise à jour immédiate des balises Open Graph du document
    if (updateMetaTags) {
      const groupName = associationData?.nom || associationData?.name || '';
      updateDocumentOpenGraphTags({
        title: `Rejoindre ${groupName || 'notre groupe'} sur O Girador`,
        description: 'Espace adhérents : agenda, répétitions, vestiaire et vie du groupe.',
        image: downloadUrl
      });
    }

    return downloadUrl;
  } catch (err) {
    console.warn("Erreur lors de la génération et sauvegarde du sceau combiné :", err);
    return null;
  }
}

