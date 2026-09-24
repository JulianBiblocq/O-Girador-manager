import React, { useState, useRef } from 'react';
import CordelButton from '../CordelButton';
import { uploadForumAttachment } from '../../utils/attachmentUploadUtils';

/**
 * Modale d'insertion de pièce jointe (Photo ou Document) pour le Forum.
 * Téléversement résilient et transparent :
 * - Tente Framaspace Nextcloud si configuré pour les photos
 * - Bascule automatiquement sur Firebase Storage (documents/{groupId}/forum/...)
 * - Supporte images (avec compression client) et documents (PDF, etc.)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modale
 * @param {Function} props.onClose - Fermeture
 * @param {Function} [props.onInsertAttachment] - Callback ({ url, type, name })
 * @param {Function} [props.onInsertImage] - Callback historique (url)
 * @param {string} [props.groupId='Samambaia'] - Identifiant de l'association
 */
export default function ForumImageInsertModal({ 
  isOpen, 
  onClose, 
  onInsertAttachment,
  onInsertImage, 
  groupId = 'Samambaia' 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const isImage = Boolean(selectedFile?.type && selectedFile.type.startsWith('image/'));

  // Sélection d'un fichier local (image ou document)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setErrorMsg("Le fichier est trop volumineux (maximum 30 Mo).");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  // Réinitialisation et fermeture
  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setFilePreview(null);
    setErrorMsg('');
    setIsUploading(false);
    onClose();
  };

  // Téléversement résilient (Framaspace ou Firebase Storage)
  const handleUploadAndInsert = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Veuillez sélectionner un fichier ou une photo sur votre appareil.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');

      const result = await uploadForumAttachment({
        file: selectedFile,
        groupId: groupId || 'Samambaia'
      });

      if (result?.success && result?.url) {
        // Callback multi-types enrichi
        if (onInsertAttachment) {
          onInsertAttachment({
            url: result.url,
            type: result.isImage ? 'image' : 'file',
            name: result.fileName
          });
        }
        // Repli rétrocompatible pour composant attendant onInsertImage
        if (onInsertImage && result.isImage) {
          onInsertImage(result.url);
        } else if (onInsertImage && !onInsertAttachment) {
          // Si l'éditeur n'a que onInsertImage, insérer sous forme de lien ou image
          onInsertImage(result.url);
        }

        handleClose();
      } else {
        throw new Error("L'envoi n'a pas retourné d'adresse valide.");
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi de la pièce jointe :", err);
      setErrorMsg(`Échec de l'envoi : ${err.message || 'Erreur réseau'}.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none outline-none"
    >
      <div className="max-w-md w-full max-h-[90vh] flex flex-col bg-cordel-bg text-left relative rounded-lg border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden">
        {/* 1. En-tête */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
              <span>📎 Joindre une photo ou un fichier</span>
            </h3>
            <p className="text-[11px] text-cordel-master-dark/80 font-medium">
              Choisissez un document ou une photo depuis votre appareil.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer disabled:opacity-50 shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* 2. Corps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <label htmlFor="forumAttachmentFileInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
              Fichier depuis votre appareil
            </label>
            
            <input
              ref={fileInputRef}
              id="forumAttachmentFileInput"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp3,.ogg,.wav"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-2 file:border-encre-noire file:text-xs file:font-bold file:uppercase file:bg-cordel-bg file:text-encre-noire hover:file:bg-amber-100 cursor-pointer"
            />

            <p className="text-[10px] text-stone-500 font-medium">
              💡 Formats acceptés : Photos (JPG, PNG, WebP), Documents (PDF, Word, Tableur), Audios (MP3, WAV).
            </p>

            {/* Aperçu du fichier sélectionné */}
            {selectedFile && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded">
                {isImage && filePreview ? (
                  <img 
                    src={filePreview} 
                    alt="Aperçu" 
                    className="w-14 h-14 object-cover rounded border border-encre-noire/30 shadow-xs shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0">
                    📄
                  </div>
                )}
                <div className="flex flex-col text-[11px] font-medium text-stone-700 truncate min-w-0 flex-1">
                  <span className="font-bold truncate">{selectedFile.name}</span>
                  <span className="text-stone-500">{(selectedFile.size / 1024).toFixed(1)} Ko</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {isImage ? 'Photo (sera optimisée)' : 'Document joint'}
                  </span>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-stone-400 hover:text-red-600 p-1 font-bold cursor-pointer"
                    title="Changer de fichier"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Feedback visuel pendant le téléversement */}
          {isUploading && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 rounded text-amber-900 dark:text-amber-200 text-xs font-semibold animate-pulse">
              <span className="inline-block animate-spin text-sm">⏳</span>
              <span>Envoi et optimisation de la pièce jointe...</span>
            </div>
          )}

          {errorMsg && (
            <span className="text-[11px] font-bold text-red-600 block">
              ⚠️ {errorMsg}
            </span>
          )}
        </div>

        {/* 3. Pied de page */}
        <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/15 flex justify-end gap-2 bg-cordel-bg">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>

          <CordelButton
            type="button"
            onClick={handleUploadAndInsert}
            variant="vert"
            useExtremeBorder={true}
            disabled={isUploading || !selectedFile}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                <span>Envoi...</span>
              </>
            ) : (
              <span>Insérer la pièce jointe</span>
            )}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
