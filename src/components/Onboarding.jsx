import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

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

const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

const AddressAutocomplete = React.lazy(() => import('./AddressAutocomplete'));

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
    genre: 'autre',
    afficherTelephone: true,
    afficherDateNaissance: false,
    visibiliteAdresse: 'complete',
    publierTelephone: true,
    publierDateNaissance: false
  });

  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
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
      setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
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
      // Build the user document payload according to the specifications
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
        instrument: formData.instrument || "",
        instrumentSecondaire: formData.instrumentSecondaire || "",
        voeuPrincipal: formData.voeuPrincipal || "",
        voeuSecondaire: formData.voeuSecondaire || "",
        voeuTertiaire: formData.voeuTertiaire || "",
        instrumentsJoues: Array.from(new Set([
          formData.instrument,
          formData.instrumentSecondaire,
          ...(formData.instrumentsJoues || [])
        ])).filter(Boolean),
        genre: formData.genre,
        role: "membre",
        statutActuel: "active",
        groupId: groupId,
        tags: [],
        afficherTelephone: Boolean(formData.afficherTelephone),
        afficherDateNaissance: Boolean(formData.afficherDateNaissance),
        visibiliteAdresse: formData.visibiliteAdresse || 'complete',
        publierTelephone: Boolean(formData.afficherTelephone),
        publierDateNaissance: Boolean(formData.afficherDateNaissance)
      };

      // 3. Write user document to Firestore using Auth UID as the key
      await setDoc(doc(db, 'users', user.uid), userDoc);

      // 4. Redirect the user by triggering the parent callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Onboarding - Erreur d'écriture dans Firestore :", error);
      alert(t('onboarding.errorSave') + " (" + error.message + ")");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="force-light-theme w-full flex flex-col min-h-screen">
      <LayoutShell logoUrl={branding?.logoUrl} forceLight={true}>
        <div className="text-center py-4 border-b-2 border-dashed border-cordel-master-dark/30">
        <h1 className="panel-title text-2xl font-extrabold tracking-wider text-cordel-wood">
          {t('onboarding.title')}
        </h1>
        <p className="text-[10px] font-bold tracking-widest text-cordel-master-dark opacity-75 mt-1">
          {t('onboarding.step')}
        </p>
      </div>

      <CordelCard variant="default" useExtremeBorder={true}>
        <h2 className="panel-title text-lg font-bold mb-2">{t('onboarding.welcome')}</h2>
        <p className="text-xs leading-relaxed opacity-80 mb-6">
          {t('onboarding.welcomeDesc')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {validationError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-bold rounded">
              ⚠️ {validationError}
            </div>
          )}

          {/* First Name Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('onboarding.firstName')} <span className="text-red-500 font-bold ml-0.5">*</span>
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
              {t('onboarding.lastName')} <span className="text-red-500 font-bold ml-0.5">*</span>
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

          {/* Souhaits d'Instruments / Casting */}
          <div className="border-t border-dashed border-cordel-master-dark/20 pt-3.5 flex flex-col gap-3 text-left">
            <h5 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              🎵 Quels instruments aimerais-tu jouer ?
            </h5>
            <p className="text-[10px] text-cordel-master-dark font-medium leading-relaxed bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/20 p-2.5 rounded">
              💡 Indique tes préférences. Le Mestre validera ton rôle définitif (Principal/Secondaire) en fonction de l'équilibre du groupe.
            </p>

            {/* Choix 1 */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Choix 1 (Vœu principal)
              </label>
              <select
                name="voeuPrincipal"
                value={formData.voeuPrincipal || ''}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light text-xs"
              >
                <option value="">-- Choisir un premier voeu --</option>
                {instrumentsDisponibles.map((inst) => (
                  <option key={`ob-v1-${inst}`} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            {/* Choix 2 */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Choix 2 (Vœu secondaire)
              </label>
              <select
                name="voeuSecondaire"
                value={formData.voeuSecondaire || ''}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 bg-cordel-bg-light text-xs"
              >
                <option value="">-- Aucun / Pas de second choix --</option>
                {instrumentsDisponibles.map((inst) => (
                  <option key={`ob-v2-${inst}`} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            {/* Choix 3 */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Choix 3 (Vœu tertiaire)
              </label>
              <select
                name="voeuTertiaire"
                value={formData.voeuTertiaire || ''}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 bg-cordel-bg-light text-xs"
              >
                <option value="">-- Aucun / Pas de troisième choix --</option>
                {instrumentsDisponibles.map((inst) => (
                  <option key={`ob-v3-${inst}`} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre / Civilité Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('onboarding.genre')}
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
            >
              <option value="homme">{t('onboarding.genderMale')}</option>
              <option value="femme">{t('onboarding.genderFemale')}</option>
              <option value="autre">{t('onboarding.genderOther')}</option>
            </select>
          </div>

           {isFieldVisible('telephone') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('onboarding.phone')}
                {isFieldRequired('telephone') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                required={isFieldRequired('telephone')}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="afficherTelephone"
                  checked={formData.afficherTelephone !== false}
                  onChange={handleChange}
                  disabled={submitting}
                />
                <span>Afficher mon téléphone dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {isFieldVisible('surnom') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('onboarding.surnom')}
                {isFieldRequired('surnom') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input
                type="text"
                name="surnom"
                placeholder="Surnom"
                value={formData.surnom}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>
          )}

          {isFieldVisible('adresse') && (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('onboarding.adresseRue') || "Numéro et Rue"}
                  {isFieldRequired('adresse') && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <React.Suspense fallback={
                  <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                    ⏳ Chargement de la recherche d'adresse...
                  </div>
                }>
                  <AddressAutocomplete
                    name="adresseRue"
                    value={formData.adresseRue}
                    onChange={handleChange}
                    onSelect={(addressData) => {
                      setFormData(prev => ({
                        ...prev,
                        adresseRue: addressData.street,
                        adresseCP: addressData.zipcode,
                        adresseVille: addressData.city
                      }));
                    }}
                    required={isFieldRequired('adresse')}
                    disabled={submitting}
                    placeholder="123 Rue de la Roda"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </React.Suspense>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('onboarding.adresseCP') || "Code Postal"}
                    {isFieldRequired('adresse') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="adresseCP"
                    placeholder="75000"
                    value={formData.adresseCP}
                    onChange={handleChange}
                    required={isFieldRequired('adresse')}
                    disabled={submitting}
                    className="theme-input w-full disabled:opacity-50 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('onboarding.adresseVille') || "Ville"}
                    {isFieldRequired('adresse') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="adresseVille"
                    placeholder="Paris"
                    value={formData.adresseVille}
                    onChange={handleChange}
                    required={isFieldRequired('adresse')}
                    disabled={submitting}
                    className="theme-input w-full disabled:opacity-50 font-semibold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Visibilité de l'adresse (Trombinoscope)
                </label>
                <select
                  name="visibiliteAdresse"
                  value={formData.visibiliteAdresse || 'complete'}
                  onChange={handleChange}
                  disabled={submitting}
                  className="theme-input w-full text-xs"
                >
                  <option value="complete">Adresse complète</option>
                  <option value="ville">Uniquement la ville</option>
                  <option value="masquee">Masquée</option>
                </select>
              </div>
            </div>
          )}

          {/* Section Mensurations */}
          {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
            <div className="flex flex-col gap-3.5 border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1.5 text-left w-full">
              <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px]">
                👔 Mensurations / Tailles pour les costumes (Optionnel)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* T-Shirt Size Dropdown */}
                {isFieldVisible('tailleTshirt') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('onboarding.tshirtSize')}
                      {isFieldRequired('tailleTshirt') && <span className="text-red-500 font-bold ml-1">*</span>}
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

                {/* Pantalon Size Dropdown */}
                {isFieldVisible('taillePantalon') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('onboarding.pantSize') || "Taille Pantalon"}
                      {isFieldRequired('taillePantalon') && <span className="text-red-500 font-bold ml-1">*</span>}
                    </label>
                    <select
                      name="taillePantalon"
                      value={formData.taillePantalon}
                      onChange={handleChange}
                      disabled={submitting}
                      className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Latéralité Dropdown */}
          {isFieldVisible('lateralite') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('onboarding.lateralite')}
                {isFieldRequired('lateralite') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <select
                name="lateralite"
                value={formData.lateralite}
                onChange={handleChange}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
              >
                <option value="droitier">{t('onboarding.handRight')}</option>
                <option value="gaucher">{t('onboarding.handLeft')}</option>
              </select>
            </div>
          )}

          {/* Date de Naissance Input */}
          {isFieldVisible('dateNaissance') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('onboarding.birthdate')}
                {isFieldRequired('dateNaissance') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required={isFieldRequired('dateNaissance')}
                disabled={submitting}
                className="theme-input w-full disabled:opacity-50 font-bold"
              />
              <label className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  name="afficherDateNaissance"
                  checked={Boolean(formData.afficherDateNaissance)}
                  onChange={handleChange}
                  disabled={submitting}
                />
                <span>Afficher ma date de naissance dans le Trombinoscope</span>
              </label>
            </div>
          )}

          {/* Image Rights Checkbox */}
          {demanderDroitImage && (
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
                  {t('onboarding.imageRights')}
                  {isFieldRequired('droitImage') && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
              </div>
              {droitImageDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={droitImageDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{t('onboarding.imageRightsDoc')}</a>
                </div>
              )}
            </div>
          )}

          {/* Medical Aptitude Checkbox (Required) */}
          {demanderAttestationSante && (
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="aptitudeMedicale"
                  id="aptitudeMedicale"
                  checked={formData.aptitudeMedicale}
                  onChange={handleChange}
                  required={demanderAttestationSante || isFieldRequired('aptitudeMedicale')}
                  disabled={submitting}
                  className="mt-1"
                />
                <label htmlFor="aptitudeMedicale" className="text-xs font-bold leading-snug cursor-pointer select-none text-red-600">
                  {t('onboarding.medicalCert')}
                  {(demanderAttestationSante || isFieldRequired('aptitudeMedicale')) && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
              </div>
              {aptitudeMedicaleDocUrl && (
                <div className="pl-6 text-[10px] font-bold">
                  📄 <a href={aptitudeMedicaleDocUrl} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{t('onboarding.medicalCertDoc')}</a>
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
            {submitting ? t('onboarding.saving') : t('onboarding.nextStep')}
          </CordelButton>
        </form>
      </CordelCard>
    </LayoutShell>
    </div>
  );
}
