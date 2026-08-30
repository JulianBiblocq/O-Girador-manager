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
    if (!selectedRhythmId) {
      return (
        <div className="flex flex-col gap-6">
          <button 
            onClick={handleExitQuiz} 
            className="self-start text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
          >
            ← Retour à l'Atelier
          </button>
          
          <h2 className="text-2xl font-cactus text-center text-cordel-wood uppercase">
            Sélecteur de Rythme
          </h2>
          <p className="text-center text-sm font-bold text-cordel-master-dark/70">
            Choisis un rythme à travailler pour lancer les exercices d'écoute.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rhythms.filter(r => r.isAudio || r.isJson).map(rhythm => (
              <CordelCard key={rhythm.id} className="p-4 flex flex-col gap-3 justify-between hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setSelectedRhythmId(rhythm.id)}>
                <h3 className="text-sm font-black uppercase text-encre-noire text-center">{rhythm.titre}</h3>
                <div className="flex justify-center gap-2">
                  {rhythm.isAudio && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-bold">Audio ✅</span>}
                  {rhythm.isJson && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold">JSON ✅</span>}
                </div>
              </CordelCard>
            ))}
          </div>
        </div>
      );
    }

    if (!rhythmMode) {
      return (
        <div className="flex flex-col gap-6 items-center">
          <button 
            onClick={() => setSelectedRhythmId(null)} 
            className="self-start text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
          >
            ← Retour aux rythmes
          </button>
          
          <h2 className="text-2xl font-cactus text-cordel-wood uppercase">Choisis ton mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <CordelCard className="p-6 flex flex-col items-center gap-4 text-center hover:scale-105 transition-transform cursor-pointer" onClick={() => setRhythmMode('BLIND_TEST')}>
              <span className="text-5xl">🎧</span>
              <h3 className="text-lg font-black uppercase text-encre-noire">Blind Test</h3>
              <p className="text-xs font-bold opacity-70">Identifie le pattern qui est joué à l'oreille.</p>
            </CordelCard>

            <CordelCard className="p-6 flex flex-col items-center gap-4 text-center hover:scale-105 transition-transform cursor-pointer" onClick={() => setRhythmMode('ASSOCIATION')}>
              <span className="text-5xl">🧩</span>
              <h3 className="text-lg font-black uppercase text-encre-noire">Association</h3>
              <p className="text-xs font-bold opacity-70">Associe chaque ligne rythmique à son pupitre.</p>
            </CordelCard>
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
          onClick={() => setRhythmMode(null)} 
          className="absolute -top-12 left-0 text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4"
        >
          ← Changer de mode
        </button>

        {rhythmMode === 'BLIND_TEST' ? (
          <QcmSequenceurBlindTest 
            patternId={selectedRhythmId}
            patternData={testPatternData}
            audioUrl={rhythm?.url || rhythm?.audioUrl}
            onComplete={(isCorrect) => console.log(`Blind Test : ${isCorrect ? 'Gagné' : 'Perdu'}`)}
          />
        ) : (
          <QcmSequenceurAssociation 
            patternId={selectedRhythmId}
            patternData={testPatternData}
            audioUrl={rhythm?.url || rhythm?.audioUrl}
            onComplete={(isCorrect) => console.log(`Association : ${isCorrect ? 'Gagné' : 'Perdu'}`)}
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
