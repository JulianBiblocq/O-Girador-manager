import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { storage, db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import SequenceurLinkBlock from '../association-settings/blocks/SequenceurLinkBlock';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';

export default function MestreSequenceur({ groupId, sequenceurUrl }) {
  const { t } = useTranslation();
  const translationFn = t || ((key) => key);
  const { confirm } = useConfirm();
  
  const {
    formData,
    handleChange,
    handleSave,
    saving: savingSettings
  } = useAssociationSettings(groupId, true, null, translationFn);
  const [showConfig, setShowConfig] = useState(false);

  const [storageRhythms, setStorageRhythms] = useState([]);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { rhythms: firestoreRhythms, loading: fsLoading } = useSequencerFirestoreData(groupId);

  // Form states
  const [titre, setTitre] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Metadata editor states
  const [editingMetadataRhythm, setEditingMetadataRhythm] = useState(null);
  const [metadataForm, setMetadataForm] = useState({ baguettes: '', unisonAlfaias: false });
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('solo'); // 'solo', 'pattern', 'sequence'

  // Récupérer all rhythms directly from Firebase Storage
  const fetchRhythmsFromStorage = async () => {
    if (!groupId) {
      setLoadingStorage(false);
      return;
    }
    setLoadingStorage(true);
    try {
      const folderRef = ref(storage, `documents/${groupId}/sequencer`);
      const res = await listAll(folderRef);
      
      const fetchedRhythms = await Promise.all(
        res.items.map(async (itemRef) => {
          try {
            const jsonUrl = await getDownloadURL(itemRef);
            // Formater name: e.g. "1719283921_Baque de Luanda.json" -> "Baque de Luanda"
            const rawName = itemRef.name;
            const cleanName = rawName.replace(/^\d+_/ , '').replace(/\.(json|mp3|wav|ogg|m4a|aac)$/i, '');
            const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(rawName);
            const isJson = /\.json$/i.test(rawName);

            return {
              id: rawName,
              titre: cleanName,
              jsonUrl: jsonUrl,
              fileName: rawName,
              isAudio,
              isJson
            };
          } catch (urlError) {
            console.error("Error getting download URL for item:", itemRef.name, urlError);
            return null;
          }
        })
      );

      // Filtrer out failed promises and trier alphabetically or by prefix date if needed
      const validRhythms = fetchedRhythms.filter(Boolean);
      setStorageRhythms(validRhythms);
    } catch (error) {
      console.error("MestreSequenceur - Error listing Storage rhythms:", error);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    fetchRhythmsFromStorage();
  }, [groupId]);

  const allRhythms = React.useMemo(() => {
    const fsMapped = firestoreRhythms.map(r => {
      // Si les urls sont stockées dans le doc (ex: jsonUrl, audioUrl, fileUrl)
      const jUrl = r.jsonUrl || (r.fileUrl && /\.json$/i.test(r.fileUrl) ? r.fileUrl : null);
      const aUrl = r.audioUrl || (r.fileUrl && /\.(mp3|wav|ogg|m4a|aac)$/i.test(r.fileUrl) ? r.fileUrl : null);
      const isJson = !!jUrl || !!r.data;
      const isAudio = !!aUrl;
      return {
        id: r.id,
        titre: r.title || r.name || r.id,
        jsonUrl: jUrl,
        audioUrl: aUrl,
        isAudio,
        isJson,
        fileName: r.fileName || r.id,
        source: 'firestore',
        original: r,
        instrumentId: r.instrumentId,
        collection: r._collection
      };
    });

    const storageMapped = storageRhythms.map(r => ({ ...r, source: 'storage' }));
    
    // Pour ne pas écraser les audios de storage s'il y a des doublons, on peut simplement les lister tous.
    return [...storageMapped, ...fsMapped].sort((a, b) => a.titre.localeCompare(b.titre));
  }, [storageRhythms, firestoreRhythms]);

  const loading = loadingStorage || fsLoading;

  const getCategory = (r) => {
    if (r.source === 'storage') return 'sequence';
    if (r.collection === 'sections') return 'sequence';
    if (r.collection === 'patterns') {
      if (r.instrumentId && r.instrumentId !== 'all') return 'solo';
      return 'pattern';
    }
    return 'pattern';
  };

  const soloRhythms = allRhythms.filter(r => getCategory(r) === 'solo');
  const patternRhythms = allRhythms.filter(r => getCategory(r) === 'pattern');
  const sequenceRhythms = allRhythms.filter(r => getCategory(r) === 'sequence');

  const groupedSolos = soloRhythms.reduce((acc, r) => {
    const inst = r.instrumentId || 'Inconnu';
    if (!acc[inst]) acc[inst] = [];
    acc[inst].push(r);
    return acc;
  }, {});

  const renderRhythmCard = (rhythm) => (
    <CordelCard key={`${rhythm.source}-${rhythm.id}`} variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light flex flex-col gap-2 relative">
      <div className="flex justify-between items-start">
        <span className="font-extrabold text-sm text-encre-noire flex items-center gap-2">
          {rhythm.source === 'firestore' ? '☁️' : '📁'} {rhythm.isAudio ? '🎧' : '🎹'} {rhythm.titre}
        </span>
        {rhythm.source === 'storage' && (
          <button
            type="button"
            onClick={() => handleDeleteRhythm(rhythm.fileName)}
            className="text-xs hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
            title="Supprimer"
          >
            ✕
          </button>
        )}
      </div>

      {(rhythm.audioUrl || (rhythm.jsonUrl && rhythm.isAudio)) && (
        <div className="mt-2 w-full">
          <audio controls src={rhythm.audioUrl || rhythm.jsonUrl} className="w-full h-8" />
        </div>
      )}

      <div className="flex gap-2 mt-2 w-full">
        {rhythm.isJson && (
          <a
            href={getSequencerPlayUrl(rhythm)}
            target="_blank"
            rel="noopener noreferrer"
            className="theme-btn theme-bg-ocre text-encre-noire px-3 py-2 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center select-none"
          >
            🎹 Lancer Séquenceur
          </a>
        )}
        <button
          type="button"
          onClick={() => openMetadataEditor(rhythm)}
          className="theme-btn bg-cordel-master-dark text-cordel-bg-light px-3 py-2 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center select-none"
        >
          ✏️ Pédagogie (QCM)
        </button>
      </div>
    </CordelCard>
  );

  const handleAddRhythm = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim() || !jsonFile) return;

    setSaving(true);
    try {
      const ext = jsonFile.name.split('.').pop().toLowerCase();
      const fileRef = ref(storage, `documents/${groupId}/sequencer/${Date.now()}_${titre.trim()}.${ext}`);
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
    const rawConfirmMsg = translationFn('mestre.rhythmDeleteConfirm');
    const confirmMsg = rawConfirmMsg !== 'mestre.rhythmDeleteConfirm' ? rawConfirmMsg : "Voulez-vous vraiment supprimer ce fichier ?";
    const isOk = await confirm({
      title: "Supprimer le rythme",
      message: confirmMsg,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;

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

  const getSequencerPlayUrl = (rhythm) => {
    const baseUrl = sequenceurUrl || 'https://sequenceur.app';
    if (rhythm.source === 'firestore' && rhythm.original?.data) {
      return baseUrl.includes('?') 
        ? `${baseUrl}&patternId=${encodeURIComponent(rhythm.id)}`
        : `${baseUrl}?patternId=${encodeURIComponent(rhythm.id)}`;
    }
    const jsonUrl = rhythm.jsonUrl;
    if (!jsonUrl) return baseUrl;
    return baseUrl.includes('?') 
      ? `${baseUrl}&file=${encodeURIComponent(jsonUrl)}`
      : `${baseUrl}?file=${encodeURIComponent(jsonUrl)}`;
  };

  const openMetadataEditor = async (rhythm) => {
    setEditingMetadataRhythm(rhythm);
    setLoadingMetadata(true);
    try {
      // rhythm.id is the fileName
      const docRef = doc(db, 'associations', groupId, 'rhythmMetadata', rhythm.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMetadataForm({ 
          baguettes: data.baguettes || '', 
          unisonAlfaias: data.unisonAlfaias || false 
        });
      } else {
        setMetadataForm({ baguettes: '', unisonAlfaias: false });
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'associations', groupId, 'rhythmMetadata', editingMetadataRhythm.id);
      await setDoc(docRef, metadataForm, { merge: true });
      setEditingMetadataRhythm(null);
    } catch (err) {
      console.error("Error saving metadata:", err);
      alert("Erreur lors de l'enregistrement des métadonnées.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🎵 {translationFn('mestre.seqTitle') !== 'mestre.seqTitle' ? translationFn('mestre.seqTitle') : "Gestionnaire de Rythmes & Fichiers Audio"}
        </h2>
      </div>

      {/* Configuration Section (Accordeon) */}
      <CordelCard data-tour="mestre-sequenceur-metadata" variant="default" useExtremeBorder={true} className="p-4 mb-2">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            ⚙️ Configuration du Lien Séquenceur
          </h3>
          <span className="text-xs font-black">{showConfig ? '▲ Masquer' : '▼ Déployer'}</span>
        </div>

        {showConfig && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
            <SequenceurLinkBlock 
              formData={formData}
              handleChange={handleChange}
              saving={savingSettings}
            />
            <div className="flex justify-end mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer Configuration"}
              </CordelButton>
            </div>
          </form>
        )}
      </CordelCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Form panel */}
        <div className="col-span-1">
          <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              ➕ {translationFn('mestre.addRhythmTitle') !== 'mestre.addRhythmTitle' ? translationFn('mestre.addRhythmTitle') : "Ajouter un fichier (.json ou audio)"}
            </h3>
            
            <form onSubmit={handleAddRhythm} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                  {translationFn('mestre.rhythmName') !== 'mestre.rhythmName' ? translationFn('mestre.rhythmName') : "Nom de la séquence / Titre"} *
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
                  {translationFn('mestre.jsonFileLabel') !== 'mestre.jsonFileLabel' ? translationFn('mestre.jsonFileLabel') : "Fichier Séquenceur (.json) ou Audio"} *
                </label>
                <input 
                  key={fileInputKey}
                  type="file"
                  accept=".json,audio/*"
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
                {saving ? (translationFn('mestre.uploading') !== 'mestre.uploading' ? translationFn('mestre.uploading') : "Téléversement...") : (translationFn('mestre.addRhythmBtn') !== 'mestre.addRhythmBtn' ? translationFn('mestre.addRhythmBtn') : "Ajouter le fichier")}
              </CordelButton>
            </form>
          </CordelCard>
        </div>

        {/* List panel */}
        <div data-tour="mestre-sequenceur-list" className="col-span-1 md:col-span-2 flex flex-col gap-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-master-dark/80 pl-1">
            📂 {translationFn('mestre.rhythmListTitle') !== 'mestre.rhythmListTitle' ? translationFn('mestre.rhythmListTitle') : "Rythmes & Fichiers Audio configurés"}
          </h3>

          <div className="flex bg-cordel-master-dark/10 rounded-lg p-1 gap-1 mb-2">
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'solo' ? 'bg-cordel-master-dark text-cordel-bg-light shadow-sm' : 'text-cordel-wood/70 hover:bg-cordel-master-dark/5'}`}
            >
              Instrument solo
            </button>
            <button
              onClick={() => setActiveTab('pattern')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'pattern' ? 'bg-cordel-master-dark text-cordel-bg-light shadow-sm' : 'text-cordel-wood/70 hover:bg-cordel-master-dark/5'}`}
            >
              Pattern complet
            </button>
            <button
              onClick={() => setActiveTab('sequence')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'sequence' ? 'bg-cordel-master-dark text-cordel-bg-light shadow-sm' : 'text-cordel-wood/70 hover:bg-cordel-master-dark/5'}`}
            >
              Séquence complète
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
            </div>
          ) : allRhythms.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-60">{translationFn('mestre.noRhythms') !== 'mestre.noRhythms' ? translationFn('mestre.noRhythms') : "Aucun arquivo encontrado na sua pasta de armazenamento."}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3.5">
              {activeTab === 'solo' && (
                Object.keys(groupedSolos).length === 0 ? (
                  <p className="text-xs font-bold opacity-60 text-center py-4">Aucun instrument solo</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Object.entries(groupedSolos).sort(([a], [b]) => a.localeCompare(b)).map(([inst, list]) => (
                      <div key={inst} className="flex flex-col gap-2 border-l-4 border-[var(--color-cordel-ocre)] pl-3">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-cordel-wood opacity-80 mt-1 mb-1 capitalize">
                          🥁 {inst === 'marcante' ? 'Alfaia (Marcante)' : inst === 'tarol' ? 'Tarol / Caixa' : inst}
                        </h4>
                        <div className="flex flex-col gap-3.5">
                          {list.map(renderRhythmCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'pattern' && (
                patternRhythms.length === 0 ? (
                  <p className="text-xs font-bold opacity-60 text-center py-4">Aucun pattern complet</p>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {patternRhythms.map(renderRhythmCard)}
                  </div>
                )
              )}

              {activeTab === 'sequence' && (
                sequenceRhythms.length === 0 ? (
                  <p className="text-xs font-bold opacity-60 text-center py-4">Aucune séquence complète</p>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {sequenceRhythms.map(renderRhythmCard)}
                  </div>
                )
              )}
            </div>
          )}
        </div>

      </div>

      {/* Metadata Editor Modal */}
      {editingMetadataRhythm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <CordelCard data-tour="mestre-sequenceur-metadata" variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-5 relative">
            <h3 className="font-extrabold text-sm text-cordel-wood uppercase tracking-wider mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
              ✏️ Métadonnées de Secours (Fallback)
            </h3>
            
            {loadingMetadata ? (
              <div className="py-8 text-center opacity-60 animate-pulse text-xs font-bold uppercase">Chargement...</div>
            ) : (
              <form onSubmit={handleSaveMetadata} className="flex flex-col gap-4 text-left">
                <p className="text-[10px] italic opacity-80 leading-relaxed text-cordel-master-dark">
                  Ces informations priment sur le JSON du séquenceur. Si le JSON de {editingMetadataRhythm.titre} ne contient pas ces métadonnées pédagogiques, elles seront utilisées dans l'auto-évaluation de l'élève.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-encre-noire">
                    Matériel requis (Baguettes / Bacalhau)
                  </label>
                  <input
                    type="text"
                    value={metadataForm.baguettes}
                    onChange={(e) => setMetadataForm({ ...metadataForm, baguettes: e.target.value })}
                    placeholder="Ex: 1 grosse baguette + 1 bacalhau"
                    disabled={saving}
                    className="theme-input w-full text-xs font-bold bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={metadataForm.unisonAlfaias}
                    onChange={(e) => setMetadataForm({ ...metadataForm, unisonAlfaias: e.target.checked })}
                    disabled={saving}
                    className="w-4 h-4 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                  />
                  <span className="text-xs font-bold text-encre-noire">
                    Les Alfaias jouent à l'unisson (ex: pendant la toada)
                  </span>
                </label>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setEditingMetadataRhythm(null)}
                    disabled={saving}
                    className="px-4 py-1.5 text-xs font-bold"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    disabled={saving}
                    className="px-6 py-1.5 text-xs font-black uppercase"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </CordelButton>
                </div>
              </form>
            )}
          </CordelCard>
        </div>
      )}
    </div>
  );
}
