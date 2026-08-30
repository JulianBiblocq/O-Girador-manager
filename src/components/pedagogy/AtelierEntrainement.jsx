import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import AutoEvalQuizContainer from '../student/AutoEvalQuizContainer';
import QcmSequenceurBlindTest from './QcmSequenceurBlindTest';
import QcmSequenceurAssociation from './QcmSequenceurAssociation';
import QcmSignaux from './QcmSignaux';
import { parseSequencerJson } from '../../utils/sequencerParser';

export default function AtelierEntrainement({
  profileData,
  songs,
  educationalSheets,
  rhythms,
  rhythmsJsonData,
  rhythmsMetadata,
  sequenceurUrl
}) {
  const [activeQuizType, setActiveQuizType] = useState(null); // 'TRADUCTION', 'CULTURE', 'RYTHMES', 'SIGNAUX'
  const [activeTheme, setActiveTheme] = useState(null); // for AutoEvalQuizContainer (e.g. 'traduction', 'culture')

  const [selectedRhythmId, setSelectedRhythmId] = useState(null);
  const [rhythmMode, setRhythmMode] = useState(null); // 'BLIND_TEST' or 'ASSOCIATION'

  const handleStartTraduction = () => {
    setActiveTheme('traduction');
    setActiveQuizType('TRADUCTION');
  };

  const handleStartCulture = () => {
    setActiveTheme('culture');
    setActiveQuizType('CULTURE');
  };

  const handleStartRythmes = () => {
    setActiveQuizType('RYTHMES');
  };

  const handleStartSignaux = () => {
    setActiveQuizType('SIGNAUX');
  };

  const handleExitQuiz = () => {
    setActiveQuizType(null);
    setActiveTheme(null);
    setSelectedRhythmId(null);
    setRhythmMode(null);
  };

  const getRandomRhythm = (mode) => {
    let validRhythms = [];
    if (mode === 'BLIND_TEST') {
      validRhythms = rhythms.filter(r => r.isAudio);
    } else if (mode === 'ASSOCIATION') {
      validRhythms = rhythms.filter(r => r.isJson && r.isAudio);
    }
    if (validRhythms.length === 0) return null;
    return validRhythms[Math.floor(Math.random() * validRhythms.length)];
  };

  const handleStartRhythmMode = (mode) => {
    setRhythmMode(mode);
    const randomR = getRandomRhythm(mode);
    if (randomR) {
      setSelectedRhythmId(randomR.id);
    } else {
      setSelectedRhythmId(null);
    }
  };

  const handleNextRhythmQuiz = () => {
    const randomR = getRandomRhythm(rhythmMode);
    if (randomR) {
      setSelectedRhythmId(randomR.id);
    }
  };

  if (activeQuizType === 'TRADUCTION' || activeQuizType === 'CULTURE') {
    return (
      <div className="relative">
        <button 
          onClick={handleExitQuiz} 
          className="absolute -top-12 left-0 text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
        >
          ← Retour à l'Atelier
        </button>
        <AutoEvalQuizContainer 
          profileData={profileData} 
          allSongs={songs} 
          allSheets={educationalSheets} 
          initialTheme={activeTheme}
          onExit={handleExitQuiz}
        />
      </div>
    );
  }

  if (activeQuizType === 'SIGNAUX') {
    return (
      <QcmSignaux 
        onExit={handleExitQuiz} 
        rhythms={rhythms} 
        rhythmsMetadata={rhythmsMetadata} 
      />
    );
  }

  if (activeQuizType === 'RYTHMES') {
    if (!rhythmMode) {
      return (
        <div className="flex flex-col gap-6 items-center">
          <button 
            onClick={handleExitQuiz} 
            className="self-start text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
          >
            ← Retour à l'Atelier
          </button>
          
          <h2 className="text-2xl font-cactus text-cordel-wood uppercase">Choisis ton mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <CordelCard className="p-6 flex flex-col items-center gap-4 text-center hover:scale-105 transition-transform cursor-pointer" onClick={() => handleStartRhythmMode('BLIND_TEST')}>
              <span className="text-5xl">🎧</span>
              <h3 className="text-lg font-black uppercase text-encre-noire">Blind Test</h3>
              <p className="text-xs font-bold opacity-70">Identifie le pattern qui est joué à l'oreille.</p>
            </CordelCard>

            <CordelCard className="p-6 flex flex-col items-center gap-4 text-center hover:scale-105 transition-transform cursor-pointer" onClick={() => handleStartRhythmMode('ASSOCIATION')}>
              <span className="text-5xl">🧩</span>
              <h3 className="text-lg font-black uppercase text-encre-noire">Association</h3>
              <p className="text-xs font-bold opacity-70">Associe chaque ligne rythmique à son pupitre.</p>
            </CordelCard>
          </div>
        </div>
      );
    }

    if (!selectedRhythmId) {
      return (
        <div className="flex flex-col gap-6 items-center mt-8">
          <button 
            onClick={() => setRhythmMode(null)} 
            className="self-start text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
          >
            ← Changer de mode
          </button>
          <div className="text-center p-4 text-[#8b2a1a] font-bold bg-[#8b2a1a]/10 border-2 border-dashed border-[#8b2a1a]/50 rounded">
            Aucun rythme disponible pour ce mode (nécessite des fichiers audio{rhythmMode === 'ASSOCIATION' ? ' et des données JSON' : ''}).
          </div>
        </div>
      );
    }

    const rhythm = rhythms.find(r => r.id === selectedRhythmId);
    let testPatternData = null;
    if (rhythm && rhythm.isJson && rhythmsJsonData[rhythm.id]) {
      testPatternData = rhythmsJsonData[rhythm.id];
    } else {
      testPatternData = {
        info: { name: rhythm ? rhythm.titre : 'Inconnu' },
        name: rhythm ? rhythm.titre : 'Inconnu',
        tracks: [{ name: 'Piste Inconnue', steps: ['-', '-', '-', '-'] }]
      };
    }

    return (
      <div className="relative mt-8">
        <button 
          onClick={() => {
            setRhythmMode(null);
            setSelectedRhythmId(null);
          }} 
          className="absolute -top-12 left-0 text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
        >
          ← Changer de mode
        </button>

        {rhythmMode === 'BLIND_TEST' ? (
          <QcmSequenceurBlindTest 
            key={`blind_${selectedRhythmId}`}
            patternId={selectedRhythmId}
            patternData={testPatternData}
            audioUrl={rhythm?.url || rhythm?.audioUrl}
            onComplete={() => handleNextRhythmQuiz()}
          />
        ) : (
          <QcmSequenceurAssociation 
            key={`assoc_${selectedRhythmId}`}
            patternId={selectedRhythmId}
            patternData={testPatternData}
            audioUrl={rhythm?.url || rhythm?.audioUrl}
            onComplete={() => handleNextRhythmQuiz()}
          />
        )}
      </div>
    );
  }

  // Home Screen (Portal)
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-cactus text-cordel-wood uppercase">L'Atelier d'Entraînement</h2>
        <p className="text-sm font-bold text-cordel-master-dark opacity-80 max-w-xl mx-auto mt-2">
          Ici, tu peux lancer des jeux et des quiz interactifs pour tester tes connaissances en musique, danse et culture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Traduction & Paroles */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🗣️</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">Traduction & Paroles</h3>
          <p className="text-xs font-bold text-encre-noire/70">
            Teste ta compréhension des Toadas et enrichis ton vocabulaire.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton variant="wood" onClick={handleStartTraduction} className="w-full text-xs py-2 uppercase tracking-widest font-black">
              Lancer 🚀
            </CordelButton>
          </div>
        </CordelCard>

        {/* Culture & Orixás */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🌿</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">Culture & Orixás</h3>
          <p className="text-xs font-bold text-encre-noire/70">
            Plonge dans l'histoire, la religion et les origines du Maracatu.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton variant="ocre" onClick={handleStartCulture} className="w-full text-xs py-2 uppercase tracking-widest font-black">
              Lancer 🚀
            </CordelButton>
          </div>
        </CordelCard>

        {/* Rythmes & Blind-Tests */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🎧</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">Rythmes & Blind-Tests</h3>
          <p className="text-xs font-bold text-encre-noire/70">
            Aiguise ton oreille avec les exercices sur le séquenceur.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton variant="outline" onClick={handleStartRythmes} className="w-full text-xs py-2 uppercase tracking-widest font-black border-2 border-encre-noire hover:bg-encre-noire hover:text-white">
              Lancer 🚀
            </CordelButton>
          </div>
        </CordelCard>

        {/* Signaux du Maître */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🖐️</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">Signaux du Maître</h3>
          <p className="text-xs font-bold text-encre-noire/70">
            Mémorise et reconnais les gestes et signaux sonores utilisés par le mestre dans la roda.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton variant="outline" onClick={handleStartSignaux} className="w-full text-xs py-2 uppercase tracking-widest font-black border-2 border-encre-noire hover:bg-encre-noire hover:text-white">
              Lancer 🚀
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
