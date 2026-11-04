import React from 'react';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { getEffectiveEventVotes } from '../../utils/pollVoteUtils';

/**
 * Carte individuelle d'un créneau de sondage dans EventPollSection.
 * Permet de voter (Dispo / Indispo), de visualiser les votants et de retenir la date.
 */
export default function EventPollOptionCard({
  optionEv,
  currentEventId,
  userUid,
  allUsersMap,
  eligible,
  isSuperAdminOrMestre,
  isPupitreDispatch,
  isProcessing,
  formatDate,
  onNavigateToEventId,
  onVote,
  onConfirmWinningOption
}) {
  const isCurrentPageOption = optionEv.id === currentEventId;
  const votes = getEffectiveEventVotes(optionEv);
  const userVote = userUid ? votes[userUid] : null;

  const dispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'dispo');
  const indispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'indispo');

  return (
    <div
      className={`p-3 rounded-[var(--theme-border-radius,8px)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
        isCurrentPageOption
          ? 'bg-white dark:bg-black/30 border-[var(--color-cordel-ocre,#c05621)] shadow-[2px_2px_0px_0px_var(--color-cordel-ocre,#c05621)]'
          : 'bg-white/60 dark:bg-black/10 border-encre-noire/20 hover:bg-white'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-6 h-6 rounded-full border-2 border-encre-noire flex items-center justify-center text-[10px] font-black shrink-0 ${
            isCurrentPageOption
              ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white'
              : 'bg-cordel-bg text-encre-noire'
          }`}
        >
          {optionEv.optionIndex || '?'}
        </span>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-encre-noire">
              📅 {formatDate(optionEv.date)}
            </span>
            {isCurrentPageOption && (
              <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                Fiche ouverte
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-cordel-master-dark">
            <div className="flex items-center gap-1">
              <span className="text-[var(--color-cordel-vert,#2d6a4f)] font-extrabold">
                ✅ {dispoUserIds.length} dispo
              </span>
              {dispoUserIds.length > 0 && (
                <div className="flex -space-x-1 ml-1">
                  {dispoUserIds.slice(0, 4).map((uid) => (
                    <XiloAvatar
                      key={uid}
                      src={allUsersMap[uid]?.photoURL}
                      name={allUsersMap[uid]?.name}
                      size={14}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-75">
              <span className="text-[var(--color-cordel-rouge,#8b2a1a)]">
                ❌ {indispoUserIds.length} indispo
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
        {!isCurrentPageOption && onNavigateToEventId && (
          <button
            type="button"
            onClick={() => onNavigateToEventId(optionEv.id)}
            className="text-[9px] font-black uppercase px-2.5 py-1 border border-encre-noire/30 bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:shadow-none cursor-pointer"
          >
            👁️ Voir fiche
          </button>
        )}

        {eligible && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onVote(optionEv, 'dispo')}
              className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                userVote === 'dispo'
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-white text-[var(--color-cordel-vert,#2d6a4f)] border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              ✅ {userVote === 'dispo' ? 'Dispo !' : 'Dispo'}
            </button>

            <button
              type="button"
              onClick={() => onVote(optionEv, 'indispo')}
              className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                userVote === 'indispo'
                  ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-white text-[var(--color-cordel-rouge,#8b2a1a)] border-red-300 hover:bg-red-50'
              }`}
            >
              ❌ {userVote === 'indispo' ? 'Indispo !' : 'Indispo'}
            </button>
          </div>
        )}

        {isSuperAdminOrMestre && !isPupitreDispatch && (
          <CordelButton
            variant="vert"
            onClick={() => onConfirmWinningOption(optionEv)}
            disabled={isProcessing}
            className="text-[9px] font-black uppercase py-1 px-2.5 ml-1"
            title="Valider définitivement cette date et supprimer les autres créneaux"
          >
            🌟 Retenir cette date
          </CordelButton>
        )}
      </div>
    </div>
  );
}

