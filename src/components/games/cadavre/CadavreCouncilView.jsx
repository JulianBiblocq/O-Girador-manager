import React, { useState, useEffect } from 'react';
import CordelCard from '../../CordelCard';
import PatternVisualizer from '../../pedagogy/PatternVisualizer';

/**
 * Vue du Conseil de Batterie : Délibération collective sur l'arrangement construit.
 * Affiche la frise récapitulative, un compte à rebours et permet de voter ou signaler une faille.
 */
export default function CadavreCouncilView({
  chain = {},
  councilVotes = {},
  players = {},
  currentUserId,
  isHost,
  onVote,
  onEvaluateRound
}) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [suspectStep, setSuspectStep] = useState(null);
  const hasVoted = Boolean(councilVotes[currentUserId]);

  const totalPlayers = Object.keys(players).length || 1;
  const votedCount = Object.keys(councilVotes).length;

  // Décompte de délibération de 10 secondes
  useEffect(() => {
    if (timeLeft <= 0) {
      if (isHost) onEvaluateRound();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isHost, onEvaluateRound]);

  // Si tous les joueurs ont voté et qu'on est l'hôte, évaluation possible sans attendre la fin du timer
  useEffect(() => {
    if (isHost && votedCount >= totalPlayers && totalPlayers > 0) {
      onEvaluateRound();
    }
  }, [votedCount, totalPlayers, isHost, onEvaluateRound]);

  return (
    <div className="flex flex-col gap-3 my-2 text-left animate-fade-in">
      {/* En-tête du Conseil avec Compteur */}
      <div className="p-3 bg-cordel-wood/10 border-l-4 border-cordel-wood rounded-r flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🗣️</span>
            <span>Conseil de Batterie</span>
          </h4>
          <p className="text-[11px] font-bold text-encre-noire">L'enchaînement est-il sans fausse note ?</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-cordel-master-dark">
            Votes : {votedCount}/{totalPlayers}
          </span>
          <div className="w-8 h-8 rounded-full border-2 border-cordel-wood flex items-center justify-center font-mono font-black text-xs text-cordel-wood bg-white shadow-sm">
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Frise Cordel horizontale des maillons */}
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
        {/* 1. Morceau */}
        <div className="min-w-[130px] flex-1 p-2.5 bg-white border border-cordel-master-dark/30 rounded shadow-sm text-center">
          <span className="text-[9px] font-mono font-bold text-cordel-wood uppercase block">1. Morceau</span>
          <span className="text-xs font-black text-encre-noire block mt-0.5 truncate">{chain.piece?.titre || 'Inconnu'}</span>
        </div>

        {/* 2. Pupitre */}
        <div className="min-w-[130px] flex-1 p-2.5 bg-white border border-cordel-master-dark/30 rounded shadow-sm text-center">
          <span className="text-[9px] font-mono font-bold text-cordel-wood uppercase block">2. Pupitre</span>
          <span className="text-xs font-black text-encre-noire block mt-0.5 truncate">{chain.instrument || 'Inconnu'}</span>
        </div>

        {/* 3. Tablature */}
        <div className="min-w-[160px] flex-[1.4] p-2 bg-white border border-cordel-master-dark/30 rounded shadow-sm flex flex-col items-center">
          <span className="text-[9px] font-mono font-bold text-cordel-wood uppercase block">3. Tablature</span>
          {chain.patternChoice?.pattern ? (
            <PatternVisualizer patternArray={chain.patternChoice.pattern} beatResolution={4} />
          ) : (
            <span className="text-[10px] text-cordel-master-dark/60 mt-1">Non définie</span>
          )}
        </div>

        {/* 4. Signal du Mestre */}
        <div className="min-w-[140px] flex-1 p-2.5 bg-white border border-cordel-master-dark/30 rounded shadow-sm text-center">
          <span className="text-[9px] font-mono font-bold text-cordel-wood uppercase block">4. Signal Mestre</span>
          <span className="text-xs font-black text-encre-noire block mt-0.5 truncate">
            {chain.signalChoice?.signal?.name || chain.signalChoice?.signal?.nom || 'Inconnu'}
          </span>
        </div>

        {/* 5. Bonus éventuel */}
        {chain.bonusChoice && (
          <div className="min-w-[140px] flex-1 p-2.5 bg-white border border-cordel-master-dark/30 rounded shadow-sm text-center">
            <span className="text-[9px] font-mono font-bold text-cordel-wood uppercase block">5. Bonus</span>
            <span className="text-[10px] font-bold text-encre-noire block mt-0.5 truncate">{chain.bonusChoice.bonusText}</span>
          </div>
        )}
      </div>

      {/* Zone de vote */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 bg-cordel-bg-light">
        {hasVoted ? (
          <div className="text-center py-2">
            <span className="text-xl block mb-1">🗳️</span>
            <p className="text-xs font-black text-cordel-vert uppercase">Ton vote est enregistré !</p>
            <p className="text-[10px] text-cordel-master-dark/70 mt-0.5">
              {councilVotes[currentUserId]?.isValid ? '« L\'enchaînement est calé »' : `« Faille signalée sur : ${councilVotes[currentUserId]?.suspectedStep} »`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase text-center text-encre-noire">Quelle est ta sentence ?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onVote(true, null)}
                className="py-2.5 px-3 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-cordel-vert text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:scale-95 transition-all cursor-pointer text-center"
              >
                ✅ L'enchaînement est calé
              </button>
              <button
                type="button"
                onClick={() => setSuspectStep(suspectStep ? null : 'pattern')}
                className="py-2.5 px-3 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-cordel-rouge text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:scale-95 transition-all cursor-pointer text-center"
              >
                ⚠️ Signaler une faille
              </button>
            </div>

            {/* Sous-choix du maillon suspecté */}
            {suspectStep && (
              <div className="mt-2 p-2 bg-white rounded border border-cordel-rouge/30 animate-fade-in flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-cordel-rouge uppercase">Désigne le maillon défaillant :</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onVote(false, 'pattern')}
                    className="py-1 px-2 text-[10px] font-bold border border-cordel-wood bg-cordel-bg-light hover:bg-cordel-wood hover:text-white rounded transition-colors"
                  >
                    Tablature fausse
                  </button>
                  <button
                    type="button"
                    onClick={() => onVote(false, 'signal')}
                    className="py-1 px-2 text-[10px] font-bold border border-cordel-wood bg-cordel-bg-light hover:bg-cordel-wood hover:text-white rounded transition-colors"
                  >
                    Signal Mestre faux
                  </button>
                  {chain.bonusChoice && (
                    <button
                      type="button"
                      onClick={() => onVote(false, 'bonus')}
                      className="py-1 px-2 text-[10px] font-bold border border-cordel-wood bg-cordel-bg-light hover:bg-cordel-wood hover:text-white rounded transition-colors"
                    >
                      Bonus erroné
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CordelCard>
    </div>
  );
}
