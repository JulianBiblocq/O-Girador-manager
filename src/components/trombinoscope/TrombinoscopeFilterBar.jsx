import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Barre de recherche et de filtrage unifiée du Trombinoscope.
 * Force le padding gauche de l'input (!pl-10 et style inline) pour éviter tout chevauchement avec l'icône loupe.
 */
export default function TrombinoscopeFilterBar({
  searchQuery,
  setSearchQuery,
  filterInstrument,
  setFilterInstrument,
  filterTag,
  setFilterTag,
  fivePupitres,
  hasEnOrientation,
  hasRenforts,
  availableFilterTags,
  hasActiveFilter,
  totalFilteredCount,
  t
}) {
  return (
    <CordelCard
      variant="default"
      useExtremeBorder={false}
      className="p-2 sm:p-2.5 bg-cordel-bg flex flex-col md:flex-row md:items-center gap-2 md:gap-3 select-none"
    >
      {/* 1. Champ texte avec loupe intégrée à gauche (Prend tout l'espace disponible : flex-1) */}
      <div className="relative flex items-center flex-1 min-w-0">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-xs flex items-center leading-none">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('trombi.searchPlaceholder')}
          style={{ paddingLeft: '2.5rem' }}
          className="theme-input w-full !pl-10 pr-8 py-1.5 text-xs font-bold"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
            title="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Filtre Pupitre (menu déroulant compact w-auto shrink-0) */}
      <div className="w-full md:w-auto shrink-0">
        <select
          value={filterInstrument}
          onChange={(e) => setFilterInstrument(e.target.value)}
          className="theme-input w-full md:w-auto text-xs font-bold py-1.5 px-2 bg-cordel-bg-light cursor-pointer"
        >
          <option value="all">{t('trombi.allPupitres')}</option>
          <option value="mestre">👑 Mestre</option>
          {fivePupitres.map((pupitre) => (
            <option key={pupitre.id} value={pupitre.id}>{pupitre.label}</option>
          ))}
          {hasEnOrientation && (
            <option value="en-orientation">🌱 En cours d&apos;orientation</option>
          )}
          {hasRenforts && (
            <option value="renforts">🎪 Renforts &amp; Extérieurs</option>
          )}
        </select>
      </div>

      {/* 3. Filtre Étiquettes / Badges (menu déroulant compact w-auto shrink-0) */}
      <div className="w-full md:w-auto shrink-0">
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="theme-input w-full md:w-auto text-xs font-bold py-1.5 px-2 bg-cordel-bg-light cursor-pointer"
        >
          <option value="all">🏷️ {t('trombi.allTags')}</option>
          {availableFilterTags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.label}</option>
          ))}
        </select>
      </div>

      {/* 4. Compteur d'adhérents / Remise à zéro */}
      {hasActiveFilter ? (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setFilterInstrument('all');
            setFilterTag('all');
          }}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded border border-cordel-wood/40 text-[11px] font-bold text-[var(--color-cordel-marron,#8b2a1a)] bg-cordel-bg-light hover:bg-stone-200 transition-colors cursor-pointer"
          title="Réinitialiser tous les filtres"
        >
          <span>✕</span>
          <span>
            {totalFilteredCount > 1
              ? t('trombi.membersCountPlural', { count: totalFilteredCount })
              : t('trombi.membersCount', { count: totalFilteredCount })}
          </span>
        </button>
      ) : (
        <div className="w-full md:w-auto shrink-0 text-center md:text-right px-2 py-1 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 whitespace-nowrap">
          {totalFilteredCount > 1
            ? t('trombi.membersCountPlural', { count: totalFilteredCount })
            : t('trombi.membersCount', { count: totalFilteredCount })}
        </div>
      )}
    </CordelCard>
  );
}

