import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * PollDisplay component renders interactive poll options, progress bars,
 * and handles secure voting per user UID.
 * 
 * @param {Object} props
 * @param {Object} props.poll Poll object { question, options: [{ id, label, votes: [] }] }
 * @param {string} props.threadId ID of the parent thread
 * @param {string} props.userId ID of the currently logged-in user
 */
export default function PollDisplay({ poll, threadId, userId }) {
  const [voting, setVoting] = useState(false);

  if (!poll || !poll.options || !Array.isArray(poll.options)) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : 0), 0);
  
  // Find if current user voted and which option ID
  const userVotedOptionId = poll.options.find(opt => Array.isArray(opt.votes) && opt.votes.includes(userId))?.id;

  const handleVote = async (optionId) => {
    if (!threadId || !userId || voting) return;
    setVoting(true);
    try {
      const updatedOptions = poll.options.map(opt => {
        const currentVotes = Array.isArray(opt.votes) ? opt.votes : [];
        // Remove user from all options to prevent double votes
        const cleanedVotes = currentVotes.filter(uid => uid !== userId);
        
        // If clicking the option user already selected, toggle it off (unvote)
        if (opt.id === optionId) {
          if (userVotedOptionId === optionId) {
            return { ...opt, votes: cleanedVotes };
          } else {
            return { ...opt, votes: [...cleanedVotes, userId] };
          }
        }
        return { ...opt, votes: cleanedVotes };
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

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="my-3 p-4 text-left border-2 border-cordel-master-dark/30 select-none">
      {/* Question Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <span className="text-lg">📊</span>
        <div>
          <span className="text-[9px] uppercase font-black tracking-widest text-cordel-wood block">Sondage</span>
          <h4 className="font-extrabold text-sm text-encre-noire leading-tight">
            {poll.question}
          </h4>
        </div>
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-2.5">
        {poll.options.map((opt) => {
          const voteCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isUserChoice = opt.id === userVotedOptionId;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={voting}
              className={`
                relative overflow-hidden w-full text-left p-2.5 rounded-[6px] border-2 transition-all cursor-pointer
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
          );
        })}
      </div>

      {/* Footer Total */}
      <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 flex justify-between items-center text-[10px] font-bold text-cordel-master-dark/70">
        <span>Total : {totalVotes} participant{totalVotes > 1 ? 's' : ''}</span>
        <span className="italic">Cliquez sur un choix pour voter ou modifier votre avis</span>
      </div>
    </CordelCard>
  );
}
