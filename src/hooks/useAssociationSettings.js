import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member", isRequired: false },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member", isRequired: false },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member", isRequired: false },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member", isRequired: false },
  taillePantalon: { key: "taillePantalon", label: "Taille Pantalon/Bas", enabled: true, filledBy: "member", isRequired: false },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member", isRequired: false },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member", isRequired: false },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member", isRequired: false },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member", isRequired: false }
};

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Partitions', nom: 'Partitions', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Tutoriels', nom: 'Tutoriels', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true }
];

export const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

export function useAssociationSettings(groupId, isAuthorized, onBack, t) {
  const [formData, setFormData] = useState({
    fieldsConfig: DEFAULT_FIELDS_CONFIG,
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
    eventTypeConfigs: {}
  });

  const [logoFile, setLogoFile] = useState(null);
  const [droitImageFile, setDroitImageFile] = useState(null);
  const [aptitudeMedicaleFile, setAptitudeMedicaleFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
        handleChange('helloAssoSignatureKey', docSnap.data().helloAssoSignatureKey || '');
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
          demanderDroitImage: data.demanderDroitImage || false,
          demanderAttestationSante: data.demanderAttestationSante || false,
          fieldsConfig: data.fieldsConfig ? { ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig } : DEFAULT_FIELDS_CONFIG,
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
          permissionsMatrice: data.permissionsMatrice ? {
            troupe: data.permissionsMatrice.troupe || [],
            tresorerie: data.permissionsMatrice.tresorerie || [],
            logistique: data.permissionsMatrice.logistique || [],
            studio: data.permissionsMatrice.studio || []
          } : { troupe: [], tresorerie: [], logistique: [], studio: [] },
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
          eventTypeConfigs: data.eventTypeConfigs || {}
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
    if (!groupId) return;
    setSaving(true);
    try {
      const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
      await setDoc(credentialsRef, {
        helloAssoSignatureKey: formData.helloAssoSignatureKey
      }, { merge: true });
      alert("Clé secrète HelloAsso sauvegardée avec succès !");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la clé HelloAsso :", err);
      alert("Impossible de sauvegarder la clé : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!groupId) return;

    setSaving(true);
    let finalLogoUrl = formData.branding.logoUrl;
    let finalDroitImageDocUrl = formData.droitImageDocUrl;
    let finalAptitudeMedicaleDocUrl = formData.aptitudeMedicaleDocUrl;

    try {
      if (logoFile && logoFile instanceof File) {
        setUploadingLogo(true);
        const storageRef = ref(storage, `brandings/${groupId}/logo.png`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
        setLogoFile(null);
      }

      if (droitImageFile && droitImageFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/droit_image.pdf`);
        const snap = await uploadBytes(docRef, droitImageFile);
        finalDroitImageDocUrl = await getDownloadURL(snap.ref);
        setDroitImageFile(null);
      }

      if (aptitudeMedicaleFile && aptitudeMedicaleFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/aptitude_medicale.pdf`);
        const snap = await uploadBytes(docRef, aptitudeMedicaleFile);
        finalAptitudeMedicaleDocUrl = await getDownloadURL(snap.ref);
        setAptitudeMedicaleFile(null);
      }

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        fieldsConfig: formData.fieldsConfig,
        instrumentsDisponibles: formData.instrumentsDisponibles,
        linkedInstruments: formData.linkedInstruments,
        varalCategories: formData.varalCategories,
        sequenceurUrl: formData.sequenceurUrl,
        branding: {
          logoUrl: finalLogoUrl,
          colors: formData.branding.colors
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
        eventTypeConfigs: formData.eventTypeConfigs || {}
      }, { merge: true });

      const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
      await setDoc(credentialsRef, {
        helloAssoSignatureKey: formData.helloAssoSignatureKey
      }, { merge: true });

      alert(t('associationSettings.successMsg') || "Réglages de l'association enregistrés avec succès !");
      onBack();
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
    droitImageFile,
    setDroitImageFile,
    aptitudeMedicaleFile,
    setAptitudeMedicaleFile,
    uploadingLogo,
    saving,
    loading,
    handleSaveHelloAssoKey,
    handleSave
  };
}
