import React from 'react';

/**
 * Bandeau KPI et barre de filtres/tri du Grand Tableau Synoptique des créneaux bénévoles :
 * Postes pourvus, Places restantes, Bénévoles uniques, Flexibles à placer,
 * filtres Jour / Commission / Recherche et bascule Horaire vs Postes dégarnis en premier.
 */
export default function VolunteerSynopticToolbar({
  kpis,
  dayOptions = [],
  commissionOptions = [],
  dayFilter = 'all',
  onChangeDay,
  commissionFilter = 'all',
  onChangeCommission,
  searchQuery = '',
  onChangeSearch,
  sortBy = 'chronological',
  onChangeSort,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Bandeau des 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <div className={`p-2.5 rounded-lg border-2 border-[var(--theme-border)] text-white flex flex-col ${kpis.isComplete ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`}>
          <span className="text-[9.5px] uppercase font-bold opacity-90">{t('agenda.volunteerKpiFilled') || 'Postes pourvus'}</span>
          <strong className="text-sm font-black">{kpis.totalRequired > 0 ? `${kpis.filledPosts} / ${kpis.totalRequired}` : kpis.totalInscrits}</strong>
        </div>

        <div className="p-2.5 rounded-lg border border-[var(--theme-border)]/35 bg-[var(--cordel-bg)] flex flex-col">
          <span className="text-[9.5px] uppercase font-bold opacity-75">{t('agenda.volunteerKpiRemaining') || 'Places restantes'}</span>
          <strong className={`text-sm font-black ${kpis.remainingPlaces > 0 ? 'text-[var(--color-cordel-rouge)]' : 'text-[var(--color-cordel-vert)]'}`}>{kpis.remainingPlaces}</strong>
        </div>

        <div className="p-2.5 rounded-lg border border-[var(--theme-border)]/35 bg-[var(--cordel-bg)] flex flex-col">
          <span className="text-[9.5px] uppercase font-bold opacity-75">{t('agenda.volunteerKpiUnique') || 'Bénévoles uniques'}</span>
          <strong className="text-sm font-black">{kpis.uniqueVolunteersCount}</strong>
        </div>

        <div className={`p-2.5 rounded-lg border flex flex-col ${kpis.flexiblesToPlaceCount > 0 ? 'border-[var(--color-cordel-ocre)] bg-[var(--cordel-bg)]' : 'border-[var(--theme-border)]/35 bg-[var(--cordel-bg)]'}`}>
          <span className="text-[9.5px] uppercase font-bold opacity-75">{t('agenda.volunteerKpiFlexibles') || 'Flexibles à placer'}</span>
          <strong className={`text-sm font-black ${kpis.flexiblesToPlaceCount > 0 ? 'text-[var(--color-cordel-ocre)]' : ''}`}>{kpis.flexiblesToPlaceCount}</strong>
        </div>
      </div>

      {/* Filtres & Bascule de tri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap bg-[var(--cordel-bg)]/60 p-2.5 rounded-lg border border-[var(--theme-border)]/20">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {dayOptions.length > 1 && (
            <select value={dayFilter} onChange={(e) => onChangeDay(e.target.value)} className="theme-input py-1 px-2 text-xs font-bold">
              <option value="all">📅 {t('agenda.volunteerAllDays') || 'Tous les jours'}</option>
              {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <select value={commissionFilter} onChange={(e) => onChangeCommission(e.target.value)} className="theme-input py-1 px-2 text-xs font-bold">
            <option value="all">🎪 {t('agenda.volunteerAllCommissions') || 'Toutes commissions'}</option>
            <option value="general">{t('agenda.volunteerGeneralShort') || 'Général'}</option>
            {commissionOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder={t('agenda.volunteerSearchPlaceholder') || 'Rechercher un poste ou un bénévole...'}
            className="theme-input py-1 px-2.5 text-xs flex-1 min-w-[160px]"
          />
        </div>

        <div className="inline-flex rounded-lg border border-[var(--theme-border)] overflow-hidden shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeSort('chronological')}
            className={`px-2.5 py-1 text-[10px] font-black cursor-pointer ${sortBy === 'chronological' ? 'bg-[var(--cordel-wood)] text-white' : 'bg-[var(--theme-card-bg)]'}`}
          >
            🕒 {t('agenda.volunteerSortChrono') || 'Ordre horaire'}
          </button>
          <button
            type="button"
            onClick={() => onChangeSort('unfilled_first')}
            className={`px-2.5 py-1 text-[10px] font-black border-l border-[var(--theme-border)] cursor-pointer ${sortBy === 'unfilled_first' ? 'bg-[var(--color-cordel-rouge)] text-white' : 'bg-[var(--theme-card-bg)]'}`}
          >
            🔥 {t('agenda.volunteerSortUnfilled') || 'Postes dégarnis en premier'}
          </button>
        </div>
      </div>
    </div>
  );
}
