import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import CordelAccordion, { CordelAccordionGroup } from '../CordelAccordion';
import EventBudgetEditor from '../event-details/EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';
import ManualMapMarkerModal from './ManualMapMarkerModal';

import AddressAutocomplete from '../AddressAutocomplete';
import LocationSelector from '../LocationSelector';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

/**
 * EventCreateForm component handles creation details of a new event.
 * Organized into logical accordions for Progressive Disclosure ergonomics.
 *
 * @param {Object} props Component properties
 * @param {Object} props.formData Form state containing new event fields
 * @param {Function} props.setFormData State updater function for the form data
 * @param {Function} props.handleChange Field change event handler
 * @param {Function} props.handleSubmit Submit handler for the event creation
 * @param {Function} props.handleCloseForm Action handler to cancel and close creation panel
 * @param {boolean} props.saving Indicates if event creation API call is in progress
 * @param {Array} props.dressCodes List of available dress codes
 * @param {Object} props.createConfig Config values for enabled event features
 * @param {Object} props.rawCreateConfig Raw event type configurations
 * @param {Array} props.associationEventTypes List of allowed event type names
 * @param {string} props.adresseLocal Base location of the association
 * @param {Function} props.t Translation helper function
 */
export default function EventCreateForm({
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  handleCloseForm,
  saving,
  dressCodes,
  wardrobeCostumes = [],
  createConfig,
  rawCreateConfig,
  associationEventTypes,
  adresseLocal,
  lieuxImportants = [],
  defaultLocationsByEventType = {},
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  t
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const combinedCostumeOptions = React.useMemo(() => {
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

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood flex items-center justify-between">
        <span>{translate('widgetAgenda.createEventTitle', "Créer un événement")}</span>
        <span className="text-xs font-normal opacity-75 text-[var(--encre-noire)]">
          Organisé en 4 blocs dépliables
        </span>
      </h4>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CordelAccordionGroup>
          {/* BLOCK 1: INFORMATIONS GÉNÉRALES (Open by default) */}
          <CordelAccordion
            title="1. Informations Générales"
            subtitle="Titre, type, date, horaire, lieu et description de l'événement"
            icon="📌"
            defaultOpen={true}
          >
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.eventTitleLabel', "Titre de l'événement")} *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  placeholder="Ex : Carnaval ou Répétition"
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Visibilité Publique Vitrine */}
              <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={saving}
                  className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
                />
                <label htmlFor="isPublic" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
                  <span>🌍 Rendre cet événement public</span>
                  <span className="text-[10px] font-normal opacity-75 text-stone-600">(Visible sur le site vitrine public)</span>
                </label>
              </div>

              {/* Type Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.typeLabel', "Type")} *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => {
                    handleChange(e);
                    const newType = e.target.value;
                    const defaultLieuId = defaultLocationsByEventType[newType];
                    if (defaultLieuId) {
                      const foundLieu = (lieuxImportants || []).find(l => l.id === defaultLieuId);
                      if (foundLieu) {
                        const fullLocationText = foundLieu.nom && foundLieu.adresse ? `${foundLieu.nom} - ${foundLieu.adresse}` : (foundLieu.adresse || foundLieu.nom);
                        setFormData(prev => ({
                          ...prev,
                          lieu: fullLocationText,
                          lieuId: defaultLieuId,
                          latitude: foundLieu.latitude || prev.latitude,
                          longitude: foundLieu.longitude || prev.longitude
                        }));
                      }
                    }
                  }}
                  required
                  disabled={saving}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
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

              {/* Description de l'événement (Consolidée) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span>📝 Description de l'événement</span>
                  <span className="text-[8px] font-normal text-stone-500">(Visible sur la fiche événement des membres & sur le site public si l'événement est public)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Décrivez l'événement (programme, ambiance, infos pratiques, consignes générales...)"
                  className="theme-input w-full min-h-[90px] disabled:opacity-50 font-medium py-1.5"
                />
              </div>

              {/* Date Début */}
              {!formData.isPoll && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.startDateLabel', "Date et heure de début")} *
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required={!formData.isPoll}
                    disabled={saving}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Date Fin (optionnel) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.endDateLabel', "Date et heure de fin (optionnel)")}
                </label>
                <input
                  type="datetime-local"
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleChange}
                  onFocus={() => {
                    if (!formData.dateFin && formData.date) {
                      setFormData(prev => ({ ...prev, dateFin: prev.date }));
                    }
                  }}
                  disabled={saving}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Lieu (Adresse) */}
              {createConfig.agendaEnableAdresse && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.locationLabel', "Lieu")}
                  </label>
                  <React.Suspense fallback={
                    <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                      ⏳ {translate('widgetAgenda.loadingAddress', "Chargement du champ adresse...")}
                    </div>
                  }>
                    <LocationSelector
                      value={formData.lieu}
                      lieuxImportants={lieuxImportants}
                      onChange={(val, foundPreset) => {
                        setFormData(prev => ({ ...prev, lieu: val, lieuId: foundPreset ? foundPreset.id : null }));
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
                            console.error("Distance Matrix calculation failed on create:", err);
                          }
                        }
                      }}
                      onOpenMapModal={() => setIsMapModalOpen(true)}
                      placeholder={translate('widgetAgenda.locationPlaceholder', "Ex : Local de l'asso, Place de la Mairie...")}
                      className="theme-input w-full disabled:opacity-50"
                    />
                  </React.Suspense>
                  
                  {formData.latitude && formData.longitude && (
                    <div className="flex flex-col items-start gap-1 mt-1 select-none">
                      <div className="flex items-center gap-2 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-300/60">
                        <span>📍 Coordonnées manuelles actives : {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, latitude: null, longitude: null }))}
                          className="text-red-600 hover:text-red-800 font-black cursor-pointer ml-1"
                          title="Effacer les coordonnées manuelles"
                        >
                          ✕
                        </button>
                      </div>
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

                  {!adresseLocal && (
                    <span className="text-[9px] text-orange-600 font-bold leading-none mt-1 select-none text-left">
                      ⚠️ {translate('widgetAgenda.localAddressNotConfigured', "Adresse du local non configurée dans les paramètres de l'association (calcul de distance inactif).")}
                    </span>
                  )}
                </div>
              )}

              {/* Tenues requises (Percussion & Danse) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tenue Percussion */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                    <span>🥁 Tenue requise (Percussion)</span>
                  </label>
                  <select
                    name="dressCodePercussion"
                    value={formData.dressCodePercussion || ''}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light text-xs"
                  >
                    <option value="">-- Aucune tenue spécifiée / Libre --</option>
                    {combinedCostumeOptions.map(opt => (
                      <option key={`perc-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tenue Danse */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                    <span>💃 Tenue requise (Danse)</span>
                  </label>
                  <select
                    name="dressCodeDanse"
                    value={formData.dressCodeDanse || ''}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light text-xs"
                  >
                    <option value="">-- Aucune tenue spécifiée / Libre --</option>
                    {combinedCostumeOptions.map(opt => (
                      <option key={`danse-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Limite Inscription */}
              {createConfig.agendaEnableInscriptions && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.deadlineLabel', "Date limite d'inscription (Optionnel)")}
                  </label>
                  <input
                    type="datetime-local"
                    name="dateLimiteInscription"
                    value={formData.dateLimiteInscription}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Enable Inscriptions Toggle */}
              <div className="flex items-center gap-2 pt-1 text-left">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="enableInscriptions"
                    checked={formData.enableInscriptions !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableInscriptions: e.target.checked }))}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>📝 Demander des inscriptions pour cet événement (Présent / Absent / À confirmer)</span>
                </label>
              </div>

              {/* Notification Push FCM Toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left select-none">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-cordel-wood">
                  <input
                    type="checkbox"
                    name="sendPushNotification"
                    checked={Boolean(formData.sendPushNotification)}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendPushNotification: e.target.checked }))}
                    disabled={saving}
                    className="w-4 h-4 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                  />
                  <span>📢 Envoyer une notification Push aux membres</span>
                </label>
              </div>
            </div>
          </CordelAccordion>

          {/* BLOCK 2: LOGISTIQUE & COVOITURAGE (Closed by default) */}
          <CordelAccordion
            title="2. Logistique & Covoiturage"
            subtitle="Covoiturage, horaires de convoi, distance, budget prévisionnel et bénévoles"
            icon="🚗"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-4">
              {/* Covoiturage Toggle */}
              {rawCreateConfig.agendaEnableCarpool !== false && (
                <div className="flex items-center gap-2 text-left">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="enableCarpool"
                      checked={formData.enableCarpool}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableCarpool: e.target.checked }))}
                      disabled={saving}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>🚗 {translate('widgetAgenda.enableCarpoolLabel', "Autoriser le covoiturage pour cet événement")}</span>
                  </label>
                </div>
              )}

              {/* Horaire Covoiturage */}
              {rawCreateConfig.agendaEnableCarpool !== false && (formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.carpoolTimeLabel', "Horaire de convoi / RDV covoiturage")}
                  </label>
                  <input
                    type="text"
                    name="horaireCovoiturage"
                    value={formData.horaireCovoiturage}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Ex : 13h00 au local"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Distance A/R (Covoiturage) */}
              {rawCreateConfig.agendaEnableCarpool !== false && (formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.distanceLabel', "Distance Aller-Retour en Km (Covoiturage)")}
                  </label>
                  <input
                    type="number"
                    name="distanceAllerRetourKm"
                    min="0"
                    value={formData.distanceAllerRetourKm}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Ex : 120"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Horaires Passages (prestation) */}
              {formData.type === 'prestation' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.stageTimesLabel', "Horaires de passages")}
                  </label>
                  <input
                    type="text"
                    name="horairesPassages"
                    value={formData.horairesPassages}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Ex : 14:30 - 15:15"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Finances / Budget */}
              {createConfig.agendaEnableFinance && (
                <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1 flex flex-col gap-3 text-left">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
                    💰 {translate('widgetAgenda.finBudgetTitle', "Budget & Finances Prévisionnelles")}
                  </h4>
                  
                  <EventBudgetEditor
                    budgetDepenses={formData.budgetDepenses}
                    onChangeDepenses={(updated) => setFormData(prev => ({ ...prev, budgetDepenses: updated }))}
                    disabled={saving}
                  />
                </div>
              )}

              {/* Créneaux Bénévoles (Volunteer shifts) */}
              {createConfig.agendaEnableVolunteers && (
                <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1 flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
                      🤝 Créneaux Bénévoles requis
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newShifts = [...formData.volunteerShifts, { label: '', horaires: '', neededCount: 1 }];
                        setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                      }}
                      className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2.5 py-1 rounded cursor-pointer hover:bg-cordel-hover"
                    >
                      {t('common.add') || "＋ Ajouter"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {formData.volunteerShifts.length === 0 ? (
                      <p className="text-[10px] italic opacity-60">Aucun créneau bénévole requis configuré.</p>
                    ) : (
                      formData.volunteerShifts.map((shift, idx) => (
                        <div key={idx} className="flex gap-2 items-end p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/25 rounded relative">
                          <div className="flex-1 flex flex-col gap-1 w-full">
                            <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Titre de la mission</label>
                            <input
                              type="text"
                              value={shift.label}
                              placeholder="Ex : Tenue de bar, Accueil"
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
                          <div className="flex-1 flex flex-col gap-1 w-full">
                            <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Horaires</label>
                            <input
                              type="text"
                              value={shift.horaires}
                              placeholder="Ex : 14:00 - 16:00"
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
                            className="text-[9.5px] font-black uppercase bg-cordel-rouge text-white border border-encre-noire px-2.5 py-2.5 rounded cursor-pointer hover:bg-red-800 shadow-[1px_1px_0px_0px_#181716] shrink-0"
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
            </div>
          </CordelAccordion>

          {/* BLOCK 3: CASTING & INSTRUMENTS (Closed by default) */}
          <CordelAccordion
            title="3. Casting & Instruments"
            subtitle="Niveaux requis, options musique/danse, liens documents et validation admin"
            icon="🥁"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-4">
              {/* Niveaux Requis (Musique et Danse) */}
              {(formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'repetition' || formData.type === 'atelier') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {translate('widgetAgenda.musicLevelLabel', "Musique (Niveau requis)")}
                    </label>
                    <select
                      name="niveauRequis"
                      value={formData.niveauRequis}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                    >
                      <option value="aucun">{translate('widgetAgenda.levelNone', "Pas de musicien")}</option>
                      <option value="tous">{translate('widgetAgenda.levelAll', "Tout le monde")}</option>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {translate('widgetAgenda.danceLevelLabel', "Danse (Niveau requis)")}
                    </label>
                    <select
                      name="niveauDanseRequis"
                      value={formData.niveauDanseRequis}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                    >
                      <option value="aucun">{translate('widgetAgenda.danceLevelNone', "Pas de danse")}</option>
                      <option value="tous">{translate('widgetAgenda.danceLevelAll', "Tout le monde")}</option>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Percussion & Danse Toggles */}
              <div className="flex gap-4 items-center py-2.5 border-t border-b border-dashed border-cordel-master-dark/15 flex-wrap text-left">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="includesPercussion"
                    checked={formData.includesPercussion}
                    onChange={(e) => setFormData(prev => ({ ...prev, includesPercussion: e.target.checked }))}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    <img src="/icones/alfaia.svg" alt="Percussion" className="w-3.5 h-3.5 object-contain dark:invert inline-block" />
                    <span>{translate('widgetAgenda.includesPercussionLabel', "Inclut de la percussion")}</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="includesDance"
                    checked={formData.includesDance}
                    onChange={(e) => setFormData(prev => ({ ...prev, includesDance: e.target.checked }))}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>💃 {translate('widgetAgenda.includesDanceLabel', "Inclut de la danse")}</span>
                </label>
              </div>

              {/* Lien Dépôt Médias Externe (Framaspace, Drive...) */}
              <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                  📸 Lien de dépôt photos/vidéos (Framaspace, Drive...)
                </label>
                <input
                  type="url"
                  name="lienDepotMedias"
                  value={formData.lienDepotMedias || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="ex: https://framaspace.org/s/... ou Google Drive"
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold bg-cordel-bg-light"
                />
                <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
                  Lien de dépôt de fichiers (Framaspace, Drive...) pour que les membres et le public envoient leurs photos/vidéos.
                </p>
              </div>

              {/* Lien externe/social */}
              {createConfig.agendaEnableUrl && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.socialLinkLabel', "Lien de publication social / externe")}
                  </label>
                  <input
                    type="url"
                    name="lienSocial"
                    value={formData.lienSocial}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="https://facebook.com/..."
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Validation Toggle */}
              {createConfig.agendaEnableInscriptions && (
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="requiresValidation"
                      checked={formData.requiresValidation}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiresValidation: e.target.checked }))}
                      disabled={saving}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>{translate('widgetAgenda.requiresValidationLabel', "Inscriptions soumises à validation par l'administrateur")}</span>
                  </label>
                </div>
              )}
            </div>
          </CordelAccordion>

          {/* BLOCK 4: SONDAGE & RÉUNION (Closed by default) */}
          <CordelAccordion
            title="4. Sondage & Réunions"
            subtitle="Création de sondages de dates et liaisons aux réunions"
            icon="📊"
            defaultOpen={false}
          >
            {/* Multi-Date Poll Toggle Section */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded-[6px_8px_5px_7px] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <label className="text-xs font-black uppercase text-cordel-wood cursor-pointer">
                      Créer un sondage de dates
                    </label>
                    <p className="text-[9px] font-semibold text-encre-noire/70">
                      Proposer 2 à 4 créneaux temporaires pour soumettre au vote des membres
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
                <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-amber-500/30">
                  {/* Restriction Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Restriction du vote
                      </label>
                      <select
                        value={formData.pollRestrictionType || 'aucun'}
                        onChange={(e) => setFormData(prev => ({ ...prev, pollRestrictionType: e.target.value, pollTarget: '' }))}
                        className="theme-input text-xs font-bold py-1 bg-white"
                      >
                        <option value="aucun">👥 Tous les membres</option>
                        <option value="tag">🏷️ Par Étiquette (ex: C.A, Bureau)</option>
                        <option value="instrument">🥁 Par Pupitre / Instrument</option>
                      </select>
                    </div>

                    {formData.pollRestrictionType === 'tag' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Étiquette ciblée
                        </label>
                        <input
                          type="text"
                          list="available-tags-list"
                          value={formData.pollTarget || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, pollTarget: e.target.value }))}
                          placeholder="Ex: C.A, Bureau..."
                          className="theme-input text-xs font-bold py-1 bg-white"
                        />
                        <datalist id="available-tags-list">
                          <option value="C.A" />
                          <option value="Bureau" />
                          <option value="Mestre" />
                          <option value="Modérateur" />
                          <option value="Commission Logistique" />
                        </datalist>
                      </div>
                    )}

                    {formData.pollRestrictionType === 'instrument' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Pupitre / Instrument ciblé
                        </label>
                        <select
                          value={formData.pollTarget || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, pollTarget: e.target.value }))}
                          className="theme-input text-xs font-bold py-1 bg-white"
                        >
                          <option value="">-- Choisir l'instrument --</option>
                          {['Alfaia', 'Caixa', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Chant', 'Danse'].map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Candidate Option Dates */}
                  <div className="flex flex-col gap-2">
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
                </div>
              )}
            </div>
          </CordelAccordion>
        </CordelAccordionGroup>

        {/* Form Action Buttons */}
        <div className="flex gap-3 justify-end mt-4 pt-2 border-t border-[var(--cordel-border)]">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={handleCloseForm} 
            disabled={saving}
            className="text-xs px-4 py-2"
          >
            {translate('common.cancel', "Annuler")}
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="ocre" 
            useExtremeBorder={true}
            disabled={saving}
            className="text-xs px-4 py-2"
          >
            {saving ? translate('common.saving', "Envoi...") : translate('common.validate', "Valider")}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
