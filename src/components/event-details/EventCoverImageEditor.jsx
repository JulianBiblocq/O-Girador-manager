import React from 'react';
import EventStampSelector from '../agenda/EventStampSelector';

/**
 * Éditeur de visuel de couverture d'un événement (Upload, Varal, URL + Tampon Cordel)
 * extrait de EventEditForm.jsx (Règle du Boy Scout).
 */
export default function EventCoverImageEditor({
  editForm,
  setEditForm,
  imageMode = 'upload',
  setImageMode,
  uploadingImage = false,
  handleImageUpload,
  varalPhotos = [],
  savingEvent = false,
  translate,
  tr
}) {
  return (
    <div className="flex flex-col gap-2.5 pt-4 mt-2 border-t border-dashed border-cordel-master-dark/20 text-left">
      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
        {translate('widgetAgenda.imageUrlLabel', "Image de l'événement / Affiche & Tampon Cordel")}
      </label>

      <div className="flex gap-2 mb-0.5 flex-wrap">
        <button
          type="button"
          onClick={() => setImageMode && setImageMode('upload')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            imageMode === 'upload'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          📸 {tr('agenda.uploadClassicTab') || 'Upload classique'}
        </button>
        <button
          type="button"
          onClick={() => setImageMode && setImageMode('varal')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            imageMode === 'varal'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          🪢 {tr('agenda.fromVaralTab', { count: varalPhotos.length }) || `Depuis le Varal (${varalPhotos.length})`}
        </button>
        <button
          type="button"
          onClick={() => setImageMode && setImageMode('url')}
          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            imageMode === 'url'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
              : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
          }`}
        >
          🔗 {tr('agenda.externalUrlTab') || 'Lien URL externe'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {editForm.imageUrl && (
            <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-xs">
              <img src={editForm.imageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
            </div>
          )}

          {imageMode === 'upload' && (
            <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-2 rounded shadow-xs hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 select-none">
              {uploadingImage ? '⏳ Téléversement...' : '📸 Choisir un fichier'}
              <input
                type="file"
                accept="image/*"
                disabled={savingEvent || uploadingImage}
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}

          {imageMode === 'url' && (
            <input
              type="url"
              value={editForm.imageUrl || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              disabled={savingEvent}
              placeholder="https://..."
              className="theme-input text-xs py-1.5 px-2 flex-1"
            />
          )}

          {editForm.imageUrl && (
            <button
              type="button"
              onClick={() => setEditForm((prev) => ({ ...prev, imageUrl: '' }))}
              className="text-[10px] font-bold text-red-700 hover:underline select-none cursor-pointer"
            >
              {tr('agenda.btnRemoveImage') || "Supprimer l'image"}
            </button>
          )}
        </div>

        {imageMode === 'varal' && (
          <div className="flex flex-col gap-2 p-2 bg-cordel-bg/70 border border-dashed border-cordel-master-dark/30 rounded">
            {varalPhotos.length === 0 ? (
              <span className="text-[10px] italic opacity-60">
                Aucune photo trouvée dans la médiathèque du Varal.
              </span>
            ) : (
              <>
                <select
                  value={editForm.imageUrl || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="theme-input w-full text-xs font-bold py-1.5 bg-white"
                >
                  <option value="">-- Choisir une photo du Varal --</option>
                  {varalPhotos.map((p) => (
                    <option key={p.id} value={p.fileUrl}>
                      {p.titre} ({p.categorie})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {varalPhotos.slice(0, 10).map((p) => {
                    const isSelected = editForm.imageUrl === p.fileUrl;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, imageUrl: p.fileUrl }))}
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

