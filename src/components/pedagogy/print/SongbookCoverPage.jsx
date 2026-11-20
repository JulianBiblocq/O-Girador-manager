// Page de garde Cordel pleine page pour le Carnet de chants (< 115 lignes).
import React from 'react';
import { getInstrumentStamp } from '../../InstrumentStampSVG';
import { useTranslation } from '../../LanguageContext';

export default function SongbookCoverPage({
  groupName = '',
  logoUrl = '',
  subtitle = '',
  songsCount = 0,
  bwMode = false,
  startOnOddPage = false
}) {
  const { t } = useTranslation();
  const breakClass = startOnOddPage ? 'print-song-page print-song-page-odd' : 'print-song-page';
  const frameClass = bwMode ? 'songbook-cover-frame-bw' : 'songbook-cover-frame';
  const countLabel = songsCount === 1
    ? t('toadaPrint.coverSongsCountSingular', { count: songsCount })
    : t('toadaPrint.coverSongsCountPlural', { count: songsCount });

  return (
    <div className={breakClass}>
      <div className={`songbook-cover-page ${frameClass} p-3 sm:p-4 flex flex-col justify-between`}>
        {/* Seconde bordure décorative intérieure style Cordel */}
        <div className={`flex-1 flex flex-col items-center justify-between p-6 sm:p-10 text-center border-2 ${bwMode ? 'border-neutral-800' : 'border-[var(--color-cordel-ocre,#c05621)]'}`}>
          {/* En-tête : Logo et nom de l'association */}
          <div className="flex flex-col items-center gap-3 w-full pt-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={groupName || 'Logo'}
                className={`w-20 h-20 sm:w-24 sm:h-24 object-contain ${bwMode ? 'grayscale contrast-125' : ''}`}
              />
            ) : null}
            {groupName ? (
              <span className="text-sm sm:text-base font-black uppercase tracking-[0.22em] text-encre-noire">
                {groupName}
              </span>
            ) : null}
            <div className={`w-24 border-t-2 ${bwMode ? 'border-black' : 'border-[var(--color-cordel-ocre,#c05621)]'}`} />
          </div>

          {/* Bloc central : Grand titre, sous-titre, tampon xylogravure chant et compteur */}
          <div className="flex flex-col items-center gap-5 my-6 w-full">
            <h1 className={`text-3xl sm:text-5xl font-heading uppercase tracking-widest leading-tight ${bwMode ? 'text-black' : 'text-[var(--color-cordel-rouge,#8b2a1a)]'}`}>
              {t('toadaPrint.coverTitle')}
            </h1>

            {subtitle && subtitle.trim() ? (
              <p className="text-base sm:text-xl font-heading tracking-wider text-encre-noire/85">
                {subtitle.trim()}
              </p>
            ) : null}

            <div className="my-2 w-28 h-24 flex items-center justify-center">
              {getInstrumentStamp('chant', 'w-28 h-24')}
            </div>

            <span className={`px-4 py-1.5 rounded border-2 text-xs sm:text-sm font-black uppercase tracking-widest ${bwMode ? 'border-black text-black' : 'border-[var(--color-cordel-ocre,#c05621)] text-encre-noire'}`}>
              {countLabel}
            </span>
          </div>

          {/* Pied de couverture : Cartouche nominatif */}
          <div className="w-full max-w-sm pt-6 pb-1 flex flex-col items-center gap-2">
            <div className="w-full border-t border-dashed border-encre-noire/30 pt-4 flex items-end justify-center gap-2 text-xs sm:text-sm font-bold text-encre-noire">
              <span className="shrink-0 uppercase tracking-wider text-[11px]">
                {t('toadaPrint.belongsTo')}
              </span>
              <span className="flex-1 max-w-[220px] border-b border-encre-noire h-4 inline-block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
