// Section des paroles d'une Toada : grille 2 colonnes (Cas A) ou pleine largeur centrée (Cas B) (< 120 lignes).
import React from 'react';
import { useTranslation } from '../LanguageContext';
import {
  extractCleanSongLyrics,
  parseLineSegments,
  countNonEmptyLyricsLines
} from '../../utils/songCardLyricsUtils';
import SongCardLyricsSingleCol from './SongCardLyricsSingleCol';

export default function SongCardLyricsSection({
  song,
  activePuxador = true,
  activeChoeur = true,
  isRevealedMode = true,
  isPrintVersion = false,
  showOriginal = true,
  showPhonetic = true,
  lyricsColumnsMode = 'auto',
  hasBottomSections = false
}) {
  const { t } = useTranslation();

  // Règle Zéro élément fantôme : si aucune langue n'est cochée, masquer complètement
  if (!showOriginal && !showPhonetic) return null;

  // Étanchéité stricte : lecture exclusive de parolesOriginales / parolesPhonetiques (jamais rawTxtCode)
  const { origLines, phonLines } = extractCleanSongLyrics(song);
  const hasOrigContent = countNonEmptyLyricsLines(origLines) > 0;
  const hasPhonContent = countNonEmptyLyricsLines(phonLines) > 0;

  const activeOrig = Boolean(showOriginal && (hasOrigContent || !isPrintVersion));
  const activePhon = Boolean(showPhonetic && hasPhonContent);

  if (isPrintVersion && !hasOrigContent && !activePhon) return null;
  if (!activeOrig && !activePhon) return null;

  // Cas B : Mode impression avec une seule langue active -> 100% largeur (1 col centrée ou 2 cols équilibrées)
  if (isPrintVersion && activeOrig !== activePhon) {
    return (
      <SongCardLyricsSingleCol
        lines={activePhon ? phonLines : origLines}
        isPhoneticOnly={activePhon}
        lyricsColumnsMode={lyricsColumnsMode}
        hasBottomSections={hasBottomSections}
        activePuxador={activePuxador}
        activeChoeur={activeChoeur}
        isRevealedMode={isRevealedMode}
      />
    );
  }

  // Cas A : Original ET Phonétique côte à côte (ou vue interactive écran)
  const maxLines = Math.max(origLines.length, phonLines.length, 1);
  const nothingChecked = !activePuxador && !activeChoeur && !isRevealedMode;
  const isTwoLangGrid = activeOrig && activePhon;

  const renderSegs = (segs, isPhon = false) => {
    if (!segs || segs.length === 0) return <span>&nbsp;</span>;
    return (
      <p className={`m-0 p-0 leading-snug toada-print-lyrics-text ${isPhon ? 'italic text-encre-noire/85' : 'text-encre-noire'}`}>
        {segs.map((seg, sIdx) => (
          <span
            key={sIdx}
            className={`transition-opacity duration-300 ${
              seg.isBold
                ? `font-black text-encre-noire print:text-black ${activePuxador || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
                : `font-medium ${isPhon ? 'italic' : ''} text-encre-noire/90 print:text-black/90 ${activeChoeur || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
            }`}
          >
            {seg.text}
          </span>
        ))}
      </p>
    );
  };

  return (
    <div className="w-full flex-1 text-left">
      {nothingChecked && (
        <div className="flex flex-col items-center justify-center text-center p-2.5 mb-2 bg-[#f5f0e6] dark:bg-[#201d1a] border border-dashed border-cordel-master-dark/30 rounded">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cordel-master-dark">
            {t('pedagogy.cards.cochezPuxadorOuCoroAu')}
          </p>
        </div>
      )}

      <div className={`grid ${isTwoLangGrid ? 'grid-cols-2 divide-x divide-encre-noire/15' : 'grid-cols-1'} mb-2`}>
        {activeOrig && (
          <div className={isTwoLangGrid ? 'pr-3 md:pr-4' : ''}>
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 px-2 rounded font-heading tracking-widest text-xs md:text-sm border border-encre-noire/10 capitalize print:text-xs">
              {t('pedagogy.cards.versionOriginale')}
            </h3>
          </div>
        )}
        {activePhon && (
          <div className={isTwoLangGrid ? 'pl-3 md:pl-4' : ''}>
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 px-2 rounded font-heading tracking-widest text-xs md:text-sm border border-encre-noire/10 capitalize print:text-xs">
              {t('pedagogy.cards.versionPhonetique')}
            </h3>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {Array.from({ length: maxLines }).map((_, idx) => {
          const origSegs = parseLineSegments(origLines[idx]);
          const phonSegs = parseLineSegments(phonLines[idx]);
          if (origSegs.length === 0 && phonSegs.length === 0) return <div key={idx} className="h-3 md:h-3.5 print:h-2" />;
          return (
            <div key={idx} className={`grid ${isTwoLangGrid ? 'grid-cols-2 divide-x divide-encre-noire/15' : 'grid-cols-1'} items-start py-0.5`}>
              {activeOrig && <div className={`${isTwoLangGrid ? 'pr-3 md:pr-4' : ''} text-[12px] md:text-[13px] leading-snug`}>{renderSegs(origSegs, false)}</div>}
              {activePhon && <div className={`${isTwoLangGrid ? 'pl-3 md:pl-4' : ''} text-[12px] md:text-[13px] leading-snug`}>{renderSegs(phonSegs, true)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
