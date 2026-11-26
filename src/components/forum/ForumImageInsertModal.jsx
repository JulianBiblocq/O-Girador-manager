import React, { useState, useRef, useEffect } from 'react';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';
import {
  uploadForumAttachment,
  isImageAttachment,
  formatAttachmentUploadError
} from '../../utils/attachmentUploadUtils';

const ACCEPTED_TYPES =
  'image/*,image/heic,image/heif,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp3,.ogg,.wav';

/**
 * Modale d'insertion de pièce jointe (Photo iPhone HEIC/JPG/PNG/WebP ou Document) pour le Forum.
 * Compresse et convertit les photos côté client puis les envoie sur Firebase Storage.
 */
export default function ForumImageInsertModal({
  isOpen,
  onClose,
  onInsertAttachment,
  onInsertImage,
  groupId
}) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  if (!isOpen) return null;

  const isImage = isImageAttachment(selectedFile);
  const cleanGroupId = typeof groupId === 'string' ? groupId.trim() : '';

  const resetSelection = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sélection d'un fichier local (photo iOS/Android/PC ou document)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      setErrorMsg(t('forumExtra.errFileTooLarge30Mb', 'Le fichier est trop volumineux (maximum 30 Mo).'));
      resetSelection();
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setErrorMsg('');
    setSelectedFile(file);
    setFilePreview(isImageAttachment(file) ? URL.createObjectURL(file) : null);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetSelection();
    setErrorMsg('');
    setIsUploading(false);
    onClose();
  };

  const handleUploadAndInsert = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorMsg(t('forumExtra.errSelectFileFirst', 'Veuillez sélectionner un fichier ou une photo sur votre appareil.'));
      return;
    }
    if (!cleanGroupId) {
      setErrorMsg(t('forumExtra.errUploadMissingGroup', "Association non identifiée : rechargez la page avant de réessayer l'envoi."));
      return;
    }
    try {
      setIsUploading(true);
      setErrorMsg('');
      const result = await uploadForumAttachment({ file: selectedFile, groupId: cleanGroupId });
      if (!result?.success || !result?.url) {
        throw new Error(t('forumExtra.errUploadInvalidUrl', "L'envoi n'a pas retourné d'adresse valide."));
      }
      if (onInsertAttachment) {
        onInsertAttachment({ url: result.url, type: result.isImage ? 'image' : 'file', name: result.fileName });
      }
      if (onInsertImage && (result.isImage || !onInsertAttachment)) {
        onInsertImage(result.url);
      }
      handleClose();
    } catch (err) {
      console.error("Erreur lors de l'envoi de la pièce jointe :", err);
      setErrorMsg(formatAttachmentUploadError(err, t));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && handleClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none outline-none">
      <div className="max-w-md w-full max-h-[90vh] flex flex-col bg-cordel-bg text-left relative rounded-lg border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden">
        <div className="shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood">
              {t('forumExtra.attachmentModalTitle', '📎 Joindre une photo ou un fichier')}
            </h3>
            <p className="text-[11px] text-cordel-master-dark/80 font-medium">
              {t('forumExtra.attachmentModalSubtitle', 'Choisissez un document ou une photo depuis votre appareil.')}
            </p>
          </div>
          <button type="button" onClick={handleClose} disabled={isUploading} className="w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer disabled:opacity-50 shrink-0 ml-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <label htmlFor="forumAttachmentFileInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
              {t('forumExtra.attachmentFileLabel', 'Fichier depuis votre appareil')}
            </label>
            <input ref={fileInputRef} id="forumAttachmentFileInput" type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} disabled={isUploading} className="block w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-2 file:border-encre-noire file:text-xs file:font-bold file:uppercase file:bg-cordel-bg file:text-encre-noire hover:file:bg-amber-100 cursor-pointer" />
            <p className="text-[10px] text-stone-500 font-medium">
              {t('forumExtra.attachmentAcceptedFormats', '💡 Formats acceptés : Photos (iPhone HEIC, JPG, PNG, WebP), Documents (PDF, Word, Tableur), Audios (MP3, WAV).')}
            </p>
            {selectedFile && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded">
                {isImage && filePreview ? (
                  <img src={filePreview} alt="" onError={() => setFilePreview(null)} className="w-14 h-14 object-cover rounded border border-encre-noire/30 shadow-xs shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0">{isImage ? '🖼️' : '📄'}</div>
                )}
                <div className="flex flex-col text-[11px] font-medium text-stone-700 truncate min-w-0 flex-1">
                  <span className="font-bold truncate">{selectedFile.name}</span>
                  <span className="text-stone-500">{(selectedFile.size / 1024).toFixed(1)} Ko</span>
                  <span className="text-[10px] text-stone-400 font-mono">{isImage ? t('forumExtra.attachmentPhotoWillOptimize', 'Photo (sera optimisée)') : t('forumExtra.attachedDocDefault', 'Document joint')}</span>
                </div>
                {!isUploading && (
                  <button type="button" onClick={resetSelection} title={t('forumExtra.attachmentChangeFile', 'Changer de fichier')} className="text-xs text-stone-400 hover:text-[var(--color-cordel-rouge)] p-1 font-bold cursor-pointer">✕</button>
                )}
              </div>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-500/40 rounded text-amber-900 text-xs font-semibold animate-pulse">
              <span className="inline-block animate-spin text-sm">⏳</span>
              <span>{t('forumExtra.attachmentUploadingMsg', 'Envoi et optimisation de la pièce jointe...')}</span>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="p-2.5 rounded border border-[var(--color-cordel-rouge)] bg-[var(--color-cordel-rouge)]/10 text-[11px] font-bold text-[var(--color-cordel-rouge)] leading-snug">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 border-t border-dashed border-cordel-master-dark/15 flex justify-end gap-2 bg-cordel-bg">
          <button type="button" onClick={handleClose} disabled={isUploading} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50">
            {t('common.cancel', 'Annuler')}
          </button>
          <CordelButton type="button" onClick={handleUploadAndInsert} variant="vert" useExtremeBorder={true} disabled={isUploading || !selectedFile} className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50">
            {isUploading ? (<><span className="inline-block animate-spin">⏳</span><span>{t('forum.sendingMsg', 'Envoi...')}</span></>) : (<span>{t('forumExtra.attachmentInsertBtn', 'Insérer la pièce jointe')}</span>)}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
