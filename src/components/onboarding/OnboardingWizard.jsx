import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

import WizardProgressBar from './wizard/WizardProgressBar';
import WizardStepIdentity from './wizard/WizardStepIdentity';
import WizardStepMusic from './wizard/WizardStepMusic';
import WizardStepFinance from './wizard/WizardStepFinance';
import WizardStepTeamInvite from './wizard/WizardStepTeamInvite';

/**
 * Assistant de Premier Démarrage (Wizard Onboarding Mestre/Bureau).
 * Présente une modale visuelle pas-à-pas en 4 étapes pour configurer le groupe en moins de 3 minutes.
 */
export default function OnboardingWizard({
  isOpen,
  onClose,
  groupId,
  associationSettings = {},
  onCompleteSuccess
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  // État local du formulaire d'onboarding initialisé à partir des réglages actuels
  const [wizardData, setWizardData] = useState({
    nom: associationSettings.nom || '',
    branding: associationSettings.branding || {
      logoUrl: '',
      colors: { primary: '#d99f4d', secondary: '#84967a', background: '#f4ecd8', text: '#1a1a1a' }
    },
    instrumentsDisponibles: associationSettings.instrumentsDisponibles || [
      "Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"
    ],
    majoriteFeminine: Boolean(associationSettings.majoriteFeminine),
    montantAdhesion: associationSettings.montantAdhesion !== undefined ? associationSettings.montantAdhesion : 10,
    optionsCotisation: associationSettings.optionsCotisation || [
      { id: 'cotis_defaut_1', nom: 'Percussion & Troupe', tarif: 135, description: 'Ateliers hebdomadaires et répétitions.' }
    ],
    invitedBureauEmails: []
  });

  // Re-synchronisation lors de l'ouverture
  useEffect(() => {
    if (isOpen && associationSettings) {
      setWizardData({
        nom: associationSettings.nom || '',
        branding: associationSettings.branding || {
          logoUrl: '',
          colors: { primary: '#d99f4d', secondary: '#84967a', background: '#f4ecd8', text: '#1a1a1a' }
        },
        instrumentsDisponibles: associationSettings.instrumentsDisponibles || [
          "Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"
        ],
        majoriteFeminine: Boolean(associationSettings.majoriteFeminine),
        montantAdhesion: associationSettings.montantAdhesion !== undefined ? associationSettings.montantAdhesion : 10,
        optionsCotisation: associationSettings.optionsCotisation || [
          { id: 'cotis_defaut_1', nom: 'Percussion & Troupe', tarif: 135, description: 'Ateliers hebdomadaires et répétitions.' }
        ],
        invitedBureauEmails: []
      });
      setCurrentStep(1);
    }
  }, [isOpen, associationSettings]);

  if (!isOpen) return null;

  const stepTitles = [
    { num: 1, label: 'Identité' },
    { num: 2, label: 'Musique' },
    { num: 3, label: 'Cotisations' },
    { num: 4, label: 'Bureau' }
  ];

  // Mise à jour simplifiée des sous-champs
  const updateWizardData = (key, value) => {
    setWizardData(prev => {
      if (key.includes('.')) {
        const parts = key.split('.');
        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return updated;
      }
      return { ...prev, [key]: value };
    });
  };

  // Enregistrement final des données et passage de onboardingCompleted à true
  const handleFinalSave = async (isSkipped = false) => {
    if (!groupId) return;
    setSaving(true);

    try {
      let finalLogoUrl = wizardData.branding?.logoUrl || '';

      // Upload et compression du logo si sélectionné
      if (logoFile && logoFile instanceof File) {
        let fileToUpload = logoFile;
        try {
          fileToUpload = await imageCompression(logoFile, { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true });
        } catch (compErr) {
          console.warn("Erreur compression logo wizard :", compErr);
        }

        const logoRef = storageRef(storage, `associations/${groupId}/logo_${Date.now()}`);
        const snapshot = await uploadBytes(logoRef, fileToUpload, { contentType: fileToUpload.type || 'image/png' });
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        nom: wizardData.nom || associationSettings.nom || 'Samambaia Maracatu',
        branding: {
          logoUrl: finalLogoUrl,
          colors: wizardData.branding?.colors || { primary: '#d99f4d', secondary: '#84967a', background: '#f4ecd8', text: '#1a1a1a' }
        },
        instrumentsDisponibles: wizardData.instrumentsDisponibles,
        majoriteFeminine: wizardData.majoriteFeminine,
        montantAdhesion: wizardData.montantAdhesion,
        montantCotisation: wizardData.montantAdhesion,
        optionsCotisation: wizardData.optionsCotisation,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      }, { merge: true });

      if (onCompleteSuccess) {
        onCompleteSuccess(isSkipped);
      }
      onClose();
    } catch (err) {
      console.error("OnboardingWizard - Erreur d'enregistrement :", err);
      alert("Erreur lors de la sauvegarde du premier démarrage : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Navigation entre les étapes
  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalSave(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl border-3 border-cordel-master-dark overflow-hidden text-left">
        
        {/* Header Modale */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-stone-300 flex items-center justify-between bg-[var(--cordel-bg,#f4ecd8)]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-cordel-wood">
                Assistant de Premier Démarrage
              </h2>
              <p className="text-[10px] text-stone-600 font-bold">
                Espace Association — Configuration guidée (Moins de 3 min)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFinalSave(true)}
            disabled={saving}
            className="text-stone-500 hover:text-stone-900 font-bold text-xs underline cursor-pointer"
            title="Ignorer pour le moment"
          >
            Ignorer
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-stone-50 border-b border-stone-200">
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={4}
            stepTitles={stepTitles}
          />
        </div>

        {/* Corps défilable de l'étape active */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {currentStep === 1 && (
            <WizardStepIdentity
              wizardData={wizardData}
              updateWizardData={updateWizardData}
              logoFile={logoFile}
              setLogoFile={setLogoFile}
            />
          )}

          {currentStep === 2 && (
            <WizardStepMusic
              wizardData={wizardData}
              updateWizardData={updateWizardData}
            />
          )}

          {currentStep === 3 && (
            <WizardStepFinance
              wizardData={wizardData}
              updateWizardData={updateWizardData}
            />
          )}

          {currentStep === 4 && (
            <WizardStepTeamInvite
              wizardData={wizardData}
              updateWizardData={updateWizardData}
              groupId={groupId}
            />
          )}
        </div>

        {/* Footer avec actions Précédent / Suivant / Valider */}
        <div className="flex-shrink-0 p-4 border-t border-dashed border-stone-300 flex items-center justify-between bg-stone-50">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || saving}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
              currentStep === 1
                ? 'opacity-40 border-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-800'
            }`}
          >
            ⬅️ Précédent
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinalSave(true)}
              disabled={saving}
              className="text-[11px] font-bold text-stone-500 hover:text-stone-800 underline px-2 cursor-pointer"
            >
              Passer l'assistant
            </button>

            <CordelButton
              type="button"
              variant="vert"
              disabled={saving}
              onClick={handleNextStep}
              className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <span>
                {saving 
                  ? '⏳ Enregistrement...' 
                  : (currentStep === 4 ? '🎉 Valider et Terminer' : 'Suivant ➡️')}
              </span>
            </CordelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
