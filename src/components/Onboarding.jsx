import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import OnboardingPublicBlock from './onboarding/OnboardingPublicBlock';
import OnboardingVisibilityBlock from './onboarding/OnboardingVisibilityBlock';
import OnboardingPrivateBlock from './onboarding/OnboardingPrivateBlock';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member", isRequired: false },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member", isRequired: false },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member", isRequired: false },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member", isRequired: false },
  taillePantalon: { key: "taillePantalon", label: "Taille Pantalon/Bas", enabled: true, filledBy: "member", isRequired: false },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member", isRequired: false },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member", isRequired: false },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member", isRequired: false },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member", isRequired: false },
  niveaux: { key: "niveaux", label: "Affichage des niveaux dans le trombinoscope", enabled: true, filledBy: "admin", isRequired: false }
};

export default function Onboarding({ user, branding, onComplete }) {
  const { t } = useTranslation();
  // Split the Google Auth display name into a first name and a last name
  const nameParts = user.displayName ? user.displayName.split(' ') : [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: '',
    adresseRue: '',
    adresseCP: '',
    adresseVille: '',
    surnom: '',
    tailleTshirt: 'M',
    taillePantalon: 'M',
    droitImage: false,
    aptitudeMedicale: false,
    lateralite: 'droitier',
    dateNaissance: '',
    instrument: '',
    instrumentSecondaire: '',
    voeuPrincipal: '',
    voeuSecondaire: '',
    voeuTertiaire: '',
    instrumentsJoues: [],
    voeuxInstruments: [],
    pratiqueDanse: false,
    genre: 'femme',
    afficherTelephone: true,
    afficherDateNaissance: false,
    visibiliteAdresse: 'ville',
    publierTelephone: true,
    publierDateNaissance: false
  });

  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant"]);
  const [submitting, setSubmitting] = useState(false);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [demanderDroitImage, setDemanderDroitImage] = useState(false);
  const [demanderAttestationSante, setDemanderAttestationSante] = useState(false);

  // Extract the group ID parameter from the URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const groupId = searchParams.get('groupe') || null;

  // Load custom fields configuration for Onboarding
  useEffect(() => {
    if (!groupId) {
      setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      return;
    }

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'associations', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDemanderDroitImage(data.demanderDroitImage || false);
          setDemanderAttestationSante(data.demanderAttestationSante || false);
          if (Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0) {
            setInstrumentsDisponibles(data.instrumentsDisponibles);
          }
          if (data.fieldsConfig) {
            setFieldsConfig({ ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig });
          } else {
            setFieldsConfig(DEFAULT_FIELDS_CONFIG);
          }
          setDroitImageDocUrl(data.droitImageDocUrl || '');
          setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
        } else {
          setFieldsConfig(DEFAULT_FIELDS_CONFIG);
        }
      } catch (err) {
        console.error("Onboarding - Erreur de fetch config :", err);
        setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      }
    };
    fetchConfig();
  }, [groupId]);

  const [validationError, setValidationError] = useState('');

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true; // show by default while loading
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member') : true;
  };

  const isFieldRequired = (key) => {
    if (!fieldsConfig) return false;
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member' && Boolean(cfg.isRequired)) : false;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanVoeux = Array.isArray(formData.voeuxInstruments) ? formData.voeuxInstruments.filter(Boolean) : [];
    if (cleanVoeux.length < 2 || cleanVoeux.length > 3) {
      const errMsg = "Veuillez sélectionner entre 2 et 3 vœux d'instruments de percussion.";
      setValidationError(errMsg);
      alert(errMsg);
      return;
    }

    const missingRequired = Object.keys(fieldsConfig || {}).some(key => {
      if (!isFieldRequired(key)) return false;
      if (key === 'telephone') return !formData.phone || !formData.phone.trim();
      if (key === 'surnom') return !formData.surnom || !formData.surnom.trim();
      if (key === 'adresse') return (!formData.adresseRue || !formData.adresseRue.trim());
      if (key === 'tailleTshirt') return !formData.tailleTshirt || !formData.tailleTshirt.trim();
      if (key === 'taillePantalon') return !formData.taillePantalon || !formData.taillePantalon.trim();
      if (key === 'lateralite') return !formData.lateralite || !formData.lateralite.trim();
      if (key === 'dateNaissance') return !formData.dateNaissance || !formData.dateNaissance.trim();
      if (key === 'droitImage') return demanderDroitImage && !formData.droitImage;
      if (key === 'aptitudeMedicale') return demanderAttestationSante && !formData.aptitudeMedicale;
      return false;
    });

    if (missingRequired) {
      const errMsg = "Veuillez remplir tous les champs obligatoires.";
      setValidationError(errMsg);
      alert(errMsg);
      return;
    }

    setSubmitting(true);

    try {
      // Build the user document payload according to specifications
      const userDoc = {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: user.email,
        telephone: isFieldVisible('telephone') ? formData.phone : "",
        adresseRue: isFieldVisible('adresse') ? formData.adresseRue : "",
        adresseCP: isFieldVisible('adresse') ? formData.adresseCP : "",
        adresseVille: isFieldVisible('adresse') ? formData.adresseVille : "",
        surnom: isFieldVisible('surnom') ? formData.surnom : "",
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : "M",
        taillePantalon: isFieldVisible('taillePantalon') ? formData.taillePantalon : "M",
        droitImage: demanderDroitImage ? formData.droitImage : false,
        dateSignatureDroitImage: demanderDroitImage && formData.droitImage ? new Date() : null,
        aptitudeMedicale: demanderAttestationSante ? formData.aptitudeMedicale : false,
        dateSignatureAttestationSante: demanderAttestationSante && formData.aptitudeMedicale ? new Date() : null,
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : "droitier",
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : "",
        pratiqueDanse: Boolean(formData.pratiqueDanse),
        voeuxInstruments: cleanVoeux,
        voeuPrincipal: cleanVoeux[0] || "",
        voeuSecondaire: cleanVoeux[1] || "",
        voeuTertiaire: cleanVoeux[2] || "",
        instrument: "En attente",
        instrumentPrincipal: "En attente",
        instrumentSecondaire: "",
        instrumentsJoues: cleanVoeux,
        genre: formData.genre,
        role: "membre",
        statutActuel: "active",
        groupId: groupId,
        tags: [],
        afficherTelephone: Boolean(formData.afficherTelephone),
        afficherDateNaissance: Boolean(formData.afficherDateNaissance),
        visibiliteAdresse: formData.visibiliteAdresse || 'ville',
        publierTelephone: Boolean(formData.afficherTelephone),
        publierDateNaissance: Boolean(formData.afficherDateNaissance)
      };

      // Write user document to Firestore using Auth UID as the key
      await setDoc(doc(db, 'users', user.uid), userDoc);

      // Trigger the parent callback to complete onboarding
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Onboarding - Erreur d'écriture dans Firestore :", error);
      alert((t('onboarding.errorSave') || "Erreur de sauvegarde") + " (" + error.message + ")");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="force-light-theme w-full flex flex-col min-h-screen">
      <LayoutShell logoUrl={branding?.logoUrl} forceLight={true}>
        <div className="text-center py-4 border-b-2 border-dashed border-cordel-master-dark/30 max-w-2xl mx-auto w-full">
          <h1 className="panel-title text-2xl font-extrabold tracking-wider text-cordel-wood">
            {t('onboarding.title') || "NOUVEAU PROFIL"}
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-cordel-master-dark opacity-75 mt-1">
            {t('onboarding.step') || "INSCRIPTION • ÉTAPE 1 SUR 2"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full my-4 px-2">
          <CordelCard variant="default" useExtremeBorder={true}>
            <h2 className="panel-title text-lg font-bold mb-1">
              {t('onboarding.welcome') || "Bienvenue dans l'association !"}
            </h2>
            <p className="text-xs leading-relaxed opacity-80 mb-5">
              {t('onboarding.welcomeDesc') || "Nous avons besoin de quelques informations pour compléter votre fiche de membre."}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
              {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-bold rounded">
                  ⚠️ {validationError}
                </div>
              )}

              {/* Bloc 1 : Ton Profil Public (Trombinoscope) */}
              <OnboardingPublicBlock
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                submitting={submitting}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                instrumentsDisponibles={instrumentsDisponibles}
                t={t}
              />

              {/* Bloc 2 : Visibilité & Partage (Trombinoscope) */}
              <OnboardingVisibilityBlock
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                submitting={submitting}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                t={t}
              />

              {/* Bloc 3 : Informations Confidentielles (Réservé au Bureau) */}
              <OnboardingPrivateBlock
                formData={formData}
                handleChange={handleChange}
                submitting={submitting}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                demanderDroitImage={demanderDroitImage}
                demanderAttestationSante={demanderAttestationSante}
                droitImageDocUrl={droitImageDocUrl}
                aptitudeMedicaleDocUrl={aptitudeMedicaleDocUrl}
                t={t}
              />

              <CordelButton 
                variant="ocre" 
                useExtremeBorder={true}
                className="w-full mt-2 py-3 text-xs font-bold uppercase tracking-wider opacity-100 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (t('onboarding.saving') || "Enregistrement...") : (t('onboarding.nextStep') || "Terminer mon inscription")}
              </CordelButton>
            </form>
          </CordelCard>
        </div>
      </LayoutShell>
    </div>
  );
}
