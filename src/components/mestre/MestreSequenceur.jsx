import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
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
  const [notes, setNotes] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Load all rhythms
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const q = query(collection(db, 'rhythms'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort: recent first
      fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRhythms(fetched);
      setLoading(false);
    }, (error) => {
      console.error("MestreSequenceur - Error query rhythms:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleAddRhythm = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) return;

    setSaving(true);
    try {
      let jsonUrl = '';
      if (jsonFile) {
        const fileRef = ref(storage, `associations/${groupId}/sequencer/${Date.now()}_${jsonFile.name}`);
        const snapshot = await uploadBytes(fileRef, jsonFile);
        jsonUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'rhythms'), {
        groupId,
        titre: titre.trim(),
        notes: notes.trim(),
        jsonUrl,
        createdAt: Date.now()
      });

      setTitre('');
      setNotes('');
      setJsonFile(null);
      setFileInputKey(prev => prev + 1);
    } catch (error) {
      console.error("MestreSequenceur - Error adding rhythm:", error);
      alert("Erreur lors de l'ajout du rythme.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRhythm = async (id) => {
    const confirmMsg = t('mestre.rhythmDeleteConfirm') || "Voulez-vous vraiment supprimer ce rythme ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, 'rhythms', id));
    } catch (error) {
      console.error("MestreSequenceur - Error deleting rhythm:", error);
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
                  {t('mestre.rhythmNotes') || "Notes / Instructions"}
                </label>
                <input 
                  type="text"
                  disabled={saving}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Tempo 120, variations A et B"
                  className="theme-input font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                  {t('mestre.jsonFileLabel') || "Fichier de configuration (.json)"}
                </label>
                <input 
                  key={fileInputKey}
                  type="file"
                  accept=".json"
                  disabled={saving}
                  onChange={(e) => setJsonFile(e.target.files[0])}
                  className="theme-input font-bold py-1.5 bg-cordel-bg-light w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                />
              </div>

              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving || !titre.trim()}
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
              <p className="text-xs font-bold opacity-60">{t('mestre.noRhythms') || "Aucun rythme configuré pour le moment."}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3.5">
              {rhythms.map((rhythm) => (
                <CordelCard key={rhythm.id} variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm text-encre-noire">{rhythm.titre}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRhythm(rhythm.id)}
                      className="text-xs hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>

                  {rhythm.notes && (
                    <p className="text-xs text-encre-noire/70 bg-white/40 dark:bg-black/10 p-2 rounded italic">
                      💡 {rhythm.notes}
                    </p>
                  )}

                  {rhythm.jsonUrl && (
                    <a
                      href={getSequencerPlayUrl(rhythm.jsonUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="theme-btn theme-bg-ocre text-encre-noire px-3 py-2 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
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
