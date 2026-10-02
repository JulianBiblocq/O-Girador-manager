import React from 'react';
import CordelButton from '../CordelButton';
import CordelCard from '../CordelCard';
import NewsletterStepper from './newsletter/NewsletterStepper';
import Step1MessageAccueil from './newsletter/Step1MessageAccueil';
import Step2ProchainesDates from './newsletter/Step2ProchainesDates';
import Step3RetourImages from './newsletter/Step3RetourImages';
import Step4Recapitulatif from './newsletter/Step4Recapitulatif';
import { useNewsletterData } from '../../hooks/useNewsletterData';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
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
  
  const { formData: settingsData } = useAssociationSettings(groupId, false, null, t);

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
            <span className="text-[var(--color-cordel-vert)] dark:text-emerald-400">Export Newsletter</span>
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
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)] text-[var(--theme-primary)] dark:text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Encart informatif : Statut du service d'envoi (Lecture seule) */}
      {(() => {
        const isBrevoConfigured = Boolean(settingsData?.brevoApiKey?.trim());
        const expediteurEmail = settingsData?.emailOfficiel || settingsData?.emailExpediteur || settingsData?.emailContact || settingsData?.email || "Non configuré";
        
        return (
          <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 mb-2 bg-[#fdfaf2] dark:bg-[#201d1a] border border-dashed border-cordel-master-dark/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✉️</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                      Service d'envoi & Expéditeur
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      isBrevoConfigured 
                        ? 'bg-emerald-50 text-[var(--color-cordel-vert)] border-emerald-300' 
                        : 'bg-amber-50 text-[var(--color-cordel-ocre)] border-amber-300'
                    }`}>
                      {isBrevoConfigured ? "✓ Service d'envoi configuré" : "⚠️ Clé API non renseignée"}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-stone-600 dark:text-stone-400 font-semibold mt-0.5">
                    Expéditeur officiel : <strong className="text-encre-noire dark:text-white font-bold">{expediteurEmail}</strong>
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 italic max-w-xs leading-tight sm:text-right">
                La configuration technique (clé Brevo & domaine expéditeur) est centralisée dans <strong>Configuration › Communication</strong>.
              </p>
            </div>
          </CordelCard>
        );
      })()}

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
