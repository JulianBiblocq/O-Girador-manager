/**
 * toadaUnderlineProjector.js
 * Détection syllabique `<u>`, découpe HTML par colonnes visibles, reprojection Mode Texte et silence `0` (< 145 lignes).
 */

const VOWEL_RE = /[aáàâãeéêèëiíïoóôõuúüAÁÀÂÃEÉÊÈËIÍÏOÓÔÕUÚÜyY]/;
const DIPHTHONG_RE = /^(ão|ões|ãe|ai|au|ei|eu|oi|ou|ui)/i;
const CLUSTER_RE = /^(nh|lh|ch|qu|gu|gn|[bcdfgptv][rl])/i;

export const visibleLength = (str = '') => str.replace(/<\/?u\b[^>]*>/gi, '').length;

export function sliceByVisibleCols(htmlStr = '', startVis = 0, endVis = Infinity) {
  let vis = 0, inU = false, out = '', emittedU = false;
  for (const part of htmlStr.split(/(<\/?u\b[^>]*>)/gi)) {
    if (!part) continue;
    if (/^<u\b[^>]*>$/i.test(part)) { inU = true; continue; }
    if (/^<\/u>$/i.test(part)) { inU = false; if (emittedU) { out += '</u>'; emittedU = false; } continue; }
    for (let i = 0; i < part.length; i++, vis++) {
      if (vis < startVis || vis >= endVis) continue;
      if (inU && !emittedU) { out += '<u>'; emittedU = true; } else if (!inU && emittedU) { out += '</u>'; emittedU = false; }
      out += part[i];
    }
  }
  return emittedU ? `${out}</u>` : out;
}

const isWordVowelAt = (str, i) =>
  VOWEL_RE.test(str[i]) && !(/[uU]/.test(str[i]) && i > 0 && /[qg]/i.test(str[i - 1]) && str[i + 1] && VOWEL_RE.test(str[i + 1]));

export function computeAutoSyllableUnderlineFlags(rawCleanChars = '') {
  const flags = new Array(rawCleanChars.length).fill(false), wordRe = /[\p{L}\p{M}]+/gu;
  let m;
  while ((m = wordRe.exec(rawCleanChars)) !== null) {
    const w = m[0], base = m.index;
    flags[base] = true;
    for (let i = 0; i < w.length; i++) {
      if (!isWordVowelAt(w, i)) continue;
      if (DIPHTHONG_RE.test(w.slice(i, i + 2))) i++;
      let nextV = -1;
      for (let k = i + 1; k < w.length; k++) if (isWordVowelAt(w, k)) { nextV = k; break; }
      if (nextV < 0) break;
      const cLen = nextV - (i + 1);
      flags[base + (cLen <= 0 ? nextV : cLen === 1 || CLUSTER_RE.test(w.slice(i + 1, i + 3)) ? i + 1 : i + 2)] = true;
    }
  }
  return flags;
}

export function reprojectUnderlinesOntoEditedLine(previousLine = '', editedLine = '', parseLineFn) {
  if (!editedLine || /<u\b/i.test(editedLine) || !/<u\b/i.test(previousLine) || typeof parseLineFn !== 'function') return editedLine;
  const prevP = parseLineFn(previousLine), nextP = parseLineFn(editedLine);
  if (!prevP.hasExplicitU || nextP.isPauseBaque || !nextP.rawCleanChars) return editedLine;

  const a = prevP.rawCleanChars, b = nextP.rawCleanChars;
  let pref = 0, suff = 0;
  while (pref < a.length && pref < b.length && a[pref] === b[pref]) pref++;
  while (suff < a.length - pref && suff < b.length - pref && a[a.length - 1 - suff] === b[b.length - 1 - suff]) suff++;

  const autoB = computeAutoSyllableUnderlineFlags(b);
  const nextFlags = Array.from({ length: b.length }, (_, i) =>
    i < pref ? Boolean(prevP.charUnderlineFlags[i]) : i >= b.length - suff ? Boolean(prevP.charUnderlineFlags[a.length - (b.length - i)]) : Boolean(autoB[i])
  );

  const leadM = editedLine.match(/^((?:\[(?:sig:[^\]]+|sim|nosim)\]\s*)*\*{0,3}\s*\[(?:M\d+[•.:\u00b7])?\d+\]\s*(?:0|𝄽|_)\s*)/iu);
  const head = leadM ? leadM[0] : '', body = leadM ? editedLine.slice(head.length) : editedLine;
  let cIdx = 0, inU = false, out = head;
  for (const tok of body.split(/(\[[^\]]+\]|\*{1,3}|<[^>]+>)/g)) {
    if (!tok) continue;
    if (/^(\[[^\]]+\]|\*{1,3}|<[^>]+>)$/.test(tok)) { if (inU) { out += '</u>'; inU = false; } out += tok; continue; }
    for (let k = 0; k < tok.length; k++, cIdx++) {
      const wantU = Boolean(nextFlags[cIdx]);
      if (!wantU && inU) { out += '</u>'; inU = false; } else if (wantU && !inU) { out += '<u>'; inU = true; }
      out += tok[k];
    }
  }
  return inU ? `${out}</u>` : out;
}

export function toggleSilenceAtCharIndex(parsed, cIdx) {
  const { rawCleanChars: chars, charAnchors, charSignatures, charUnderlineFlags, hasLeadingRest, leadingRestBeat } = parsed;
  if (cIdx === -1) return { chars, anchors: { ...charAnchors }, sigs: { ...charSignatures }, uFlags: [...charUnderlineFlags], withRest: !hasLeadingRest, restBeat: !hasLeadingRest ? (leadingRestBeat || 1) : null };
  const ch = chars[cIdx];
  if (ch === '0' || ch === '𝄽') {
    const delLen = chars[cIdx + 1] === ' ' ? 2 : 1, nextChars = chars.slice(0, cIdx) + chars.slice(cIdx + delLen);
    const nextAnchors = {}, nextSigs = {}, nextU = [], keptBeat = charAnchors[cIdx];
    for (let i = 0; i <= chars.length; i++) {
      if (i >= cIdx && i < cIdx + delLen) continue;
      const ni = i < cIdx ? i : i - delLen;
      if (charAnchors[i]) nextAnchors[ni] = charAnchors[i];
      if (charSignatures?.[i]) nextSigs[ni] = charSignatures[i];
      if (i < chars.length) nextU[ni] = Boolean(charUnderlineFlags?.[i]);
    }
    if (keptBeat && cIdx < nextChars.length && !nextAnchors[cIdx]) nextAnchors[cIdx] = keptBeat;
    return { chars: nextChars, anchors: nextAnchors, sigs: nextSigs, uFlags: nextU, withRest: hasLeadingRest, restBeat: leadingRestBeat };
  }
  if (ch === '_' || ch === ' ') {
    return { chars: `${chars.slice(0, cIdx)}0${chars.slice(cIdx + 1)}`, anchors: { ...charAnchors, [cIdx]: charAnchors[cIdx] || 1 }, sigs: { ...charSignatures }, uFlags: [...charUnderlineFlags], withRest: hasLeadingRest, restBeat: leadingRestBeat };
  }
  const ins = '0 ', nextChars = `${chars.slice(0, cIdx)}${ins}${chars.slice(cIdx)}`;
  const nextAnchors = {}, nextSigs = {}, nextU = new Array(nextChars.length).fill(false);
  for (let i = 0; i <= chars.length; i++) {
    const ni = i < cIdx ? i : i + ins.length;
    if (i !== cIdx && charAnchors[i]) nextAnchors[ni] = charAnchors[i];
    if (charSignatures?.[i]) nextSigs[ni] = charSignatures[i];
    if (i < chars.length) nextU[ni] = Boolean(charUnderlineFlags?.[i]);
  }
  nextAnchors[cIdx] = charAnchors[cIdx] || 1;
  return { chars: nextChars, anchors: nextAnchors, sigs: nextSigs, uFlags: nextU, withRest: hasLeadingRest, restBeat: leadingRestBeat };
}
