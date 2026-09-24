import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import imageCompression from 'browser-image-compression';
import { db, storage, functions } from '../firebase';

/**
 * Nettoie et sécurise un nom de fichier pour le stockage distant.
 * @param {string} name - Nom de fichier original
 * @returns {string} Nom de fichier nettoyé
 */
export const sanitizeFileName = (name) => {
  if (!name) return 'fichier';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Compresse une image côté client de façon transparente
 * (max 1280px, qualité 0.8, poids réduit à ~150-300 Ko).
 * @param {File} file - Fichier image original
 * @returns {Promise<File|Blob>} Fichier compressé
 */
export const compressImageClientSide = async (file) => {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // Ne pas compresser les GIFs animés

  try {
    const options = {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1280,
      initialQuality: 0.8,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    };
    return await imageCompression(file, options);
  } catch (err) {
    console.warn("Échec compression web worker, repli sur fichier brut :", err);
    return file;
  }
};

/**
 * Convertit un Blob/File en chaîne Base64 pour transmission d'API.
 * @param {Blob|File} fileOrBlob
 * @returns {Promise<string>}
 */
export const fileToBase64 = (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Téléverse un fichier brut ou compressé directement vers Firebase Storage.
 * @param {File|Blob} file - Fichier à envoyer
 * @param {string} folderPath - Dossier cible autorisé (ex: documents/groupId/forum)
 * @returns {Promise<{ url: string, storagePath: string, fileName: string, mimeType: string }>}
 */
export const uploadAttachmentToStorage = async (file, folderPath) => {
  const cleanName = sanitizeFileName(file.name || 'piece_jointe');
  const fullPath = `${folderPath}/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, fullPath);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream'
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return {
    url: downloadUrl,
    storagePath: fullPath,
    fileName: file.name || cleanName,
    mimeType: file.type || 'application/octet-stream'
  };
};

/**
 * Pipeline résilient d'envoi d'une pièce jointe du Forum (photo ou document).
 * Tente d'abord Framaspace si configuré, sinon bascule automatiquement sur Firebase Storage.
 * 
 * @param {Object} params
 * @param {File} params.file - Fichier sélectionné par l'utilisateur
 * @param {string} [params.groupId='Samambaia'] - Identifiant du groupe
 * @returns {Promise<{ success: boolean, url: string, fileName: string, isImage: boolean, provider: string }>}
 */
export const uploadForumAttachment = async ({ file, groupId = 'Samambaia' }) => {
  if (!file) throw new Error("Aucun fichier sélectionné.");
  const effectiveGroupId = groupId || 'Samambaia';
  const isImage = Boolean(file.type && file.type.startsWith('image/'));

  let fileToUpload = file;
  if (isImage) {
    fileToUpload = await compressImageClientSide(file);
  }

  // 1. Tenter l'envoi vers Framaspace uniquement si c'est une image et que l'association a des identifiants valides
  if (isImage) {
    try {
      const assocSnap = await getDoc(doc(db, 'associations', effectiveGroupId));
      const aData = assocSnap.data() || {};
      const hasFramaspaceCreds = Boolean(aData.framaspaceUsername && aData.framaspaceAppPassword);

      if (hasFramaspaceCreds) {
        const fileBase64 = await fileToBase64(fileToUpload);
        const uploadForumImageFn = httpsCallable(functions, 'uploadForumImageToFramaspace');
        const res = await uploadForumImageFn({
          fileBase64,
          fileName: file.name || 'image.jpg',
          mimeType: fileToUpload.type || file.type || 'image/jpeg',
          groupId: effectiveGroupId
        });

        if (res?.data?.success && res?.data?.directUrl) {
          return {
            success: true,
            url: res.data.directUrl,
            fileName: file.name || 'image.jpg',
            isImage: true,
            provider: 'framaspace'
          };
        }
      }
    } catch (framaErr) {
      console.warn("Framaspace non disponible, bascule transparente sur Firebase Storage :", framaErr.message || framaErr);
    }
  }

  // 2. Bascule transparente et garantie sur Firebase Storage (chemin autorisé documents/{groupId}/forum/...)
  const storageResult = await uploadAttachmentToStorage(fileToUpload, `documents/${effectiveGroupId}/forum`);
  return {
    success: true,
    url: storageResult.url,
    fileName: file.name || storageResult.fileName,
    isImage,
    provider: 'firebase'
  };
};

/**
 * Pipeline d'envoi d'une pièce jointe pour la Messagerie Directe privée (photo ou document).
 * Téléverse directement vers documents/{groupId}/chat/... avec compression d'image client.
 * 
 * @param {Object} params
 * @param {File} params.file - Fichier sélectionné par l'utilisateur
 * @param {string} [params.groupId='Samambaia'] - Identifiant du groupe
 * @returns {Promise<{ success: boolean, url: string, fileName: string, isImage: boolean, provider: string }>}
 */
export const uploadChatAttachment = async ({ file, groupId = 'Samambaia' }) => {
  if (!file) throw new Error("Aucun fichier sélectionné.");
  const effectiveGroupId = groupId || 'Samambaia';
  const isImage = Boolean(file.type && file.type.startsWith('image/'));

  let fileToUpload = file;
  if (isImage) {
    fileToUpload = await compressImageClientSide(file);
  }

  const storageResult = await uploadAttachmentToStorage(fileToUpload, `documents/${effectiveGroupId}/chat`);
  return {
    success: true,
    url: storageResult.url,
    fileName: file.name || storageResult.fileName,
    isImage,
    provider: 'firebase'
  };
};
