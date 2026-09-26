import React from 'react';

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Grille 2x2 des 4 propositions de réponse.
 * Gère le verrouillage en phase 'question' et la révélation colorée en phase 'reveal'.
 *
 * @param {Array<string>} choices 4 choix possibles
 * @param {number} correctIndex Index de la bonne réponse (0 à 3)
 * @param {number|null} selectedIndex Index choisi par l'utilisateur
 * @param {string} phase 'question' | 'reveal'
 * @param {string} explanation Explication pédagogique affichée en phase reveal
 * @param {Function} onSelectChoice Callback lors du clic sur un choix
 */
export default function GameAnswerGrid({
  choices = [],
  correctIndex,
  selectedIndex = null,
  phase = 'question',
  explanation = '',
  onSelectChoice
}) {
  const isQuestionPhase = phase === 'question';
  const hasAnswered = selectedIndex !== null;

  return (
    <div className="flex flex-col gap-3 my-4">
      {/* Grille 2x2 des 4 choix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {choices.map((choiceText, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = correctIndex === index;
          const letter = CHOICE_LETTERS[index] || '';

          // Calcul des styles d'état selon la phase
          let btnStyle = 'border-encre-noire bg-white text-encre-noire hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716]';

          if (isQuestionPhase) {
            if (isSelected) {
              btnStyle = 'border-cordel-wood bg-cordel-wood/15 text-cordel-wood font-black shadow-[2px_2px_0px_0px_#181716] scale-[1.01]';
            }
          } else {
            // Phase 'reveal'
            if (isCorrect) {
              btnStyle = 'border-[var(--color-cordel-vert)] !bg-[var(--color-cordel-vert)] !text-white font-black shadow-[2.5px_2.5px_0px_0px_#181716] animate-pulse';
            } else if (isSelected && !isCorrect) {
              btnStyle = 'border-[var(--color-cordel-rouge)] !bg-[var(--color-cordel-rouge)] !text-white font-black shadow-[2px_2px_0px_0px_#181716]';
            } else {
              btnStyle = 'border-neutral-300 bg-neutral-100 text-neutral-400 opacity-60';
            }
          }

          return (
            <button
              key={`choice-${index}`}
              type="button"
              disabled={!isQuestionPhase || hasAnswered}
              onClick={() => onSelectChoice(index)}
              className={`p-3.5 rounded-[6px_9px_7px_8px] border-2 text-left flex items-start gap-3 transition-all cursor-pointer disabled:cursor-default ${btnStyle}`}
            >
              {/* Badge lettre */}
              <span
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                  !isQuestionPhase && isCorrect
                    ? 'border-white bg-white text-[var(--color-cordel-vert)]'
                    : isSelected
                    ? 'border-current bg-current/10'
                    : 'border-encre-noire/40 bg-neutral-100 text-encre-noire'
                }`}
              >
                {letter}
              </span>

              {/* Texte du choix */}
              <span className="text-xs sm:text-[13px] font-bold leading-snug flex-1">
                {choiceText}
              </span>

              {/* Indicateur de confirmation du choix */}
              {!isQuestionPhase && isCorrect && (
                <span className="text-sm shrink-0">✓</span>
              )}
              {!isQuestionPhase && isSelected && !isCorrect && (
                <span className="text-sm shrink-0">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Message de confirmation de réponse pour le joueur en phase question */}
      {isQuestionPhase && hasAnswered && (
        <div className="p-2 bg-[var(--color-cordel-vert)]/10 border border-[var(--color-cordel-vert)]/40 rounded text-center animate-fade-in">
          <p className="text-[11px] font-black text-[var(--color-cordel-vert)]">
            ✓ Réponse enregistrée ! En attente du décompte des autres joueurs…
          </p>
        </div>
      )}

      {/* Explication pédagogique en phase reveal */}
      {!isQuestionPhase && explanation && (
        <div className="p-3 rounded-lg border-2 border-dashed border-cordel-wood/40 bg-[#fdfaf2] text-left animate-fade-in">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5 mb-1">
            <span>💡</span>
            <span>Le saviez-vous ?</span>
          </h4>
          <p className="text-xs text-cordel-master-dark font-medium leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
