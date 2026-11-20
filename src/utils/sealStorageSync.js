/**
 * Synchronisation Firebase Storage & Firestore du Double Sceau Combiné O Girador × Association :
 * - `brandings/{groupId}/combined-logo.png` (`purpose: "any"`, médaillon détouré à coins transparents)
 * - `brandings/{groupId}/combined-logo-maskable.png` (`purpose: "maskable"`, carré 512x512 100 % opaque `#8B2A1A`)
 */

import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase.js';
import {
  generateCombinedSealBlob,
  updateDocumentOpenGraphTags,
  getCombinedSealStoragePaths
} from './shareUtils.js';

const autoSyncAttemptedGroups = new Set();

/**
 * Téléverse un Blob PNG sur Firebase Storage avec repli automatique sur le chemin miroir `associations/{groupId}/brandings/...`.
 */
async function uploadSealVariantBlob(primaryPath, mirrorPath, blob) {
  if (!blob) return '';
  const metadata = { contentType: 'image/png', cacheControl: 'public, max-age=86400' };
  try {
    const primaryRef = storageRef(storage, primaryPath);
    const snap = await uploadBytes(primaryRef, blob, metadata);
    return await getDownloadURL(snap.ref);
  } catch (primaryErr) {
    console.warn(`Chemin ${primaryPath} restreint, bascule sur ${mirrorPath} :`, primaryErr);
    const fallbackRef = storageRef(storage, mirrorPath);
    const snap = await uploadBytes(fallbackRef, blob, metadata);
    return await getDownloadURL(snap.ref);
  }
}

/**
 * Génère et sauvegarde sur Firebase Storage les deux variantes (`any` détouré + `maskable` 100 % opaque `#8B2A1A`),
 * puis met à jour `branding.combinedLogoUrl` et `branding.combinedLogoMaskableUrl` dans Firestore si demandé.
 */
export async function uploadDualCombinedSealsToStorage(groupId, associationData, options = {}) {
  const { size = 512, updateFirestore = true, updateMetaTags = true } = options;
  if (!groupId) return { combinedLogoUrl: '', combinedLogoMaskableUrl: '' };

  try {
    const [anyBlob, maskableBlob] = await Promise.all([
      generateCombinedSealBlob(associationData, { ...options, size, maskable: false }),
      generateCombinedSealBlob(associationData, { ...options, size, maskable: true })
    ]);

    const paths = getCombinedSealStoragePaths(groupId);
    const [combinedLogoUrl, combinedLogoMaskableUrl] = await Promise.all([
      uploadSealVariantBlob(paths.anyPrimary, paths.anyMirror, anyBlob),
      uploadSealVariantBlob(paths.maskablePrimary, paths.maskableMirror, maskableBlob)
    ]);

    if (updateFirestore && (combinedLogoUrl || combinedLogoMaskableUrl)) {
      const groupDocRef = doc(db, 'associations', groupId);
      const brandingPatch = {};
      const rootPatch = {};
      if (combinedLogoUrl) {
        brandingPatch.combinedLogoUrl = combinedLogoUrl;
        rootPatch.combinedLogoUrl = combinedLogoUrl;
      }
      if (combinedLogoMaskableUrl) {
        brandingPatch.combinedLogoMaskableUrl = combinedLogoMaskableUrl;
        rootPatch.combinedLogoMaskableUrl = combinedLogoMaskableUrl;
      }
      await setDoc(groupDocRef, { ...rootPatch, branding: brandingPatch }, { merge: true });
    }

    if (updateMetaTags && combinedLogoUrl) {
      const groupName = associationData?.nom || associationData?.name || '';
      updateDocumentOpenGraphTags({
        title: `Rejoindre ${groupName || 'notre groupe'} sur O Girador`,
        description: 'Espace adhérents : agenda, répétitions, vestiaire et vie du groupe.',
        image: combinedLogoUrl
      });
    }

    return { combinedLogoUrl: combinedLogoUrl || '', combinedLogoMaskableUrl: combinedLogoMaskableUrl || '' };
  } catch (err) {
    console.warn('Erreur lors de la génération et sauvegarde du double sceau combiné :', err);
    return { combinedLogoUrl: '', combinedLogoMaskableUrl: '' };
  }
}

/**
 * Enveloppe rétrocompatible retournant l'URL `any` tout en garantissant la génération simultanée du `maskable`.
 */
export async function uploadCombinedSealToStorage(groupId, associationData, options = {}) {
  const res = await uploadDualCombinedSealsToStorage(groupId, associationData, options);
  return res.combinedLogoUrl || null;
}

/**
 * Filet d'auto-guérison silencieux : si une association dispose d'un `logoUrl` mais qu'il lui manque encore
 * `combinedLogoUrl` ou `combinedLogoMaskableUrl` (ex. création depuis Orquestrador), un admin connecté les génère en tâche de fond.
 */
export function ensureDualCombinedSealsIfMissing(groupId, associationData, isAuthorized = false) {
  if (!isAuthorized || !groupId || !associationData) return;
  const logoUrl = associationData?.branding?.logoUrl || associationData?.logoUrl || '';
  if (!logoUrl) return;
  const hasAny = Boolean(associationData?.branding?.combinedLogoUrl || associationData?.combinedLogoUrl);
  const hasMaskable = Boolean(associationData?.branding?.combinedLogoMaskableUrl || associationData?.combinedLogoMaskableUrl);
  if (hasAny && hasMaskable) return;
  const lockKey = `${groupId}:${logoUrl}`;
  if (autoSyncAttemptedGroups.has(lockKey)) return;
  autoSyncAttemptedGroups.add(lockKey);
  uploadDualCombinedSealsToStorage(groupId, associationData, {
    size: 512,
    updateFirestore: true,
    updateMetaTags: false
  }).catch(() => {});
}
