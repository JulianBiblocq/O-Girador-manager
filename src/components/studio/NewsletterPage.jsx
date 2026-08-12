import React, { useState } from 'react';
import CordelButton from '../CordelButton';
import CordelCard from '../CordelCard';
import NewsletterStepper from './newsletter/NewsletterStepper';
import Step1MessageAccueil from './newsletter/Step1MessageAccueil';
import Step2ProchainesDates from './newsletter/Step2ProchainesDates';
import Step3RetourImages from './newsletter/Step3RetourImages';
import Step4Recapitulatif from './newsletter/Step4Recapitulatif';
import { useNewsletterData } from '../../hooks/useNewsletterData';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import BrevoIntegrationBlock from '../association-settings/blocks/BrevoIntegrationBlock';
import { useTranslation } from '../LanguageContext';

/**
 * Composant principal de la page Newsletter dans le Studio (Version SaaS / Neutre).
 * Fournit une interface de création guidée en 4 étapes pour préparer la newsletter
 * et générer le brouillon dans le service d'emailing.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {Function} onBack - Callback pour retourner au menu principal du Studio
 */
export default function NewsletterPage({ groupId, onBack }) {
  const { t } = useTranslation();
  
  const {
    formData: settingsData,
    handleChange: handleSettingsChange,
    handleSave: handleSaveSettings,
    saving: savingSettings
  } = useAssociationSettings(groupId, true, null, t);

  const [showConfig, setShowConfig] = useState(false);

  const {
    currentStep,
    setCurrentStep,
    titreCampagne,
    setTitreCampagne,
    messageAccueil,
    setMessageAccueil,
    upcomingEvents,
    selectedUpcomingIds,
    toggleUpcomingEvent,
    pastEvents,
    selectedPastIds,
    togglePastEvent,
    pastEventBilans,
    setPastBilan,
    availablePhotos,
    selectedPhotos,
    togglePhotoSelection,
    payloadJSON,
    loading,
    error,
    exporting,
    exportResult,
    submitNewsletterExport
  } = useNewsletterData(groupId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin text-4xl select-none">⏳</div>
        <p className="font-semibold text-sm text-stone-600 dark:text-stone-400">
          Chargement du module Newsletter...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête de la page avec fil d'ariane et bouton retour */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span>Studio</span>
            <span>›</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400">Export Newsletter</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>📰</span> Module Newsletter
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Préférez et exportez vos newsletters associatives directement vers votre plateforme emailing.
          </p>
        </div>

        {onBack && (
          <CordelButton
            onClick={onBack}
            className="border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-4 py-2 text-sm font-semibold rounded-[var(--theme-border-radius,6px)] flex items-center gap-2"
          >
            ⬅ Retour au Studio
          </CordelButton>
        )}
      </div>

      {/* Message d'erreur Firestore éventuel */}
      {error && (
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] bg-[#8b2a1a]/15 border border-[#8b2a1a] text-[#8b2a1a] dark:text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Configuration Section (Accordeon) */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-2">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            ⚙️ Configuration Newsletter (API Brevo & Opt-in)
          </h3>
          <span className="text-xs font-black">{showConfig ? '▲ Masquer' : '▼ Déployer'}</span>
        </div>

        {showConfig && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
            <BrevoIntegrationBlock 
              formData={settingsData}
              handleChange={handleSettingsChange}
              saving={savingSettings}
            />
            <div className="flex justify-end mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer Configuration"}
              </CordelButton>
            </div>
          </form>
        )}
      </CordelCard>

      {/* Barre de progression Stepper UI */}
      <NewsletterStepper
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* Rendu dynamique de l'étape active */}
      <main className="w-full">
        {currentStep === 1 && (
          <Step1MessageAccueil
            titreCampagne={titreCampagne}
            setTitreCampagne={setTitreCampagne}
            messageAccueil={messageAccueil}
            setMessageAccueil={setMessageAccueil}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2ProchainesDates
            upcomingEvents={upcomingEvents}
            selectedUpcomingIds={selectedUpcomingIds}
            toggleUpcomingEvent={toggleUpcomingEvent}
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3RetourImages
            pastEvents={pastEvents}
            selectedPastIds={selectedPastIds}
            togglePastEvent={togglePastEvent}
            pastEventBilans={pastEventBilans}
            setPastBilan={setPastBilan}
            availablePhotos={availablePhotos}
            selectedPhotos={selectedPhotos}
            togglePhotoSelection={togglePhotoSelection}
            onPrev={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Recapitulatif
            payloadJSON={payloadJSON}
            onSubmit={submitNewsletterExport}
            exporting={exporting}
            exportResult={exportResult}
            onPrev={() => setCurrentStep(3)}
          />
        )}
      </main>
    </div>
  );
}
