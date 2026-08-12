import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { parseSequencerJson } from '../../utils/sequencerParser';
import SongCard from '../SongCard';
import AutoEvalQuiz from './AutoEvalQuiz';
import AutoEvalQuizContainer from '../student/AutoEvalQuizContainer';
import { XiloCompass } from '../XiloIcons';

const CultureCategoryIcon = ({ docItem }) => {
  const theme = ((docItem.themeCulture || '') + ' ' + (docItem.stampKey || '') + ' ' + (docItem.categorieFiche || '') + ' ' + (docItem.sousCategorieFiche || '')).toLowerCase();
  const isOrixa = theme.includes('orixa') || theme.includes('spiritualit');
  const isCortejo = theme.includes('cortejo') || theme.includes('cortège');
  const isCuisine = theme.includes('cuisine') || theme.includes('gastronomi');
  const isHistoire = theme.includes('histoire');
  const isMusique = theme.includes('musique');
  const isTerritoire = theme.includes('territoire') || theme.includes('geograph');
  const isFolklore = theme.includes('folklore');

  const renderIcon = (id, paths, maskLines) => (
    <div className="w-5 h-5 relative flex items-center justify-center opacity-80">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full text-cordel-master-dark">
        <defs>
          <mask id={`monparcours-${id}-${docItem.id || 'x'}`}>
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {maskLines}
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask={`url(#monparcours-${id}-${docItem.id || 'x'})`} d={paths} />
      </svg>
    </div>
  );

  if (isOrixa) return renderIcon('orixa', "M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z", <><line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" /><line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" /><line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" /><line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" /><line x1="62" y1="37" x2="62" y2="51" strokeDasharray="3 3" /><path d="M 22 62 Q 50 78 78 61" fill="none" strokeWidth="2" strokeDasharray="4 2" /><path d="M 18 78 Q 50 95 82 77" fill="none" strokeWidth="3" /><path d="M 50 72 L 50 90" fill="none" strokeWidth="2" strokeDasharray="5 3" /><circle cx="50" cy="15" r="2.5" fill="black" stroke="none" /><circle cx="40" cy="22" r="2" fill="black" stroke="none" /><circle cx="60" cy="22" r="2" fill="black" stroke="none" /><path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" /></>);
  if (isCortejo) return renderIcon('cortejo', "M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z", <><path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" /><path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" /><line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" /><line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" /></>);
  if (isCuisine) return renderIcon('cuisine', "M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35", <><path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" /><line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" /></>);
  if (isHistoire) return renderIcon('histoire', "M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z", <><line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" /><path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" /></>);
  if (isMusique) return renderIcon('musique', "M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z", <><line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" /><line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" /><line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" /></>);
  if (isTerritoire) return renderIcon('territoire', "M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z", <><line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" /><line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" /><path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" /><circle cx="75" cy="65" r="4" fill="black" stroke="none" /><circle cx="25" cy="45" r="4" fill="black" stroke="none" /></>);
  if (isFolklore) return renderIcon('folklore', "M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z", <><circle cx="42" cy="55" r="4" fill="black" stroke="none" /><circle cx="58" cy="55" r="4" fill="black" stroke="none" /><path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" /><path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" /></>);

  return <span className="text-[14px]">📚</span>;
};

export default function MonParcours({ profileData, sequenceurUrl, enabledModules = {} }) {
  const groupId = profileData?.groupId;
  const userId = profileData?.uid;
  const isDanse = profileData?.instrument?.toLowerCase().includes('danse');

  const availableTabs = [
    { id: 'autoeval', label: 'Auto-évaluation', icon: '🧠', key: 'monParcoursAutoEval' },
    { id: 'percussion', label: 'Percussion', icon: '🥁', key: 'monParcoursPercussion' },
    { id: 'danse', label: 'Danse', icon: '💃', key: 'monParcoursDanse' },
    { id: 'chant', label: 'Chant', icon: '🎤', key: 'monParcoursChant' },
    { id: 'atelier', label: 'Atelier', icon: '🛠️', key: 'monParcoursAtelier' },
    { id: 'culture', label: 'Culture', icon: '📚', key: 'monParcoursCulture' }
  ].filter(tab => enabledModules[tab.key] !== false);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'autoeval');
  const [activeCultureTheme, setActiveCultureTheme] = useState('all');
  
  // Rhythms data
  const [rhythms, setRhythms] = useState([]);
  const [rhythmsMetadata, setRhythmsMetadata] = useState({});
  const [rhythmsJsonData, setRhythmsJsonData] = useState({});
  
  // Songs data (Varal)
  const [songs, setSongs] = useState([]);
  
  // Educational sheets
  const [educationalSheets, setEducationalSheets] = useState([]);
  const [launchQuizFiche, setLaunchQuizFiche] = useState(null);
  const [launchCustomQuiz, setLaunchCustomQuiz] = useState(null);
  
  // Evaluations state
  const [evaluations, setEvaluations] = useState({}); // { [docId]: 'level' }
  const [saving, setSaving] = useState(false);
  
  // QCM Config
  const [qcmGlobalConfig, setQcmGlobalConfig] = useState({});

  useEffect(() => {
    if (!groupId || !userId) return;

    // 1. Fetch Evaluations
    const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
    const unsubEval = onSnapshot(parcoursRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvaluations(docSnap.data().evaluations || {});
      }
    });

    // 2. Fetch Rhythm Fallbacks (Mestre Metadata) & Global QCM Config
    const fetchMetadata = async () => {
      const q = collection(db, 'associations', groupId, 'rhythmMetadata');
      const snap = await getDocs(q);
      const meta = {};
      snap.forEach(d => { meta[d.id] = d.data(); });
      setRhythmsMetadata(meta);

      const assocRef = doc(db, 'associations', groupId);
      const assocSnap = await getDoc(assocRef);
      if (assocSnap.exists() && assocSnap.data().qcmGlobalConfig) {
        setQcmGlobalConfig(assocSnap.data().qcmGlobalConfig);
      }
    };

    // 3. Fetch Rhythms from Storage
    const fetchRhythms = async () => {
      try {
        const folderRef = ref(storage, `documents/${groupId}/sequencer`);
        const res = await listAll(folderRef);
        const fetchedRhythms = await Promise.all(
          res.items.map(async (itemRef) => {
            const jsonUrl = await getDownloadURL(itemRef);
            const rawName = itemRef.name;
            const cleanName = rawName.replace(/^\d+_/, '').replace(/\.json$/i, '');
            return { id: rawName, titre: cleanName, jsonUrl, fileName: rawName };
          })
        );
        fetchedRhythms.sort((a, b) => a.titre.localeCompare(b.titre));
        setRhythms(fetchedRhythms);
        
        // Fetch JSON content for parsing
        fetchedRhythms.forEach(async (r) => {
          try {
            const resp = await fetch(r.jsonUrl);
            const data = await resp.json();
            setRhythmsJsonData(prev => ({ ...prev, [r.id]: data }));
          } catch (e) {
            console.error("Error fetching json for", r.titre, e);
          }
        });
      } catch (error) {
        console.error("Error fetching rhythms:", error);
      }
    };

    // 4. Fetch Songs from Varal
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'documents'), where('groupId', '==', groupId), where('type', '==', 'song'));
        const snap = await getDocs(q);
        const fetchedSongs = [];
        snap.forEach(d => {
          const data = d.data();
          if (!data.isArchived) {
            fetchedSongs.push({ id: d.id, ...data });
          }
        });
        setSongs(fetchedSongs);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    // 5. Fetch Fiches Pédagogiques
    const fetchFiches = async () => {
      try {
        const q = query(collection(db, 'documents'), where('groupId', '==', groupId), where('type', 'in', ['fiche_pedagogique', 'culture_fiche']));
        const snap = await getDocs(q);
        const fetchedFiches = [];
        snap.forEach(d => fetchedFiches.push({ id: d.id, ...d.data() }));
        setEducationalSheets(fetchedFiches);
      } catch (error) {
        console.error("Error fetching fiches:", error);
      }
    };

    fetchMetadata();
    fetchRhythms();
    fetchSongs();
    fetchFiches();

    return () => unsubEval();
  }, [groupId, userId]);

  const handleSetEvaluation = async (itemId, level) => {
    setSaving(true);
    try {
      const newEvals = { ...evaluations, [itemId]: level };
      const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
      await setDoc(parcoursRef, { evaluations: newEvals }, { merge: true });
    } catch (error) {
      console.error("Error saving evaluation:", error);
    } finally {
      setSaving(false);
    }
  };

  const comfortLevels = [
    { level: 'decouverte', label: '🌱 En découverte' },
    { level: 'pratique', label: '🌿 En pratique' },
    { level: 'alaise', label: '🌳 À l\'aise' },
    { level: 'referent', label: '👑 Référent' }
  ];

  const getSequencerUrl = (jsonUrl, bpm) => {
    const baseUrl = sequenceurUrl || 'https://sequenceur.app';
    if (!jsonUrl) return baseUrl;
    let url = baseUrl.includes('?') 
      ? `${baseUrl}&file=${encodeURIComponent(jsonUrl)}`
      : `${baseUrl}?file=${encodeURIComponent(jsonUrl)}`;
    if (bpm) {
      url += `&bpm=${bpm}`;
    }
    return url;
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-5xl mx-auto p-4 md:p-8 force-light-theme">
      {/* En-tête */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase flex items-center gap-3">
          <XiloCompass size={36} /> Mon Parcours
        </h1>
        <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 text-center max-w-2xl">
          Auto-évaluation de tes compétences techniques et musicales. Ton évolution est sauvegardée automatiquement.
        </p>
        {activeTab !== 'autoeval' && (
          <div className="bg-cordel-ocre/10 border-l-4 border-cordel-ocre p-3 mt-2 text-left rounded-r max-w-2xl w-full">
            <p className="text-xs font-bold text-cordel-master-dark flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Où apprendre et réviser ?</strong><br/>
                Avant de valider tes acquis ici, retrouve tous les détails (fiches complètes, audios, explications) dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Onglets (Menu de Catégories) */}
      <div className="flex flex-wrap justify-center gap-2 border-b-2 border-dashed border-cordel-master-dark/30 pb-4 mb-4">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs md:text-sm font-extrabold uppercase tracking-widest rounded-full transition-all border-2 ${
              activeTab === tab.id 
                ? 'border-cordel-wood bg-cordel-wood text-[#fdfaf2] shadow-[2px_2px_0px_0px_#181716] scale-105' 
                : 'border-transparent text-cordel-master-dark/60 hover:bg-black/5 hover:text-cordel-wood'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Contenu Percussion / Danse */}
      {(activeTab === 'percussion' || activeTab === 'danse') && (
        <div className="flex flex-col gap-8">
          {/* Liste des Rythmes */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-cactus tracking-widest text-cordel-wood">
              🎼 Rythmes & Breques
            </h2>
            {rhythms.length === 0 ? (
              <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
                <span className="text-3xl block mb-2">{activeTab === 'percussion' ? '🥁' : '💃'}</span>
                <p className="text-sm font-bold text-encre-noire/70">Aucun rythme de {activeTab} disponible pour le moment. Explore le Varal !</p>
              </div>
            ) : (
              rhythms.map(rhythm => {
                // Parsing auto + fallback
                const autoParsed = parseSequencerJson(rhythmsJsonData[rhythm.id]);
                const fallback = rhythmsMetadata[rhythm.id] || {};
                
                const finalBaguettes = fallback.baguettes || autoParsed.baguettes;
                const finalUnison = fallback.unisonAlfaias !== undefined ? fallback.unisonAlfaias : autoParsed.unisonAlfaias;

                return (
                  <CordelCard key={rhythm.id} className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-dashed border-cordel-master-dark/20 pb-2">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire">
                          {rhythm.titre}
                        </h3>
                        {autoParsed.instrumentsPresents && autoParsed.instrumentsPresents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {autoParsed.instrumentsPresents.map(inst => (
                              <span key={inst} className="text-[8px] font-black uppercase tracking-wider bg-[#d99f4d]/20 text-cordel-wood border border-[#d99f4d]/50 px-1.5 py-0.5 rounded">
                                {inst}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Echelle de confort */}
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {comfortLevels.map(lvl => (
                          <button
                            key={lvl.level}
                            onClick={() => handleSetEvaluation(rhythm.id, lvl.level)}
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded border border-encre-noire/30 ${evaluations[rhythm.id] === lvl.level ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]' : 'bg-white text-encre-noire hover:bg-neutral-100'}`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {rhythmsMetadata[rhythm.id]?.isQuizPublished && rhythmsMetadata[rhythm.id]?.customQuestions?.length > 0 && (
                      <div className="flex justify-end pt-2 mt-2 border-t border-dashed border-cordel-master-dark/20">
                        <CordelButton 
                          variant="ocre" 
                          onClick={() => setLaunchCustomQuiz({ id: rhythm.id, titre: rhythm.titre, questions: rhythmsMetadata[rhythm.id].customQuestions })}
                          className="px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          🧠 Lancer le Quiz
                        </CordelButton>
                      </div>
                    )}

                    {/* Entraînement / Calage */}
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
                      <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark mr-2">
                        ⏱️ Entraînement :
                      </span>
                      {[80, 100, 120].map(bpm => (
                        <a
                          key={bpm}
                          href={getSequencerUrl(rhythm.jsonUrl, bpm)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold bg-[#f4ecd8] border border-encre-noire/50 px-2.5 py-1 rounded hover:bg-[#ebdcc0] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
                        >
                          {bpm} BPM
                        </a>
                      ))}
                    </div>
                  </CordelCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Contenu Chants */}
      {activeTab === 'chant' && (
        <div className="flex flex-col gap-6">

          <div className="flex flex-col gap-6">
            {songs.length === 0 ? (
              <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
                <span className="text-3xl block mb-2">🎤</span>
                <p className="text-sm font-bold text-encre-noire/70">Aucun chant disponible pour le moment. Explore le Varal !</p>
              </div>
            ) : (
              songs.map(songDoc => {
                return (
                  <CordelCard key={songDoc.id} variant="default" className="relative p-5 flex flex-col gap-4">
                    <SongCard song={songDoc} />
                    <div className="absolute top-4 right-4 flex gap-1 z-10 bg-white p-1 rounded border border-encre-noire/20 shadow-sm">
                      {comfortLevels.map(lvl => (
                        <button
                          key={lvl.level}
                          onClick={() => handleSetEvaluation(songDoc.id, lvl.level)}
                          title={lvl.label}
                          className={`text-xs p-1.5 rounded transition-all ${evaluations[songDoc.id] === lvl.level ? 'bg-cordel-wood text-white scale-110 shadow-md' : 'bg-transparent text-encre-noire/50 hover:bg-neutral-100'}`}
                        >
                          {lvl.label.split(' ')[0]} {/* Affiche juste l'émoji */}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/15">
                      <CordelButton 
                        variant="ocre" 
                        onClick={() => setLaunchCustomQuiz({ 
                          isSong: true, 
                          songData: songDoc, 
                          allSongsData: songs, 
                          qcmGlobalConfig: qcmGlobalConfig 
                        })}
                        className="px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        🧠 Lancer le Quiz
                      </CordelButton>
                    </div>
                  </CordelCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Contenu Atelier */}
      {activeTab === 'atelier' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {educationalSheets.filter(f => f.categorie?.toLowerCase() === 'atelier').length === 0 ? (
              <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
                <span className="text-3xl block mb-2">🛠️</span>
                <p className="text-sm font-bold text-encre-noire/70">Aucune fiche d'atelier disponible pour le moment. Explore le Varal !</p>
              </div>
            ) : (
              educationalSheets.filter(f => f.categorie?.toLowerCase() === 'atelier').map(fiche => {
                const currentLevel = evaluations[fiche.id];
                const comfortBadge = comfortLevels.find(c => c.level === currentLevel) || { level: 'none', label: '❓ Non testé' };

                return (
                  <CordelCard key={fiche.id} variant="default" className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-dashed border-cordel-master-dark/20 pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark opacity-70">
                          {fiche.categorie || 'Atelier'}
                        </span>
                        <h3 className="text-base font-black text-cordel-wood uppercase">
                          {fiche.titre}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-cordel-wood/5 px-3 py-1.5 rounded-full border border-cordel-wood/20">
                        <span className="text-[10px] font-bold text-cordel-wood uppercase tracking-wider">Statut :</span>
                        <span className="text-xs font-black" title={comfortBadge.label}>{comfortBadge.label}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <CordelButton 
                        variant="ocre" 
                        onClick={() => setLaunchQuizFiche(fiche)}
                        className="px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        🧠 Lancer le Quiz
                      </CordelButton>
                    </div>
                  </CordelCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Contenu Culture */}
      {activeTab === 'culture' && (
        <div className="flex flex-col gap-6">
          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4">
            {[
              { id: 'all', label: 'Toute la Culture' },
              { id: 'orixás', label: 'Orixás' },
              { id: 'cuisine', label: 'Cuisine' },
              { id: 'histoire', label: 'Histoire' },
              { id: 'musique', label: 'Musique' },
              { id: 'cortège', label: 'Cortège' },
              { id: 'territoire', label: 'Territoire' },
              { id: 'folklore', label: 'Folklore' }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setActiveCultureTheme(theme.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm ${
                  activeCultureTheme === theme.id
                    ? 'bg-cordel-wood text-[#fdfaf2] border-2 border-cordel-wood'
                    : 'bg-[#fdfaf2] text-cordel-master-dark border-2 border-cordel-wood/20 hover:border-cordel-wood/50'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            {(() => {
              const cultureFilter = (d, filterId) => {
                if (filterId === 'all') return true;
                const dTheme = (d.themeCulture || '').toLowerCase();
                const dCat = (d.categorieFiche || '').toLowerCase();
                if (filterId === 'orixás') return dTheme.includes('orixa') || dCat.includes('orixa') || dCat.includes('spiritualit');
                if (filterId === 'cuisine') return dTheme.includes('cuisine') || dCat.includes('cuisine');
                if (filterId === 'histoire') return dTheme.includes('histoire') || dCat.includes('histoire');
                if (filterId === 'musique') return dTheme.includes('musique') || dCat.includes('musique') || dTheme.includes('danse') || dCat.includes('danse');
                if (filterId === 'cortège') return dTheme.includes('cortejo') || dCat.includes('cortejo') || dCat.includes('cour') || dTheme.includes('cour');
                if (filterId === 'territoire') return dTheme.includes('territoire') || dCat.includes('territoire');
                if (filterId === 'folklore') return dTheme.includes('folklore') || dCat.includes('folklore');
                return false;
              };

              const filteredSheets = educationalSheets.filter(f => 
                (f.categorie?.toLowerCase() === 'culture' || f.type === 'culture_fiche') && 
                cultureFilter(f, activeCultureTheme)
              );

              if (filteredSheets.length === 0) {
                return (
                  <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
                    <span className="text-3xl block mb-2">📚</span>
                    <p className="text-sm font-bold text-encre-noire/70">Aucune fiche de culture disponible pour cette catégorie.</p>
                  </div>
                );
              }

              return filteredSheets.map(fiche => {
                const currentLevel = evaluations[fiche.id];
                const comfortBadge = comfortLevels.find(c => c.level === currentLevel) || { level: 'none', label: '❓ Non testé' };

                return (
                  <CordelCard key={fiche.id} variant="default" className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-dashed border-cordel-master-dark/20 pb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <CultureCategoryIcon docItem={fiche} />
                          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark opacity-70">
                            {fiche.categorie || 'Culture'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-cordel-wood uppercase">
                          {fiche.themeCulture === 'orixas' && fiche.personnageOrisha ? fiche.personnageOrisha : fiche.titre}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-cordel-wood/5 px-3 py-1.5 rounded-full border border-cordel-wood/20">
                        <span className="text-[10px] font-bold text-cordel-wood uppercase tracking-wider">Statut :</span>
                        <span className="text-xs font-black" title={comfortBadge.label}>{comfortBadge.label}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <CordelButton 
                        variant="ocre" 
                        onClick={() => setLaunchQuizFiche(fiche)}
                        className="px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        🧠 Lancer le Quiz
                      </CordelButton>
                    </div>
                  </CordelCard>
                );
              });
            })()}
          </div>
        </div>
      )}

      {activeTab === 'autoeval' && (
        <AutoEvalQuizContainer 
          profileData={profileData} 
          allSongs={songs} 
          allSheets={educationalSheets} 
        />
      )}

      {/* Modale Quiz AutoEvalQuiz */}
      {launchQuizFiche && (
        <AutoEvalQuiz 
          sheetData={launchQuizFiche}
          allSheetsData={educationalSheets}
          allSongsData={songs}
          profileData={profileData}
          onClose={() => setLaunchQuizFiche(null)}
        />
      )}

      {launchCustomQuiz && (
        <AutoEvalQuiz 
          customQuizData={launchCustomQuiz.questions}
          customQuizId={launchCustomQuiz.id}
          customQuizTitle={launchCustomQuiz.titre}
          songData={launchCustomQuiz.songData}
          allSongsData={launchCustomQuiz.allSongsData || songs}
          allSheetsData={educationalSheets}
          qcmGlobalConfig={launchCustomQuiz.qcmGlobalConfig}
          isSong={launchCustomQuiz.isSong}
          rhythms={rhythms}
          sequenceurUrl={sequenceurUrl}
          profileData={profileData}
          onClose={() => setLaunchCustomQuiz(null)}
        />
      )}
    </div>
  );
}
