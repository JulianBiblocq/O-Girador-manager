/**
 * toadaSimultaneousHelper.js
 * Détection automatique (blocs K >= 2) et bascule manuelle ([sim]/[nosim]) des lignes chantées
 * simultanément par le Puxador et le Coro, avec alignement des numéros de mesures (< 145 lignes).
 */

export function normalizeLineVocalText(rawCleanChars = '') {
  return (rawCleanChars || '').replace(/[*_]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
}

function isPlainRoleItem(item, expectedPuxador) {
  if (!item || item.isPauseBaque || item.isTutti) return false;
  if (expectedPuxador !== undefined && Boolean(item.isPuxador) !== expectedPuxador) return false;
  return normalizeLineVocalText(item.rawCleanChars).length > 0;
}

export function detectSimultaneousLinks(parsedList = []) {
  const n = parsedList.length;
  const simultaneousWithIndex = new Array(n).fill(null);
  const isAutoSimultaneous = new Array(n).fill(false);

  let i = 0;
  while (i < n) {
    const first = parsedList[i];
    if (!isPlainRoleItem(first)) { i++; continue; }
    const roleA = Boolean(first.isPuxador), roleB = !roleA;
    let maxRunA = 0;
    while (i + maxRunA < n && isPlainRoleItem(parsedList[i + maxRunA], roleA)) maxRunA++;
    const maxK = Math.min(maxRunA, Math.floor((n - i) / 2));

    let matchedK = 0;
    for (let k = maxK; k >= 2; k--) {
      let allMatch = true;
      for (let m = 0; m < k; m++) {
        const itemA = parsedList[i + m], itemB = parsedList[i + k + m];
        if (!isPlainRoleItem(itemA, roleA) || !isPlainRoleItem(itemB, roleB)) { allMatch = false; break; }
        if (normalizeLineVocalText(itemA.rawCleanChars) !== normalizeLineVocalText(itemB.rawCleanChars)) {
          allMatch = false; break;
        }
      }
      if (allMatch) { matchedK = k; break; }
    }

    if (matchedK >= 2) {
      for (let m = 0; m < matchedK; m++) {
        const targetIdx = i + m, simIdx = i + matchedK + m;
        isAutoSimultaneous[simIdx] = true;
        if (parsedList[simIdx]?.simDirective !== 'nosim') simultaneousWithIndex[simIdx] = targetIdx;
      }
      i += 2 * matchedK;
    } else {
      i++;
    }
  }

  let s = 1;
  while (s < n) {
    if (parsedList[s]?.simDirective === 'sim' && simultaneousWithIndex[s] === null && !parsedList[s]?.isPauseBaque) {
      let runLen = 0;
      while (s + runLen < n && parsedList[s + runLen]?.simDirective === 'sim' && simultaneousWithIndex[s + runLen] === null && !parsedList[s + runLen]?.isPauseBaque) {
        runLen++;
      }
      for (let m = 0; m < runLen; m++) {
        let target = s >= runLen ? s - runLen + m : Math.max(0, s + m - 1);
        while (simultaneousWithIndex[target] !== null && simultaneousWithIndex[target] >= 0) target = simultaneousWithIndex[target];
        simultaneousWithIndex[s + m] = target;
      }
      s += runLen;
    } else {
      s++;
    }
  }

  return parsedList.map((_, idx) => ({
    isSimultaneous: simultaneousWithIndex[idx] !== null,
    isSimultaneousWithIndex: simultaneousWithIndex[idx],
    isAutoSimultaneous: isAutoSimultaneous[idx],
  }));
}

export function toggleSimultaneousFlagOnLine(lineText = '', currentlySimultaneous = false, isAutoSimultaneous = false, extractSigFn) {
  const { lineSignature, cleanLine } = extractSigFn ? extractSigFn(lineText) : { lineSignature: null, cleanLine: lineText };
  const nextSim = currentlySimultaneous ? (isAutoSimultaneous ? 'nosim' : null) : (isAutoSimultaneous ? null : 'sim');
  return `${lineSignature ? `[sig:${lineSignature}] ` : ''}${nextSim ? `[${nextSim}] ` : ''}${cleanLine}`;
}

export function buildSongStructure(lines = [], defaultSig = '4/4', parseLineFn, computePhraseFn) {
  const parsedList = lines.map((line) => parseLineFn(line));
  const simLinks = detectSimultaneousLinks(parsedList);
  let globalCount1 = 0, runningSig = defaultSig, displayCardCounter = 0;
  const cardStartCount1 = [], cardFirstMeasure = [], cardDisplayNum = [];

  const lineDetails = parsedList.map((parsed, idx) => {
    const { isSimultaneous, isSimultaneousWithIndex, isAutoSimultaneous } = simLinks[idx];
    const targetIdx = isSimultaneous && isSimultaneousWithIndex !== null && isSimultaneousWithIndex >= 0 ? isSimultaneousWithIndex : null;
    if (parsed.lineSignature) runningSig = parsed.lineSignature;
    const phraseInfo = computePhraseFn(lines[idx], parsed), charMeasureNums = {}, charEffectiveSigs = {};
    const startCount1 = targetIdx !== null ? (cardStartCount1[targetIdx] ?? globalCount1) : globalCount1;
    cardStartCount1[idx] = startCount1;
    let localCount1 = startCount1;

    if (parsed.isPauseBaque) {
      if (targetIdx === null) globalCount1 += parsed.pauseMeasures;
      cardDisplayNum[idx] = ++displayCardCounter; cardFirstMeasure[idx] = startCount1 + 1;
      return { ...parsed, charMeasureNums, charEffectiveSigs, lineStartSig: runningSig, phraseInfo, isSimultaneous: false, isSimultaneousWithIndex: null, isAutoSimultaneous: false, displayCardLabel: `#${cardDisplayNum[idx]}`, simultaneousMeasureLabel: null };
    }
    if (parsed.hasLeadingRest && parsed.leadingRestBeat === 1) { localCount1++; charMeasureNums[-1] = localCount1; }
    for (let c = 0; c <= parsed.rawCleanChars.length; c++) {
      if (parsed.charSignatures?.[c]) runningSig = parsed.charSignatures[c];
      charEffectiveSigs[c] = runningSig;
      if (parsed.charAnchors?.[c] === 1) {
        if (phraseInfo.exitBeat1Pos === c) charMeasureNums[c] = localCount1 + 1;
        else { localCount1++; charMeasureNums[c] = localCount1; }
      }
    }
    if (targetIdx === null) {
      globalCount1 = localCount1; cardDisplayNum[idx] = ++displayCardCounter;
      cardFirstMeasure[idx] = localCount1 > startCount1 ? startCount1 + 1 : null;
    } else {
      cardDisplayNum[idx] = cardDisplayNum[targetIdx] || (targetIdx + 1);
      cardFirstMeasure[idx] = cardFirstMeasure[targetIdx] ?? (startCount1 + 1);
    }
    const displayCardLabel = targetIdx !== null ? `#${cardDisplayNum[idx]} bis` : `#${cardDisplayNum[idx]}`;
    const simultaneousMeasureLabel = targetIdx !== null && cardFirstMeasure[idx] ? `M${cardFirstMeasure[idx]}` : null;
    return { ...parsed, charMeasureNums, charEffectiveSigs, lineStartSig: runningSig, phraseInfo, isSimultaneous, isSimultaneousWithIndex: targetIdx, isAutoSimultaneous, displayCardLabel, simultaneousMeasureLabel };
  });
  return { totalMeasures: globalCount1, lineDetails };
}
