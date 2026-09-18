/**
 * Composant unitaire d'affichage d'une notification dans le centre de notifications (NotificationItem).
 * Différencie visuellement les statuts lu / non lu selon les règles de style Cordel.
 */

import React from 'react';

/**
 * Formate un horodatage Firestore ou Date en texte temporel relatif en français.
 * 
 * @param {object|Date|number} timestamp Date ou horodatage Firestore
 * @returns {string} Libellé relatif formaté
 */
function formatRelativeDate(timestamp) {
  if (!timestamp) return '';

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
  
  const isToday = now.toDateString() === date.toDateString();
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Aujourd'hui à ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return `Hier à ${timeStr}`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` à ${timeStr}`;
}

/**
 * Retourne l'icône illustrative appropriée selon la catégorie de l'alerte.
 * 
 * @param {string} type Catégorie de notification
 * @returns {string} Émoji ou symbole
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'forum_mention':
    case 'forum_reply':
      return '📣';
    case 'event_new':
    case 'event_roadmap':
      return '📅';
    case 'expense_status':
      return '💰';
    case 'announcement':
      return '📢';
    default:
      return '🔔';
  }
}

export default function NotificationItem({ notification, onSelect }) {
  const isUnread = !notification.isRead;
  const dateFormatted = formatRelativeDate(notification.createdAt);
  const icon = getNotificationIcon(notification.type);

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
      {/* Icône thématique */}
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base bg-white border border-encre-noire/20 shadow-xs">
        {icon}
      </div>

      {/* Contenu textuel */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-xs truncate ${isUnread ? 'font-black text-encre-noire' : 'font-bold text-encre-noire/80'}`}>
            {notification.titre}
          </span>
          {isUnread && (
            <span
              className="w-2 h-2 rounded-full shrink-0 bg-[var(--color-cordel-rouge,#8b2a1a)] animate-pulse"
              title="Non lu"
            />
          )}
        </div>

        {notification.message && (
          <p className="text-[11px] text-encre-noire/85 leading-snug line-clamp-2 break-words">
            {notification.message}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-dashed border-encre-noire/10">
          <span className="text-[9px] font-bold text-encre-noire/55 uppercase tracking-wider">
            {dateFormatted}
          </span>
          <span className="text-[10px] font-extrabold text-cordel-wood group-hover:translate-x-0.5 transition-transform">
            Voir ➔
          </span>
        </div>
      </div>
    </div>
  );
}
