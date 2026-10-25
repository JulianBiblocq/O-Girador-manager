import React from 'react';
import { useTranslation } from '../LanguageContext';
import { parseLyricsString } from '../../utils/lyricsParser';

const CHORD_STRIP_REGEX = /\[[A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*\]/g;
const SECTION_STRIP_REGEX = /^\s*\[(?!(?:[A-G][b#]?))[^\]]+\]\s*$/i;

function cleanVaralLyrics(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/\[\d+\]/g, '').replace(/\[sig:[^\]]+\]/gi, '').replace(/_/g, '');
}

function normalizeToLineArray(content) {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.flatMap((c) => normalizeToLineArray(c));
  }
  const cleaned = cleanVaralLyrics(content);
  if (typeof cleaned === 'string' && /<[a-z][\s\S]*>/i.test(cleaned)) {
    const parsed = parseLyricsString(cleaned);
    if (Array.isArray(parsed)) return parsed.flatMap((c) => normalizeToLineArray(c));
    const clean = cleaned
      .replace(/<p\b[^>]*>\s*(?:<br\b[^>]*>|&nbsp;|\s)*<\/p>/gi, '\n\n')
      .replace(/<\/p>|<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return clean.split(/\r?\n/).map((l) => l.trim());
  }
  return cleaned.split(/\r?\n/).map((l) => l.trim());
}

function parseLineSegments(line) {
  if (!line || SECTION_STRIP_REGEX.test(line)) return [];
  if (typeof line !== 'string') {
    if (line.puxador) return [{ text: line.puxador, isBold: true }];
    if (line.coro || line.choeur) return [{ text: line.coro || line.choeur, isBold: false }];
    return [];
  }
  const clean = line
    .replace(/^\s*[+/]\s*/, '')
    .replace(CHORD_STRIP_REGEX, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[sig:[^\]]+\]/gi, '')
    .replace(/_/g, '')
    .replace(/(^|\s|\*)\+\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!clean) return [];
  return clean.split(/(\*[^*]+\*)/g).filter(Boolean).map((p) => {
    const isBold = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    return { text: isBold ? p.slice(1, -1) : p, isBold };
  });
}

export default function SongCardLyricsSection({
  song, activePuxador = true, activeChoeur = true, isRevealedMode = true, showOriginal = true, showPhonetic = true
}) {
  const { t } = useTranslation();
  const rawOrig = song?.parolesOriginales || song?.paroles || '';
  const rawPhon = song?.parolesPhonetiques || '';
  const hasPhon = Boolean(rawPhon && (typeof rawPhon !== 'string' || rawPhon.trim().length > 0) && showPhonetic);

  const origLines = normalizeToLineArray(rawOrig);
  const phonLines = normalizeToLineArray(rawPhon);
  const maxLines = Math.max(origLines.length, phonLines.length, 1);
  const nothingChecked = !activePuxador && !activeChoeur && !isRevealedMode;

  const renderSegs = (segs, isPhon = false) => {
    if (!segs || segs.length === 0) return <span>&nbsp;</span>;
    return (
      <p className={`m-0 p-0 leading-snug ${isPhon ? 'italic text-encre-noire/85' : 'text-encre-noire'}`}>
        {segs.map((seg, sIdx) => (
          <span key={sIdx} className={`transition-opacity duration-300 ${
            seg.isBold ? `font-black text-encre-noire print:text-black ${activePuxador || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
              : `font-medium ${isPhon ? 'italic' : ''} text-encre-noire/90 print:text-black/90 ${activeChoeur || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
          }`}>{seg.text}</span>
        ))}
      </p>
    );
  };

  return (
    <div className="w-full flex-1 text-left">
      {nothingChecked && (
        <div className="flex flex-col items-center justify-center text-center p-2.5 mb-2 bg-[#f5f0e6] dark:bg-[#201d1a] border border-dashed border-cordel-master-dark/30 rounded">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cordel-master-dark">
            {t('pedagogy.cards.cochezPuxadorOuCoroAu') || "Cochez Puxador ou Coro pour afficher les paroles"}
          </p>
        </div>
      )}

      <div className={`grid ${hasPhon && showOriginal ? 'grid-cols-2 divide-x divide-encre-noire/15' : 'grid-cols-1'} mb-2 print:grid-cols-2`}>
        {showOriginal && (
          <div className={hasPhon ? 'pr-3 md:pr-4' : ''}>
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 px-2 rounded font-heading tracking-widest text-xs md:text-sm border border-encre-noire/10 capitalize print:text-xs">
              {t('pedagogy.cards.versionOriginale') || "Version originale"}
            </h3>
          </div>
        )}
        {hasPhon && (
          <div className={showOriginal ? 'pl-3 md:pl-4' : ''}>
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 px-2 rounded font-heading tracking-widest text-xs md:text-sm border border-encre-noire/10 capitalize print:text-xs">
              {t('pedagogy.cards.versionPhonetique') || "Version phonétique"}
            </h3>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {Array.from({ length: maxLines }).map((_, idx) => {
          const origSegs = parseLineSegments(origLines[idx]);
          const phonSegs = parseLineSegments(phonLines[idx]);
          const isEmpty = origSegs.length === 0 && phonSegs.length === 0;

          if (isEmpty) return <div key={idx} className="h-3 md:h-3.5 print:h-2" />;

          return (
            <div key={idx} className={`grid ${hasPhon && showOriginal ? 'grid-cols-2 divide-x divide-encre-noire/15' : 'grid-cols-1'} items-start py-0.5 print:grid-cols-2`}>
              {showOriginal && (
                <div className={`${hasPhon ? 'pr-3 md:pr-4' : ''} text-[12px] md:text-[13px] leading-snug print:text-[11px]`}>
                  {renderSegs(origSegs, false)}
                </div>
              )}
              {hasPhon && (
                <div className={`${showOriginal ? 'pl-3 md:pl-4' : ''} text-[12px] md:text-[13px] leading-snug print:text-[11px]`}>
                  {renderSegs(phonSegs, true)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
