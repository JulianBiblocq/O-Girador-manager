import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SeloAxeStamp from '../SeloAxeStamp';
import FirestoreMediaRenderer from './FirestoreMediaRenderer';
import { generateQuizFromSong, generateQuizFromSheet, generateQuizFromDancador } from '../../utils/quizGenerator';
import { generateTranslationQuiz } from '../../utils/translationQuizEngine';
import { calculateNextReview } from '../../utils/spacedRepetitionEngine';
import StudentToadasProgress from './StudentToadasProgress';
import { useDancadorSteps } from '../../hooks/useDancadorData';
import { useTranslation } from '../LanguageContext';

export default function AutoEvalQuizContainer({ 
  profileData, 
  allSongs = [], 
  allSheets = [],
  initialTheme = null,
  targetedToadaId = null,
  preGeneratedQuestions = null,
  isExamMode = false,
  examConfig = null,
  onExit = null
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(initialTheme ? 'QUIZ' : 'HOME'); // 'HOME', 'QUIZ', 'RESULT'
  
  // App-level config
  const [globalConfig, setGlobalConfig] = useState({
    themes: { toadas: true, traduction: true, culture: true, atelier: true, danse: true },
    difficulty: 'medium',
    questionCount: 10
  });

  // User selections
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedTheme, setSelectedTheme] = useState(initialTheme || 'MIX'); // 'MIX', 'toadas', 'traduction', 'culture', 'atelier'
  
  // Si le user veut voir la progression des toadas
  const [showToadaProgress, setShowToadaProgress] = useState(false);
  
  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]); // [{ prompt, correct }]
  const [questionResults, setQuestionResults] = useState([]); // [{ q, isCorrect }]
  
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  const [customDistractors, setCustomDistractors] = useState({});

  // Récupération des pas de danse via le nouveau hook
  const { steps: dancadorSteps } = useDancadorSteps(profileData?.groupId);

  // Charger association config
  useEffect(() => {
    const loadConfig = async () => {
      if (!profileData?.groupId) return;
      try {
        const d = await getDoc(doc(db, 'associations', profileData.groupId));
        if (d.exists()) {
          const data = d.data();
          if (data.quizConfig) {
            const cfg = data.quizConfig;
            setGlobalConfig({
              themes: { ...globalConfig.themes, ...(cfg.themes || {}) },
              difficulty: cfg.difficulty || 'medium',
              questionCount: cfg.questionCount || 10
            });
            setSelectedDifficulty(cfg.difficulty || 'medium');
          }
          if (data.quizDistractors) {
            setCustomDistractors(data.quizDistractors);
          }
        }
      } catch (e) {
        console.error("Error loading config:", e);
      }
    };
    loadConfig();
  }, [profileData?.groupId]);

useEffect(() => {
  if (initialTheme && step === 'QUIZ' && questions.length === 0 && allSongs.length > 0) {
    startQuiz(initialTheme, targetedToadaId);
  }
}, [initialTheme, allSongs, step]);

const startQuiz = (theme, specificToadaId = null) => {
  setSelectedTheme(theme);
  setScore(0);
  setCurrentIndex(0);
  setWrongAnswers([]);
  setQuestionResults([]);
  
  const difficultyToUse = isExamMode && examConfig ? examConfig.difficulty : selectedDifficulty;
  const qcmGlobalConfig = { ...globalConfig, difficulty: difficultyToUse, t };

  // Génération dynamique
  let generated = [];
  const targetCount = isExamMode && examConfig ? examConfig.questionCount : globalConfig.questionCount;
  
  if (theme === 'daily_revision' && preGeneratedQuestions) {
    generated = [...preGeneratedQuestions];
  } else if (theme === 'traduction') {
    generated = generateTranslationQuiz({ count: targetCount, direction: 'MIXED', difficulty: selectedDifficulty, customDistractors });
  } else if (theme === 'toadas') {
    if (specificToadaId) {
      const song = allSongs.find(s => s.id === specificToadaId);
      if (song) {
        generated = generateQuizFromSong(song, allSongs, allSheets, { askRythme: true, askNacao: true, askLexique: true, difficulty: selectedDifficulty, customDistractors, t: qcmGlobalConfig.t });
        // S'assurer que le toadaId est attaché à la question pour le suivi analytique
        generated = generated.map(q => ({ ...q, toadaId: specificToadaId }));
      }
    } else {
      const songsCopy = [...allSongs].sort(() => Math.random() - 0.5);
      for (const song of songsCopy) {
        if (generated.length >= targetCount) break;
        const { t } = qcmGlobalConfig;
        const q = generateQuizFromSong(song, allSongs, allSheets, { askRythme: true, askNacao: true, askLexique: true, difficulty: selectedDifficulty, customDistractors, t });
        generated.push(...q.map(item => ({ ...item, toadaId: song.id })));
      }
    }
    } else if (theme === 'culture' || theme === 'atelier') {
      const filteredSheets = allSheets.filter(s => {
        if (theme === 'culture') return s.categorie?.toLowerCase() === 'culture' || s.type === 'culture_fiche';
        return s.categorie?.toLowerCase() === theme.toLowerCase();
      });
      const sheetsCopy = [...filteredSheets].sort(() => Math.random() - 0.5);
      for (const sheet of sheetsCopy) {
        if (generated.length >= targetCount) break;
        const { t } = qcmGlobalConfig;
        const q = generateQuizFromSheet(sheet, allSheets, allSongs, { difficulty: selectedDifficulty, customDistractors, t });
        generated.push(...q);
      }
    } else if (theme === 'danse') {
      const { t } = qcmGlobalConfig;
      generated = generateQuizFromDancador(dancadorSteps, { questionCount: targetCount, t });
    } else if (theme === 'MIX') {
      // Générer un lot de chaque catégorie pour s'assurer d'avoir assez de questions pour le mix final
      if (globalConfig.themes.danse && dancadorSteps?.length > 0) {
        const { t } = qcmGlobalConfig;
        generated.push(...generateQuizFromDancador(dancadorSteps, { questionCount: 3, t }));
      }
      if (globalConfig.themes.traduction) {
        generated.push(...generateTranslationQuiz({ count: targetCount, direction: 'MIXED', difficulty: selectedDifficulty, customDistractors }));
      }
      if (globalConfig.themes.toadas && allSongs.length > 0) {
        const songsCopy = [...allSongs].sort(() => Math.random() - 0.5);
        for (const song of songsCopy.slice(0, 3)) {
          const { t } = qcmGlobalConfig;
          generated.push(...generateQuizFromSong(song, allSongs, allSheets, { askRythme: true, askNacao: true, askLexique: true, difficulty: selectedDifficulty, customDistractors, t }));
        }
      }
      if (globalConfig.themes.culture || globalConfig.themes.atelier) {
        const validSheets = allSheets.filter(s => {
           if (globalConfig.themes.culture && (s.categorie?.toLowerCase() === 'culture' || s.type === 'culture_fiche')) return true;
           if (globalConfig.themes.atelier && s.categorie?.toLowerCase() === 'atelier') return true;
           return false;
        });
        const sheetsCopy = [...validSheets].sort(() => Math.random() - 0.5);
        for (const sheet of sheetsCopy.slice(0, 3)) {
          const { t } = qcmGlobalConfig;
          generated.push(...generateQuizFromSheet(sheet, allSheets, allSongs, { difficulty: selectedDifficulty, customDistractors, t }));
        }
      }
    }
    
    // S'assurer qu'on ne dépasse pas la limite
    generated = generated.sort(() => Math.random() - 0.5).slice(0, targetCount);
    
    if (generated.length === 0) {
      alert("Pas assez de données pour générer ce type de quiz.");
      return;
    }
    
    // Apply difficulty modifiers if necessary (future-proofing)
    
    setQuestions(generated);
    setStep('QUIZ');
  };

  const handleChoiceClick = (choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);
    
    setQuestionResults(prev => [...prev, { q: questions[currentIndex], isCorrect: choice.isCorrect }]);
    
    if (choice.isCorrect) {
      setScore(s => s + 1);
    } else {
      const q = questions[currentIndex];
      const correctText = q.choices ? q.choices.find(c => c.isCorrect)?.text : (q.correctAnswer || 'Introuvable');
      setWrongAnswers(prev => [...prev, { prompt: q.questionText || q.prompt, correct: correctText }]);
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedChoice(null);
        setShowFeedback(false);
      } else {
        finishQuiz();
      }
    }, choice.isCorrect ? 1500 : 3500); // Wait longer if incorrect to let them read the answer
  };

  const finishQuiz = async () => {
    setStep('RESULT');
    if (!profileData?.uid) return;
    
    setSavingScore(true);
    try {
      const finalScore = score + (selectedChoice?.isCorrect && !showFeedback ? 1 : 0);
      const docRef = doc(db, 'users', profileData.uid);
      const newHistoryEntry = {
        date: new Date().toISOString(),
        theme: selectedTheme,
        difficulty: selectedDifficulty,
        score: finalScore,
        total: questions.length,
        toadaId: targetedToadaId || null
      };
      
      // 1. Sauvegarde dans l'historique brut
      await setDoc(docRef, { quizHistory: arrayUnion(newHistoryEntry) }, { merge: true });

      // 2. Synchronisation avec l'état global (evaluations) pour les quiz ciblés
      if (targetedToadaId && profileData.groupId) {
        const percentage = finalScore / questions.length;
        let newLevel = 'decouverte';
        if (percentage === 1) newLevel = 'referent';
        else if (percentage >= 0.8) newLevel = 'alaise';
        else if (percentage >= 0.5) newLevel = 'pratique';
        
        const parcoursRef = doc(db, 'users', profileData.uid, 'parcours', profileData.groupId);
        const parcoursSnap = await getDoc(parcoursRef);
        const currentData = parcoursSnap.exists() ? parcoursSnap.data() : {};
        const oldLevel = currentData.evaluations?.[targetedToadaId];
        
        const levelValues = { 'decouverte': 1, 'pratique': 2, 'alaise': 3, 'referent': 4 };
        const oldVal = levelValues[oldLevel] || 0;
        const newVal = levelValues[newLevel] || 0;

        if (newVal > oldVal) {
          await setDoc(parcoursRef, {
            evaluations: {
              [targetedToadaId]: newLevel
            }
          }, { merge: true });
        }
      }

      // 3. Sauvegarde de la répétition espacée par question
      if (profileData.groupId) {
        const srRef = doc(db, 'users', profileData.uid, 'spaced_repetition', profileData.groupId);
        const srSnap = await getDoc(srRef);
        const srData = srSnap.exists() ? srSnap.data() : {};
        
        let srUpdates = { ...srData };
        let hasUpdates = false;

        questionResults.forEach(res => {
          if (!res.q.id) return; // Ignorer les questions sans ID
          const currentStats = srUpdates[res.q.id] || { consecutiveCorrect: 0 };
          srUpdates[res.q.id] = calculateNextReview(res.isCorrect, currentStats.consecutiveCorrect);
          hasUpdates = true;
        });

        // Ajouter la dernière question (car le state `questionResults` n'est pas encore mis à jour dans ce contexte asynchrone)
        const finalChoiceIsCorrect = selectedChoice?.isCorrect && !showFeedback;
        if (questions[currentIndex]?.id) {
          const currentStats = srUpdates[questions[currentIndex].id] || { consecutiveCorrect: 0 };
          srUpdates[questions[currentIndex].id] = calculateNextReview(finalChoiceIsCorrect, currentStats.consecutiveCorrect);
          hasUpdates = true;
        }

        if (hasUpdates) {
          await setDoc(srRef, srUpdates);
        }
      }
      
      // 4. Si on a une fonction de retour (particulièrement utile pour les examens)
      if (onExit) {
        onExit({
          score: finalScore,
          total: questions.length
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingScore(false);
    }
  };

  // ============================
  // RENDUS
  // ============================

  if (showToadaProgress) {
    return (
      <div className="w-full relative">
        <button 
          onClick={() => {
             if (onExit) onExit(null);
             else setShowToadaProgress(false);
          }} 
          className="absolute top-4 left-4 z-10 text-[10px] font-black uppercase text-encre-noire/50 hover:text-cordel-rouge"
        >
          🔙 Retour
        </button>
        <div className="pt-8">
          <StudentToadasProgress 
            profileData={profileData} 
            allSongs={allSongs} 
            allSheets={allSheets} 
          />
        </div>
      </div>
    );
  }

  if (step === 'HOME') {
    return (
      <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-4 select-none relative">
        {onExit && (
           <button 
             onClick={() => onExit(null)} 
             className="absolute top-0 left-0 z-10 text-[10px] font-black uppercase text-encre-noire/50 hover:text-cordel-rouge"
           >
             🔙 Quitter le QCM
           </button>
        )}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-cactus uppercase text-cordel-wood tracking-widest">
            Auto-évaluation
          </h2>
          <p className="text-sm text-cordel-master-dark opacity-80 max-w-lg mx-auto mb-2">
            Testez vos connaissances sur le répertoire, le vocabulaire et la culture de notre Nação.
          </p>
          <div className="bg-cordel-ocre/10 border-l-4 border-cordel-ocre p-3 text-left rounded-r max-w-lg mx-auto">
            <p className="text-xs font-bold text-cordel-master-dark flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Où réviser avant de se tester ?</strong><br/>
                Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !
              </span>
            </p>
          </div>
        </div>

        <CordelCard className="p-6 flex flex-col gap-6 items-center text-center bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30">
          <h3 className="text-xl font-black uppercase text-cordel-wood tracking-wider">
            Défi du jour
          </h3>
          <p className="text-xs">Un mélange de toutes les thématiques pour réviser efficacement !</p>
          <CordelButton variant="primary" onClick={() => startQuiz('MIX')} className="text-lg px-8 py-3 animate-pulse">
            🚀 Lancer le Défi Mix ({globalConfig.questionCount} Q)
          </CordelButton>
        </CordelCard>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
            <h3 className="font-black text-sm uppercase tracking-widest text-cordel-wood">
              Entraînement par Thème
            </h3>
            <select 
              className="text-[10px] p-1 border-2 border-encre-noire/20 rounded font-bold uppercase text-cordel-master-dark"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="easy">🌱 Débutant</option>
              <option value="medium">🥁 Confirmé</option>
              <option value="hard">🏆 Expert</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalConfig.themes.toadas && (
              <button onClick={() => setShowToadaProgress(true)} className="p-4 bg-white border-2 border-encre-noire/20 rounded-lg text-left hover:border-cordel-wood transition-colors group">
                <span className="block text-sm font-black text-cordel-wood group-hover:text-cordel-rouge uppercase tracking-wider mb-1">🎤 Toadas (Progression)</span>
                <span className="text-[10px] text-encre-noire/70">Réviser le répertoire et suivre votre jauge de Nação.</span>
              </button>
            )}
            {globalConfig.themes.traduction && (
              <button onClick={() => startQuiz('traduction')} className="p-4 bg-white border-2 border-encre-noire/20 rounded-lg text-left hover:border-cordel-wood transition-colors group">
                <span className="block text-sm font-black text-cordel-wood group-hover:text-cordel-rouge uppercase tracking-wider mb-1">🇧🇷 Traduction</span>
                <span className="text-[10px] text-encre-noire/70">Tester votre vocabulaire (Français / Portugais).</span>
              </button>
            )}
            {globalConfig.themes.culture && (
              <button onClick={() => startQuiz('culture')} className="p-4 bg-white border-2 border-encre-noire/20 rounded-lg text-left hover:border-cordel-wood transition-colors group">
                <span className="block text-sm font-black text-cordel-wood group-hover:text-cordel-rouge uppercase tracking-wider mb-1">📚 Culture</span>
                <span className="text-[10px] text-encre-noire/70">Questions sur l'histoire et les fondamentaux.</span>
              </button>
            )}
            {globalConfig.themes.atelier && (
              <button onClick={() => startQuiz('atelier')} className="p-4 bg-white border-2 border-encre-noire/20 rounded-lg text-left hover:border-cordel-wood transition-colors group">
                <span className="block text-sm font-black text-cordel-wood group-hover:text-cordel-rouge uppercase tracking-wider mb-1">🛠️ Atelier</span>
                <span className="text-[10px] text-encre-noire/70">Révisions techniques sur la couture et fabrication.</span>
              </button>
            )}
            {globalConfig.themes.danse && (
              <button onClick={() => startQuiz('danse')} className="p-4 bg-white border-2 border-encre-noire/20 rounded-lg text-left hover:border-cordel-wood transition-colors group">
                <span className="block text-sm font-black text-cordel-wood group-hover:text-cordel-rouge uppercase tracking-wider mb-1">💃 Danse (Dançador)</span>
                <span className="text-[10px] text-encre-noire/70">Reconnaissance visuelle des pas et familles.</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'QUIZ') {
    if (!questions || questions.length === 0) {
      return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-8 text-center animate-pulse text-cordel-wood font-bold">
          Génération du QCM en cours...
        </div>
      );
    }
    
    const q = questions[currentIndex];
    const promptText = q.questionText || q.prompt;
    const choices = q.choices || q.options?.map(o => ({ text: o, isCorrect: o === q.correctAnswer })) || [];

    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4 select-none">
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-encre-noire/20 shadow-sm">
          <CordelButton variant="default" onClick={() => onExit ? onExit() : setStep('HOME')} className="text-[10px] px-3 py-1 font-black uppercase">
            ✕ Quitter l'entraînement
          </CordelButton>
          <span className="font-black text-xs text-cordel-wood uppercase tracking-widest">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs font-bold text-cordel-vert">
            ⭐ {score}
          </span>
        </div>

        <CordelCard className="p-6 md:p-8 flex flex-col gap-8 items-center text-center min-h-[50vh] justify-center relative">
          <p className="text-xl md:text-2xl font-bold text-encre-noire leading-snug">
            {promptText}
          </p>

          {q.visualElement && q.visualElement.type === 'orixaBadge' && (
            <div className="flex justify-center my-4 animate-fadeIn">
              <SeloAxeStamp 
                size="lg" 
                stampKey={q.visualElement.stampKey} 
                couleurs={q.visualElement.couleurs} 
              />
            </div>
          )}

          {q.imageUrl && (
            <div className="flex justify-center my-4 animate-fadeIn w-full max-w-sm rounded-lg overflow-hidden border-4 border-cordel-wood/20 shadow-md">
              <img src={q.imageUrl} alt="Illustration de la question" className="w-full h-auto object-cover max-h-64" />
            </div>
          )}

          {q.audioUrl && q.audioUrl.startsWith('firestore:') ? (
            <FirestoreMediaRenderer url={q.audioUrl} />
          ) : q.audioUrl ? (
            <div className="flex justify-center my-4 animate-fadeIn w-full">
              <audio controls src={q.audioUrl} className="w-full max-w-sm rounded-full border-2 border-cordel-wood/20 shadow-sm" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {choices.map((c, i) => {
              let btnClass = "bg-white border-encre-noire/20 text-encre-noire hover:bg-neutral-100 hover:border-cordel-wood/50";
              if (showFeedback) {
                if (c.isCorrect) {
                  btnClass = "bg-[#2d6a4f] text-white border-[#1b4332] shadow-[2px_2px_0px_0px_#1b4332] scale-[1.02] z-10";
                } else if (selectedChoice?.text === c.text) {
                  btnClass = "bg-cordel-rouge text-white border-[#5c1c11] shadow-none opacity-90";
                } else {
                  btnClass = "bg-white border-encre-noire/10 text-encre-noire/30 opacity-40 scale-[0.98]";
                }
              }

              return (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => handleChoiceClick(c)}
                  className={`p-4 rounded-xl border-2 font-bold transition-all duration-300 ease-out text-sm md:text-base flex items-center justify-between gap-4 ${btnClass}`}
                >
                  <span className="text-left">{c.text}</span>
                  {c.visualElement && c.visualElement.type === 'orixaBadge' && (
                    <div className="shrink-0 scale-75 origin-right">
                      <SeloAxeStamp 
                        size="md" 
                        stampKey={c.visualElement.stampKey} 
                        couleurs={c.visualElement.couleurs} 
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {showFeedback && (
            <div className={`mt-4 p-4 rounded-lg border-2 flex flex-col gap-2 w-full animate-fadeIn text-left ${selectedChoice?.isCorrect ? 'bg-cordel-vert/10 border-cordel-vert' : 'bg-cordel-ocre/10 border-cordel-ocre'}`}>
              <h4 className={`text-sm font-black uppercase tracking-wider ${selectedChoice?.isCorrect ? 'text-cordel-vert' : 'text-cordel-ocre'}`}>
                {selectedChoice?.isCorrect ? "✅ Bien joué !" : "🌱 Presque !"}
              </h4>
              {!selectedChoice?.isCorrect && (
                <p className="text-xs font-bold text-encre-noire/80">
                  La bonne réponse était : <span className="font-black">{q.choices ? q.choices.find(c => c.isCorrect)?.text : q.correctAnswer}</span>
                  {q.correctAnswerExplanation ? ` - ${q.correctAnswerExplanation}` : ''}
                </p>
              )}
            </div>
          )}
        </CordelCard>
      </div>
    );
  }

  if (step === 'RESULT') {
    const percentage = score / questions.length;
    let message = "Bel effort !";
    let emoji = "💪";
    if (percentage >= 0.8) { message = "Excellent ! Quel talent !"; emoji = "🏆"; }
    else if (percentage >= 0.5) { message = "Pas mal du tout !"; emoji = "🥁"; }
    else { message = "Encore un peu d'entraînement !"; emoji = "🌱"; }

    const finalScoreDisplay = score + (selectedChoice?.isCorrect && !showFeedback ? 1 : 0);

    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4 select-none">
        <CordelCard className="p-8 flex flex-col gap-6 items-center text-center">
          <div className="text-5xl">{emoji}</div>
          <h2 className="text-3xl font-cactus uppercase text-cordel-wood tracking-widest">
            Bilan du Quiz
          </h2>
          <p className="text-xl font-bold text-encre-noire">
            {finalScoreDisplay} / {questions.length}
          </p>
          <p className="text-sm font-black text-[#2d6a4f] uppercase tracking-wider">
            {message}
          </p>

          {savingScore && <span className="text-[10px] animate-pulse">Enregistrement du score...</span>}

          {wrongAnswers.length > 0 && (
            <div className="w-full mt-4 flex flex-col gap-3 text-left bg-cordel-rouge/5 border border-cordel-rouge/20 p-4 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-cordel-rouge">
                À réviser :
              </span>
              {wrongAnswers.map((w, i) => (
                <div key={i} className="text-xs border-b border-cordel-rouge/10 pb-2 last:border-0 last:pb-0">
                  <p className="font-bold text-encre-noire/80 mb-1">{w.prompt}</p>
                  <p className="text-[#2d6a4f] font-black">➔ {w.correct}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <CordelButton variant="primary" onClick={() => onExit ? onExit() : setStep('HOME')} className="px-8 py-3 text-sm">
              {onExit ? "Terminer" : "Retour à l'Accueil"}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  return null;
}
