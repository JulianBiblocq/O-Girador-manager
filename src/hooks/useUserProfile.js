import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot, arrayUnion, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, auth, storage, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';

export const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member" },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

export function useUserProfile(user, profileData, t) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: profileData?.prenom || '',
    nom: profileData?.nom || '',
    instrument: profileData?.instrument || 'Autre',
    instrumentsJoues: profileData?.instrumentsJoues || (profileData?.instrument ? [profileData.instrument] : []),
    telephone: profileData?.telephone || '',
    adresseRue: profileData?.adresseRue || '',
    adresseCP: profileData?.adresseCP || '',
    adresseVille: profileData?.adresseVille || '',
    surnom: profileData?.surnom || '',
    tailleTshirt: profileData?.tailleTshirt || 'M',
    droitImage: profileData?.droitImage !== undefined ? profileData.droitImage : true,
    aptitudeMedicale: profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false,
    lateralite: profileData?.lateralite || 'droitier',
    dateNaissance: profileData?.dateNaissance || '',
    genre: profileData?.genre || 'autre',
    publierTelephone: profileData?.publierTelephone !== undefined ? profileData.publierTelephone : false,
    publierDateNaissance: profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [myInstruments, setMyInstruments] = useState([]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
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
      instrument: profileData?.instrument || 'Autre',
      instrumentsJoues: profileData?.instrumentsJoues || (profileData?.instrument ? [profileData.instrument] : []),
      telephone: profileData?.telephone || '',
      adresseRue: profileData?.adresseRue || '',
      adresseCP: profileData?.adresseCP || '',
      adresseVille: profileData?.adresseVille || '',
      surnom: profileData?.surnom || '',
      tailleTshirt: profileData?.tailleTshirt || 'M',
      droitImage: profileData?.droitImage !== undefined ? profileData.droitImage : true,
      aptitudeMedicale: profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false,
      lateralite: profileData?.lateralite || 'droitier',
      dateNaissance: profileData?.dateNaissance || '',
      genre: profileData?.genre || 'autre',
      publierTelephone: profileData?.publierTelephone !== undefined ? profileData.publierTelephone : false,
      publierDateNaissance: profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false
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

  // Sync fieldsConfig for user's association
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
        setDroitImageDocUrl(data.droitImageDocUrl || '');
        setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
      }
      setLoadingInst(false);
    }, (error) => {
      console.error("UserProfile - Erreur onSnapshot fieldsConfig :", error);
      setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
      setLoadingInst(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  // Sync instruments list for user's group
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

  // Auto-subscribe push notifications if permission is already granted
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
              console.error("Could not get ready service worker for auto-subscribe:", swErr);
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
          console.error("Auto-subscribing FCM Token failed:", err);
        }
      }
    };

    checkAndAutoSubscribe();
  }, [user?.uid, profileData?.fcmTokens]);

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true;
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member') : true;
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

    setSaving(true);
    try {
      const updatePayload = {
        prenom: formData.prenom,
        nom: formData.nom,
        instrument: formData.instrument,
        instrumentsJoues: Array.from(new Set([
          formData.instrument || "Autre",
          ...(formData.instrumentsJoues || [])
        ])).filter(Boolean),
        telephone: isFieldVisible('telephone') ? formData.telephone : (profileData?.telephone || ''),
        adresseRue: isFieldVisible('adresse') ? formData.adresseRue : (profileData?.adresseRue || ''),
        adresseCP: isFieldVisible('adresse') ? formData.adresseCP : (profileData?.adresseCP || ''),
        adresseVille: isFieldVisible('adresse') ? formData.adresseVille : (profileData?.adresseVille || ''),
        surnom: isFieldVisible('surnom') ? formData.surnom : (profileData?.surnom || ''),
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : (profileData?.tailleTshirt || 'M'),
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : (profileData?.lateralite || 'droitier'),
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : (profileData?.dateNaissance || ''),
        genre: formData.genre,
        publierTelephone: isFieldVisible('telephone') ? formData.publierTelephone : false,
        publierDateNaissance: isFieldVisible('dateNaissance') ? formData.publierDateNaissance : false
      };

      if (isFieldVisible('adresse')) {
        updatePayload.adresse = deleteField();
      }

      if (demanderDroitImage) {
        updatePayload.droitImage = formData.droitImage;
        if (formData.droitImage) {
          if (!profileData?.droitImage || !profileData?.dateSignatureDroitImage) {
            updatePayload.dateSignatureDroitImage = new Date();
          }
        } else {
          updatePayload.dateSignatureDroitImage = null;
        }
      }

      if (demanderAttestationSante) {
        updatePayload.aptitudeMedicale = formData.aptitudeMedicale;
        if (formData.aptitudeMedicale) {
          if (!profileData?.aptitudeMedicale || !profileData?.dateSignatureAttestationSante) {
            updatePayload.dateSignatureAttestationSante = new Date();
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

  const handleForceUpdate = () => {
    if (window.confirm(t('pwa.confirmForceUpdate') || "Voulez-vous vraiment vider le cache et forcer la mise à jour ?")) {
      forceUpdateAndClearCache();
    }
  };

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
    handlePhotoSelected,
    handleEditorComplete,
    handleChange,
    handleSave,
    handleDisconnect,
    handleForceUpdate
  };
}
