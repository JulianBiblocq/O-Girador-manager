import React from 'react';
import { useTranslation } from '../LanguageContext';
import { parseLyricsString } from '../../utils/lyricsParser';

const CHORD_STRIP_REGEX = /\[[A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*\]/g;
const SECTION_STRIP_REGEX = /^\s*\[(?!(?:[A-G][b#]?))[^\]]+\]\s*$/i;

function normalizeToMeasures(content) {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content)) {
    const parsed = parseLyricsString(content);
    if (Array.isArray(parsed)) return parsed;
    const clean = content.replace(/<\/p>|<\/div>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n ');
    return clean.split(/\n\s*\n/).map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  }
  return content.split(/\r?\n\s*\r?\n/).map((m) => m.trim()).filter(Boolean);
}

function parseMeasureLines(measure) {
  if (!measure) return [];
  if (typeof measure !== 'string') {
    if (measure.isMixed && Array.isArray(measure.segments)) {
      return [measure.segments.map((s) => ({ text: s.text, isBold: Boolean(s.isBold) }))];
    }
    const lines = [];
    if (measure.puxador) lines.push([{ text: measure.puxador, isBold: true }]);
    if (measure.coro || measure.choeur) lines.push([{ text: measure.coro || measure.choeur, isBold: false }]);
    return lines;
  }
  const rawLines = measure.split(/\r?\n/).filter((l) => !SECTION_STRIP_REGEX.test(l.trim()));
  return rawLines.map((line) => {
    const clean = line
      .replace(/^\s*[+/]\s*/, '')
      .replace(CHORD_STRIP_REGEX, '')
      .replace(/(^|\s|\*)\+\s+/g, '$1')
      .trim();
    return clean.split(/(\*[^*]+\*)/g).filter(Boolean).map((p) => {
      const isBold = p.startsWith('*') && p.endsWith('*') && p.length > 2;
      return { text: isBold ? p.slice(1, -1) : p, isBold };
    });
  });
}

/**
 * Section Paroles "Carnet de Chants" (2 colonnes côte à côte) (< 150 lignes).
 * Supporte le texte brut .txt, les objets mesures et le HTML TipTap historique.
 */
export default function SongCardLyricsSection({
  song,
  activePuxador = true,
  activeChoeur = true,
  isRevealedMode = true,
  showOriginal = true,
  showPhonetic = true
}) {
  const { t } = useTranslation();
  const rawOrig = song?.rawTxtCode || song?.parolesOriginales || song?.paroles || '';
  const rawPhon = song?.parolesPhonetiques || '';
  const hasPhon = Boolean(rawPhon && (typeof rawPhon !== 'string' || rawPhon.trim().length > 0) && showPhonetic);

  const origMeasures = normalizeToMeasures(rawOrig);
  const phonMeasures = normalizeToMeasures(rawPhon);
  const maxMeasures = Math.max(origMeasures.length, phonMeasures.length, 1);
  const nothingChecked = !activePuxador && !activeChoeur && !isRevealedMode;

  const renderMeasureLines = (lines, isPhonetic = false) => {
    if (!lines || lines.length === 0) return null;
    return (
      <div className={`flex flex-col ${isRevealedMode ? 'leading-tight' : 'leading-relaxed'}`}>
        {lines.map((segs, lIdx) => (
          <p key={lIdx} className={`${lIdx > 0 ? 'mt-0.5' : ''} ${isPhonetic ? 'italic text-encre-noire/85' : 'text-encre-noire'}`}>
            {segs.map((seg, sIdx) => (
              <span
                key={sIdx}
                className={`transition-opacity duration-300 ${
                  seg.isBold
                    ? `font-black text-encre-noire print:text-black ${activePuxador || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
                    : `font-medium ${isPhonetic ? 'italic' : ''} text-encre-noire/90 print:text-black/90 ${activeChoeur || isRevealedMode ? 'opacity-100' : 'opacity-0'}`
                }`}
              >
                {seg.text}
              </span>
            ))}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex-1 text-left">
      {nothingChecked && (
        <div className="flex flex-col items-center justify-center text-center p-3 mb-3 bg-[#f5f0e6] dark:bg-[#201d1a] border border-dashed border-cordel-master-dark/30 rounded">
          <span className="text-xl mb-1">👆</span>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cordel-master-dark">
            {t('pedagogy.cards.cochezPuxadorOuCoroAu') || "Cochez Puxador ou Coro au-dessus pour afficher les paroles"}
          </p>
        </div>
      )}

      <div className={`grid ${hasPhon && showOriginal ? 'grid-cols-2' : 'grid-cols-1'} gap-3 md:gap-6 print:grid-cols-2 print:break-inside-avoid`}>
        {showOriginal && (
          <div className={`flex flex-col ${hasPhon ? 'border-r border-encre-noire/15 pr-3 md:pr-6' : ''}`}>
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 md:py-1.5 px-2 rounded font-heading tracking-widest text-sm md:text-lg border border-encre-noire/10 mb-2 capitalize print:text-sm">
              {t('pedagogy.cards.versionOriginale') || "Version originale"}
            </h3>
            <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire px-1 md:px-2 flex flex-col gap-2">
              {Array.from({ length: maxMeasures }).map((_, idx) => (
                <div key={idx} className="min-h-[1.4em]">
                  {renderMeasureLines(parseMeasureLines(origMeasures[idx]), false)}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasPhon && (
          <div className="flex flex-col">
            <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 md:py-1.5 px-2 rounded font-heading tracking-widest text-sm md:text-lg border border-encre-noire/10 mb-2 capitalize print:text-sm">
              {t('pedagogy.cards.versionPhonetique') || "Version phonétique"}
            </h3>
            <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire/80 px-1 md:px-2 flex flex-col gap-2">
              {Array.from({ length: maxMeasures }).map((_, idx) => (
                <div key={idx} className="min-h-[1.4em]">
                  {renderMeasureLines(parseMeasureLines(phonMeasures[idx]), true)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
