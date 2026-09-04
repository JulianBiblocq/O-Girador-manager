import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot, arrayUnion, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, auth, storage, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';
import useConfirm from './useConfirm';

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

export const DEFAULT_INSTRUMENTS = ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant"];

const getFullAddress = (pd) => {
  if (!pd) return '';
  if (pd.adresse && typeof pd.adresse === 'string' && pd.adresse.trim()) return pd.adresse;
  const parts = [pd.adresseRue, pd.adresseCP || pd.adresseCodePostal, pd.adresseVille].filter(Boolean);
  return parts.join(', ');
};

export function useUserProfile(user, profileData, t) {
  const { confirm } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: profileData?.prenom || '',
    nom: profileData?.nom || '',
    instrument: profileData?.instrument || profileData?.instrumentPrincipal || '',
    instrumentPrincipal: profileData?.instrumentPrincipal || profileData?.instrument || '',
    instrumentSecondaire: profileData?.instrumentSecondaire || '',
    pratiquePercussion: profileData?.pratiquePercussion !== undefined ? profileData.pratiquePercussion : true,
    pratiqueDanse: profileData?.pratiqueDanse !== undefined ? profileData.pratiqueDanse : (profileData?.instrument === 'Danse' || (Array.isArray(profileData?.instrumentsJoues) && profileData.instrumentsJoues.includes('Danse'))),
    estAncienMembre: profileData?.estAncienMembre !== undefined ? profileData.estAncienMembre : Boolean(profileData?.instrument || profileData?.instrumentPrincipal),
    voeuxInstruments: Array.isArray(profileData?.voeuxInstruments) ? profileData.voeuxInstruments : ([profileData?.voeuPrincipal, profileData?.voeuSecondaire, profileData?.voeuTertiaire].filter(Boolean)),
    souhaiteChangerInstrument: profileData?.souhaiteChangerInstrument || false,
    volontaireAncienInstrument: profileData?.volontaireAncienInstrument !== undefined ? profileData.volontaireAncienInstrument : (profileData?.accordRenfortAncienInstrument || false),
    voeuPrincipal: profileData?.voeuPrincipal || '',
    voeuSecondaire: profileData?.voeuSecondaire || '',
    voeuTertiaire: profileData?.voeuTertiaire || '',
    accordRenfortAncienInstrument: profileData?.volontaireAncienInstrument !== undefined ? profileData.volontaireAncienInstrument : (profileData?.accordRenfortAncienInstrument || false),
    instrumentsJoues: profileData?.instrumentsJoues || ([profileData?.instrument, profileData?.instrumentSecondaire].filter(Boolean)),
    telephone: profileData?.telephone || '',
    adresse: getFullAddress(profileData),
    adresseRue: profileData?.adresseRue || profileData?.adresse || '',
    adresseCP: profileData?.adresseCP || profileData?.adresseCodePostal || '',
    adresseVille: profileData?.adresseVille || '',
    surnom: profileData?.surnom || '',
    tailleTshirt: profileData?.tailleTshirt || 'M',
    taillePantalon: profileData?.taillePantalon || 'M',
    droitImage: profileData?.droitImage !== undefined ? profileData.droitImage : true,
    aptitudeMedicale: profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false,
    lateralite: profileData?.lateralite || 'droitier',
    dateNaissance: profileData?.dateNaissance || '',
    genre: profileData?.genre || 'autre',
    afficherTelephone: profileData?.afficherTelephone !== undefined ? profileData.afficherTelephone : (profileData?.publierTelephone !== undefined ? profileData.publierTelephone : true),
    afficherVille: profileData?.afficherVille !== undefined ? profileData.afficherVille : (profileData?.visibiliteAdresse !== 'masquee'),
    afficherDateNaissance: profileData?.afficherDateNaissance !== undefined ? profileData.afficherDateNaissance : (profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false),
    visibiliteAdresse: profileData?.visibiliteAdresse || 'ville',
    publierTelephone: profileData?.afficherTelephone !== undefined ? profileData.afficherTelephone : (profileData?.publierTelephone !== undefined ? profileData.publierTelephone : true),
    publierDateNaissance: profileData?.afficherDateNaissance !== undefined ? profileData.afficherDateNaissance : (profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false),
    dietaryRestrictions: Array.isArray(profileData?.dietaryRestrictions) ? profileData.dietaryRestrictions : [],
    allergies: profileData?.allergies || '',
    niveauxParInstrument: profileData?.niveauxParInstrument || {}
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [myInstruments, setMyInstruments] = useState([]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [demanderDroitImage, setDemanderDroitImage] = useState(false);
  const [demanderAttestationSante, setDemanderAttestationSante] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  const handleStartEdit = () => {
    setFormData({
      prenom: profileData?.prenom || '',
      nom: profileData?.nom || '',
      instrument: profileData?.instrument || '',
      instrumentSecondaire: profileData?.instrumentSecondaire || '',
      voeuPrincipal: profileData?.voeuPrincipal || '',
      voeuSecondaire: profileData?.voeuSecondaire || '',
      voeuTertiaire: profileData?.voeuTertiaire || '',
      accordRenfortAncienInstrument: profileData?.accordRenfortAncienInstrument || false,
      instrumentsJoues: profileData?.instrumentsJoues || ([profileData?.instrument, profileData?.instrumentSecondaire].filter(Boolean)),
      telephone: profileData?.telephone || '',
      adresse: getFullAddress(profileData),
      adresseRue: profileData?.adresseRue || profileData?.adresse || '',
      adresseCP: profileData?.adresseCP || profileData?.adresseCodePostal || '',
      adresseVille: profileData?.adresseVille || '',
      surnom: profileData?.surnom || '',
      tailleTshirt: profileData?.tailleTshirt || 'M',
      taillePantalon: profileData?.taillePantalon || 'M',
      droitImage: profileData?.droitImage !== undefined ? profileData.droitImage : true,
      aptitudeMedicale: profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false,
      lateralite: profileData?.lateralite || 'droitier',
      dateNaissance: profileData?.dateNaissance || '',
      genre: profileData?.genre || 'autre',
      afficherTelephone: profileData?.afficherTelephone !== undefined ? profileData.afficherTelephone : (profileData?.publierTelephone !== undefined ? profileData.publierTelephone : true),
      afficherVille: profileData?.afficherVille !== undefined ? profileData.afficherVille : (profileData?.visibiliteAdresse !== 'masquee'),
      afficherDateNaissance: profileData?.afficherDateNaissance !== undefined ? profileData.afficherDateNaissance : (profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false),
      visibiliteAdresse: profileData?.visibiliteAdresse || 'ville',
      publierTelephone: profileData?.afficherTelephone !== undefined ? profileData.afficherTelephone : (profileData?.publierTelephone !== undefined ? profileData.publierTelephone : true),
      publierDateNaissance: profileData?.afficherDateNaissance !== undefined ? profileData.afficherDateNaissance : (profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false),
      dietaryRestrictions: Array.isArray(profileData?.dietaryRestrictions) ? profileData.dietaryRestrictions : [],
      allergies: profileData?.allergies || '',
      niveauxParInstrument: profileData?.niveauxParInstrument || {}
    });
    setIsEditing(true);
  };

  const handleEnableNotifications = async () => {
    if (!messaging) {
      alert("Les notifications Push ne sont pas prises en charge par ce navigateur.");
      return;
    }
    setIsSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        let registration = undefined;
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            registration = await navigator.serviceWorker.ready;
          } catch (swErr) {
            console.error("Could not get ready service worker:", swErr);
          }
        }
        const token = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
          serviceWorkerRegistration: registration
        });
        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          alert("Notifications activées avec succès !");
        } else {
          console.error("FCM Token not generated.");
          alert("Impossible de générer le jeton de notification.");
        }
      } else {
        alert("La permission d'envoi de notifications a été refusée.");
      }
    } catch (err) {
      console.error("Error enabling notifications - Detailed error info:", err);
      alert("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribingPush(false);
    }
  };

  // Synchronisation de la configuration des champs pour l'association du membre
  useEffect(() => {
    if (!profileData?.groupId) {
      setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
      return;
    }

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDemanderDroitImage(data.demanderDroitImage || false);
        setDemanderAttestationSante(data.demanderAttestationSante || false);
        if (data.fieldsConfig) {
          setFieldsConfig({ ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig });
        } else {
          setFieldsConfig(DEFAULT_FIELDS_CONFIG);
        }
        if (Array.isArray(data.instrumentsDisponibles)) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        } else {
          setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
        }
        if (Array.isArray(data.tagsDisponibles)) {
          setTagsDisponibles(data.tagsDisponibles);
        } else {
          setTagsDisponibles([]);
        }
        setDroitImageDocUrl(data.droitImageDocUrl || '');
        setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
      }
      setLoadingInst(false);
    }, (error) => {
      console.error("UserProfile - Erreur onSnapshot fieldsConfig :", error);
      setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
      setTagsDisponibles([]);
      setLoadingInst(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  // Synchronisation de la liste des instruments de l'utilisateur
  useEffect(() => {
    if (!profileData?.groupId || !user?.uid) {
      setMyInstruments([]);
      setLoadingInst(false);
      return;
    }

    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMyInstruments(fetched);
      setLoadingInst(false);
    }, (error) => {
      console.error("UserProfile - Erreur onSnapshot inventory :", error);
      setLoadingInst(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, user?.uid]);

  // Auto-inscription aux notifications push si l'autorisation a déjà été accordée
  useEffect(() => {
    if (!messaging || !user?.uid) return;

    const checkAndAutoSubscribe = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        setNotificationPermission('granted');
        try {
          let registration = undefined;
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            try {
              registration = await navigator.serviceWorker.ready;
            } catch (swErr) {
              console.error("Impossible de récupérer le service worker pour l'auto-inscription :", swErr);
            }
          }
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
            serviceWorkerRegistration: registration
          });
          if (token) {
            const currentTokens = profileData?.fcmTokens || [];
            if (!currentTokens.includes(token)) {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
            }
          }
        } catch (err) {
          console.error("Échec de l'auto-inscription au jeton FCM :", err);
        }
      }
    };

    checkAndAutoSubscribe();
  }, [user?.uid, profileData?.fcmTokens]);

  const [validationError, setValidationError] = useState('');

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true;
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member') : true;
  };

  const isFieldRequired = (key) => {
    if (!fieldsConfig) return false;
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member' && Boolean(cfg.isRequired)) : false;
  };

  const getMissingRequiredFields = () => {
    if (!fieldsConfig) return [];
    const missing = [];
    Object.keys(fieldsConfig).forEach(key => {
      if (!isFieldRequired(key)) return;
      if (key === 'telephone' && (!formData.telephone || !formData.telephone.trim())) missing.push('telephone');
      if (key === 'surnom' && (!formData.surnom || !formData.surnom.trim())) missing.push('surnom');
      if (key === 'adresse' && (!formData.adresse || !formData.adresse.trim()) && (!formData.adresseRue || !formData.adresseRue.trim())) missing.push('adresse');
      if (key === 'tailleTshirt' && (!formData.tailleTshirt || !formData.tailleTshirt.trim())) missing.push('tailleTshirt');
      if (key === 'taillePantalon' && (!formData.taillePantalon || !formData.taillePantalon.trim())) missing.push('taillePantalon');
      if (key === 'lateralite' && (!formData.lateralite || !formData.lateralite.trim())) missing.push('lateralite');
      if (key === 'dateNaissance' && (!formData.dateNaissance || !formData.dateNaissance.trim())) missing.push('dateNaissance');
      if (key === 'droitImage' && demanderDroitImage && !formData.droitImage) missing.push('droitImage');
      if (key === 'aptitudeMedicale' && demanderAttestationSante && !formData.aptitudeMedicale) missing.push('aptitudeMedicale');
    });
    return missing;
  };

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEditorComplete = async (processedBase64) => {
    setShowEditor(false);
    setSelectedImage(null);
    if (!user?.uid) return;

    setUploadingPhoto(true);

    try {
      const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeType });
      };

      const blob = base64ToBlob(processedBase64);

      const storageRef = ref(storage, `avatars/${user.uid}/profile_pic_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      alert(t('common.saveSuccess'));
    } catch (err) {
      console.error("UserProfile - Erreur d'upload de photo :", err);
      alert(t('common.saveError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user?.uid) return;

    const cleanVoeux = Array.isArray(formData.voeuxInstruments)
      ? formData.voeuxInstruments.filter(Boolean)
      : [formData.voeuPrincipal, formData.voeuSecondaire, formData.voeuTertiaire].filter(Boolean);

    const isDanse = Boolean(formData.pratiqueDanse);
    const isAncien = Boolean(
      formData.estAncienMembre ||
      (profileData?.instrument || profileData?.instrumentPrincipal || formData.instrument || '').trim() !== '' ||
      (profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0)
    );

    if (isDanse) {
      if (cleanVoeux.length === 1) {
        const errMsg = "En choisissant la Danse, merci de sélectionner soit 0 percussion (profil 100% Danse), soit au moins 2 vœux de percussions.";
        setValidationError(errMsg);
        alert(errMsg);
        return;
      }
    } else {
      if (!isAncien) {
        if (cleanVoeux.length < 2 || cleanVoeux.length > 3) {
          const errMsg = "Veuillez sélectionner entre 2 et 3 vœux d'instruments de percussion (ou cocher la Danse pour un profil 100% Danse).";
          setValidationError(errMsg);
          alert(errMsg);
          return;
        }
      }
    }

    const missingRequired = Object.keys(fieldsConfig || {}).some(key => {
      if (!isFieldRequired(key)) return false;
      if (key === 'telephone') return !formData.telephone || !formData.telephone.trim();
      if (key === 'surnom') return !formData.surnom || !formData.surnom.trim();
      if (key === 'adresse') return (!formData.adresse || !formData.adresse.trim()) && (!formData.adresseRue || !formData.adresseRue.trim());
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

    setSaving(true);
    try {
      const cleanVoeux = Array.isArray(formData.voeuxInstruments)
        ? formData.voeuxInstruments.filter(Boolean)
        : [formData.voeuPrincipal, formData.voeuSecondaire, formData.voeuTertiaire].filter(Boolean);

      const updatePayload = {
        prenom: formData.prenom,
        nom: formData.nom,
        instrument: profileData?.instrument || profileData?.instrumentPrincipal || formData.instrument || '',
        instrumentPrincipal: profileData?.instrumentPrincipal || profileData?.instrument || formData.instrument || '',
        instrumentSecondaire: profileData?.instrumentSecondaire || formData.instrumentSecondaire || '',
        pratiquePercussion: Boolean(formData.pratiquePercussion),
        pratiqueDanse: Boolean(formData.pratiqueDanse),
        estAncienMembre: Boolean(formData.estAncienMembre),
        voeuxInstruments: cleanVoeux,
        souhaiteChangerInstrument: Boolean(formData.souhaiteChangerInstrument),
        volontaireAncienInstrument: Boolean(formData.volontaireAncienInstrument),
        accordRenfortAncienInstrument: Boolean(formData.volontaireAncienInstrument),
        voeuPrincipal: cleanVoeux[0] || '',
        voeuSecondaire: cleanVoeux[1] || '',
        voeuTertiaire: cleanVoeux[2] || '',
        instrumentsJoues: Array.from(new Set(
          [
            profileData?.instrument || formData.instrument,
            profileData?.instrumentSecondaire || formData.instrumentSecondaire,
            ...(formData.instrumentsJoues || [])
          ]
          .map(i => i ? i.trim() : '')
          .filter(i => i && i.toLowerCase() !== 'autre' && i.toLowerCase() !== 'mestre' && i.toLowerCase() !== 'danse')
        )),
        telephone: isFieldVisible('telephone') ? formData.telephone : (profileData?.telephone || ''),
        adresse: isFieldVisible('adresse') ? (formData.adresse || formData.adresseRue || '') : (profileData?.adresse || ''),
        adresseRue: isFieldVisible('adresse') ? (formData.adresseRue || formData.adresse || '') : (profileData?.adresseRue || ''),
        adresseCP: isFieldVisible('adresse') ? (formData.adresseCP || formData.adresseCodePostal || '') : (profileData?.adresseCP || ''),
        adresseVille: isFieldVisible('adresse') ? (formData.adresseVille || '') : (profileData?.adresseVille || ''),
        surnom: isFieldVisible('surnom') ? formData.surnom : (profileData?.surnom || ''),
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : (profileData?.tailleTshirt || 'M'),
        taillePantalon: isFieldVisible('taillePantalon') ? formData.taillePantalon : (profileData?.taillePantalon || 'M'),
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : (profileData?.lateralite || 'droitier'),
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : (profileData?.dateNaissance || ''),
        genre: formData.genre,
        afficherTelephone: Boolean(formData.afficherTelephone),
        afficherVille: Boolean(formData.afficherVille),
        afficherDateNaissance: Boolean(formData.afficherDateNaissance),
        visibiliteAdresse: formData.afficherVille ? 'ville' : 'masquee',
        publierTelephone: Boolean(formData.afficherTelephone),
        publierDateNaissance: Boolean(formData.afficherDateNaissance),
        dietaryRestrictions: Array.isArray(formData.dietaryRestrictions) ? formData.dietaryRestrictions : [],
        allergies: formData.allergies ? formData.allergies.trim() : '',
        niveauxParInstrument: formData.niveauxParInstrument || {}
      };

      if (demanderDroitImage) {
        updatePayload.droitImage = formData.droitImage;
        if (formData.droitImage) {
          if (!profileData?.droitImage || !profileData?.dateSignatureDroitImage) {
            updatePayload.dateSignatureDroitImage = new Date().toISOString();
          }
        } else {
          updatePayload.dateSignatureDroitImage = null;
        }
      }

      if (demanderAttestationSante) {
        updatePayload.aptitudeMedicale = formData.aptitudeMedicale;
        if (formData.aptitudeMedicale) {
          if (!profileData?.aptitudeMedicale || !profileData?.dateSignatureAttestationSante) {
            updatePayload.dateSignatureAttestationSante = new Date().toISOString();
          }
        } else {
          updatePayload.dateSignatureAttestationSante = null;
        }
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updatePayload);
      alert(t('userProfile.successMsg'));
      setIsEditing(false);
    } catch (error) {
      console.error("UserProfile - Erreur lors de la sauvegarde :", error);
      alert(t('userProfile.errorMsg'));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("UserProfile - Erreur déconnexion :", error);
    }
  };

  const handleForceUpdate = async () => {
    const isOk = await confirm({
      title: "Forcer la mise à jour",
      message: t('pwa.confirmForceUpdate') || "Voulez-vous vraiment vider le cache et forcer la mise à jour ?",
      confirmText: "Oui, forcer la mise à jour",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (isOk) {
      forceUpdateAndClearCache();
    }
  };

  const handlePurgeObsoleteInstruments = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const cleanInsts = (profileData?.instrumentsJoues || [])
        .map(i => i ? i.trim() : '')
        .filter(i => i && i.toLowerCase() !== 'autre' && i.toLowerCase() !== 'mestre');

      const cleanPrimary = (profileData?.instrument || '').toLowerCase() === 'mestre' || (profileData?.instrument || '').toLowerCase() === 'autre'
        ? 'Autre'
        : (profileData?.instrument || 'Autre');

      await updateDoc(userRef, {
        instrumentsJoues: cleanInsts,
        instrument: cleanPrimary
      });
      alert("Instruments du profil réinitialisés et purgés avec succès !");
      forceUpdateAndClearCache();
    } catch (err) {
      console.error("Erreur lors de la réinitialisation des instruments :", err);
      alert("Erreur lors de la réinitialisation.");
    } finally {
      setSaving(false);
    }
  };

  const isAncien = Boolean(
    (profileData?.instrument || formData.instrument || '').trim() !== '' ||
    (profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0)
  );

  const isInstrumentsValid = isAncien ? true : Boolean(
    (formData.voeuPrincipal && formData.voeuPrincipal.trim()) ||
    (formData.instrument && formData.instrument.trim())
  );

  return {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saving,
    uploadingPhoto,
    myInstruments,
    loadingInst,
    droitImageDocUrl,
    aptitudeMedicaleDocUrl,
    fieldsConfig,
    instrumentsDisponibles,
    tagsDisponibles,
    demanderDroitImage,
    demanderAttestationSante,
    selectedImage,
    setSelectedImage,
    showEditor,
    setShowEditor,
    notificationPermission,
    isSubscribingPush,
    handleStartEdit,
    handleEnableNotifications,
    isFieldVisible,
    isFieldRequired,
    getMissingRequiredFields,
    validationError,
    isInstrumentsValid,
    handlePhotoSelected,
    handleEditorComplete,
    handleChange,
    handleSave,
    handleDisconnect,
    handleForceUpdate,
    handlePurgeObsoleteInstruments
  };
}
