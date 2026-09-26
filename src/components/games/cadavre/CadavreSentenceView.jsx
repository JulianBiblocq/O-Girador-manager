import React, { useRef, useState } from 'react';
import CordelCard from '../../CordelCard';

/**
 * Vue de la Sentence Sonore : Bilan de la manche, écoute du morceau et transition.
 */
export default function CadavreSentenceView({
  roundEvaluation = {},
  chain = {},
  currentRoundIndex = 0,
  totalRounds = 1,
  isHost,
  onNextRound,
  onFinishGame
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isPerfect = false, isSavedByCouncil = false, pointsEarned = 0, explanation = '' } = roundEvaluation || {};
  const audioUrl = chain.piece?.audioUrl || chain.piece?.activeAudioUrl || chain.piece?.preset?.audioUrl || null;
  const isLastRound = currentRoundIndex + 1 >= totalRounds;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.warn('[Audio] Erreur de lecture :', e));
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col gap-3 my-2 text-left animate-fade-in">
      {/* Carte Résultat Principal */}
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className={`p-4 text-center ${
          isPerfect
            ? 'bg-cordel-vert/10 border-cordel-vert'
            : isSavedByCouncil
              ? 'bg-cordel-ocre/10 border-cordel-ocre'
              : 'bg-cordel-rouge/10 border-cordel-rouge'
        }`}
      >
        <span className="text-3xl block mb-1">
          {isPerfect ? '🥁✨' : isSavedByCouncil ? '🛡️🤝' : '💥⚠️'}
        </span>

        <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire">
          {isPerfect
            ? 'Harmonie Parfaite !'
            : isSavedByCouncil
              ? 'Sauvetage Solidaire !'
              : 'Fausse Note dans la Batterie !'}
        </h3>

        <div className="my-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-black font-mono uppercase tracking-wider text-white ${
              pointsEarned > 0 ? 'bg-cordel-vert' : 'bg-cordel-rouge'
            }`}
          >
            +{pointsEarned} Points d'Axé
          </span>
        </div>

        <p className="text-xs font-bold text-encre-noire/90 mt-1 max-w-md mx-auto">
          {explanation}
        </p>
      </CordelCard>

      {/* Lecteur Sonore du Morceau */}
      {audioUrl && (
        <div className="p-3 bg-white border border-cordel-master-dark/30 rounded flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎶</span>
            <div>
              <span className="text-xs font-black uppercase text-encre-noire block">
                {chain.piece?.titre}
              </span>
              <span className="text-[10px] text-cordel-master-dark/70">Extrait de référence</span>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />
          <button
            type="button"
            onClick={toggleAudio}
            className="py-1.5 px-3 rounded border border-encre-noire bg-cordel-bg-light hover:bg-neutral-100 font-bold text-xs uppercase flex items-center gap-1 cursor-pointer"
          >
            {isPlaying ? '⏸ Pause' : '▶ Écouter'}
          </button>
        </div>
      )}

      {/* Action Hôte / En attente */}
      <div className="mt-2 text-center">
        {isHost ? (
          <button
            type="button"
            onClick={isLastRound ? onFinishGame : onNextRound}
            className="w-full py-3 px-4 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-cordel-vert text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            {isLastRound ? 'Voir le Verdict Final 🏆' : 'Manche Suivante ➔'}
          </button>
        ) : (
          <p className="text-xs font-bold text-cordel-master-dark/70 italic">
            En attente du Mestre pour lancer la suite…
          </p>
        )}
      </div>
    </div>
  );
}
