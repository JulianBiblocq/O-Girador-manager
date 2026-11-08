import React from 'react';

/**
 * Barre de navigation principale du Porte-Voix (3 onglets racine : Discussions / Messages Privés / Groupes).
 */
export default function ForumMainTabsBar({
  activeTab,
  setActiveTab,
  setIsAdding,
  unreadDirectCount = 0,
  unreadGroupsCount = 0,
  t,
  translate
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 w-full select-none">
      {/* Onglet 1 : Discussions */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('discussions');
          setIsAdding(false);
        }}
        className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 lg:py-1 lg:px-2.5 text-[11px] sm:text-xs lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer text-center ${
          activeTab === 'discussions'
            ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
            : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
        }`}
      >
        <span className="shrink-0">💬</span>
        <span className="truncate">{translate('forum.discussionsTab', 'Discussions')}</span>
      </button>

      {/* Onglet 2 : Messages Privés (1-à-1) — libellé raccourci sur mobile < 640px */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('direct');
          setIsAdding(false);
        }}
        className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 lg:py-1 lg:px-2.5 text-[11px] sm:text-xs lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer relative text-center ${
          activeTab === 'direct'
            ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
            : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
        }`}
      >
        <span className="shrink-0">✉️</span>
        <span className="truncate sm:hidden">{t('forum.tabPrivateShort')}</span>
        <span className="truncate hidden sm:inline">{t('forum.tabPrivateMessages')}</span>
        {unreadDirectCount > 0 && (
          <span className="absolute -top-1.5 -right-1 min-w-[14px] h-3.5 px-1 bg-red-600 text-white text-[7px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadDirectCount}
          </span>
        )}
      </button>

      {/* Onglet 3 : Groupes */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('groups');
          setIsAdding(false);
        }}
        className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 lg:py-1 lg:px-2.5 text-[11px] sm:text-xs lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer relative text-center ${
          activeTab === 'groups'
            ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
            : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
        }`}
      >
        <span className="shrink-0">👥</span>
        <span className="truncate">{t('forum.tabGroups')}</span>
        {unreadGroupsCount > 0 && (
          <span className="absolute -top-1.5 -right-1 min-w-[14px] h-3.5 px-1 bg-red-600 text-white text-[7px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadGroupsCount}
          </span>
        )}
      </button>
    </div>
  );
}

