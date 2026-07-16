import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, auth, storage } from '../firebase';
import XiloAvatar from './XiloAvatar';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloSun, XiloMoon } from './XiloIcons';

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
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export default function UserProfile({ user, profileData, onBack }) {
  const [formData, setFormData] = useState({
    prenom: profileData?.prenom || '',
    nom: profileData?.nom || '',
    instrument: profileData?.instrument || 'Autre',
    telephone: profileData?.telephone || '',
    tailleTshirt: profileData?.tailleTshirt || 'M',
    droitImage: profileData?.droitImage !== undefined ? profileData.droitImage : true,
    aptitudeMedicale: profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false,
    lateralite: profileData?.lateralite || 'droitier',
    dateNaissance: profileData?.dateNaissance || '',
    publierTelephone: profileData?.publierTelephone !== undefined ? profileData.publierTelephone : false,
    publierDateNaissance: profileData?.publierDateNaissance !== undefined ? profileData.publierDateNaissance : false
  });
  
  const DEFAULT_INSTRUMENTS = ["Alfaia", "Caixa", "Gonguê", "Agbê", "Mineiro", "Timbal", "Paroles", "Chant", "Danse"];

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [myInstruments, setMyInstruments] = useState([]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);

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

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true; // show by default while loading
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member') : true;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingPhoto(true);

    try {
      // 1. Read file as image and compress/resize to 256x256 using Canvas API
      const compressedBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas toBlob failed"));
              }
            }, 'image/jpeg', 0.8);
          };
          img.onerror = () => reject(new Error("Image loading failed"));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });

      // 2. Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/profile_pic_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 3. Save to Firestore users collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      alert("Photo de profil mise à jour avec succès !");
    } catch (err) {
      console.error("UserProfile - Erreur d'upload de photo :", err);
      alert("Erreur lors du téléversement de la photo.");
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
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        prenom: formData.prenom,
        nom: formData.nom,
        instrument: formData.instrument,
        telephone: isFieldVisible('telephone') ? formData.telephone : (profileData?.telephone || ''),
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : (profileData?.tailleTshirt || 'M'),
        droitImage: isFieldVisible('droitImage') ? formData.droitImage : (profileData?.droitImage !== undefined ? profileData.droitImage : true),
        aptitudeMedicale: isFieldVisible('aptitudeMedicale') ? formData.aptitudeMedicale : (profileData?.aptitudeMedicale !== undefined ? profileData.aptitudeMedicale : false),
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : (profileData?.lateralite || 'droitier'),
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : (profileData?.dateNaissance || ''),
        publierTelephone: isFieldVisible('telephone') ? formData.publierTelephone : false,
        publierDateNaissance: isFieldVisible('dateNaissance') ? formData.publierDateNaissance : false
      });
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("UserProfile - Erreur lors de la sauvegarde :", error);
      alert("Erreur lors de l'enregistrement de vos modifications.");
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

  const fullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`;

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ⬅️ Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          Mon Profil
        </span>
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="theme-btn px-2.5 py-1 text-xs font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center min-w-8 min-h-7"
          title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? <XiloSun size={14} /> : <XiloMoon size={14} />}
        </button>
      </div>

      {/* Avatar Container in Center */}
      <div className="flex flex-col items-center gap-3 py-4 select-none">
        <div className="relative">
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={110} />
          {/* Decorative stamp on avatar */}
          <div className="absolute -bottom-1 -right-2 z-20 flex flex-col gap-1 items-end select-none">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-12">
              {profileData?.role || 'membre'}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] -rotate-6">
              {profileData?.niveau === 'confirme' ? '🏆 Confirmé' : '🌱 Débutant'}
            </span>
          </div>
        </div>

        {/* Upload picture button */}
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
            {uploadingPhoto ? "⏳ Téléversement..." : "📸 Changer ma photo"}
            <input 
              type="file" 
              accept="image/*"
              disabled={uploadingPhoto || saving}
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          <span className="text-[9px] font-bold tracking-widest text-cordel-master-dark opacity-60 break-all px-4 text-center">
            {user.email}
          </span>
        </div>
      </div>

      {/* Profile Modification Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1">
            Informations personnelles
          </h4>

          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Prénom de l'adhérent
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre prénom (ex : Manoel)"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Nom de famille
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Entrez votre nom de famille (ex : Silva)"
              className="theme-input w-full disabled:opacity-50 text-xs font-bold"
            />
          </div>

          {/* Instrument Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Instrument Principal pratiqué
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
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Level Info display */}
          <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Niveau de Pratique (Maracatu)
            </span>
            <span className="text-xs font-bold text-encre-noire bg-cordel-bg-light py-1.5 px-3 rounded border border-encre-noire/25 w-full inline-block">
              {profileData?.niveau === 'confirme' ? '🏆 Confirmé' : '🌱 Débutant'}
            </span>
          </div>

           {isFieldVisible('telephone') && (
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Numéro de Téléphone
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
                <span>Rendre mon téléphone public dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {/* Taille T-Shirt */}
          {isFieldVisible('tailleTshirt') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Taille de T-Shirt
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
                Latéralité (Main principale)
              </label>
              <select
                name="lateralite"
                value={formData.lateralite}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-bg-light"
              >
                <option value="droitier">Droitier</option>
                <option value="gaucher">Gaucher</option>
              </select>
            </div>
          )}

          {/* Date de Naissance */}
          {isFieldVisible('dateNaissance') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Date de naissance
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
                <span>Rendre ma date de naissance publique dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {/* Droit à l'image Checkbox */}
          {isFieldVisible('droitImage') && (
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
                  J'autorise l'association à utiliser mon image sur ses supports de communication (photos, vidéos).
                </label>
              </div>
              {droitImageDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={droitImageDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">Lire la charte de droit à l'image</a>
                </div>
              )}
            </div>
          )}

          {/* Aptitude Médicale Checkbox (Required) */}
          {isFieldVisible('aptitudeMedicale') && (
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
                  * Je certifie sur l'honneur être médicalement apte à la pratique du Maracatu.
                </label>
              </div>
              {aptitudeMedicaleDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={aptitudeMedicaleDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">Lire le règlement de santé / certificat type</a>
                </div>
              )}
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
          {saving ? "Enregistrement en cours..." : "Enregistrer mes modifications"}
        </CordelButton>
      </form>

      {/* Section Mon Matériel */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
          🥁 Mon Matériel & Assignations
        </h4>
        
        {loadingInst ? (
          <div className="flex justify-center items-center py-4">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (() => {
          const personal = myInstruments.filter(inst => inst.proprietaire === user.uid);
          const borrowed = myInstruments.filter(inst => inst.proprietaire === 'Association' && inst.localisationPhysique === user.uid);
          const localAssigned = myInstruments.filter(inst => inst.localisationPhysique === 'Local' && Array.isArray(inst.assignations) && inst.assignations.includes(user.uid));
          
          return (
            <div className="flex flex-col gap-3.5">
              {/* 1. Instruments Personnels */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  Mes instruments personnels ({personal.length})
                </span>
                {personal.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">Aucun instrument personnel enregistré.</p>
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
                  Matériel emprunté à la maison ({borrowed.length})
                </span>
                {borrowed.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">Aucun emprunt en cours.</p>
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
                  Mes instruments assignés au local ({localAssigned.length})
                </span>
                {localAssigned.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">Aucune assignation au local.</p>
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

      {/* Disconnect Button (Red / Swappable theme color using var(--cordel-wood)) */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col items-center">
        <CordelButton 
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
        >
          🚪 Se déconnecter
        </CordelButton>
      </div>
    </div>
  );
}
