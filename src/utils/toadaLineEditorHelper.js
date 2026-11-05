/**
 * toadaLineEditorHelper.js
 * Utilitaires d'extraction, reconstruction de pastilles, pauses [PAUSE XM], chutes +1T et balises <u> (< 138 lignes).
 */
export const BEAT_1_CLASS = 'bg-[#b91c1c] text-[#f4ecd8] border-red-900 shadow-xs';
export const BEAT_OTHER_CLASS = 'bg-[#334155] text-white border-slate-900 shadow-xs';

export function extractLineSignature(line = '') {
  const m = line.match(/^\[sig:(2\/4|3\/4|4\/4|6\/8|12\/8)\]\s*/i);
  return m ? { lineSignature: m[1], cleanLine: line.slice(m[0].length) } : { lineSignature: null, cleanLine: line };
}

export function parsePauseBaqueLine(lineText = '') {
  const { cleanLine } = extractLineSignature(lineText);
  const m = cleanLine.trim().match(/^\*?\s*\[\s*(?:PAUSE|SILENCE)(?:\s+(?:BAQUE|[A-Z]+))?\s+(\d+)\s*M(?:ESURES?)?\s*\]\s*\*?$/i);
  return m ? { isPauseBaque: true, pauseMeasures: Math.max(1, Math.min(8, parseInt(m[1], 10) || 1)) } : { isPauseBaque: false, pauseMeasures: 0 };
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
  const pauseCheck = parsePauseBaqueLine(withSigRemoved);
  if (pauseCheck.isPauseBaque) {
    return {
      isPuxador: false, isPauseBaque: true, pauseMeasures: pauseCheck.pauseMeasures, hasLeadingRest: false, leadingRestBeat: null,
      rawCleanChars: '', charAnchors: {}, charSignatures: {}, charPuxadorFlags: [], charUnderlineFlags: [], lineSignature,
    };
  }
  const leadingRestMatch = withSigRemoved.match(/^\*?\s*\[(?:M\d+[•\.:\u00b7])?([1-9]|1[0-2])\]\s*_\s*/i);
  const hasLeadingRest = Boolean(leadingRestMatch), leadingRestBeat = leadingRestMatch ? parseInt(leadingRestMatch[1], 10) : null;
  const withoutRest = withSigRemoved.replace(/^\*?\s*\[(?:M\d+[•\.:\u00b7])?\d+\]\s*_\s*/i, '');
  const charAnchors = {}, charSignatures = {}, charPuxadorFlags = [], charUnderlineFlags = [];
  let rawCleanChars = '', curIndex = 0, pendingBeat = null, pendingSig = null, inBold = false, inUnderline = false;
  const parts = withoutRest.split(/(\[(?:(?:sig:)?(?:\d+\/\d+)|(?:M\d+[•\.:\u00b7])?\d+)\]|\*|<\/?u>)/i);

  for (const part of parts) {
    if (!part) continue;
    if (part === '*') { inBold = !inBold; continue; }
    if (/^<u>$/i.test(part)) { inUnderline = true; continue; }
    if (/^<\/u>$/i.test(part)) { inUnderline = false; continue; }
    const sigM = part.match(/^\[(?:sig:)?(2\/4|3\/4|4\/4|5\/4|6\/8|7\/8|9\/8|12\/8)\]$/i);
    if (sigM) { pendingSig = sigM[1]; continue; }
    const beatM = part.match(/^\[(?:M\d+[•\.:\u00b7])?(\d+)\]$/i);
    if (beatM) { pendingBeat = parseInt(beatM[1], 10); continue; }
    for (let i = 0; i < part.length; i++) {
      if (pendingSig) { charSignatures[curIndex] = pendingSig; pendingSig = null; }
      if (pendingBeat !== null) { charAnchors[curIndex] = pendingBeat; pendingBeat = null; }
      charPuxadorFlags[curIndex] = inBold; charUnderlineFlags[curIndex] = inUnderline;
      rawCleanChars += part[i]; curIndex++;
    }
  }
  if (pendingBeat !== null) charAnchors[curIndex] = pendingBeat;
  const isPuxador = inBold || charPuxadorFlags.some(Boolean) || /\*[^*]+\*/.test(withSigRemoved);
  return { isPuxador, isPauseBaque: false, pauseMeasures: 0, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors, charSignatures, charPuxadorFlags, charUnderlineFlags, lineSignature };
}

export function rebuildLineFromCharAnchors(rawCleanChars, anchors, withRest, restBeat, isPuxador, lineSignature = null, charSignatures = {}, charUnderlineFlags = []) {
  let res = withRest ? `[${restBeat || 1}] _ ` : '', inU = false;
  for (let c = 0; c < rawCleanChars.length; c++) {
    const wantU = Boolean(charUnderlineFlags?.[c]);
    if (!wantU && inU) { res += '</u>'; inU = false; }
    if (charSignatures?.[c]) res += `[${charSignatures[c]}]`;
    if (anchors?.[c]) res += `[${anchors[c]}]`;
    if (wantU && !inU) { res += '<u>'; inU = true; }
    res += rawCleanChars[c];
  }
  if (inU) res += '</u>';
  if (charSignatures?.[rawCleanChars.length]) res += `[${charSignatures[rawCleanChars.length]}]`;
  if (anchors?.[rawCleanChars.length]) res += `[${anchors[rawCleanChars.length]}]`;
  const trimmed = res.trim();
  const withPuxador = isPuxador ? `*${trimmed.replace(/^\*+|\*+$/g, '')}*` : trimmed.replace(/^\*+|\*+$/g, '');
  return lineSignature ? `[sig:${lineSignature}] ${withPuxador}` : withPuxador;
}

export function computePhraseMeasures(lineText = '', parsed = null) {
  const p = parsed || parseLineToCharAnchors(lineText);
  if (p.isPauseBaque) {
    return { isPuxador: false, isPauseBaque: true, pauseMeasures: p.pauseMeasures, measuresCount: p.pauseMeasures, hasAnacrusis: false, hasExitOnNextBeat1: false, exitBeat1Pos: null, badgeLabel: `🔇 Pause Baque • ${p.pauseMeasures} M` };
  }
  const { isPuxador, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors } = p;
  const ordered = [];
  if (hasLeadingRest && leadingRestBeat) ordered.push({ pos: -1, beat: leadingRestBeat });
  for (let c = 0; c <= rawCleanChars.length; c++) { if (charAnchors?.[c]) ordered.push({ pos: c, beat: charAnchors[c] }); }

  const beat1s = ordered.filter((a) => a.beat === 1), firstOnePos = beat1s.length > 0 ? beat1s[0].pos : null;
  const lastA = ordered[ordered.length - 1], prevA = ordered[ordered.length - 2];
  const tailSlice = lastA && lastA.pos >= 0 ? rawCleanChars.slice(lastA.pos).replace(/[_\-\s]/g, '') : '';
  const hasExitOnNextBeat1 = Boolean(beat1s.length >= 2 && lastA?.beat === 1 && prevA && prevA.beat > 1 && tailSlice.length <= 5 && !/\s/.test(rawCleanChars.slice(Math.max(0, lastA.pos)).replace(/_/g, '').trim()));
  const exitBeat1Pos = hasExitOnNextBeat1 ? lastA.pos : null, count1 = hasExitOnNextBeat1 ? beat1s.length - 1 : beat1s.length;
  const hasAnacrusis = firstOnePos === null ? (ordered.length > 0 || hasLeadingRest) : (firstOnePos > 0 && (rawCleanChars.slice(0, firstOnePos).trim().length > 0 || ordered.some((a) => a.pos < firstOnePos)));
  const role = isPuxador ? 'Puxador' : 'Coro', anaSuffix = hasAnacrusis ? ' + Ana' : '', exitSuffix = hasExitOnNextBeat1 ? ' + Fin 1' : '';
  const badgeLabel = count1 > 0 ? `${role} • ${count1} M${anaSuffix}${exitSuffix}` : (hasAnacrusis ? `${role} • Ana` : role);
  return { isPuxador, isPauseBaque: false, measuresCount: count1, hasAnacrusis, hasExitOnNextBeat1, exitBeat1Pos, badgeLabel };
}

export function computeSongStructure(lines = [], defaultSig = '4/4') {
  let globalCount1 = 0, runningSig = defaultSig;
  const lineDetails = lines.map((line) => {
    const parsed = parseLineToCharAnchors(line);
    if (parsed.lineSignature) runningSig = parsed.lineSignature;
    const phraseInfo = computePhraseMeasures(line, parsed), charMeasureNums = {}, charEffectiveSigs = {};
    if (parsed.isPauseBaque) { globalCount1 += parsed.pauseMeasures; return { ...parsed, charMeasureNums, charEffectiveSigs, lineStartSig: runningSig, phraseInfo }; }
    if (parsed.hasLeadingRest && parsed.leadingRestBeat === 1) { globalCount1++; charMeasureNums[-1] = globalCount1; }
    for (let c = 0; c <= parsed.rawCleanChars.length; c++) {
      if (parsed.charSignatures?.[c]) runningSig = parsed.charSignatures[c];
      charEffectiveSigs[c] = runningSig;
      if (parsed.charAnchors?.[c] === 1) {
        if (phraseInfo.exitBeat1Pos === c) charMeasureNums[c] = globalCount1 + 1;
        else { globalCount1++; charMeasureNums[c] = globalCount1; }
      }
    }
    return { ...parsed, charMeasureNums, charEffectiveSigs, lineStartSig: runningSig, phraseInfo };
  });
  return { totalMeasures: globalCount1, lineDetails };
}

export function isSilenceMeasure(lineText = '') {
  if (!lineText || !lineText.trim()) return false;
  if (parsePauseBaqueLine(lineText).isPauseBaque) return true;
  const { cleanLine } = extractLineSignature(lineText);
  return cleanLine.replace(/\[(?:M\d+[•\.:\u00b7])?\d+\]/gi, '').replace(/[*_]/g, '').trim().length === 0;
}

export const generateEmptySilenceMeasure = (measures = 1) => `[PAUSE ${Math.max(1, Math.min(8, Number(measures) || 1))}M]`;
export const countBeat1InLine = (line = '') => computePhraseMeasures(line).measuresCount;
export function computeLineMeasureNumbers(lines = []) {
  let g = 0;
  return lines.map((l) => {
    const c = countBeat1InLine(l);
    return { label: c === 0 ? (g === 0 ? 'Ana.' : '—') : c === 1 ? `M${++g}` : `M${g + 1}–M${(g += c)}`, isSilence: isSilenceMeasure(l) };
  });
}
