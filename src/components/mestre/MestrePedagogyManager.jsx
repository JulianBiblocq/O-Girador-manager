import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { generateQuizFromSheet, generateQuizFromSong } from '../../utils/quizGenerator';
import useHardwareBack from '../../hooks/useHardwareBack';
import { useTranslation } from '../LanguageContext';

export default function MestrePedagogyManager({ profileData, sequenceurUrl }) {
  const { t } = useTranslation();
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [loading, setLoading] = useState(false);
  
  // Data models
  const [songs, setSongs] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [qcmGlobalConfig, setQcmGlobalConfig] = useState({
    askRythme: true,
    askNacao: true,
    askTraduction: true,
    askLexique: true
  });

  // Inspector state
  const [inspectorSelectedDocId, setInspectorSelectedDocId] = useState(null);
  const [inspectorGeneratedQuiz, setInspectorGeneratedQuiz] = useState(null);
  const [inspectorEditingQuestion, setInspectorEditingQuestion] = useState(null);
  const [inspectorEditForm, setInspectorEditForm] = useState(null);

  useHardwareBack(!!inspectorSelectedDocId && !inspectorEditingQuestion, () => setInspectorSelectedDocId(null));
  useHardwareBack(!!inspectorEditingQuestion, () => setInspectorEditingQuestion(null));

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer Songs and Fiches
      const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
      const docsSnap = await getDocs(qDocs);
      const fetchedSongs = [];
      const fetchedFiches = [];
      docsSnap.forEach(d => {
        const data = d.data();
        if (!data.isHidden && !data.excludeFromPedagogy) {
          if (data.type === 'song') fetchedSongs.push({ id: d.id, ...data });
          if (data.type === 'fiche_pedagogique' || data.type === 'culture_fiche') fetchedFiches.push({ id: d.id, ...data });
        }
      });
      setSongs(fetchedSongs);
      setFiches(fetchedFiches);

      // Récupérer Global QCM Config
      const assocRef = doc(db, 'associations', groupId);
      const assocSnap = await getDoc(assocRef);
      if (assocSnap.exists()) {
        const data = assocSnap.data();
        let configToSet = qcmGlobalConfig;
        if (data.qcmGlobalConfig) {
          configToSet = { ...configToSet, ...data.qcmGlobalConfig };
        }
        if (data.quizDistractors) {
          configToSet.customDistractors = data.quizDistractors;
        }
        setQcmGlobalConfig(configToSet);
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



  // -----------------------------------------
  // GESTION DE L'INSPECTEUR QCM (OVERRIDE)
  // -----------------------------------------
  const handleSelectInspectorDoc = (docId) => {
    setInspectorSelectedDocId(docId);
    setInspectorEditingQuestion(null);
    setInspectorEditForm(null);
    
    // Générer l'aperçu
    let generated = [];
    const song = songs.find(s => s.id === docId);
    if (song) {
      generated = generateQuizFromSong(song, songs, fiches, { ...qcmGlobalConfig, t });
    } else {
      const fiche = fiches.find(f => f.id === docId);
      if (fiche) {
        generated = generateQuizFromSheet(fiche, fiches, songs, { ...qcmGlobalConfig, t });
      }
    }
    setInspectorGeneratedQuiz(generated);
  };

  const handleEditInspectorQuestion = (q) => {
    setInspectorEditingQuestion(q.id);
    const correct = q.choices.find(c => c.isCorrect)?.text || '';
    const bads = q.choices.filter(c => !c.isCorrect).map(c => c.text);
    setInspectorEditForm({
      questionText: q.questionText,
      correctAnswer: correct,
      bad1: bads[0] || '',
      bad2: bads[1] || '',
      bad3: bads[2] || '',
    });
  };

  const handleSaveInspectorQuestion = async (qId) => {
    if (!inspectorSelectedDocId) return;
    
    try {
      const docRef = doc(db, 'documents', inspectorSelectedDocId);
      
      const newChoices = [
        { text: inspectorEditForm.correctAnswer, isCorrect: true },
        { text: inspectorEditForm.bad1, isCorrect: false }
      ];
      if (inspectorEditForm.bad2) newChoices.push({ text: inspectorEditForm.bad2, isCorrect: false });
      if (inspectorEditForm.bad3) newChoices.push({ text: inspectorEditForm.bad3, isCorrect: false });

      const overrideData = {
        questionText: inspectorEditForm.questionText,
        choices: newChoices
      };
      
      const song = songs.find(s => s.id === inspectorSelectedDocId);
      const fiche = fiches.find(f => f.id === inspectorSelectedDocId);
      const targetDoc = song || fiche;
      const currentOverrides = targetDoc.quizOverrides || {};
      
      const newOverrides = {
        ...currentOverrides,
        [qId]: overrideData
      };
      
      await updateDoc(docRef, { quizOverrides: newOverrides });
      
      // Mettre à jour local state
      if (song) {
        setSongs(prev => prev.map(s => s.id === inspectorSelectedDocId ? { ...s, quizOverrides: newOverrides } : s));
      } else if (fiche) {
        setFiches(prev => prev.map(f => f.id === inspectorSelectedDocId ? { ...f, quizOverrides: newOverrides } : f));
      }
      
      // Re-générer l'aperçu
      const updatedDoc = { ...targetDoc, quizOverrides: newOverrides };
      let newGenerated = [];
      if (song) newGenerated = generateQuizFromSong(updatedDoc, songs, fiches, qcmGlobalConfig);
      else newGenerated = generateQuizFromSheet(updatedDoc, fiches, songs, qcmGlobalConfig);
      
      setInspectorGeneratedQuiz(newGenerated);
      setInspectorEditingQuestion(null);
      setInspectorEditForm(null);
      
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthorized) return <div className="p-8 text-center">Accès refusé.</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-left select-none p-4 md:p-8 force-light-theme relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase">
            ⚙️ Gestionnaire QCM
          </h1>
          <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 max-w-2xl mt-2">
            Inspecteur de QCM : Visualisation et surchargement des questions générées pour vos fiches et toadas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">

          
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">
                  1. Sélection du Document
                </h3>
                <select 
                  className="w-full p-2 border-2 border-encre-noire/30 rounded text-xs font-bold"
                  value={inspectorSelectedDocId || ''}
                  onChange={(e) => handleSelectInspectorDoc(e.target.value)}
                >
                  <option value="">-- Choisir un document --</option>
                  <optgroup label="🎤 Toadas (Chants)">
                    {songs.map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
                  </optgroup>
                  <optgroup label="📚 Fiches Pédagogiques">
                    {fiches.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
                  </optgroup>
                </select>
                
                {inspectorSelectedDocId && (
                  <CordelButton variant="secondary" onClick={() => handleSelectInspectorDoc(inspectorSelectedDocId)} className="text-[10px] w-full mt-2">
                    🔄 Régénérer l'aperçu
                  </CordelButton>
                )}
              </div>
              
              <div className="w-full md:w-2/3 flex flex-col gap-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-2 border-b-2 border-dashed border-cordel-wood/30 pb-2">
                  2. Aperçu du Quiz
                </h3>
                
                {!inspectorSelectedDocId ? (
                  <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
                    <p className="text-sm font-bold">Sélectionnez un document à gauche pour prévisualiser son QCM.</p>
                  </div>
                ) : !inspectorGeneratedQuiz || inspectorGeneratedQuiz.length === 0 ? (
                  <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
                    <p className="text-sm font-bold">Impossible de générer un quiz pour ce document (manque de données).</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {inspectorGeneratedQuiz.map((q, idx) => {
                      const isEditing = inspectorEditingQuestion === q.id;
                      const hasOverride = (songs.find(s => s.id === inspectorSelectedDocId) || fiches.find(f => f.id === inspectorSelectedDocId))?.quizOverrides?.[q.id];
                      
                      return (
                        <CordelCard key={q.id} variant="default" className={`p-4 flex flex-col gap-3 relative transition-all ${hasOverride ? 'border-l-4 border-l-cordel-ocre' : ''}`}>
                          {hasOverride && (
                            <span className="absolute top-2 right-2 text-[8px] bg-cordel-ocre text-white px-2 py-0.5 rounded font-black uppercase">
                              Surchargée
                            </span>
                          )}
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark opacity-60">
                              Question {idx + 1}
                            </span>
                            {!isEditing && (
                              <button onClick={() => handleEditInspectorQuestion(q)} className="text-[10px] font-black uppercase text-cordel-wood hover:underline">
                                ✏️ Éditer
                              </button>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="flex flex-col gap-2 bg-[#fdfaf2] p-3 border-2 border-dashed border-encre-noire/20 rounded">
                              <input 
                                type="text" 
                                value={inspectorEditForm.questionText} 
                                onChange={(e) => setInspectorEditForm({...inspectorEditForm, questionText: e.target.value})}
                                className="p-2 border-2 border-encre-noire/30 rounded text-xs font-bold w-full"
                                placeholder="Texte de la question"
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-[#2d6a4f] uppercase mb-1">Bonne réponse</span>
                                  <input 
                                    type="text" 
                                    value={inspectorEditForm.correctAnswer} 
                                    onChange={(e) => setInspectorEditForm({...inspectorEditForm, correctAnswer: e.target.value})}
                                    className="p-1.5 border-2 border-[#2d6a4f]/50 bg-[#2d6a4f]/5 rounded text-xs font-bold w-full"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-cordel-rouge uppercase mb-1">Fausse réponse 1</span>
                                  <input 
                                    type="text" 
                                    value={inspectorEditForm.bad1} 
                                    onChange={(e) => setInspectorEditForm({...inspectorEditForm, bad1: e.target.value})}
                                    className="p-1.5 border-2 border-encre-noire/20 rounded text-xs w-full"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-cordel-rouge uppercase mb-1">Fausse réponse 2</span>
                                  <input 
                                    type="text" 
                                    value={inspectorEditForm.bad2} 
                                    onChange={(e) => setInspectorEditForm({...inspectorEditForm, bad2: e.target.value})}
                                    className="p-1.5 border-2 border-encre-noire/20 rounded text-xs w-full"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-cordel-rouge uppercase mb-1">Fausse réponse 3</span>
                                  <input 
                                    type="text" 
                                    value={inspectorEditForm.bad3} 
                                    onChange={(e) => setInspectorEditForm({...inspectorEditForm, bad3: e.target.value})}
                                    className="p-1.5 border-2 border-encre-noire/20 rounded text-xs w-full"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-encre-noire/10">
                                <CordelButton variant="secondary" onClick={() => setInspectorEditingQuestion(null)} className="text-[10px] px-3 py-1">
                                  Annuler
                                </CordelButton>
                                <CordelButton variant="primary" onClick={() => handleSaveInspectorQuestion(q.id)} className="text-[10px] px-3 py-1">
                                  Sauvegarder
                                </CordelButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-encre-noire">{q.questionText}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                {q.choices.map((c, i) => (
                                  <div key={i} className={`text-xs px-2 py-1 rounded border ${c.isCorrect ? 'bg-[#2d6a4f]/10 border-[#2d6a4f]/30 font-bold text-[#2d6a4f]' : 'bg-neutral-50 border-encre-noire/10 text-encre-noire/70'}`}>
                                    {c.isCorrect ? '✓' : '✗'} {c.text}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CordelCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
    </div>
  );
}
