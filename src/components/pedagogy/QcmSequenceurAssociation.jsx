import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import PatternVisualizer from './PatternVisualizer';

export default function QcmSequenceurAssociation({ patternId, patternData, audioUrl, onComplete }) {
  const [choices, setChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!patternData) return;

    // On va chercher la piste principale pour générer la grille (ex: Alfaia, ou la première piste non vide)
    let mainTrack = patternData.tracks?.find(t => t.name?.toLowerCase().includes('alfaia') && t.steps?.length > 0);
    if (!mainTrack) {
      mainTrack = patternData.tracks?.find(t => t.steps?.length > 0);
    }
    
    if (!mainTrack || !mainTrack.steps) {
      console.warn("Pas de piste utilisable trouvée pour le pattern");
      return;
    }

    const correctSteps = mainTrack.steps;

    // Fonction pour générer un faux pattern en modifiant quelques coups
    const generateFakePattern = (originalSteps) => {
      const fake = [...originalSteps];
      // On inverse l'état d'une ou deux cases au hasard
      const nbMutations = Math.max(1, Math.floor(fake.length * 0.15)); // 15% de mutations
      for (let i = 0; i < nbMutations; i++) {
        const indexToMutate = Math.floor(Math.random() * fake.length);
        const current = fake[indexToMutate];
        if (current === 0 || current === '0' || current === '-') {
          fake[indexToMutate] = 'D'; // Ajout d'un coup (D pour Droite/coup standard)
        } else {
          fake[indexToMutate] = 0; // Suppression d'un coup
        }
      }
      return fake;
    };

    const fake1 = generateFakePattern(correctSteps);
    const fake2 = generateFakePattern(correctSteps);
    const fake3 = generateFakePattern(correctSteps);

    const allChoices = [
      { visual: correctSteps, isCorrect: true },
      { visual: fake1, isCorrect: false },
      { visual: fake2, isCorrect: false },
      { visual: fake3, isCorrect: false }
    ];
    
    setChoices(allChoices.sort(() => 0.5 - Math.random()));
  }, [patternData]);

  const handleChoice = (choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (onComplete) {
      onComplete(selectedChoice?.isCorrect);
    }
  };

  if (!patternData) {
    return <div className="text-center p-4 text-cordel-master-dark animate-pulse">Chargement du rythme...</div>;
  }

  return (
    <CordelCard variant="default" className="w-full max-w-xl p-6 flex flex-col gap-6 mx-auto bg-[var(--cordel-bg)] shadow-xl select-none">
      <div className="flex flex-col items-center gap-2 border-b-2 border-dashed border-[var(--cordel-border)]/20 pb-4">
        <h3 className="text-lg font-extrabold text-[var(--cordel-wood)] uppercase tracking-wider text-center">
          🧩 Association
        </h3>
        <span className="text-xs uppercase font-bold tracking-wider opacity-60 text-center">
          Quelle partition correspond à l'audio ?
        </span>
      </div>

      {audioUrl ? (
        <div className="flex justify-center w-full">
          <audio key={audioUrl} controls src={audioUrl} className="w-full max-w-sm rounded outline-none shadow-md" />
        </div>
      ) : (
        <div className="text-center p-4 text-[#8b2a1a] font-bold border-2 border-dashed border-[#8b2a1a]/50 rounded bg-[#8b2a1a]/10">
          Aucun fichier audio disponible pour ce rythme.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {choices.map((choice, idx) => {
          let containerStyle = "border-black/20 bg-white hover:border-[#c05621]/50 hover:shadow-md"; // Ocre
          let bgStyle = "";
          
          if (showFeedback) {
            if (choice.isCorrect) {
              containerStyle = "border-[#2d6a4f] shadow-lg z-10 ring-2 ring-[#2d6a4f]"; // Vert
              bgStyle = "bg-[#2d6a4f]/10";
            } else if (selectedChoice === choice) {
              containerStyle = "border-[#8b2a1a] shadow-md opacity-80 ring-2 ring-[#8b2a1a]"; // Rouge
              bgStyle = "bg-[#8b2a1a]/10";
            } else {
              containerStyle = "border-black/10 opacity-50 grayscale";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleChoice(choice)}
              disabled={showFeedback}
              className={`relative overflow-hidden rounded-lg border-4 transition-all transform hover:scale-[1.02] active:scale-95 p-3 flex flex-col items-center justify-center ${containerStyle} ${bgStyle}`}
            >
              <div className="w-full overflow-hidden pointer-events-none origin-center scale-90 md:scale-100 flex justify-center">
                <PatternVisualizer patternArray={choice.visual} beatResolution={4} />
              </div>
              
              {showFeedback && (
                <div className="absolute top-2 right-2 flex items-center justify-center">
                  <span className="text-2xl drop-shadow-md">
                    {choice.isCorrect ? '✅' : (selectedChoice === choice ? '❌' : '')}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className="flex justify-center mt-2 animate-[fadeIn_0.3s_ease-out]">
          <CordelButton variant="ocre" onClick={handleNext} className="text-xs font-black uppercase px-6 py-2 shadow-md">
            Continuer ➔
          </CordelButton>
        </div>
      )}
    </CordelCard>
  );
}
