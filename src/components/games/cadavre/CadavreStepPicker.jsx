import React from 'react';
import CordelCard from '../../CordelCard';
import PatternVisualizer from '../../pedagogy/PatternVisualizer';

const STEP_TITLES = {
  step_piece: 'Étape 1 : Choisis le morceau de départ',
  step_instrument: 'Étape 2 : Quel instrument convoques-tu dans la chaîne ?',
  step_pattern: 'Étape 3 : Retrouve la tablature exacte pour cet instrument !',
  step_signal: 'Étape 4 : Quel signal du Mestre déclenche cette phrase ?',
  step_bonus: 'Étape 5 (Bonus) : Question culturelle sur le morceau !'
};

/**
 * Composant de sélection d'étape pour le Cadavre Exquis.
 * Présente les choix au joueur actif ou affiche une vue d'attente pour les autres.
 */
export default function CadavreStepPicker({
  roundPhase,
  stepChoices = [],
  activePlayerUid,
  activePlayerName,
  currentUserId,
  onSelectChoice,
  piece,
  instrument
}) {
  const isMyTurn = currentUserId === activePlayerUid;
  const title = STEP_TITLES[roundPhase] || 'Choix du maillon';

  // Vue d'attente pour les joueurs passifs
  if (!isMyTurn) {
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="p-6 text-center my-4 bg-cordel-bg-light animate-fade-in">
        <span className="text-4xl block mb-3 animate-bounce">⏳</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood mb-1">
          Relais en cours
        </h3>
        <p className="text-xs font-bold text-encre-noire/80">
          <strong>{activePlayerName || 'Un camarade'}</strong> est en train de choisir…
        </p>
        <p className="text-[11px] text-cordel-master-dark/60 italic mt-2">
          {title}
        </p>
        <div className="mt-4 py-2 border-t border-dashed border-cordel-master-dark/20 text-[10px] font-mono font-bold text-cordel-wood">
          Tenez-vous prêt pour la suite de l'arrangement !
        </div>
      </CordelCard>
    );
  }

  // Vue interactive pour le joueur actif
  return (
    <div className="flex flex-col gap-3 my-3 text-left animate-fade-in">
      <div className="p-3 bg-cordel-wood/10 border-l-4 border-cordel-wood rounded-r">
        <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🎯</span>
          <span>C'est à toi de jouer !</span>
        </h4>
        <p className="text-xs font-bold text-encre-noire mt-0.5">{title}</p>
        {piece && <p className="text-[10px] text-cordel-master-dark/70 mt-0.5">Morceau choisi : <strong>{piece.titre}</strong> {instrument && `• Pupitre : ${instrument}`}</p>}
      </div>

      {/* Grille de choix selon la phase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(stepChoices || []).map((choice, index) => {
          if (roundPhase === 'step_piece') {
            return (
              <button
                key={`piece-${choice.id || index}`}
                type="button"
                onClick={() => onSelectChoice(choice)}
                className="p-3.5 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] text-left hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎵</span>
                  <div>
                    <h5 className="text-xs font-black uppercase text-encre-noire">{choice.titre}</h5>
                    <span className="text-[9.5px] font-bold text-cordel-master-dark/70">
                      {choice.bpm ? `${choice.bpm} BPM` : 'Baque Virado'}
                    </span>
                  </div>
                </div>
              </button>
            );
          }

          if (roundPhase === 'step_instrument') {
            const instName = typeof choice === 'string' ? choice : choice.name;
            return (
              <button
                key={`inst-${index}`}
                type="button"
                onClick={() => onSelectChoice(instName)}
                className="p-3.5 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] text-left hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🥁</span>
                  <span className="text-xs font-black uppercase text-encre-noire">{instName}</span>
                </div>
              </button>
            );
          }

          if (roundPhase === 'step_pattern') {
            const pattern = Array.isArray(choice) ? choice : (choice.pattern || choice.steps || []);
            return (
              <button
                key={`pat-${index}`}
                type="button"
                onClick={() => onSelectChoice({ pattern, choiceIndex: index })}
                className="p-3 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] flex flex-col items-center gap-1 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-[9.5px] font-mono font-black text-cordel-wood self-start">Proposition {String.fromCharCode(65 + index)}</span>
                <PatternVisualizer patternArray={pattern} beatResolution={4} />
              </button>
            );
          }

          if (roundPhase === 'step_signal') {
            const sigName = choice.name || choice.nom || `Signal ${index + 1}`;
            const sigConsigne = choice.consigne || choice.description || 'Action rythmique';
            return (
              <button
                key={`sig-${choice.id || index}`}
                type="button"
                onClick={() => onSelectChoice({ signal: choice, choiceIndex: index })}
                className="p-3.5 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] text-left hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-[9.5px] font-mono font-black text-cordel-wood block">Option {String.fromCharCode(65 + index)}</span>
                <h5 className="text-xs font-black uppercase text-encre-noire mt-0.5">{sigName}</h5>
                <p className="text-[10px] text-cordel-master-dark/75 mt-0.5">{sigConsigne}</p>
              </button>
            );
          }

          if (roundPhase === 'step_bonus') {
            const text = typeof choice === 'string' ? choice : choice.text;
            return (
              <button
                key={`bonus-${index}`}
                type="button"
                onClick={() => onSelectChoice({ bonusText: text, choiceIndex: index })}
                className="p-3.5 rounded-[6px_9px_7px_8px] border-2 border-encre-noire bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] text-left hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-encre-noire">{text}</span>
              </button>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
