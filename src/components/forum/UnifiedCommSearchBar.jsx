import React from 'react';

/**
 * Barre de recherche unifiée Cordel (Le Zap, Porte-Voix, Groupes & Messages privés)
 * avec 5 pilules de filtrage par catégorie et compteurs dynamiques (< 140 lignes).
 */
export default function UnifiedCommSearchBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  counts = { all: 0, zap: 0, forum: 0, groups: 0, direct: 0 },
  loadingMessages = false,
  hasLoadedCache = false,
  onRefreshCache,
  onClearSearch,
  inputRef,
  t
}) {
  const hasText = Boolean(searchQuery && searchQuery.trim().length > 0);

  const filterPills = [
    { id: 'all', icon: '🔎', label: t('forum.searchFilterAll'), count: counts.all || 0 },
    { id: 'zap', icon: '💬', label: t('forum.zapTitle'), count: counts.zap || 0 },
    { id: 'forum', icon: '📢', label: t('forum.searchFilterPorteVoix'), count: counts.forum || 0 },
    { id: 'groups', icon: '👥', label: t('forum.tabGroups'), count: counts.groups || 0 },
    { id: 'direct', icon: '✉️', label: t('forum.tabPrivateMessages'), count: counts.direct || 0 }
  ];

  return (
    <div className="flex flex-col gap-2 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_7px_8px] p-2.5 shadow-[2px_2px_0px_0px_#181716] select-none">
      <div className="flex items-center gap-2">
        <span className="text-sm shrink-0 pl-1 opacity-80" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && hasText) {
              e.preventDefault();
              onClearSearch();
            }
          }}
          placeholder={t('forum.searchPlaceholder')}
          aria-label={t('forum.searchPlaceholder')}
          className="flex-1 min-w-0 bg-white border border-encre-noire/40 focus:border-encre-noire rounded-[4px_6px_4px_5px] px-2.5 py-1.5 text-xs font-bold text-encre-noire placeholder:text-cordel-master-dark/55 placeholder:font-medium focus:outline-none"
        />

        {loadingMessages && (
          <span
            className="text-[10px] font-black uppercase tracking-wider text-cordel-wood animate-pulse shrink-0 px-1"
            title={t('forum.searchIndexing')}
          >
            ⏳ <span className="hidden sm:inline">{t('forum.searchIndexing')}</span>
          </span>
        )}

        {hasText && hasLoadedCache && !loadingMessages && onRefreshCache && (
          <button
            type="button"
            onClick={onRefreshCache}
            title={t('forum.searchRefreshCache')}
            aria-label={t('forum.searchRefreshCache')}
            className="px-2 py-1 text-xs font-black rounded border border-encre-noire/35 bg-cordel-bg hover:bg-white text-cordel-wood hover:text-encre-noire cursor-pointer transition-colors shrink-0"
          >
            ↻
          </button>
        )}

        {hasText && (
          <button
            type="button"
            onClick={onClearSearch}
            title={t('forum.searchClearBtn')}
            aria-label={t('forum.searchClearBtn')}
            className="px-2 py-1 text-xs font-black rounded border border-encre-noire/35 bg-cordel-bg hover:bg-white text-encre-noire cursor-pointer transition-colors shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {hasText && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-dashed border-cordel-master-dark/15">
          {filterPills.map((pill) => {
            const isActive = categoryFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setCategoryFilter(pill.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px_6px_3px_5px] text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  isActive
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                    : 'bg-cordel-bg text-encre-noire/80 border-encre-noire/30 hover:border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${isActive ? 'bg-encre-noire text-white' : 'bg-encre-noire/10 text-encre-noire'}`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
