// Options additionnelles dédiées au Carnet de chants global (couverture, sommaire, tri, sélection) (< 130 lignes).
import React from 'react';
import { useTranslation } from '../../LanguageContext';
import { getSongTitle, getSongRhythm, getSongNacao } from '../../../utils/songbookSortUtils';

export default function SongbookExtraControls({
  songbookOptions,
  onUpdateOptions,
  includeArchived = false,
  onToggleArchived,
  candidateSongs = [],
  selectedIds = new Set(),
  onToggleSongId,
  onSelectAll,
  onDeselectAll
}) {
  const { t } = useTranslation();
  const count = selectedIds.size;
  const countLabel = count === 1
    ? t('toadaPrint.selectedSongCountSingular', { count })
    : t('toadaPrint.selectedSongsCount', { count });

  const sortButtons = [
    { id: 'title', icon: '🔤', label: t('toadaPrint.sortTitle') },
    { id: 'rhythm', icon: '🥁', label: t('toadaPrint.sortRhythm') },
    { id: 'nacao', icon: '🌍', label: t('toadaPrint.sortNacao') }
  ];

  return (
    <div className="flex flex-col gap-3 pt-3 border-t-2 border-dashed border-encre-noire/20">
      <span className="font-black uppercase tracking-wider text-xs text-cordel-wood">
        📖 {t('toadaPrint.songbookSectionTitle')}
      </span>

      {/* Page de garde & Sommaire automatique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-encre-noire/20 bg-white/80 dark:bg-stone-900">
          <input
            type="checkbox"
            checked={Boolean(songbookOptions.includeCover)}
            onChange={(e) => onUpdateOptions({ includeCover: e.target.checked })}
            className="accent-[var(--color-cordel-vert,#2d6a4f)] w-4 h-4 cursor-pointer"
          />
          <span>{t('toadaPrint.includeCover')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-encre-noire/20 bg-white/80 dark:bg-stone-900">
          <input
            type="checkbox"
            checked={Boolean(songbookOptions.includeToc)}
            onChange={(e) => onUpdateOptions({ includeToc: e.target.checked })}
            className="accent-[var(--color-cordel-vert,#2d6a4f)] w-4 h-4 cursor-pointer"
          />
          <span>{t('toadaPrint.includeToc')}</span>
        </label>
      </div>

      {/* Sous-titre personnalisé de couverture */}
      {songbookOptions.includeCover && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold opacity-80">{t('toadaPrint.coverSubtitleLabel')}</label>
          <input
            type="text"
            value={songbookOptions.subtitle || ''}
            onChange={(e) => onUpdateOptions({ subtitle: e.target.value })}
            placeholder={t('toadaPrint.coverSubtitlePlaceholder')}
            className="theme-input text-xs py-1.5 px-2.5 w-full"
          />
        </div>
      )}

      {/* Tri du carnet */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-black uppercase tracking-wider">{t('toadaPrint.sortByLabel')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {sortButtons.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onUpdateOptions({ sortBy: b.id })}
              className={`py-1.5 px-2 rounded border text-[10.5px] font-black uppercase cursor-pointer transition-colors ${
                songbookOptions.sortBy === b.id
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-100 dark:bg-stone-900 dark:text-stone-200'
              }`}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Switches : Archivés & Recto-verso page impaire */}
      <div className="flex flex-col gap-1.5 text-xs font-bold">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeArchived} onChange={(e) => onToggleArchived(e.target.checked)} className="accent-[var(--color-cordel-ocre,#c05621)] w-4 h-4 cursor-pointer" />
          <span>{t('toadaPrint.includeArchived')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={Boolean(songbookOptions.startOnOddPage)} onChange={(e) => onUpdateOptions({ startOnOddPage: e.target.checked })} className="accent-[var(--color-cordel-vert,#2d6a4f)] w-4 h-4 cursor-pointer" />
          <span>{t('toadaPrint.startOnOddPage')}</span>
        </label>
      </div>

      {/* Sélection granulaire des chants */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-wider">{countLabel}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onSelectAll} className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 text-encre-noire cursor-pointer">{t('toadaPrint.selectAll')}</button>
            <button type="button" onClick={onDeselectAll} className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 text-encre-noire cursor-pointer">{t('toadaPrint.deselectAll')}</button>
          </div>
        </div>
        <div className="max-h-36 overflow-y-auto rounded border border-encre-noire/20 bg-white/90 dark:bg-stone-900 divide-y divide-encre-noire/10 p-1">
          {candidateSongs.length === 0 ? (
            <p className="text-xs italic opacity-65 p-2 text-center">{t('toadaPrint.noSongsAvailable')}</p>
          ) : candidateSongs.map((s) => {
            const meta = [getSongNacao(s), getSongRhythm(s)].filter(Boolean).join(' • ');
            return (
              <label key={s.id} className="flex items-center justify-between gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-stone-800 rounded">
                <span className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => onToggleSongId(s.id)} className="accent-[var(--color-cordel-vert,#2d6a4f)] w-3.5 h-3.5 shrink-0 cursor-pointer" />
                  <span className="font-bold truncate">{getSongTitle(s)}</span>
                  {s.isArchived && <span className="text-[9px] uppercase px-1 rounded bg-amber-100 text-amber-900 font-black shrink-0">{t('toadaPrint.archivedBadge')}</span>}
                </span>
                {meta ? <span className="text-[10px] opacity-60 shrink-0">{meta}</span> : null}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
