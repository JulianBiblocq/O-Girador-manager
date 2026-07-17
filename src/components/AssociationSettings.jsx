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

import { useEffect } from 'react';

export { DEFAULT_FIELDS_CONFIG, DEFAULT_VARAL_CATEGORIES, DEFAULT_INSTRUMENTS } from '../hooks/useAssociationSettings';

export default function AssociationSettings({ groupId, onBack, role, isSystemAdmin, mode, activeTabProp }) {
  const { t } = useTranslation();
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  const {
    formData,
    handleChange,
    logoFile,
    setLogoFile,
    droitImageFile,
    setDroitImageFile,
    aptitudeMedicaleFile,
    setAptitudeMedicaleFile,
    uploadingLogo,
    saving,
    loading,
    handleSaveHelloAssoKey,
    handleSave
  } = useAssociationSettings(groupId, isAuthorized, onBack, t);

  const [activeSettingsTab, setActiveSettingsTab] = useState(activeTabProp || 'identity');

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
    </div>
  );
}
