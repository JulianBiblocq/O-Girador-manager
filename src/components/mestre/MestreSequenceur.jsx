import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function MestreSequenceur({ groupId, sequenceurUrl }) {
  const { t } = useTranslation();
  const [rhythms, setRhythms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [titre, setTitre] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Fetch all rhythms directly from Firebase Storage
  const fetchRhythmsFromStorage = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const folderRef = ref(storage, `documents/${groupId}/sequencer`);
      const res = await listAll(folderRef);
      
      const fetchedRhythms = await Promise.all(
        res.items.map(async (itemRef) => {
          try {
            const jsonUrl = await getDownloadURL(itemRef);
            // Format name: e.g. "1719283921_Baque de Luanda.json" -> "Baque de Luanda"
            const rawName = itemRef.name;
            const cleanName = rawName.replace(/^\d+_/ , '').replace(/\.json$/i, '');
            return {
              id: rawName,
              titre: cleanName,
              jsonUrl: jsonUrl,
              fileName: rawName
            };
          } catch (urlError) {
            console.error("Error getting download URL for item:", itemRef.name, urlError);
            return null;
          }
        })
      );

      // Filter out failed promises and sort alphabetically or by prefix date if needed
      const validRhythms = fetchedRhythms.filter(Boolean);
      validRhythms.sort((a, b) => a.titre.localeCompare(b.titre));
      setRhythms(validRhythms);
    } catch (error) {
      console.error("MestreSequenceur - Error listing Storage rhythms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRhythmsFromStorage();
  }, [groupId]);

  const handleAddRhythm = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim() || !jsonFile) return;

    setSaving(true);
    try {
      // Create filename prefixing with timestamp to avoid duplicates
      const fileRef = ref(storage, `documents/${groupId}/sequencer/${Date.now()}_${titre.trim()}.json`);
      await uploadBytes(fileRef, jsonFile);
      
      setTitre('');
      setJsonFile(null);
      setFileInputKey(prev => prev + 1);
      alert("Rythme ajouté au catalogue avec succès !");
      await fetchRhythmsFromStorage();
    } catch (error) {
      console.error("MestreSequenceur - Error uploading rhythm to Storage:", error);
      alert("Erreur lors de l'ajout du rythme.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRhythm = async (fileName) => {
    const confirmMsg = t('mestre.rhythmDeleteConfirm') || "Voulez-vous vraiment supprimer ce rythme ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const fileRef = ref(storage, `documents/${groupId}/sequencer/${fileName}`);
      await deleteObject(fileRef);
      alert("Rythme supprimé du catalogue avec succès !");
      await fetchRhythmsFromStorage();
    } catch (error) {
      console.error("MestreSequenceur - Error deleting rhythm from Storage:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  const getSequencerPlayUrl = (jsonUrl) => {
    const baseUrl = sequenceurUrl || 'https://sequenceur.app';
    if (!jsonUrl) return baseUrl;
    return baseUrl.includes('?') 
      ? `${baseUrl}&file=${encodeURIComponent(jsonUrl)}`
      : `${baseUrl}?file=${encodeURIComponent(jsonUrl)}`;
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🎵 {t('mestre.seqTitle') || "Gestionnaire de Rythmes / Séquences JSON"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Form panel */}
        <div className="col-span-1">
          <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              ➕ {t('mestre.addRhythmTitle') || "Ajouter un rythme (.json)"}
            </h3>
            
            <form onSubmit={handleAddRhythm} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                  {t('mestre.rhythmName') || "Nom du rythme"} *
                </label>
                <input 
                  type="text"
                  required
                  disabled={saving}
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Baque de Luanda"
                  className="theme-input font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                  {t('mestre.jsonFileLabel') || "Fichier de configuration (.json)"} *
                </label>
                <input 
                  key={fileInputKey}
                  type="file"
                  accept=".json"
                  required
                  disabled={saving}
                  onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                  className="theme-input font-bold py-1.5 bg-cordel-bg-light w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                />
              </div>

              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving || !titre.trim() || !jsonFile}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest mt-2"
              >
                {saving ? "Téléversement..." : (t('mestre.addRhythmBtn') || "Ajouter le rythme")}
              </CordelButton>
            </form>
          </CordelCard>
        </div>

        {/* List panel */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-master-dark/80 pl-1">
            📂 {t('mestre.rhythmListTitle') || "Rythmes & Séquences configurés"}
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
            </div>
          ) : rhythms.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-60">{t('mestre.noRhythms') || "Aucun rythme trouvé dans votre dossier de stockage."}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3.5">
              {rhythms.map((rhythm) => (
                <CordelCard key={rhythm.id} variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm text-encre-noire">{rhythm.titre}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRhythm(rhythm.fileName)}
                      className="text-xs hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>

                  {rhythm.jsonUrl && (
                    <a
                      href={getSequencerPlayUrl(rhythm.jsonUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="theme-btn theme-bg-ocre text-encre-noire px-3 py-2 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1 select-none"
                    >
                      🎧 {t('mestre.workRhythmBtn') || "Travailler ce rythme (Séquenceur)"}
                    </a>
                  )}
                </CordelCard>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
