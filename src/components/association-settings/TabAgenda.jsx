import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import EventTypeConfigCard from './EventTypeConfigCard';
import TabLieux from './TabLieux';
import TabAutomations from './TabAutomations';

export default function TabAgenda({
  formData = {},
  handleChange,
  saving,
  groupId,
  t
}) {
  const { confirm } = useConfirm();
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'lieux' | 'types' | 'relances'
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);

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
  const [expandedType, setExpandedType] = useState(null);

  const handleAddType = () => {
    if (!newType.trim()) return;
    const cleanType = newType.trim().toLowerCase();
    if (eventTypes.includes(cleanType)) {
      alert("Ce type d'événement existe déjà.");
      return;
    }

    const isPresta = ['prestation', 'concert', 'spectacle', 'festival', 'parade'].some(k => cleanType.includes(k));
    const isRepet = cleanType.includes('repetition') || cleanType.includes('répétition');
    const isStage = cleanType.includes('stage');
    const isAtelier = cleanType.includes('atelier');
    const isReunion = cleanType.includes('reunion') || cleanType.includes('réunion');

    const newConfig = {
      enableRoadbook: isPresta || isStage,
      activerRecolteMedias: isPresta,
      enableVideoDrop: isAtelier || isRepet || isStage,
      activerDepotVideo: isAtelier || isRepet || isStage,
      enableStageLayout: isPresta || isStage,
      agendaEnableStageLayout: isPresta || isStage,
      enableRevisionProgram: !isReunion,
      agendaEnableRevisionProgram: !isReunion,
      enableCarpool: !isReunion && !isAtelier,
      agendaEnableCarpool: !isReunion && !isAtelier,
      includesPercussion: !isReunion,
      includesDance: isPresta || isRepet || isStage,
      requiresValidation: false,
      defaultDeadlineHours: '',
      defaultDropUrl: '',
      agendaRequireInstrument: false,
      agendaEnableMaybeStatus: true,
      agendaEnableFinance: true,
      agendaEnableInscriptions: true,
      agendaEnableImage: true,
      agendaEnableOrdreDuJour: isReunion,
      agendaEnableAdresse: true,
      agendaEnableUrl: true,
      agendaEnableVolunteerShifts: isPresta || isStage,
      isPublic: isPresta
    };

    const updatedConfigs = {
      ...(formData.eventTypeConfigs || {}),
      [cleanType]: newConfig
    };

    handleChange('eventTypeConfigs', updatedConfigs);
    handleChange('eventTypes', [...eventTypes, cleanType]);
    setNewType('');
    setExpandedType(cleanType);
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
      if (expandedType === typeToRemove) {
        setExpandedType(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Sélecteur de sous-sections rapide */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'all'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          📜 Vue d'ensemble (Tout)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('lieux')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'lieux'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          📍 Salles & Lieux Habituels
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('types')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'types'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          📅 Types d'Événements & Presets
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSection('relances');
            setIsAutomationsOpen(true);
          }}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'relances'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          ⚡ Relances Automatiques (J-1 / J-2)
        </button>
      </div>

      {/* SECTION 1 : Salles & Lieux Habituels */}
      {(activeSection === 'all' || activeSection === 'lieux') && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <span className="text-base">📍</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              1. Répertoire des Salles, Repères GPS & Lieux Habituels
            </h2>
          </div>
          <TabLieux
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        </div>
      )}

      {/* SECTION 2 : Types d'Événements & Presets */}
      {(activeSection === 'all' || activeSection === 'types') && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 pt-2">
            <span className="text-base">📅</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              2. Types d'Événements, Presets & Options d'Agenda
            </h2>
          </div>
      
          {/* Contrôles On/Off */}
          <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
              ⚙️ Options Globales de l'Agenda
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

        {/* Liste des types configurables sous forme de Cartes Accordéons Cordel */}
        {/* Configuration des presets d'événements : Boîte Photos (QR Code) (activerRecolteMedias), Vidéos, Roadbook, etc. */}
        <div className="flex flex-col gap-3 mt-3 text-left">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
              Types actifs & Presets par format
            </span>
            <span className="text-[9px] text-stone-500 font-semibold">
              Dépliez un type pour configurer ses modules par défaut
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
            {eventTypes.map((type) => {
              const rawConfig = (formData.eventTypeConfigs && formData.eventTypeConfigs[type]) || {};

              const handleChangeTypeConfig = (typeKey, updatedConfig) => {
                const currentConfigs = formData.eventTypeConfigs || {};
                handleChange('eventTypeConfigs', {
                  ...currentConfigs,
                  [typeKey]: updatedConfig
                });
              };

              return (
                <EventTypeConfigCard
                  key={type}
                  type={type}
                  rawConfig={rawConfig}
                  onChangeConfig={handleChangeTypeConfig}
                  onRemoveType={handleRemoveType}
                  saving={saving}
                  isExpanded={expandedType === type}
                  onToggleExpand={() => setExpandedType(prev => prev === type ? null : type)}
                />
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
  )}


      {/* SECTION 3 : Automatisations & Relances de Présence */}
      {(activeSection === 'all' || activeSection === 'relances') && (
        <div className="flex flex-col gap-3 pt-2 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <span className="text-base">⚡</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              3. Automatisations & Relances de Présence (J-1 / J-2)
            </h2>
          </div>

          <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
            <div 
              onClick={() => setIsAutomationsOpen(prev => !prev)}
              className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-sm">⏰</span>
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                  Règles de Relance Automatique de Présence {isAutomationsOpen ? '▲' : '▾'}
                </span>
                <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
                  (Rappels de réponse RSVP ciblés avant la date limite ou l'événement)
                </span>
              </div>

              <button
                type="button"
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
              >
                {isAutomationsOpen ? 'Fermer' : 'Déplier les relances'}
              </button>
            </div>

            {isAutomationsOpen && (
              <div className="p-4 border-t border-dashed border-cordel-master-dark/20 animate-fade-in bg-white/40">
                <TabAutomations
                  groupId={groupId}
                  eventTypes={eventTypes}
                  t={t}
                />
              </div>
            )}
          </CordelCard>
        </div>
      )}

    </div>
  );
}

