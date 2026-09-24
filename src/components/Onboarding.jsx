import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import OnboardingPublicBlock from './onboarding/OnboardingPublicBlock';
import OnboardingVisibilityBlock from './onboarding/OnboardingVisibilityBlock';
import OnboardingPrivateBlock from './onboarding/OnboardingPrivateBlock';
import OnboardingMissingFieldsAlert from './onboarding/OnboardingMissingFieldsAlert';

// Configuration par défaut des champs du formulaire d'inscription.
// Les champs non essentiels sont isRequired: false pour éviter qu'un champ masqué
// ne bloque silencieusement la soumission. L'association peut surcharger via Firestore.
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

export default function Onboarding({ user, branding, onComplete, profileData }) {
  const { t } = useTranslation();
  // Séparation du nom d'affichage en prénom et nom de famille
  const nameParts = user?.displayName ? user.displayName.split(' ') : [];
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
    pratiqueDanse: profileData?.pratiqueDanse ?? false,
    pratiquePercussion: profileData?.pratiquePercussion ?? false,
    estAncienMembre: profileData?.estAncienMembre ?? false,
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
  const [linkedInstruments, setLinkedInstruments] = useState([]);
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
          if (Array.isArray(data.linkedInstruments)) {
            setLinkedInstruments(data.linkedInstruments);
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
  const [missingFieldsList, setMissingFieldsList] = useState([]);

  // Ensemble des clés manquantes pour un affichage réactif dans les sous-blocs
  const missingFields = useMemo(() => {
    return new Set(missingFieldsList.map(item => item.key));
  }, [missingFieldsList]);

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
    // Si l'utilisateur modifie un champ en anomalie, on nettoie son alerte si renseigné
    if (missingFieldsList.length > 0) {
      setMissingFieldsList(prevList => prevList.filter(item => {
        if (item.key === name) {
          return type === 'checkbox' ? !checked : !value?.trim();
        }
        return true;
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const isDanse = Boolean(formData.pratiqueDanse);
    const isPercussion = Boolean(formData.pratiquePercussion);
    const isAncien = Boolean(formData.estAncienMembre);
    const cleanVoeux = isPercussion ? (Array.isArray(formData.voeuxInstruments) ? formData.voeuxInstruments.filter(Boolean) : []) : [];

    const champsManquants = [];

    // 1. Validation identité de base
    if (!formData.firstName || !formData.firstName.trim()) {
      champsManquants.push({ key: 'firstName', label: t('onboarding.firstName') || 'Prénom', anchorId: 'field-firstName' });
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      champsManquants.push({ key: 'lastName', label: t('onboarding.lastName') || 'Nom de famille', anchorId: 'field-lastName' });
    }

    // 2. Validation discipline obligatoire (Percussion et/ou Danse)
    if (!isPercussion && !isDanse) {
      champsManquants.push({ 
        key: 'discipline', 
        label: t('onboarding.discipline') || 'Discipline (Percussion ou Danse)', 
        anchorId: 'field-discipline' 
      });
    }

    // 3. Validation pour les Anciens membres si percussion
    if (isAncien && isPercussion) {
      if (!formData.instrumentPrincipal || !formData.instrumentPrincipal.trim()) {
        champsManquants.push({ 
          key: 'instrumentPrincipal', 
          label: t('onboarding.currentInstrument') || 'Instrument actuel', 
          anchorId: 'field-instrumentPrincipal' 
        });
      }
      if (formData.souhaiteChangerInstrument && cleanVoeux.length === 0) {
        champsManquants.push({ 
          key: 'voeuxInstruments', 
          label: t('onboarding.newInstrumentWish') || "Au moins 1 nouveau vœu d'instrument", 
          anchorId: 'field-instrumentPrincipal' 
        });
      }
    }

    // 4. Collecte explicite des champs configurables obligatoires de l'association
    Object.keys(fieldsConfig || {}).forEach(key => {
      if (!isFieldRequired(key)) return;
      const label = fieldsConfig[key]?.label || key;
      if (key === 'telephone' && (!formData.phone || !formData.phone.trim())) {
        champsManquants.push({ key: 'telephone', label, anchorId: 'field-telephone' });
      } else if (key === 'surnom' && (!formData.surnom || !formData.surnom.trim())) {
        champsManquants.push({ key: 'surnom', label, anchorId: 'field-surnom' });
      } else if (key === 'adresse' && (!formData.adresseRue || !formData.adresseRue.trim())) {
        champsManquants.push({ key: 'adresse', label, anchorId: 'field-adresse' });
      } else if (key === 'tailleTshirt' && (!formData.tailleTshirt || !formData.tailleTshirt.trim())) {
        champsManquants.push({ key: 'tailleTshirt', label, anchorId: 'field-tailleTshirt' });
      } else if (key === 'taillePantalon' && (!formData.taillePantalon || !formData.taillePantalon.trim())) {
        champsManquants.push({ key: 'taillePantalon', label, anchorId: 'field-taillePantalon' });
      } else if (key === 'lateralite' && (!formData.lateralite || !formData.lateralite.trim())) {
        champsManquants.push({ key: 'lateralite', label, anchorId: 'field-lateralite' });
      } else if (key === 'dateNaissance' && (!formData.dateNaissance || !formData.dateNaissance.trim())) {
        champsManquants.push({ key: 'dateNaissance', label, anchorId: 'field-dateNaissance' });
      } else if (key === 'droitImage' && demanderDroitImage && !formData.droitImage) {
        champsManquants.push({ key: 'droitImage', label, anchorId: 'field-droitImage' });
      } else if (key === 'aptitudeMedicale' && demanderAttestationSante && !formData.aptitudeMedicale) {
        champsManquants.push({ key: 'aptitudeMedicale', label, anchorId: 'field-aptitudeMedicale' });
      }
    });

    if (champsManquants.length > 0) {
      setMissingFieldsList(champsManquants);
      const errMsg = `Veuillez renseigner les champs requis pour finaliser votre inscription.`;
      setValidationError(errMsg);

      // Auto-focus et défilement fluide vers le premier champ manquant
      const firstTargetId = champsManquants[0]?.anchorId;
      if (firstTargetId) {
        const el = document.getElementById(firstTargetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inputEl = el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea');
          if (inputEl) {
            setTimeout(() => inputEl.focus(), 300);
          }
        }
      }
      return;
    }

    setSubmitting(true);

    try {
      const currentInstVal = isAncien ? (formData.instrumentPrincipal || "") : (isPercussion ? "En attente" : "");

      // Construction de la fiche utilisateur Firestore
      const isExistingMember = Boolean(
        isAncien ||
        profileData?.estAncienMembre ||
        profileData?.instrument ||
        profileData?.instrumentPrincipal ||
        (Array.isArray(profileData?.instrumentsJoues) && profileData.instrumentsJoues.length > 0) ||
        (profileData?.role && profileData.role !== 'nouveau')
      );

      // Construction de la fiche utilisateur — les champs sensibles (role, isSystemAdmin)
      // ne sont injectés que pour les profils réellement nouveaux afin de ne pas écraser
      // les valeurs existantes gérées par les firestore.rules du backend maître.
      const userDoc = {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: user?.email || "",
        telephone: isFieldVisible('telephone') ? formData.phone : "",
        adresseRue: isFieldVisible('adresse') ? formData.adresseRue : "",
        adresseCP: isFieldVisible('adresse') ? formData.adresseCP : "",
        adresseVille: isFieldVisible('adresse') ? formData.adresseVille : "",
        surnom: isFieldVisible('surnom') ? formData.surnom : "",
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : "M",
        taillePantalon: isFieldVisible('taillePantalon') ? formData.taillePantalon : "M",
        droitImage: demanderDroitImage ? formData.droitImage : false,
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
        isNew: profileData?.isNew !== undefined ? profileData.isNew : (!isExistingMember),
        statutActuel: profileData?.statutActuel || "active",
        groupId: (profileData?.groupId || groupId)?.toLowerCase() === 'samambaia' ? 'Samambaia' : (profileData?.groupId || groupId),
        afficherTelephone: Boolean(formData.afficherTelephone),
        afficherDateNaissance: Boolean(formData.afficherDateNaissance),
        visibiliteAdresse: formData.visibiliteAdresse || 'ville',
        publierTelephone: Boolean(formData.afficherTelephone),
        publierDateNaissance: Boolean(formData.afficherDateNaissance),
        onboardingCompleted: true
      };

      // Injection conditionnelle des dates de signature (uniquement si la fonctionnalité est activée)
      if (demanderDroitImage && formData.droitImage) {
        userDoc.dateSignatureDroitImage = new Date();
      }
      if (demanderAttestationSante && formData.aptitudeMedicale) {
        userDoc.dateSignatureAttestationSante = new Date();
      }

      // Injection des champs sensibles uniquement pour les profils sans rôle existant
      if (!profileData?.role) {
        userDoc.role = "membre";
      }
      if (!profileData?.tags) {
        userDoc.tags = [];
      }

      // Nettoyage du payload : suppression des valeurs null/undefined
      // pour éviter un rejet par les règles Firestore du backend maître
      Object.keys(userDoc).forEach(key => {
        if (userDoc[key] === null || userDoc[key] === undefined) {
          delete userDoc[key];
        }
      });

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
            if (pendingData.transactionId && user?.uid) {
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

      if (!user?.uid) {
        throw new Error("Identifiant utilisateur manquant. Veuillez vous reconnecter.");
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
            {t('onboarding.step') || "INSCRIPTION • COMPLÉTER MON PROFIL"}
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
              {/* Alerte Cordel interactive listant les champs requis manquants avec raccourcis de navigation */}
              <OnboardingMissingFieldsAlert missingFieldsList={missingFieldsList} />

              {/* Bloc 1 : Ton Profil Public (Trombinoscope) */}
              <OnboardingPublicBlock
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                submitting={submitting}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                instrumentsDisponibles={instrumentsDisponibles}
                linkedInstruments={linkedInstruments}
                nomAssociation={nomAssociation}
                missingFields={missingFields}
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
                missingFields={missingFields}
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
                missingFields={missingFields}
                t={t}
              />

              {/* Rappel d'alerte en bas de formulaire avant le bouton si des champs sont manquants */}
              {missingFieldsList.length > 0 && (
                <OnboardingMissingFieldsAlert missingFieldsList={missingFieldsList} />
              )}

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
