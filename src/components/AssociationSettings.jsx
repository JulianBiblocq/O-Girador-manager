import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloSettings } from './XiloIcons';
import PlacesAutocomplete from './PlacesAutocomplete';

export const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Partitions', nom: 'Partitions', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Tutoriels', nom: 'Tutoriels', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true }
];

export default function AssociationSettings({ groupId, onBack, role, isSystemAdmin }) {
  const { t } = useTranslation();
  const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

  const [fieldsConfig, setFieldsConfig] = useState(DEFAULT_FIELDS_CONFIG);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState([]);
  const [newInstrument, setNewInstrument] = useState('');
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [newPupitreName, setNewPupitreName] = useState('');
  const [selectedInstrumentsForLink, setSelectedInstrumentsForLink] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatUpload, setNewCatUpload] = useState(false);
  const [newCatUploadUrl, setNewCatUploadUrl] = useState('');
  const [newCatArchive, setNewCatArchive] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [colors, setColors] = useState({
    primary: '#d99f4d',
    secondary: '#84967a',
    background: '#f4ecd8',
    text: '#1a1a1a'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sequenceurUrl, setSequenceurUrl] = useState('');
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [droitImageFile, setDroitImageFile] = useState(null);
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [aptitudeMedicaleFile, setAptitudeMedicaleFile] = useState(null);
  const [majoriteFeminine, setMajoriteFeminine] = useState(false);
  const [indemniteKilometrique, setIndemniteKilometrique] = useState(0);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [montantAdhesion, setMontantAdhesion] = useState(0);
  const [optionsCotisation, setOptionsCotisation] = useState([]);
  const [lienPaiementExterne, setLienPaiementExterne] = useState('');
  const [instructionsPaiement, setInstructionsPaiement] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Sync association settings
  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.fieldsConfig) {
          // Merge defaults with existing config to ensure new fields (like lateralite) are present
          const merged = { ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig };
          setFieldsConfig(merged);
        } else {
          setFieldsConfig(DEFAULT_FIELDS_CONFIG);
        }

        if (Array.isArray(data.instrumentsDisponibles)) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        } else {
          setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
        }

        if (Array.isArray(data.linkedInstruments)) {
          const normalized = data.linkedInstruments.map(link => {
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
          }).filter(Boolean);
          setLinkedInstruments(normalized);
        } else {
          setLinkedInstruments([]);
        }

        if (Array.isArray(data.varalCategories)) {
          setVaralCategories(data.varalCategories);
        } else {
          setVaralCategories(DEFAULT_VARAL_CATEGORIES);
        }

        if (data.branding) {
          setLogoUrl(data.branding.logoUrl || '');
          if (data.branding.colors) {
            setColors({
              primary: data.branding.colors.primary || '#d99f4d',
              secondary: data.branding.colors.secondary || '#84967a',
              background: data.branding.colors.background || '#f4ecd8',
              text: data.branding.colors.text || '#1a1a1a'
            });
          }
        }
        setSequenceurUrl(data.sequenceurUrl || '');
        setDroitImageDocUrl(data.droitImageDocUrl || '');
        setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
        setMajoriteFeminine(data.majoriteFeminine || false);
        setIndemniteKilometrique(data.indemniteKilometrique || 0);
        setAdresseLocal(data.adresseLocal || '');
        
        const adhesionVal = data.montantAdhesion !== undefined ? data.montantAdhesion : (data.montantCotisation || 0);
        setMontantAdhesion(adhesionVal);
        setOptionsCotisation(Array.isArray(data.optionsCotisation) ? data.optionsCotisation : []);
        setLienPaiementExterne(data.lienPaiementExterne || '');
        setInstructionsPaiement(data.instructionsPaiement || '');
      }
      setLoading(false);
    }, (error) => {
      console.error("AssociationSettings - Erreur onSnapshot association :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  const handleToggleEnable = (key) => {
    setFieldsConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled
      }
    }));
  };

  const handleFilledByChange = (key, value) => {
    setFieldsConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        filledBy: value
      }
    }));
  };
  const handleAddInstrument = () => {
    const trimmed = newInstrument.trim();
    if (!trimmed) return;
    if (instrumentsDisponibles.includes(trimmed)) {
      alert("Cet instrument existe déjà !");
      return;
    }
    setInstrumentsDisponibles(prev => [...prev, trimmed]);
    setNewInstrument('');
  };

  const handleRemoveInstrument = (instToRemove) => {
    setInstrumentsDisponibles(prev => prev.filter(i => i !== instToRemove));
    // Also clean up any links containing this instrument
    setLinkedInstruments(prev => prev.filter(group => {
      const insts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      return !insts.includes(instToRemove);
    }));
  };

  const handleLinkInstruments = () => {
    if (selectedInstrumentsForLink.length < 2) return;
    
    const sortedGroup = [...selectedInstrumentsForLink].sort();
    
    const exists = linkedInstruments.some(group => {
      const g = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      if (g.length !== sortedGroup.length) return false;
      const sortedG = [...g].sort();
      return sortedG.every((val, index) => val === sortedGroup[index]);
    });
    
    if (exists) {
      alert("Cette liaison existe déjà !");
      return;
    }
    
    const pupitreObj = {
      name: newPupitreName.trim(),
      instruments: sortedGroup
    };
    
    setLinkedInstruments(prev => [...prev, pupitreObj]);
    setSelectedInstrumentsForLink([]);
    setNewPupitreName('');
  };

  const handleRemoveLink = (indexToRemove) => {
    setLinkedInstruments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      nom: newCatName.trim(),
      activerUploadPublic: newCatUpload,
      lienUploadPublic: newCatUpload ? newCatUploadUrl.trim() : '',
      activerOpaciteArchive: newCatArchive
    };
    setVaralCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatUpload(false);
    setNewCatUploadUrl('');
    setNewCatArchive(false);
  };

  const handleRemoveCategory = (id) => {
    const msg = t('documents.varalSettingsRemoveConfirm') || "Êtes-vous sûr de vouloir supprimer cette corde ? Les documents liés ne seront pas supprimés mais n'auront plus de catégorie associée.";
    if (window.confirm(msg)) {
      setVaralCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = async () => {
    if (!groupId) return;

    setSaving(true);
    let finalLogoUrl = logoUrl;
    let finalDroitImageDocUrl = droitImageDocUrl;
    let finalAptitudeMedicaleDocUrl = aptitudeMedicaleDocUrl;

    try {
      if (logoFile && logoFile instanceof File) {
        setUploadingLogo(true);
        const storageRef = ref(storage, `brandings/${groupId}/logo.png`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
        setLogoUrl(finalLogoUrl);
        setLogoFile(null);
      }

      if (droitImageFile && droitImageFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/droit_image.pdf`);
        const snap = await uploadBytes(docRef, droitImageFile);
        finalDroitImageDocUrl = await getDownloadURL(snap.ref);
        setDroitImageDocUrl(finalDroitImageDocUrl);
        setDroitImageFile(null);
      }

      if (aptitudeMedicaleFile && aptitudeMedicaleFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/aptitude_medicale.pdf`);
        const snap = await uploadBytes(docRef, aptitudeMedicaleFile);
        finalAptitudeMedicaleDocUrl = await getDownloadURL(snap.ref);
        setAptitudeMedicaleDocUrl(finalAptitudeMedicaleDocUrl);
        setAptitudeMedicaleFile(null);
      }

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        fieldsConfig: fieldsConfig,
        instrumentsDisponibles: instrumentsDisponibles,
        linkedInstruments: linkedInstruments,
        varalCategories: varalCategories,
        sequenceurUrl: sequenceurUrl,
        branding: {
          logoUrl: finalLogoUrl,
          colors: colors
        },
        droitImageDocUrl: finalDroitImageDocUrl,
        aptitudeMedicaleDocUrl: finalAptitudeMedicaleDocUrl,
        majoriteFeminine: majoriteFeminine,
        indemniteKilometrique: indemniteKilometrique,
        adresseLocal: adresseLocal,
        montantCotisation: montantAdhesion,
        montantAdhesion: montantAdhesion,
        optionsCotisation: optionsCotisation,
        lienPaiementExterne: lienPaiementExterne,
        instructionsPaiement: instructionsPaiement
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

  if (!isAuthorized) {
    return (
      <>
        <div className="text-center py-12 select-none">
          <CordelCard variant="default" useExtremeBorder={true} className="p-8">
            <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
            <p className="text-xs opacity-75 mt-3 leading-relaxed">
              Vous devez être administrateur pour configurer les paramètres de l'association.
            </p>
            <div className="mt-6 flex justify-center">
              <CordelButton variant="default" onClick={onBack} className="text-xs">
                ⬅️ Retour
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 text-left select-none max-w-3xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            ⬅️ Retour
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center">
            <XiloSettings size={14} className="inline mr-1.5" /> {t('associationSettings.title') || "Paramètres Association"}
          </h2>
        </div>

        {/* Info card */}
        <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          🔧 Personnalisez l'identité visuelle de votre association et configurez les champs requis pour le profil de vos adhérents.
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Branding Identité Visuelle */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🎨 Identité Visuelle & Thème
              </h3>

              {/* Logo Section */}
              <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Logo de l'Association</span>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-12 h-12 object-contain border border-encre-noire/30 rounded bg-white p-1" 
                    />
                  ) : (
                    <div className="w-12 h-12 border border-dashed border-encre-noire/30 rounded flex items-center justify-center text-[10px] text-cordel-master-dark opacity-50 bg-white font-semibold">
                      Aucun
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      disabled={saving}
                      className="text-[9px] font-bold"
                    />
                    {logoFile && (
                      <span className="text-[9px] text-green-600 font-bold">
                        ✓ Sélectionné : {logoFile.name}
                      </span>
                    )}
                    {uploadingLogo && (
                      <span className="text-[9px] text-cordel-wood animate-pulse font-bold">
                        Envoi du logo...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Colors Pickers Grid */}
              <div className="flex flex-col gap-2 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Thème de Couleurs</span>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary Color */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={colors.primary}
                      onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                      disabled={saving}
                      className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold text-cordel-wood">Primaire</span>
                      <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.primary}</span>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={colors.secondary}
                      onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                      disabled={saving}
                      className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold text-cordel-wood">Secondaire</span>
                      <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.secondary}</span>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={colors.background}
                      onChange={(e) => setColors(prev => ({ ...prev, background: e.target.value }))}
                      disabled={saving}
                      className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold text-cordel-wood">Fond d'écran</span>
                      <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.background}</span>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={colors.text}
                      onChange={(e) => setColors(prev => ({ ...prev, text: e.target.value }))}
                      disabled={saving}
                      className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold text-cordel-wood">Texte</span>
                      <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CordelCard>

            {/* Documents de l'Association card */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                📋 Documents de l'Association (RGPD & Médical)
              </h3>

              {/* Droit à l'image Doc */}
              <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Charte de Droit à l'image (PDF)</span>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setDroitImageFile(e.target.files?.[0] || null)}
                    disabled={saving}
                    className="text-[9px] font-bold"
                  />
                  {droitImageFile && (
                    <span className="text-[9px] text-green-600 font-bold">
                      ✓ Sélectionné : {droitImageFile.name}
                    </span>
                  )}
                  {droitImageDocUrl && (
                    <a 
                      href={droitImageDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] text-cordel-wood hover:underline font-bold"
                    >
                      Voir le document en ligne
                    </a>
                  )}
                </div>
              </div>

              {/* Aptitude médicale Doc */}
              <div className="flex flex-col gap-2 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Modèle de certificat médical / Règlement santé (PDF)</span>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setAptitudeMedicaleFile(e.target.files?.[0] || null)}
                    disabled={saving}
                    className="text-[9px] font-bold"
                  />
                  {aptitudeMedicaleFile && (
                    <span className="text-[9px] text-green-600 font-bold">
                      ✓ Sélectionné : {aptitudeMedicaleFile.name}
                    </span>
                  )}
                  {aptitudeMedicaleDocUrl && (
                    <a 
                      href={aptitudeMedicaleDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] text-cordel-wood hover:underline font-bold"
                    >
                      Voir le document en ligne
                    </a>
                  )}
                </div>
              </div>
            </CordelCard>

            {/* Pupitres & Instruments section */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🥁 Pupitres & Instruments
              </h3>
              
              <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Ajouter un instrument</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    placeholder="Ex: Agbê, Chant..."
                    className="theme-input text-xs font-bold py-1.5 flex-1 bg-cordel-bg-light"
                  />
                  <CordelButton 
                    variant="ocre"
                    useExtremeBorder={true}
                    onClick={handleAddInstrument}
                    disabled={saving}
                    className="text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
                  >
                    + Ajouter
                  </CordelButton>
                </div>
              </div>

              {/* Instruments list */}
              <div className="flex flex-col gap-2 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Instruments configurés</span>
                {instrumentsDisponibles.length === 0 ? (
                  <span className="text-[10px] italic opacity-60">Aucun instrument configuré.</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {instrumentsDisponibles.map((inst, index) => (
                      <span 
                        key={inst + index}
                        className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1.5"
                      >
                        {inst}
                        <button 
                          type="button"
                          onClick={() => handleRemoveInstrument(inst)}
                          className="text-[9px] hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
             </CordelCard>

            {/* Instruments Liés / Jumelés */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🔗 {t('associationSettings.linkedInstrumentsHeading') || "Instruments Liés / Pupitres"}
              </h3>
              
              {/* Form to link instruments */}
              <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-cordel-master-dark/15 text-xs">
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Nom du Pupitre (Optionnel - ex: Alfaias, Sementes...)
                    </label>
                    <input 
                      type="text"
                      value={newPupitreName}
                      onChange={(e) => setNewPupitreName(e.target.value)}
                      placeholder="Saisissez un nom de pupitre personnalisé..."
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark mb-1">
                      {t('associationSettings.selectInstrumentsForGroup') || "Sélectionner les instruments du pupitre (minimum 2)"}
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border-2 border-dashed border-[var(--cordel-border)] rounded-[4px_8px_3px_6px] bg-[var(--cordel-master-bg)] max-h-40 overflow-y-auto">
                      {instrumentsDisponibles.map(inst => {
                        const isSelected = selectedInstrumentsForLink.includes(inst);
                        return (
                          <label 
                            key={inst} 
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px_8px_3px_6px] border border-[var(--cordel-border)] cursor-pointer select-none text-[10px] font-bold transition-all ${
                              isSelected 
                                ? 'bg-[var(--cordel-wood)] text-white shadow-sm' 
                                : 'bg-[var(--cordel-bg)] text-[var(--cordel-text)] opacity-75 hover:opacity-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedInstrumentsForLink(prev => prev.filter(i => i !== inst));
                                } else {
                                  setSelectedInstrumentsForLink(prev => [...prev, inst]);
                                }
                              }}
                              className="hidden"
                            />
                            {inst}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <CordelButton 
                    type="button"
                    variant="ocre"
                    useExtremeBorder={true}
                    onClick={handleLinkInstruments}
                    disabled={saving || selectedInstrumentsForLink.length < 2}
                    className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
                  >
                    Créer le Pupitre
                  </CordelButton>
                </div>
              </div>

              {/* Display configured groups */}
              <div className="flex flex-col gap-2 mt-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
                  Pupitres configurés
                </span>
                {linkedInstruments.length === 0 ? (
                  <span className="text-[10px] italic opacity-60">
                    Aucun pupitre configuré pour le moment.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {linkedInstruments.map((group, index) => {
                      const instrumentsArray = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
                      const groupLabel = group.name 
                        ? `${group.name} (${instrumentsArray.join(' + ')})` 
                        : instrumentsArray.join(' + ');
                      return (
                        <span 
                          key={index}
                          className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1.5"
                        >
                          {groupLabel}
                          <button 
                            type="button"
                            onClick={() => handleRemoveLink(index)}
                            className="text-[9px] hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </CordelCard>

            {/* Varal Categories Settings Card */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🔗 {t('documents.varalSettingsTitle') || "Catégories du Varal (Fils)"}
              </h3>
              
              {/* Form to add a new category */}
              <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-cordel-master-dark/15 text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('documents.varalSettingsNameLabel') || "Nom de la catégorie (ex: Prestations, Danses)"}
                    </label>
                    <input 
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder={t('documents.varalSettingsNamePlaceholder') || "Nom..."}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="flex items-center gap-2 font-bold text-[10px] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newCatUpload}
                        onChange={(e) => setNewCatUpload(e.target.checked)}
                        className="scale-95 cursor-pointer"
                      />
                      <span>{t('documents.varalSettingsUploadLabel') || "Activer l'upload public (Lien externe)"}</span>
                    </label>
                    {newCatUpload && (
                      <input 
                        type="url"
                        value={newCatUploadUrl}
                        onChange={(e) => setNewCatUploadUrl(e.target.value)}
                        placeholder={t('documents.varalSettingsUploadUrlLabel') || "Lien d'upload (Drive, Dropbox...)"}
                        className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full mt-1.5"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-left mt-1">
                    <label className="flex items-center gap-2 font-bold text-[10px] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newCatArchive}
                        onChange={(e) => setNewCatArchive(e.target.checked)}
                        className="scale-95 cursor-pointer"
                      />
                      <span>{t('documents.varalSettingsArchiveLabel') || "Archiver visuellement (opacité réduite si année antérieure)"}</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end mt-1">
                  <CordelButton 
                    type="button"
                    variant="ocre"
                    useExtremeBorder={true}
                    onClick={handleAddCategory}
                    disabled={saving || !newCatName.trim() || (newCatUpload && !newCatUploadUrl.trim())}
                    className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
                  >
                    {t('documents.varalSettingsAddBtn') || "+ Ajouter"}
                  </CordelButton>
                </div>
              </div>

              {/* Display list of configured categories */}
              <div className="flex flex-col gap-2 mt-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
                  {t('documents.varalSettingsConfigured') || "Cordes configurées"}
                </span>
                {varalCategories.length === 0 ? (
                  <span className="text-[10px] italic opacity-60">
                    {t('documents.varalSettingsEmpty') || "Aucune catégorie configurée."}
                  </span>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {varalCategories.map((cat) => (
                      <div 
                        key={cat.id}
                        className="border border-encre-noire/15 p-2.5 rounded bg-white/40 dark:bg-black/10 flex justify-between items-center text-xs"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-encre-noire">{cat.nom}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1 text-[8px] font-black uppercase text-cordel-wood">
                            {cat.activerUploadPublic && (
                              <span className="px-1 bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-sm">
                                📤 Public
                              </span>
                            )}
                            {cat.activerOpaciteArchive && (
                              <span className="px-1 bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 rounded-sm">
                                ⏳ Opacité Archive
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveCategory(cat.id)}
                          className="text-xs hover:text-red-500 font-bold px-2 py-1 cursor-pointer select-none"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CordelCard>

            {/* Séquenceur Roda Link */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🎛️ Lien du Séquenceur
              </h3>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  URL Racine du Séquenceur de l'association
                </label>
                <input 
                  type="url"
                  value={sequenceurUrl}
                  onChange={(e) => setSequenceurUrl(e.target.value)}
                  placeholder="ex: https://mon-sequenceur.app"
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
              </div>
            </CordelCard>

            {/* Invitation Link Card */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                📨 Invitation au groupe
              </h3>
              <div className="flex flex-col gap-2.5 text-left">
                <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                  Permettez aux nouveaux membres de s'inscrire et de rejoindre directement votre association en partageant ce lien d'invitation unique.
                </p>
                <CordelButton
                  variant="ocre"
                  useExtremeBorder={true}
                  onClick={async () => {
                    const invitationUrl = `${window.location.origin}/?groupe=${groupId}`;
                    const shareText = `Rejoins notre groupe sur O Girador Manager : ${invitationUrl}`;
                    try {
                      await navigator.clipboard.writeText(shareText);
                      alert("Lien d'invitation copié dans le presse-papiers !");
                    } catch (err) {
                      console.error("Erreur lors de la copie :", err);
                      alert("Impossible de copier le lien automatiquement. Voici le lien d'invitation : " + invitationUrl);
                    }
                  }}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  📋 Copier le lien d'invitation
                </CordelButton>
              </div>
            </CordelCard>

            {/* Options d'affichage & terminologie */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🗣️ Terminologie & Rendu
              </h3>
              <div className="flex flex-col gap-1 text-left">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={majoriteFeminine}
                    onChange={(e) => setMajoriteFeminine(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-encre-noire">
                      Groupe à majorité féminine (Appliquer le féminin sur les textes au pluriel)
                    </span>
                    <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
                      Active le pluriel féminin pour les termes généraux (ex: "Toutes les inscrites", "Les batuqueiras"). Les rôles individuels restent fidèles au genre de chaque membre.
                    </span>
                  </div>
                </label>
              </div>
            </CordelCard>

            {/* Indemnité Kilométrique & Point de Départ */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🚗 Indemnité Kilométrique & Point de Départ
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    Tarif de remboursement par kilomètre (€/km)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={indemniteKilometrique}
                    onChange={(e) => setIndemniteKilometrique(parseFloat(e.target.value) || 0)}
                    placeholder="ex: 0.40"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left border-t border-dashed border-cordel-master-dark/15 pt-3">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    Adresse du local / Point de rassemblement par défaut
                  </label>
                  <PlacesAutocomplete 
                    name="adresseLocal"
                    value={adresseLocal}
                    onChange={(e) => setAdresseLocal(e.target.value)}
                    placeholder="ex: 12 Rue du Maracatu, 75000 Paris"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                  />
                </div>
              </div>
            </CordelCard>

            {/* Trésorerie Section */}
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
                🪙 Trésorerie (Cotisations)
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    Montant de l'Adhésion de base (€) (Fixe)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={montantAdhesion}
                    onChange={(e) => setMontantAdhesion(parseFloat(e.target.value) || 0)}
                    placeholder="ex: 30"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                    Options de Cotisations supplémentaires
                  </span>
                  
                  {optionsCotisation.map((opt, idx) => (
                    <div key={opt.id || idx} className="flex gap-2 items-center bg-white/40 dark:bg-black/10 p-2 rounded border border-dashed border-cordel-master-dark/15">
                      <input 
                        type="text"
                        value={opt.nom}
                        onChange={(e) => {
                          const updated = [...optionsCotisation];
                          updated[idx].nom = e.target.value;
                          setOptionsCotisation(updated);
                        }}
                        placeholder="Ex: Percussions"
                        className="theme-input text-xs font-bold py-1 bg-cordel-bg-light flex-1"
                      />
                      <input 
                        type="number"
                        min="0"
                        value={opt.montant}
                        onChange={(e) => {
                          const updated = [...optionsCotisation];
                          updated[idx].montant = parseFloat(e.target.value) || 0;
                          setOptionsCotisation(updated);
                        }}
                        placeholder="Montant"
                        className="theme-input text-xs font-bold py-1 bg-cordel-bg-light w-20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsCotisation(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 font-bold px-2 text-xs cursor-pointer select-none"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-start mt-1">
                    <CordelButton 
                      type="button"
                      variant="ocre"
                      onClick={() => {
                        setOptionsCotisation(prev => [...prev, { id: `cot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, nom: '', montant: 0 }]);
                      }}
                      className="text-[9px] py-1 px-2.5 uppercase font-bold tracking-wider"
                    >
                      + Ajouter une cotisation
                    </CordelButton>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    Lien de paiement externe (HelloAsso, PayPal...)
                  </label>
                  <input 
                    type="url"
                    value={lienPaiementExterne}
                    onChange={(e) => setLienPaiementExterne(e.target.value || '')}
                    placeholder="https://helloasso.com/associations/..."
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    Instructions de paiement
                  </label>
                  <textarea 
                    rows={4}
                    value={instructionsPaiement}
                    onChange={(e) => setInstructionsPaiement(e.target.value || '')}
                    placeholder="Expliquez comment payer (chèque, virement, précisez la référence de paiement...)"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full resize-y min-h-[80px]"
                  />
                </div>
              </div>
            </CordelCard>

            {/* Separator or Header */}
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-master-dark opacity-75 mt-3 pl-1">
              ⚙️ Gestion des Champs
            </h3>

            <div className="flex flex-col gap-3">
            {Object.values(fieldsConfig).map((field) => (
              <CordelCard 
                key={field.key} 
                variant={field.enabled ? "default" : "default"}
                useExtremeBorder={false}
                className={`p-3.5 flex flex-col gap-2.5 bg-cordel-bg transition-opacity ${field.enabled ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-encre-noire">
                    {field.label}
                  </span>
                  
                  {/* Enable checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => handleToggleEnable(field.key)}
                      disabled={saving}
                      className="cursor-pointer"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Actif</span>
                  </label>
                </div>

                {field.enabled && (
                  <div className="flex items-center gap-3 border-t border-dashed border-cordel-master-dark/10 pt-2 mt-0.5">
                    <span className="text-[9px] font-semibold text-cordel-master-dark/85">Rempli par :</span>
                    <select
                      value={field.filledBy}
                      onChange={(e) => handleFilledByChange(field.key, e.target.value)}
                      disabled={saving}
                      className="theme-input text-[10px] font-bold py-1 px-2 flex-1 bg-cordel-bg-light"
                    >
                      <option value="member">L'adhérent (Profil & Inscription)</option>
                      <option value="admin">L'administrateur (Console Admin uniquement)</option>
                    </select>
                  </div>
                )}
              </CordelCard>
            ))}

            {/* Validation */}
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 mt-2 font-bold uppercase tracking-widest text-xs"
            >
              {saving ? "Enregistrement..." : "Enregistrer la configuration"}
            </CordelButton>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
