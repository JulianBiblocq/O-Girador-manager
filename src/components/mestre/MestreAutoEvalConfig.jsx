import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import MestreQuizConfigManager from '../pedagogy/MestreQuizConfigManager';
import QuizDistractorManager from '../pedagogy/QuizDistractorManager';

export default function MestreAutoEvalConfig({ profileData }) {
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('visibilite'); // visibilite, qcm_config, percussion, chant, danse, leurres

  // Data models
  const [songs, setSongs] = useState([]);
  const [rhythms, setRhythms] = useState([]);
  const [rhythmsMetadata, setRhythmsMetadata] = useState({});
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

  // UI states for Percussion
  const [selectedRhythm, setSelectedRhythm] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('');
  const [newQuestionBad1, setNewQuestionBad1] = useState('');
  const [newQuestionBad2, setNewQuestionBad2] = useState('');
  const [newQuestionBad3, setNewQuestionBad3] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Songs
      const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
      const docsSnap = await getDocs(qDocs);
      const fetchedSongs = [];
      docsSnap.forEach(d => {
        const data = d.data();
        if (data.type === 'song') fetchedSongs.push({ id: d.id, ...data });
      });
      setSongs(fetchedSongs);

      // Fetch Global QCM Config and enabledModules
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

      // Fetch Rhythms from Storage
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

      // Fetch Rhythm Metadata for Custom Questions
      const qMeta = collection(db, 'associations', groupId, 'rhythmMetadata');
      const metaSnap = await getDocs(qMeta);
      const meta = {};
      metaSnap.forEach(d => { meta[d.id] = d.data(); });
      setRhythmsMetadata(meta);

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

      // Removed setSongs as it's no longer used for per-song config saving here.

  const handleAddRhythmQuestion = async (e) => {
    e.preventDefault();
    if (!selectedRhythm || !newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()) return;
    
    try {
      const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', selectedRhythm.id);
      
      const newQ = { 
        id: Date.now().toString(), 
        texte: newQuestionText.trim(),
        bonneReponse: newQuestionCorrect.trim(),
        mauvaisesReponses: [newQuestionBad1.trim(), newQuestionBad2.trim(), newQuestionBad3.trim()].filter(Boolean)
      };
      
      await setDoc(metaRef, {
        customQuestions: arrayUnion(newQ)
      }, { merge: true });
      
      setRhythmsMetadata(prev => {
        const existing = prev[selectedRhythm.id] || {};
        return {
          ...prev,
          [selectedRhythm.id]: {
            ...existing,
            customQuestions: [...(existing.customQuestions || []), newQ]
          }
        };
      });
      setNewQuestionText('');
      setNewQuestionCorrect('');
      setNewQuestionBad1('');
      setNewQuestionBad2('');
      setNewQuestionBad3('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublishQuiz = async (rhythmId, currentVal) => {
    try {
      const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', rhythmId);
      await setDoc(metaRef, { isQuizPublished: !currentVal }, { merge: true });
      setRhythmsMetadata(prev => {
        const existing = prev[rhythmId] || {};
        return {
          ...prev,
          [rhythmId]: {
            ...existing,
            isQuizPublished: !currentVal
          }
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveRhythmQuestion = async (rhythmId, question) => {
    try {
      const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', rhythmId);
      await updateDoc(metaRef, {
        customQuestions: arrayRemove(question)
      });
      
      setRhythmsMetadata(prev => {
        const existing = prev[rhythmId];
        return {
          ...prev,
          [rhythmId]: {
            ...existing,
            customQuestions: existing.customQuestions.filter(q => q.id !== question.id)
          }
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChantDifficulties = async () => {
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { qcmGlobalConfig });
      alert("Niveaux de difficulté sauvegardés avec succès !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
    }
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
    { id: 'qcm_config', label: 'Configuration Globale QCM', icon: '⚙️' },
    { id: 'percussion', label: 'QCM Percussion', icon: '🥁' },
    { id: 'chant', label: 'Difficulté Chant', icon: '🎤' },
    { id: 'leurres', label: 'Banque de Leurres', icon: '🎭' },
    { id: 'danse', label: 'Évaluation Danse', icon: '💃' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-left select-none p-4 md:p-8 force-light-theme relative">
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

              {activeSection === 'chant' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-dashed border-cordel-wood/30 pb-4">
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-cordel-wood">
                        Configuration de la difficulté (Masquage)
                      </h3>
                      <p className="text-xs text-encre-noire/70 mt-1">
                        Définissez les éléments à masquer par défaut pour chaque niveau de révision.
                      </p>
                    </div>
                    <CordelButton variant="primary" onClick={handleSaveChantDifficulties} className="text-[10px] whitespace-nowrap">
                      💾 Sauvegarder les niveaux
                    </CordelButton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['debutant', 'moyen', 'expert'].map(level => {
                      const levelData = qcmGlobalConfig.chantDifficulties?.[level] || {};
                      const levelLabels = { debutant: '🌱 Débutant', moyen: '🌿 Intermédiaire', expert: '🌳 Expert' };
                      
                      const toggleOption = (field, checked) => {
                        setQcmGlobalConfig(prev => ({
                          ...prev,
                          chantDifficulties: {
                            ...(prev.chantDifficulties || {}),
                            [level]: {
                              ...(prev.chantDifficulties?.[level] || {}),
                              [field]: checked
                            }
                          }
                        }));
                      };

                      return (
                        <CordelCard key={level} variant="default" className="p-4 flex flex-col gap-4">
                          <h4 className="font-black text-sm uppercase tracking-wider text-encre-noire text-center pb-2 border-b border-dashed border-encre-noire/20">
                            {levelLabels[level]}
                          </h4>
                          <div className="flex flex-col gap-2">
                            {[
                              { field: 'hideNacao', label: 'Masquer la Nation' },
                              { field: 'hideRythme', label: 'Masquer le Rythme' },
                              { field: 'hideOriginales', label: 'Masquer Paroles Originales' },
                              { field: 'hidePhonetique', label: 'Masquer la Phonétique' },
                              { field: 'hideTraduction', label: 'Masquer la Traduction' },
                              { field: 'hideLexique', label: 'Masquer le Lexique' },
                            ].map(opt => (
                              <label key={opt.field} className="flex items-center gap-2 cursor-pointer p-2 bg-[#fdfaf2] rounded border border-encre-noire/10 hover:border-cordel-wood transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={levelData[opt.field] || false}
                                  onChange={(e) => toggleOption(opt.field, e.target.checked)}
                                  className="accent-cordel-wood w-3 h-3"
                                />
                                <span className="text-[10px] font-bold text-encre-noire">{opt.label}</span>
                              </label>
                            ))}

                            <div className="mt-2 pt-2 border-t border-dashed border-encre-noire/20 flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase text-cordel-wood mb-1">Rôles par défaut</span>
                              <label className="flex items-center gap-2 cursor-pointer p-2 bg-[#fdfaf2] rounded border border-encre-noire/10 hover:border-cordel-wood transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={levelData.hidePuxador || false}
                                  onChange={(e) => toggleOption('hidePuxador', e.target.checked)}
                                  className="accent-cordel-wood w-3 h-3"
                                />
                                <span className="text-[10px] font-bold text-encre-noire">Masquer Puxador</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer p-2 bg-[#fdfaf2] rounded border border-encre-noire/10 hover:border-cordel-wood transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={levelData.hideChoeur || false}
                                  onChange={(e) => toggleOption('hideChoeur', e.target.checked)}
                                  className="accent-cordel-wood w-3 h-3"
                                />
                                <span className="text-[10px] font-bold text-encre-noire">Masquer Chœur</span>
                              </label>
                            </div>
                          </div>
                        </CordelCard>
                      );
                    })}
                  </div>
                </div>
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
                      
                      {selectedRhythm ? (
                        <CordelCard variant="default" className="p-5 flex flex-col gap-6">
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-[#fdfaf2] p-3 border-2 border-dashed border-cordel-wood/30 rounded">
                              <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/80">
                                Visibilité Élèves (Mon Parcours)
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={rhythmsMetadata[selectedRhythm.id]?.isQuizPublished || false}
                                  onChange={() => handleTogglePublishQuiz(selectedRhythm.id, rhythmsMetadata[selectedRhythm.id]?.isQuizPublished)}
                                  className="accent-cordel-wood w-4 h-4"
                                />
                                <span className={`text-xs font-bold ${rhythmsMetadata[selectedRhythm.id]?.isQuizPublished ? 'text-[#2d6a4f]' : 'text-encre-noire'}`}>
                                  {rhythmsMetadata[selectedRhythm.id]?.isQuizPublished ? '✅ Publié' : 'Brouillon'}
                                </span>
                              </label>
                            </div>
                            
                            <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/60 mt-2">
                              Questions actives pour : {selectedRhythm.titre}
                            </span>
                            
                            {!(rhythmsMetadata[selectedRhythm.id]?.customQuestions?.length > 0) ? (
                              <div className="text-center p-6 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded">
                                <p className="text-xs font-medium opacity-60">Aucune question personnalisée pour ce rythme.</p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {rhythmsMetadata[selectedRhythm.id].customQuestions.map(q => (
                                  <div key={q.id} className="flex flex-col p-3 bg-white border-2 border-encre-noire/15 rounded shadow-sm relative">
                                    <span className="text-xs font-bold text-encre-noire mb-1">{q.texte}</span>
                                    <span className="text-[10px] text-[#2d6a4f] font-bold">✓ {q.bonneReponse}</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {q.mauvaisesReponses?.map((mr, i) => (
                                        <span key={i} className="text-[9px] bg-neutral-100 text-encre-noire/60 px-1.5 py-0.5 rounded line-through">
                                          {mr}
                                        </span>
                                      ))}
                                    </div>
                                    <button 
                                      onClick={() => handleRemoveRhythmQuestion(selectedRhythm.id, q)}
                                      className="absolute top-2 right-2 text-cordel-master-dark/40 hover:text-cordel-rouge font-black px-2"
                                      title="Supprimer la question"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <form onSubmit={handleAddRhythmQuestion} className="flex flex-col gap-3 bg-[#fdfaf2] p-4 rounded border-2 border-encre-noire/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood mb-1">
                              + Nouvelle Question
                            </span>
                            <input
                              type="text"
                              value={newQuestionText}
                              onChange={(e) => setNewQuestionText(e.target.value)}
                              placeholder="La question (ex: Quel est le signal d'arrêt ?)"
                              className="p-2 border-2 border-encre-noire/30 rounded text-xs font-bold"
                              required
                            />
                            <input
                              type="text"
                              value={newQuestionCorrect}
                              onChange={(e) => setNewQuestionCorrect(e.target.value)}
                              placeholder="La BONNE réponse"
                              className="p-2 border-2 border-[#2d6a4f]/50 bg-[#2d6a4f]/5 rounded text-xs font-bold text-[#2d6a4f]"
                              required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={newQuestionBad1}
                                onChange={(e) => setNewQuestionBad1(e.target.value)}
                                placeholder="Fausse réponse 1"
                                className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
                                required
                              />
                              <input
                                type="text"
                                value={newQuestionBad2}
                                onChange={(e) => setNewQuestionBad2(e.target.value)}
                                placeholder="Fausse réponse 2 (opt)"
                                className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
                              />
                              <input
                                type="text"
                                value={newQuestionBad3}
                                onChange={(e) => setNewQuestionBad3(e.target.value)}
                                placeholder="Fausse réponse 3 (opt)"
                                className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
                              />
                            </div>
                            <CordelButton variant="primary" type="submit" disabled={!newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()} className="text-[10px] self-end mt-2">
                              Ajouter au Quiz
                            </CordelButton>
                          </form>
                        </CordelCard>
                      ) : (
                        <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
                          <p className="text-sm font-bold">Sélectionnez un rythme à gauche pour configurer son QCM.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'danse' && (
                <div className="text-center p-12 opacity-50 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded font-black uppercase text-sm mt-8">
                  💃 Espace Danse en construction
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
