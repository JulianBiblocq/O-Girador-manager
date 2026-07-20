import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventBudgetEditor from './EventBudgetEditor';
import { calculateRoadDistance } from '../../utils/googleMaps';

const AddressAutocomplete = React.lazy(() => import('../AddressAutocomplete'));

/**
 * EventEditForm component handles editing details of an event.
 * It is extracted to keep the parent EventDetails component modular and readable.
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
  editConfig,
  rawEditConfig,
  associationEventTypes,
  adresseLocal,
  imageMode,
  setImageMode,
  uploadingImage,
  handleImageUpload,
  t
}) {
  return (
    <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
      <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 text-left">
        <h3 className="panel-title text-base font-bold mb-4 text-cordel-wood">
          {t('widgetAgenda.editEventTitle') || "Modifier l'événement"}
        </h3>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('widgetAgenda.eventTitleLabel') || "Titre de l'événement"}
            </label>
            <input
              type="text"
              value={editForm.titre}
              onChange={(e) => setEditForm(prev => ({ ...prev, titre: e.target.value }))}
              required
              disabled={savingEvent}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          {/* Type Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('widgetAgenda.typeLabel') || "Type"}
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
                  {type === 'prestation' ? (t('widgetAgenda.typePrestation') || "Prestation (Ocre)") :
                   type === 'repetition' ? (t('widgetAgenda.typeRepetition') || "Répétition (Vert)") :
                   type === 'stage' ? (t('widgetAgenda.typeStage') || "Stage (Bleu)") :
                   type === 'atelier' ? (t('widgetAgenda.typeAtelier') || "Atelier (Jaune)") :
                   type === 'reunion' ? (t('widgetAgenda.typeReunion') || "Réunion (Kraft)") :
                   type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('common.description') || "Description"}
            </label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={savingEvent}
              placeholder={t('widgetAgenda.descriptionPlaceholder') || "Description détaillée de l'événement..."}
              className="theme-input w-full min-h-[80px] disabled:opacity-50 font-medium py-1.5"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('widgetAgenda.startDateLabel') || "Date et heure de début"}
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
              {t('widgetAgenda.endDateLabel') || "Date et heure de fin (optionnel)"}
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
                {t('widgetAgenda.locationLabel') || "Lieu"}
              </label>
              <React.Suspense fallback={
                <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                  ⏳ {t('widgetAgenda.loadingAddress') || "Chargement du champ adresse..."}
                </div>
              }>
                <AddressAutocomplete
                  name="lieu"
                  value={editForm.lieu}
                  onChange={async (e) => {
                    const newLieu = e.target.value;
                    setEditForm(prev => ({ ...prev, lieu: newLieu }));
                    if (adresseLocal && newLieu) {
                      try {
                        const distanceKm = await calculateRoadDistance(adresseLocal, newLieu);
                        const distanceRoundTrip = Math.round(distanceKm * 2);
                        setEditForm(prev => ({ ...prev, distanceAllerRetourKm: distanceRoundTrip.toString() }));
                      } catch (err) {
                        console.error("Distance Matrix calculation failed on edit:", err);
                      }
                    }
                  }}
                  required
                  disabled={savingEvent}
                  placeholder={t('widgetAgenda.locationPlaceholder') || "Ex : Local de l'asso, Place de la Mairie..."}
                  className="theme-input w-full disabled:opacity-50"
                />
              </React.Suspense>
              {!adresseLocal && (
                <span className="text-[9px] text-orange-600 font-bold leading-none mt-1 select-none text-left">
                  ⚠️ {t('widgetAgenda.localAddressNotConfigured') || "Adresse du local non configurée dans les paramètres de l'association (calcul de distance inactif)."}
                </span>
              )}
            </div>
          )}

          {/* Distance A/R (Covoiturage) */}
          {rawEditConfig.agendaEnableCarpool !== false && (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.distanceLabel') || "Distance Aller-Retour en Km (Covoiturage)"}
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

          {/* Date Limite Inscription */}
          {editConfig.agendaEnableInscriptions && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.deadlineLabel') || "Date limite d'inscription (Optionnel)"}
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

          {/* Horaires Passages (prestation) */}
          {editForm.type === 'prestation' && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.stageTimesLabel') || "Horaires de passages"}
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

          {/* Horaire Covoiturage */}
          {rawEditConfig.agendaEnableCarpool !== false && (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.carpoolTimeLabel') || "Horaire de convoi / RDV covoiturage"}
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

          {/* Niveaux Requis (Musique et Danse) */}
          {(editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.musicLevelLabel') || "Musique (Niveau requis)"}
                </label>
                <select
                  value={editForm.niveauRequis}
                  onChange={(e) => setEditForm(prev => ({ ...prev, niveauRequis: e.target.value }))}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="aucun">{t('widgetAgenda.levelNone') || "Pas de musicien"}</option>
                  <option value="debutant">{t('widgetAgenda.levelDeb') || "Niveau débutant"}</option>
                  <option value="confirme">{t('widgetAgenda.levelConfirm') || "Niveau confirmé"}</option>
                  <option value="tous">{t('widgetAgenda.levelAll') || "Tout le monde"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.danceLevelLabel') || "Danse (Niveau requis)"}
                </label>
                <select
                  value={editForm.niveauDanseRequis}
                  onChange={(e) => setEditForm(prev => ({ ...prev, niveauDanseRequis: e.target.value }))}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="aucun">{t('widgetAgenda.danceLevelNone') || "Pas de danse"}</option>
                  <option value="debutant">{t('widgetAgenda.danceLevelDeb') || "Niveau débutant"}</option>
                  <option value="confirme">{t('widgetAgenda.danceLevelConfirm') || "Niveau confirmé"}</option>
                  <option value="tous">{t('widgetAgenda.danceLevelAll') || "Tout le monde"}</option>
                </select>
              </div>
            </>
          )}

          {/* Tenue requise */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('widgetAgenda.dressCodeLabel') || "Tenue requise / Dress Code (Optionnel)"}
            </label>
            <select
              value={editForm.tenueRequise || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, tenueRequise: e.target.value }))}
              disabled={savingEvent}
              className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
            >
              <option value="">{t('widgetAgenda.noDressCode') || "-- Aucune tenue spécifiée --"}</option>
              {dressCodes.map(dc => (
                <option key={dc.id} value={dc.name}>{dc.name} ({dc.included})</option>
              ))}
            </select>
          </div>

          {/* Ordre du jour */}
          {editConfig.agendaEnableOrdreDuJour && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.agendaDocLinkLabel') || "Lien du document d'ordre du jour"}
              </label>
              <input
                type="url"
                value={editForm.lienDocument}
                onChange={(e) => setEditForm(prev => ({ ...prev, lienDocument: e.target.value }))}
                disabled={savingEvent}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>
          )}

          {/* Lien externe/social */}
          {editConfig.agendaEnableUrl && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.socialLinkLabel') || "Lien de publication social / externe"}
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

          {/* Finances / Budget */}
          {editConfig.agendaEnableFinance && (
            <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 mt-2.5 flex flex-col gap-4 text-left">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1 leading-none">
                💰 {t('widgetAgenda.finBudgetTitle') || "Budget & Finances Prévisionnelles"}
              </h4>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Recette Globale attendue (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.montantRecette}
                    onChange={(e) => setEditForm(prev => ({ ...prev, montantRecette: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="Ex : 500"
                    className="theme-input text-xs py-1.5 px-3 w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Dépense Globale attendue (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.montantDepense}
                    onChange={(e) => setEditForm(prev => ({ ...prev, montantDepense: e.target.value }))}
                    disabled={savingEvent}
                    placeholder="Ex : 200"
                    className="theme-input text-xs py-1.5 px-3 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EventBudgetEditor
                  title="Détail des Recettes"
                  items={editForm.budgetRecettes}
                  onChange={(updated) => setEditForm(prev => ({ ...prev, budgetRecettes: updated }))}
                  disabled={savingEvent}
                  placeholderName="Ex : Subvention, Cachet..."
                />
                <EventBudgetEditor
                  title="Détail des Dépenses"
                  items={editForm.budgetDepenses}
                  onChange={(updated) => setEditForm(prev => ({ ...prev, budgetDepenses: updated }))}
                  disabled={savingEvent}
                  placeholderName="Ex : Location, Traiteur..."
                />
              </div>
            </div>
          )}

          {/* Créneaux Bénévoles (Volunteer shifts) */}
          {editConfig.agendaEnableVolunteers && (
            <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 mt-2.5 flex flex-col gap-3.5 text-left">
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

          {/* Image de l'événement */}
          {editConfig.agendaEnableImage && (
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.imageUrlLabel') || "Image de l'événement / Affiche"}
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
                      <>⏳ {t('widgetAgenda.uploadingImage') || "Téléversement..."}</>
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
              <span>🪘 {t('widgetAgenda.includesPercussionLabel') || "Inclut de la percussion"}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editForm.includesDance || false}
                onChange={(e) => setEditForm(prev => ({ ...prev, includesDance: e.target.checked }))}
                disabled={savingEvent}
                className="accent-cordel-wood scale-105"
              />
              <span>💃 {t('widgetAgenda.includesDanceLabel') || "Inclut de la danse"}</span>
            </label>
          </div>

          {/* Covoiturage Toggle */}
          {rawEditConfig.agendaEnableCarpool !== false && (
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editForm.enableCarpool !== false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, enableCarpool: e.target.checked }))}
                  disabled={savingEvent}
                  className="accent-cordel-wood scale-105"
                />
                <span>🚗 {t('widgetAgenda.enableCarpoolLabel') || "Autoriser le covoiturage pour cet événement"}</span>
              </label>
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
                <span>{t('widgetAgenda.requiresValidationLabel') || "Inscriptions soumises à validation par l'administrateur"}</span>
              </label>
            </div>
          )}
        </div>

        <CordelButton
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={savingEvent}
          className="w-full mt-5 py-3 text-xs font-bold uppercase tracking-widest"
        >
          {savingEvent ? "Modification..." : "Enregistrer les modifications"}
        </CordelButton>
        <CordelButton
          type="button"
          variant="rouge"
          useExtremeBorder={true}
          disabled={savingEvent}
          onClick={handleDeleteEvent}
          className="w-full mt-3 py-3 text-xs font-bold uppercase tracking-widest"
        >
          {savingEvent ? "Suppression..." : "🗑️ Supprimer l'événement"}
        </CordelButton>
      </CordelCard>
    </form>
  );
}
