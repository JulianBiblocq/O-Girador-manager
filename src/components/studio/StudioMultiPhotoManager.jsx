import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../../firebase';
import CordelButton from '../CordelButton';
import StudioVaralPickerModal from './StudioVaralPickerModal';

/**
 * Gestionnaire multi-photos pour le Studio Social :
 * Upload direct par lot avec compression, sélection Varal, ordonnancement et photo de couverture.
 */
export default function StudioMultiPhotoManager({
  groupId,
  mediaList = [],
  setMediaList,
  selectedEvent = null,
  varalImages = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isVaralModalOpen, setIsVaralModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Traitement et compression d'une liste de fichiers images
   */
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    // Créer immédiatement les entrées locales avec aperçu instantané
    const newItems = validFiles.map((file, idx) => ({
      id: `local_${Date.now()}_${idx}`,
      url: URL.createObjectURL(file),
      file,
      name: file.name,
      source: 'upload',
      isCover: mediaList.length === 0 && idx === 0,
      isUploading: true
    }));

    setMediaList(prev => [...prev, ...newItems]);

    // Téléverser chaque fichier avec compression en tâche de fond
    for (const item of newItems) {
      try {
        let fileToUpload = item.file;
        try {
          fileToUpload = await imageCompression(item.file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true
          });
        } catch (compErr) {
          console.warn("Studio - Repli sur fichier original sans compression :", compErr);
        }

        const cleanName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetGroup = groupId || 'Samambaia';
        const storagePath = `documents/${targetGroup}/studio_social/${Date.now()}_${cleanName}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, fileToUpload);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, url: downloadUrl, isUploading: false } : m));
      } catch (uploadErr) {
        console.error("Studio - Erreur upload image :", uploadErr);
        setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, isUploading: false, error: true } : m));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddEventPoster = () => {
    if (!selectedEvent?.imageUrl) return;
    const exists = mediaList.some(m => m.url === selectedEvent.imageUrl);
    if (exists) return;

    setMediaList(prev => [
      ...prev,
      {
        id: `evt_${Date.now()}`,
        url: selectedEvent.imageUrl,
        name: `Affiche : ${selectedEvent.titre || 'Événement'}`,
        source: 'event',
        isCover: prev.length === 0,
        isUploading: false
      }
    ]);
  };

  const handleSelectVaralImages = (chosenImages) => {
    const toAdd = chosenImages
      .filter(img => !mediaList.some(m => m.url === img.fileUrl))
      .map((img, idx) => ({
        id: `varal_${Date.now()}_${idx}`,
        url: img.fileUrl,
        name: img.titre || 'Photo Varal',
        source: 'varal',
        isCover: mediaList.length === 0 && idx === 0,
        isUploading: false
      }));

    setMediaList(prev => [...prev, ...toAdd]);
  };

  const moveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= mediaList.length) return;
    setMediaList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((item, i) => ({ ...item, isCover: i === 0 }));
    });
  };

  const setAsCover = (index) => {
    if (index === 0) return;
    setMediaList(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy.map((m, i) => ({ ...m, isCover: i === 0 }));
    });
  };

  const removeItem = (id) => {
    setMediaList(prev => {
      const filtered = prev.filter(m => m.id !== id);
      return filtered.map((m, i) => ({ ...m, isCover: i === 0 }));
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barre d'outils d'ajout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
          📸 Photos de la publication ({mediaList.length})
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedEvent?.imageUrl && (
            <button
              type="button"
              onClick={handleAddEventPoster}
              className="px-2.5 py-1 text-[10px] font-bold bg-white border border-encre-noire rounded hover:bg-neutral-100 cursor-pointer text-cordel-wood"
            >
              + Affiche événement
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsVaralModalOpen(true)}
            className="px-2.5 py-1 text-[10px] font-bold bg-white border border-encre-noire rounded hover:bg-neutral-100 cursor-pointer"
          >
            📂 Depuis le Varal
          </button>
        </div>
      </div>

      {/* Zone Drag & Drop et Sélecteur local */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-[var(--color-cordel-vert)] bg-emerald-50 scale-[1.01]' 
            : 'border-cordel-master-dark/40 bg-cordel-bg hover:bg-white/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl select-none">📤</span>
          <p className="text-xs font-black uppercase tracking-wider text-encre-noire">
            Glissez-déposez vos photos ici ou cliquez pour parcourir
          </p>
          <span className="text-[9.5px] text-stone-500 font-semibold">
            Sélection multiple autorisée (JPEG, PNG, WebP) - Compression auto
          </span>
        </div>
      </div>

      {/* Miniatures ordonnables */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {mediaList.map((item, index) => (
            <div
              key={item.id}
              className={`relative group rounded border-2 overflow-hidden bg-white shadow-xs flex flex-col ${
                item.isCover ? 'border-amber-600 ring-2 ring-[var(--color-cordel-ocre)]' : 'border-stone-300'
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                {item.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Upload...</span>
                  </div>
                )}
                {item.isCover && (
                  <span className="absolute top-1 left-1 bg-amber-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs">
                    ★ Couverture
                  </span>
                )}
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                  #{index + 1}
                </span>
              </div>

              {/* Boutons d'action sur la miniature */}
              <div className="flex items-center justify-between p-1 bg-stone-50 border-t border-stone-200 text-[10px]">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    className="p-0.5 hover:bg-stone-200 rounded disabled:opacity-30 cursor-pointer"
                    title="Déplacer vers la gauche"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={index === mediaList.length - 1}
                    onClick={() => moveItem(index, 1)}
                    className="p-0.5 hover:bg-stone-200 rounded disabled:opacity-30 cursor-pointer"
                    title="Déplacer vers la droite"
                  >
                    ▶
                  </button>
                  {!item.isCover && (
                    <button
                      type="button"
                      onClick={() => setAsCover(index)}
                      className="p-0.5 text-amber-700 hover:bg-amber-100 rounded cursor-pointer font-black"
                      title="Définir en photo de couverture"
                    >
                      ★
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-0.5 text-[var(--color-cordel-rouge)] hover:bg-red-100 rounded cursor-pointer font-black"
                  title="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale Varal */}
      <StudioVaralPickerModal
        isOpen={isVaralModalOpen}
        onClose={() => setIsVaralModalOpen(false)}
        varalImages={varalImages}
        onSelectImages={handleSelectVaralImages}
      />
    </div>
  );
}
