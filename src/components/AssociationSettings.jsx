import React, { useState } from 'react';
import { useAssociationSettings } from '../hooks/useAssociationSettings';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloSettings } from './XiloIcons';

import TabIdentity from './association-settings/TabIdentity';
import TabOrganization from './association-settings/TabOrganization';
import TabSecurity from './association-settings/TabSecurity';
import TabLogistics from './association-settings/TabLogistics';
import TabFinance from './association-settings/TabFinance';
import TabAgenda from './association-settings/TabAgenda';
import TabModules from './association-settings/TabModules';
import TabLieux from './association-settings/TabLieux';
import TabAutomations from './association-settings/TabAutomations';
import TabPublicContent from './association-settings/TabPublicContent';
import TabPublicTheme from './association-settings/TabPublicTheme';
import TabCommunication from './association-settings/TabCommunication';
import { canEditVitrine } from '../utils/permissionUtils';

import { useEffect } from 'react';

export { DEFAULT_FIELDS_CONFIG, DEFAULT_VARAL_CATEGORIES, DEFAULT_INSTRUMENTS } from '../hooks/useAssociationSettings';

export default function AssociationSettings({ 
  groupId, 
  onBack, 
  role, 
  isSystemAdmin, 
  mode, 
  activeTabProp,
  profileData,
  permissionsMatrice,
  effectiveUserTags = []
}) {
  const { t } = useTranslation();
  const hasVitrinePermission = canEditVitrine(
    profileData || { role, isSystemAdmin },
    permissionsMatrice,
    effectiveUserTags
  );
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || (mode === 'public-theme-only' && hasVitrinePermission);

  const {
    formData,
    handleChange,
    logoFile,
    setLogoFile,
    heroImageFile,
    setHeroImageFile,
    dossierProPdfFile,
    setDossierProPdfFile,
    dossierPresentationFile,
    setDossierPresentationFile,
    ficheTechniqueFile,
    setFicheTechniqueFile,
    planSceneFile,
    setPlanSceneFile,
    kitPresseFile,
    setKitPresseFile,
    droitImageFile,
    setDroitImageFile,
    aptitudeMedicaleFile,
    setAptitudeMedicaleFile,
    signaturePresidentFile,
    setSignaturePresidentFile,
    signatureTresorierFile,
    setSignatureTresorierFile,
    uploadingLogo,
    saving,
    loading,
    toastMessage,
    handleSaveHelloAssoKey,
    handleSave
  } = useAssociationSettings(groupId, isAuthorized, onBack, t);

  const [activeSettingsTab, setActiveSettingsTab] = useState(activeTabProp || 'identity');
  const [vitrineSubTab, setVitrineSubTab] = useState('general');

  useEffect(() => {
    if (activeTabProp) {
      setActiveSettingsTab(activeTabProp);
    }
  }, [activeTabProp]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous devez être administrateur pour configurer les paramètres de l'association.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ Retour
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeSettingsTab) {
      case 'identity':
        return (
          <TabIdentity
            formData={formData}
            handleChange={handleChange}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            signaturePresidentFile={signaturePresidentFile}
            setSignaturePresidentFile={setSignaturePresidentFile}
            signatureTresorierFile={signatureTresorierFile}
            setSignatureTresorierFile={setSignatureTresorierFile}
            uploadingLogo={uploadingLogo}
            groupId={groupId}
            saving={saving}
            t={t}
          />
        );
      case 'organisation':
        return (
          <TabOrganization
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
            mode={mode}
          />
        );
      case 'security':
        return (
          <TabSecurity
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        );
      case 'logistics':
        return (
          <TabLogistics
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        );
      case 'finance':
        return (
          <TabFinance
            formData={formData}
            handleChange={handleChange}
            droitImageFile={droitImageFile}
            setDroitImageFile={setDroitImageFile}
            aptitudeMedicaleFile={aptitudeMedicaleFile}
            setAptitudeMedicaleFile={setAptitudeMedicaleFile}
            saving={saving}
            groupId={groupId}
            handleSaveHelloAssoKey={handleSaveHelloAssoKey}
            t={t}
            mode={mode}
          />
        );
      case 'agenda':
        return (
          <TabAgenda
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        );
      case 'modules':
        return (
          <TabModules
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        );
      case 'lieux':
        return (
          <TabLieux
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        );
      case 'automatisations':
        return (
          <TabAutomations
            groupId={groupId}
            eventTypes={formData.eventTypes || ['prestation', 'repetition', 'stage', 'atelier', 'reunion']}
            t={t}
          />
        );
      case 'public-theme':
        return vitrineSubTab === 'apparence' ? (
          <TabPublicTheme
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        ) : (
          <TabPublicContent
            formData={formData}
            handleChange={handleChange}
            heroImageFile={heroImageFile}
            setHeroImageFile={setHeroImageFile}
            dossierProPdfFile={dossierProPdfFile}
            setDossierProPdfFile={setDossierProPdfFile}
            dossierPresentationFile={dossierPresentationFile}
            setDossierPresentationFile={setDossierPresentationFile}
            ficheTechniqueFile={ficheTechniqueFile}
            setFicheTechniqueFile={setFicheTechniqueFile}
            planSceneFile={planSceneFile}
            setPlanSceneFile={setPlanSceneFile}
            kitPresseFile={kitPresseFile}
            setKitPresseFile={setKitPresseFile}
            groupId={groupId}
            saving={saving}
            t={t}
            contentSubTab={vitrineSubTab}
          />
        );
      case 'communication':
        return (
          <TabCommunication
            formData={formData}
            handleChange={handleChange}
            groupId={groupId}
            saving={saving}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none max-w-3xl mx-auto w-full">
      {/* Header */}
      {!mode && (
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center select-none"
          >
            ⬅️ Retour
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center">
            <XiloSettings size={14} className="inline mr-1.5" /> {t('associationSettings.title') || "Paramètres Association"}
          </h2>
        </div>
      )}

      {/* Info card */}
      {!mode && (
        <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          🔧 Personnalisez l'identité visuelle de votre association et configurez les champs requis pour le profil de vos adhérents.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Menu Horizontal Pôle Vitrine (Alignement à gauche conforme au reste de l'application) */}
          {(mode === 'public-theme-only' || activeSettingsTab === 'public-theme') && (
            <div className="flex flex-wrap items-center justify-start gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none">
              <button
                type="button"
                onClick={() => setVitrineSubTab('general')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'general'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Général & SEO
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('presentation')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'presentation'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Présentation
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('organisateur')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'organisateur'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Organisateur et technique
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('galerie')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'galerie'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Galerie photo
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('recrutement')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'recrutement'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Recrutement & Vie associative
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('reseaux')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'reseaux'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Réseau et newsletter
              </button>

              <button
                type="button"
                onClick={() => setVitrineSubTab('apparence')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  vitrineSubTab === 'apparence'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                Apparence
              </button>
            </div>
          )}

          {/* Tab Selector */}
          {!mode && (
            <div className="flex flex-wrap gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('identity')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'identity'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🎨 Identité & Liens
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('communication')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'communication'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                📢 Communication & Newsletter
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('organisation')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'organisation'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                👥 Organisation & Profil
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('security')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'security'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🛡️ Sécurité & Droits
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('logistics')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'logistics'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🚗 Logistique & Covoit
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('finance')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'finance'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🪙 Cotisations & Docs
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('agenda')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'agenda'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                📅 Gestion de l'Agenda
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('modules')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'modules'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🧩 Modules & Fonctionnalités
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('lieux')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'lieux'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                📍 Lieux & Salles
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('automatisations')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'automatisations'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🤖 Automatisations & Relances
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('public-theme')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                  activeSettingsTab === 'public-theme'
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                }`}
              >
                🎨 Identité Visuelle (Vitrine)
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {renderActiveTab()}

            {/* Spacer to prevent content from being hidden behind the fixed footer */}
            <div className="h-24"></div>

            {/* Validation */}
            <div className="fixed bottom-0 left-0 lg:left-60 right-0 z-50 bg-[var(--cordel-bg)] py-4 border-t-2 border-encre-noire shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-center">
              <div className="max-w-3xl w-full px-5 sm:px-6 md:px-8">
                <CordelButton
                  variant="ocre"
                  useExtremeBorder={true}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 font-bold uppercase tracking-widest text-xs"
                >
                  {saving ? "Enregistrement..." : "Enregistrer la configuration"}
                </CordelButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast de confirmation de sauvegarde sans redirection */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#181716] border-2 border-encre-noire flex items-center gap-2.5 select-none animate-fade-in">
          <span className="text-base">✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
