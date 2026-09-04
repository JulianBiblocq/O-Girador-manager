import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { auth, db, storage } from '../../firebase';
import CordelButton from '../CordelButton';
import WizardProgressBar from './wizard/WizardProgressBar';

export default function HubSetupWizard({ brandingStyle, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const tokenUrl = searchParams.get('token') || '';
  const assocNameUrl = searchParams.get('assoc') || '';
  const emailUrl = searchParams.get('email') || '';

  const [wizardData, setWizardData] = useState({
    token: tokenUrl,
    assocName: assocNameUrl,
    billingEmail: emailUrl,
    useBillingEmail: true,
    personalEmail: '',
    firstName: '',
    lastName: '',
    password: '',
    city: '',
    poles: {
      percussion: true,
      danse: false,
      chant: false
    },
    genre: 'feminin' // 'feminin' ou 'masculin'
  });

  const [logoFile, setLogoFile] = useState(null);

  const stepTitles = [
    { num: 1, label: 'Compte Admin' },
    { num: 2, label: 'Identité Groupe' },
    { num: 3, label: 'Pôles & Genre' }
  ];

  const updateData = (key, value) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  };

  const handlePolesChange = (pole) => {
    setWizardData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        [pole]: !prev.poles[pole]
      }
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!wizardData.firstName || !wizardData.lastName || !wizardData.password) {
        setError("Veuillez remplir tous les champs obligatoires.");
        return;
      }
      const emailToUse = wizardData.useBillingEmail ? wizardData.billingEmail : wizardData.personalEmail;
      if (!emailToUse) {
        setError("Veuillez fournir une adresse e-mail valide.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!wizardData.assocName) {
        setError("Veuillez indiquer le nom de l'association.");
        return;
      }
      if (!wizardData.city) {
        setError("Veuillez indiquer la ville principale.");
        return;
      }
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const generateSlug = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const emailToUse = wizardData.useBillingEmail ? wizardData.billingEmail : wizardData.personalEmail;
      
      // 1. Création du compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, wizardData.password);
      const user = userCredential.user;

      // 2. Génération du groupId
      const baseSlug = generateSlug(wizardData.assocName || 'association');
      const randomShortCode = Math.random().toString(36).substring(2, 6);
      const newGroupId = `${baseSlug}-${randomShortCode}`;

      // 3. Upload du logo (si présent)
      let finalLogoUrl = '';
      if (logoFile) {
        let fileToUpload = logoFile;
        try {
          fileToUpload = await imageCompression(logoFile, { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true });
        } catch (compErr) {
          console.warn("Erreur compression logo :", compErr);
        }
        const logoRef = storageRef(storage, `associations/${newGroupId}/logo_${Date.now()}`);
        const snapshot = await uploadBytes(logoRef, fileToUpload, { contentType: fileToUpload.type || 'image/png' });
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      // 4. Préparation des Pôles, Modules et Pupitres
      let instrumentsDisponibles = [];
      let enabledModules = {
        diffusion: true,
        tresorerie: true,
        logistique: true,
        commandes: true,
        vestiaire: true,
        studioSocial: true,
        reunions: true,
        forum: true,
        mestre: true
      };

      if (wizardData.poles.percussion) {
        instrumentsDisponibles = ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal"];
      }
      
      if (wizardData.poles.danse) {
        instrumentsDisponibles.push("Danse");
      } else {
        // Désactiver le vestiaire si pas de danse
        enabledModules.vestiaire = false;
      }
      
      if (wizardData.poles.chant) {
        instrumentsDisponibles.push("Chant");
      }

      // 5. Création du document Association
      const assocRef = doc(db, 'associations', newGroupId);
      await setDoc(assocRef, {
        nom: wizardData.assocName,
        ville: wizardData.city,
        majoriteFeminine: wizardData.genre === 'feminin',
        branding: {
          logoUrl: finalLogoUrl,
          colors: { primary: '#d99f4d', secondary: '#84967a', background: '#f4ecd8', text: '#1a1a1a' }
        },
        instrumentsDisponibles,
        enabledModules,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        hubToken: wizardData.token,
        createdAt: new Date().toISOString()
      });

      // 6. Création du profil Administrateur (users)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        nom: wizardData.lastName,
        prenom: wizardData.firstName,
        email: emailToUse,
        role: 'super-admin',
        isSystemAdmin: true,
        groupId: newGroupId,
        createdAt: new Date().toISOString(),
        tags: []
      });

      // 7. Marquer le token Hub comme consommé
      if (wizardData.token) {
        try {
          const tokenRef = doc(db, 'hub_tokens', wizardData.token);
          await setDoc(tokenRef, { isUsed: true, usedAt: new Date().toISOString(), groupId: newGroupId }, { merge: true });
        } catch (e) {
          console.warn("Impossible de marquer le token hub comme consommé (peut-être manque de droits ou collection inexistante).", e);
        }
      }

      // 8. Réinitialiser les bannières d'aide contextuelle pour la première visite
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pole_guide_hidden_')) {
          localStorage.removeItem(key);
        }
      });

      // Succès ! Redirection
      if (onComplete) {
        onComplete();
      }

    } catch (err) {
      console.error("Erreur lors de la configuration initiale :", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet e-mail est déjà utilisé par un autre compte.");
      } else {
        setError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      }
      setSaving(false);
    }
  };

  return (
    <div style={brandingStyle} className="min-h-screen bg-[var(--cordel-bg,#f4ecd8)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl border-3 border-cordel-master-dark overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-dashed border-stone-300 bg-[var(--cordel-bg,#f4ecd8)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-lg font-extrabold uppercase tracking-widest text-cordel-wood">
                Configuration Initiale
              </h1>
              <p className="text-xs text-stone-600 font-bold mt-1">
                Bienvenue {wizardData.assocName ? `au groupe ${wizardData.assocName}` : 'sur O Girador'} ! Préparons votre espace en 3 étapes.
              </p>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-stone-50 border-b border-stone-200">
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={3}
            stepTitles={stepTitles}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-100 text-[var(--color-cordel-rouge,#8b2a1a)] text-sm font-bold border-l-4 border-[var(--color-cordel-rouge,#8b2a1a)]">
            {error}
          </div>
        )}

        {/* Body Formulaire */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
          <form id="hub-setup-form" onSubmit={currentStep === 3 ? handleFinalSubmit : handleNextStep}>
            
            {/* ETAPE 1 : Compte Admin */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-l-4 border-[var(--color-cordel-ocre,#c05621)] pl-4">
                  <h3 className="text-sm font-black uppercase text-stone-800">Compte Administrateur Principal</h3>
                  <p className="text-xs text-stone-500 mt-1">Ce compte aura les droits complets sur l'espace de votre association.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Prénom *</label>
                    <input 
                      type="text" 
                      required
                      value={wizardData.firstName}
                      onChange={(e) => updateData('firstName', e.target.value)}
                      className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                      placeholder="Ex: Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nom *</label>
                    <input 
                      type="text" 
                      required
                      value={wizardData.lastName}
                      onChange={(e) => updateData('lastName', e.target.value)}
                      className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                      placeholder="Ex: Dupont"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 accent-[#c05621]"
                      checked={wizardData.useBillingEmail}
                      onChange={(e) => updateData('useBillingEmail', e.target.checked)}
                    />
                    <div>
                      <span className="text-sm font-bold block text-stone-800">Utiliser l'e-mail de facturation</span>
                      <span className="text-xs text-stone-500">{wizardData.billingEmail || 'Aucun e-mail détecté'}</span>
                    </div>
                  </label>
                  
                  {!wizardData.useBillingEmail && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Personnel *</label>
                      <input 
                        type="email" 
                        required={!wizardData.useBillingEmail}
                        value={wizardData.personalEmail}
                        onChange={(e) => updateData('personalEmail', e.target.value)}
                        className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                        placeholder="votre.email@exemple.com"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mot de passe de connexion *</label>
                  <input 
                    type="password" 
                    required
                    minLength="6"
                    value={wizardData.password}
                    onChange={(e) => updateData('password', e.target.value)}
                    className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              </div>
            )}

            {/* ETAPE 2 : Identité Groupe */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-l-4 border-[var(--color-cordel-ocre,#c05621)] pl-4">
                  <h3 className="text-sm font-black uppercase text-stone-800">Identité du Groupe</h3>
                  <p className="text-xs text-stone-500 mt-1">Ces informations seront visibles par vos membres.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nom de l'association *</label>
                    <input 
                      type="text" 
                      required
                      value={wizardData.assocName}
                      onChange={(e) => updateData('assocName', e.target.value)}
                      className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                      placeholder="Ex: Maracatu O Girador"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ville principale / Localisation *</label>
                    <input 
                      type="text" 
                      required
                      value={wizardData.city}
                      onChange={(e) => updateData('city', e.target.value)}
                      className="w-full border-2 border-stone-300 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-cordel-ocre,#c05621)] outline-none transition-colors"
                      placeholder="Ex: Paris, Lyon, Toulouse..."
                    />
                    <p className="text-[10px] text-stone-500 mt-1">Sert de repère par défaut.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">Logo de l'Association</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-stone-100 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                      {logoFile ? (
                        <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-30">🖼️</span>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*"
                        id="logo-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setLogoFile(e.target.files[0]);
                          }
                        }}
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-white border-2 border-stone-300 rounded-lg text-xs font-bold text-stone-700 cursor-pointer hover:bg-stone-50 transition-colors inline-block"
                      >
                        Sélectionner une image
                      </label>
                      <p className="text-[10px] text-stone-500 mt-2">Formater PNG ou JPG. Poids minime recommandé.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPE 3 : Pôles & Genre */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-l-4 border-[var(--color-cordel-ocre,#c05621)] pl-4">
                  <h3 className="text-sm font-black uppercase text-stone-800">Activités et Vocabulaire</h3>
                  <p className="text-xs text-stone-500 mt-1">Personnalisez l'expérience selon votre type de groupe.</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <label className="block text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider">Pôles d'activités</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${wizardData.poles.percussion ? 'border-[var(--color-cordel-vert,#2d6a4f)] bg-green-50/50' : 'border-stone-200 bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-[#2d6a4f]"
                        checked={wizardData.poles.percussion}
                        onChange={() => handlePolesChange('percussion')}
                      />
                      <span className="text-sm font-bold">🥁 Percussion</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${wizardData.poles.danse ? 'border-[var(--color-cordel-vert,#2d6a4f)] bg-green-50/50' : 'border-stone-200 bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-[#2d6a4f]"
                        checked={wizardData.poles.danse}
                        onChange={() => handlePolesChange('danse')}
                      />
                      <span className="text-sm font-bold">💃 Danse</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${wizardData.poles.chant ? 'border-[var(--color-cordel-vert,#2d6a4f)] bg-green-50/50' : 'border-stone-200 bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-[#2d6a4f]"
                        checked={wizardData.poles.chant}
                        onChange={() => handlePolesChange('chant')}
                      />
                      <span className="text-sm font-bold">🎤 Chant</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-3 font-medium">
                    Cela activera automatiquement les pupitres et modules correspondants (ex: Vestiaire pour la Danse).
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <label className="block text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider">Terminologie par Défaut</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="genre"
                        value="feminin"
                        checked={wizardData.genre === 'feminin'}
                        onChange={() => updateData('genre', 'feminin')}
                        className="w-4 h-4 accent-[#c05621]"
                      />
                      <span className="text-sm font-bold text-stone-700">Féminine (ex: Les adhérentes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="genre"
                        value="masculin"
                        checked={wizardData.genre === 'masculin'}
                        onChange={() => updateData('genre', 'masculin')}
                        className="w-4 h-4 accent-[#c05621]"
                      />
                      <span className="text-sm font-bold text-stone-700">Masculine (ex: Les adhérents)</span>
                    </label>
                  </div>
                </div>

              </div>
            )}

          </form>
        </div>

        {/* Footer */}
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

          <CordelButton
            form="hub-setup-form"
            type="submit"
            variant="vert"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            {saving 
              ? '⏳ Création en cours...' 
              : (currentStep === 3 ? '🚀 Terminer et Lancer' : 'Suivant ➡️')}
          </CordelButton>
        </div>

      </div>
    </div>
  );
}
