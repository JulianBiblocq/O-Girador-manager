// Atelier d'Entraînement recentré sur la révision, les quiz culture et les défis en direct
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import AutoEvalQuizContainer from '../student/AutoEvalQuizContainer';
import GameStatsCard from '../games/GameStatsCard';
import GameThemeSelectorModal from '../games/GameThemeSelectorModal';

export default function AtelierEntrainement({
  profileData,
  songs = [],
  educationalSheets = []
}) {
  const [activeQuizType, setActiveQuizType] = useState(null); // 'PAROLES' | 'CULTURE' | 'RODA_QUIZ'
  const [activeTheme, setActiveTheme] = useState(null); // 'traduction' | 'culture'
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);

  const handleStartParoles = () => {
    setActiveTheme('traduction');
    setActiveQuizType('PAROLES');
  };

  const handleStartCulture = () => {
    setActiveTheme('culture');
    setActiveQuizType('CULTURE');
  };

  const handleStartRodaQuiz = () => {
    setIsGameSelectorOpen(true);
  };

  const handleExitQuiz = () => {
    setActiveQuizType(null);
    setActiveTheme(null);
  };

  // 1. Vue active : Révision des Chants ou Quiz Culture
  if (activeQuizType === 'PAROLES' || activeQuizType === 'CULTURE') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleExitQuiz}
          className="absolute -top-12 left-0 text-sm font-bold text-cordel-master-dark hover:text-cordel-wood underline underline-offset-4 cursor-pointer"
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

  // 2. Vue d'accueil de l'Atelier : les 3 formats pertinents
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-heading text-cordel-wood uppercase">
          🎯 L'Atelier d'Entraînement
        </h2>
        <p className="text-xs md:text-sm font-bold text-cordel-master-dark opacity-80 max-w-xl mx-auto mt-1.5">
          Pratiquez à votre rythme : mémorisation des paroles, quiz culturels et défis multijoueurs en direct.
        </p>
      </div>

      {/* Encart Statistiques des Défis Multijoueurs */}
      {profileData?.uid && (
        <GameStatsCard
          userId={profileData.uid}
          groupId={profileData.groupId}
        />
      )}

      {/* Les 3 grands formats de pratique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Format 1 : Révision des Chants & Paroles */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716] group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🙈</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">
            Révision des Chants &amp; Paroles
          </h3>
          <p className="text-xs font-bold text-encre-noire/70 leading-relaxed">
            Mode flashcard et masquage dynamique. Travaillez la mémorisation du texte et la compréhension des toadas.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton
              variant="wood"
              onClick={handleStartParoles}
              className="w-full text-xs py-2 uppercase tracking-widest font-black shadow-xs"
            >
              Lancer la révision 🚀
            </CordelButton>
          </div>
        </CordelCard>

        {/* Format 2 : Roda Quiz & Défis en direct */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716] group">
          <div className="text-6xl group-hover:scale-110 transition-transform">🎲</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">
            Roda Quiz &amp; Défis en direct
          </h3>
          <p className="text-xs font-bold text-encre-noire/70 leading-relaxed">
            Arène multijoueurs en temps réel. Proposez une manche ou rejoignez vos camarades pour tester vos réflexes dans la roda.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton
              variant="primary"
              onClick={handleStartRodaQuiz}
              className="w-full text-xs py-2 uppercase tracking-widest font-black shadow-xs bg-[var(--color-cordel-vert)] text-white hover:brightness-110"
            >
              Lancer un défi 🎲
            </CordelButton>
          </div>
        </CordelCard>

        {/* Format 3 : Quiz Culture & Traditions */}
        <CordelCard className="p-6 flex flex-col items-center text-center gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716] group">
          <div className="text-6xl group-hover:scale-110 transition-transform">📜</div>
          <h3 className="text-base font-black uppercase text-encre-noire tracking-wider">
            Quiz Culture &amp; Traditions
          </h3>
          <p className="text-xs font-bold text-encre-noire/70 leading-relaxed">
            Questions tirées des fiches du Varal Culture. Plongez dans l'histoire, la mythologie des Orixás et les racines de la tradition.
          </p>
          <div className="mt-auto pt-4 w-full">
            <CordelButton
              variant="ocre"
              onClick={handleStartCulture}
              className="w-full text-xs py-2 uppercase tracking-widest font-black shadow-xs"
            >
              Lancer le quiz 📜
            </CordelButton>
          </div>
        </CordelCard>

      </div>

      {/* Sélecteur de thème pour le défi en direct */}
      {isGameSelectorOpen && (
        <GameThemeSelectorModal
          isOpen={isGameSelectorOpen}
          onClose={() => setIsGameSelectorOpen(false)}
          onSelectTheme={(themeId) => {
            setIsGameSelectorOpen(false);
            if (themeId === 'culture') {
              handleStartCulture();
            } else {
              handleStartParoles();
            }
          }}
        />
      )}
    </div>
  );
}
