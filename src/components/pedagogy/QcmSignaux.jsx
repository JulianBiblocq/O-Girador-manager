import React, { useState, useEffect } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function QcmSignaux({ onExit, rhythms = [], rhythmsMetadata = {} }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);

  // Fetch signals on mount
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const folderRef = ref(storage, 'sinais');
        const res = await listAll(folderRef);
        const data = await Promise.all(
          res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return {
              id: itemRef.name,
              name: itemRef.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "), // remove extension and underscores
              imageUrl: url,
              description: "Signal du Mestre"
            };
          })
        );
        
        // Only keep signals that have an image and a name
        const validSignals = data.filter(s => s.imageUrl && s.name);
        setSignals(validSignals);
      } catch (err) {
        console.error("Erreur lors de la récupération des signaux depuis le Storage :", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSignals();
  }, []);

  // Generate questions once signals are loaded
  useEffect(() => {
    if (signals.length >= 4) {
      generateQuestions(5);
    }
  }, [signals]);

  const generateQuestions = (numQuestions) => {
    const newQuestions = [];
    
    // Find rhythms that have both an audio file and an associated signal
    const rhythmsWithSignals = rhythms.filter(r => 
      r.audioUrl && 
      rhythmsMetadata[r.id]?.associatedSignalId &&
      signals.some(s => s.id === rhythmsMetadata[r.id].associatedSignalId)
    );
    
    for (let i = 0; i < numQuestions; i++) {
      let type;
      
      // Determine question type: 33% chance each if we have audio rhythms available, else 50/50
      if (rhythmsWithSignals.length > 0) {
        const rand = Math.random();
        if (rand < 0.33) type = 'GUESS_NAME';
        else if (rand < 0.66) type = 'GUESS_IMAGE';
        else type = 'GUESS_SIGNAL_FROM_AUDIO';
      } else {
        type = Math.random() > 0.5 ? 'GUESS_NAME' : 'GUESS_IMAGE';
      }
      
      let correctSignal;
      let associatedRhythm = null;
      
      if (type === 'GUESS_SIGNAL_FROM_AUDIO') {
        associatedRhythm = rhythmsWithSignals[Math.floor(Math.random() * rhythmsWithSignals.length)];
        const sigId = rhythmsMetadata[associatedRhythm.id].associatedSignalId;
        correctSignal = signals.find(s => s.id === sigId);
      } else {
        correctSignal = signals[Math.floor(Math.random() * signals.length)];
      }
      
      // Pick 3 distractors
      let otherSignals = signals.filter(s => s.id !== correctSignal.id);
      otherSignals = otherSignals.sort(() => 0.5 - Math.random());
      const distractors = otherSignals.slice(0, 3);
      
      const allChoices = [
        { ...correctSignal, isCorrect: true },
        ...distractors.map(d => ({ ...d, isCorrect: false }))
      ].sort(() => 0.5 - Math.random());

      newQuestions.push({
        type,
        correctSignal,
        associatedRhythm,
        choices: allChoices
      });
    }
    
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setShowFeedback(false);
    setSelectedChoice(null);
  };

  const handleChoice = (choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);
    if (choice.isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
      setSelectedChoice(null);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-cordel-master-dark animate-pulse font-bold uppercase text-xs">Chargement des signaux...</div>;
  }

  if (signals.length < 4) {
    return (
      <div className="flex flex-col items-center gap-4 mt-8">
        <CordelCard className="p-6 text-center max-w-md w-full border-[#8b2a1a] bg-[#fdfaf2]">
          <h3 className="text-lg font-black text-[#8b2a1a] uppercase mb-2">Attention</h3>
          <p className="text-xs font-bold text-encre-noire/70 mb-4">
            Il n'y a pas assez de signaux configurés avec une image. 
            Il en faut au minimum 4 pour générer un quiz.
          </p>
          <CordelButton variant="wood" onClick={onExit} className="text-xs px-4 py-2 uppercase font-black">
            Retour à l'Atelier
          </CordelButton>
        </CordelCard>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 mt-8 animate-[fadeIn_0.5s_ease-out]">
        <CordelCard className="p-8 text-center max-w-md w-full border-cordel-wood">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-cactus text-cordel-wood uppercase mb-2">Entraînement Terminé !</h2>
          <p className="text-sm font-bold text-encre-noire/80 mb-6">
            Ton score : <span className="text-xl text-[#2d6a4f]">{score}</span> / {questions.length}
          </p>
          <div className="flex justify-center gap-4">
            <CordelButton variant="outline" onClick={onExit} className="text-xs px-4 py-2 uppercase font-black border-2 border-encre-noire">
              Quitter
            </CordelButton>
            <CordelButton variant="wood" onClick={() => generateQuestions(5)} className="text-xs px-4 py-2 uppercase font-black shadow-md">
              Rejouer 🔄
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="w-full flex justify-between items-center px-4 max-w-2xl mx-auto">
        <button 
          onClick={onExit} 
          className="text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
        >
          ← Retour
        </button>
        <div className="text-xs font-black uppercase text-encre-noire/60 tracking-wider">
          Question {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <CordelCard variant="default" className="w-full max-w-2xl p-6 flex flex-col gap-6 mx-auto bg-[var(--cordel-bg)] shadow-xl select-none">
        
        {currentQ.type === 'GUESS_NAME' ? (
          <>
            <div className="flex flex-col items-center gap-2 border-b-2 border-dashed border-[var(--cordel-border)]/20 pb-4">
              <h3 className="text-lg font-extrabold text-[var(--cordel-wood)] uppercase tracking-wider text-center">
                Quel est ce signal ?
              </h3>
            </div>
            <div className="flex justify-center w-full">
              <img 
                src={currentQ.correctSignal.imageUrl} 
                alt="Signal mystère" 
                className="w-full max-w-sm h-64 object-contain rounded shadow-md border-2 border-encre-noire/10 bg-white p-2"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {currentQ.choices.map((choice, idx) => {
                let btnStyle = "bg-white border-black/20 text-black hover:bg-neutral-100";
                if (showFeedback) {
                  if (choice.isCorrect) btnStyle = "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md";
                  else if (selectedChoice === choice) btnStyle = "bg-[#8b2a1a] text-white border-[#8b2a1a] shadow-md opacity-80";
                  else btnStyle = "bg-white border-black/10 text-black/40 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoice(choice)}
                    disabled={showFeedback}
                    className={`text-left px-4 py-3 rounded-lg border-2 font-bold transition-all text-sm ${btnStyle}`}
                  >
                    {choice.name}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 border-b-2 border-dashed border-[var(--cordel-border)]/20 pb-4">
              {currentQ.type === 'GUESS_SIGNAL_FROM_AUDIO' ? (
                <>
                  <h3 className="text-lg font-extrabold text-[var(--cordel-wood)] uppercase tracking-wider text-center flex items-center gap-2">
                    🎧 Quel est le signal pour ce rythme ?
                  </h3>
                  <div className="flex justify-center w-full my-4">
                    <audio key={currentQ.associatedRhythm.audioUrl} controls src={currentQ.associatedRhythm.audioUrl} className="w-full max-w-sm rounded outline-none shadow-md" />
                  </div>
                </>
              ) : (
                <h3 className="text-lg font-extrabold text-[var(--cordel-wood)] uppercase tracking-wider text-center">
                  Lequel correspond à : <span className="text-[#8b2a1a]">"{currentQ.correctSignal.name}"</span> ?
                </h3>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              {currentQ.choices.map((choice, idx) => {
                let cardStyle = "border-black/20 hover:border-cordel-wood/50 bg-white";
                let overlay = null;
                
                if (showFeedback) {
                  if (choice.isCorrect) {
                    cardStyle = "border-[#2d6a4f] bg-[#2d6a4f]/10 shadow-md";
                    overlay = <div className="absolute inset-0 border-4 border-[#2d6a4f] rounded-lg pointer-events-none"></div>;
                  } else if (selectedChoice === choice) {
                    cardStyle = "border-[#8b2a1a] bg-[#8b2a1a]/10 shadow-md opacity-80";
                    overlay = <div className="absolute inset-0 border-4 border-[#8b2a1a] rounded-lg pointer-events-none"></div>;
                  } else {
                    cardStyle = "border-black/10 opacity-50 bg-white";
                  }
                }

                return (
                  <div 
                    key={idx} 
                    className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${cardStyle}`}
                    onClick={() => !showFeedback && handleChoice(choice)}
                  >
                    <img 
                      src={choice.imageUrl} 
                      alt="Choix possible" 
                      className="w-full h-32 md:h-48 object-contain rounded"
                    />
                    {currentQ.type === 'GUESS_SIGNAL_FROM_AUDIO' && showFeedback && (
                      <span className="text-xs font-bold text-center mt-2">{choice.name}</span>
                    )}
                    {overlay}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showFeedback && (
          <div className="flex flex-col items-center gap-2 mt-2 animate-[fadeIn_0.3s_ease-out]">
            <p className="text-xs font-bold text-encre-noire/70 italic text-center max-w-sm">
              {currentQ.type === 'GUESS_SIGNAL_FROM_AUDIO' ? (
                <>Le bon signal était <strong>{currentQ.correctSignal.name}</strong>, qui correspond au rythme <strong>{currentQ.associatedRhythm.info?.name || currentQ.associatedRhythm.name}</strong>.</>
              ) : (
                "Signal du Mestre"
              )}
            </p>
            <CordelButton variant="ocre" onClick={handleNext} className="text-xs font-black uppercase px-8 py-2 shadow-md mt-2">
              Continuer ➔
            </CordelButton>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
