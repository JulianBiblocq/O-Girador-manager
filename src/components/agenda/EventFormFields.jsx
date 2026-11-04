import React, { useState } from 'react';
import CordelAccordion from '../CordelAccordion';
import { XiloMegaphone } from '../XiloIcons';
import EventBudgetEditor from '../event-details/EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';
import ManualMapMarkerModal from './ManualMapMarkerModal';
import LocationSelector from '../LocationSelector';
import WorkshopProgramSelector from './WorkshopProgramSelector';
import EventRepertoireProgramSelector from './EventRepertoireProgramSelector';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import EventMediaFields from './EventMediaFields';
import EventStampSelector from './EventStampSelector';
import EventDisciplineDressCodeFields from './EventDisciplineDressCodeFields';
import EventPupitresQuotasFields from './EventPupitresQuotasFields';
import EventPollFormSection from './EventPollFormSection';
import EventVolunteerShiftsEditor from './EventVolunteerShiftsEditor';
import EventQuickTogglesGrid from './EventQuickTogglesGrid';
import EventDeadlineModeField from './EventDeadlineModeField';
import {
  extractDayPart,
  extractTimePart,
  resolveDefaultTimesForForm,
  applyScheduleTransitionOnFormChange,
  computeRelativeDeadlineForSlot
} from '../../utils/eventScheduleUtils';
import { useTranslation } from '../LanguageContext';

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
  defaultDropUrl = '',
  pupitresList = [],
  t
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;

  const translate = (key, fallback) => {
    if (typeof tr === 'function') {
      const val = tr(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  // 1. Conservation de l'horaire type lors du changement de jour et synchronisation de dateFin
  const handleDateDebutChange = (e) => {
    const rawNewDate = e.target.value;
    setFormData(prev => {
      if (!rawNewDate) {
        return { ...prev, date: '' };
      }
      const { startTime, endTime } = resolveDefaultTimesForForm(prev, eventTypeConfigs);
      const newDay = extractDayPart(rawNewDate);
      const rawTime = extractTimePart(rawNewDate);
      const prevDay = prev.date ? extractDayPart(prev.date) : '';
      const effectiveStartTime = (!prev.date && rawTime === '00:00') ? startTime : (rawTime || startTime);
      const finalStart = `${newDay}T${effectiveStartTime}`;

      const updated = { ...prev, date: finalStart };

      const prevEndDay = prev.dateFin ? extractDayPart(prev.dateFin) : '';
      const prevEndTime = prev.dateFin ? extractTimePart(prev.dateFin) : '';
      if (!prev.dateFin || prevEndDay === prevDay) {
        updated.dateFin = `${newDay}T${prevEndTime || endTime}`;
      }

      if (prev.registrationDeadlineMode === 'relative') {
        updated.dateLimiteInscription = computeRelativeDeadlineForSlot(
          finalStart,
          prev.registrationDeadlineDaysBefore || 7
        );
      } else {
        const activeType = prev.type || 'prestation';
        const typePresets = eventTypeConfigs?.[activeType];
        const deadlineHours = Number(typePresets?.defaultDeadlineHours);
        if (deadlineHours > 0 && finalStart && (!prev.dateLimiteInscription || !isEdit)) {
          try {
            const eventStart = new Date(finalStart);
            if (!isNaN(eventStart.getTime())) {
              const deadlineDate = new Date(eventStart.getTime() - deadlineHours * 3600 * 1000);
              const tzOffset = deadlineDate.getTimezoneOffset() * 60000;
              updated.dateLimiteInscription = new Date(deadlineDate.getTime() - tzOffset).toISOString().slice(0, 16);
            }
          } catch (err) {
            console.warn("Calcul automatique dateLimiteInscription échoué :", err);
          }
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

      // Application des presets configurés pour ce type (eventTypeConfigs)
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
        if (typePresets.requiresValidation !== undefined) {
          updated.requiresValidation = Boolean(typePresets.requiresValidation);
        }
        if (typePresets.enableRoadbook !== undefined) {
          updated.enableRoadbook = Boolean(typePresets.enableRoadbook);
        }
        if (typePresets.enableStageLayout !== undefined) {
          updated.enableStageLayout = Boolean(typePresets.enableStageLayout);
          updated.agendaEnableStageLayout = Boolean(typePresets.enableStageLayout);
        }
        if (typePresets.enableRevisionProgram !== undefined) {
          updated.enableRevisionProgram = Boolean(typePresets.enableRevisionProgram);
          updated.agendaEnableRevisionProgram = Boolean(typePresets.enableRevisionProgram);
        }
        // Pré-remplissage du lien de dépôt cloud par défaut si renseigné
        if (typePresets.defaultDropUrl && (!isEdit || !prev.dropUrl)) {
          updated.dropUrl = typePresets.defaultDropUrl;
          updated.lienDepotMedias = typePresets.defaultDropUrl;
        }
        // Calcul automatique de la date limite d'inscription selon le délai par défaut en heures
        const deadlineHours = Number(typePresets.defaultDeadlineHours);
        const targetDate = updated.date || prev.date;
        if (deadlineHours > 0 && targetDate && (!isEdit || !prev.dateLimiteInscription)) {
          try {
            const eventStart = new Date(targetDate);
            if (!isNaN(eventStart.getTime())) {
              const deadlineDate = new Date(eventStart.getTime() - deadlineHours * 3600 * 1000);
              const tzOffset = deadlineDate.getTimezoneOffset() * 60000;
              updated.dateLimiteInscription = new Date(deadlineDate.getTime() - tzOffset).toISOString().slice(0, 16);
            }
          } catch (err) {
            console.warn("Calcul automatique dateLimiteInscription échoué :", err);
          }
        }
      }

      // Préremplissage de l'interrupteur Commissions & Chantiers selon le preset du type
      // Uniquement en mode création (nouvel événement sans ID)
      if (!isEdit && !prev.id) {
        updated.hasCommissions = Boolean(eventTypeConfigs?.[newType]?.hasCommissionsByDefault);
      }

      // Gestion de la récolte photos / QR code (activerRecolteMedias) :
      // Priorité au preset explicite du type, sinon repli selon la nature de l'événement
      const isTargetPrestation = ['prestation', 'concert', 'spectacle', 'festival'].includes(newType);
      if (typePresets?.activerRecolteMedias !== undefined) {
        updated.activerRecolteMedias = Boolean(typePresets.activerRecolteMedias);
      } else if (!isEdit || updated.activerRecolteMedias === undefined) {
        updated.activerRecolteMedias = isTargetPrestation;
      }

      // Gestion de l'autorisation de dépôt de vidéos (enableVideoDrop) :
      // En mode édition, conserver la valeur existante si elle est déjà définie
      const defaultVideoDrop = ['atelier', 'repetition', 'stage'].includes(newType);
      if (!isEdit || prev.enableVideoDrop === undefined) {
        if (typePresets?.enableVideoDrop !== undefined) {
          updated.enableVideoDrop = Boolean(typePresets.enableVideoDrop);
        } else if (typePresets?.activerDepotVideo !== undefined) {
          updated.enableVideoDrop = Boolean(typePresets.activerDepotVideo);
        } else {
          updated.enableVideoDrop = defaultVideoDrop;
        }
      }

      if (updated.publierSurVaral === undefined) {
        updated.publierSurVaral = updated.activerRecolteMedias !== false;
      }

      return applyScheduleTransitionOnFormChange(prev, updated, eventTypeConfigs);
    });
  };

  // Helper pour les toggles booléens réactifs avec bascule dynamique d'horaires Percussion <-> Danse
  const toggleBooleanField = (fieldName, currentVal) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [fieldName]: !currentVal
      };
      return applyScheduleTransitionOnFormChange(prev, next, eventTypeConfigs);
    });
  };

  // Handler pour les champs de discipline (ex: niveauRequis === 'aucun' bascule sur l'horaire Danse)
  const handleDisciplineFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      return applyScheduleTransitionOnFormChange(prev, next, eventTypeConfigs);
    });
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
            {tr('agenda.fieldTitle')} *
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre || ''}
            onChange={handleChange}
            required
            disabled={saving}
            placeholder={tr('agenda.titlePlaceholder')}
            className="theme-input w-full font-bold text-sm disabled:opacity-50"
          />
        </div>

        {/* Type d'événement */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {tr('agenda.fieldType')} *
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
                {type === 'prestation' ? tr('agenda.typePrestation') :
                 type === 'repetition' ? tr('agenda.typeRepetition') :
                 type === 'stage' ? tr('agenda.typeStage') :
                 type === 'atelier' ? tr('agenda.typeAtelier') :
                 type === 'reunion' ? tr('agenda.typeReunion') :
                 type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Dates & Horaires (Début & Fin) ou Sondage en mode édition */}
        {!(formData.isPoll || formData.status === 'sondage' || formData.pollGroupId) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Début */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {tr('agenda.fieldStartDate')} *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date || ''}
                onChange={handleDateDebutChange}
                required={!(formData.isPoll || formData.status === 'sondage' || formData.pollGroupId)}
                disabled={saving}
                className="theme-input w-full text-xs font-bold disabled:opacity-50"
              />
            </div>

            {/* Date Fin (calcul non destructif si vierge) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>{tr('agenda.fieldEndDate')}</span>
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
        ) : isEdit ? (
          <EventPollFormSection
            formData={formData}
            setFormData={setFormData}
            pupitresList={pupitresList}
            eventTypeConfigs={eventTypeConfigs}
            isEdit={true}
            tr={tr}
          />
        ) : null}

        {/* Lieu & Adresse avec autocomplétion */}
        {createConfig.agendaEnableAdresse !== false && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
              <span>{tr('agenda.fieldLocation')}</span>
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
                placeholder={tr('agenda.customAddressPlaceholder')}
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
            <span>📝 {tr('agenda.fieldDescription')}</span>
            <span className="text-[8px] font-normal text-stone-500">
              {tr('agenda.visiblePublicNotice') || "Visible sur la fiche & sur le site public si activé"}
            </span>
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            disabled={saving}
            placeholder={tr('agenda.descPlaceholder')}
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
            <span>{tr('agenda.activeModulesTitle') || "2. Options & modules actifs"}</span>
          </h4>
          <span className="text-[10px] text-stone-500 font-semibold">{tr('agenda.interactiveToggles') || "Toggles interactifs"}</span>
        </div>

        {/* Barrette d'interrupteurs rapides */}
        <EventQuickTogglesGrid
          formData={formData}
          toggleBooleanField={toggleBooleanField}
          saving={saving}
          tr={tr}
        />

        {/* Détails conditionnels Artistiques & Covoiturage */}
        <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
          {/* Tenues et niveaux selon les toggles */}
          <EventDisciplineDressCodeFields
            formData={formData}
            handleChange={handleDisciplineFieldChange}
            saving={saving}
            customCategories={customCategories}
            combinedCostumeOptions={combinedCostumeOptions}
            tr={tr}
          />

          {/* Pupitres Requis & Quotas Cibles */}
          {(formData.includesPercussion !== false || formData.includesDance !== false) && (
            <EventPupitresQuotasFields
              formData={formData}
              setFormData={setFormData}
              pupitresList={pupitresList}
              disabled={saving}
            />
          )}

          {/* Covoiturage actif : Horaires & Distance */}
          {formData.enableCarpool !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded border border-emerald-300/40">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-emerald-900 dark:text-emerald-300">
                  🚗 {tr('agenda.convoyRdvField') || "RDV convoi / Covoiturage"}
                </label>
                <input
                  type="text"
                  name="horaireCovoiturage"
                  value={formData.horaireCovoiturage || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder={tr('agenda.convoyRdvPlaceholder') || "Ex. : 13h00 au local"}
                  className="theme-input text-xs py-1 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-emerald-900 dark:text-emerald-300">
                  {tr('agenda.distanceField') || "Distance aller-retour (km)"}
                </label>
                <input
                  type="number"
                  min="0"
                  name="distanceAllerRetourKm"
                  value={formData.distanceAllerRetourKm || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder={tr('agenda.distancePlaceholder') || "Ex. : 80"}
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

          {/* Morceaux du répertoire au programme (Fil conducteur) */}
          <EventRepertoireProgramSelector
            formData={formData}
            setFormData={setFormData}
            groupId={groupId}
            disabled={saving}
          />

          {/* Section Médias & Captations (Dépôt Framaspace & Restitution YouTube) */}
          <EventMediaFields
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            saving={saving}
            defaultDropUrl={defaultDropUrl}
            groupId={groupId}
          />

          {/* Sélecteur de Tampon Cordel (Création) */}
          {!isEdit && (
            <EventStampSelector
              formData={formData}
              setFormData={setFormData}
              disabled={saving}
            />
          )}

          {/* Notification Push (Création uniquement) */}
          {!isEdit && (
            <div className="flex items-center gap-2 pt-1 select-none">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-cordel-wood">
                <input
                  type="checkbox"
                  name="sendPushNotification"
                  checked={formData.sendPushNotification !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendPushNotification: e.target.checked }))}
                  disabled={saving}
                  className="w-4 h-4 rounded accent-cordel-wood cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <XiloMegaphone size={14} className="text-cordel-wood" />
                  Envoyer une notification Push aux membres
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ÉTAGE 3 : TIROIR AVANCÉ (Replié par défaut)
          ========================================================================= */}
      <CordelAccordion
        title={tr('agenda.advancedOptionsTitle')}
        subtitle={tr('agenda.advancedOptionsDesc') || "Date limite, créneaux bénévoles, budget prévisionnel et sondage de dates"}
        icon="⚙️"
        isOpen={isAdvancedOpen}
        onToggle={setIsAdvancedOpen}
      >
        <div className="flex flex-col gap-4 pt-1">
          {/* Date limite d'inscription (Aucune / Délai relatif J-N / Date fixe) */}
          <EventDeadlineModeField
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            saving={saving}
            tr={tr}
          />

          {/* Horaires de passages (prestation) */}
          {formData.type === 'prestation' && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {tr('agenda.detailedSchedule')}
              </label>
              <input
                type="text"
                name="horairesPassages"
                value={formData.horairesPassages || ''}
                onChange={handleChange}
                disabled={saving}
                placeholder={tr('agenda.schedulePlaceholder')}
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
                💰 {tr('agenda.budgetTitle')}
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
            <EventVolunteerShiftsEditor
              formData={formData}
              setFormData={setFormData}
              saving={saving}
              tr={tr}
            />
          )}

          {/* Sondage multi-dates (Création uniquement) */}
          {!isEdit && (
            <EventPollFormSection
              formData={formData}
              setFormData={setFormData}
              pupitresList={pupitresList}
              eventTypeConfigs={eventTypeConfigs}
              tr={tr}
            />
          )}
        </div>
      </CordelAccordion>
    </div>
  );
}
