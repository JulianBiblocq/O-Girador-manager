import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TabAgenda({
  formData,
  handleChange,
  saving,
  t
}) {
  const {
    agendaRequireInstrument = false,
    agendaEnableMaybeStatus = true,
    agendaEnableStageLayout = true,
    agendaEnableRevisionProgram = true,
    agendaEnableCarpool = true,
    agendaEnableFinance = true,
    agendaEnableInscriptions = true,
    agendaEnableVolunteerShifts = true,
    eventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion']
  } = formData;

  const [newType, setNewType] = useState('');

  const handleAddType = () => {
    if (!newType.trim()) return;
    const cleanType = newType.trim().toLowerCase();
    if (eventTypes.includes(cleanType)) {
      alert("Ce type d'événement existe déjà.");
      return;
    }

    const newConfig = {
      agendaRequireInstrument: false,
      agendaEnableMaybeStatus: true,
      agendaEnableStageLayout: true,
      agendaEnableRevisionProgram: true,
      agendaEnableCarpool: true,
      agendaEnableFinance: true,
      agendaEnableInscriptions: true,
      agendaEnableImage: true,
      agendaEnableOrdreDuJour: cleanType === 'reunion',
      agendaEnableAdresse: true,
      agendaEnableUrl: true,
      agendaEnableVolunteerShifts: cleanType === 'prestation' || cleanType === 'stage'
    };

    const updatedConfigs = {
      ...(formData.eventTypeConfigs || {}),
      [cleanType]: newConfig
    };

    handleChange('eventTypeConfigs', updatedConfigs);
    handleChange('eventTypes', [...eventTypes, cleanType]);
    setNewType('');
  };

  const handleRemoveType = (typeToRemove) => {
    const minTypes = 1;
    if (eventTypes.length <= minTypes) {
      alert("Vous devez conserver au moins un type d'événement.");
      return;
    }
    const confirmMsg = t('widgetAgenda.confirmRemoveType') || `Voulez-vous vraiment supprimer le type "${typeToRemove}" ? Les événements existants de ce type ne seront pas supprimés mais ne seront plus typés dans les filtres.`;
    if (window.confirm(confirmMsg)) {
      const updatedConfigs = { ...(formData.eventTypeConfigs || {}) };
      delete updatedConfigs[typeToRemove];
      handleChange('eventTypeConfigs', updatedConfigs);
      handleChange('eventTypes', eventTypes.filter(t => t !== typeToRemove));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Contrôles On/Off */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          ⚙️ Options de l'Agenda
        </h3>
        <div className="flex flex-col gap-4 text-xs font-semibold text-encre-noire select-none">
          
          {/* Impositions Inscriptions (RSVP) */}
          <div className="flex items-start gap-2.5 cursor-pointer">
            <input 
              type="checkbox"
              id="agendaEnableInscriptions"
              checked={agendaEnableInscriptions}
              onChange={(e) => handleChange('agendaEnableInscriptions', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableInscriptions" className="font-bold text-encre-noire cursor-pointer">
                Activer les inscriptions (RSVP)
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux adhérents de se déclarer présents, absents ou à confirmer aux événements.
              </span>
            </div>
          </div>

          {/* Imposition Instrument */}
          {agendaEnableInscriptions && (
            <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
              <input 
                type="checkbox"
                id="agendaRequireInstrument"
                checked={agendaRequireInstrument}
                onChange={(e) => handleChange('agendaRequireInstrument', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex flex-col text-left">
                <label htmlFor="agendaRequireInstrument" className="font-bold text-encre-noire cursor-pointer">
                  Imposer le choix de l'instrument lors de l'inscription
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Force les adhérents à spécifier l'instrument qu'ils joueront, même s'ils n'en ont qu'un seul dans leur profil.
                </span>
              </div>
            </div>
          )}

          {/* Statut À Confirmer */}
          {agendaEnableInscriptions && (
            <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
              <input 
                type="checkbox"
                id="agendaEnableMaybeStatus"
                checked={agendaEnableMaybeStatus}
                onChange={(e) => handleChange('agendaEnableMaybeStatus', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex flex-col text-left">
                <label htmlFor="agendaEnableMaybeStatus" className="font-bold text-encre-noire cursor-pointer">
                  Activer l'option "À confirmer" pour les réponses
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Permet aux membres de répondre "À confirmer" aux événements plutôt que de choisir uniquement entre "Présent" ou "Absent".
                </span>
              </div>
            </div>
          )}

          {/* Plan de scène */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableStageLayout"
              checked={agendaEnableStageLayout}
              onChange={(e) => handleChange('agendaEnableStageLayout', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableStageLayout" className="font-bold text-encre-noire cursor-pointer">
                Activer le module de Plan de Scène
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Affiche la grille de placement scénique interactif sur la fiche détaillée des événements.
              </span>
            </div>
          </div>

          {/* Programme de révision */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableRevisionProgram"
              checked={agendaEnableRevisionProgram}
              onChange={(e) => handleChange('agendaEnableRevisionProgram', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableRevisionProgram" className="font-bold text-encre-noire cursor-pointer">
                Activer le module Programme de Révision (Séquenceur JSON)
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet d'ajouter des morceaux de musique et des séquences rythmiques JSON à travailler sur les événements.
              </span>
            </div>
          </div>

          {/* Covoiturage & Convoi */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableCarpool"
              checked={agendaEnableCarpool}
              onChange={(e) => handleChange('agendaEnableCarpool', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableCarpool" className="font-bold text-encre-noire cursor-pointer">
                Activer le module Covoiturage & Convoi
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux conducteurs de proposer des trajets et d'organiser les départs collectifs aux événements.
              </span>
            </div>
          </div>

          {/* Bilan financier */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableFinance"
              checked={agendaEnableFinance}
              onChange={(e) => handleChange('agendaEnableFinance', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableFinance" className="font-bold text-encre-noire cursor-pointer">
                Activer le Bilan Financier des événements
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux administrateurs de renseigner les recettes et dépenses générées par chaque événement.
              </span>
            </div>
          </div>

          {/* Créneaux de bénévolat */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableVolunteerShifts"
              checked={agendaEnableVolunteerShifts}
              onChange={(e) => handleChange('agendaEnableVolunteerShifts', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableVolunteerShifts" className="font-bold text-encre-noire cursor-pointer">
                Activer les Créneaux de Bénévolat / Logistique
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet d'ajouter des tâches et horaires (ex: montage, buvette) à réaliser par les adhérents sur les événements.
              </span>
            </div>
          </div>

        </div>
      </CordelCard>

      {/* Types d'événements dynamiques */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          📋 Catégories et Types d'Événements
        </h3>
        
        {/* Ajouter un type */}
        <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Ajouter un type d'événement</span>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Ex: ca, forum des assos, festival..."
              disabled={saving}
              className="theme-input text-xs font-bold py-1.5 flex-1 bg-cordel-bg-light"
            />
            <CordelButton 
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleAddType}
              disabled={saving || !newType.trim()}
              className="text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
            >
              + Ajouter
            </CordelButton>
          </div>
        </div>

        {/* Liste des types et configuration */}
        <div className="flex flex-col gap-3 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
            Types actifs et Configuration des modules
          </span>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
            {eventTypes.map((type) => {
              const rawConfig = (formData.eventTypeConfigs && formData.eventTypeConfigs[type]) || {};
              const config = {
                agendaRequireInstrument: rawConfig.agendaRequireInstrument || false,
                agendaEnableMaybeStatus: rawConfig.agendaEnableMaybeStatus !== false,
                agendaEnableStageLayout: rawConfig.agendaEnableStageLayout !== false,
                agendaEnableRevisionProgram: rawConfig.agendaEnableRevisionProgram !== false,
                agendaEnableCarpool: rawConfig.agendaEnableCarpool !== false,
                agendaEnableFinance: rawConfig.agendaEnableFinance !== false,
                agendaEnableInscriptions: rawConfig.agendaEnableInscriptions !== false,
                agendaEnableImage: rawConfig.agendaEnableImage !== false,
                agendaEnableOrdreDuJour: rawConfig.agendaEnableOrdreDuJour !== undefined ? rawConfig.agendaEnableOrdreDuJour : type === 'reunion',
                agendaEnableAdresse: rawConfig.agendaEnableAdresse !== false,
                agendaEnableUrl: rawConfig.agendaEnableUrl !== false,
                agendaEnableVolunteerShifts: rawConfig.agendaEnableVolunteerShifts !== undefined ? rawConfig.agendaEnableVolunteerShifts : (type === 'prestation' || type === 'stage')
              };

              const handleToggleOption = (optionKey, isChecked) => {
                const currentConfigs = formData.eventTypeConfigs || {};
                const updatedTypeConfig = {
                  ...config,
                  [optionKey]: isChecked
                };
                handleChange('eventTypeConfigs', {
                  ...currentConfigs,
                  [type]: updatedTypeConfig
                });
              };

              return (
                <div key={type} className="p-3 border border-dashed border-cordel-master-dark/15 rounded bg-cordel-bg-light/35 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/10 pb-1.5">
                    <span className="text-xs font-extrabold capitalize text-cordel-wood flex items-center gap-1.5 select-none">
                      🏷️ {type}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveType(type)}
                      className="text-[8px] hover:text-red-700 font-extrabold text-red-600 bg-red-500/10 px-2 py-0.5 border border-dashed border-red-300 rounded cursor-pointer select-none"
                      title="Supprimer ce type"
                    >
                      ✕ Supprimer
                    </button>
                  </div>
                  
                  {/* Checkboxes grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 text-[10px] font-semibold text-encre-noire">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableInscriptions}
                        onChange={(e) => handleToggleOption('agendaEnableInscriptions', e.target.checked)}
                        className="scale-95"
                      />
                      Inscriptions (RSVP)
                    </label>
                    
                    {config.agendaEnableInscriptions && (
                      <>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none pl-3 border-l border-dashed border-cordel-master-dark/15">
                          <input 
                            type="checkbox" 
                            checked={config.agendaRequireInstrument}
                            onChange={(e) => handleToggleOption('agendaRequireInstrument', e.target.checked)}
                            className="scale-95"
                          />
                          Imposer instrument
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none pl-3 border-l border-dashed border-cordel-master-dark/15">
                          <input 
                            type="checkbox" 
                            checked={config.agendaEnableMaybeStatus}
                            onChange={(e) => handleToggleOption('agendaEnableMaybeStatus', e.target.checked)}
                            className="scale-95"
                          />
                          Statut "À confirmer"
                        </label>
                      </>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableStageLayout}
                        onChange={(e) => handleToggleOption('agendaEnableStageLayout', e.target.checked)}
                        className="scale-95"
                      />
                      Plan de scène
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableRevisionProgram}
                        onChange={(e) => handleToggleOption('agendaEnableRevisionProgram', e.target.checked)}
                        className="scale-95"
                      />
                      Programme révision
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableCarpool}
                        onChange={(e) => handleToggleOption('agendaEnableCarpool', e.target.checked)}
                        className="scale-95"
                      />
                      Covoiturage
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableFinance}
                        onChange={(e) => handleToggleOption('agendaEnableFinance', e.target.checked)}
                        className="scale-95"
                      />
                      Bilan Financier
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableImage}
                        onChange={(e) => handleToggleOption('agendaEnableImage', e.target.checked)}
                        className="scale-95"
                      />
                      Image / Affiche
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableOrdreDuJour}
                        onChange={(e) => handleToggleOption('agendaEnableOrdreDuJour', e.target.checked)}
                        className="scale-95"
                      />
                      Ordre du jour (Doc)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableAdresse}
                        onChange={(e) => handleToggleOption('agendaEnableAdresse', e.target.checked)}
                        className="scale-95"
                      />
                      Lieu / Adresse
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableUrl}
                        onChange={(e) => handleToggleOption('agendaEnableUrl', e.target.checked)}
                        className="scale-95"
                      />
                      Lien externe / URL
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.agendaEnableVolunteerShifts}
                        onChange={(e) => handleToggleOption('agendaEnableVolunteerShifts', e.target.checked)}
                        className="scale-95"
                      />
                      Créneaux Bénévolat
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CordelCard>

    </div>
  );
}
