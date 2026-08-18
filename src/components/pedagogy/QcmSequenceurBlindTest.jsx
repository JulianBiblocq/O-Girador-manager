import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function QcmSequenceurBlindTest({ patternId, patternData, audioUrl, onComplete }) {
  const [choices, setChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!patternData) return;

    // Le vrai nom du rythme
    const correctName = patternData.info?.name || patternData.name || 'Rythme Inconnu';
    
    // Pour l'instant, on génère des leurres statiques si on n'a pas accès à la base complète.
    // Dans une implémentation finale, on passerait la liste des autres rythmes pour piocher.
    const allLeurres = ['Maracatu de Baque Virado', 'Ijexá', 'Ciranda', 'Coco', 'Caboclinho', 'Afoxé', 'Samba Reggae', 'Maculelê'];
    const filteredLeurres = allLeurres.filter(l => l !== correctName);
    const shuffledLeurres = filteredLeurres.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const allChoices = [
      { text: correctName, isCorrect: true },
      ...shuffledLeurres.map(l => ({ text: l, isCorrect: false }))
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
    <CordelCard variant="default" className="w-full max-w-lg p-6 flex flex-col gap-6 mx-auto bg-[var(--cordel-bg)] shadow-xl select-none">
      <div className="flex flex-col items-center gap-2 border-b-2 border-dashed border-[var(--cordel-border)]/20 pb-4">
        <h3 className="text-lg font-extrabold text-[var(--cordel-wood)] uppercase tracking-wider text-center">
          🎧 Blind Test
        </h3>
        <span className="text-xs uppercase font-bold tracking-wider opacity-60 text-center">
          Écoute l'audio et devine le rythme
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

      <div className="flex flex-col gap-3">
        {choices.map((choice, idx) => {
          let btnStyle = "bg-white border-black/20 text-black hover:bg-neutral-100";
          if (showFeedback) {
            if (choice.isCorrect) {
              btnStyle = "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md"; // Vert Validation
            } else if (selectedChoice === choice) {
              btnStyle = "bg-[#8b2a1a] text-white border-[#8b2a1a] shadow-md opacity-80"; // Rouge Terre Cuite
            } else {
              btnStyle = "bg-white border-black/10 text-black/40 opacity-50";
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
