import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * PollDisplay component renders interactive poll options, progress bars,
 * voter names list, multi-choice support, and poll closing controls.
 * 
 * @param {Object} props
 * @param {Object} props.poll Poll object { question, allowMultiple, isClosed, options: [{ id, label, votes: [] }] }
 * @param {string} props.threadId ID of the parent thread
 * @param {string} props.userId ID of the currently logged-in user
 * @param {Array} props.allUsers Array of user profiles for displaying voter names
 * @param {boolean} props.isAuthorOrAdmin Whether current user can close/reopen poll
 */
export default function PollDisplay({ poll, threadId, userId, allUsers = [], isAuthorOrAdmin = false }) {
  const [voting, setVoting] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [updatingCloseState, setUpdatingCloseState] = useState(false);

  if (!poll || !poll.options || !Array.isArray(poll.options)) return null;

  const isClosed = poll.isClosed === true;
  const allowMultiple = poll.allowMultiple === true;
  const totalVotes = poll.options.reduce((sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : 0), 0);

  // Map user UIDs to names helper
  const getUserName = (uid) => {
    const found = allUsers.find(u => u.id === uid || u.uid === uid);
    if (found) {
      const name = `${found.prenom || ''} ${found.nom || ''}`.trim();
      return name || found.email || 'Membre';
    }
    return 'Membre';
  };

  const handleVote = async (optionId) => {
    if (!threadId || !userId || voting || isClosed) return;
    setVoting(true);
    try {
      const updatedOptions = poll.options.map(opt => {
        const currentVotes = Array.isArray(opt.votes) ? opt.votes : [];
        const hasVotedThisOpt = currentVotes.includes(userId);

        if (allowMultiple) {
          // Multi-choice mode: toggle this option independently
          if (opt.id === optionId) {
            return {
              ...opt,
              votes: hasVotedThisOpt ? currentVotes.filter(uid => uid !== userId) : [...currentVotes, userId]
            };
          }
          return opt;
        } else {
          // Single-choice mode: remove user from all other options
          const cleanedVotes = currentVotes.filter(uid => uid !== userId);
          if (opt.id === optionId) {
            return {
              ...opt,
              votes: hasVotedThisOpt ? cleanedVotes : [...cleanedVotes, userId]
            };
          }
          return { ...opt, votes: cleanedVotes };
        }
      });

      const threadRef = doc(db, 'forum', threadId);
      await updateDoc(threadRef, {
        'poll.options': updatedOptions
      });
    } catch (err) {
      console.error("PollDisplay - Erreur lors du vote:", err);
      alert("Erreur lors de l'enregistrement de votre vote.");
    } finally {
      setVoting(false);
    }
  };

  const handleToggleClosePoll = async () => {
    if (!threadId || updatingCloseState) return;
    const confirmMsg = isClosed 
      ? "Voulez-vous rouvrir ce sondage aux votes ?" 
      : "Voulez-vous clôturer ce sondage ? Aucun nouveau vote ne pourra être effectué.";
    if (!window.confirm(confirmMsg)) return;

    setUpdatingCloseState(true);
    try {
      const threadRef = doc(db, 'forum', threadId);
      await updateDoc(threadRef, {
        'poll.isClosed': !isClosed
      });
    } catch (err) {
      console.error("PollDisplay - Erreur clôture sondage:", err);
      alert("Erreur lors du changement de statut du sondage.");
    } finally {
      setUpdatingCloseState(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="my-3 p-4 text-left border-2 border-cordel-master-dark/30 select-none">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-black tracking-widest text-cordel-wood">Sondage</span>
              {allowMultiple && (
                <span className="text-[8px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-300/40">
                  Choix multiples
                </span>
              )}
              {isClosed && (
                <span className="text-[8px] font-black uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.2 rounded border border-red-300/40">
                  🔒 Clôturé
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-encre-noire leading-tight">
              {poll.question}
            </h4>
          </div>
        </div>

        {/* Controls: Close/Reopen Poll for author/admin */}
        {isAuthorOrAdmin && (
          <button
            type="button"
            onClick={handleToggleClosePoll}
            disabled={updatingCloseState}
            className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-cordel-hover active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer shrink-0"
            title={isClosed ? "Rouvrir le sondage" : "Clôturer le sondage"}
          >
            {updatingCloseState ? "..." : isClosed ? "🔓 Rouvrir" : "🔒 Clôturer"}
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-2.5">
        {poll.options.map((opt) => {
          const votesArray = Array.isArray(opt.votes) ? opt.votes : [];
          const voteCount = votesArray.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isUserChoice = votesArray.includes(userId);

          return (
            <div key={opt.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleVote(opt.id)}
                disabled={voting || isClosed}
                className={`
                  relative overflow-hidden w-full text-left p-2.5 rounded-[6px] border-2 transition-all select-none
                  ${isClosed ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
                  ${isUserChoice 
                    ? 'border-cordel-wood bg-amber-50/70 dark:bg-amber-950/20 shadow-[2px_2px_0px_0px_#8b2a1a]' 
                    : 'border-encre-noire/25 bg-cordel-bg-light hover:border-encre-noire/60 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'}
                `}
              >
                {/* Animated Progress Bar Fill Background */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                    isUserChoice ? 'bg-amber-300/35 dark:bg-amber-600/30' : 'bg-cordel-master-dark/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Option Details Content */}
                <div className="relative z-10 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 pr-2">
                    <span className={`w-4 h-4 rounded-full border border-encre-noire flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isUserChoice ? 'bg-cordel-wood text-white' : 'bg-white text-encre-noire'
                    }`}>
                      {isUserChoice ? '✓' : ''}
                    </span>
                    <span className="font-extrabold text-encre-noire dark:text-cordel-bg-light">
                      {opt.label}
                    </span>
                    {isUserChoice && (
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-cordel-wood bg-amber-200/80 px-1.5 py-0.2 rounded">
                        Votre vote
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-cordel-wood text-xs">{percentage}%</span>
                    <span className="text-[9px] font-bold opacity-65 ml-1.5">({voteCount} vote{voteCount > 1 ? 's' : ''})</span>
                  </div>
                </div>
              </button>

              {/* Voter names breakdown if expanded */}
              {showVoters && votesArray.length > 0 && (
                <div className="pl-6 pr-2 text-[10px] font-semibold text-cordel-master-dark/80 flex flex-wrap gap-1 items-center">
                  <span className="font-bold opacity-60">Votants :</span>
                  {votesArray.map((uid) => (
                    <span key={uid} className="bg-cordel-bg border border-encre-noire/15 px-1.5 py-0.2 rounded text-[9px]">
                      {getUserName(uid)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Total & Controls */}
      <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 flex flex-wrap justify-between items-center text-[10px] font-bold text-cordel-master-dark/70 gap-2">
        <span>Total : {totalVotes} vote{totalVotes > 1 ? 's' : ''}</span>

        <div className="flex items-center gap-3">
          {totalVotes > 0 && (
            <button
              type="button"
              onClick={() => setShowVoters(!showVoters)}
              className="text-[9px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
            >
              👥 {showVoters ? "Masquer les votants" : "Voir les votants"}
            </button>
          )}

          <span className="italic">
            {isClosed 
              ? "🚫 Sondage clôturé" 
              : allowMultiple 
                ? "Vous pouvez choisir plusieurs réponses" 
                : "Cliquez sur une option pour voter ou modifier votre réponse"}
          </span>
        </div>
      </div>
    </CordelCard>
  );
}
