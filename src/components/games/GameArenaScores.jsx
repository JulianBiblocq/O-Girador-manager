import React from 'react';

/**
 * Bandeau compact des joueurs avec avatars, indicateur de réponse et score en direct.
 *
 * @param {Object} players Map des joueurs de la salle
 * @param {string} currentUserId Identifiant du joueur connecté
 * @param {string} phase 'question' | 'reveal'
 */
export default function GameArenaScores({ players = {}, currentUserId = null, phase = 'question' }) {
  const entries = Object.entries(players || {});

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap my-3">
      {entries.map(([uid, player]) => {
        const isSelf = uid === currentUserId;
        const displayName = player.name?.split(' ')?.[0] || 'Joueur';
        const hasAnswered = player.currentAnswer !== undefined && player.currentAnswer !== null;
        const score = player.score || 0;

        return (
          <div
            key={uid}
            className={`px-2.5 py-1 rounded-[6px_8px_6px_7px] border flex items-center gap-2 transition-all ${
              isSelf
                ? 'border-cordel-wood bg-cordel-wood/10 shadow-2xs'
                : 'border-encre-noire/30 bg-white'
            }`}
          >
            {/* Avatar & pastille réponse */}
            <div className="relative">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={displayName}
                  className="w-7 h-7 rounded-full border border-encre-noire object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cordel-wood text-[#fdfaf2] flex items-center justify-center text-[11px] font-black">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Indicateur : a répondu ou en réflexion */}
              {phase === 'question' && (
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${
                    hasAnswered ? 'bg-[var(--color-cordel-vert)]' : 'bg-neutral-300'
                  }`}
                  title={hasAnswered ? 'A répondu' : 'En réflexion…'}
                />
              )}
            </div>

            {/* Prénom & Score */}
            <div className="text-left leading-tight">
              <span className="text-[10.5px] font-black text-encre-noire block truncate max-w-[70px]">
                {displayName}
              </span>
              <span className="font-mono text-[10px] font-extrabold text-cordel-wood">
                {score} pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
