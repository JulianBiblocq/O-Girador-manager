import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import OnboardingPublicBlock from './onboarding/OnboardingPublicBlock';
import OnboardingVisibilityBlock from './onboarding/OnboardingVisibilityBlock';
import OnboardingPrivateBlock from './onboarding/OnboardingPrivateBlock';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member", isRequired: true },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member", isRequired: true },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member", isRequired: false },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member", isRequired: true },
  taillePantalon: { key: "taillePantalon", label: "Taille Pantalon/Bas", enabled: true, filledBy: "member", isRequired: true },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member", isRequired: false },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member", isRequired: false },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member", isRequired: false },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member", isRequired: true },
  niveaux: { key: "niveaux", label: "Affichage des niveaux dans le trombinoscope", enabled: true, filledBy: "admin", isRequired: false }
};

export default function Onboarding({ user, branding, onComplete, profileData }) {
  const { t } = useTranslation();
  // Split the Google Auth display name into a first name and a last name
  const nameParts = user.displayName ? user.displayName.split(' ') : [];
  const initialFirstName = profileData?.prenom || nameParts[0] || '';
  const initialLastName = profileData?.nom || nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: profileData?.telephone || '',
    adresseRue: profileData?.adresseRue || '',
    adresseCP: profileData?.adresseCP || '',
    adresseVille: profileData?.adresseVille || '',
    surnom: profileData?.surnom || '',
    tailleTshirt: profileData?.tailleTshirt || 'M',
    taillePantalon: profileData?.taillePantalon || 'M',
    droitImage: profileData?.droitImage || false,
    aptitudeMedicale: profileData?.aptitudeMedicale || false,
    lateralite: profileData?.lateralite || 'droitier',
    dateNaissance: profileData?.dateNaissance || '',
    instrument: profileData?.instrument || '',
    instrumentSecondaire: profileData?.instrumentSecondaire || '',
    voeuPrincipal: profileData?.voeuPrincipal || '',
    voeuSecondaire: profileData?.voeuSecondaire || '',
    instrumentsJoues: profileData?.instrumentsJoues || [],
    voeuxInstruments: profileData?.voeuxInstruments || [],
    pratiqueDanse: profileData?.pratiqueDanse || false,
    estAncienMembre: profileData?.estAncienMembre || false,
    souhaiteChangerInstrument: profileData?.souhaiteChangerInstrument || false,
    volontaireAncienInstrument: profileData?.volontaireAncienInstrument || false,
    genre: profileData?.genre || 'femme',
    afficherTelephone: profileData?.afficherTelephone ?? true,
    afficherDateNaissance: profileData?.afficherDateNaissance ?? false,
    visibiliteAdresse: profileData?.visibiliteAdresse || 'ville',
    publierTelephone: profileData?.publierTelephone ?? true,
    publierDateNaissance: profileData?.publierDateNaissance ?? false
  });

  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [nomAssociation, setNomAssociation] = useState(branding?.nomAssociation || branding?.nom || branding?.name || '');
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant"]);
  const [submitting, setSubmitting] = useState(false);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [demanderDroitImage, setDemanderDroitImage] = useState(false);
  const [demanderAttestationSante, setDemanderAttestationSante] = useState(false);

  // Extract the group ID parameter from the URL if present, fallback to profileData or default
  const searchParams = new URLSearchParams(window.location.search);
  const groupId = searchParams.get('groupe') || searchParams.get('assoc') || profileData?.groupId || 'Samambaia';

  // Charger custom fields configuration and association details for Onboarding
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
          if (data.nomAssociation || data.nom || data.name) {
            setNomAssociation(data.nomAssociation || data.nom || data.name);
          }
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
    if (!fieldsConfig) return true; // show by default while chargement de
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

    const isDanse = Boolean(formData.pratiqueDanse);
    const isPercussion = Boolean(formData.pratiquePercussion);
    const isAncien = Boolean(formData.estAncienMembre);
    const cleanVoeux = isPercussion ? (Array.isArray(formData.voeuxInstruments) ? formData.voeuxInstruments.filter(Boolean) : []) : [];

    // Validation : Au moins une discipline doit être sélectionnée
    if (!isPercussion && !isDanse) {
      const errMsg = "Veuillez sélectionner au moins une discipline (Percussion ou Danse).";
      setValidationError(errMsg);
      alert(errMsg);
      return;
    }

    // Validation pour les Anciens membres : Sélection de l'instrument actuel obligatoire si percussion
    if (isAncien && isPercussion) {
      if (!formData.instrumentPrincipal || !formData.instrumentPrincipal.trim()) {
        const errMsg = "Veuillez sélectionner votre instrument actuel.";
        setValidationError(errMsg);
        alert(errMsg);
        return;
      }
      if (formData.souhaiteChangerInstrument && cleanVoeux.length === 0) {
        const errMsg = "Veuillez sélectionner au moins 1 nouveau vœu d'instrument si vous souhaitez changer d'instrument.";
        setValidationError(errMsg);
        alert(errMsg);
        return;
      }
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
      const currentInstVal = isAncien ? (formData.instrumentPrincipal || "") : (isPercussion ? "En attente" : "");

      // Construction de la fiche utilisateur Firestore
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
        pratiquePercussion: isPercussion,
        pratiqueDanse: isDanse,
        estAncienMembre: isAncien,
        souhaiteChangerInstrument: Boolean(formData.souhaiteChangerInstrument),
        volontaireAncienInstrument: Boolean(formData.volontaireAncienInstrument),
        accordRenfortAncienInstrument: Boolean(formData.volontaireAncienInstrument),
        voeuxInstruments: cleanVoeux,
        voeuPrincipal: cleanVoeux[0] || "",
        voeuSecondaire: cleanVoeux[1] || "",
        voeuTertiaire: cleanVoeux[2] || "",
        instrument: currentInstVal,
        instrumentPrincipal: currentInstVal,
        instrumentSecondaire: "",
        instrumentsJoues: cleanVoeux,
        genre: formData.genre,
        role: profileData?.role || "membre",
        isNew: profileData?.isNew !== undefined ? profileData.isNew : true,
        statutActuel: profileData?.statutActuel || "active",
        groupId: (profileData?.groupId || groupId)?.toLowerCase() === 'samambaia' ? 'Samambaia' : (profileData?.groupId || groupId),
        tags: profileData?.tags || [],
        afficherTelephone: Boolean(formData.afficherTelephone),
        afficherDateNaissance: Boolean(formData.afficherDateNaissance),
        visibiliteAdresse: formData.visibiliteAdresse || 'ville',
        publierTelephone: Boolean(formData.afficherTelephone),
        publierDateNaissance: Boolean(formData.afficherDateNaissance),
        onboardingCompleted: true
      };

      // Réconciliation avec le sas de paiement HelloAsso préalable (pending_payments)
      const cleanEmail = (user.email || '').trim().toLowerCase();
      if (cleanEmail) {
        try {
          const pendingRef = doc(db, 'pending_payments', cleanEmail);
          const pendingSnap = await getDoc(pendingRef);
          if (pendingSnap.exists()) {
            const pendingData = pendingSnap.data();
            userDoc.paymentStatus = 'paid';
            userDoc.helloAssoLastPayment = {
              date: pendingData.paymentDate || new Date().toISOString(),
              amount: pendingData.amountEuros || 0,
              orderId: pendingData.orderId || null,
              eventType: pendingData.eventType || 'Order'
            };

            // Rapatrier la transaction financière avec son UID si transactionId existe
            if (pendingData.transactionId) {
              try {
                await updateDoc(doc(db, 'transactions', pendingData.transactionId), {
                  userId: user.uid
                });
              } catch (txUpdateErr) {
                console.warn("Onboarding - Impossible de rattacher la transaction comptable :", txUpdateErr);
              }
            }

            // Supprimer l'entrée réconciliée du sas pending_payments
            await deleteDoc(pendingRef);
          }
        } catch (pendingErr) {
          console.warn("Onboarding - Erreur vérification sas pending_payments :", pendingErr);
        }
      }

      // Enregistrement de la fiche adhérent dans Firestore avec l'UID Auth comme identifiant
      await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });

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
                nomAssociation={nomAssociation}
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
