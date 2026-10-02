import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * En-tête et barre d'actions du Répertoire adhérent.
 * Affiche le titre de la saison, la bascule Tout déplier / replier et la recherche.
 */
export default function MemberRepertoireHeader({
  searchQuery,
  setSearchQuery,
  allExpanded,
  onToggleAllExpanded,
  hasPieces
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b-2 border-dashed border-cordel-master-dark/30">
      <div>
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          {t('repertoire.catalogTitle') || 'Répertoire de la Saison'}
        </h2>
        <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
          {t('repertoire.memberSubtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {hasPieces && (
          <button
            type="button"
            onClick={onToggleAllExpanded}
            className="text-xs font-black uppercase tracking-wider bg-cordel-bg border-2 border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer hover:bg-neutral-200 shrink-0 transition-all select-none"
            title={allExpanded ? t('repertoire.btnCollapseAll') : t('repertoire.btnExpandAll')}
          >
            {allExpanded ? `⊟ ${t('repertoire.btnCollapseAll')}` : `⊞ ${t('repertoire.btnExpandAll')}`}
          </button>
        )}

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={t('repertoire.searchPlaceholder') ? `🔍 ${t('repertoire.searchPlaceholder')}` : '🔍 Rechercher un morceau...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full text-xs font-bold py-1.5 px-3 bg-cordel-bg-light border-2 border-encre-noire rounded"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
