import React, { useState, useEffect } from 'react';
import { useAssociationSettings } from '../hooks/useAssociationSettings';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloSettings } from './XiloIcons';

import TabIdentity from './association-settings/TabIdentity';
import TabOrganization from './association-settings/TabOrganization';
import TabSecurity from './association-settings/TabSecurity';
import TabConfigComms from './association-settings/TabConfigComms';
import TabModules from './association-settings/TabModules';
import TabAgenda from './association-settings/TabAgenda';
import TabPublicContent from './association-settings/TabPublicContent';
import TabPublicTheme from './association-settings/TabPublicTheme';
import AssociationSettingsTabRibbon from './association-settings/AssociationSettingsTabRibbon';
import { canEditVitrine } from '../utils/permissionUtils';

export { DEFAULT_FIELDS_CONFIG, DEFAULT_VARAL_CATEGORIES, DEFAULT_INSTRUMENTS } from '../hooks/useAssociationSettings';

/**
 * Composant principal des paramètres de Configuration et de la Vitrine publique.
 * Occupe 100 % de la largeur de travail sur Desktop.
 */
export default function AssociationSettings({
  groupId,
  associationData,
  onBack,
  role,
  isSystemAdmin,
  mode,
  activeTabProp,
  vitrineSubTabProp,
  profileData,
  permissionsMatrice,
  effectiveUserTags = [],
  onReopenOnboarding,
  onNavigateToView
}) {
  const { t } = useTranslation();
  const hasVitrinePermission = canEditVitrine(
    profileData || { role, isSystemAdmin },
    permissionsMatrice,
    effectiveUserTags
  );
  const isAuthorized = role === 'mestre' || role === 'super-admin' || role === 'admin' || role === 'bureau' || isSystemAdmin === true || (mode === 'public-theme-only' && hasVitrinePermission);

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
    droitImageFile: _droitImageFile,
    setDroitImageFile: _setDroitImageFile,
    aptitudeMedicaleFile: _aptitudeMedicaleFile,
    setAptitudeMedicaleFile: _setAptitudeMedicaleFile,
    signaturePresidentFile,
    setSignaturePresidentFile,
    signatureTresorierFile,
    setSignatureTresorierFile,
    uploadingLogo,
    saving,
    loading,
    toastMessage,
    handleSaveHelloAssoKey: _handleSaveHelloAssoKey,
    handleSave,
    handleSyncCombinedSeal
  } = useAssociationSettings(groupId, isAuthorized, onBack, t, associationData);

  const [activeSettingsTab, setActiveSettingsTab] = useState(activeTabProp || 'identity');
  const [vitrineSubTab, setVitrineSubTab] = useState('general');

  useEffect(() => {
    if (activeTabProp) {
      setActiveSettingsTab(activeTabProp);
    }
  }, [activeTabProp]);

  useEffect(() => {
    if (vitrineSubTabProp) {
      setVitrineSubTab(vitrineSubTabProp);
    }
  }, [vitrineSubTabProp]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">{t('settings.general.associationSettings.accesRefuse')}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {t('settings.general.associationSettings.vousDevezEtreAdministrateurPour')}
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              {t('settings.general.associationSettings.retour')}
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
            signaturePresidentFile={signaturePresidentFile}
            setSignaturePresidentFile={setSignaturePresidentFile}
            signatureTresorierFile={signatureTresorierFile}
            setSignatureTresorierFile={setSignatureTresorierFile}
            groupId={groupId}
            saving={saving}
            t={t}
            onReopenOnboarding={onReopenOnboarding}
            onSyncCombinedSeal={handleSyncCombinedSeal}
          />
        );

      case 'organisation':
      case 'profile':
        return (
          <TabOrganization
            formData={formData}
            associationData={associationData || formData}
            handleChange={handleChange}
            saving={saving}
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
            groupId={groupId}
            t={t}
          />
        );
      case 'security':
        return (
          <TabSecurity
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
            onNavigateToTagManager={() => onNavigateToView && onNavigateToView('tag-manager')}
          />
        );
      case 'comms':
        return (
          <TabConfigComms
            formData={formData}
            handleChange={handleChange}
            groupId={groupId}
            saving={saving}
            t={t}
          />
        );
      case 'modules':
        return (
          <TabModules
            formData={formData}
            handleChange={handleChange}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            uploadingLogo={uploadingLogo}
            groupId={groupId}
            saving={saving}
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
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-none min-w-0">
      {/* En-tête */}
      {!mode && (
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-2 min-w-0 w-full">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center select-none shrink-0"
          >
            {t('settings.general.associationSettings.retour')}
          </button>

          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center truncate">
            <XiloSettings size={14} className="inline mr-1.5 shrink-0" /> {t('settings.general.associationSettings.parametresAssociation')}
          </h2>
        </div>
      )}

      {/* Carte d'information */}
      {!mode && (
        <div className="w-full text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          {t('settings.general.associationSettings.personnalisezLIdentiteVisuelleDe')}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {!mode && (
            <AssociationSettingsTabRibbon
              activeSettingsTab={activeSettingsTab}
              setActiveSettingsTab={setActiveSettingsTab}
            />
          )}

          <div className="flex flex-col gap-3 w-full">
            {renderActiveTab()}

            {/* Espacement pour le pied de page fixe */}
            <div className="h-24"></div>

            {/* Barre de validation fixe alignée pleine largeur */}
            <div className="fixed bottom-0 left-0 lg:left-60 right-0 z-50 bg-[var(--cordel-bg)] py-3.5 border-t-2 border-encre-noire shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-center">
              <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
                <CordelButton
                  variant="ocre"
                  useExtremeBorder={true}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 font-bold uppercase tracking-widest text-xs"
                >
                  {saving
                    ? (t('vitrine.admin.savingSettings') || t('common.saving') || "Enregistrement...")
                    : (t('vitrine.admin.saveSettings') || "Enregistrer la configuration")}
                </CordelButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast de confirmation de sauvegarde */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#181716] border-2 border-encre-noire flex items-center gap-2.5 select-none animate-fade-in">
          <span className="text-base">✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
