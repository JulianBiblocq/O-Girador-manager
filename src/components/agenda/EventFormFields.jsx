import React, { useState } from 'react';
import CordelAccordion from '../CordelAccordion';
import EventBudgetEditor from '../event-details/EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';
import ManualMapMarkerModal from './ManualMapMarkerModal';
import LocationSelector from '../LocationSelector';
import WorkshopProgramSelector from './WorkshopProgramSelector';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

/**
 * EventFormFields - Composant unifié pour les champs de formulaire d'événement
 * Organisé en 3 étages ergonomiques :
 * 1. Saisie Express (Titre, Type, Dates début/fin non destructive, Lieu avec protection isEdit, Description)
 * 2. Interrupteurs Rapides & Paramètres Artistiques réactifs aux presets
 * 3. Tiroir Avancé (Date limite, Budget, Bénévoles, Sondage de dates)
 */
export default function EventFormFields({
  formData,
  setFormData,
  handleChange,
  saving = false,
  isEdit = false,
  eventTypeConfigs = {},
  defaultLocationsByEventType = {},
  lieuxImportants = [],
  associationEventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion'],
  adresseLocal = '',
  combinedCostumeOptions = [],
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  createConfig = {},
  groupId,
  t
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { rhythms: sequencerRhythms, loading: loadingRhythms } = useSequencerFirestoreData(groupId);

  const translate = (key, fallback) => {
    if (!t) return fallback;
    const val = t(key);
    return val === key ? fallback : val;
  };

  // 1. Calcul d'heure de fin non destructif : s'applique uniquement si dateFin est vierge
  const handleDateDebutChange = (e) => {
    const newDate = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, date: newDate };
      // Calcul non destructif : uniquement si dateFin n'a jamais été renseignée
      if (!prev.dateFin && newDate) {
        try {
          const d = new Date(newDate);
          if (!isNaN(d.getTime())) {
            d.setHours(d.getHours() + 2);
            const tzOffset = d.getTimezoneOffset() * 60000;
            const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
            updated.dateFin = localISOTime;
          }
        } catch (err) {
          console.warn("Calcul automatique dateFin échoué :", err);
        }
      }
      return updated;
    });
  };

  // 2. Gestion du changement de type avec protection du lieu en édition et injection des presets
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const defaultLieuId = defaultLocationsByEventType?.[newType];

    setFormData(prev => {
      const updated = { ...prev, type: newType };

      // Protection stricte : on n'écrase jamais un lieu existant en mode édition
      if ((!isEdit || !prev.lieu || prev.lieu.trim() === '') && defaultLieuId) {
        const foundLieu = (lieuxImportants || []).find(l => l.id === defaultLieuId);
        if (foundLieu) {
          const fullLocationText = foundLieu.nom && foundLieu.adresse
            ? `${foundLieu.nom} - ${foundLieu.adresse}`
            : (foundLieu.adresse || foundLieu.nom);
          updated.lieu = fullLocationText;
          updated.lieuId = defaultLieuId;
          if (foundLieu.latitude) updated.latitude = foundLieu.latitude;
          if (foundLieu.longitude) updated.longitude = foundLieu.longitude;
        }
      }

      // Application des presets booléens configurés pour ce type
      const typePresets = eventTypeConfigs?.[newType];
      if (typePresets) {
        if (typePresets.includesPercussion !== undefined) {
          updated.includesPercussion = typePresets.includesPercussion !== false;
        }
        if (typePresets.includesDance !== undefined) {
          updated.includesDance = typePresets.includesDance !== false;
        }
        if (typePresets.enableCarpool !== undefined) {
          updated.enableCarpool = typePresets.enableCarpool !== false;
        }
        if (typePresets.isPublic !== undefined) {
          updated.isPublic = Boolean(typePresets.isPublic);
        }
      }

      return updated;
    });
  };

  // Helper pour les toggles booléens réactifs
  const toggleBooleanField = (fieldName, currentVal) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: !currentVal
    }));
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* =========================================================================
          ÉTAGE 1 : SAISIE EXPRESS (Les indispensables toujours visibles)
          ========================================================================= */}
      <div className="flex flex-col gap-4 p-4 bg-cordel-bg-light/60 rounded-[6px] border border-encre-noire/15">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>⚡</span>
            <span>1. Saisie Express</span>
          </h4>
          <span className="text-[10px] text-stone-500 font-semibold">Indispensables</span>
        </div>

        {/* Titre */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.eventTitleLabel', "Titre de l'événement")} *
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre || ''}
            onChange={handleChange}
            required
            disabled={saving}
            placeholder="Ex : Carnaval des Enfants, Répétition générale..."
            className="theme-input w-full font-bold text-sm disabled:opacity-50"
          />
        </div>

        {/* Type d'événement */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.typeLabel', "Type d'événement")} *
          </label>
          <select
            name="type"
            value={formData.type || 'prestation'}
            onChange={handleTypeChange}
            required
            disabled={saving}
            className="theme-input w-full font-bold bg-cordel-bg-light text-xs disabled:opacity-50 cursor-pointer"
          >
            {associationEventTypes.map(type => (
              <option key={type} value={type}>
                {type === 'prestation' ? translate('widgetAgenda.typePrestation', "Prestation") :
                 type === 'repetition' ? translate('widgetAgenda.typeRepetition', "Répétition") :
                 type === 'stage' ? translate('widgetAgenda.typeStage', "Stage") :
                 type === 'atelier' ? translate('widgetAgenda.typeAtelier', "Atelier") :
                 type === 'reunion' ? translate('widgetAgenda.typeReunion', "Réunion") :
                 type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Dates & Horaires (Début & Fin) */}
        {!formData.isPoll && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Début */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {translate('widgetAgenda.startDateLabel', "Date et heure de début")} *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date || ''}
                onChange={handleDateDebutChange}
                required={!formData.isPoll}
                disabled={saving}
                className="theme-input w-full text-xs font-bold disabled:opacity-50"
              />
            </div>

            {/* Date Fin (calcul non destructif si vierge) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>{translate('widgetAgenda.endDateLabel', "Date et heure de fin")}</span>
                <span className="text-[8px] font-normal text-stone-500">(optionnel)</span>
              </label>
              <input
                type="datetime-local"
                name="dateFin"
                value={formData.dateFin || ''}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full text-xs font-bold disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Lieu & Adresse avec autocomplétion */}
        {createConfig.agendaEnableAdresse !== false && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
              <span>{translate('widgetAgenda.locationLabel', "Lieu de l'événement")}</span>
              {defaultLocationsByEventType?.[formData.type] && (
                <span className="text-[8px] font-normal text-stone-500">
                  Preset configuré pour "{formData.type}"
                </span>
              )}
            </label>
            <React.Suspense fallback={
              <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                ⏳ {translate('widgetAgenda.loadingAddress', "Chargement du champ adresse...")}
              </div>
            }>
              <LocationSelector
                value={formData.lieu || ''}
                lieuxImportants={lieuxImportants}
                onChange={(val, foundPreset) => {
                  setFormData(prev => ({
                    ...prev,
                    lieu: val,
                    lieuId: foundPreset ? foundPreset.id : null
                  }));
                }}
                onPlaceSelected={async (placeData) => {
                  const exactAddress = placeData.formattedAddress || placeData.address || '';
                  setFormData(prev => ({
                    ...prev,
                    lieu: exactAddress,
                    latitude: placeData.latitude || prev.latitude,
                    longitude: placeData.longitude || prev.longitude
                  }));
                  if (adresseLocal && exactAddress) {
                    try {
                      const distanceKm = await calculateRoadDistance(adresseLocal, exactAddress);
                      const distanceRoundTrip = Math.round(distanceKm * 2);
                      setFormData(prev => ({ ...prev, distanceAllerRetourKm: distanceRoundTrip.toString() }));
                    } catch (err) {
                      console.error("Distance Matrix calculation failed:", err);
                    }
                  }
                }}
                onOpenMapModal={() => setIsMapModalOpen(true)}
                placeholder={translate('widgetAgenda.locationPlaceholder', "Ex : Place de la Mairie, Salle des Fêtes...")}
                className="theme-input w-full text-xs disabled:opacity-50"
              />
            </React.Suspense>

            {formData.latitude && formData.longitude && (
              <div className="flex items-center gap-2 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-300/60 mt-1 select-none">
                <span>📍 Coordonnées manuelles : {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, latitude: null, longitude: null }))}
                  className="text-red-600 hover:text-red-800 font-black cursor-pointer ml-auto"
                  title="Effacer les coordonnées"
                >
                  ✕
                </button>
              </div>
            )}

            <ManualMapMarkerModal
              isOpen={isMapModalOpen}
              onClose={() => setIsMapModalOpen(false)}
              onSave={({ latitude, longitude }) => {
                setFormData(prev => ({ ...prev, latitude, longitude }));
              }}
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              addressContext={formData.lieu}
            />
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
            <span>📝 {translate('widgetAgenda.descriptionLabel', "Description de l'événement")}</span>
            <span className="text-[8px] font-normal text-stone-500">
              Visible sur la fiche & sur le site public si activé
            </span>
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            disabled={saving}
            placeholder="Programme, ambiance, consignes pratiques..."
            className="theme-input w-full min-h-[75px] text-xs font-medium py-1.5 disabled:opacity-50"
          />
        </div>
      </div>

      {/* =========================================================================
          ÉTAGE 2 : INTERRUPTEURS RAPIDES & PARAMÈTRES ARTISTIQUES
          ========================================================================= */}
      <div className="flex flex-col gap-4 p-4 bg-cordel-bg-light/60 rounded-[6px] border border-encre-noire/15">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🎛️</span>
            <span>2. Options & Modules Actifs</span>
          </h4>
          <span className="text-[10px] text-stone-500 font-semibold">Toggles interactifs</span>
        </div>

        {/* Barrette d'interrupteurs rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none">
          {/* 1. Percussion (Fallback strict !== false) */}
          <button
            type="button"
            onClick={() => toggleBooleanField('includesPercussion', formData.includesPercussion !== false)}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              formData.includesPercussion !== false
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>🥁</span>
            <span>Percussion</span>
            <span className="ml-auto text-[10px]">{formData.includesPercussion !== false ? 'ON' : 'OFF'}</span>
          </button>

          {/* 2. Danse (Fallback strict !== false) */}
          <button
            type="button"
            onClick={() => toggleBooleanField('includesDance', formData.includesDance !== false)}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              formData.includesDance !== false
                ? 'bg-pink-100 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>💃</span>
            <span>Danse</span>
            <span className="ml-auto text-[10px]">{formData.includesDance !== false ? 'ON' : 'OFF'}</span>
          </button>

          {/* 3. Covoiturage (Fallback strict !== false) */}
          <button
            type="button"
            onClick={() => toggleBooleanField('enableCarpool', formData.enableCarpool !== false)}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              formData.enableCarpool !== false
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>🚗</span>
            <span>Covoiturage</span>
            <span className="ml-auto text-[10px]">{formData.enableCarpool !== false ? 'ON' : 'OFF'}</span>
          </button>

          {/* 4. Public / Vitrine */}
          <button
            type="button"
            onClick={() => toggleBooleanField('isPublic', Boolean(formData.isPublic))}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              Boolean(formData.isPublic)
                ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>🌍</span>
            <span>Public</span>
            <span className="ml-auto text-[10px]">{Boolean(formData.isPublic) ? 'ON' : 'OFF'}</span>
          </button>

          {/* 5. Inscriptions requises */}
          <button
            type="button"
            onClick={() => toggleBooleanField('enableInscriptions', formData.enableInscriptions !== false)}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              formData.enableInscriptions !== false
                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>📝</span>
            <span>Inscriptions</span>
            <span className="ml-auto text-[10px]">{formData.enableInscriptions !== false ? 'ON' : 'OFF'}</span>
          </button>

          {/* 6. Soumis à validation admin */}
          <button
            type="button"
            onClick={() => toggleBooleanField('requiresValidation', Boolean(formData.requiresValidation))}
            disabled={saving}
            className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              Boolean(formData.requiresValidation)
                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-500 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <span>🔒</span>
            <span>Validation</span>
            <span className="ml-auto text-[10px]">{Boolean(formData.requiresValidation) ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Détails conditionnels Artistiques & Covoiturage */}
        <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
          {/* Tenues et niveaux selon les toggles */}
          {(formData.includesPercussion !== false || formData.includesDance !== false) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Percussion : Niveau & Tenue */}
              {formData.includesPercussion !== false && (
                <div className="flex flex-col gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded border border-amber-300/40">
                  <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    🥁 Pupitre Percussion
                  </span>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-stone-600">Niveau requis</label>
                    <select
                      name="niveauRequis"
                      value={formData.niveauRequis || 'tous'}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1 bg-white"
                    >
                      <option value="tous">👥 Tous les niveaux</option>
                      <option value="aucun">Aucun</option>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-stone-600">Tenue Percussion</label>
                    <select
                      name="dressCodePercussion"
                      value={formData.dressCodePercussion || ''}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1 bg-white"
                    >
                      <option value="">-- Libre / Non spécifiée --</option>
                      {combinedCostumeOptions.map(opt => (
                        <option key={`perc-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Danse : Niveau & Tenue */}
              {formData.includesDance !== false && (
                <div className="flex flex-col gap-2 p-2.5 bg-pink-50/50 dark:bg-pink-950/10 rounded border border-pink-300/40">
                  <span className="text-[10px] font-black uppercase text-pink-900 dark:text-pink-300 flex items-center gap-1">
                    💃 Section Danse
                  </span>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-stone-600">Niveau requis</label>
                    <select
                      name="niveauDanseRequis"
                      value={formData.niveauDanseRequis || 'aucun'}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1 bg-white"
                    >
                      <option value="aucun">Aucun</option>
                      <option value="tous">👥 Tous les niveaux</option>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-stone-600">Tenue Danse</label>
                    <select
                      name="dressCodeDanse"
                      value={formData.dressCodeDanse || ''}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1 bg-white"
                    >
                      <option value="">-- Libre / Non spécifiée --</option>
                      {combinedCostumeOptions.map(opt => (
                        <option key={`danse-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Covoiturage actif : Horaires & Distance */}
          {formData.enableCarpool !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded border border-emerald-300/40">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-emerald-900 dark:text-emerald-300">
                  🚗 RDV Convoi / Covoiturage
                </label>
                <input
                  type="text"
                  name="horaireCovoiturage"
                  value={formData.horaireCovoiturage || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Ex : 13h00 au local"
                  className="theme-input text-xs py-1 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-emerald-900 dark:text-emerald-300">
                  Distance Aller-Retour (Km)
                </label>
                <input
                  type="number"
                  min="0"
                  name="distanceAllerRetourKm"
                  value={formData.distanceAllerRetourKm || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Ex : 80"
                  className="theme-input text-xs py-1 bg-white"
                />
              </div>
            </div>
          )}

          {/* Lutherie & Atelier Fabrication si type atelier/stage */}
          {(formData.type === 'atelier' || formData.type === 'stage') && (
            <WorkshopProgramSelector
              specialiteAtelier={formData.specialiteAtelier || 'general'}
              setSpecialiteAtelier={(val) => setFormData(prev => ({ ...prev, specialiteAtelier: val }))}
              programmeFabrication={formData.programmeFabrication}
              setProgrammeFabrication={(val) => setFormData(prev => ({ ...prev, programmeFabrication: val }))}
              groupId={groupId}
              disabled={saving}
            />
          )}

          {/* Morceaux à réviser (Séquenceur) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
              <span>🎛️ Morceaux du Séquenceur à réviser</span>
              <span className="text-[8px] font-normal text-stone-500">
                {(formData.linkedPatterns || []).length} sélectionné{(formData.linkedPatterns || []).length > 1 ? 's' : ''}
              </span>
            </label>
            {loadingRhythms ? (
              <p className="text-xs text-cordel-wood animate-pulse">Chargement des morceaux...</p>
            ) : sequencerRhythms.length === 0 ? (
              <p className="text-xs italic text-encre-noire/60">Aucun morceau trouvé dans le Séquenceur.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-encre-noire/20 rounded bg-white p-2 space-y-1 scrollbar-thin">
                {sequencerRhythms.map(rhythm => {
                  const isChecked = (formData.linkedPatterns || []).includes(rhythm.id);
                  return (
                    <label key={rhythm.id} className="flex items-center gap-2 p-1 hover:bg-black/5 cursor-pointer rounded transition-colors select-none text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = formData.linkedPatterns || [];
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, linkedPatterns: [...current, rhythm.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, linkedPatterns: current.filter(id => id !== rhythm.id) }));
                          }
                        }}
                        className="w-3.5 h-3.5 accent-cordel-wood cursor-pointer"
                      />
                      <span className="font-bold text-encre-noire truncate">
                        {rhythm.title || rhythm.name || 'Sans titre'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lien Dépôt Médias Externe */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
              📸 Lien dépôt photos/vidéos (Drive, Framaspace...)
            </label>
            <input
              type="url"
              name="lienDepotMedias"
              value={formData.lienDepotMedias || ''}
              onChange={handleChange}
              disabled={saving}
              placeholder="https://drive.google.com/... ou Framaspace"
              className="theme-input w-full text-xs bg-white"
            />
          </div>

          {/* Notification Push (Création uniquement) */}
          {!isEdit && (
            <div className="flex items-center gap-2 pt-1 select-none">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-cordel-wood">
                <input
                  type="checkbox"
                  name="sendPushNotification"
                  checked={Boolean(formData.sendPushNotification)}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendPushNotification: e.target.checked }))}
                  disabled={saving}
                  className="w-4 h-4 rounded accent-cordel-wood cursor-pointer"
                />
                <span>📢 Envoyer une notification Push aux membres</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ÉTAGE 3 : TIROIR AVANCÉ (Replié par défaut)
          ========================================================================= */}
      <CordelAccordion
        title="3. Options Avancées, Budget & Sondage"
        subtitle="Date limite, créneaux bénévoles, budget prévisionnel et sondage de dates"
        icon="⚙️"
        defaultOpen={false}
      >
        <div className="flex flex-col gap-4 pt-1">
          {/* Date limite d'inscription */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('widgetAgenda.deadlineLabel', "Date limite d'inscription (Optionnel)")}
            </label>
            <input
              type="datetime-local"
              name="dateLimiteInscription"
              value={formData.dateLimiteInscription || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs"
            />
          </div>

          {/* Horaires de passages (prestation) */}
          {formData.type === 'prestation' && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {translate('widgetAgenda.stageTimesLabel', "Horaires de passages scéniques")}
              </label>
              <input
                type="text"
                name="horairesPassages"
                value={formData.horairesPassages || ''}
                onChange={handleChange}
                disabled={saving}
                placeholder="Ex : 14:30 - 15:15"
                className="theme-input w-full text-xs"
              />
            </div>
          )}

          {/* Lien externe / social */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('widgetAgenda.socialLinkLabel', "Lien externe / Réseaux sociaux")}
            </label>
            <input
              type="url"
              name="lienSocial"
              value={formData.lienSocial || ''}
              onChange={handleChange}
              disabled={saving}
              placeholder="https://facebook.com/events/..."
              className="theme-input w-full text-xs"
            />
          </div>

          {/* Finances / Budget Prévisionnel */}
          {createConfig.agendaEnableFinance !== false && (
            <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 flex flex-col gap-2">
              <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                💰 {translate('widgetAgenda.finBudgetTitle', "Budget & Dépenses Prévisionnelles")}
              </h5>
              <EventBudgetEditor
                budgetDepenses={formData.budgetDepenses || []}
                onChangeDepenses={(updated) => setFormData(prev => ({ ...prev, budgetDepenses: updated }))}
                disabled={saving}
              />
            </div>
          )}

          {/* Créneaux Bénévoles */}
          {createConfig.agendaEnableVolunteerShifts !== false && (
            <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                  🤝 Postes & Créneaux Bénévoles requis
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    const newShifts = [...(formData.volunteerShifts || []), { label: '', horaires: '', neededCount: 1 }];
                    setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                  }}
                  className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2 py-1 rounded cursor-pointer hover:bg-cordel-hover"
                >
                  ＋ Ajouter un poste
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {(formData.volunteerShifts || []).length === 0 ? (
                  <p className="text-[10px] italic opacity-60">Aucun créneau bénévole configuré.</p>
                ) : (
                  (formData.volunteerShifts || []).map((shift, idx) => (
                    <div key={idx} className="flex gap-2 items-end p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/25 rounded relative">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Mission</label>
                        <input
                          type="text"
                          value={shift.label}
                          placeholder="Accueil, Buvette..."
                          onChange={(e) => {
                            const newShifts = [...formData.volunteerShifts];
                            newShifts[idx].label = e.target.value;
                            setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                          }}
                          className="theme-input py-1 px-2 text-xs w-full"
                          required
                        />
                      </div>
                      <div className="w-16 flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Besoin</label>
                        <input
                          type="number"
                          min="1"
                          value={shift.neededCount}
                          onChange={(e) => {
                            const newShifts = [...formData.volunteerShifts];
                            newShifts[idx].neededCount = parseInt(e.target.value) || 1;
                            setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                          }}
                          className="theme-input py-1 px-2 text-xs w-full text-center"
                          required
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Horaires</label>
                        <input
                          type="text"
                          value={shift.horaires}
                          placeholder="14:00 - 16:00"
                          onChange={(e) => {
                            const newShifts = [...formData.volunteerShifts];
                            newShifts[idx].horaires = e.target.value;
                            setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                          }}
                          className="theme-input py-1 px-2 text-xs w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newShifts = formData.volunteerShifts.filter((_, sIdx) => sIdx !== idx);
                          setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                        }}
                        className="text-[9.5px] font-black uppercase bg-cordel-rouge text-white border border-encre-noire px-2 py-2 rounded cursor-pointer hover:bg-red-800 shrink-0"
                        title="Supprimer ce créneau"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sondage multi-dates (Création uniquement) */}
          {!isEdit && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <label className="text-xs font-black uppercase text-cordel-wood cursor-pointer">
                      Créer un sondage de dates
                    </label>
                    <p className="text-[9px] font-semibold text-encre-noire/70">
                      Proposer 2 à 4 créneaux pour soumettre au vote des membres
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(formData.isPoll)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isPoll: e.target.checked,
                    pollDates: prev.pollDates || [prev.date || '', '']
                  }))}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>

              {formData.isPoll && (
                <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-amber-500/30">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Créneaux proposés (minimum 2 dates)
                  </label>
                  {(formData.pollDates || ['', '']).map((optDate, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-cordel-wood w-16 shrink-0">
                        Option {idx + 1} :
                      </span>
                      <input
                        type="datetime-local"
                        value={optDate}
                        onChange={(e) => {
                          const newDates = [...(formData.pollDates || ['', ''])];
                          newDates[idx] = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            pollDates: newDates,
                            date: idx === 0 ? e.target.value : prev.date
                          }));
                        }}
                        required={idx < 2}
                        className="theme-input text-xs py-1 flex-1 bg-white"
                      />
                      {idx >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newDates = (formData.pollDates || []).filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, pollDates: newDates }));
                          }}
                          className="text-[10px] text-red-600 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded cursor-pointer"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const current = formData.pollDates || ['', ''];
                      setFormData(prev => ({ ...prev, pollDates: [...current, ''] }));
                    }}
                    className="text-[9px] font-black uppercase text-cordel-wood hover:underline text-left mt-1 cursor-pointer"
                  >
                    + Ajouter une option de date
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CordelAccordion>
    </div>
  );
}
