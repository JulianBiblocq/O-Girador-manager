import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventFormFields from '../agenda/EventFormFields';
import ImportAgendaModal from '../agenda/ImportAgendaModal';
import EventRoadbookFormSection from './EventRoadbookFormSection';
import EventCoverImageEditor from './EventCoverImageEditor';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import { useTranslation } from '../LanguageContext';

/**
 * EventEditForm - Formulaire de modification d'événement unifié
 * Repose sur le composant modulaire EventFormFields (3 étages)
 * et délègue la gestion de l'image de couverture / Tampon Cordel à EventCoverImageEditor.
 */
export default function EventEditForm({
  editForm,
  setEditForm,
  allUsers = [],
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
  defaultDropUrl = '',
  pupitresList = []
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
      console.error('EventEditForm - Erreur snapshot documents :', err);
    });
    return () => unsubscribe();
  }, [groupId]);

  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;

  const translate = (key, fallback) => {
    if (typeof tr === 'function') {
      const val = tr(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  // Consolidation des options de costumes
  const combinedCostumeOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (wardrobeCostumes || []).forEach((item) => {
      const name = typeof item === 'string' ? item : (item.name || item.title || item.titre || item.type || '');
      if (name && !seen.has(name)) {
        seen.add(name);
        const label = item.targetCategory ? `${name} (${item.targetCategory})` : name;
        list.push({ id: item.id || name, name, displayName: label, category: item.targetCategory || 'Vestiaire' });
      }
    });

    (dressCodes || []).forEach((dc) => {
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
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
          pupitresList={pupitresList}
          t={t}
        />

        {/* Section Feuille de route / Roadbook */}
        <EventRoadbookFormSection
          editForm={editForm}
          setEditForm={setEditForm}
          allUsers={allUsers}
          pupitresList={pupitresList}
          groupId={groupId || editForm.groupId}
          t={t}
        />

        {/* Section Image / Affiche & Tampon Cordel */}
        {editConfig.agendaEnableImage !== false && (
          <EventCoverImageEditor
            editForm={editForm}
            setEditForm={setEditForm}
            imageMode={imageMode}
            setImageMode={setImageMode}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
            varalPhotos={varalPhotos}
            savingEvent={savingEvent}
            translate={translate}
            tr={tr}
          />
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
            {savingEvent ? tr('common.saving') : '💾 ' + tr('agenda.btnUpdateEvent')}
          </CordelButton>

          <CordelButton
            type="button"
            variant="rouge"
            useExtremeBorder={true}
            disabled={savingEvent}
            onClick={handleDeleteEvent}
            className="w-full py-2.5 text-xs font-black uppercase tracking-widest"
          >
            {savingEvent ? tr('common.saving') : `🗑️ ${tr('agenda.btnDeleteEventAction') || "Supprimer l'événement"}`}
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
            setEditForm((prev) => {
              const formattedPoints = (template.points || []).map((p) => {
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
