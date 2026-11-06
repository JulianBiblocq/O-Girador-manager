/**
 * toadaTwoLineConverter.js
 * Conversion bidirectionnelle entre format à crochets ([1] _ [2]...)
 * et format manuscrit sur 2 lignes (chiffres 1..12 surplombant les paroles) (< 140 lignes).
 */

export function isAnchorOnlyLine(line = '') {
  const trimmed = line.trim();
  if (!trimmed || !/^[\d\s_]+$/.test(line)) return false;
  return /\b([1-9]|1[0-2])\b/.test(line);
}

export function convertTwoLineToBrackets(anchorLine = '', lyricsLine = '') {
  const regex = /\b([1-9]|1[0-2])\b/g;
  const matches = [];
  let m;
  while ((m = regex.exec(anchorLine)) !== null) {
    matches.push({ beat: parseInt(m[1], 10), col: m.index });
  }
  if (matches.length === 0) return lyricsLine.trim();

  matches.sort((a, b) => a.col - b.col);
  let result = '';
  if (matches[0].col > 0) {
    const prefix = lyricsLine.slice(0, matches[0].col);
    if (prefix.trim()) result += prefix;
  }

  for (let k = 0; k < matches.length; k++) {
    const cur = matches[k];
    const nextCol = matches[k + 1] ? matches[k + 1].col : lyricsLine.length;
    const slice = lyricsLine.slice(cur.col, nextCol);
    result += !slice.trim() ? `[${cur.beat}] _ ` : `[${cur.beat}]${slice.trimStart()}`;
  }

  return result.trim().replace(/\s{2,}/g, ' ');
}

export function convertBracketsToTwoLine(bracketedLine = '') {
  const regex = /\[(?:M\d+[•·.])?([1-9]|1[0-2])\]/gi;
  const parts = [];
  let lastIndex = 0, m;

  while ((m = regex.exec(bracketedLine)) !== null) {
    const preText = bracketedLine.slice(lastIndex, m.index);
    if (preText) parts.push({ type: 'text', content: preText });
    parts.push({ type: 'anchor', beat: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < bracketedLine.length) {
    parts.push({ type: 'text', content: bracketedLine.slice(lastIndex) });
  }

  let upper = '', lower = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === 'anchor') {
      const nextPart = parts[i + 1], beatStr = String(part.beat);
      if (nextPart && nextPart.type === 'text' && (nextPart.content.trim() === '_' || nextPart.content.trim().startsWith('_'))) {
        const padLen = Math.max(beatStr.length, 3);
        upper += beatStr.padEnd(padLen, ' '); lower += ''.padEnd(padLen, ' ');
        nextPart.content = nextPart.content.replace(/(?:^|\s)_(?=\s|$)/g, '').trimStart();
      } else { upper += beatStr; }
    } else {
      lower += part.content;
      while (upper.length < lower.length) upper += ' ';
    }
  }
  return `${upper.trimEnd()}\n${lower.trimEnd()}`;
}

export function parseStructureTxt(rawText = '') {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/);
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const cur = lines[i], next = lines[i + 1];
    if (isAnchorOnlyLine(cur) && next !== undefined && !isAnchorOnlyLine(next) && next.trim()) {
      result.push(convertTwoLineToBrackets(cur, next));
      i += 2;
      while (i < lines.length && !lines[i].trim()) i++;
    } else {
      const trimmed = cur.trim();
      if (trimmed) {
        const pauseM = trimmed.match(/^(\[sig:(?:2\/4|3\/4|4\/4|6\/8|12\/8)\]\s*)?\*?\s*\[\s*(?:PAUSE|SILENCE)(?:\s+(?:BAQUE|[A-Z]+))?\s+(\d+)\s*M(?:ESURES?)?\s*\]\s*\*?$/i);
        if (pauseM) {
          const sigPrefix = pauseM[1] ? `${pauseM[1].trim()} ` : '';
          const mCount = Math.max(1, Math.min(8, parseInt(pauseM[2], 10) || 1));
          result.push(`${sigPrefix}[PAUSE ${mCount}M]`);
        } else {
          result.push(trimmed);
        }
      }
      i++;
    }
  }
  return result;
}

export function exportStructureAsTxt(lines = [], mode = 'brackets') {
  if (mode === 'two-line') return lines.map((l) => convertBracketsToTwoLine(l)).join('\n\n');
  return lines.join('\n');
}

function wrapByRole(text, role) {
  if (role === 'tutti') return `***${text}***`;
  return role === 'puxador' ? `*${text}*` : text;
}

export function groupLyricsByRole(lyricsText = '') {
  if (!lyricsText || typeof lyricsText !== 'string') return [];
  let text = lyricsText;
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      .replace(/<(?:strong|b)\b[^>]*>\s*<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>\s*<\/(?:strong|b)>/gi, '***$1***')
      .replace(/<(?:em|i)\b[^>]*>\s*<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/(?:em|i)>/gi, '***$1***')
      .replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '*$1*')
      .replace(/<\/(?:p|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(?!\/?u\b)[^>]+>/gi, '');
  }
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()), grouped = [];
  let cur = null;
  for (const line of rawLines) {
    if (!line) {
      if (cur?.words.length) { grouped.push(wrapByRole(cur.words.join(' '), cur.role)); cur = null; }
      continue;
    }
    const isTutti = /^\*{3}[\s\S]+\*{3}$/.test(line);
    const isPux = !isTutti && ((line.startsWith('*') && line.endsWith('*')) || /^\*[^*]+\*$/.test(line));
    const role = isTutti ? 'tutti' : (isPux ? 'puxador' : 'coro');
    const content = line.replace(/^\*+|\*+$/g, '').trim();
    if (!content) continue;
    if (!cur) cur = { role, words: [content] };
    else if (cur.role === role) cur.words.push(content);
    else { grouped.push(wrapByRole(cur.words.join(' '), cur.role)); cur = { role, words: [content] }; }
  }
  if (cur?.words.length) grouped.push(wrapByRole(cur.words.join(' '), cur.role));
  return grouped;
}
