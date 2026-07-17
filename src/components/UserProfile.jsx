import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, auth, storage, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import XiloAvatar from './XiloAvatar';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloCaixa } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';
import CordelImageEditor from './CordelImageEditor';

const INSTRUMENT_ICONS = {
  Alfaia: 'icones/alfaia.svg',
  Caixa: 'icones/caixa.svg',
  Agbê: 'icones/agbe.svg',
  Gonguê: 'icones/gongue.svg',
  Mineiro: 'icones/mineiro.svg',
  Apito: 'icones/apito.svg',
  Timbal: 'icones/timbal.svg',
  Autre: 'favicon.svg'
};

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member" },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export default function UserProfile({ user, profileData, onBack }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();
  const [formData, setFormData] = useState({
    prenom: profileData?.prenom || '',
    nom: profileData?.nom || '',
    instrument: profileData?.instrument || 'Autre',
    instrumentsJoues: profileData?.instrumentsJoues || (profileData?.instrument ? [profileData.instrument] : []),
    telephone: profileData?.telephone || '',
    adresse: profileData?.adresse || '',
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
  
  const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

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

  // Xylogravure photo editor states
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

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
        const token = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined
        });
        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          alert("Notifications activées avec succès !");
        } else {
          console.warn("FCM Token not generated.");
          alert("Impossible de générer le jeton de notification.");
        }
      } else {
        alert("La permission d'envoi de notifications a été refusée.");
      }
    } catch (err) {
      console.error("Error enabling notifications:", err);
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

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true; // show by default while loading
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
      // Helper function to convert base64 to Blob
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

      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/profile_pic_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save to Firestore users collection
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
    e.preventDefault();
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
        adresse: isFieldVisible('adresse') ? formData.adresse : (profileData?.adresse || ''),
        surnom: isFieldVisible('surnom') ? formData.surnom : (profileData?.surnom || ''),
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : (profileData?.tailleTshirt || 'M'),
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : (profileData?.lateralite || 'droitier'),
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : (profileData?.dateNaissance || ''),
        genre: formData.genre,
        publierTelephone: isFieldVisible('telephone') ? formData.publierTelephone : false,
        publierDateNaissance: isFieldVisible('dateNaissance') ? formData.publierDateNaissance : false
      };

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

  const fullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`;

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('userProfile.title')}
        </span>
        <div className="w-12"></div> {/* Spacer for alignment */}
      </div>

      {/* Avatar Container in Center */}
      <div className="flex flex-col items-center gap-3 py-4 select-none w-full">
        <div className="relative">
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={110} />
          {/* Decorative stamp on avatar */}
          <div className="absolute -bottom-1 -right-2 z-20 flex flex-col gap-1 items-end select-none">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-12">
              {tRole(profileData?.role || 'membre', profileData?.genre)}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] -rotate-6">
              {profileData?.niveau === 'confirme' ? '🏆 ' + t('userProfile.levelConfirmSimple') : profileData?.niveau === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '🎵 ' + (t('common.none') || 'Aucun')}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] rotate-3">
              {profileData?.niveauDanse === 'confirme' ? '💃 ' + t('userProfile.levelConfirmSimple') : profileData?.niveauDanse === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '💃 ' + t('common.none')}
            </span>
          </div>
        </div>

        {/* User Name & Main Role */}
        <div className="flex flex-col items-center gap-1 w-full text-center">
          <h2 className="font-cactus font-black text-2xl uppercase tracking-wider text-encre-noire">
            {fullName}
          </h2>
          <span className="text-xs font-black uppercase tracking-widest text-cordel-wood">
            {tRole(profileData?.role || 'membre', profileData?.genre)}
          </span>
        </div>

        {/* Roles & Instruments Badges (exploit full width) */}
        <div className="flex flex-wrap gap-2.5 justify-center items-center w-full px-2 max-w-2xl border-b border-dashed border-cordel-master-dark/10 pb-4">
          {/* Rôles supplémentaires */}
          {profileData?.tags && profileData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profileData.tags.map((tag, idx) => {
                const rotation = ((tag.charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span 
                    key={`tag-${tag}`} 
                    className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2.5 py-1 bg-white/40"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    👤 {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Instruments joués */}
          {((profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0) || profileData?.instrument) && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(profileData.instrumentsJoues && profileData.instrumentsJoues.length > 0 
                ? profileData.instrumentsJoues 
                : [profileData.instrument].filter(Boolean)
              ).map((inst, idx) => {
                const rotation = ((inst.charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span 
                    key={`inst-${inst}`} 
                    className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2.5 py-1 bg-cordel-bg-light/80 border-dashed"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    🎵 {inst}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload picture button */}
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <div className="flex flex-wrap justify-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
              📸 {uploadingPhoto ? "⏳ " + t('userProfile.uploading') : t('userProfile.changePhoto')}
              <input 
                type="file" 
                accept="image/*"
                disabled={uploadingPhoto || saving}
                onChange={handlePhotoSelected}
                className="hidden"
              />
            </label>
            <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
              📷 {t('userProfile.takePhoto')}
              <input 
                type="file" 
                accept="image/*"
                capture="user"
                disabled={uploadingPhoto || saving}
                onChange={handlePhotoSelected}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-cordel-master-dark opacity-60 break-all px-4 text-center">
            {user.email}
          </span>
        </div>
      </div>

      {/* Profile Modification Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1">
            {t('userProfile.personalInfo')}
          </h4>

          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('userProfile.firstName')}
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre prénom"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('userProfile.lastName')}
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre nom"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Instrument Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('onboarding.instrument')}
            </label>
            <select
              name="instrument"
              value={formData.instrument}
              onChange={handleChange}
              required
              disabled={saving}
              className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-bg-light"
            >
              {instrumentsDisponibles.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
              <option value="Autre">{t('common.other')}</option>
            </select>
          </div>

          {/* Instruments pratiqués / Polyvalence */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('onboarding.instrumentsPlayed')}
            </label>
            <div className="grid grid-cols-2 gap-2 bg-white/40 dark:bg-black/25 p-3 rounded border border-dashed border-cordel-master-dark/15">
              {instrumentsDisponibles.map((inst) => {
                const isChecked = (formData.instrumentsJoues || []).includes(inst);
                return (
                  <label key={inst} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={saving}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => {
                          const currentList = prev.instrumentsJoues || [];
                          const updatedList = checked 
                            ? [...currentList, inst] 
                            : currentList.filter(item => item !== inst);
                          return { ...prev, instrumentsJoues: updatedList };
                        });
                      }}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>{inst}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Genre / Civilité Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('onboarding.genre')}
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              disabled={saving}
              className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-bg-light"
            >
              <option value="homme">{t('onboarding.genderMale')}</option>
              <option value="femme">{t('onboarding.genderFemale')}</option>
              <option value="autre">{t('onboarding.genderOther')}</option>
            </select>
          </div>

          {/* Level Info display */}
          <div className="grid grid-cols-2 gap-3 border-t border-dashed border-cordel-master-dark/10 pt-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('systemAdmin.musicLevel') || "Niveau Musique"}
              </span>
              <span className="text-xs font-bold text-encre-noire bg-cordel-bg-light py-1.5 px-3 rounded border border-encre-noire/25 w-full inline-block text-center">
                {profileData?.niveau === 'confirme' ? '🏆 ' + t('userProfile.levelConfirmSimple') : profileData?.niveau === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '🎵 ' + (t('common.none') || 'Aucun')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('systemAdmin.danceLevel') || "Niveau Danse"}
              </span>
              <span className="text-xs font-bold text-encre-noire bg-cordel-bg-light py-1.5 px-3 rounded border border-encre-noire/25 w-full inline-block text-center">
                {profileData?.niveauDanse === 'confirme' ? '💃 ' + t('userProfile.levelConfirmSimple') : profileData?.niveauDanse === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '💃 ' + t('common.none')}
              </span>
            </div>
          </div>

           {isFieldVisible('telephone') && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.phone')}
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="06 12 34 56 78"
                className="theme-input w-full disabled:opacity-50 text-xs font-bold"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="publierTelephone"
                  checked={formData.publierTelephone}
                  onChange={handleChange}
                  disabled={saving}
                />
                <span>{t('userProfile.phonePublic')}</span>
              </label>
            </div>
          )}

          {isFieldVisible('surnom') && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.surnom')}
              </label>
              <input
                type="text"
                name="surnom"
                value={formData.surnom}
                onChange={handleChange}
                disabled={saving}
                placeholder="Surnom"
                className="theme-input w-full disabled:opacity-50 text-xs font-bold"
              />
            </div>
          )}

          {isFieldVisible('adresse') && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.adresse')}
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="123 Rue de la Roda, 75000 Paris"
                className="theme-input w-full disabled:opacity-50 text-xs font-bold"
              />
            </div>
          )}

          {/* Taille T-Shirt */}
          {isFieldVisible('tailleTshirt') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.tshirtSize')}
              </label>
              <select
                name="tailleTshirt"
                value={formData.tailleTshirt}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-bg-light"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          )}

          {/* Latéralité */}
          {isFieldVisible('lateralite') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.lateralite')}
              </label>
              <select
                name="lateralite"
                value={formData.lateralite}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-bg-light"
              >
                <option value="droitier">{t('onboarding.handRight')}</option>
                <option value="gaucher">{t('onboarding.handLeft')}</option>
              </select>
            </div>
          )}

          {/* Date de Naissance */}
          {isFieldVisible('dateNaissance') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('userProfile.birthdate')}
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50 text-xs font-bold"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="publierDateNaissance"
                  checked={formData.publierDateNaissance}
                  onChange={handleChange}
                  disabled={saving}
                />
                <span>{t('userProfile.birthdatePublic')}</span>
              </label>
            </div>
          )}

          {/* Droit à l'image Checkbox */}
          {demanderDroitImage && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="droitImage"
                  id="droitImage"
                  checked={formData.droitImage}
                  onChange={handleChange}
                  disabled={saving}
                  className="mt-1"
                />
                <label htmlFor="droitImage" className="text-xs font-semibold leading-snug cursor-pointer select-none">
                  {t('userProfile.imageRights')}
                </label>
              </div>
              {droitImageDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={droitImageDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{t('userProfile.imageRightsDoc')}</a>
                </div>
              )}
            </div>
          )}

          {/* Aptitude Médicale Checkbox (Required) */}
          {demanderAttestationSante && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="aptitudeMedicale"
                  id="aptitudeMedicale"
                  checked={formData.aptitudeMedicale}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="mt-1"
                />
                <label htmlFor="aptitudeMedicale" className="text-xs font-bold leading-snug cursor-pointer select-none text-red-600 dark:text-red-400">
                  {t('userProfile.medicalCert')}
                </label>
              </div>
              {aptitudeMedicaleDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={aptitudeMedicaleDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{t('userProfile.medicalCertDoc')}</a>
                </div>
              )}
            </div>
          )}

          {/* Push Notifications Configuration */}
          {messaging && (
            <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1 text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Notifications Push
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-black/10 p-2.5 rounded border border-dashed border-encre-noire/10 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Statut des notifications de l'appareil :</span>
                  <span className="font-semibold text-[10px]">
                    {notificationPermission === 'granted' ? (
                      <span className="text-green-700">🟢 Activées</span>
                    ) : notificationPermission === 'denied' ? (
                      <span className="text-red-600">🔴 Bloquées par le navigateur</span>
                    ) : (
                      <span className="opacity-75">⏳ Non configurées</span>
                    )}
                  </span>
                </div>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    disabled={isSubscribingPush}
                    onClick={handleEnableNotifications}
                    className="text-[10px] font-black uppercase bg-[#d99f4d]/85 hover:bg-[#d99f4d] text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isSubscribingPush ? "Activation..." : "🔔 Activer les notifications"}
                  </button>
                )}
              </div>
            </div>
          )}
        </CordelCard>

        {/* Validation Button */}
        <CordelButton 
          type="submit"
          variant="ocre" 
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3"
        >
          {saving ? t('userProfile.saving') : t('userProfile.saveBtn')}
        </CordelButton>
      </form>

      {/* Section Mon Matériel */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <XiloCaixa size={14} /> {t('userProfile.instrumentsHeading')}
        </h4>
        
        {loadingInst ? (
          <div className="flex justify-center items-center py-4">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (() => {
          const personal = myInstruments.filter(inst => inst.proprietaire === user.uid);
          const borrowed = myInstruments.filter(inst => 
            (inst.status === 'Emprunté' && inst.borrowedBy === user.uid) ||
            (inst.proprietaire === 'Association' && inst.localisationPhysique === user.uid)
          );
          const localAssigned = myInstruments.filter(inst => inst.localisationPhysique === 'Local' && Array.isArray(inst.assignations) && inst.assignations.includes(user.uid));
          
          return (
            <div className="flex flex-col gap-3.5">
              {/* 1. Instruments Personnels */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.personalInsts')} ({personal.length})
                </span>
                {personal.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noPersonal')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {personal.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={INSTRUMENT_ICONS[inst.type] || 'favicon.svg'} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[6px] rotate-2`}>
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Matériel Emprunté */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.borrowedInsts')} ({borrowed.length})
                </span>
                {borrowed.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noBorrowed')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {borrowed.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg-light/40 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={INSTRUMENT_ICONS[inst.type] || 'favicon.svg'} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-dark'} text-[6px] -rotate-1`}>
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Instruments assignés au local */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.localAssignedInsts')} ({localAssigned.length})
                </span>
                {localAssigned.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noLocal')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {localAssigned.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg-light/40 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={INSTRUMENT_ICONS[inst.type] || 'favicon.svg'} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[6px] rotate-3">
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Disconnect & PWA Emergency Clean Buttons */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 items-center">
        <CordelButton 
          type="button"
          variant="ocre"
          onClick={handleForceUpdate}
          useExtremeBorder={true}
          className="w-full py-3 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
        >
          ⚡ {t('pwa.forceUpdateBtn')}
        </CordelButton>
        <CordelButton 
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
        >
          🚪 {t('userProfile.disconnectBtn')}
        </CordelButton>
      </div>

      {/* Editor Modal Overlay */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--cordel-bg)] max-w-md w-full rounded-lg shadow-xl overflow-hidden relative border-4 border-encre-noire max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <CordelImageEditor 
                imageSrc={selectedImage}
                lang={locale}
                onComplete={handleEditorComplete}
                onCancel={() => {
                  setShowEditor(false);
                  setSelectedImage(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
