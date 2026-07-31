import React, { useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * Sous-composant dédié à l'administration de la Galerie Photos de la vitrine publique.
 * Gère l'upload multiple vers Firebase Storage (dossier vitrine_gallery/),
 * la suppression de photos et l'ajout direct par URL.
 */
export default function TabPublicGallery({ formData, handleChange, groupId, saving }) {
  const publicTheme = formData.publicTheme || {};
  const galleryPhotos = Array.isArray(publicTheme.galleryPhotos) ? publicTheme.galleryPhotos : [];

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');

  // Mise à jour du tableau des photos dans le formulaire publicTheme
  const updateGalleryPhotos = (newPhotos) => {
    const updatedTheme = {
      ...publicTheme,
      galleryPhotos: newPhotos
    };
    handleChange('publicTheme', updatedTheme);
  };

  // Traitement et téléversement multiple vers Firebase Storage
  const handleMultipleFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !groupId) return;

    setUploading(true);
    setUploadProgress(`Optimisation & Envoi de 0 / ${files.length}...`);

    const uploadedUrls = [];
    const compressionOptions = { maxSizeMB: 1.0, maxWidthOrHeight: 1920, useWebWorker: true };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Traitement de la photo ${i + 1} / ${files.length}...`);

        let fileToUpload = file;
        try {
          fileToUpload = await imageCompression(file, compressionOptions);
        } catch (compErr) {
          console.warn("Erreur de compression d'image galerie, envoi du fichier brut:", compErr);
        }

        const fileName = `photo_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
        const photoStorageRef = storageRef(storage, `associations/${groupId}/vitrine_gallery/${fileName}`);
        
        const snapshot = await uploadBytes(photoStorageRef, fileToUpload);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }

      // Fusion des nouvelles photos téléversées avec la liste existante
      updateGalleryPhotos([...galleryPhotos, ...uploadedUrls]);
      setUploadProgress(`✓ ${uploadedUrls.length} photo(s) ajoutée(s) avec succès !`);
    } catch (err) {
      console.error("Erreur lors de l'upload des photos de la galerie:", err);
      setUploadProgress(`❌ Erreur lors de l'envoi : ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const [draggedIndex, setDraggedIndex] = useState(null);

  // Déplacement d'une photo de fromIndex vers toIndex dans le tableau
  const handleMovePhoto = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= galleryPhotos.length || fromIndex === toIndex) return;
    const newPhotos = [...galleryPhotos];
    const [movedItem] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedItem);
    updateGalleryPhotos(newPhotos);
  };

  // Suppression d'une photo par son index dans le tableau
  const handleDeletePhoto = (indexToDelete) => {
    const filtered = galleryPhotos.filter((_, index) => index !== indexToDelete);
    updateGalleryPhotos(filtered);
  };

  // Ajout manuel d'une photo par son URL externe
  const handleAddUrl = () => {
    if (!newUrlInput.trim()) return;
    updateGalleryPhotos([...galleryPhotos, newUrlInput.trim()]);
    setNewUrlInput('');
  };

  const vitrineTexts = publicTheme.vitrineTexts || {};

  // Mise à jour d'un texte spécifique dans vitrineTexts
  const handleTextChange = (fieldKey, value) => {
    const updatedTexts = {
      ...(publicTheme.vitrineTexts || {}),
      [fieldKey]: value
    };

    handleChange('publicTheme', {
      ...publicTheme,
      vitrineTexts: updatedTexts
    });
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
      <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
        <span>📸 Section Galerie Photos ("En images")</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          publicTheme.afficherGalerie !== false 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
            : 'bg-stone-100 text-stone-600 border-stone-300'
        }`}>
          {publicTheme.afficherGalerie !== false ? '✓ Section Active' : '⚪ Section Masquée'}
        </span>
      </h4>

      {/* Interrupteur Bascule (Toggle) d'activation de la Galerie */}
      <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
        <input
          type="checkbox"
          id="afficherGalerie"
          checked={publicTheme.afficherGalerie !== false}
          onChange={(e) => handleChange('publicTheme', { ...publicTheme, afficherGalerie: e.target.checked })}
          disabled={saving}
          className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
        />
        <label htmlFor="afficherGalerie" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
          <span>Afficher la section Galerie Photos sur le site vitrine</span>
        </label>
      </div>

      {/* Titres & Accroche de la Galerie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Titre Galerie */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Titre de la section Galerie
          </label>
          <input
            type="text"
            value={vitrineTexts.titreGalerie || ''}
            onChange={(e) => handleTextChange('titreGalerie', e.target.value)}
            disabled={saving}
            placeholder="Galerie Photos / En Images"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Badge Galerie */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Sur-titre / Badge Galerie
          </label>
          <input
            type="text"
            value={vitrineTexts.badgeGalerie || ''}
            onChange={(e) => handleTextChange('badgeGalerie', e.target.value)}
            disabled={saving}
            placeholder="En Images"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>
      </div>

      {/* Accroche Galerie */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
          Description / Accroche Galerie
        </label>
        <textarea
          rows={2}
          value={vitrineTexts.accrocheGalerie || ''}
          onChange={(e) => handleTextChange('accrocheGalerie', e.target.value)}
          disabled={saving}
          placeholder="Découvrez nos prestations scéniques, répétitions et sorties en images !"
          className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none"
        />
      </div>

      {/* Zone de téléversement multiple */}
      <div className="flex flex-col gap-3 p-4 bg-[#fdfaf2] border border-dashed border-encre-noire/25 rounded-[4px_6px_3px_5px]">
        <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>📤 Téléverser de nouvelles photos (Sélection multiple)</span>
        </label>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleMultipleFilesUpload}
            disabled={saving || uploading}
            className="flex-1 text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[var(--color-cordel-vert,#2d6a4f)] file:text-white hover:file:brightness-110 cursor-pointer disabled:opacity-50"
          />
        </div>

        {uploadProgress && (
          <span className={`text-xs font-bold ${uploadProgress.includes('❌') ? 'text-red-700' : 'text-emerald-800 animate-pulse'}`}>
            {uploadProgress}
          </span>
        )}

        <span className="text-[10px] text-stone-500 font-medium italic">
          💡 Vous pouvez sélectionner plusieurs images d'un coup. Elles seront automatiquement optimisées pour un chargement rapide sur mobile.
        </span>
      </div>

      {/* Alternative : Ajout par URL */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
          🔗 Ou ajouter directement une image par son lien URL :
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            placeholder="https://exemple.com/photo.jpg"
            disabled={saving || uploading}
            className="flex-1 text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!newUrlInput.trim() || saving || uploading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Grille des photos actuelles avec ordonnancement & suppression */}
      <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            🖼️ Photos actuellement enregistrées ({galleryPhotos.length})
          </span>
          {galleryPhotos.length > 1 && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              💡 Réorganisez l'ordre par glisser-déposer ou via les flèches ⬅️ ➡️
            </span>
          )}
        </div>

        {galleryPhotos.length === 0 ? (
          <div className="p-6 border border-dashed border-stone-300 rounded bg-stone-50 text-center text-xs text-stone-500">
            Aucune photo dans la galerie pour le moment. Téléversez-en ci-dessus pour alimenter le carrousel !
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
            {galleryPhotos.map((photoUrl, index) => {
              const isFirst = index === 0;
              const isLast = index === galleryPhotos.length - 1;
              const isDragging = draggedIndex === index;

              return (
                <div 
                  key={`${photoUrl}-${index}`}
                  draggable={!saving && !uploading}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(index));
                    setDraggedIndex(index);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
                    if (!isNaN(fromIndex) && fromIndex !== index) {
                      handleMovePhoto(fromIndex, index);
                    }
                    setDraggedIndex(null);
                  }}
                  className={`relative group rounded-lg overflow-hidden border-2 shadow-xs aspect-square bg-stone-900 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isDragging ? 'opacity-40 border-dashed border-amber-500 scale-95' : 'border-stone-300 hover:border-amber-500'
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={`Galerie ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  
                  {/* Badge de position */}
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white font-mono font-bold text-[10px] rounded backdrop-blur-xs border border-white/20">
                    #{index + 1}
                  </span>

                  {/* Bouton de suppression */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(index)}
                    disabled={saving || uploading}
                    title="Supprimer cette photo"
                    className="absolute top-1.5 right-1.5 p-1 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[10px] font-bold rounded-full shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center w-6 h-6 z-10"
                  >
                    ✕
                  </button>

                  {/* Barre d'action d'ordonnancement (Flèches Gauche / Droite) */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white p-1.5 flex items-center justify-between gap-1 z-10 backdrop-blur-xs">
                    {/* Flèche Déplacer vers la Gauche / Plus Haut (Rang -1) */}
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, index - 1)}
                      disabled={isFirst || saving || uploading}
                      title={isFirst ? "Première photo de la liste" : "Déplacer vers la gauche (Avancer le rang)"}
                      className={`px-2 py-0.5 rounded text-[11px] font-black transition-all flex items-center justify-center ${
                        isFirst
                          ? 'opacity-30 text-stone-400 cursor-not-allowed bg-stone-800'
                          : 'bg-stone-700 hover:bg-amber-500 hover:text-stone-950 text-white cursor-pointer active:scale-90'
                      }`}
                    >
                      ⬅️
                    </button>

                    <span className="text-[9px] font-mono font-bold text-stone-300 truncate">
                      Rang {index + 1}
                    </span>

                    {/* Flèche Déplacer vers la Droite / Plus Bas (Rang +1) */}
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, index + 1)}
                      disabled={isLast || saving || uploading}
                      title={isLast ? "Dernière photo de la liste" : "Déplacer vers la droite (Reculer le rang)"}
                      className={`px-2 py-0.5 rounded text-[11px] font-black transition-all flex items-center justify-center ${
                        isLast
                          ? 'opacity-30 text-stone-400 cursor-not-allowed bg-stone-800'
                          : 'bg-stone-700 hover:bg-amber-500 hover:text-stone-950 text-white cursor-pointer active:scale-90'
                      }`}
                    >
                      ➡️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CordelCard>
  );
}
