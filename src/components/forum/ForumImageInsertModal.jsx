import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale d'insertion d'image en 2 étapes pour le Forum.
 * Guide l'utilisateur vers le dépôt externe (Framaspace, Drive...) pour récupérer son lien public.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modale
 * @param {Function} props.onClose - Annulation
 * @param {Function} props.onInsertImage - Callback qui reçoit l'URL d'image validée
 * @param {string} props.lienDepotForum - Lien externe configuré par l'administrateur
 */
export default function ForumImageInsertModal({ isOpen, onClose, onInsertImage, lienDepotForum = '' }) {
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const targetUploadUrl = lienDepotForum || 'https://framaspace.org';

  const handleOpenStorage = () => {
    window.open(targetUploadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmInsert = (e) => {
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
    setImageUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <CordelCard variant="default" useExtremeBorder={true} className="max-w-md w-full p-6 bg-cordel-bg text-left relative flex flex-col gap-5">
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer"
        >
          ✕
        </button>

        {/* En-tête */}
        <div className="flex flex-col gap-1 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🖼️ Insérer une photo dans la discussion</span>
          </h3>
          <p className="text-xs text-cordel-master-dark/80 font-medium leading-relaxed">
            Afin de préserver le stockage, les images sont hébergées sur notre espace partagé.
          </p>
        </div>

        <form onSubmit={handleConfirmInsert} className="flex flex-col gap-5">
          {/* Étape 1 : Dépôt de l'image */}
          <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
                Étape 1 : Déposer la photo
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Déposez votre photo dans notre dossier partagé, puis copiez son lien public.
            </p>
            <button
              type="button"
              onClick={handleOpenStorage}
              className="mt-1 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-cordel-bg text-encre-noire border-2 border-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-amber-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>1. Déposer mon image en ligne ↗</span>
            </button>
          </div>

          {/* Étape 2 : Coller le lien */}
          <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <label htmlFor="forumImageLinkInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
              Étape 2 : Coller le lien
            </label>
            <input
              id="forumImageLinkInput"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="2. Collez le lien de l'image ici (ex: https://...)"
              className="theme-input text-xs font-bold py-2 w-full border border-encre-noire/30 rounded"
            />
            {errorMsg && (
              <span className="text-[10px] font-bold text-red-600">
                ⚠️ {errorMsg}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Annuler
            </button>

            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Insérer l'image
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
