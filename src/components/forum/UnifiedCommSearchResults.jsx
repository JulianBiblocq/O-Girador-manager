import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Liste des résultats de la recherche unifiée (Le Zap, Porte-Voix, Groupes & MP)
 * avec extraits mis en évidence sans `dangerouslySetInnerHTML` (< 140 lignes).
 */
export default function UnifiedCommSearchResults({
  results = [],
  loadingMessages = false,
  locale = 'fr',
  onSelectResult,
  t
}) {
  const dateLocale = locale === 'pt' ? 'pt-BR' : 'fr-FR';

  const formatResultDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getCategoryMeta = (cat) => {
    if (cat === 'zap') {
      return {
        icon: '💬',
        badgeLabel: t('forum.zapTitle'),
        badgeClass: 'bg-[var(--color-cordel-vert)] text-white border-encre-noire'
      };
    }
    if (cat === 'forum') {
      return {
        icon: '📢',
        badgeLabel: t('forum.searchFilterPorteVoix'),
        badgeClass: 'bg-cordel-wood text-white border-encre-noire'
      };
    }
    if (cat === 'groups') {
      return {
        icon: '👥',
        badgeLabel: t('forum.searchBadgeGroup'),
        badgeClass: 'theme-bg-ocre text-encre-noire border-encre-noire'
      };
    }
    return {
      icon: '✉️',
      badgeLabel: t('forum.searchBadgeDirect'),
      badgeClass: 'bg-cordel-bg text-encre-noire border-encre-noire'
    };
  };

  if (results.length === 0) {
    return (
      <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none">
        <p className="text-xs font-bold text-cordel-master-dark/80">
          {loadingMessages ? `⏳ ${t('forum.searchIndexing')}` : `📭 ${t('forum.searchNoResults')}`}
        </p>
      </CordelCard>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 select-none">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
          {t('forum.searchResultsCount', { count: results.length })}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {results.map((item) => {
          const meta = getCategoryMeta(item.category);
          const { prefix = '', match = '', suffix = '' } = item.snippetParts || {};

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectResult(item)}
              className="w-full text-left p-3 rounded-[6px_10px_6px_8px] border-2 border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${meta.badgeClass}`}>
                    <span>{meta.icon}</span>
                    <span>{meta.badgeLabel}</span>
                  </span>
                  <span className="text-xs font-black text-encre-noire truncate">
                    {item.title}
                  </span>
                </div>

                <span className="text-[9.5px] font-bold text-cordel-wood shrink-0">
                  {t('forum.searchOpenResult')} →
                </span>
              </div>

              <p className="text-xs font-medium text-encre-noire/90 leading-snug line-clamp-2 break-words">
                {prefix}
                {match && (
                  <mark className="theme-bg-ocre text-encre-noire font-extrabold px-0.5 rounded border border-encre-noire/25">
                    {match}
                  </mark>
                )}
                {suffix}
              </p>

              <div className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-cordel-master-dark/75 pt-0.5">
                <span className="truncate">
                  {item.authorName ? `✍️ ${item.authorName}` : ''}
                </span>
                <span className="shrink-0 opacity-75">
                  {formatResultDate(item.timestamp)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
