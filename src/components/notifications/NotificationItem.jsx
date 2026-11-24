/**
 * Composant unitaire d'affichage d'une notification dans le centre de notifications (NotificationItem).
 * Différencie visuellement les statuts lu / non lu selon les règles de style Cordel (< 140 lignes).
 */

import React from 'react';
import TerracottaMegaphoneIcon from '../TerracottaMegaphoneIcon';
import { isForbiddenMegaphone, stripForbiddenMegaphones } from '../../utils/sanitizeIcons';
import { useTranslation } from '../LanguageContext';

/** Formate un horodatage Firestore ou Date en texte temporel relatif bilingue (FR / PT-BR). */
function formatRelativeDate(timestamp, locale = 'fr', t) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const bcp47 = locale === 'pt' ? 'pt-BR' : 'fr-FR';
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return t ? t('notifications.justNow') : "À l'instant";
  if (diffSec < 3600) {
    const min = Math.floor(diffSec / 60);
    return t ? t('notifications.minutesAgo', { min }) : `Il y a ${min} min`;
  }

  const timeStr = date.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit' });
  if (now.toDateString() === date.toDateString()) {
    return t ? t('notifications.todayAt', { time: timeStr }) : `Aujourd'hui à ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return t ? t('notifications.yesterdayAt', { time: timeStr }) : `Hier à ${timeStr}`;
  }

  const datePart = date.toLocaleDateString(bcp47, { day: 'numeric', month: 'short' });
  return t ? t('notifications.dateAt', { date: datePart, time: timeStr }) : `${datePart} à ${timeStr}`;
}

function getNotificationIcon(type) {
  switch (type) {
    case 'chat_direct': return '✉️';
    case 'chat_group': return '👥';
    case 'forum_mention': return '🗣️';
    case 'forum_reply':
    case 'forum_message':
    case 'event_discussion': return '💬';
    case 'forum_new_thread':
    case 'announcement': return <TerracottaMegaphoneIcon className="w-4 h-4 inline-block shrink-0" />;
    case 'event_new':
    case 'event_roadmap': return '📅';
    case 'expense_status': return '💰';
    default: return '🔔';
  }
}

export default function NotificationItem({ notification, onSelect, onDelete, locale: propLocale, t: propT }) {
  const i18n = useTranslation();
  const t = propT || i18n.t;
  const locale = propLocale || i18n.locale;

  const isUnread = notification.isRead !== true && notification.read !== true;
  const dateFormatted = formatRelativeDate(notification.createdAt, locale, t);
  const rawIcon = notification.icon;
  const icon = isForbiddenMegaphone(rawIcon)
    ? <TerracottaMegaphoneIcon className="w-4 h-4 inline-block shrink-0" />
    : (rawIcon || getNotificationIcon(notification.type));
  const defaultTitle = t('notifications.defaultItemTitle', 'Notification');
  const displayTitle = stripForbiddenMegaphones(notification.title || notification.titre || defaultTitle).trim() || defaultTitle;
  const exactDocId = notification.docId || notification.notifId || notification.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(notification);
        }
      }}
      className={`relative w-full p-3 text-left rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer select-none group flex items-start gap-3 ${
        isUnread
          ? 'bg-amber-500/10 border-[var(--color-cordel-ocre,#c05621)] shadow-[1.5px_1.5px_0px_0px_#181716] hover:bg-amber-500/20'
          : 'bg-cordel-bg-light/80 border-encre-noire/20 shadow-none opacity-80 hover:opacity-100 hover:border-encre-noire/40'
      }`}
    >
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base bg-white border border-encre-noire/20 shadow-xs">
        {icon}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-xs truncate ${isUnread ? 'font-black text-encre-noire' : 'font-bold text-encre-noire/80'}`}>
            {displayTitle}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isUnread && (
              <span
                className="w-2 h-2 rounded-full shrink-0 bg-[var(--color-cordel-rouge,#8b2a1a)] animate-pulse"
                title={t('notifications.unreadDotTooltip', 'Non lu')}
              />
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(exactDocId);
                }}
                className="p-1 -mr-1 text-encre-noire/40 hover:text-[var(--color-cordel-rouge,#8b2a1a)] hover:bg-black/5 rounded cursor-pointer transition-colors text-xs leading-none"
                title={t('notifications.deleteItemTooltip', 'Supprimer cette notification')}
                aria-label={t('notifications.deleteItemAria', 'Supprimer la notification')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {(notification.body || notification.message) && (
          <p className="text-[11px] text-encre-noire/85 leading-snug line-clamp-2 break-words">
            {notification.body || notification.message}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-dashed border-encre-noire/10">
          <span className="text-[9px] font-bold text-encre-noire/55 uppercase tracking-wider">{dateFormatted}</span>
          <span className="text-[10px] font-extrabold text-cordel-wood group-hover:translate-x-0.5 transition-transform">
            {t('notifications.viewBtn', 'Voir ➔')}
          </span>
        </div>
      </div>
    </div>
  );
}
