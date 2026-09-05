import React, { useState, useMemo } from 'react';
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
  groupId
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
          t={t}
        />

        {/* Section Image / Affiche de l'événement */}
        {editConfig.agendaEnableImage !== false && (
          <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-dashed border-cordel-master-dark/20 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('widgetAgenda.imageUrlLabel', "Image de l'événement / Affiche")}
            </label>

            <div className="flex gap-2 mb-1">
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

            <div className="flex items-center gap-3">
              {editForm.imageUrl && (
                <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-xs">
                  <img src={editForm.imageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
                </div>
              )}

              {imageMode === 'upload' ? (
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
              ) : (
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
