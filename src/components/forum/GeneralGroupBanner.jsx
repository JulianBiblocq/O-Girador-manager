import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Bannière d'accès prioritaire à la discussion générale « 💬 Tout le groupe »
 * affichée en haut du Porte-Voix quel que soit l'onglet actif.
 */
export default function GeneralGroupBanner({ conversation, onOpenGeneralChat, t }) {
  const lastMsg = conversation?.lastMessage;
  const isUnread = Boolean(conversation?.isUnread);

  const formattedTime = (() => {
    if (!lastMsg?.timestamp) return '';
    const d = new Date(lastMsg.timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();

  return (
    <div
      onClick={onOpenGeneralChat}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenGeneralChat) onOpenGeneralChat();
        }
      }}
      className={`w-full p-3 sm:p-3.5 rounded-[6px_10px_6px_8px] border-2 border-encre-noire shadow-[2.5px_2.5px_0px_0px_#181716] cursor-pointer transition-all hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none ${
        isUnread
          ? 'bg-amber-100/90 dark:bg-amber-950/40'
          : 'bg-[var(--cordel-bg-light,#fffcf5)] hover:bg-amber-50/70'
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1 text-left">
        <div className="w-9 h-9 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-2 border-encre-noire flex items-center justify-center text-base shrink-0 shadow-xs relative">
          <span>💬</span>
          {isUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white animate-pulse" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-encre-noire truncate">
              💬 {t?.('forum.generalDiscussionTitle') || 'Discussion Générale – Tout le groupe'}
            </h3>
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-cordel-vert,#2d6a4f)]/15 text-[var(--color-cordel-vert,#2d6a4f)] border border-[var(--color-cordel-vert,#2d6a4f)]/40">
              🌐 {t?.('forum.wholeAssociationBadge') || "Toute l'association"}
            </span>
            {isUnread && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                {t?.('forum.newBadge') || 'Nouveau'}
              </span>
            )}
          </div>

          {lastMsg?.content ? (
            <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 truncate mt-0.5">
              <strong className="text-cordel-wood">
                {lastMsg.senderName || 'Membre'} :
              </strong>{' '}
              {lastMsg.content}
              {formattedTime && (
                <span className="text-[9px] opacity-65 ml-1.5">• {formattedTime}</span>
              )}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 truncate mt-0.5">
              {t?.('forum.generalBannerEmptyDesc') ||
                'Échangez en direct, partagez des photos ou des vidéos YouTube avec tout le groupe !'}
            </p>
          )}
        </div>
      </div>

      <CordelButton
        type="button"
        variant="vert"
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenGeneralChat) onOpenGeneralChat();
        }}
        className="text-[10px] px-3 py-1.5 font-black uppercase tracking-wider shrink-0 w-full sm:w-auto justify-center"
      >
        💬 {t?.('forum.btnOpenGeneralThread') || 'Ouvrir le fil général →'}
      </CordelButton>
    </div>
  );
}

