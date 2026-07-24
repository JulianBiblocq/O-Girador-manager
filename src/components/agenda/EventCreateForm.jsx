import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventBudgetEditor from '../event-details/EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';
import ManualMapMarkerModal from './ManualMapMarkerModal';

const AddressAutocomplete = React.lazy(() => import('../AddressAutocomplete'));

/**
 * EventCreateForm component handles creation details of a new event.
 * Extracted from WidgetAgenda to enforce code modularity.
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
  createConfig,
  rawCreateConfig,
  associationEventTypes,
  adresseLocal,
  t
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
        {translate('widgetAgenda.createEventTitle', "Créer un événement")}
      </h4>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.eventTitleLabel', "Titre de l'événement")}
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

        {/* Type Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.typeLabel', "Type")}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
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

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('common.description', "Description")}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={saving}
            placeholder={translate('widgetAgenda.descriptionPlaceholder', "Description détaillée de l'événement...")}
            className="theme-input w-full min-h-[80px] disabled:opacity-50 font-medium py-1.5"
          />
        </div>

        {/* Date Début */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.startDateLabel', "Date et heure de début")}
          </label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={saving}
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
              <AddressAutocomplete
                name="lieu"
                value={formData.lieu}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, lieu: e.target.value }));
                }}
                onSelect={async (placeData) => {
                  const exactAddress = placeData.address || '';
                  setFormData(prev => ({ ...prev, lieu: exactAddress }));
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
                required
                disabled={saving}
                placeholder={translate('widgetAgenda.locationPlaceholder', "Ex : Local de l'asso, Place de la Mairie...")}
                className="theme-input w-full disabled:opacity-50"
              />
            </React.Suspense>
            
            <div className="flex flex-col items-start gap-1 mt-1 select-none">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer"
              >
                📌 Placer sur la carte manuellement
              </button>
              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-2 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-300/60">
                  <span>📌 Coordonnées manuelles actives : {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, latitude: null, longitude: null }))}
                    className="text-red-600 hover:text-red-800 font-black cursor-pointer ml-1"
                    title="Effacer les coordonnées manuelles"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

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

        {/* Niveaux Requis (Musique et Danse) */}
        {(formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'repetition' || formData.type === 'atelier') && (
          <>
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
                <option value="debutant">{translate('widgetAgenda.levelDeb', "Niveau débutant")}</option>
                <option value="confirme">{translate('widgetAgenda.levelConfirm', "Niveau confirmé")}</option>
                <option value="tous">{translate('widgetAgenda.levelAll', "Tout le monde")}</option>
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
                <option value="debutant">{translate('widgetAgenda.danceLevelDeb', "Niveau débutant")}</option>
                <option value="confirme">{translate('widgetAgenda.danceLevelConfirm', "Niveau confirmé")}</option>
                <option value="tous">{translate('widgetAgenda.danceLevelAll', "Tout le monde")}</option>
              </select>
            </div>
          </>
        )}

        {/* Tenue requise */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.dressCodeLabel', "Tenue requise / Dress Code (Optionnel)")}
          </label>
          <select
            name="tenueRequise"
            value={formData.tenueRequise}
            onChange={handleChange}
            disabled={saving}
            className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
          >
            <option value="">{translate('widgetAgenda.noDressCode', "-- Aucune tenue spécifiée --")}</option>
            {dressCodes.map(dc => (
              <option key={dc.id} value={dc.name}>{dc.name} ({dc.included})</option>
            ))}
          </select>
        </div>

        {/* Ordre du jour */}
        {createConfig.agendaEnableOrdreDuJour && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('widgetAgenda.agendaDocLinkLabel', "Lien du document d'ordre du jour")}
            </label>
            <input
              type="url"
              name="lienDocument"
              value={formData.lienDocument}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>
        )}

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
              className="theme-input w-full disabled:opacity-50"
            />
          </div>
        )}

        {/* Finances / Budget */}
        {createConfig.agendaEnableFinance && (
          <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 mt-2.5 flex flex-col gap-4 text-left">
            <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
              💰 {translate('widgetAgenda.finBudgetTitle', "Budget & Finances Prévisionnelles")}
            </h4>
            
            <EventBudgetEditor
              budgetRecettes={formData.budgetRecettes}
              onChangeRecettes={(updated) => setFormData(prev => ({ ...prev, budgetRecettes: updated }))}
              budgetDepenses={formData.budgetDepenses}
              onChangeDepenses={(updated) => setFormData(prev => ({ ...prev, budgetDepenses: updated }))}
              disabled={saving}
            />
          </div>
        )}

        {/* Créneaux Bénévoles (Volunteer shifts) */}
        {createConfig.agendaEnableVolunteers && (
          <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 mt-2.5 flex flex-col gap-3.5 text-left">
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
            <span>🪘 {translate('widgetAgenda.includesPercussionLabel', "Inclut de la percussion")}</span>
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

        {/* Covoiturage Toggle */}
        {rawCreateConfig.agendaEnableCarpool !== false && (
          <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
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

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-2">
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
