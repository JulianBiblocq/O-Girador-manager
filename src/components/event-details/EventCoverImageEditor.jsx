import React from 'react';
import EventStampSelector from '../agenda/EventStampSelector';
import { useEventCoverImage } from '../../hooks/useEventCoverImage';

/**
 * Éditeur de visuel de couverture d'un événement (Upload, Varal, URL + Tampon Cordel)
 * utilisable aussi bien à la création (EventFormFields / EventCreateForm) qu'à l'édition (EventEditForm).
 */
export default function EventCoverImageEditor({
  editForm,
  setEditForm,
  imageMode,
  setImageMode,
  uploadingImage,
  handleImageUpload,
  varalPhotos,
  groupId,
  savingEvent = false,
  translate,
  tr
}) {
  const {
    internalImageMode,
    setInternalImageMode,
    internalUploadingImage,
    internalHandleImageUpload,
    internalVaralPhotos
  } = useEventCoverImage({
    groupId: groupId || editForm?.groupId,
    setEditForm,
    translate,
    externalVaralPhotos: varalPhotos
  });

  const activeImageMode = setImageMode ? (imageMode || 'upload') : internalImageMode;
  const activeSetImageMode = setImageMode || setInternalImageMode;
  const activeUploadingImage = handleImageUpload ? Boolean(uploadingImage) : internalUploadingImage;
  const activeHandleImageUpload = handleImageUpload || internalHandleImageUpload;
  const activeVaralPhotos = Array.isArray(varalPhotos) ? varalPhotos : internalVaralPhotos;
  const currentImageUrl = editForm?.imageUrl || editForm?.coverImage || '';

  const updateImageUrl = (newUrl) => {
    if (!setEditForm) return;
    setEditForm((prev) => ({
      ...prev,
      imageUrl: newUrl,
      coverImage: newUrl
    }));
  };

  return (
    <div className="flex flex-col gap-2.5 pt-4 mt-2 border-t border-dashed border-cordel-master-dark/20 text-left">
      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
        {translate ? translate('widgetAgenda.imageUrlLabel', "Image de l'événement / Affiche & Tampon Cordel") : "Image de l'événement / Affiche & Tampon Cordel"}
      </label>

      <div className="flex gap-2 mb-0.5 flex-wrap">
        <button
          type="button"
          onClick={() => activeSetImageMode('upload')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            activeImageMode === 'upload'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          📸 {tr ? (tr('agenda.uploadClassicTab') || 'Upload classique') : 'Upload classique'}
        </button>
        <button
          type="button"
          onClick={() => activeSetImageMode('varal')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            activeImageMode === 'varal'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          🪢 {tr ? (tr('agenda.fromVaralTab', { count: activeVaralPhotos.length }) || `Depuis le Varal (${activeVaralPhotos.length})`) : `Depuis le Varal (${activeVaralPhotos.length})`}
        </button>
        <button
          type="button"
          onClick={() => activeSetImageMode('url')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            activeImageMode === 'url'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          🔗 {tr ? (tr('agenda.externalUrlTab') || 'Lien URL externe') : 'Lien URL externe'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {currentImageUrl && (
            <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-xs">
              <img src={currentImageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
            </div>
          )}

          {activeImageMode === 'upload' && (
            <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-2 rounded shadow-xs hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 select-none">
              {activeUploadingImage ? '⏳ Téléversement...' : '📸 Choisir un fichier'}
              <input
                type="file"
                accept="image/*"
                disabled={savingEvent || activeUploadingImage}
                onChange={activeHandleImageUpload}
                className="hidden"
              />
            </label>
          )}

          {activeImageMode === 'url' && (
            <input
              type="url"
              value={currentImageUrl}
              onChange={(e) => updateImageUrl(e.target.value)}
              disabled={savingEvent}
              placeholder="https://..."
              className="theme-input text-xs py-1.5 px-2 flex-1"
            />
          )}

          {currentImageUrl && (
            <button
              type="button"
              onClick={() => updateImageUrl('')}
              className="text-[10px] font-bold text-red-700 hover:underline select-none cursor-pointer"
            >
              {(tr && tr('agenda.btnRemoveImage')) || "Supprimer l'image"}
            </button>
          )}
        </div>

        {activeImageMode === 'varal' && (
          <div className="flex flex-col gap-2 p-2 bg-cordel-bg/70 border border-dashed border-cordel-master-dark/30 rounded">
            {activeVaralPhotos.length === 0 ? (
              <span className="text-[10px] italic opacity-60">
                Aucune photo trouvée dans la médiathèque du Varal.
              </span>
            ) : (
              <>
                <select
                  value={currentImageUrl}
                  onChange={(e) => updateImageUrl(e.target.value)}
                  className="theme-input w-full text-xs font-bold py-1.5 bg-white"
                >
                  <option value="">-- Choisir une photo du Varal --</option>
                  {activeVaralPhotos.map((p) => (
                    <option key={p.id} value={p.fileUrl}>
                      {p.titre} ({p.categorie})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {activeVaralPhotos.slice(0, 10).map((p) => {
                    const isSelected = currentImageUrl === p.fileUrl;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updateImageUrl(p.fileUrl)}
                        className={`w-12 h-12 rounded border-2 shrink-0 overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-encre-noire ring-2 ring-cordel-wood scale-105 shadow-md'
                            : 'border-stone-300 opacity-80 hover:opacity-100 hover:border-encre-noire'
                        }`}
                        title={p.titre}
                      >
                        <img src={p.fileUrl} alt={p.titre} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Galerie de sélection du Tampon Cordel (utilisée lorsqu'aucune image n'est définie) */}
        <EventStampSelector
          formData={editForm}
          setFormData={setEditForm}
          disabled={savingEvent}
        />
      </div>
    </div>
  );
}

