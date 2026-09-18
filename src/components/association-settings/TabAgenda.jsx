import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';

export default function TabAgenda({
  formData,
  handleChange,
  saving,
  t
}) {
  const { confirm } = useConfirm();
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
      agendaEnableVolunteerShifts: cleanType === 'prestation' || cleanType === 'stage',
      includesPercussion: cleanType !== 'reunion',
      includesDance: cleanType === 'prestation' || cleanType === 'repetition' || cleanType === 'stage',
      enableCarpool: cleanType !== 'reunion' && cleanType !== 'atelier',
      isPublic: cleanType === 'prestation',
      enableVideoDrop: cleanType === 'atelier' || cleanType === 'repetition' || cleanType === 'stage'
    };

    const updatedConfigs = {
      ...(formData.eventTypeConfigs || {}),
      [cleanType]: newConfig
    };

    handleChange('eventTypeConfigs', updatedConfigs);
    handleChange('eventTypes', [...eventTypes, cleanType]);
    setNewType('');
  };

  const handleRemoveType = async (typeToRemove) => {
    const minTypes = 1;
    if (eventTypes.length <= minTypes) {
      alert("Vous devez conserver au moins un type d'événement.");
      return;
    }
    const confirmMsg = t('widgetAgenda.confirmRemoveType') || `Voulez-vous vraiment supprimer le type "${typeToRemove}" ? Les événements existants de ce type ne seront pas supprimés mais ne seront plus typés dans les filtres.`;
    const isOk = await confirm({
      title: "Supprimer le type d'événement",
      message: confirmMsg,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (isOk) {
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

      {/* Automatisation Boîte à Photos & Varal Framaspace par Type d'Événement */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              Boîte à Photos & Varal Framaspace par Type d'Événement
            </h3>
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-800/40">
            Framaspace Cloud
          </span>
        </div>

        <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mb-3.5 text-left">
          Sélectionnez pour quels types d'événements la récolte de clichés (QR Code spectateurs) et l'album Varal doivent être activés par défaut. Dès qu'un événement du type coché est créé, son dossier Framaspace est provisionné automatiquement et relié au Varal Photos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-left">
          {eventTypes.map((type) => {
            const rawConfig = (formData.eventTypeConfigs && formData.eventTypeConfigs[type]) || {};
            const isTargetDefault = ['prestation', 'concert', 'spectacle', 'festival', 'parade'].includes(type.toLowerCase());
            const isRecolteActive = rawConfig.activerRecolteMedias !== undefined 
              ? Boolean(rawConfig.activerRecolteMedias) 
              : isTargetDefault;

            const handleToggleRecolte = (e) => {
              const currentConfigs = formData.eventTypeConfigs || {};
              const currentTypeConfig = currentConfigs[type] || {};
              handleChange('eventTypeConfigs', {
                ...currentConfigs,
                [type]: {
                  ...currentTypeConfig,
                  activerRecolteMedias: e.target.checked
                }
              });
            };

            return (
              <label 
                key={`recolte-type-${type}`}
                className={`flex items-center justify-between p-2.5 rounded-[4px_6px_3px_5px] border-2 cursor-pointer transition-all select-none ${
                  isRecolteActive
                    ? 'bg-amber-50/90 border-amber-900 shadow-[1.5px_1.5px_0px_0px_#181716]'
                    : 'bg-cordel-bg-light/40 border-encre-noire/25 hover:border-encre-noire/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {type === 'prestation' ? '🎭' : type === 'concert' ? '🎶' : type === 'repetition' ? '🥁' : type === 'stage' ? '🥋' : type === 'atelier' ? '🛠️' : '📅'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black capitalize text-encre-noire">
                      {type}
                    </span>
                    <span className="text-[8.5px] font-semibold text-stone-500">
                      {isRecolteActive ? 'QR Code & Framaspace actifs' : 'Récolte désactivée'}
                    </span>
                  </div>
                </div>

                <input 
                  type="checkbox"
                  checked={isRecolteActive}
                  onChange={handleToggleRecolte}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
              </label>
            );
          })}
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
                agendaEnableVolunteerShifts: rawConfig.agendaEnableVolunteerShifts !== undefined ? rawConfig.agendaEnableVolunteerShifts : (type === 'prestation' || type === 'stage'),
                includesPercussion: rawConfig.includesPercussion !== undefined ? rawConfig.includesPercussion : (type !== 'reunion'),
                includesDance: rawConfig.includesDance !== undefined ? rawConfig.includesDance : (type === 'prestation' || type === 'repetition' || type === 'stage'),
                enableCarpool: rawConfig.enableCarpool !== undefined ? rawConfig.enableCarpool : (type !== 'reunion' && type !== 'atelier'),
                isPublic: rawConfig.isPublic !== undefined ? rawConfig.isPublic : (type === 'prestation'),
                activerRecolteMedias: rawConfig.activerRecolteMedias !== undefined ? rawConfig.activerRecolteMedias : ['prestation', 'concert', 'spectacle', 'festival', 'parade'].includes(type.toLowerCase()),
                enableVideoDrop: rawConfig.enableVideoDrop !== undefined ? rawConfig.enableVideoDrop : (type === 'atelier' || type === 'repetition' || type === 'stage')
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

                    {/* Presets Disciplines et Logistique par défaut pour ce Type */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.includesPercussion}
                        onChange={(e) => handleToggleOption('includesPercussion', e.target.checked)}
                        className="scale-95"
                      />
                      🥁 Inclut Percussion
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.includesDance}
                        onChange={(e) => handleToggleOption('includesDance', e.target.checked)}
                        className="scale-95"
                      />
                      💃 Inclut Danse
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.enableCarpool}
                        onChange={(e) => handleToggleOption('enableCarpool', e.target.checked)}
                        className="scale-95"
                      />
                      🚗 Covoiturage actif
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.isPublic}
                        onChange={(e) => handleToggleOption('isPublic', e.target.checked)}
                        className="scale-95"
                      />
                      🌍 Public (Vitrine)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.activerRecolteMedias}
                        onChange={(e) => handleToggleOption('activerRecolteMedias', e.target.checked)}
                        className="scale-95"
                      />
                      📸 Boîte Photos (QR Code)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={config.enableVideoDrop}
                        onChange={(e) => handleToggleOption('enableVideoDrop', e.target.checked)}
                        className="scale-95"
                      />
                      📹 Dépôt de vidéos (Framaspace / Drive)
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CordelCard>

      {/* Notifications des Commentaires Événements */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-2 flex items-center gap-1.5">
          🔔 Notifications des Commentaires & Questions Logistiques
        </h3>
        <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mb-3">
          Lorsqu'un membre pose une question ou publie un commentaire sur un événement, le créateur de l'événement est notifié. Choisissez quelle étiquette (tag) reçoit également ces notifications pour pouvoir y répondre rapidement.
        </p>

        <div className="flex flex-col gap-1.5 text-left max-w-md">
          <label htmlFor="tagNotificationCommentairesEvenement" className="text-[9px] uppercase font-bold text-cordel-master-dark">
            Étiquette (Tag) destinataire des notifications de commentaires
          </label>
          <select
            id="tagNotificationCommentairesEvenement"
            name="tagNotificationCommentairesEvenement"
            value={formData.tagNotificationCommentairesEvenement || ''}
            onChange={(e) => handleChange('tagNotificationCommentairesEvenement', e.target.value)}
            disabled={saving}
            className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
          >
            <option value="">-- Aucune étiquette spécifique (Créateur et Mestre uniquement) --</option>
            {(formData.tagsDisponibles || []).map((tag) => {
              const tagId = typeof tag === 'string' ? tag : (tag.id || tag.nom);
              const tagLabel = typeof tag === 'string' ? tag : (tag.nom || tag.id);
              return (
                <option key={tagId} value={tagId}>
                  🏷️ {tagLabel}
                </option>
              );
            })}
          </select>
        </div>
      </CordelCard>

    </div>
  );
}
