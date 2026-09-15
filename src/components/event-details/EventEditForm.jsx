import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventFormFields from '../agenda/EventFormFields';
import ImportAgendaModal from '../agenda/ImportAgendaModal';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

/**
 * EventEditForm - Formulaire de modification d'événement unifié
 * Repose sur le composant modulaire EventFormFields (3 étages)
 * et ajoute la gestion de l'image de couverture et de suppression.
 */
export default function EventEditForm({
  editForm,
  setEditForm,
  savingEvent = false,
  handleSaveEvent,
  handleDeleteEvent,
  dressCodes = [],
  wardrobeCostumes = [],
  editConfig = {},
  rawEditConfig = {},
  associationEventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion'],
  adresseLocal = '',
  lieuxImportants = [],
  defaultLocationsByEventType = {},
  imageMode = 'upload',
  setImageMode,
  uploadingImage = false,
  handleImageUpload,
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  eventTypeConfigs = {},
  t,
  groupId,
  defaultDropUrl = ''
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [varalPhotos, setVaralPhotos] = useState([]);

  // Chargement en temps réel des photos du Varal pour sélection directe
  useEffect(() => {
    if (!groupId) return;
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photos = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const candidateUrl = data.fileUrl || data.url || data.imageUrl || data.photoUrl || data.visuelAnimeUrl || '';
        const isExplicitImage = data.type === 'image' || data.typeDoc === 'image';
        const hasImageExt = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(candidateUrl);
        const isStorageImage = candidateUrl.includes('firebasestorage.googleapis.com') &&
          !candidateUrl.includes('.pdf') &&
          !candidateUrl.includes('.mp3') &&
          !candidateUrl.includes('.wav') &&
          !candidateUrl.includes('.mp4');

        if (candidateUrl && (isExplicitImage || hasImageExt || isStorageImage)) {
          photos.push({
            id: docSnap.id,
            titre: data.titre || data.nom || 'Photo Varal',
            fileUrl: candidateUrl,
            categorie: data.categorie || data.categoryId || 'Varal',
            dateAjout: data.dateAjout || data.date || ''
          });
        }
      });
      photos.sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0));
      setVaralPhotos(photos);
    }, (err) => {
      console.error("EventEditForm - Erreur snapshot documents :", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  const translate = (key, fallback) => {
    if (!t) return fallback;
    const val = t(key);
    return val === key ? fallback : val;
  };

  // Consolidation des options de costumes
  const combinedCostumeOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (wardrobeCostumes || []).forEach(item => {
      const name = typeof item === 'string' ? item : (item.name || item.title || item.titre || item.type || '');
      if (name && !seen.has(name)) {
        seen.add(name);
        const label = item.targetCategory ? `${name} (${item.targetCategory})` : name;
        list.push({ id: item.id || name, name, displayName: label, category: item.targetCategory || 'Vestiaire' });
      }
    });

    (dressCodes || []).forEach(dc => {
      const name = typeof dc === 'string' ? dc : (dc.name || dc.title || dc.type || '');
      if (name && !seen.has(name)) {
        seen.add(name);
        const label = dc.included ? `${name} (${dc.included})` : name;
        list.push({ id: dc.id || name, name, displayName: label, category: 'Paramètres' });
      }
    });

    return list;
  }, [wardrobeCostumes, dressCodes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSaveEvent} className="flex flex-col gap-4 text-left">
      <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 text-left">
        <h3 className="panel-title text-base font-bold mb-4 text-cordel-wood flex items-center justify-between">
          <span>{translate('widgetAgenda.editEventTitle', "Modifier l'événement")}</span>
          <span className="text-xs font-normal opacity-75 text-[var(--encre-noire)]">
            Mode Édition
          </span>
        </h3>

        {/* Champs unifiés en 3 étages */}
        <EventFormFields
          formData={editForm}
          setFormData={setEditForm}
          handleChange={handleChange}
          saving={savingEvent}
          isEdit={true}
          eventTypeConfigs={eventTypeConfigs || rawEditConfig}
          defaultLocationsByEventType={defaultLocationsByEventType}
          lieuxImportants={lieuxImportants}
          associationEventTypes={associationEventTypes}
          adresseLocal={adresseLocal}
          combinedCostumeOptions={combinedCostumeOptions}
          customCategories={customCategories}
          createConfig={editConfig}
          groupId={groupId}
          defaultDropUrl={defaultDropUrl}
          t={t}
        />

        {/* Section Image / Affiche de l'événement */}
        {editConfig.agendaEnableImage !== false && (
          <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-dashed border-cordel-master-dark/20 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('widgetAgenda.imageUrlLabel', "Image de l'événement / Affiche")}
            </label>

            <div className="flex gap-2 mb-1 flex-wrap">
              <button
                type="button"
                onClick={() => setImageMode && setImageMode('upload')}
                className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
                  imageMode === 'upload'
                    ? 'bg-cordel-wood text-white border-encre-noire shadow-xs'
                    : 'bg-white/50 border-dashed border-stone-300 text-stone-700'
                }`}
              >
                📸 Upload classique
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
                🪢 Depuis le Varal ({varalPhotos.length})
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
                🔗 Lien URL externe
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
                    {uploadingImage ? "⏳ Téléversement..." : "📸 Choisir un fichier"}
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
                    onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="https://..."
                    className="theme-input text-xs py-1.5 px-2 flex-1"
                  />
                )}

                {editForm.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                    className="text-[10px] font-bold text-red-700 hover:underline select-none cursor-pointer"
                  >
                    Supprimer l'image
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
                        onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="theme-input w-full text-xs font-bold py-1.5 bg-white"
                      >
                        <option value="">-- Choisir une photo du Varal --</option>
                        {varalPhotos.map((p) => (
                          <option key={p.id} value={p.fileUrl}>
                            {p.titre} ({p.categorie})
                          </option>
                        ))}
                      </select>

                      {/* Galerie de miniatures cliquables */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {varalPhotos.slice(0, 10).map((p) => {
                          const isSelected = editForm.imageUrl === p.fileUrl;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, imageUrl: p.fileUrl }))}
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
            </div>
          </div>
        )}

        {/* Actions du formulaire de modification */}
        <div className="flex flex-col gap-2.5 mt-5 pt-3 border-t border-[var(--cordel-border)]">
          <CordelButton
            type="submit"
            variant="vert"
            useExtremeBorder={true}
            disabled={savingEvent}
            className="w-full py-3 text-xs font-black uppercase tracking-widest"
          >
            {savingEvent ? translate('common.saving', "Enregistrement...") : "💾 Enregistrer les modifications"}
          </CordelButton>

          <CordelButton
            type="button"
            variant="rouge"
            useExtremeBorder={true}
            disabled={savingEvent}
            onClick={handleDeleteEvent}
            className="w-full py-2.5 text-xs font-black uppercase tracking-widest"
          >
            {savingEvent ? "Suppression..." : "🗑️ Supprimer l'événement"}
          </CordelButton>
        </div>
      </CordelCard>

      {/* Modale d'importation d'ordre du jour */}
      {isImportModalOpen && (
        <ImportAgendaModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          groupId={editForm.groupId || groupId}
          onSelectTemplate={(template) => {
            setEditForm(prev => {
              const formattedPoints = (template.points || []).map(p => {
                if (typeof p === 'object' && p.titre) return p;
                return { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), titre: String(p), notesCR: '' };
              });
              return {
                ...prev,
                pointsOrdreDuJour: formattedPoints,
                description: template.description
                  ? (prev.description ? `${prev.description}\n\n${template.description}` : template.description)
                  : prev.description
              };
            });
          }}
        />
      )}
    </form>
  );
}
