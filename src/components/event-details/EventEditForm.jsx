import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import CordelAccordion, { CordelAccordionGroup } from '../CordelAccordion';
import EventBudgetEditor from './EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';
import ManualMapMarkerModal from '../agenda/ManualMapMarkerModal';
import ImportAgendaModal from '../agenda/ImportAgendaModal';

import AddressAutocomplete from '../AddressAutocomplete';
import LocationSelector from '../LocationSelector';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

/**
 * EventEditForm component handles editing details of an event.
 * Organized into 4 logical accordions for Progressive Disclosure ergonomics.
 *
 * @param {Object} props Component properties
 * @param {Object} props.editForm Form state object containing event fields
 * @param {Function} props.setEditForm State updater function for the edit form
 * @param {boolean} props.savingEvent Loading state indicator for event saving operations
 * @param {Function} props.handleSaveEvent Submit handler to save event changes
 * @param {Function} props.handleDeleteEvent Action handler to delete the event
 * @param {Array} props.dressCodes List of available dress codes
 * @param {Object} props.editConfig Configuration values for active event features
 * @param {Object} props.rawEditConfig Raw configuration values from the event type
 * @param {Array} props.associationEventTypes List of allowed event type names
 * @param {string} props.imageMode Upload mode selected ('upload' or 'url')
 * @param {Function} props.setImageMode Action function to update imageMode state
 * @param {boolean} props.uploadingImage Indicator for image uploading process
 * @param {Function} props.handleImageUpload Image upload change event handler
 * @param {string} props.adresseLocal Base location of the association
 * @param {Function} props.t Translation helper function
 */
export default function EventEditForm({
  editForm,
  setEditForm,
  savingEvent,
  handleSaveEvent,
  handleDeleteEvent,
  dressCodes,
  wardrobeCostumes = [],
  editConfig,
  rawEditConfig,
  associationEventTypes,
  adresseLocal,
  lieuxImportants = [],
  imageMode,
  setImageMode,
  uploadingImage,
  handleImageUpload,
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  t
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
    <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
      <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 text-left">
        <h3 className="panel-title text-base font-bold mb-4 text-cordel-wood flex items-center justify-between">
          <span>{translate('widgetAgenda.editEventTitle', "Modifier l'événement")}</span>
          <span className="text-xs font-normal opacity-75 text-[var(--encre-noire)]">
            Organisé en 4 blocs dépliables
          </span>
        </h3>

        <CordelAccordionGroup>
          {/* BLOCK 1: INFORMATIONS GÉNÉRALES (Open by default) */}
          <CordelAccordion
            title="1. Informations Générales"
            subtitle="Titre, type, dates, lieu et description"
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
                  value={editForm.titre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, titre: e.target.value }))}
                  required
                  disabled={savingEvent}
                  placeholder="Ex : Carnaval ou Répétition"
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Visibilité Publique Vitrine */}
              <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  name="isPublic"
                  checked={editForm.isPublic || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={savingEvent}
                  className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
                />
                <label htmlFor="editIsPublic" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
                  <span>🌍 Rendre cet événement public</span>
                  <span className="text-[10px] font-normal opacity-75 text-stone-600">(Visible sur le site vitrine public)</span>
                </label>
              </div>

              {/* Description de l'événement (Consolidée) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span>📝 Description de l'événement</span>
                  <span className="text-[8px] font-normal text-stone-500">(Visible sur la fiche événement des membres & sur le site public si l'événement est public)</span>
                </label>
                <textarea
                  name="description"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={savingEvent}
                  placeholder="Décrivez l'événement (programme, ambiance, infos pratiques, consignes générales...)"
                  className="theme-input w-full min-h-[90px] disabled:opacity-50 font-medium py-1.5"
                />
              </div>

              {/* Type Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.typeLabel', "Type")} *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                  disabled={savingEvent}
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

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.startDateLabel', "Date et heure de début")} *
                </label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Date Fin (optionnel) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {translate('widgetAgenda.endDateLabel', "Date et heure de fin (optionnel)")}
                </label>
                <input
                  type="datetime-local"
                  value={editForm.dateFin || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateFin: e.target.value }))}
                  onFocus={() => {
                    if (!editForm.dateFin && editForm.date) {
                      setEditForm(prev => ({ ...prev, dateFin: prev.date }));
                    }
                  }}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Lieu (Adresse) */}
              {editConfig.agendaEnableAdresse && (
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
                      value={editForm.lieu}
                      lieuxImportants={lieuxImportants}
                      onChange={(val, foundPreset) => {
                        setEditForm(prev => ({ ...prev, lieu: val, lieuId: foundPreset ? foundPreset.id : null }));
                      }}
                      onPlaceSelected={async (placeData) => {
                        const exactAddress = placeData.formattedAddress || placeData.address || '';
                        setEditForm(prev => ({ 
                          ...prev, 
                          lieu: exactAddress,
                          latitude: placeData.latitude || prev.latitude,
                          longitude: placeData.longitude || prev.longitude
                        }));
                        if (adresseLocal && exactAddress) {
                          try {
                            const distanceKm = await calculateRoadDistance(adresseLocal, exactAddress);
                            const distanceRoundTrip = Math.round(distanceKm * 2);
                            setEditForm(prev => ({ ...prev, distanceAllerRetourKm: distanceRoundTrip.toString() }));
                          } catch (err) {
                            console.error("Distance Matrix calculation failed on edit:", err);
                          }
                        }
                      }}
                      onOpenMapModal={() => setIsMapModalOpen(true)}
                      placeholder={translate('widgetAgenda.locationPlaceholder', "Ex : Local de l'asso, Place de la Mairie...")}
                      className="theme-input w-full disabled:opacity-50"
                    />
                  </React.Suspense>

                  {editForm.latitude && editForm.longitude && (
                    <div className="flex flex-col items-start gap-1 mt-1 select-none">
                      <div className="flex items-center gap-2 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-300/60">
                        <span>📍 Coordonnées manuelles actives : {Number(editForm.latitude).toFixed(5)}, {Number(editForm.longitude).toFixed(5)}</span>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, latitude: null, longitude: null }))}
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
                      setEditForm(prev => ({ ...prev, latitude, longitude }));
                    }}
                    initialLat={editForm.latitude}
                    initialLng={editForm.longitude}
                    addressContext={editForm.lieu}
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
                    value={editForm.dressCodePercussion || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dressCodePercussion: e.target.value }))}
                    disabled={savingEvent}
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
                    value={editForm.dressCodeDanse || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dressCodeDanse: e.target.value }))}
                    disabled={savingEvent}
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
              {editConfig.agendaEnableInscriptions && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.deadlineLabel', "Date limite d'inscription (Optionnel)")}
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.dateLimiteInscription}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dateLimiteInscription: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Lien Dépôt Médias Externe (Framaspace, Drive...) */}
              <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                  📸 Lien de dépôt photos/vidéos (Framaspace, Drive...)
                </label>
                <input
                  type="url"
                  value={editForm.lienDepotMedias || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lienDepotMedias: e.target.value }))}
                  disabled={savingEvent}
                  placeholder="ex: https://framaspace.org/s/... ou Google Drive"
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold bg-cordel-bg-light"
                />
                <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
                  Lien du dossier partagé (Framaspace, Nextcloud, Google Drive...) pour récolter les clichés de l'événement et générer un QR Code sur place.
                </p>
              </div>

              {/* Enable Inscriptions Toggle */}
              <div className="flex items-center gap-2 pt-1 text-left">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.enableInscriptions !== false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, enableInscriptions: e.target.checked }))}
                    disabled={savingEvent}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>📝 Demander des inscriptions pour cet événement (Présent / Absent / À confirmer)</span>
                </label>
              </div>
            </div>
          </CordelAccordion>

          {/* BLOCK 2: LOGISTIQUE & COVOITURAGE (Closed by default) */}
          <CordelAccordion
            title="2. Logistique & Covoiturage"
            subtitle="Covoiturage, horaires convoi/passages, budget et bénévoles"
            icon="🚗"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-4">
              {/* Covoiturage Toggle */}
              {rawEditConfig.agendaEnableCarpool !== false && (
                <div className="flex items-center gap-2 text-left">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.enableCarpool !== false}
                      onChange={(e) => setEditForm(prev => ({ ...prev, enableCarpool: e.target.checked }))}
                      disabled={savingEvent}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>🚗 {translate('widgetAgenda.enableCarpoolLabel', "Autoriser le covoiturage pour cet événement")}</span>
                  </label>
                </div>
              )}

              {/* Horaire Covoiturage */}
              {rawEditConfig.agendaEnableCarpool !== false && (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.carpoolTimeLabel', "Horaire de convoi / RDV covoiturage")}
                  </label>
                  <input
                    type="text"
                    value={editForm.horaireCovoiturage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, horaireCovoiturage: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="Ex : 13h00 au local"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Distance A/R (Covoiturage) */}
              {rawEditConfig.agendaEnableCarpool !== false && (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.distanceLabel', "Distance Aller-Retour en Km (Covoiturage)")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.distanceAllerRetourKm}
                    onChange={(e) => setEditForm(prev => ({ ...prev, distanceAllerRetourKm: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="Ex : 120"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Horaires Passages (prestation) */}
              {editForm.type === 'prestation' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.stageTimesLabel', "Horaires de passages")}
                  </label>
                  <input
                    type="text"
                    value={editForm.horairesPassages}
                    onChange={(e) => setEditForm(prev => ({ ...prev, horairesPassages: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="Ex : 14:30 - 15:15"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Finances / Budget */}
              {editConfig.agendaEnableFinance && (
                <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1 flex flex-col gap-3 text-left">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
                    💰 {translate('widgetAgenda.finBudgetTitle', "Budget & Finances Prévisionnelles")}
                  </h4>
                  
                  <EventBudgetEditor
                    budgetDepenses={editForm.budgetDepenses}
                    onChangeDepenses={(updated) => setEditForm(prev => ({ ...prev, budgetDepenses: updated }))}
                    disabled={savingEvent}
                  />
                </div>
              )}

              {/* Créneaux Bénévoles (Volunteer shifts) */}
              {editConfig.agendaEnableVolunteers && (
                <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1 flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
                      🤝 Créneaux Bénévoles requis
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newShifts = [...editForm.volunteerShifts, { label: '', horaires: '', neededCount: 1 }];
                        setEditForm(prev => ({ ...prev, volunteerShifts: newShifts }));
                      }}
                      className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2.5 py-1 rounded cursor-pointer hover:bg-cordel-hover"
                    >
                      ＋ Ajouter un créneau
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {editForm.volunteerShifts.length === 0 ? (
                      <p className="text-[10px] italic opacity-60">Aucun créneau bénévole requis configuré.</p>
                    ) : (
                      editForm.volunteerShifts.map((shift, idx) => (
                        <div key={idx} className="flex gap-2 items-end p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/25 rounded relative">
                          <div className="flex-1 flex flex-col gap-1 w-full">
                            <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Titre de la mission</label>
                            <input
                              type="text"
                              value={shift.label}
                              placeholder="Ex : Tenue de bar, Accueil"
                              onChange={(e) => {
                                const newShifts = [...editForm.volunteerShifts];
                                newShifts[idx].label = e.target.value;
                                setEditForm(prev => ({ ...prev, volunteerShifts: newShifts }));
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
                                const newShifts = [...editForm.volunteerShifts];
                                newShifts[idx].neededCount = parseInt(e.target.value) || 1;
                                setEditForm(prev => ({ ...prev, volunteerShifts: newShifts }));
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
                                const newShifts = [...editForm.volunteerShifts];
                                newShifts[idx].horaires = e.target.value;
                                setEditForm(prev => ({ ...prev, volunteerShifts: newShifts }));
                              }}
                              className="theme-input py-1 px-2 text-xs w-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newShifts = editForm.volunteerShifts.filter((_, sIdx) => sIdx !== idx);
                              setEditForm(prev => ({ ...prev, volunteerShifts: newShifts }));
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
            subtitle="Niveaux requis, options musique/danse, affiche/image et validation"
            icon="🥁"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-4">
              {/* Niveaux Requis (Musique et Danse) */}
              {(editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {translate('widgetAgenda.musicLevelLabel', "Musique (Niveau requis)")}
                    </label>
                    <select
                      value={editForm.niveauRequis}
                      onChange={(e) => setEditForm(prev => ({ ...prev, niveauRequis: e.target.value }))}
                      disabled={savingEvent}
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
                      value={editForm.niveauDanseRequis}
                      onChange={(e) => setEditForm(prev => ({ ...prev, niveauDanseRequis: e.target.value }))}
                      disabled={savingEvent}
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
                    checked={editForm.includesPercussion || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, includesPercussion: e.target.checked }))}
                    disabled={savingEvent}
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
                    checked={editForm.includesDance || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, includesDance: e.target.checked }))}
                    disabled={savingEvent}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>💃 {translate('widgetAgenda.includesDanceLabel', "Inclut de la danse")}</span>
                </label>
              </div>

              {/* Image de l'événement */}
              {editConfig.agendaEnableImage && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.imageUrlLabel', "Image de l'événement / Affiche")}
                  </label>
                  
                  {/* Mode Selector */}
                  <div className="flex gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all ${
                        imageMode === 'upload'
                          ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                          : 'bg-white/40 border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-white/60'
                      }`}
                    >
                      📸 Upload classique
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded border transition-all ${
                        imageMode === 'url'
                          ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                          : 'bg-white/40 border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-white/60'
                      }`}
                    >
                      🔗 Lien URL externe
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {editForm.imageUrl && (
                      <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-[1px_1px_0px_0px_rgba(26,26,26,0.15)]">
                        <img src={editForm.imageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {imageMode === 'upload' ? (
                      <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-2 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 select-none">
                        {uploadingImage ? (
                          <>⏳ {translate('widgetAgenda.uploadingImage', "Téléversement...")}</>
                        ) : (
                          <>📸 Choisir un fichier</>
                        )}
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
                        placeholder="Collez l'URL de l'image (ex: https://site.com/affiche.jpg)"
                        className="theme-input text-xs py-1.5 px-2 flex-1"
                      />
                    )}

                    {editForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="text-[10px] font-bold text-red-700 hover:underline select-none"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ordre du jour */}
              {editConfig.agendaEnableOrdreDuJour && (
                <div className="flex flex-col gap-2 text-left pt-2 border-t border-dashed border-cordel-master-dark/15">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {translate('widgetAgenda.agendaDocLinkLabel', "Lien du document d'ordre du jour / partition")}
                    </label>
                    <CordelButton
                      type="button"
                      variant="vert"
                      useExtremeBorder={true}
                      disabled={savingEvent}
                      onClick={() => setIsImportModalOpen(true)}
                      className="text-[9px] font-extrabold uppercase px-2.5 py-1 flex items-center gap-1 shadow-sm"
                    >
                      📥 Importer un ordre du jour
                    </CordelButton>
                  </div>

                  <input
                    type="url"
                    value={editForm.lienDocument || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lienDocument: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="https://..."
                    className="theme-input w-full disabled:opacity-50 text-xs"
                  />

                  {/* Preview list of imported agenda points */}
                  {(editForm.pointsOrdreDuJour || []).length > 0 && (
                    <div className="mt-2 bg-amber-50/80 dark:bg-amber-950/20 p-3 rounded border border-dashed border-amber-500/40 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] uppercase font-black text-cordel-wood flex items-center gap-1">
                          📋 Points de l'ordre du jour ({editForm.pointsOrdreDuJour.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, pointsOrdreDuJour: [] }))}
                          className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                        >
                          Vider
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                        {editForm.pointsOrdreDuJour.map((pt, idx) => {
                          const title = typeof pt === 'string' ? pt : (pt.titre || '');
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white/70 dark:bg-black/20 p-1.5 rounded border border-encre-noire/10">
                              <span className="font-semibold text-encre-noire">{idx + 1}. {title}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = editForm.pointsOrdreDuJour.filter((_, i) => i !== idx);
                                  setEditForm(prev => ({ ...prev, pointsOrdreDuJour: updated }));
                                }}
                                className="text-red-600 font-bold hover:text-red-800 px-1 text-[10px] cursor-pointer"
                                title="Supprimer ce point"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lien externe/social */}
              {editConfig.agendaEnableUrl && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {translate('widgetAgenda.socialLinkLabel', "Lien de publication social / externe")}
                  </label>
                  <input
                    type="url"
                    value={editForm.lienSocial}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lienSocial: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Validation Toggle */}
              {editConfig.agendaEnableInscriptions && (
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.requiresValidation || false}
                      onChange={(e) => setEditForm(prev => ({ ...prev, requiresValidation: e.target.checked }))}
                      disabled={savingEvent}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>{translate('widgetAgenda.requiresValidationLabel', "Inscriptions soumises à validation par l'administrateur")}</span>
                  </label>
                </div>
              )}
            </div>
          </CordelAccordion>

          {/* BLOCK 4: SONDAGE & RÉUNIONS (Closed by default) */}
          <CordelAccordion
            title="4. Sondages & Réunions"
            subtitle="Sondages de dates et remarques"
            icon="📊"
            defaultOpen={false}
          >
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-dashed border-amber-500/40 rounded flex flex-col gap-2">
              <span className="text-xs font-bold text-cordel-wood">📊 Options de sondage</span>
              <p className="text-[10px] text-encre-noire/70">
                L'édition des sondages se fait directement depuis la vue détaillée de l'événement.
              </p>
            </div>
          </CordelAccordion>
        </CordelAccordionGroup>

        {/* Submit & Delete buttons */}
        <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-[var(--cordel-border)]">
          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            disabled={savingEvent}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest"
          >
            {savingEvent ? "Modification..." : "Enregistrer les modifications"}
          </CordelButton>
          <CordelButton
            type="button"
            variant="rouge"
            useExtremeBorder={true}
            disabled={savingEvent}
            onClick={handleDeleteEvent}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-widest"
          >
            {savingEvent ? "Suppression..." : "🗑️ Supprimer l'événement"}
          </CordelButton>
        </div>
      </CordelCard>

      {/* Modale d'importation d'un ordre du jour */}
      <ImportAgendaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        groupId={editForm.groupId}
        onSelectTemplate={(template) => {
          setEditForm(prev => {
            const formattedPoints = (template.points || []).map(p => {
              if (typeof p === 'object' && p.titre) return p;
              return { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), titre: String(p), notesCR: '' };
            });
            return {
              ...prev,
              pointsOrdreDuJour: formattedPoints,
              description: template.description ? (prev.description ? `${prev.description}\n\n${template.description}` : template.description) : prev.description
            };
          });
        }}
      />
    </form>
  );
}
