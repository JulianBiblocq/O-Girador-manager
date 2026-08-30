import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import MestreQuizConfigManager from '../pedagogy/MestreQuizConfigManager';
import QuizDistractorManager from '../pedagogy/QuizDistractorManager';
import MestreSignalsManager from '../pedagogy/MestreSignalsManager';
import CustomQuizConfigPanel from './CustomQuizConfigPanel';

export default function MestreAutoEvalConfig({ profileData, isEmbedded }) {
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('visibilite');

  // Data models
  const [songs, setSongs] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [rhythms, setRhythms] = useState([]);
  const [rhythmsMetadata, setRhythmsMetadata] = useState({});
  const [mestreSignals, setMestreSignals] = useState([]);
  const [qcmGlobalConfig, setQcmGlobalConfig] = useState({
    askRythme: true,
    askNacao: true,
    askTraduction: true,
    askLexique: true,
    chantDifficulties: {
      debutant: { hideTraduction: true, hideLexique: true, hidePuxador: false, hideChoeur: false },
      moyen: { hideTraduction: true, hideLexique: true, hidePhonetique: true, hideNacao: true, hidePuxador: false, hideChoeur: false },
      expert: { hideTraduction: true, hideLexique: true, hidePhonetique: true, hideOriginales: true, hideNacao: true, hideRythme: true, hidePuxador: false, hideChoeur: false }
    }
  });
  const [enabledModules, setEnabledModules] = useState({});

  // UI states for selection
  const [selectedRhythm, setSelectedRhythm] = useState(null);
  const [selectedDanseRhythm, setSelectedDanseRhythm] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedAtelierFiche, setSelectedAtelierFiche] = useState(null);
  const [selectedCultureFiche, setSelectedCultureFiche] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer Songs
      const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
      const docsSnap = await getDocs(qDocs);
      const fetchedSongs = [];
      docsSnap.forEach(d => {
        const data = d.data();
        if (data.type === 'song') fetchedSongs.push({ id: d.id, ...data });
      });
      setSongs(fetchedSongs);

      // Récupérer Global QCM Config and enabledModules
      const assocRef = doc(db, 'associations', groupId);
      const assocSnap = await getDoc(assocRef);
      if (assocSnap.exists()) {
        const data = assocSnap.data();
        if (data.qcmGlobalConfig) {
          setQcmGlobalConfig({ ...qcmGlobalConfig, ...data.qcmGlobalConfig });
        }
        if (data.enabledModules) {
          setEnabledModules(data.enabledModules);
        }
      }

      // Récupérer Educational Sheets (Fiches)
      const qFiches = query(collection(db, 'documents'), where('groupId', '==', groupId), where('type', 'in', ['fiche_pedagogique', 'culture_fiche']));
      const fichesSnap = await getDocs(qFiches);
      const fetchedFiches = [];
      fichesSnap.forEach(d => fetchedFiches.push({ id: d.id, ...d.data() }));
      setFiches(fetchedFiches);

      // Récupérer Rhythms from Storage & group medias
      const folderRef = ref(storage, `documents/${groupId}/sequencer`);
      const res = await listAll(folderRef);
      const files = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            fileName: itemRef.name,
            url,
            isAudio: /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(itemRef.name),
            isJson: /\.json$/i.test(itemRef.name),
            cleanName: itemRef.name.replace(/^\d+_/, '').replace(/\.(json|mp3|wav|ogg|m4a|aac|webm)$/i, '')
          };
        })
      );

      const groupedRhythms = [];
      const usedFiles = new Set();

      // First pass: JSON files
      files.filter(f => f.isJson).forEach(f => {
        groupedRhythms.push({
          id: f.fileName,
          titre: f.cleanName,
          jsonUrl: f.url,
          media: [{ url: f.url, fileName: f.fileName, isAudio: false, isJson: true }]
        });
        usedFiles.add(f.fileName);
      });

      // Second pass: associate audios to rhythms
      files.filter(f => !usedFiles.has(f.fileName)).forEach(f => {
        const matchingRhythm = groupedRhythms.find(r => f.cleanName.toLowerCase().includes(r.titre.toLowerCase()) || f.fileName.toLowerCase().includes(r.titre.toLowerCase()));
        if (matchingRhythm) {
          matchingRhythm.media.push({ url: f.url, fileName: f.fileName, isAudio: f.isAudio, isJson: f.isJson });
        } else {
          groupedRhythms.push({
            id: f.fileName,
            titre: f.cleanName,
            media: [{ url: f.url, fileName: f.fileName, isAudio: f.isAudio, isJson: f.isJson }]
          });
        }
      });

      // Récupération des patterns et sections depuis Firestore (le séquenceur utilise ownerId/visibility)
      const qPatterns = query(collection(db, 'patterns'));
      const qSections = query(collection(db, 'sections'));
      const [patternsSnap, sectionsSnap] = await Promise.all([getDocs(qPatterns), getDocs(qSections)]);
      
      const firestoreMedia = [];
      const mestreId = profileData?.id || profileData?.uid || '';
      
      patternsSnap.forEach(d => {
        const data = d.data();
        if (data.ownerId !== mestreId && data.visibility !== 'public') return;
        const itemName = data.name || data.title;
        if (itemName) firestoreMedia.push({ id: d.id, data, type: 'pattern', prefix: 'Pattern: ' });
      });
      sectionsSnap.forEach(d => {
        const data = d.data();
        if (data.ownerId !== mestreId && data.visibility !== 'public') return;
        const itemName = data.name || data.title;
        if (itemName) firestoreMedia.push({ id: d.id, data, type: 'section', prefix: 'Section: ' });
      });

      firestoreMedia.forEach(item => {
        const cleanName = item.data.name || item.data.title;
        const matchingRhythm = groupedRhythms.find(r => cleanName.toLowerCase().includes(r.titre.toLowerCase()));
        const mediaObj = {
          url: `firestore:${item.type}:${item.id}`,
          fileName: `${item.prefix}${cleanName}`,
          isAudio: false,
          isJson: true,
          rythme: matchingRhythm ? matchingRhythm.titre : 'Inconnu'
        };
        if (matchingRhythm) {
          matchingRhythm.media.push(mediaObj);
        } else {
          groupedRhythms.push({
            id: `fs_${item.type}_${item.id}`,
            titre: cleanName,
            media: [mediaObj]
          });
        }
      });

      groupedRhythms.sort((a, b) => a.titre.localeCompare(b.titre));
      setRhythms(groupedRhythms);

      // Récupérer Rhythm Metadata for Custom Questions
      const qMeta = collection(db, 'associations', groupId, 'rhythmMetadata');
      const metaSnap = await getDocs(qMeta);
      const meta = {};
      metaSnap.forEach(d => { meta[d.id] = d.data(); });
      setRhythmsMetadata(meta);

      // Récupérer Mestre Signals depuis Storage
      try {
        const signalsRef = ref(storage, 'sinais');
        const signalsRes = await listAll(signalsRef);
        const fetchedSignals = await Promise.all(
          signalsRes.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return {
              id: itemRef.name,
              name: itemRef.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
              imageUrl: url
            };
          })
        );
        setMestreSignals(fetchedSignals.filter(s => s.imageUrl && s.name));
      } catch (err) {
        console.error("Erreur Mestre Signals:", err);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId && isAuthorized) {
      fetchData();
    }
  }, [groupId, isAuthorized]);

  const handleUpdateRhythmMetadata = (itemId, action, payload) => {
    setRhythmsMetadata(prev => {
      const existing = prev[itemId] || {};
      const updated = { ...existing };
      
      if (action === 'isQuizPublished') {
        updated.isQuizPublished = payload;
      } else if (action === 'associatedSignalId') {
        updated.associatedSignalId = payload;
      } else if (action === 'addQuestion') {
        updated.customQuestions = [...(updated.customQuestions || []), payload];
      } else if (action === 'removeQuestion') {
        updated.customQuestions = (updated.customQuestions || []).filter(q => q.id !== payload.id);
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const handleUpdateDocumentMetadata = (itemId, action, payload, listName) => {
    const updateList = (prev) => prev.map(doc => {
      if (doc.id !== itemId) return doc;
      const updated = { ...doc };
      if (action === 'isQuizPublished') {
        updated.isQuizPublished = payload;
      } else if (action === 'addQuestion') {
        updated.customQuestions = [...(updated.customQuestions || []), payload];
      } else if (action === 'removeQuestion') {
        updated.customQuestions = (updated.customQuestions || []).filter(q => q.id !== payload.id);
      }
      return updated;
    });

    if (listName === 'songs') setSongs(updateList);
    if (listName === 'fiches') setFiches(updateList);
  };

  const handleToggleModule = async (key, value) => {
    try {
      const newModules = { ...enabledModules, [key]: value };
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { enabledModules: newModules });
      setEnabledModules(newModules);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthorized) return <div className="p-8 text-center">Accès refusé.</div>;

  const sections = [
    { id: 'visibilite', label: 'Visibilité des Onglets', icon: '👁️' },
    { id: 'inclusions_qcm', label: 'Visibilité des Rythmes', icon: '🎯' },
    { id: 'qcm_config', label: 'Configuration Globale QCM', icon: '⚙️' },
    { id: 'percussion', label: 'QCM Percussion', icon: '🥁' },
    { id: 'danse', label: 'QCM Danse', icon: '💃' },
    { id: 'chant', label: 'QCM Chant', icon: '🎤' },
    { id: 'atelier', label: 'QCM Atelier', icon: '🛠️' },
    { id: 'culture', label: 'QCM Culture', icon: '📚' },
    { id: 'signaux', label: 'Signaux du Maître', icon: '🚦' },
    { id: 'leurres', label: 'Banque de Leurres', icon: '🎭' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-left select-none p-4 md:p-8 force-light-theme relative">
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase">
              📝 Auto-Évaluation
            </h1>
            <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 max-w-2xl mt-2">
              Paramétrez la difficulté des auto-évaluations, les questions personnalisées par pupitre et la configuration globale.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation / Accordéons Menu (Left sidebar style) */}
        <div className="w-full lg:w-1/4 flex flex-col gap-2">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`text-left px-4 py-3 text-xs font-extrabold uppercase tracking-widest rounded transition-all border-2 ${
                activeSection === sec.id
                  ? 'border-cordel-wood bg-cordel-wood text-white shadow-[2px_2px_0px_0px_#181716] scale-105 z-10'
                  : 'border-transparent text-cordel-master-dark/60 hover:bg-black/5 hover:text-cordel-wood'
              }`}
            >
              <span className="mr-2">{sec.icon}</span>{sec.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full lg:w-3/4 flex flex-col gap-6">
          {loading ? (
            <div className="text-center p-12 opacity-50 animate-pulse font-black uppercase text-xs">
              Chargement des configurations...
            </div>
          ) : (
            <>
              {activeSection === 'visibilite' && (
                <CordelCard variant="default" className="p-5 flex flex-col gap-4">
                  <h3 className="font-black text-base uppercase tracking-wider text-cordel-wood border-b-2 border-dashed border-cordel-wood/30 pb-2">
                    Visibilité des onglets dans Mon Parcours
                  </h3>
                  <p className="text-xs text-encre-noire/70 mb-2">
                    Activez ou désactivez les onglets visibles par les élèves dans leur espace Mon Parcours.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    {[
                      { key: 'monParcoursPercussion', label: 'Percussion' },
                      { key: 'monParcoursDanse', label: 'Danse' },
                      { key: 'monParcoursChant', label: 'Chant' },
                      { key: 'monParcoursAtelier', label: 'Atelier (Fabrication/Entretien)' },
                      { key: 'monParcoursCulture', label: 'Culture' }
                    ].map(mp => (
                      <label key={mp.key} className="flex items-center gap-3 cursor-pointer p-3 bg-[#fdfaf2] rounded border border-encre-noire/10 hover:border-cordel-wood transition-colors">
                        <input 
                          type="checkbox"
                          checked={enabledModules[mp.key] !== false}
                          onChange={(e) => handleToggleModule(mp.key, e.target.checked)}
                          className="accent-cordel-wood w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-encre-noire">
                          Afficher l'onglet "{mp.label}"
                        </span>
                      </label>
                    ))}
                  </div>
                </CordelCard>
              )}

              {activeSection === 'inclusions_qcm' && (
                <CordelCard variant="default" className="p-5 flex flex-col gap-4">
                  <h3 className="font-black text-base uppercase tracking-wider text-cordel-wood border-b-2 border-dashed border-cordel-wood/30 pb-2">
                    Visibilité des Rythmes (QCM & Carnet d'Aisance)
                  </h3>
                  <p className="text-xs text-encre-noire/70 mb-2">
                    Décochez les "petites boucles" ou patterns sans valeur pédagogique pour les masquer totalement de l'espace élève (et des QCM générés automatiquement).
                  </p>
                  
                  <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
                    {rhythms.map(rhythm => (
                      <label key={rhythm.id} className={`flex items-center gap-3 cursor-pointer p-3 rounded border transition-colors ${rhythmsMetadata[rhythm.id]?.isExcludedFromQcm ? 'bg-neutral-100 border-dashed border-encre-noire/20 opacity-70' : 'bg-[#fdfaf2] border-cordel-wood/30 shadow-sm'}`}>
                        <input 
                          type="checkbox"
                          checked={!rhythmsMetadata[rhythm.id]?.isExcludedFromQcm}
                          onChange={async (e) => {
                            const isIncluded = e.target.checked;
                            const isExcluded = !isIncluded;
                            
                            // Update Firestore
                            try {
                              const docRef = doc(db, 'associations', groupId, 'rhythmMetadata', rhythm.id);
                              await setDoc(docRef, { isExcludedFromQcm: isExcluded }, { merge: true });
                              
                              // Update local state
                              setRhythmsMetadata(prev => {
                                const existing = prev[rhythm.id] || {};
                                return { ...prev, [rhythm.id]: { ...existing, isExcludedFromQcm: isExcluded } };
                              });
                            } catch (err) {
                              console.error("Error updating exclusion status:", err);
                              alert("Erreur lors de la sauvegarde.");
                            }
                          }}
                          className="accent-cordel-wood w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${rhythmsMetadata[rhythm.id]?.isExcludedFromQcm ? 'text-encre-noire/60 line-through' : 'text-cordel-wood'}`}>
                          {rhythm.titre}
                        </span>
                        {rhythmsMetadata[rhythm.id]?.isExcludedFromQcm && (
                          <span className="ml-auto text-[9px] font-black uppercase text-encre-noire/40">Masqué</span>
                        )}
                      </label>
                    ))}
                  </div>
                </CordelCard>
              )}

              {activeSection === 'qcm_config' && (
                <MestreQuizConfigManager 
                  groupId={groupId} 
                  onTestQuiz={(config) => {
                    alert("Mode Test : Ouverture de la modale de quiz avec config " + JSON.stringify(config));
                  }}
                />
              )}

              {activeSection === 'leurres' && (
                <QuizDistractorManager profileData={profileData} />
              )}

              {activeSection === 'signaux' && (
                <MestreSignalsManager profileData={profileData} />
              )}

              {activeSection === 'percussion' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">1. Sélection</h3>
                      {rhythms.map(rhythm => (
                        <button
                          key={rhythm.id}
                          onClick={() => setSelectedRhythm(rhythm)}
                          className={`text-left p-3 rounded border-2 transition-all text-xs font-bold ${
                            selectedRhythm?.id === rhythm.id 
                              ? 'border-cordel-wood bg-cordel-wood/10 text-cordel-wood shadow-[2px_2px_0px_0px_#8b2a1a]'
                              : 'border-dashed border-encre-noire/20 text-encre-noire/70 hover:border-encre-noire hover:text-encre-noire'
                          }`}
                        >
                          🥁 {rhythm.titre}
                        </button>
                      ))}
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">2. Questions Personnalisées</h3>
                      <CustomQuizConfigPanel
                        groupId={groupId}
                        selectedItem={selectedRhythm}
                        itemType="rhythm"
                        isQuizPublished={rhythmsMetadata[selectedRhythm?.id]?.isQuizPublished}
                        associatedSignalId={rhythmsMetadata[selectedRhythm?.id]?.associatedSignalId}
                        customQuestions={rhythmsMetadata[selectedRhythm?.id]?.customQuestions}
                        availableMedia={selectedRhythm?.media}
                        onUpdateMetadata={handleUpdateRhythmMetadata}
                        allItems={rhythms}
                        mestreSignals={mestreSignals}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'danse' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">1. Sélection (Danse)</h3>
                      {rhythms.map(rhythm => (
                        <button
                          key={rhythm.id}
                          onClick={() => setSelectedDanseRhythm(rhythm)}
                          className={`text-left p-3 rounded border-2 transition-all text-xs font-bold ${
                            selectedDanseRhythm?.id === rhythm.id 
                              ? 'border-cordel-wood bg-cordel-wood/10 text-cordel-wood shadow-[2px_2px_0px_0px_#8b2a1a]'
                              : 'border-dashed border-encre-noire/20 text-encre-noire/70 hover:border-encre-noire hover:text-encre-noire'
                          }`}
                        >
                          💃 {rhythm.titre}
                        </button>
                      ))}
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">2. Questions Personnalisées</h3>
                      <CustomQuizConfigPanel
                        groupId={groupId}
                        selectedItem={selectedDanseRhythm}
                        itemType="rhythm"
                        isQuizPublished={rhythmsMetadata[selectedDanseRhythm?.id]?.isQuizPublished}
                        associatedSignalId={rhythmsMetadata[selectedDanseRhythm?.id]?.associatedSignalId}
                        customQuestions={rhythmsMetadata[selectedDanseRhythm?.id]?.customQuestions}
                        availableMedia={selectedDanseRhythm?.media}
                        onUpdateMetadata={handleUpdateRhythmMetadata}
                        allItems={rhythms}
                        mestreSignals={mestreSignals}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'chant' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">1. Sélection Chant</h3>
                      {songs.map(song => (
                        <button
                          key={song.id}
                          onClick={() => setSelectedSong(song)}
                          className={`text-left p-3 rounded border-2 transition-all text-xs font-bold ${
                            selectedSong?.id === song.id 
                              ? 'border-cordel-wood bg-cordel-wood/10 text-cordel-wood shadow-[2px_2px_0px_0px_#8b2a1a]'
                              : 'border-dashed border-encre-noire/20 text-encre-noire/70 hover:border-encre-noire hover:text-encre-noire'
                          }`}
                        >
                          🎤 {song.titre}
                        </button>
                      ))}
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">2. Questions Personnalisées</h3>
                      <CustomQuizConfigPanel
                        groupId={groupId}
                        selectedItem={selectedSong}
                        itemType="song"
                        isQuizPublished={selectedSong?.isQuizPublished}
                        customQuestions={selectedSong?.customQuestions}
                        availableMedia={null}
                        onUpdateMetadata={(id, action, payload) => handleUpdateDocumentMetadata(id, action, payload, 'songs')}
                        allItems={songs}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'atelier' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">1. Sélection Fiche Atelier</h3>
                      {fiches.filter(f => {
                        const cat = f.categorie?.toLowerCase() || '';
                        return cat.includes('atelier') || cat.includes('lutherie') || cat.includes('fabrication') || cat.includes('entretien');
                      }).map(fiche => (
                        <button
                          key={fiche.id}
                          onClick={() => setSelectedAtelierFiche(fiche)}
                          className={`text-left p-3 rounded border-2 transition-all text-xs font-bold ${
                            selectedAtelierFiche?.id === fiche.id 
                              ? 'border-cordel-wood bg-cordel-wood/10 text-cordel-wood shadow-[2px_2px_0px_0px_#8b2a1a]'
                              : 'border-dashed border-encre-noire/20 text-encre-noire/70 hover:border-encre-noire hover:text-encre-noire'
                          }`}
                        >
                          🛠️ {fiche.titre}
                        </button>
                      ))}
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">2. Questions Personnalisées</h3>
                      <CustomQuizConfigPanel
                        groupId={groupId}
                        selectedItem={selectedAtelierFiche}
                        itemType="fiche"
                        isQuizPublished={selectedAtelierFiche?.isQuizPublished}
                        customQuestions={selectedAtelierFiche?.customQuestions}
                        availableMedia={null}
                        onUpdateMetadata={(id, action, payload) => handleUpdateDocumentMetadata(id, action, payload, 'fiches')}
                        allItems={fiches}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'culture' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">1. Sélection Fiche Culture</h3>
                      {fiches.filter(f => f.categorie?.toLowerCase() === 'culture' || f.type === 'culture_fiche').map(fiche => (
                        <button
                          key={fiche.id}
                          onClick={() => setSelectedCultureFiche(fiche)}
                          className={`text-left p-3 rounded border-2 transition-all text-xs font-bold ${
                            selectedCultureFiche?.id === fiche.id 
                              ? 'border-cordel-wood bg-cordel-wood/10 text-cordel-wood shadow-[2px_2px_0px_0px_#8b2a1a]'
                              : 'border-dashed border-encre-noire/20 text-encre-noire/70 hover:border-encre-noire hover:text-encre-noire'
                          }`}
                        >
                          📚 {fiche.titre}
                        </button>
                      ))}
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                      <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">2. Questions Personnalisées</h3>
                      <CustomQuizConfigPanel
                        groupId={groupId}
                        selectedItem={selectedCultureFiche}
                        itemType="fiche"
                        isQuizPublished={selectedCultureFiche?.isQuizPublished}
                        customQuestions={selectedCultureFiche?.customQuestions}
                        availableMedia={null}
                        onUpdateMetadata={(id, action, payload) => handleUpdateDocumentMetadata(id, action, payload, 'fiches')}
                        allItems={fiches}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
