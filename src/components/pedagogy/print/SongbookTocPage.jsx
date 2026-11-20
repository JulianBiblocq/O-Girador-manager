// Sommaire automatique triable du Carnet de chants avec index #01, Nação, pointillés et Rythme (< 125 lignes).
import React, { useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { getSongTitle, getSongRhythm, getSongNacao, groupIndexedSongsForToc } from '../../../utils/songbookSortUtils';

export default function SongbookTocPage({
  indexedSongs = [],
  sortBy = 'title',
  bwMode = false,
  startOnOddPage = false,
  groupName = ''
}) {
  const { t } = useTranslation();
  const groups = useMemo(
    () => groupIndexedSongsForToc(indexedSongs, sortBy, t('toadaPrint.unspecifiedGroup')),
    [indexedSongs, sortBy, t]
  );

  if (!indexedSongs || indexedSongs.length === 0) return null;

  const breakClass = startOnOddPage ? 'print-song-page print-song-page-odd' : 'print-song-page';
  const accentText = bwMode ? 'text-black' : 'text-[var(--color-cordel-ocre,#c05621)]';
  const accentBorder = bwMode ? 'border-black' : 'border-[var(--color-cordel-ocre,#c05621)]';

  return (
    <div className={breakClass}>
      <div className="w-full flex flex-col gap-4 text-left text-encre-noire print:text-black">
        {/* En-tête Cordel du Sommaire */}
        <div className="flex flex-col items-center text-center gap-1">
          {groupName ? (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
              {groupName}
            </span>
          ) : null}
          <h2 className={`text-2xl sm:text-3xl font-heading uppercase tracking-widest ${accentText}`}>
            {t('toadaPrint.tocTitle')}
          </h2>
          <hr className={`w-full border-t-4 ${accentBorder} mt-2`} />
        </div>

        {/* Liste des Toadas indexées avec intertitres sobres éventuels */}
        <div className="flex flex-col gap-4 mt-1">
          {groups.map((grp, gIdx) => (
            <div key={grp.groupTitle || `all_${gIdx}`} className="flex flex-col gap-1.5">
              {grp.groupTitle ? (
                <h3 className={`text-xs font-black uppercase tracking-widest pt-1 pb-0.5 border-b border-encre-noire/20 ${accentText}`}>
                  {sortBy === 'rhythm' ? '🥁 ' : '🌍 '}
                  {grp.groupTitle}
                </h3>
              ) : null}

              <div className="flex flex-col gap-1.5">
                {grp.items.map(({ song, formattedIndex }) => {
                  const title = getSongTitle(song) || t('pedagogy.cards.titreInconnu');
                  const nacao = getSongNacao(song);
                  const rhythm = getSongRhythm(song);

                  return (
                    <div
                      key={song.id || formattedIndex}
                      className="flex items-baseline gap-2 text-xs sm:text-sm break-inside-avoid py-0.5"
                    >
                      <span className="font-mono font-black text-[11px] opacity-75 shrink-0 w-8">
                        {formattedIndex}
                      </span>
                      <span className="font-black text-encre-noire print:text-black shrink-0">
                        {title}
                      </span>
                      {nacao ? (
                        <span className="text-[11px] italic opacity-75 shrink-0">
                          ({nacao})
                        </span>
                      ) : null}
                      <span className="flex-1 border-b border-dotted border-encre-noire/40 print:border-neutral-500 min-w-[24px] mx-1" />
                      <span className="font-bold text-[11px] uppercase tracking-wider shrink-0 text-right">
                        {rhythm || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
