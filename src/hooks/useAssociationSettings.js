import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../firebase';
import { DEFAULT_CUSTOM_CATEGORIES, batchMigrateUserCategories } from '../utils/categoryUtils';

export const DEFAULT_FIELDS_CONFIG = {
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

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Comptes-rendus', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

export const DEFAULT_ENABLED_MODULES = {
  diffusion: true,
  tresorerie: true,
  logistique: true,
  commandes: true,
  vestiaire: true,
  covoiturage: true,
  studioSocial: true,
  reunions: true,
  mestre: true,
  monParcoursGlobal: true,
  monParcoursPercussion: true,
  monParcoursDanse: true,
  monParcoursChant: true,
  monParcoursAtelier: true,
  monParcoursCulture: true
};

export const DEFAULT_ECOSYSTEM_ACCESS = {
  vitrine: true,
  sequenciador: true,
  dancador: true,
  hub: true
};

export const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant"];

// Textes, badges et titres par défaut des sections de la vitrine publique
export const DEFAULT_VITRINE_TEXTS = {
  // Section Présentation ("Qui sommes-nous ?")
  titrePresentation: "Qui sommes-nous ?",
  accrochePresentation: "Découvrez la puissance du Maracatu, la richesse de nos rythmes traditionnels et la ferveur de nos prestations scéniques.",
  
  // Section Vie Associative
  badgeVieAssociative: "Notre Quotidien",
  titreVieAssociative: "Vie Associative & Organisation",
  
  // Section Galerie Photos
  badgeGalerie: "Photos & Prestations",
  titreGalerie: "En Images",
  accrocheGalerie: "Découvrez la ferveur, l'énergie scénique et les moments forts de notre collectif.",
  
  // Section Agenda
  titreAgenda: "Prochaines Dates & Prestations",
  accrocheAgenda: "Événements ouverts au public. Venez nous rencontrer !",
  
  // Section Espace Organisateur / Nous Programmer
  badgeProgrammer: "Espace Organisateur & Programmateurs",
  titreProgrammer: "Nous Programmer / Fiche Technique",
  accrocheProgrammer: "Toutes les informations pratiques pour accueillir notre groupe lors de vos festivals, défilés ou événements.",
  titreFormats: "Nos Formats de Prestations",
  titreFicheTechnique: "Fiche technique et besoin logistique",
  
  // Section Contact & Réseaux
  titreContactReseaux: "Contact & Réseaux Sociaux",
  accrocheContactReseaux: "Une question, un projet d'événement ou une demande de prestation ? Contactez-nous directement ou suivez l'actualité de la troupe sur nos réseaux sociaux !",
  boutonContactEmail: "Contactez-nous pour programmer",
  boutonHeroProgrammer: "Nous Programmer",
  
  // Section Espace Pro Documents
  titreProDocs: "Espace Pro & Organisateurs",
  accrocheProDocs: "Téléchargez les documents officiels et éléments de presse pour votre événement.",
  labelDossierPresentation: "Télécharger le Dossier de Présentation",
  labelFicheTechnique: "Télécharger la Fiche Technique",
  labelPlanScene: "Télécharger le Plan de Scène",
  labelKitPresse: "Télécharger le Kit Presse (Texte & Photos)",
  
  // Section Recrutement
  badgeRecrutement: "Nous Rejoindre",
  titreRecrutement: "Rejoignez la troupe !",
  accrocheRecrutement: "Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale humaine unique !",
  
  // Section Newsletter
  badgeNewsletter: "Infolettre & Prestations",
  titreNewsletter: "Abonnez-vous à notre Newsletter",
  accrocheNewsletter: "Recevez nos prochaines dates de prestations, défilés et actualités du groupe directement dans votre boîte mail."
};

export const DEFAULT_PUBLIC_THEME = {
  isPublished: false,
  primaryColor: '#D32F2F',
  secondaryColor: '#1976D2',
  backgroundColor: '#FAF6EE',
  textColor: '#1C1917',
  buttonBgColor: '#D32F2F',
  buttonTextColor: '#FFFFFF',
  headingFont: 'Oswald',
  bodyFont: 'Roboto',
  publicHeroImage: '',
  heroOverlayOpacity: 25,
  publicCatchphrase: '',
  heroCatchphrase: '',
  publicDescription: '',
  aboutText: '',
  publicVideoLink: '',
  videoUrl: '',
  publicTechnicalSheet: '',
  publicContactEmail: '',
  publicContactPhone: '',
  dossierProPdfUrl: '',
  // URLs des 4 documents Espace Pro (Organisateurs / Presse)
  dossierPresentationUrl: '',
  ficheTechniqueUrl: '',
  planSceneUrl: '',
  kitPresseUrl: '',
  // Textes et titres dynamiques des sections
  vitrineTexts: DEFAULT_VITRINE_TEXTS,
  // Référencement SEO Dynamique
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  // Statut de publication générale de la vitrine (Mode Brouillon / En ligne)
  isPublished: true,
  // Configuration de la visibilité des sections sur le site public
  afficherVieAssociative: true,
  afficherRecrutement: true,
  afficherGalerie: true,
  afficherAgenda: true,
  enableOrganizerSection: true,
  afficherNewsletter: true,
  // Configuration du contenu de la section Recrutement & Vie Associative Vitrine
  texteVieAssociative: '',
  formulesRecrutement: [],
  titreRecrutement: 'Rejoignez la troupe !',
  texteRecrutement: '',
  lienRecrutement: '',
  texteBoutonRecrutement: "S'inscrire sur HelloAsso",
  showRecrutementCtaIcon: true,
  activerHelloAssoRecrutement: true,
  // Configuration du Bouton d'Action Principal (Hero CTA)
  heroCtaText: 'Prochaines dates',
  heroCtaLink: '#agenda',
  showHeroCtaIcon: true,
  heroCtaIcon: '📅',
  // Liens dynamiques vers les réseaux sociaux de l'association
  socialLinks: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    snapchat: '',
    whatsapp: '',
    linkedin: '',
    spotify: ''
  },
  // Formats de prestations personnalisables
  publicPerformanceFormats: '',
  // Configuration d'intégration Brevo API
  brevoApiKey: '',
  brevoListId: '',
  // Liste des photos de la galerie de la vitrine publique
  galleryPhotos: []
};

export function useAssociationSettings(groupId, isAuthorized, onBack, t) {
  const [formData, setFormData] = useState({
    fieldsConfig: DEFAULT_FIELDS_CONFIG,
    customCategories: DEFAULT_CUSTOM_CATEGORIES,
    instrumentsDisponibles: [],
    linkedInstruments: [],
    varalCategories: [],
    sequenceurUrl: '',
    branding: {
      logoUrl: '',
      colors: {
        primary: '#d99f4d',
        secondary: '#84967a',
        background: '#f4ecd8',
        text: '#1a1a1a'
      }
    },
    // Thème dynamique pour le site vitrine public
    publicTheme: DEFAULT_PUBLIC_THEME,
    droitImageDocUrl: '',
    aptitudeMedicaleDocUrl: '',
    demanderDroitImage: false,
    demanderAttestationSante: false,
    majoriteFeminine: false,
    indemniteKilometrique: 0,
    adresseLocal: '',
    pointRassemblementDefaut: '',
    enableCarpoolReimbursement: true,
    reimbursementRule: 'full_cars_only',
    defaultDepartureLocation: '',
    montantAdhesion: 0,
    optionsCotisation: [],
    lienPaiementExterne: '',
    instructionsPaiement: '',
    permissionsMatrice: { troupe: [], tresorerie: [], logistique: [], studio: [] },
    helloAssoSignatureKey: '',
    tagsDisponibles: [],
    agendaRequireInstrument: false,
    agendaEnableMaybeStatus: true,
    agendaEnableStageLayout: true,
    agendaEnableRevisionProgram: true,
    agendaEnableCarpool: true,
    agendaEnableFinance: true,
    agendaEnableInscriptions: true,
    pupitresColors: { Mestre: '#8b2a1a' },
    eventTypes: ['prestation', 'repetition', 'stage', 'atelier', 'reunion'],
    eventTypeConfigs: {},
    enabledModules: DEFAULT_ENABLED_MODULES,
    ecosystemAccess: DEFAULT_ECOSYSTEM_ACCESS,
    activerPresenceEnLigne: true,
    enableIndividualProgression: false,
    lieuxImportants: [],
    defaultLocationsByEventType: {},
    tagNotificationCommentairesEvenement: '',
    lienGoogleFormRecoltePhotos: '',
    lienRecoltePhotosExternes: '',
    // Bureau juridique officiel dynamique & Direction Artistique
    bureauMembres: [],
    directionArtistique: [],
    afficherMestriaPV: false,
    // Configuration Dynamique des E-mails & Expéditeur SaaS
    emailSenderName: '',
    emailReplyTo: '',
    emailDeliveryMode: 'ogirador',
    emailConnectionType: 'api',
    emailApiProvider: 'brevo',
    emailProviderApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: 'tls',
    customEmailDomain: '',
    logisticsKits: []
  });

  const [logoFile, setLogoFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [dossierProPdfFile, setDossierProPdfFile] = useState(null);
  const [dossierPresentationFile, setDossierPresentationFile] = useState(null);
  const [ficheTechniqueFile, setFicheTechniqueFile] = useState(null);
  const [planSceneFile, setPlanSceneFile] = useState(null);
  const [kitPresseFile, setKitPresseFile] = useState(null);
  const [droitImageFile, setDroitImageFile] = useState(null);
  const [aptitudeMedicaleFile, setAptitudeMedicaleFile] = useState(null);
  const [signaturePresidentFile, setSignaturePresidentFile] = useState(null);
  const [signatureTresorierFile, setSignatureTresorierFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  // Nettoyage du timer de notification au démontage
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Affichage dynamique des notifications toast de succès
  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const handleChange = (key, value) => {
    let actualKey = key;
    let actualValue = value;
    if (key && key.target) {
      actualKey = key.target.name;
      actualValue = key.target.value;
    }

    setFormData(prev => {
      if (actualKey.includes('.')) {
        const parts = actualKey.split('.');
        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = actualValue;
        return updated;
      }
      
      if (actualKey === 'pointRassemblementDefaut' || actualKey === 'adresseLocal') {
        return {
          ...prev,
          adresseLocal: actualValue,
          pointRassemblementDefaut: actualValue
        };
      }

      return {
        ...prev,
        [actualKey]: actualValue
      };
    });
  };

  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
    getDoc(credentialsRef).then((docSnap) => {
      if (docSnap.exists()) {
        const creds = docSnap.data();
        handleChange('helloAssoSignatureKey', creds.helloAssoSignatureKey || '');
        if (creds.emailProviderApiKey !== undefined) handleChange('emailProviderApiKey', creds.emailProviderApiKey);
        if (creds.smtpPassword !== undefined) handleChange('smtpPassword', creds.smtpPassword);
      }
    }).catch(err => {
      console.error("AssociationSettings - Erreur de lecture des credentials :", err);
    });

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(prev => ({
          ...prev,
          nom: data.nom || '',
          demanderDroitImage: data.demanderDroitImage || false,
          demanderAttestationSante: data.demanderAttestationSante || false,
          fieldsConfig: data.fieldsConfig ? { ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig } : DEFAULT_FIELDS_CONFIG,
          customCategories: Array.isArray(data.customCategories) && data.customCategories.length > 0 ? data.customCategories : DEFAULT_CUSTOM_CATEGORIES,
          instrumentsDisponibles: Array.isArray(data.instrumentsDisponibles) ? data.instrumentsDisponibles : DEFAULT_INSTRUMENTS,
          linkedInstruments: Array.isArray(data.linkedInstruments) ? data.linkedInstruments.map(link => {
            if (Array.isArray(link)) {
              return { name: '', instruments: link };
            } else if (link && typeof link === 'object') {
              if (Array.isArray(link.instruments)) {
                return { name: link.name || '', instruments: link.instruments };
              } else if (link.inst1 && link.inst2) {
                return { name: link.name || '', instruments: [link.inst1, link.inst2] };
              }
            }
            return null;
          }).filter(Boolean) : [],
          logisticsKits: Array.isArray(data.logisticsKits) ? data.logisticsKits : [],
          varalCategories: Array.isArray(data.varalCategories) ? data.varalCategories : DEFAULT_VARAL_CATEGORIES,
          branding: {
            logoUrl: data.branding?.logoUrl || '',
            colors: {
              primary: data.branding?.colors?.primary || '#d99f4d',
              secondary: data.branding?.colors?.secondary || '#84967a',
              background: data.branding?.colors?.background || '#f4ecd8',
              text: data.branding?.colors?.text || '#1a1a1a'
            }
          },
          // Configuration du thème visuel et du contenu pour le site vitrine public
          publicTheme: {
            ...DEFAULT_PUBLIC_THEME,
            ...(data.publicTheme || {}),
            // Textes et titres dynamiques des sections avec fallback par défaut
            vitrineTexts: {
              ...DEFAULT_VITRINE_TEXTS,
              ...(data.publicTheme?.vitrineTexts || {})
            },
            // Liens des réseaux sociaux
            socialLinks: {
              ...DEFAULT_PUBLIC_THEME.socialLinks,
              ...(data.publicTheme?.socialLinks || {})
            },
            // Galerie photos
            galleryPhotos: Array.isArray(data.publicTheme?.galleryPhotos)
              ? data.publicTheme.galleryPhotos
              : DEFAULT_PUBLIC_THEME.galleryPhotos,
            primaryColor: data.publicTheme?.primaryColor || DEFAULT_PUBLIC_THEME.primaryColor,
            secondaryColor: data.publicTheme?.secondaryColor || DEFAULT_PUBLIC_THEME.secondaryColor,
            backgroundColor: data.publicTheme?.backgroundColor || DEFAULT_PUBLIC_THEME.backgroundColor,
            textColor: data.publicTheme?.textColor || DEFAULT_PUBLIC_THEME.textColor,
            buttonBgColor: data.publicTheme?.buttonBgColor || DEFAULT_PUBLIC_THEME.buttonBgColor,
            buttonTextColor: data.publicTheme?.buttonTextColor || DEFAULT_PUBLIC_THEME.buttonTextColor,
            headingFont: data.publicTheme?.headingFont || DEFAULT_PUBLIC_THEME.headingFont,
            bodyFont: data.publicTheme?.bodyFont || DEFAULT_PUBLIC_THEME.bodyFont,
            publicHeroImage: data.publicTheme?.publicHeroImage || '',
            heroOverlayOpacity: data.publicTheme?.heroOverlayOpacity !== undefined ? Number(data.publicTheme.heroOverlayOpacity) : 25,
            publicCatchphrase: data.publicTheme?.publicCatchphrase || data.publicTheme?.heroCatchphrase || '',
            heroCatchphrase: data.publicTheme?.heroCatchphrase || data.publicTheme?.publicCatchphrase || '',
            publicDescription: data.publicTheme?.publicDescription || data.publicTheme?.aboutText || '',
            aboutText: data.publicTheme?.aboutText || data.publicTheme?.publicDescription || '',
            publicVideoLink: data.publicTheme?.publicVideoLink || data.publicTheme?.videoUrl || '',
            videoUrl: data.publicTheme?.videoUrl || data.publicTheme?.publicVideoLink || '',
            enableOrganizerSection: data.publicTheme?.enableOrganizerSection !== false,
            publicTechnicalSheet: data.publicTheme?.publicTechnicalSheet || '',
            publicPerformanceFormats: data.publicTheme?.publicPerformanceFormats || '',
            brevoApiKey: data.publicTheme?.brevoApiKey || '',
            brevoListId: data.publicTheme?.brevoListId || '',
            publicContactEmail: data.publicTheme?.publicContactEmail || '',
            publicContactPhone: data.publicTheme?.publicContactPhone || '',
            dossierProPdfUrl: data.publicTheme?.dossierProPdfUrl || data.publicTheme?.dossierPresentationUrl || '',
            dossierPresentationUrl: data.publicTheme?.dossierPresentationUrl || data.publicTheme?.dossierProPdfUrl || '',
            ficheTechniqueUrl: data.publicTheme?.ficheTechniqueUrl || '',
            planSceneUrl: data.publicTheme?.planSceneUrl || '',
            afficherVieAssociative: data.publicTheme?.afficherVieAssociative !== false,
            afficherRecrutement: data.publicTheme?.afficherRecrutement !== false,
            afficherGalerie: data.publicTheme?.afficherGalerie !== false,
            afficherAgenda: data.publicTheme?.afficherAgenda !== false,
            seoTitle: data.publicTheme?.seoTitle || '',
            seoDescription: data.publicTheme?.seoDescription || '',
            seoKeywords: data.publicTheme?.seoKeywords || '',
            titreRecrutement: data.publicTheme?.titreRecrutement || "Rejoignez la troupe !",
            texteRecrutement: data.publicTheme?.texteRecrutement || '',
            lienRecrutement: data.publicTheme?.lienRecrutement || '',
            texteBoutonRecrutement: data.publicTheme?.texteBoutonRecrutement || "S'inscrire sur HelloAsso",
            showRecrutementCtaIcon: data.publicTheme?.showRecrutementCtaIcon !== false,
            heroCtaText: data.publicTheme?.heroCtaText || "Prochaines dates",
            heroCtaLink: data.publicTheme?.heroCtaLink || "#agenda",
            showHeroCtaIcon: data.publicTheme?.showHeroCtaIcon !== false,
            heroCtaIcon: data.publicTheme?.heroCtaIcon !== undefined ? data.publicTheme.heroCtaIcon : "📅",
            afficherNewsletter: data.publicTheme?.afficherNewsletter !== false
          },
          sequenceurUrl: data.sequenceurUrl || '',
          droitImageDocUrl: data.droitImageDocUrl || '',
          aptitudeMedicaleDocUrl: data.aptitudeMedicaleDocUrl || '',
          majoriteFeminine: data.majoriteFeminine || false,
          indemniteKilometrique: data.indemniteKilometrique || 0,
          adresseLocal: data.adresseLocal || '',
          pointRassemblementDefaut: data.adresseLocal || '',
          enableCarpoolReimbursement: data.enableCarpoolReimbursement !== false,
          reimbursementRule: data.reimbursementRule || 'full_cars_only',
          defaultDepartureLocation: data.defaultDepartureLocation || '',
          tagsDisponibles: Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : [],
          permissionsMatrice: data.permissionsMatrice && typeof data.permissionsMatrice === 'object' ? data.permissionsMatrice : {},
          montantAdhesion: data.montantAdhesion !== undefined ? data.montantAdhesion : (data.montantCotisation || 0),
          optionsCotisation: Array.isArray(data.optionsCotisation) ? data.optionsCotisation : [],
          lienPaiementExterne: data.lienPaiementExterne || '',
          instructionsPaiement: data.instructionsPaiement || '',
          agendaRequireInstrument: data.agendaRequireInstrument || false,
          agendaEnableMaybeStatus: data.agendaEnableMaybeStatus !== false,
          agendaEnableStageLayout: data.agendaEnableStageLayout !== false,
          agendaEnableRevisionProgram: data.agendaEnableRevisionProgram !== false,
          agendaEnableCarpool: data.agendaEnableCarpool !== false,
          agendaEnableFinance: data.agendaEnableFinance !== false,
          agendaEnableInscriptions: data.agendaEnableInscriptions !== false,
          pupitresColors: data.pupitresColors || { Mestre: '#8b2a1a' },
          eventTypes: Array.isArray(data.eventTypes) && data.eventTypes.length > 0 
            ? data.eventTypes 
            : ['prestation', 'repetition', 'stage', 'atelier', 'reunion'],
          eventTypeConfigs: data.eventTypeConfigs || {},
          enabledModules: data.enabledModules ? { ...DEFAULT_ENABLED_MODULES, ...data.enabledModules } : DEFAULT_ENABLED_MODULES,
          ecosystemAccess: data.ecosystemAccess ? { ...DEFAULT_ECOSYSTEM_ACCESS, ...data.ecosystemAccess } : DEFAULT_ECOSYSTEM_ACCESS,
          activerPresenceEnLigne: data.activerPresenceEnLigne !== false,
          enableIndividualProgression: data.enableIndividualProgression || false,
          lieuxImportants: Array.isArray(data.lieuxImportants) ? data.lieuxImportants : [],
          defaultLocationsByEventType: data.defaultLocationsByEventType && typeof data.defaultLocationsByEventType === 'object' ? data.defaultLocationsByEventType : {},
          tagNotificationCommentairesEvenement: data.tagNotificationCommentairesEvenement || '',
          lienGoogleFormRecoltePhotos: data.lienRecoltePhotosExternes || data.lienGoogleFormRecoltePhotos || '',
          lienRecoltePhotosExternes: data.lienRecoltePhotosExternes || data.lienGoogleFormRecoltePhotos || '',
          lienDepotForum: data.lienDepotForum || '',
          customDomains: Array.isArray(data.customDomains) ? data.customDomains : [],
          // Bureau dynamique & Direction Artistique (Mestria)
          bureauMembres: Array.isArray(data.bureauMembres) ? data.bureauMembres : [],
          directionArtistique: Array.isArray(data.directionArtistique) ? data.directionArtistique : [],
          afficherMestriaPV: data.afficherMestriaPV || false,
          // Configuration E-mail SaaS
          emailSenderName: data.emailSenderName !== undefined ? data.emailSenderName : '',
          emailReplyTo: data.emailReplyTo !== undefined ? data.emailReplyTo : '',
          emailDeliveryMode: data.emailDeliveryMode || 'ogirador',
          emailConnectionType: data.emailConnectionType || 'api',
          emailApiProvider: data.emailApiProvider || 'brevo',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpSecure: data.smtpSecure || 'tls',
          customEmailDomain: data.customEmailDomain || ''
        }));
      }
      setLoading(false);
    }, (error) => {
      console.error("AssociationSettings - Erreur onSnapshot association :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  const handleSaveHelloAssoKey = async () => {
    if (!groupId || !isAuthorized) return;
    try {
      const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
      await setDoc(credentialsRef, {
        helloAssoSignatureKey: formData.helloAssoSignatureKey
      }, { merge: true });
      showToast("✅ Clé de signature HelloAsso enregistrée !");
    } catch (err) {
      console.error("Erreur enregistrement clé HelloAsso :", err);
      alert("Erreur lors de l'enregistrement de la clé HelloAsso : " + (err.message || err));
    }
  };

  const handleSave = async () => {
    if (!groupId || !isAuthorized) return;

    setSaving(true);
    try {
      let finalLogoUrl = formData.branding?.logoUrl || '';
      if (logoFile && logoFile instanceof File) {
        let fileToUpload = logoFile;
        const compressionOptions = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true };
        try {
          fileToUpload = await imageCompression(logoFile, compressionOptions);
        } catch (compErr) {
          console.warn("Erreur de compression logo, utilisation du fichier d'origine:", compErr);
        }

        const logoStorageRef = storageRef(storage, `associations/${groupId}/logo_${Date.now()}`);
        const snapshot = await uploadBytes(logoStorageRef, fileToUpload, { contentType: fileToUpload.type || 'image/png' });
        finalLogoUrl = await getDownloadURL(snapshot.ref);
        setLogoFile(null);
      }

      let finalPublicHeroImage = formData.publicTheme?.publicHeroImage || '';
      if (heroImageFile && heroImageFile instanceof File) {
        let fileToUpload = heroImageFile;
        const compressionOptions = { maxSizeMB: 1.0, maxWidthOrHeight: 1920, useWebWorker: true };
        try {
          fileToUpload = await imageCompression(heroImageFile, compressionOptions);
        } catch (compErr) {
          console.warn("Erreur de compression image hero, utilisation du fichier d'origine:", compErr);
        }

        const heroStorageRef = storageRef(storage, `associations/${groupId}/public_hero_${Date.now()}`);
        const snapshot = await uploadBytes(heroStorageRef, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg' });
        finalPublicHeroImage = await getDownloadURL(snapshot.ref);
        setHeroImageFile(null);
      }

      let finalDossierProPdfUrl = formData.publicTheme?.dossierProPdfUrl || formData.publicTheme?.dossierPresentationUrl || '';
      let finalDossierPresentationUrl = formData.publicTheme?.dossierPresentationUrl || formData.publicTheme?.dossierProPdfUrl || '';
      if (dossierPresentationFile && dossierPresentationFile instanceof File) {
        const docStorageRef = storageRef(storage, `associations/${groupId}/vitrine/pro_docs/dossier_presentation_${Date.now()}`);
        const snapshot = await uploadBytes(docStorageRef, dossierPresentationFile, { contentType: dossierPresentationFile.type || 'application/pdf' });
        finalDossierPresentationUrl = await getDownloadURL(snapshot.ref);
        finalDossierProPdfUrl = finalDossierPresentationUrl;
        setDossierPresentationFile(null);
      } else if (dossierProPdfFile && dossierProPdfFile instanceof File) {
        const pdfStorageRef = storageRef(storage, `associations/${groupId}/vitrine/dossier_pro_${Date.now()}.pdf`);
        const snapshot = await uploadBytes(pdfStorageRef, dossierProPdfFile, { contentType: dossierProPdfFile.type || 'application/pdf' });
        finalDossierProPdfUrl = await getDownloadURL(snapshot.ref);
        finalDossierPresentationUrl = finalDossierProPdfUrl;
        setDossierProPdfFile(null);
      }

      let finalFicheTechniqueUrl = formData.publicTheme?.ficheTechniqueUrl || '';
      if (ficheTechniqueFile && ficheTechniqueFile instanceof File) {
        const docStorageRef = storageRef(storage, `associations/${groupId}/vitrine/pro_docs/fiche_technique_${Date.now()}`);
        const snapshot = await uploadBytes(docStorageRef, ficheTechniqueFile, { contentType: ficheTechniqueFile.type || 'application/pdf' });
        finalFicheTechniqueUrl = await getDownloadURL(snapshot.ref);
        setFicheTechniqueFile(null);
      }

      let finalPlanSceneUrl = formData.publicTheme?.planSceneUrl || '';
      if (planSceneFile && planSceneFile instanceof File) {
        const docStorageRef = storageRef(storage, `associations/${groupId}/vitrine/pro_docs/plan_scene_${Date.now()}`);
        const snapshot = await uploadBytes(docStorageRef, planSceneFile, { contentType: planSceneFile.type || 'application/pdf' });
        finalPlanSceneUrl = await getDownloadURL(snapshot.ref);
        setPlanSceneFile(null);
      }

      let finalKitPresseUrl = formData.publicTheme?.kitPresseUrl || '';
      if (kitPresseFile && kitPresseFile instanceof File) {
        const docStorageRef = storageRef(storage, `associations/${groupId}/vitrine/pro_docs/kit_presse_${Date.now()}`);
        const snapshot = await uploadBytes(docStorageRef, kitPresseFile, { contentType: kitPresseFile.type || 'application/zip' });
        finalKitPresseUrl = await getDownloadURL(snapshot.ref);
        setKitPresseFile(null);
      }

      let finalDroitImageDocUrl = formData.droitImageDocUrl || '';
      if (droitImageFile && droitImageFile instanceof File) {
        const docRefStorage = storageRef(storage, `associations/${groupId}/docs/droit_image_${Date.now()}`);
        const snapshot = await uploadBytes(docRefStorage, droitImageFile, { contentType: droitImageFile.type || 'application/pdf' });
        finalDroitImageDocUrl = await getDownloadURL(snapshot.ref);
        setDroitImageFile(null);
      }

      let finalAptitudeMedicaleDocUrl = formData.aptitudeMedicaleDocUrl || '';
      if (aptitudeMedicaleFile && aptitudeMedicaleFile instanceof File) {
        const docRefStorage = storageRef(storage, `associations/${groupId}/docs/aptitude_medicale_${Date.now()}`);
        const snapshot = await uploadBytes(docRefStorage, aptitudeMedicaleFile, { contentType: aptitudeMedicaleFile.type || 'application/pdf' });
        finalAptitudeMedicaleDocUrl = await getDownloadURL(snapshot.ref);
        setAptitudeMedicaleFile(null);
      }

      let finalSignaturePresidentUrl = formData.signaturePresidentUrl || '';
      if (signaturePresidentFile && signaturePresidentFile instanceof File) {
        let compressedFile = signaturePresidentFile;
        if (signaturePresidentFile.type.startsWith('image/')) {
          try {
            compressedFile = await imageCompression(signaturePresidentFile, { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true });
          } catch (e) {
            console.warn("AssociationSettings - Erreur compression signature président :", e);
          }
        }
        const sigRef = storageRef(storage, `associations/${groupId}/signatures/signature_president_${Date.now()}`);
        const snapshot = await uploadBytes(sigRef, compressedFile, { contentType: signaturePresidentFile.type || 'image/png' });
        finalSignaturePresidentUrl = await getDownloadURL(snapshot.ref);
        setSignaturePresidentFile(null);
      }

      let finalSignatureTresorierUrl = formData.signatureTresorierUrl || '';
      if (signatureTresorierFile && signatureTresorierFile instanceof File) {
        let compressedFile = signatureTresorierFile;
        if (signatureTresorierFile.type.startsWith('image/')) {
          try {
            compressedFile = await imageCompression(signatureTresorierFile, { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true });
          } catch (e) {
            console.warn("AssociationSettings - Erreur compression signature trésorier :", e);
          }
        }
        const sigRef = storageRef(storage, `associations/${groupId}/signatures/signature_tresorier_${Date.now()}`);
        const snapshot = await uploadBytes(sigRef, compressedFile, { contentType: signatureTresorierFile.type || 'image/png' });
        finalSignatureTresorierUrl = await getDownloadURL(snapshot.ref);
        setSignatureTresorierFile(null);
      }

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        nom: formData.nom || '',
        structureJuridique: formData.structureJuridique || '',
        siret: formData.siret || formData.rna || '',
        rna: formData.rna || formData.siret || '',
        adresseSiegeSocial: formData.adresseSiegeSocial || formData.adresse || '',
        adresse: formData.adresseSiegeSocial || formData.adresse || '',
        mentionTVA: formData.mentionTVA || '',
        ribIban: formData.ribIban || formData.iban || '',
        iban: formData.ribIban || formData.iban || '',
        email: formData.email || formData.emailOfficiel || formData.publicContactEmail || '',
        emailOfficiel: formData.email || formData.emailOfficiel || formData.publicContactEmail || '',
        telephone: formData.telephone || formData.phone || '',
        phone: formData.telephone || formData.phone || '',
        clauseSpecifique: formData.clauseSpecifique || formData.legalClause || '',
        legalClause: formData.clauseSpecifique || formData.legalClause || '',
        signaturePresidentUrl: finalSignaturePresidentUrl,
        signatureTresorierUrl: finalSignatureTresorierUrl,
        fieldsConfig: formData.fieldsConfig,
        customCategories: formData.customCategories || DEFAULT_CUSTOM_CATEGORIES,
        instrumentsDisponibles: formData.instrumentsDisponibles,
        linkedInstruments: formData.linkedInstruments || [],
        logisticsKits: formData.logisticsKits || [],
        varalCategories: formData.varalCategories,
        sequenceurUrl: formData.sequenceurUrl,
        lienDepotForum: formData.lienDepotForum || '',
        customDomains: formData.customDomains || [],
        branding: {
          logoUrl: finalLogoUrl,
          colors: formData.branding.colors
        },
        // Sauvegarde de l'identité visuelle et du contenu de la vitrine publique
        publicTheme: {
          ...(formData.publicTheme || DEFAULT_PUBLIC_THEME),
          publicHeroImage: finalPublicHeroImage,
          dossierProPdfUrl: finalDossierProPdfUrl,
          dossierPresentationUrl: finalDossierPresentationUrl,
          ficheTechniqueUrl: finalFicheTechniqueUrl,
          planSceneUrl: finalPlanSceneUrl,
          kitPresseUrl: finalKitPresseUrl
        },
        droitImageDocUrl: finalDroitImageDocUrl,
        aptitudeMedicaleDocUrl: finalAptitudeMedicaleDocUrl,
        demanderDroitImage: formData.demanderDroitImage,
        demanderAttestationSante: formData.demanderAttestationSante,
        majoriteFeminine: formData.majoriteFeminine,
        indemniteKilometrique: formData.indemniteKilometrique,
        adresseLocal: formData.adresseLocal,
        enableCarpoolReimbursement: formData.enableCarpoolReimbursement,
        reimbursementRule: formData.reimbursementRule,
        defaultDepartureLocation: formData.defaultDepartureLocation,
        montantCotisation: formData.montantAdhesion,
        montantAdhesion: formData.montantAdhesion,
        optionsCotisation: formData.optionsCotisation,
        lienPaiementExterne: formData.lienPaiementExterne,
        instructionsPaiement: formData.instructionsPaiement,
        permissionsMatrice: formData.permissionsMatrice,
        pupitresColors: formData.pupitresColors || {},
        agendaEnableInscriptions: formData.agendaEnableInscriptions !== undefined ? formData.agendaEnableInscriptions : true,
        agendaEnableCarpool: formData.agendaEnableCarpool !== undefined ? formData.agendaEnableCarpool : true,
        agendaEnableFinance: formData.agendaEnableFinance !== undefined ? formData.agendaEnableFinance : true,
        agendaEnableStageLayout: formData.agendaEnableStageLayout !== undefined ? formData.agendaEnableStageLayout : true,
        agendaEnableMaybeStatus: formData.agendaEnableMaybeStatus !== undefined ? formData.agendaEnableMaybeStatus : true,
        agendaEnableRevisionProgram: formData.agendaEnableRevisionProgram !== undefined ? formData.agendaEnableRevisionProgram : true,
        eventTypes: formData.eventTypes || [],
        eventTypeConfigs: formData.eventTypeConfigs || {},
        enabledModules: formData.enabledModules || DEFAULT_ENABLED_MODULES,
        ecosystemAccess: formData.ecosystemAccess || DEFAULT_ECOSYSTEM_ACCESS,
        activerPresenceEnLigne: formData.activerPresenceEnLigne !== false,
        enableIndividualProgression: formData.enableIndividualProgression || false,
        lieuxImportants: formData.lieuxImportants || [],
        defaultLocationsByEventType: formData.defaultLocationsByEventType || {},
        tagNotificationCommentairesEvenement: formData.tagNotificationCommentairesEvenement || '',
        lienGoogleFormRecoltePhotos: formData.lienRecoltePhotosExternes || formData.lienGoogleFormRecoltePhotos || '',
        lienRecoltePhotosExternes: formData.lienRecoltePhotosExternes || formData.lienGoogleFormRecoltePhotos || '',
        // Bureau officiel juridique dynamique & Direction Artistique
        bureauMembres: formData.bureauMembres || [],
        directionArtistique: formData.directionArtistique || [],
        afficherMestriaPV: formData.afficherMestriaPV || false,
        // Configuration E-mail SaaS (Non-sensible)
        emailSenderName: formData.emailSenderName || '',
        emailReplyTo: formData.emailReplyTo || '',
        emailDeliveryMode: formData.emailDeliveryMode || 'ogirador',
        emailConnectionType: formData.emailConnectionType || 'api',
        emailApiProvider: formData.emailApiProvider || 'brevo',
        smtpHost: formData.smtpHost || '',
        smtpPort: formData.smtpPort || 587,
        smtpUser: formData.smtpUser || '',
        smtpSecure: formData.smtpSecure || 'tls',
        customEmailDomain: formData.customEmailDomain || ''
      }, { merge: true });

      const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
      await setDoc(credentialsRef, {
        helloAssoSignatureKey: formData.helloAssoSignatureKey || '',
        emailProviderApiKey: formData.emailProviderApiKey || '',
        smtpPassword: formData.smtpPassword || ''
      }, { merge: true });

      // Migration automatique en lot des catégories historiques 'debutant' / 'confirme' des profils membres dans Firestore
      await batchMigrateUserCategories(db, groupId, formData.customCategories || DEFAULT_CUSTOM_CATEGORIES);

      // Notification Toast de succès sans redirection pour permettre l'édition en continu
      showToast(t('associationSettings.successMsg') || "✅ Configuration de la vitrine enregistrée avec succès !");
    } catch (err) {
      console.error("AssociationSettings - Erreur de sauvegarde :", err);
      alert("Erreur lors de la sauvegarde des réglages : " + (err.message || err));
    } finally {
      setUploadingLogo(false);
      setSaving(false);
    }
  };

  return {
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
    setToastMessage,
    showToast,
    handleSaveHelloAssoKey,
    handleSave
  };
}
