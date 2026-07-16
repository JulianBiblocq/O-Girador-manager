import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export default function AssociationSettings({ groupId, onBack, role, isSystemAdmin }) {
  const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Paroles", "Chant", "Danse"];

  const [fieldsConfig, setFieldsConfig] = useState(DEFAULT_FIELDS_CONFIG);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState([]);
  const [newInstrument, setNewInstrument] = useState('');
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
        sequenceurUrl: sequenceurUrl,
        branding: {
          logoUrl: finalLogoUrl,
          colors: colors
        },
        droitImageDocUrl: finalDroitImageDocUrl,
        aptitudeMedicaleDocUrl: finalAptitudeMedicaleDocUrl
      }, { merge: true });
      alert("Réglages de l'association enregistrés avec succès !");
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
      <LayoutShell>
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
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="flex flex-col gap-4 text-left select-none">
        
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
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
            ⚙️ Paramètres Association
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
    </LayoutShell>
  );
}
