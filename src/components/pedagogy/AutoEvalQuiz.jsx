import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SeloAxeStamp from '../SeloAxeStamp';
import { generateQuizFromSheet, generateQuizFromSong } from '../../utils/quizGenerator';

export default function AutoEvalQuiz({ sheetData, allSheetsData, profileData, onClose, customQuizData, customQuizId, customQuizTitle, songData, allSongsData, qcmGlobalConfig, isSong, rhythms, sequenceurUrl }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (customQuizData) {
      // Shuffle choices for custom quiz data
      const processed = customQuizData.map(q => {
        const choices = [
          { text: q.bonneReponse, isCorrect: true },
          ...q.mauvaisesReponses.map(mr => ({ text: mr, isCorrect: false }))
        ];
        return {
          question: q.texte,
          choices: choices.sort(() => Math.random() - 0.5)
        };
      });
      setQuestions(processed.sort(() => Math.random() - 0.5));
    } else if (isSong) {
      const generated = generateQuizFromSong(songData, allSongsData, allSheetsData, qcmGlobalConfig);
      setQuestions(generated);
    } else {
      const generated = generateQuizFromSheet(sheetData, allSheetsData, allSongsData, { difficulty: qcmGlobalConfig?.difficulty || 'medium' });
      setQuestions(generated);
    }
  }, [sheetData, allSheetsData, customQuizData, isSong, songData, allSongsData, qcmGlobalConfig]);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
        <CordelCard className="p-6 text-center max-w-sm">
          <p className="text-sm font-bold opacity-75 mb-4">
            {isSong ? "Impossible de générer un quiz pour ce chant avec la configuration actuelle." : "Cette fiche ne contient pas assez de mots en gras ou de lexique pour générer un quiz."}
          </p>
          <CordelButton variant="default" onClick={onClose}>Fermer</CordelButton>
        </CordelCard>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleChoice = (choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);
    if (choice.isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedChoice(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    const finalScore = score + (selectedChoice?.isCorrect && !showFeedback ? 1 : 0);
    const percentage = finalScore / questions.length;
    
    // Si bon score (>= 75%), on sauvegarde
    if (percentage >= 0.75 && profileData?.uid && profileData?.groupId) {
      const targetId = customQuizId || (isSong ? songData?.id : sheetData?.id);
      if (!targetId) return;
      setIsSaving(true);
      try {
        const parcoursRef = doc(db, 'users', profileData.uid, 'parcours', profileData.groupId);
        const docSnap = await getDoc(parcoursRef);
        let currentEvals = {};
        if (docSnap.exists() && docSnap.data().evaluations) {
          currentEvals = docSnap.data().evaluations;
        }
        
        // On augmente le confort : si c'était vide -> pratique, si pratique -> alaise, etc.
        let newLevel = 'pratique'; // 🌿
        const currentLevel = currentEvals[targetId];
        if (currentLevel === 'pratique') newLevel = 'alaise';
        else if (currentLevel === 'alaise') newLevel = 'referent';
        else if (currentLevel === 'referent') newLevel = 'referent';
        
        await setDoc(parcoursRef, { evaluations: { ...currentEvals, [targetId]: newLevel } }, { merge: true });
        setSavedSuccess(true);
      } catch (err) {
        console.error("Erreur de sauvegarde quiz :", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const percentage = score / questions.length;
  const isSuccess = percentage >= 0.75;

  const getSequencerUrl = () => {
    if (!sequenceurUrl || !rhythms) return null;
    let targetRhythmName = null;
    if (isSong && songData?.rythme) {
      targetRhythmName = songData.rythme.toLowerCase();
    } else if (customQuizTitle) { // Peut-être un quiz de rythme directement
      targetRhythmName = customQuizTitle.toLowerCase();
    }
    if (!targetRhythmName) return null;

    const matchedRhythm = rhythms.find(r => targetRhythmName.includes(r.titre.toLowerCase()) || r.titre.toLowerCase().includes(targetRhythmName));
    if (matchedRhythm) {
      const baseUrl = sequenceurUrl || 'https://sequenceur.app';
      return baseUrl.includes('?') 
        ? `${baseUrl}&file=${encodeURIComponent(matchedRhythm.jsonUrl)}&karaoke=true`
        : `${baseUrl}?file=${encodeURIComponent(matchedRhythm.jsonUrl)}&karaoke=true`;
    }
    return null;
  };
  
  const seqUrl = getSequencerUrl();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 select-none animate-fadeIn">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-lg p-6 text-left relative bg-cordel-bg shadow-xl">
        
        {!isFinished ? (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-end border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
              <h3 className="text-sm font-extrabold text-cordel-wood uppercase tracking-wider">
                🧠 Quiz : {isSong ? songData?.titre : (sheetData?.themeCulture === 'orixas' && sheetData?.personnageOrisha ? sheetData.personnageOrisha : (sheetData?.titre || customQuizTitle || 'Personnalisé'))}
              </h3>
              <span className="text-[10px] font-black text-cordel-master-dark/50">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {currentQuestion.instruction}
              </span>
              <p className="text-base font-bold text-encre-noire leading-relaxed">
                {currentQuestion.questionText}
              </p>
              
              {currentQuestion.visualElement && currentQuestion.visualElement.type === 'orixaBadge' && (
                <div className="flex justify-center my-4 animate-fadeIn">
                  <SeloAxeStamp 
                    size="lg" 
                    stampKey={currentQuestion.visualElement.stampKey} 
                    couleurs={currentQuestion.visualElement.couleurs} 
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {currentQuestion.choices.map((choice, idx) => {
                let btnStyle = "bg-white border-encre-noire/20 text-encre-noire hover:bg-neutral-100";
                if (showFeedback) {
                  if (choice.isCorrect) {
                    btnStyle = "bg-cordel-vert text-white border-cordel-vert shadow-md";
                  } else if (selectedChoice === choice) {
                    btnStyle = "bg-cordel-rouge text-white border-cordel-rouge shadow-md opacity-80";
                  } else {
                    btnStyle = "bg-white border-encre-noire/10 text-encre-noire/40 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoice(choice)}
                    disabled={showFeedback}
                    className={`text-left px-4 py-3 rounded-lg border-2 font-bold transition-all flex items-center justify-between gap-4 ${btnStyle}`}
                  >
                    <span>{choice.text}</span>
                    {choice.visualElement && choice.visualElement.type === 'orixaBadge' && (
                      <div className="shrink-0 scale-75 origin-right">
                        <SeloAxeStamp 
                          size="md" 
                          stampKey={choice.visualElement.stampKey} 
                          couleurs={choice.visualElement.couleurs} 
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div className="mt-2 p-3 bg-cordel-bg-light/50 border border-cordel-master-dark/20 rounded text-xs font-semibold italic text-cordel-wood animate-fadeIn">
                💡 {currentQuestion.feedback}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <CordelButton variant="default" onClick={onClose} className="text-[10px] px-3 py-1">Quitter</CordelButton>
              {showFeedback && (
                <CordelButton variant="ocre" onClick={handleNext} className="text-[10px] font-black uppercase px-4 py-1.5 animate-pulse">
                  {currentIndex < questions.length - 1 ? "Question Suivante ➔" : "Voir le Résultat 🏆"}
                </CordelButton>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <h3 className="text-2xl font-cactus text-cordel-wood uppercase tracking-widest">
              Résultat du Quiz
            </h3>
            
            <div className="text-4xl my-2">
              {isSuccess ? "🎉" : "💪"}
            </div>
            
            <p className="text-sm font-bold text-encre-noire">
              Tu as obtenu {score} bonne(s) réponse(s) sur {questions.length} !
            </p>

            {isSuccess ? (
              <div className="bg-[#2d6a4f]/10 p-4 rounded-lg border border-[#2d6a4f]/30 flex flex-col gap-2 w-full mt-2">
                <p className="text-xs font-bold text-[#2d6a4f]">
                  Superbe ! Ton niveau de confort sur ce sujet augmente !
                </p>
                <div className="flex justify-center items-center gap-2 text-lg">
                  <span className="opacity-50 blur-[1px]">🌱</span> ➔ <span>🌿</span> ➔ <span className="opacity-50 blur-[1px]">🌳</span>
                </div>
                {isSaving && <span className="text-[9px] animate-pulse">Sauvegarde en cours...</span>}
                {savedSuccess && <span className="text-[10px] font-black uppercase text-[#2d6a4f]">Progression enregistrée ✅</span>}
              </div>
            ) : (
              <div className="bg-[#c05621]/10 p-4 rounded-lg border border-[#c05621]/30 flex flex-col gap-2 w-full mt-2">
                <p className="text-xs font-bold text-[#c05621]">
                  Tu y es presque ! N'hésite pas à relire la fiche et à retenter ta chance.
                </p>
              </div>
            )}

            <div className="flex justify-center flex-wrap gap-4 mt-6">
              <CordelButton variant="default" onClick={onClose} className="px-6 py-2 text-xs font-bold">
                {isSuccess ? "Fermer" : (isSong ? "Relire le chant" : "Relire la fiche")}
              </CordelButton>
              {seqUrl && (
                <a 
                  href={seqUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-cordel-vert text-white rounded border border-[#1b4332] shadow-[2px_2px_0px_0px_#1b4332] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center justify-center"
                >
                  🎧 S'entraîner sur le Séquenceur
                </a>
              )}
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
