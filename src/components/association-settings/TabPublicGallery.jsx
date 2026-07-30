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

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white">
      <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
        <span>📸 Galerie Photos Vitrine ("En images")</span>
        <span className="text-[10px] text-stone-500 font-normal">
          {galleryPhotos.length} photo(s) au carrousel
        </span>
      </h4>

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

      {/* Grille des photos actuelles avec suppression */}
      <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 mt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
          🖼️ Photos actuellement enregistrées ({galleryPhotos.length})
        </span>

        {galleryPhotos.length === 0 ? (
          <div className="p-6 border border-dashed border-stone-300 rounded bg-stone-50 text-center text-xs text-stone-500">
            Aucune photo dans la galerie pour le moment. Téléversez-en ci-dessus pour alimenter le carrousel !
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
            {galleryPhotos.map((photoUrl, index) => (
              <div 
                key={`${photoUrl}-${index}`}
                className="relative group rounded-lg overflow-hidden border border-stone-200 shadow-xs aspect-square bg-stone-900"
              >
                <img
                  src={photoUrl}
                  alt={`Galerie ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Bouton de suppression au survol/coin */}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(index)}
                  disabled={saving || uploading}
                  title="Supprimer cette photo"
                  className="absolute top-1.5 right-1.5 p-1.5 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[10px] font-bold rounded-full shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center w-6 h-6"
                >
                  ✕
                </button>

                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-2 py-1 truncate">
                  Photo {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CordelCard>
  );
}
