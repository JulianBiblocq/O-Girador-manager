import { useState, useEffect, useCallback } from 'react';
import { uploadChatAttachment, formatAttachmentUploadError, getFirebaseErrorCode } from '../utils/attachmentUploadUtils';

// Durée d'affichage du bandeau d'erreur avant disparition automatique (ms)
const ERROR_DISPLAY_MS = 8000;

/**
 * Traduit une erreur d'envoi (Firebase Storage ou validation) en message lisible.
 */
const toReadableError = (err, t) => {
  const code = getFirebaseErrorCode(err);
  if (code.includes('unauthorized') || code.includes('permission')) {
    return formatAttachmentUploadError(err, t);
  }
  if (code.includes('retry-limit') || code.includes('canceled') || err?.message === 'Failed to fetch') {
    return typeof t === 'function'
      ? t('forumExtra.errUploadNetwork', "Connexion instable : le fichier n'a pas pu être envoyé. Veuillez réessayer.")
      : "Connexion instable : la photo n'a pas pu être envoyée. Réessayez.";
  }
  return err?.message || "La photo n'a pas pu être envoyée.";
};

/**
 * Hook d'envoi de photo pour le widget Le Zap (compression WebP/JPEG + Firebase Storage).
 */
export function useZapPhotoUpload({ groupId, sendMessage, caption, onSent, t }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const clearPhotoError = useCallback(() => setPhotoError(''), []);

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
      setPhotoError(toReadableError(err, t));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return { uploadingPhoto, photoError, clearPhotoError, handlePhotoChange };
}
