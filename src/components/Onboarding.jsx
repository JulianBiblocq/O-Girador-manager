import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meia", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Paroles", "Chant", "Danse"];

export default function Onboarding({ user, onComplete }) {
  // Split the Google Auth display name into a first name and a last name
  const nameParts = user.displayName ? user.displayName.split(' ') : [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: '',
    tailleTshirt: 'M',
    droitImage: true,
    aptitudeMedicale: false,
    lateralite: 'droitier',
    dateNaissance: '',
    instrument: 'Alfaia',
    publierTelephone: false,
    publierDateNaissance: false
  });

  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [submitting, setSubmitting] = useState(false);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');

  // Extract the group ID parameter from the URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const groupId = searchParams.get('groupe') || null;

  // Load custom fields configuration for Onboarding
  useEffect(() => {
    if (!groupId) {
      setFieldsConfig(DEFAULT_FIELDS_CONFIG);
      setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
      return;
    }

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'associations', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.fieldsConfig) {
            setFieldsConfig({ ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig });
          } else {
            setFieldsConfig(DEFAULT_FIELDS_CONFIG);
          }
          if (Array.isArray(data.instrumentsDisponibles)) {
            setInstrumentsDisponibles(data.instrumentsDisponibles);
            if (data.instrumentsDisponibles.length > 0) {
              setFormData(prev => ({ ...prev, instrument: data.instrumentsDisponibles[0] }));
            }
          } else {
            setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
          }
          setDroitImageDocUrl(data.droitImageDocUrl || '');
          setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
        } else {
          setFieldsConfig(DEFAULT_FIELDS_CONFIG);
          setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
        }
      } catch (err) {
        console.error("Onboarding - Erreur de fetch config :", err);
        setFieldsConfig(DEFAULT_FIELDS_CONFIG);
        setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
      }
    };
    fetchConfig();
  }, [groupId]);

  const isFieldVisible = (key) => {
    if (!fieldsConfig) return true; // show by default while loading
    const cfg = fieldsConfig[key];
    return cfg ? (cfg.enabled && cfg.filledBy === 'member') : true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Build the user document payload according to the specifications
      const userDoc = {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: user.email,
        telephone: isFieldVisible('telephone') ? formData.phone : "",
        tailleTshirt: isFieldVisible('tailleTshirt') ? formData.tailleTshirt : "M",
        droitImage: isFieldVisible('droitImage') ? formData.droitImage : true,
        aptitudeMedicale: isFieldVisible('aptitudeMedicale') ? formData.aptitudeMedicale : false,
        lateralite: isFieldVisible('lateralite') ? formData.lateralite : "droitier",
        dateNaissance: isFieldVisible('dateNaissance') ? formData.dateNaissance : "",
        instrument: formData.instrument || "Autre",
        role: "membre",
        statutActuel: "active",
        groupId: groupId,
        tags: [],
        publierTelephone: isFieldVisible('telephone') ? formData.publierTelephone : false,
        publierDateNaissance: isFieldVisible('dateNaissance') ? formData.publierDateNaissance : false
      };

      // 3. Write user document to Firestore using Auth UID as the key
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log("Onboarding - Profil créé avec succès dans Firestore !");

      // 4. Redirect the user by triggering the parent callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Onboarding - Erreur d'écriture dans Firestore :", error);
      alert("Erreur lors de l'enregistrement de votre profil. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutShell>
      <div className="text-center py-4 border-b-2 border-dashed border-cordel-master-dark/30">
        <h1 className="panel-title text-2xl font-extrabold tracking-wider text-cordel-wood">
          NOUVEAU PROFIL
        </h1>
        <p className="text-[10px] font-bold tracking-widest text-cordel-master-dark opacity-75 mt-1">
          INSCRIPTION • ÉTAPE 1 SUR 2
        </p>
      </div>

      <CordelCard variant="default" useExtremeBorder={true}>
        <h2 className="panel-title text-lg font-bold mb-2">Bienvenue dans l'association !</h2>
        <p className="text-xs leading-relaxed opacity-80 mb-6">
          Nous avons besoin de quelques informations pour compléter votre fiche de membre.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* First Name Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Prénom
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          {/* Last Name Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Nom
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          {/* Instrument Principal Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Instrument Principal
            </label>
            <select
              name="instrument"
              value={formData.instrument}
              onChange={handleChange}
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
            >
              {instrumentsDisponibles.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
              <option value="Autre">Autre</option>
            </select>
          </div>

           {isFieldVisible('telephone') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="publierTelephone"
                  checked={formData.publierTelephone}
                  onChange={handleChange}
                  disabled={submitting}
                />
                <span>Rendre mon téléphone public dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {/* T-Shirt Size Dropdown */}
          {isFieldVisible('tailleTshirt') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Taille de T-Shirt
              </label>
              <select
                name="tailleTshirt"
                value={formData.tailleTshirt}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          )}

          {/* Latéralité Dropdown */}
          {isFieldVisible('lateralite') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Latéralité (Main principale)
              </label>
              <select
                name="lateralite"
                value={formData.lateralite}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
              >
                <option value="droitier">Droitier</option>
                <option value="gaucher">Gaucher</option>
              </select>
            </div>
          )}

          {/* Date de Naissance Input */}
          {isFieldVisible('dateNaissance') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Date de naissance
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="publierDateNaissance"
                  checked={formData.publierDateNaissance}
                  onChange={handleChange}
                  disabled={submitting}
                />
                <span>Rendre ma date de naissance publique dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {/* Image Rights Checkbox */}
          {isFieldVisible('droitImage') && (
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="droitImage"
                  id="droitImage"
                  checked={formData.droitImage}
                  onChange={handleChange}
                  disabled={submitting}
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

          {/* Medical Aptitude Checkbox (Required) */}
          {isFieldVisible('aptitudeMedicale') && (
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="aptitudeMedicale"
                  id="aptitudeMedicale"
                  checked={formData.aptitudeMedicale}
                  onChange={handleChange}
                  required
                  disabled={submitting}
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

          <CordelButton 
            variant="ocre" 
            useExtremeBorder={true}
            className="w-full mt-4 py-3"
            disabled={submitting}
          >
            {submitting ? "Enregistrement..." : "Étape suivante"}
          </CordelButton>
        </form>
      </CordelCard>
    </LayoutShell>
  );
}
