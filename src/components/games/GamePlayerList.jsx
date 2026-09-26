import React from 'react';

/**
 * Composant d'affichage de la grille des 4 joueurs d'une table de jeu.
 *
 * @param {Object} players Dictionnaire des joueurs indexé par uid
 * @param {number} maxPlayers Nombre maximal de joueurs (4 par défaut)
 * @param {string} currentUserId Identifiant de l'utilisateur connecté
 */
export default function GamePlayerList({ players = {}, maxPlayers = 4, currentUserId = null }) {
  const playerEntries = Object.entries(players || {});
  const emptySlotsCount = Math.max(0, maxPlayers - playerEntries.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      {/* Joueurs assis à la table */}
      {playerEntries.map(([uid, player]) => {
        const isSelf = uid === currentUserId;
        const displayName = player.name || 'Joueur';
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <div
            key={uid}
            className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-all ${
              isSelf
                ? 'border-cordel-wood bg-cordel-bg-light shadow-[2px_2px_0px_0px_#181716]'
                : 'border-encre-noire/70 bg-white shadow-[1.5px_1.5px_0px_0px_#181716]'
            }`}
          >
            {/* Avatar du joueur ou cercle d'initiale */}
            <div className="relative mb-2">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={displayName}
                  className="w-12 h-12 rounded-full border-2 border-encre-noire object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-encre-noire bg-cordel-wood text-[#fdfaf2] flex items-center justify-center font-black text-base">
                  {initial}
                </div>
              )}

              {/* Badge Hôte */}
              {player.isHost && (
                <span
                  className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border border-encre-noire shadow-2xs"
                  title="Hôte de la table"
                >
                  👑 Hôte
                </span>
              )}
            </div>

            {/* Prénom */}
            <span className="text-xs font-black text-encre-noire truncate max-w-[100px]">
              {displayName}
              {isSelf && <span className="text-[10px] text-cordel-wood font-extrabold ml-1">(Moi)</span>}
            </span>

            {/* Statut Prêt */}
            <span className="mt-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              ✓ Prêt
            </span>
          </div>
        );
      })}

      {/* Sièges vides en attente de joueurs */}
      {Array.from({ length: emptySlotsCount }).map((_, index) => (
        <div
          key={`empty-slot-${index}`}
          className="p-3 rounded-lg border-2 border-dashed border-cordel-master-dark/30 bg-neutral-100/40 flex flex-col items-center justify-center text-center min-h-[110px]"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-cordel-master-dark/30 flex items-center justify-center text-cordel-master-dark/40 font-bold mb-2">
            ?
          </div>
          <span className="text-[10px] font-bold text-cordel-master-dark/60 uppercase tracking-wider">
            En attente…
          </span>
        </div>
      ))}
    </div>
  );
}
