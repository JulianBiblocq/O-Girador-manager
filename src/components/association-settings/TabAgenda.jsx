import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { useTranslation } from '../LanguageContext';
import EventTypeConfigCard from './EventTypeConfigCard';
import TabLieux from './TabLieux';

export default function TabAgenda({
  formData = {},
  handleChange,
  saving,
  groupId,
  t: propT
}) {
  const { t: contextT } = useTranslation();
  const t = propT || contextT;
  const { confirm } = useConfirm();
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'lieux' | 'types'
  const [isGlobalOptionsOpen, setIsGlobalOptionsOpen] = useState(false);

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
      alert(t('settings.agenda.tabAgenda.ceTypeDEvenementExiste'));
      return;
    }

    const isPresta = ['prestation', 'concert', 'spectacle', 'festival', 'parade', 'deambulation', 'déambulation', 'cortège', 'cortejo', 'carnaval', 'rue'].some(k => cleanType.includes(k));
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
      isPublic: isPresta,
      hasCommissionsByDefault: isPresta || isStage
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
      alert(t('settings.agenda.tabAgenda.vousDevezConserverAuMoins'));
      return;
    }
    const confirmMsg = t('widgetAgenda.confirmRemoveType') || `Voulez-vous vraiment supprimer le type "${typeToRemove}" ? Les événements existants de ce type ne seront pas supprimés mais ne seront plus typés dans les filtres.`;
    const isOk = await confirm({
      title: t('settings.agenda.tabAgenda.supprimerLeTypeDEvenement'),
      message: confirmMsg,
      confirmText: t('common.yesDelete') || "Oui, supprimer",
      cancelText: t('common.cancel') || "Annuler",
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
          {t('settings.agenda.tabAgenda.vueDEnsembleTout')}
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
          {t('settings.agenda.tabAgenda.sallesLieuxHabituels')}
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
          {t('settings.agenda.tabAgenda.typesDEvenementsPresets')}
        </button>
      </div>

      {/* SECTION 1 : Salles & Lieux Habituels */}
      {(activeSection === 'all' || activeSection === 'lieux') && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <span className="text-base">📍</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.agenda.tabAgenda.1RepertoireDesSallesReperes')}
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
              {t('settings.agenda.tabAgenda.2TypesDEvenementsPresets')}
            </h2>
          </div>
      
          {/* Types d'événements dynamiques et configuration modulaire */}
          <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
              {t('settings.agenda.tabAgenda.categoriesEtTypesDEvenements')}
            </h3>
            
            {/* Ajouter un type */}
            <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">{t('settings.agenda.tabAgenda.ajouterUnTypeDEvenement')}</span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder={t('settings.agenda.tabAgenda.exCaForumDesAssos')}
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
                  {t('settings.agenda.tabAgenda.ajouter')}
                </CordelButton>
              </div>
            </div>

            {/* Liste des types configurables sous forme de Cartes Accordéons Cordel */}
            <div className="flex flex-col gap-3 mt-3 text-left">
              <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                  {t('settings.agenda.tabAgenda.typesActifsPresetsParFormat')}
                </span>
                <span className="text-[9px] text-stone-500 font-semibold">
                  {t('settings.agenda.tabAgenda.depliezUnTypePourConfigurer')}
                </span>
              </div>

              {/* Conteneur fluide en h-auto overflow-visible sans hauteur fixe coupante */}
              <div className="flex flex-col gap-3 h-auto overflow-visible">
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

          {/* Options Générales de l'Agenda (Accordéon repliable, fermé par défaut) */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
            <div
              onClick={() => setIsGlobalOptionsOpen(prev => !prev)}
              className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsGlobalOptionsOpen(prev => !prev);
                }
              }}
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-sm">⚙️</span>
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                  {t('settings.agenda.tabAgenda.optionsGeneralesDeLAgenda')} {isGlobalOptionsOpen ? '▲' : '▾'}
                </span>
                <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden md:inline">
                  {t('settings.agenda.tabAgenda.modulesTransversauxActivesPourL')}
                </span>
              </div>

              <button
                type="button"
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
              >
                {isGlobalOptionsOpen ? t('settings.agenda.tabAgenda.fermer') : t('settings.agenda.tabAgenda.deplierLesOptions')}
              </button>
            </div>

            {isGlobalOptionsOpen && (
              <div className="p-4 border-t border-dashed border-cordel-master-dark/20 animate-fade-in bg-white/40">
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
                        {t('settings.agenda.tabAgenda.activerLesInscriptionsRsvp')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.permetAuxAdherentsDeSe')}
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
                          {t('settings.agenda.tabAgenda.imposerLeChoixDeL')}
                        </label>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {t('settings.agenda.tabAgenda.forceLesAdherentsASpecifier')}
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
                          {t('settings.agenda.tabAgenda.activerLOptionAConfirmer')}
                        </label>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {t('settings.agenda.tabAgenda.permetAuxMembresDeRepondre')}
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
                        {t('settings.agenda.tabAgenda.activerLeModuleDePlan')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.afficheLaGrilleDePlacement')}
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
                        {t('settings.agenda.tabAgenda.activerLeModuleProgrammeDe')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.permetDAjouterDesMorceaux')}
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
                        {t('settings.agenda.tabAgenda.activerLeModuleCovoiturageConvoi')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.permetAuxConducteursDeProposer')}
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
                        {t('settings.agenda.tabAgenda.activerLeBilanFinancierDes')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.permetAuxAdministrateursDeRenseigner')}
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
                        {t('settings.agenda.tabAgenda.activerLesCreneauxDeBenevolat')}
                      </label>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {t('settings.agenda.tabAgenda.permetDAjouterDesTaches')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CordelCard>

      {/* Notifications des Commentaires Événements */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-2 flex items-center gap-1.5">
          {t('settings.agenda.tabAgenda.notificationsDesCommentairesQuestionsLogistiques')}
        </h3>
        <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mb-3">
          {t('settings.agenda.tabAgenda.lorsquUnMembrePoseUne')}
        </p>

        <div className="flex flex-col gap-1.5 text-left max-w-md">
          <label htmlFor="tagNotificationCommentairesEvenement" className="text-[9px] uppercase font-bold text-cordel-master-dark">
            {t('settings.agenda.tabAgenda.etiquetteTagDestinataireDesNotifications')}
          </label>
          <select
            id="tagNotificationCommentairesEvenement"
            name="tagNotificationCommentairesEvenement"
            value={formData.tagNotificationCommentairesEvenement || ''}
            onChange={(e) => handleChange('tagNotificationCommentairesEvenement', e.target.value)}
            disabled={saving}
            className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
          >
            <option value="">{t('settings.agenda.tabAgenda.aucuneEtiquetteSpecifiqueCreateurEt')}</option>
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

    </div>
  );
}

