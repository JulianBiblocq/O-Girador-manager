// Utilitaires purs d'assainissement, découpage en strophes et arbitrage colonnes des paroles Toada (< 130 lignes).
import { parseLyricsString } from './lyricsParser.js';

const CHORD_STRIP_REGEX = /\[[A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*\]/g;
const SECTION_STRIP_REGEX = /^\s*\[(?!(?:[A-G][b#]?))[^\]]+\]\s*$/i;

function stripInlineTags(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<\/?u\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function cleanVaralLyrics(text) {
  if (typeof text !== 'string') return text ? String(text) : '';
  return text
    .replace(/\[\d+\]/g, '')
    .replace(/\[M\d+[•.]\d+\]/gi, '')
    .replace(/\[sig:[^\]]+\]/gi, '')
    .replace(/───+/g, '')
    .replace(/_/g, '');
}

export function normalizeToLineArray(content) {
  if (!content) return [];
  if (Array.isArray(content)) return content.flatMap((c) => normalizeToLineArray(c));
  if (typeof content === 'object') {
    if (Array.isArray(content.lines)) return content.lines.flatMap((c) => normalizeToLineArray(c));
    if (typeof content.text === 'string' && !content.puxador && !content.coro && !content.segments) {
      return normalizeToLineArray(content.text);
    }
    return [content];
  }
  if (typeof content !== 'string') return [String(content)];

  const cleaned = cleanVaralLyrics(content);
  if (/<[a-z][\s\S]*>/i.test(cleaned)) {
    const parsed = parseLyricsString(cleaned);
    if (Array.isArray(parsed)) return parsed.flatMap((c) => normalizeToLineArray(c));
    const clean = cleaned
      .replace(/<p\b[^>]*>\s*(?:<br\b[^>]*>|&nbsp;|\s)*<\/p>/gi, '\n\n')
      .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return clean.split(/\r?\n/).map((l) => l.trim());
  }
  return cleaned.split(/\r?\n/).map((l) => l.trim());
}

export function parseLineSegments(line) {
  if (!line) return [];
  if (typeof line !== 'string') {
    if (line.segments && Array.isArray(line.segments)) {
      return line.segments.map((seg) => ({
        text: stripInlineTags(typeof seg.text === 'string' ? cleanVaralLyrics(seg.text) : (seg.text || '')),
        isBold: Boolean(seg.isBold)
      })).filter((s) => s.text.length > 0);
    }
    if (line.puxador && (line.coro || line.choeur)) {
      return [
        { text: stripInlineTags(cleanVaralLyrics(line.puxador)), isBold: true },
        { text: ' ' + stripInlineTags(cleanVaralLyrics(line.coro || line.choeur)), isBold: false }
      ];
    }
    if (line.puxador) return [{ text: stripInlineTags(cleanVaralLyrics(line.puxador)), isBold: true }];
    if (line.coro || line.choeur) return [{ text: stripInlineTags(cleanVaralLyrics(line.coro || line.choeur)), isBold: false }];
    if (line.text) return [{ text: stripInlineTags(cleanVaralLyrics(line.text)), isBold: Boolean(line.isBold) }];
    return [];
  }
  if (SECTION_STRIP_REGEX.test(line)) return [];
  const clean = stripInlineTags(line)
    .replace(/^\s*[+/]\s*/, '')
    .replace(CHORD_STRIP_REGEX, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[M\d+[•.]\d+\]/gi, '')
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

// Étanchéité stricte : lit exclusivement parolesOriginales / paroles (jamais rawTxtCode)
export function extractCleanSongLyrics(song) {
  return {
    origLines: normalizeToLineArray(song?.parolesOriginales || song?.paroles || ''),
    phonLines: normalizeToLineArray(song?.parolesPhonetiques || '')
  };
}

export function buildLyricsStanzas(lines) {
  const stanzas = [];
  let current = [];
  for (const rawLine of lines || []) {
    const segs = parseLineSegments(rawLine);
    if (segs.length === 0) {
      if (current.length > 0) { stanzas.push(current); current = []; }
    } else {
      current.push(segs);
    }
  }
  if (current.length > 0) stanzas.push(current);
  return stanzas;
}

export function countNonEmptyLyricsLines(lines) {
  return buildLyricsStanzas(lines).reduce((acc, stanza) => acc + stanza.length, 0);
}

export function resolveLyricsColumnsMode({ mode = 'auto', nonEmptyLineCount = 0, hasBottomSections = false }) {
  if (mode === 'single-centered') return 'single-centered';
  if (mode === 'two-columns') return 'two-columns';
  return nonEmptyLineCount > 12 && hasBottomSections ? 'two-columns' : 'single-centered';
}
