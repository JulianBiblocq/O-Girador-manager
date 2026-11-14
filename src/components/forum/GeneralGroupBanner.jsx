import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Bannière d'accès prioritaire épinglée « 💬 Le Zap — Le tchat de toute l'asso »
 * affichée en haut du Porte-Voix (`Forum.jsx`) avec l'aperçu du dernier message
 * et son badge de non-lus dédié.
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

  const bannerTitle =
    t?.('forum.generalDiscussionTitle') && t('forum.generalDiscussionTitle') !== 'forum.generalDiscussionTitle'
      ? t('forum.generalDiscussionTitle')
      : "Le Zap — Le tchat de toute l'asso";

  const openBtnLabel =
    t?.('forum.btnOpenGeneralThread') && t('forum.btnOpenGeneralThread') !== 'forum.btnOpenGeneralThread'
      ? t('forum.btnOpenGeneralThread')
      : 'Ouvrir Le Zap →';

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
          : 'bg-cordel-bg-light hover:bg-cordel-hover'
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1 text-left">
        <div className="w-9 h-9 rounded-full bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire flex items-center justify-center text-base shrink-0 shadow-xs relative">
          <span>💬</span>
          {isUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white animate-pulse" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-encre-noire truncate">
              💬 {bannerTitle}
            </h3>
            {isUnread && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                {t?.('forum.newBadge') && t('forum.newBadge') !== 'forum.newBadge' ? t('forum.newBadge') : 'Nouveau'}
              </span>
            )}
          </div>

          {lastMsg?.content || lastMsg?.imageUrl ? (
            <p className="text-[11px] font-semibold text-cordel-master-dark truncate mt-0.5">
              <strong className="text-cordel-wood">
                {(lastMsg.senderName || 'Membre').split(' ')[0]} :
              </strong>{' '}
              {lastMsg.imageUrl && !lastMsg.content?.includes('📷') ? '📷 ' : ''}
              {lastMsg.content || 'Photo'}
              {formattedTime && (
                <span className="text-[9px] opacity-65 ml-1.5">• {formattedTime}</span>
              )}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-cordel-master-dark/75 truncate mt-0.5">
              {t?.('forum.generalBannerEmptyDesc') && t('forum.generalBannerEmptyDesc') !== 'forum.generalBannerEmptyDesc'
                ? t('forum.generalBannerEmptyDesc')
                : "Partagez un mot, une photo ou un lien avec toute l'asso sur le Zap !"}
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
        💬 {openBtnLabel}
      </CordelButton>
    </div>
  );
}
