import React, { useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale d'insertion d'image pour le Forum.
 * Permet soit l'upload direct vers Firebase Storage (dossier forum_images/),
 * soit l'insertion via un lien web externe.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modale
 * @param {Function} props.onClose - Annulation / Fermeture
 * @param {Function} props.onInsertImage - Callback qui reçoit l'URL d'image validée
 * @param {string} [props.lienDepotForum=''] - Lien externe configuré par l'administrateur
 * @param {string} [props.groupId=''] - Identifiant du groupe/association pour organiser les fichiers
 */
export default function ForumImageInsertModal({ 
  isOpen, 
  onClose, 
  onInsertImage, 
  lienDepotForum = '', 
  groupId = '' 
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'external'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const targetUploadUrl = lienDepotForum || 'https://framaspace.org';

  // Gestion du choix d'un fichier image local
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg("Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF, WebP...).");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("L'image est trop volumineuse (maximum 10 Mo).");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Réinitialisation et fermeture propre
  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setFilePreview(null);
    setImageUrl('');
    setErrorMsg('');
    setIsUploading(false);
    onClose();
  };

  // Téléversement direct du fichier vers Firebase Storage dans forum_images/
  const handleUploadAndInsert = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Veuillez sélectionner un fichier image sur votre appareil.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');

      // Nom de fichier unique et sécurisé
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folderPath = groupId ? `forum_images/${groupId}` : 'forum_images';
      const fileStoragePath = `${folderPath}/${Date.now()}_${cleanFileName}`;

      const fileRef = storageRef(storage, fileStoragePath);

      // Upload du fichier vers Firebase Storage
      const snapshot = await uploadBytes(fileRef, selectedFile, {
        contentType: selectedFile.type || 'image/jpeg'
      });

      // Récupération de l'URL publique de téléchargement
      const downloadUrl = await getDownloadURL(snapshot.ref);

      if (onInsertImage) {
        onInsertImage(downloadUrl);
      }

      handleClose();
    } catch (err) {
      console.error("Erreur lors du téléversement de l'image dans forum_images/ :", err);
      setErrorMsg("Échec du téléversement. Vérifiez votre connexion ou essayez via l'onglet Lien externe.");
    } finally {
      setIsUploading(false);
    }
  };

  // Validation et insertion via URL externe
  const handleExternalInsert = (e) => {
    e.preventDefault();
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      setErrorMsg("Veuillez coller le lien de votre image.");
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMsg("L'adresse de l'image doit commencer par http:// ou https://");
      return;
    }

    setErrorMsg('');
    if (onInsertImage) {
      onInsertImage(trimmedUrl);
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <CordelCard variant="default" useExtremeBorder={true} className="max-w-md w-full p-6 bg-cordel-bg text-left relative flex flex-col gap-5">
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isUploading}
          className="absolute top-4 right-4 w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer disabled:opacity-50"
        >
          ✕
        </button>

        {/* En-tête */}
        <div className="flex flex-col gap-1 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🖼️ Insérer une photo dans le forum</span>
          </h3>
          <p className="text-xs text-cordel-master-dark/80 font-medium leading-relaxed">
            Choisissez d'envoyer un fichier depuis votre appareil ou d'utiliser un lien d'image externe.
          </p>
        </div>

        {/* Système d'onglets (Upload Local vs Lien Externe) */}
        <div className="flex items-center gap-2 border-b border-encre-noire/20 pb-2">
          <button
            type="button"
            onClick={() => { if (!isUploading) { setActiveTab('upload'); setErrorMsg(''); } }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-cordel-wood text-white border border-encre-noire shadow-xs'
                : 'bg-white/60 text-encre-noire border border-encre-noire/20 hover:bg-white'
            }`}
          >
            📤 Importer un fichier
          </button>
          <button
            type="button"
            onClick={() => { if (!isUploading) { setActiveTab('external'); setErrorMsg(''); } }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
              activeTab === 'external'
                ? 'bg-cordel-wood text-white border border-encre-noire shadow-xs'
                : 'bg-white/60 text-encre-noire border border-encre-noire/20 hover:bg-white'
            }`}
          >
            🔗 Lien externe
          </button>
        </div>

        {/* Option 1 : Upload de fichier local vers Firebase Storage */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadAndInsert} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
              <label htmlFor="forumImageFileInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
                Choisir une image sur votre appareil
              </label>
              
              <input
                id="forumImageFileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-2 file:border-encre-noire file:text-xs file:font-bold file:uppercase file:bg-cordel-bg file:text-encre-noire hover:file:bg-amber-100 cursor-pointer"
              />

              {/* Aperçu de la photo sélectionnée */}
              {filePreview && (
                <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded">
                  <img 
                    src={filePreview} 
                    alt="Aperçu" 
                    className="w-14 h-14 object-cover rounded border border-encre-noire/30 shadow-xs" 
                  />
                  <div className="flex flex-col text-[11px] font-medium text-stone-700 truncate">
                    <span className="font-bold truncate">{selectedFile?.name}</span>
                    <span className="text-stone-500">{(selectedFile?.size / 1024).toFixed(1)} Ko</span>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <span className="text-[11px] font-bold text-red-600">
                ⚠️ {errorMsg}
              </span>
            )}

            {/* Zone d'actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>

              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={isUploading || !selectedFile}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <span>Téléverser & Insérer</span>
                )}
              </CordelButton>
            </div>
          </form>
        )}

        {/* Option 2 : Lien d'image externe */}
        {activeTab === 'external' && (
          <form onSubmit={handleExternalInsert} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
              <label htmlFor="forumImageLinkInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
                Coller l'URL d'une image en ligne
              </label>
              <input
                id="forumImageLinkInput"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Ex : https://domaine.com/image.jpg"
                className="theme-input text-xs font-bold py-2 w-full border border-encre-noire/30 rounded px-2"
              />
              <p className="text-[10px] text-stone-500 font-medium mt-1">
                L'image doit être hébergée publiquement sur le Web.
              </p>
            </div>

            {targetUploadUrl && (
              <div className="flex flex-col gap-1.5 p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] font-bold uppercase text-stone-600">
                  Dépôt externe partagé de l'association :
                </span>
                <button
                  type="button"
                  onClick={() => window.open(targetUploadUrl, '_blank', 'noopener,noreferrer')}
                  className="py-1.5 px-3 text-[11px] font-bold bg-white text-encre-noire border border-encre-noire/40 rounded hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Ouvrir l'espace de stockage externe ↗</span>
                </button>
              </div>
            )}

            {errorMsg && (
              <span className="text-[11px] font-bold text-red-600">
                ⚠️ {errorMsg}
              </span>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Annuler
              </button>

              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={!imageUrl.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Insérer l'image
              </CordelButton>
            </div>
          </form>
        )}
      </CordelCard>
    </div>
  );
}
