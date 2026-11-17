import { useState, useEffect, useCallback } from 'react';
import { uploadChatAttachment } from '../utils/attachmentUploadUtils';

// Durée d'affichage du bandeau d'erreur avant disparition automatique (ms)
const ERROR_DISPLAY_MS = 8000;

/**
 * Traduit une erreur d'envoi (Firebase Storage ou validation) en message lisible.
 * @param {Error} err - Erreur capturée
 * @returns {string}
 */
const toReadableError = (err) => {
  const code = String(err?.code || '');
  if (code.includes('unauthorized') || code.includes('permission')) {
    return "Envoi refusé : vous n'avez pas accès au stockage de cette association.";
  }
  if (code.includes('retry-limit') || code.includes('canceled') || err?.message === 'Failed to fetch') {
    return 'Connexion instable : la photo n’a pas pu être envoyée. Réessayez.';
  }
  return err?.message || "La photo n'a pas pu être envoyée.";
};

/**
 * Hook d'envoi de photo pour le widget Le Zap (compression WebP + Firebase Storage).
 * @param {Object} params
 * @param {string} params.groupId - Identifiant de l'association (obligatoire)
 * @param {Function} params.sendMessage - Envoi d'un message de conversation
 * @param {string} params.caption - Légende saisie (optionnelle)
 * @param {Function} params.onSent - Callback après envoi réussi (ex: vider la saisie)
 * @returns {{ uploadingPhoto: boolean, photoError: string, clearPhotoError: Function, handlePhotoChange: Function }}
 */
export function useZapPhotoUpload({ groupId, sendMessage, caption, onSent }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const clearPhotoError = useCallback(() => setPhotoError(''), []);

  // Disparition automatique du bandeau d'erreur
  useEffect(() => {
    if (!photoError) return undefined;
    const timer = setTimeout(() => setPhotoError(''), ERROR_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [photoError]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || uploadingPhoto) return;
    setUploadingPhoto(true);
    setPhotoError('');
    try {
      const res = await uploadChatAttachment({ file, groupId });
      if (res?.success && res?.url) {
        await sendMessage({
          content: (caption || '').trim(),
          imageUrl: res.isImage ? res.url : null,
          thumbnailUrl: res.isImage ? res.url : null,
          mediaName: res.isImage ? res.fileName : null,
          fileUrl: !res.isImage ? res.url : null,
          fileName: !res.isImage ? res.fileName : null
        });
        if (onSent) onSent();
      }
    } catch (err) {
      console.error('useZapPhotoUpload - Erreur envoi photo :', err);
      setPhotoError(toReadableError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return { uploadingPhoto, photoError, clearPhotoError, handlePhotoChange };
}
