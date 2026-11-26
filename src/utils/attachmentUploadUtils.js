import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImageClientSide, resolveCompressibleMime } from './imageCompressionUtils';

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
 * Indique si le fichier est une image reconnue (inclut HEIC/HEIF et file.type vide sur iOS).
 * @param {File|Blob|null} file - Fichier à inspecter
 * @returns {boolean}
 */
export const isImageAttachment = (file) =>
  Boolean((file?.type && file.type.startsWith('image/')) || resolveCompressibleMime(file));

/**
 * Extrait le code d'erreur Firebase (Storage ou Firestore) s'il est présent.
 * @param {unknown} err - Erreur capturée
 * @returns {string}
 */
export const getFirebaseErrorCode = (err) => {
  const raw = String(err?.code || '').trim();
  if (raw) return raw;
  const msg = String(err?.message || '');
  const match = msg.match(/\b(storage\/[a-z-]+|firestore\/permission-denied|permission-denied)\b/i);
  return match ? match[1].toLowerCase() : '';
};

/**
 * Formate un message d'erreur explicite (FR/PT) lors de l'envoi d'une pièce jointe.
 * @param {unknown} err - Erreur capturée
 * @param {Function} [t] - Fonction de traduction
 * @returns {string}
 */
export const formatAttachmentUploadError = (err, t) => {
  const code = getFirebaseErrorCode(err);
  if (
    code === 'storage/unauthorized' ||
    code === 'permission-denied' ||
    code === 'firestore/permission-denied' ||
    code.endsWith('/unauthorized') ||
    code.endsWith('/permission-denied')
  ) {
    const normalizedCode = code === 'firestore/permission-denied' ? 'permission-denied' : (code || 'storage/unauthorized');
    const fallbackFr = `Envoi refusé faute d'autorisation (${normalizedCode}) : vérifiez que votre compte est bien rattaché à l'association ou reconnectez-vous.`;
    return typeof t === 'function'
      ? t('forumExtra.errUploadUnauthorized', fallbackFr, { code: normalizedCode })
      : fallbackFr;
  }
  if (code.includes('retry-limit') || code.includes('canceled') || err?.message === 'Failed to fetch') {
    const fallbackNet = "Connexion instable : le fichier n'a pas pu être envoyé. Veuillez réessayer.";
    return typeof t === 'function' ? t('forumExtra.errUploadNetwork', fallbackNet) : fallbackNet;
  }
  const detail = err?.message || 'Erreur réseau';
  return typeof t === 'function'
    ? t('forumExtra.errUploadAttachment', "Erreur lors de l'envoi du fichier : {{error}}", { error: detail })
    : `Erreur lors de l'envoi du fichier : ${detail}`;
};

/**
 * Valide et normalise l'identifiant d'association (aucun repli en dur).
 * @param {string} groupId - Identifiant fourni par l'appelant
 * @returns {string} Identifiant nettoyé
 */
export const requireGroupId = (groupId) => {
  const clean = typeof groupId === 'string' ? groupId.trim() : '';
  if (!clean) {
    throw new Error("Association introuvable : impossible d'envoyer le fichier pour le moment.");
  }
  return clean;
};

/**
 * Téléverse un fichier directement vers Firebase Storage.
 * @param {File|Blob} file - Fichier à envoyer
 * @param {string} folderPath - Dossier cible autorisé (ex: documents/groupId/forum)
 */
export const uploadAttachmentToStorage = async (file, folderPath) => {
  const cleanName = sanitizeFileName(file.name || 'piece_jointe');
  const fullPath = `${folderPath}/${Date.now()}_${cleanName}`;
  const fileRef = ref(storage, fullPath);
  const mimeType = file.type || resolveCompressibleMime(file) || 'application/octet-stream';
  const snapshot = await uploadBytes(fileRef, file, { contentType: mimeType });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return {
    url: downloadUrl,
    storagePath: fullPath,
    fileName: file.name || cleanName,
    mimeType
  };
};

/**
 * Compresse (si image, y compris HEIC iPhone) puis téléverse dans documents/{groupId}/{subFolder}.
 */
const uploadToGroupFolder = async (file, groupId, subFolder) => {
  if (!file) throw new Error('Aucun fichier sélectionné.');
  const cleanGroupId = requireGroupId(groupId);
  const isImage = isImageAttachment(file);
  const fileToUpload = isImage ? await compressImageClientSide(file) : file;

  const result = await uploadAttachmentToStorage(fileToUpload, `documents/${cleanGroupId}/${subFolder}`);
  return {
    success: true,
    url: result.url,
    fileName: fileToUpload.name || result.fileName,
    isImage,
    provider: 'firebase'
  };
};

/** Envoi d'une pièce jointe du Porte-Voix (photo ou document) vers Firebase Storage. */
export const uploadForumAttachment = ({ file, groupId }) => uploadToGroupFolder(file, groupId, 'forum');

/** Envoi d'une pièce jointe de la messagerie (Le Zap, messages privés, groupes). */
export const uploadChatAttachment = ({ file, groupId }) => uploadToGroupFolder(file, groupId, 'chat');
