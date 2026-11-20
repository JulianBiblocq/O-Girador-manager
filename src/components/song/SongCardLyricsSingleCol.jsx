// Rendu pleine largeur (1 colonne centrée ou 2 colonnes équilibrées) lorsqu'une seule langue est imprimée (< 115 lignes).
import React, { useMemo } from 'react';
import { useTranslation } from '../LanguageContext';
import {
  buildLyricsStanzas,
  countNonEmptyLyricsLines,
  resolveLyricsColumnsMode
} from '../../utils/songCardLyricsUtils';

export default function SongCardLyricsSingleCol({
  lines = [],
  isPhoneticOnly = false,
  lyricsColumnsMode = 'auto',
  hasBottomSections = false,
  activePuxador = true,
  activeChoeur = true,
  isRevealedMode = true
}) {
  const { t } = useTranslation();

  const stanzas = useMemo(() => buildLyricsStanzas(lines), [lines]);
  const nonEmptyCount = useMemo(() => countNonEmptyLyricsLines(lines), [lines]);
  const effectiveMode = useMemo(
    () => resolveLyricsColumnsMode({
      mode: lyricsColumnsMode,
      nonEmptyLineCount: nonEmptyCount,
      hasBottomSections
    }),
    [lyricsColumnsMode, nonEmptyCount, hasBottomSections]
  );

  if (stanzas.length === 0) return null;

  const renderLine = (segs, lineIdx) => (
    <p
      key={lineIdx}
      className={`m-0 py-0.5 toada-print-lyrics-text break-inside-avoid ${
        isPhoneticOnly ? 'italic text-encre-noire/90 print:text-black/90' : 'text-encre-noire print:text-black'
      }`}
    >
      {segs.map((seg, sIdx) => (
        <span
          key={sIdx}
          className={
            seg.isBold
              ? `font-black text-encre-noire print:text-black ${activePuxador || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
              : `font-medium ${isPhoneticOnly ? 'italic' : ''} text-encre-noire/90 print:text-black/90 ${activeChoeur || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
          }
        >
          {seg.text}
        </span>
      ))}
    </p>
  );

  return (
    <div className="w-full flex-1">
      {/* Masquer VERSION ORIGINALE si original seul ; afficher un bandeau discret centré si phonétique seule */}
      {isPhoneticOnly && (
        <div className="flex justify-center mb-2.5">
          <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-0.5 px-4 rounded font-heading tracking-widest text-xs border border-encre-noire/15 uppercase">
            {t('pedagogy.cards.versionPhonetique')}
          </h3>
        </div>
      )}

      {effectiveMode === 'two-columns' ? (
        <div className="w-full columns-2 gap-8 [&_div]:break-inside-avoid [&_p]:break-inside-avoid toada-lyrics-two-cols">
          {stanzas.map((stanza, stIdx) => (
            <div key={stIdx} className="break-inside-avoid mb-3 text-center">
              {stanza.map((segs, lIdx) => renderLine(segs, lIdx))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mx-auto max-w-[88%] flex flex-col gap-3">
          {stanzas.map((stanza, stIdx) => (
            <div key={stIdx} className="break-inside-avoid text-center">
              {stanza.map((segs, lIdx) => renderLine(segs, lIdx))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
