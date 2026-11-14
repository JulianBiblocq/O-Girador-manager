/**
 * toadaLineEditorHelper.js
 * Extraction, reconstruction de pastilles, silences explicites `0` (`𝄽`), tenues/mélismes `_`,
 * pauses [PAUSE XM], Tutti (***...***), superposition simultanée et soulignement syllabique `<u>` (< 145 lignes).
 */
import { buildSongStructure, toggleSimultaneousFlagOnLine } from './toadaSimultaneousHelper.js';
import { normalizeToadaTextV1ToV2 } from './vocalGrammarV2.js';
import {
  computeAutoSyllableUnderlineFlags,
  reprojectUnderlinesOntoEditedLine,
  toggleSilenceAtCharIndex,
} from './toadaUnderlineProjector.js';

export { computeAutoSyllableUnderlineFlags, toggleSilenceAtCharIndex };
export const BEAT_1_CLASS = 'bg-[#b91c1c] text-[#f4ecd8] border-red-900 shadow-xs';
export const BEAT_OTHER_CLASS = 'bg-[#334155] text-white border-slate-900 shadow-xs';

export function extractLineSignature(line = '') {
  let rest = line, lineSignature = null, simDirective = null;
  for (let i = 0; i < 2; i++) {
    const sigM = rest.match(/^\[sig:(2\/4|3\/4|4\/4|6\/8|12\/8)\]\s*/i);
    if (sigM) { lineSignature = sigM[1]; rest = rest.slice(sigM[0].length); continue; }
    const simM = rest.match(/^\[(sim|nosim)\]\s*/i);
    if (simM) { simDirective = simM[1].toLowerCase(); rest = rest.slice(simM[0].length); continue; }
  }
  return { lineSignature, simDirective, cleanLine: rest };
}

export const toggleLineSimultaneous = (lineText = '', currentlySimultaneous = false, isAutoSimultaneous = false) =>
  toggleSimultaneousFlagOnLine(lineText, currentlySimultaneous, isAutoSimultaneous, extractLineSignature);

export function parsePauseBaqueLine(lineText = '') {
  const { cleanLine } = extractLineSignature(lineText);
  const m = cleanLine.trim().match(/^\*?\s*\[\s*(?:PAUSE|SILENCE)(?:\s+(?:BATUQUE|BAQUE|[A-Z]+))?\s+(\d+)\s*M(?:ESURES?)?\s*\]\s*\*?$/i);
  return m ? { isPauseBaque: true, pauseMeasures: Math.max(1, Math.min(8, parseInt(m[1], 10) || 1)) } : { isPauseBaque: false, pauseMeasures: 0 };
}

export function computeEffectiveSignatures(lines = [], defaultSig = '4/4') {
  let cur = defaultSig;
  return lines.map((l) => { const { lineSignature } = extractLineSignature(l); if (lineSignature) cur = lineSignature; return cur; });
}

export function parseLineToCharAnchors(lineText = '', options = {}) {
  const normalizedInput = normalizeToadaTextV1ToV2(lineText || '', { grammarVersion: options.grammarVersion ?? 1 });
  const { lineSignature, simDirective, cleanLine: withSigRemoved } = extractLineSignature(normalizedInput);
  const pauseCheck = parsePauseBaqueLine(withSigRemoved);
  if (pauseCheck.isPauseBaque) {
    return { isPuxador: false, isTutti: false, isPauseBaque: true, pauseMeasures: pauseCheck.pauseMeasures, hasLeadingRest: false, leadingRestBeat: null, rawCleanChars: '', charAnchors: {}, charSignatures: {}, charPuxadorFlags: [], charUnderlineFlags: [], charRestFlags: [], charHoldFlags: [], anchorsMeta: [], lineSignature, simDirective };
  }
  const isTutti = /\*{3}[^*]+\*{3}/.test(withSigRemoved) || (/^\*{3}/.test(withSigRemoved.trim()) && /\*{3}$/.test(withSigRemoved.trim()));
  const leadingRestMatch = withSigRemoved.match(/^\*{0,3}\s*\[(?:M\d+[•.:\u00b7])?([1-9]|1[0-2])\]\s*(?:0|𝄽)\s*/iu);
  const hasLeadingRest = Boolean(leadingRestMatch), leadingRestBeat = leadingRestMatch ? parseInt(leadingRestMatch[1], 10) : null;
  const withoutRest = withSigRemoved.replace(/^\*{0,3}\s*\[(?:M\d+[•.:\u00b7])?\d+\]\s*(?:0|𝄽)\s*/iu, '').replace(/<(?!\/?u\b)[^>]+>/gi, '');
  const charAnchors = {}, charSignatures = {}, charPuxadorFlags = [], charUnderlineFlags = [], charRestFlags = [], charHoldFlags = [];
  let rawCleanChars = '', curIndex = 0, pendingBeat = null, pendingSig = null, inBold = isTutti, inUnderline = false, hasExplicitU = false;
  const parts = withoutRest.split(/(\[(?:(?:sig:)?(?:\d+\/\d+)|(?:M\d+[•.:\u00b7])?\d+)\]|\*{1,3}|<\/?u\b[^>]*>)/i);

  for (const part of parts) {
    if (!part) continue;
    if (/^\*{1,3}$/.test(part)) { inBold = !inBold; continue; }
    if (/^<u\b[^>]*>$/i.test(part)) { inUnderline = true; hasExplicitU = true; continue; }
    if (/^<\/u>$/i.test(part)) { inUnderline = false; continue; }
    const sigM = part.match(/^\[(?:sig:)?(2\/4|3\/4|4\/4|5\/4|6\/8|7\/8|9\/8|12\/8)\]$/i);
    if (sigM) { pendingSig = sigM[1]; continue; }
    const beatM = part.match(/^\[(?:M\d+[•.:\u00b7])?(\d+)\]$/i);
    if (beatM) { pendingBeat = parseInt(beatM[1], 10); continue; }
    for (let i = 0; i < part.length; i++) {
      if (pendingSig) { charSignatures[curIndex] = pendingSig; pendingSig = null; }
      if (pendingBeat !== null) { charAnchors[curIndex] = pendingBeat; pendingBeat = null; }
      charPuxadorFlags[curIndex] = isTutti || inBold;
      charUnderlineFlags[curIndex] = inUnderline;
      rawCleanChars += part[i];
      curIndex++;
    }
  }
  if (pendingBeat !== null) charAnchors[curIndex] = pendingBeat;
  for (let i = 0; i < rawCleanChars.length; i++) {
    const ch = rawCleanChars[i], prev = rawCleanChars[i - 1] || '', next = rawCleanChars[i + 1] || '';
    charRestFlags[i] = ch === '𝄽' || (ch === '0' && !/[\p{L}\d]/u.test(prev) && !/[\p{L}\d]/u.test(next));
    charHoldFlags[i] = ch === '_';
  }
  const anchorsMeta = [];
  if (hasLeadingRest && leadingRestBeat) anchorsMeta.push({ pos: -1, beat: leadingRestBeat, isRest: true, isSustainedHold: false });
  for (let c = 0; c <= rawCleanChars.length; c++) {
    if (charAnchors[c]) anchorsMeta.push({ pos: c, beat: charAnchors[c], isRest: Boolean(charRestFlags[c]), isSustainedHold: Boolean(charHoldFlags[c]) });
  }
  const finalUnderlineFlags = hasExplicitU ? charUnderlineFlags : computeAutoSyllableUnderlineFlags(rawCleanChars);
  const isPuxador = isTutti || inBold || charPuxadorFlags.some(Boolean) || /\*[^*]+\*/.test(withSigRemoved);
  return { isPuxador, isTutti, isPauseBaque: false, pauseMeasures: 0, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors, charSignatures, charPuxadorFlags, charUnderlineFlags: finalUnderlineFlags, charRestFlags, charHoldFlags, anchorsMeta, hasExplicitU, lineSignature, simDirective };
}

export const preserveUnderlinesInTextEdit = (prevLine = '', nextLine = '') =>
  reprojectUnderlinesOntoEditedLine(prevLine, nextLine, parseLineToCharAnchors);

export function rebuildLineFromCharAnchors(rawCleanChars, anchors, withRest, restBeat, isPuxador, lineSignature = null, charSignatures = {}, charUnderlineFlags = [], isTutti = false, simDirective = null) {
  let res = withRest ? `[${restBeat || 1}] 0 ` : '', inU = false;
  for (let c = 0; c < rawCleanChars.length; c++) {
    const wantU = Boolean(charUnderlineFlags?.[c]);
    if (!wantU && inU) { res += '</u>'; inU = false; }
    if (charSignatures?.[c]) res += `[sig:${charSignatures[c]}]`;
    if (anchors?.[c]) res += `[${anchors[c]}]`;
    if (wantU && !inU) { res += '<u>'; inU = true; }
    res += rawCleanChars[c];
  }
  if (inU) res += '</u>';
  if (charSignatures?.[rawCleanChars.length]) res += `[sig:${charSignatures[rawCleanChars.length]}]`;
  if (anchors?.[rawCleanChars.length]) res += `[${anchors[rawCleanChars.length]}]`;
  const cleanCore = res.trim().replace(/^\*+|\*+$/g, '');
  const withRole = isTutti ? `***${cleanCore}***` : (isPuxador ? `*${cleanCore}*` : cleanCore);
  return `${lineSignature ? `[sig:${lineSignature}] ` : ''}${simDirective ? `[${simDirective}] ` : ''}${withRole}`;
}

export function computePhraseMeasures(lineText = '', parsed = null) {
  const p = parsed || parseLineToCharAnchors(lineText);
  if (p.isPauseBaque) return { isPuxador: false, isTutti: false, isPauseBaque: true, pauseMeasures: p.pauseMeasures, measuresCount: p.pauseMeasures, hasAnacrusis: false, hasExitOnNextBeat1: false, exitBeat1Pos: null, badgeLabel: `🔇 Pause Batuque • ${p.pauseMeasures} M` };
  const { isPuxador, isTutti, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors } = p, ordered = [];
  if (hasLeadingRest && leadingRestBeat) ordered.push({ pos: -1, beat: leadingRestBeat });
  for (let c = 0; c <= rawCleanChars.length; c++) { if (charAnchors?.[c]) ordered.push({ pos: c, beat: charAnchors[c] }); }
  const beat1s = ordered.filter((a) => a.beat === 1), firstOnePos = beat1s.length > 0 ? beat1s[0].pos : null;
  const lastA = ordered[ordered.length - 1], prevA = ordered[ordered.length - 2];
  const tailSlice = lastA && lastA.pos >= 0 ? rawCleanChars.slice(lastA.pos).replace(/[0𝄽_\-\s]/gu, '') : '';
  const hasExitOnNextBeat1 = Boolean(beat1s.length >= 2 && lastA?.beat === 1 && prevA && prevA.beat > 1 && tailSlice.length <= 5 && !/\s/.test(rawCleanChars.slice(Math.max(0, lastA.pos)).replace(/[0𝄽_]/gu, '').trim()));
  const exitBeat1Pos = hasExitOnNextBeat1 ? lastA.pos : null, count1 = hasExitOnNextBeat1 ? beat1s.length - 1 : beat1s.length;
  const hasAnacrusis = firstOnePos === null ? (ordered.length > 0 || hasLeadingRest) : (firstOnePos > 0 && (rawCleanChars.slice(0, firstOnePos).trim().length > 0 || ordered.some((a) => a.pos < firstOnePos)));
  const role = isTutti ? '👥 Pux+Coro' : (isPuxador ? 'Puxador' : 'Coro'), anaSuffix = hasAnacrusis ? ' + Ana' : '', exitSuffix = hasExitOnNextBeat1 ? ' + Fin 1' : '';
  const badgeLabel = count1 > 0 ? `${role} • ${count1} M${anaSuffix}${exitSuffix}` : (hasAnacrusis ? `${role} • Ana` : role);
  return { isPuxador, isTutti: Boolean(isTutti), isPauseBaque: false, measuresCount: count1, hasAnacrusis, hasExitOnNextBeat1, exitBeat1Pos, badgeLabel };
}

export const computeSongStructure = (lines = [], defaultSig = '4/4') => buildSongStructure(lines, defaultSig, parseLineToCharAnchors, computePhraseMeasures);
export const isSilenceMeasure = (l = '') => Boolean(l?.trim()) && (parsePauseBaqueLine(l).isPauseBaque || extractLineSignature(l).cleanLine.replace(/\[(?:M\d+[•.:\u00b7])?\d+\]/gi, '').replace(/[*_0𝄽]/gu, '').trim().length === 0);
export const generateEmptySilenceMeasure = (measures = 1) => `[PAUSE ${Math.max(1, Math.min(8, Number(measures) || 1))}M]`;
export const countBeat1InLine = (line = '') => computePhraseMeasures(line).measuresCount;
export const computeLineMeasureNumbers = (lines = []) => computeSongStructure(lines).lineDetails.map((d) => ({ label: d.phraseInfo.measuresCount === 0 ? 'Ana.' : `M${Object.values(d.charMeasureNums)[0] || 1}`, isSilence: d.isPauseBaque }));
