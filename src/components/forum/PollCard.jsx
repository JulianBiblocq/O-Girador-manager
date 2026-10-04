import React, { useState } from 'react';
import CordelCard from '../CordelCard';

/**
 * PollCard.jsx
 * Composant d'affichage et d'interaction pour un sondage dans le Porte-Voix.
 * Gère le vote atomique, l'affichage des pourcentages, la liste des votants,
 * le badge de statut et le déclenchement de l'édition pour l'auteur ou les modérateurs.
 */
export default function PollCard({
  poll,
  userId,
  allUsers = [],
  isAuthorOrAdmin = false,
  onVote,
  onOpenEdit,
  onDelete,
  voting = false,
  t
}) {
  const [showVoters, setShowVoters] = useState(false);

  if (!poll || !Array.isArray(poll.options)) return null;

  const isClosed = Boolean(poll.isClosed);
  const allowMultiple = Boolean(poll.allowMultipleChoices || poll.allowMultiple);
  const options = poll.options;

  // Calcul du nombre total de votes et du nombre d'adhérents uniques ayant voté
  const totalVotes = options.reduce((sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : 0), 0);
  const uniqueVoters = new Set();
  options.forEach(opt => {
    if (Array.isArray(opt.votes)) opt.votes.forEach(uid => uniqueVoters.add(uid));
  });

  // Résolution du nom complet des adhérents pour la liste détaillée
  const getUserName = (uid) => {
    const found = allUsers.find(u => u.id === uid || u.uid === uid);
    if (found) {
      const name = `${found.prenom || ''} ${found.nom || ''}`.trim();
      return name || found.email || 'Membre';
    }
    return 'Membre';
  };

  const handleOptionClick = (optionId) => {
    if (isClosed || voting || !onVote) return;
    onVote({
      pollId: poll.id,
      optionId,
      allowMultipleChoices: allowMultiple
    });
  };

  const formattedDate = poll.dateCreation
    ? new Date(poll.dateCreation).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="my-2.5 p-3.5 sm:p-4 text-left border-2 border-cordel-master-dark/35 select-none bg-[var(--theme-card)] shadow-[2px_2px_0px_0px_#181716]">
      {/* En-tête : Badges, Question et Bouton Modifier */}
      <div className="flex justify-between items-start gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">📊</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] uppercase font-black tracking-widest text-cordel-wood">
                Sondage
              </span>
              {allowMultiple && (
                <span className="text-[8px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-300/40">
                  Choix multiples
                </span>
              )}
              {isClosed ? (
                <span className="text-[8px] font-black uppercase tracking-wider text-white bg-[var(--color-cordel-rouge)] px-1.5 py-0.5 rounded border border-encre-noire shadow-xs">
                  🔒 Sondage clos
                </span>
              ) : (
                <span className="text-[8px] font-black uppercase tracking-wider text-white bg-[var(--color-cordel-vert)] px-1.5 py-0.5 rounded border border-encre-noire shadow-xs">
                  Ouvert
                </span>
              )}
              {poll.auteurNom && (
                <span className="text-[9px] text-cordel-master-dark/70 font-semibold truncate">
                  par {poll.auteurNom} {formattedDate && `• ${formattedDate}`}
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-encre-noire leading-snug mt-1 break-words">
              {poll.question}
            </h4>
          </div>
        </div>

        {/* Actions : Édition et Suppression pour l'auteur ou le modérateur/Mestre */}
        <div className="flex items-center gap-1 shrink-0">
          {isAuthorOrAdmin && onOpenEdit && (
            <button
              type="button"
              onClick={() => onOpenEdit(poll)}
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white text-encre-noire active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer shadow-xs transition-colors flex items-center gap-1"
              title="Modifier ce sondage"
            >
              <span>✏️</span>
              <span className="hidden sm:inline">Modifier</span>
            </button>
          )}
          {isAuthorOrAdmin && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-xs rounded hover:bg-red-100 text-cordel-wood hover:text-red-700 cursor-pointer transition-colors"
              title="Supprimer ce sondage"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Liste des options avec barres de progression dynamiques */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const votes = Array.isArray(opt.votes) ? opt.votes : [];
          const count = votes.length;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isUserChoice = userId && votes.includes(userId);
          const optLabel = opt.text || opt.label || 'Option';

          return (
            <div key={opt.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleOptionClick(opt.id)}
                disabled={isClosed || voting}
                className={`relative overflow-hidden w-full text-left p-2.5 rounded-[6px] border-2 transition-all select-none ${
                  isClosed ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-[0.99]'
                } ${
                  isUserChoice
                    ? 'border-cordel-wood bg-amber-50/80 dark:bg-amber-950/30 shadow-[2px_2px_0px_0px_#8b2a1a]'
                    : 'border-encre-noire/25 bg-cordel-bg-light hover:border-encre-noire/60 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                }`}
              >
                {/* Remplissage de la jauge proportionnelle */}
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                    isUserChoice ? 'bg-amber-300/40 dark:bg-amber-600/35' : 'bg-cordel-master-dark/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className={`w-4 h-4 rounded-full border border-encre-noire flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isUserChoice ? 'bg-cordel-wood text-white' : 'bg-white text-encre-noire'
                    }`}>
                      {isUserChoice ? '✓' : ''}
                    </span>
                    <span className="font-extrabold text-encre-noire truncate">
                      {optLabel}
                    </span>
                    {isUserChoice && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-cordel-wood bg-amber-200/90 dark:bg-amber-900/60 px-1.5 py-0.2 rounded shrink-0">
                        Votre choix
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span className="font-mono font-black text-cordel-wood text-xs">{percentage}%</span>
                    <span className="text-[9px] font-bold opacity-70 ml-1">({count})</span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Pied de carte : Décompte des votants et règles */}
      <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 flex flex-wrap justify-between items-center text-[10px] font-bold text-cordel-master-dark/75 gap-2">
        <div className="flex items-center gap-2">
          <span>{uniqueVoters.size} votant{uniqueVoters.size > 1 ? 's' : ''} ({totalVotes} voix)</span>
          {uniqueVoters.size > 0 && (
            <button
              type="button"
              onClick={() => setShowVoters(!showVoters)}
              className="text-[9px] font-black uppercase text-cordel-wood hover:underline cursor-pointer ml-1"
            >
              👥 {showVoters ? "Masquer" : "Voir"}
            </button>
          )}
        </div>

        <span className="italic text-[9.5px]">
          {isClosed
            ? "🔒 Votes clos"
            : allowMultiple
              ? "Plusieurs choix possibles"
              : "Cliquez sur une option pour voter"}
        </span>
      </div>

      {/* Liste déroulante des participants */}
      {showVoters && uniqueVoters.size > 0 && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-cordel-master-dark/10 flex flex-wrap gap-1 items-center">
          <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60 mr-1">Votants :</span>
          {Array.from(uniqueVoters).map((uid) => (
            <span key={uid} className="bg-cordel-bg border border-encre-noire/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-encre-noire">
              {getUserName(uid)}
            </span>
          ))}
        </div>
      )}
    </CordelCard>
  );
}
