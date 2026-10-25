/**
 * toadaLineEditorHelper.js
 * Utilitaires d'extraction, reconstruction de pastilles et mesures (< 130 lignes).
 */

export const BEAT_1_CLASS = 'bg-[#b91c1c] text-[#f4ecd8] border-red-900 shadow-xs';
export const BEAT_OTHER_CLASS = 'bg-[#334155] text-white border-slate-900 shadow-xs';

export function extractLineSignature(line = '') {
  const m = line.match(/^\[sig:(2\/4|3\/4|4\/4|6\/8|12\/8)\]\s*/i);
  return m ? { lineSignature: m[1], cleanLine: line.slice(m[0].length) } : { lineSignature: null, cleanLine: line };
}

export function computeEffectiveSignatures(lines = [], defaultSig = '4/4') {
  let cur = defaultSig;
  return lines.map((l) => {
    const { lineSignature } = extractLineSignature(l);
    if (lineSignature) cur = lineSignature;
    return cur;
  });
}

export function parseLineToCharAnchors(lineText = '') {
  const { lineSignature, cleanLine: withSigRemoved } = extractLineSignature(lineText);
  const leadingRestMatch = withSigRemoved.match(/^\*?\s*\[([1-9]|1[0-2])\]\s*_\s*/);
  const hasLeadingRest = Boolean(leadingRestMatch);
  const leadingRestBeat = leadingRestMatch ? parseInt(leadingRestMatch[1], 10) : null;
  const withoutRest = withSigRemoved.replace(/^\*?\s*\[\d+\]\s*_\s*/, '');

  const charAnchors = {}, charSignatures = {}, charPuxadorFlags = [];
  let rawCleanChars = '', curIndex = 0, pendingBeat = null, pendingSig = null, inBold = false;
  const parts = withoutRest.split(/(\[(?:(?:sig:)?(?:\d+\/\d+)|\d+)\]|\*)/i);

  for (const part of parts) {
    if (!part) continue;
    if (part === '*') { inBold = !inBold; continue; }
    const sigM = part.match(/^\[(?:sig:)?(2\/4|3\/4|4\/4|5\/4|6\/8|7\/8|9\/8|12\/8)\]$/i);
    if (sigM) { pendingSig = sigM[1]; continue; }
    const beatM = part.match(/^\[(\d+)\]$/);
    if (beatM) { pendingBeat = parseInt(beatM[1], 10); continue; }

    for (let i = 0; i < part.length; i++) {
      if (pendingSig) { charSignatures[curIndex] = pendingSig; pendingSig = null; }
      if (pendingBeat !== null) { charAnchors[curIndex] = pendingBeat; pendingBeat = null; }
      charPuxadorFlags[curIndex] = inBold;
      rawCleanChars += part[i];
      curIndex++;
    }
  }
  const isPuxador = inBold || charPuxadorFlags.some(Boolean) || /\*[^*]+\*/.test(withSigRemoved);
  return { isPuxador, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors, charSignatures, charPuxadorFlags, lineSignature };
}

export function rebuildLineFromCharAnchors(rawCleanChars, anchors, withRest, restBeat, isPuxador, lineSignature = null, charSignatures = {}) {
  let res = withRest ? `[${restBeat || 1}] _ ` : '';
  for (let c = 0; c < rawCleanChars.length; c++) {
    if (charSignatures?.[c]) res += `[${charSignatures[c]}]`;
    if (anchors?.[c]) res += `[${anchors[c]}]`;
    res += rawCleanChars[c];
  }
  if (charSignatures?.[rawCleanChars.length]) res += `[${charSignatures[rawCleanChars.length]}]`;
  if (anchors?.[rawCleanChars.length]) res += `[${anchors[rawCleanChars.length]}]`;
  const trimmed = res.trim();
  const withPuxador = isPuxador ? `*${trimmed.replace(/^\*+|\*+$/g, '')}*` : trimmed.replace(/^\*+|\*+$/g, '');
  return lineSignature ? `[sig:${lineSignature}] ${withPuxador}` : withPuxador;
}

export function computeSongStructure(lines = [], defaultSig = '4/4') {
  let globalCount1 = 0, runningSig = defaultSig;
  const lineDetails = lines.map((line) => {
    const parsed = parseLineToCharAnchors(line);
    if (parsed.lineSignature) runningSig = parsed.lineSignature;
    const charMeasureNums = {}, charEffectiveSigs = {};
    if (parsed.hasLeadingRest && parsed.leadingRestBeat === 1) globalCount1++;
    for (let c = 0; c < parsed.rawCleanChars.length; c++) {
      if (parsed.charSignatures?.[c]) runningSig = parsed.charSignatures[c];
      charEffectiveSigs[c] = runningSig;
      if (parsed.charAnchors?.[c] === 1) { globalCount1++; charMeasureNums[c] = globalCount1; }
    }
    const phraseInfo = computePhraseMeasures(line, parsed);
    return { ...parsed, charMeasureNums, charEffectiveSigs, lineStartSig: runningSig, phraseInfo };
  });
  return { totalMeasures: globalCount1, lineDetails };
}

export function computePhraseMeasures(lineText = '', parsed = null) {
  const p = parsed || parseLineToCharAnchors(lineText);
  const { isPuxador, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors } = p;
  let firstOnePos = hasLeadingRest && leadingRestBeat === 1 ? -1 : null;
  let count1 = hasLeadingRest && leadingRestBeat === 1 ? 1 : 0;
  for (let c = 0; c < rawCleanChars.length; c++) {
    if (charAnchors?.[c] === 1) { if (firstOnePos === null) firstOnePos = c; count1++; }
  }
  let hasAnacrusis = false;
  if (firstOnePos === null) hasAnacrusis = Object.keys(charAnchors || {}).length > 0 || hasLeadingRest;
  else if (firstOnePos > 0) {
    const textBefore = rawCleanChars.slice(0, firstOnePos).trim();
    hasAnacrusis = textBefore.length > 0 || Object.keys(charAnchors || {}).some((k) => parseInt(k, 10) < firstOnePos) || hasLeadingRest;
  }
  const role = isPuxador ? 'Puxador' : 'Coro';
  let badgeLabel = count1 > 0 ? `${role} • ${count1} M${hasAnacrusis ? ' + Ana' : ''}` : (hasAnacrusis ? `${role} • Ana` : role);
  return { isPuxador, measuresCount: count1, hasAnacrusis, badgeLabel };
}

export function isSilenceMeasure(lineText = '') {
  if (!lineText || !lineText.trim()) return false;
  const { cleanLine } = extractLineSignature(lineText);
  return cleanLine.replace(/\[\d+\]/g, '').replace(/[\*_]/g, '').trim().length === 0;
}

export function generateEmptySilenceMeasure(signature = '4/4') {
  const beatsMap = { '2/4': 2, '3/4': 3, '4/4': 4, '6/8': 6, '12/8': 12 };
  const count = beatsMap[signature] || 4, parts = ['[1] _'];
  for (let b = 2; b <= count; b++) parts.push(`[${b}]_`);
  return parts.join(' ');
}

export function countBeat1InLine(line = '') {
  const { cleanLine } = extractLineSignature(line);
  let count = /^\*?\s*\[1\]\s*_\s*/.test(cleanLine) ? 1 : 0;
  const m = cleanLine.replace(/^\*?\s*\[\d+\]\s*_\s*/, '').match(/\[1\]/g);
  return count + (m ? m.length : 0);
}

export function computeLineMeasureNumbers(lines = []) {
  let g = 0;
  return lines.map((l) => {
    const c = countBeat1InLine(l);
    let label = c === 0 ? (g === 0 ? 'Ana.' : '—') : c === 1 ? `M${++g}` : `M${g + 1}–M${(g += c)}`;
    return { label, isSilence: isSilenceMeasure(l) };
  });
}
