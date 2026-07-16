import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" }
};

export default function AssociationSettings({ groupId, onBack, role, isSystemAdmin }) {
  const [fieldsConfig, setFieldsConfig] = useState(DEFAULT_FIELDS_CONFIG);
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

  const handleSave = async () => {
    if (!groupId) return;

    setSaving(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        fieldsConfig: fieldsConfig
      });
      alert("Réglages de l'association enregistrés avec succès !");
      onBack();
    } catch (err) {
      console.error("AssociationSettings - Erreur updateDoc :", err);
      alert("Erreur lors de la sauvegarde des réglages.");
    } finally {
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
            ⚙️ Configuration des Champs
          </h2>
        </div>

        {/* Info card */}
        <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          🔧 Déterminez quels champs administratifs sont demandés lors de l'onboarding et du profil, et qui est autorisé à les remplir.
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (
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
        )}

      </div>
    </LayoutShell>
  );
}
