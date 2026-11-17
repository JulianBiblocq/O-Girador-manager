import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImageClientSide } from './imageCompressionUtils';

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
 * Valide et normalise l'identifiant d'association (aucun repli en dur).
 * @param {string} groupId - Identifiant fourni par l'appelant
 * @returns {string} Identifiant nettoyé
 * @throws {Error} Si l'identifiant est absent ou vide
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
 * Compresse (si image) puis téléverse une pièce jointe dans documents/{groupId}/{subFolder}.
 * @param {File} file - Fichier choisi par l'utilisateur
 * @param {string} groupId - Identifiant de l'association (obligatoire)
 * @param {string} subFolder - Sous-dossier cible ('forum' ou 'chat')
 */
const uploadToGroupFolder = async (file, groupId, subFolder) => {
  if (!file) throw new Error('Aucun fichier sélectionné.');
  const cleanGroupId = requireGroupId(groupId);
  const isImage = Boolean(file.type && file.type.startsWith('image/'));
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

/**
 * Envoi d'une pièce jointe du Porte-Voix (photo ou document) vers Firebase Storage.
 * @param {Object} params
 * @param {File} params.file - Fichier sélectionné
 * @param {string} params.groupId - Identifiant de l'association (obligatoire)
 * @returns {Promise<{ success: boolean, url: string, fileName: string, isImage: boolean, provider: string }>}
 */
export const uploadForumAttachment = ({ file, groupId }) => uploadToGroupFolder(file, groupId, 'forum');

/**
 * Envoi d'une pièce jointe de la messagerie (Le Zap, messages privés, groupes).
 * @param {Object} params
 * @param {File} params.file - Fichier sélectionné
 * @param {string} params.groupId - Identifiant de l'association (obligatoire)
 * @returns {Promise<{ success: boolean, url: string, fileName: string, isImage: boolean, provider: string }>}
 */
export const uploadChatAttachment = ({ file, groupId }) => uploadToGroupFolder(file, groupId, 'chat');
