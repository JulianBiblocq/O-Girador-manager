/**
 * toadaLineEditorHelper.js
 * Utilitaires d'extraction, reconstruction de pastilles, pauses [PAUSE XM], Tutti (***...***),
 * superposition simultanée Puxador/Coro (#N bis) et soulignement 1re lettre de syllabe <u> (< 145 lignes).
 */
import { buildSongStructure, toggleSimultaneousFlagOnLine } from './toadaSimultaneousHelper.js';

export const BEAT_1_CLASS = 'bg-[#b91c1c] text-[#f4ecd8] border-red-900 shadow-xs';
export const BEAT_OTHER_CLASS = 'bg-[#334155] text-white border-slate-900 shadow-xs';

const VOWEL_RE = /[aáàâãeéêèëiíïoóôõuúüAÁÀÂÃEÉÊÈËIÍÏOÓÔÕUÚÜyY]/;
const DIPHTHONG_RE = /^(ão|ões|ãe|ai|au|ei|eu|oi|ou|ui)/i;
const CLUSTER_RE = /^(nh|lh|ch|qu|gu|gn|[bcdfgptv][rl])/i;

function isWordVowelAt(str, i) {
  const ch = str[i];
  if (!VOWEL_RE.test(ch)) return false;
  if ((ch === 'u' || ch === 'U') && i > 0 && /[qg]/i.test(str[i - 1]) && str[i + 1] && VOWEL_RE.test(str[i + 1])) return false;
  return true;
}

export function computeAutoSyllableUnderlineFlags(rawCleanChars = '') {
  const flags = new Array(rawCleanChars.length).fill(false);
  const wordRe = /[\p{L}\p{M}]+/gu;
  let m;
  while ((m = wordRe.exec(rawCleanChars)) !== null) {
    const w = m[0], base = m.index;
    flags[base] = true;
    for (let i = 0; i < w.length; i++) {
      if (!isWordVowelAt(w, i)) continue;
      if (DIPHTHONG_RE.test(w.slice(i, i + 2))) i++;
      let nextV = -1;
      for (let k = i + 1; k < w.length; k++) { if (isWordVowelAt(w, k)) { nextV = k; break; } }
      if (nextV < 0) break;
      const cLen = nextV - (i + 1);
      if (cLen <= 0) flags[base + nextV] = true;
      else if (cLen === 1) flags[base + i + 1] = true;
      else flags[base + (CLUSTER_RE.test(w.slice(i + 1, i + 3)) ? i + 1 : i + 2)] = true;
    }
  }
  return flags;
}

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

export function toggleLineSimultaneous(lineText = '', currentlySimultaneous = false, isAutoSimultaneous = false) {
  return toggleSimultaneousFlagOnLine(lineText, currentlySimultaneous, isAutoSimultaneous, extractLineSignature);
}

export function parsePauseBaqueLine(lineText = '') {
  const { cleanLine } = extractLineSignature(lineText);
  const m = cleanLine.trim().match(/^\*?\s*\[\s*(?:PAUSE|SILENCE)(?:\s+(?:BATUQUE|BAQUE|[A-Z]+))?\s+(\d+)\s*M(?:ESURES?)?\s*\]\s*\*?$/i);
  return m ? { isPauseBaque: true, pauseMeasures: Math.max(1, Math.min(8, parseInt(m[1], 10) || 1)) } : { isPauseBaque: false, pauseMeasures: 0 };
}

export function computeEffectiveSignatures(lines = [], defaultSig = '4/4') {
  let cur = defaultSig;
  return lines.map((l) => { const { lineSignature } = extractLineSignature(l); if (lineSignature) cur = lineSignature; return cur; });
}

export function parseLineToCharAnchors(lineText = '') {
  const { lineSignature, simDirective, cleanLine: withSigRemoved } = extractLineSignature(lineText);
  const pauseCheck = parsePauseBaqueLine(withSigRemoved);
  if (pauseCheck.isPauseBaque) {
    return { isPuxador: false, isTutti: false, isPauseBaque: true, pauseMeasures: pauseCheck.pauseMeasures, hasLeadingRest: false, leadingRestBeat: null, rawCleanChars: '', charAnchors: {}, charSignatures: {}, charPuxadorFlags: [], charUnderlineFlags: [], lineSignature, simDirective };
  }
  const isTutti = /\*{3}[^*]+\*{3}/.test(withSigRemoved) || (/^\*{3}/.test(withSigRemoved.trim()) && /\*{3}$/.test(withSigRemoved.trim()));
  const leadingRestMatch = withSigRemoved.match(/^\*{0,3}\s*\[(?:M\d+[•\.:\u00b7])?([1-9]|1[0-2])\]\s*_\s*/i);
  const hasLeadingRest = Boolean(leadingRestMatch), leadingRestBeat = leadingRestMatch ? parseInt(leadingRestMatch[1], 10) : null;
  const withoutRest = withSigRemoved.replace(/^\*{0,3}\s*\[(?:M\d+[•\.:\u00b7])?\d+\]\s*_\s*/i, '').replace(/<(?!\/?u\b)[^>]+>/gi, '');
  const charAnchors = {}, charSignatures = {}, charPuxadorFlags = [], charUnderlineFlags = [];
  let rawCleanChars = '', curIndex = 0, pendingBeat = null, pendingSig = null, inBold = isTutti, inUnderline = false, hasExplicitU = false;
  const parts = withoutRest.split(/(\[(?:(?:sig:)?(?:\d+\/\d+)|(?:M\d+[•\.:\u00b7])?\d+)\]|\*{1,3}|<\/?u\b[^>]*>)/i);

  for (const part of parts) {
    if (!part) continue;
    if (/^\*{1,3}$/.test(part)) { inBold = !inBold; continue; }
    if (/^<u\b[^>]*>$/i.test(part)) { inUnderline = true; hasExplicitU = true; continue; }
    if (/^<\/u>$/i.test(part)) { inUnderline = false; continue; }
    const sigM = part.match(/^\[(?:sig:)?(2\/4|3\/4|4\/4|5\/4|6\/8|7\/8|9\/8|12\/8)\]$/i);
    if (sigM) { pendingSig = sigM[1]; continue; }
    const beatM = part.match(/^\[(?:M\d+[•\.:\u00b7])?(\d+)\]$/i);
    if (beatM) { pendingBeat = parseInt(beatM[1], 10); continue; }
    for (let i = 0; i < part.length; i++) {
      if (pendingSig) { charSignatures[curIndex] = pendingSig; pendingSig = null; }
      if (pendingBeat !== null) { charAnchors[curIndex] = pendingBeat; pendingBeat = null; }
      charPuxadorFlags[curIndex] = isTutti || inBold; charUnderlineFlags[curIndex] = inUnderline;
      rawCleanChars += part[i]; curIndex++;
    }
  }
  if (pendingBeat !== null) charAnchors[curIndex] = pendingBeat;
  const finalUnderlineFlags = hasExplicitU ? charUnderlineFlags : computeAutoSyllableUnderlineFlags(rawCleanChars);
  const isPuxador = isTutti || inBold || charPuxadorFlags.some(Boolean) || /\*[^*]+\*/.test(withSigRemoved);
  return { isPuxador, isTutti, isPauseBaque: false, pauseMeasures: 0, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors, charSignatures, charPuxadorFlags, charUnderlineFlags: finalUnderlineFlags, hasExplicitU, lineSignature, simDirective };
}

export function rebuildLineFromCharAnchors(rawCleanChars, anchors, withRest, restBeat, isPuxador, lineSignature = null, charSignatures = {}, charUnderlineFlags = [], isTutti = false, simDirective = null) {
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
  const tailSlice = lastA && lastA.pos >= 0 ? rawCleanChars.slice(lastA.pos).replace(/[_\-\s]/g, '') : '';
  const hasExitOnNextBeat1 = Boolean(beat1s.length >= 2 && lastA?.beat === 1 && prevA && prevA.beat > 1 && tailSlice.length <= 5 && !/\s/.test(rawCleanChars.slice(Math.max(0, lastA.pos)).replace(/_/g, '').trim()));
  const exitBeat1Pos = hasExitOnNextBeat1 ? lastA.pos : null, count1 = hasExitOnNextBeat1 ? beat1s.length - 1 : beat1s.length;
  const hasAnacrusis = firstOnePos === null ? (ordered.length > 0 || hasLeadingRest) : (firstOnePos > 0 && (rawCleanChars.slice(0, firstOnePos).trim().length > 0 || ordered.some((a) => a.pos < firstOnePos)));
  const role = isTutti ? '👥 Pux+Coro' : (isPuxador ? 'Puxador' : 'Coro'), anaSuffix = hasAnacrusis ? ' + Ana' : '', exitSuffix = hasExitOnNextBeat1 ? ' + Fin 1' : '';
  const badgeLabel = count1 > 0 ? `${role} • ${count1} M${anaSuffix}${exitSuffix}` : (hasAnacrusis ? `${role} • Ana` : role);
  return { isPuxador, isTutti: Boolean(isTutti), isPauseBaque: false, measuresCount: count1, hasAnacrusis, hasExitOnNextBeat1, exitBeat1Pos, badgeLabel };
}

export const computeSongStructure = (lines = [], defaultSig = '4/4') => buildSongStructure(lines, defaultSig, parseLineToCharAnchors, computePhraseMeasures);
export const isSilenceMeasure = (l = '') => Boolean(l?.trim()) && (parsePauseBaqueLine(l).isPauseBaque || extractLineSignature(l).cleanLine.replace(/\[(?:M\d+[•\.:\u00b7])?\d+\]/gi, '').replace(/[*_]/g, '').trim().length === 0);
export const generateEmptySilenceMeasure = (measures = 1) => `[PAUSE ${Math.max(1, Math.min(8, Number(measures) || 1))}M]`;
export const countBeat1InLine = (line = '') => computePhraseMeasures(line).measuresCount;
export const computeLineMeasureNumbers = (lines = []) => computeSongStructure(lines).lineDetails.map((d) => ({ label: d.phraseInfo.measuresCount === 0 ? 'Ana.' : `M${Object.values(d.charMeasureNums)[0] || 1}`, isSilence: d.isPauseBaque }));
