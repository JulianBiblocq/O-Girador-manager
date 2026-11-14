import React from 'react';
import XiloAvatar from '../XiloAvatar';

/**
 * En-tête de la vue de messagerie directe ou de groupe (`PrivateChatView`).
 * Lorsque `isGeneralGroup === true`, affiche l'identité unifiée « 💬 Le Zap » / « 💬 O Zap »
 * et son sous-titre « Le tchat de toute l'asso ».
 */
export default function PrivateChatHeader({
  isGroup,
  isGeneralGroup,
  headerTitle,
  effectiveOtherUser,
  effectiveParticipantIds = [],
  totalUsersCount = 0,
  tRole,
  t,
  onBackClick,
  onOpenMembersModal
}) {
  const zapTitle = t?.('forum.zapTitle') && t('forum.zapTitle') !== 'forum.zapTitle'
    ? `💬 ${t('forum.zapTitle')}`
    : '💬 Le Zap';
  const zapSubtitle = t?.('forum.zapSubtitle') && t('forum.zapSubtitle') !== 'forum.zapSubtitle'
    ? t('forum.zapSubtitle')
    : "Le tchat de toute l'asso";

  const displayedTitle = isGeneralGroup ? zapTitle : headerTitle;
  const participantsCount = effectiveParticipantIds.length || totalUsersCount || 0;

  return (
    <div className="shrink-0 flex items-center justify-between border-b-2 border-dashed border-encre-noire/20 p-3 bg-white/40 dark:bg-black/10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBackClick}
          className="text-xs font-black uppercase tracking-wider bg-cordel-bg border-2 border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center shrink-0 gap-1.5"
          title={t?.('forum.backToChannels') || 'Retour aux salons'}
          aria-label={t?.('forum.backToChannels') || 'Retour aux salons'}
        >
          <span className="text-sm select-none" aria-hidden="true">⬅️</span>
          <span className="inline font-black uppercase text-[11px] tracking-wide">
            {t?.('forum.btnChannels') || 'Salons'}
          </span>
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          {isGroup ? (
            <div className="w-9 h-9 rounded-full bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
              {isGeneralGroup ? '💬' : '👥'}
            </div>
          ) : (
            <XiloAvatar src={effectiveOtherUser?.photoURL} name={headerTitle} size={36} />
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs text-encre-noire truncate">
                {displayedTitle}
              </span>
              {isGeneralGroup && (
                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white border border-encre-noire shadow-xs">
                  🌐 {zapSubtitle}
                </span>
              )}
            </div>
            {isGroup ? (
              <span className="text-[9px] font-bold text-cordel-wood">
                {participantsCount} participants
              </span>
            ) : (
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-0.5 self-start scale-90 origin-left">
                {tRole ? tRole(effectiveOtherUser?.role || 'membre', effectiveOtherUser?.genre) : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {isGroup && (
        <button
          type="button"
          onClick={onOpenMembersModal}
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-white border border-encre-noire rounded shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
          title="Gérer les membres du groupe"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Membres</span>
        </button>
      )}
    </div>
  );
}
