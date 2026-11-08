/**
 * vocalPaperToOrganizadorConverter.js
 * Conversion d'un lot multi-photos de l'Atelier Papier du Chant (Séquence Pux/Cor + Patterns P1..Pn)
 * directement en rawTxtCode ([1]..[4], _, *...*, ***...***, [PAUSE kM]) et parolesOriginales (<u> sur chaque syllabe) (< 138 lignes).
 */
import { SCAN_MODELS, getScanApiKey, compressImageForScan } from './toadaManuscriptScannerService';

export function underlineFirstSyllableLetter(syl = '') {
  const chars = Array.from(syl), idx = chars.findIndex((c) => /[\p{L}\p{N}]/u.test(c));
  return idx < 0 ? syl : `${chars.slice(0, idx).join('')}<u>${chars[idx]}</u>${chars.slice(idx + 1).join('')}`;
}

function formatSylCase(raw = '', isFirst = false) {
  const trimmed = String(raw).trim().replace(/-+$/, '').replace(/[’‘]/g, "'");
  if (!trimmed) return '';
  const isAllUpper = trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase();
  const base = isAllUpper ? trimmed.toLowerCase() : trimmed;
  return isFirst ? base.charAt(0).toUpperCase() + base.slice(1) : base;
}

export function convertScannedPatternToOrganizadorLine(block, role = 'puxador', isTutti = false) {
  const beatGroups = [];
  let isFirstSyl = true;
  const mapToSteps = (cells = [], total = 16) => {
    const map = new Map();
    for (const c of cells) if (c && typeof c.stepIndex === 'number') map.set(c.stepIndex, c);
    return Array.from({ length: total }, (_, idx) => map.get(idx) || null);
  };
  const isAttack = (cell) => {
    if (!cell || cell.isTie) return false;
    const s = String(cell.syllable || '').trim();
    return Boolean(s && s !== '───' && s !== '---' && s !== '───►' && s !== '_');
  };

  if (block.hasAnacrusis && Array.isArray(block.anacrusisCells) && block.anacrusisCells.some(isAttack)) {
    const ana = mapToSteps(block.anacrusisCells, 8), firstActiveBeat = ana.slice(0, 4).some(isAttack) ? 0 : 1;
    for (let b = firstActiveBeat; b < 2; b++) beatGroups.push({ beatNum: 3 + b, cells: ana.slice(b * 4, (b + 1) * 4), attacks: [] });
  }
  const totalMainBeats = Math.max(1, Number(block.measuresCount || 1)) * 4, mainArr = mapToSteps(block.mainCells, totalMainBeats * 4);
  for (let bIdx = 0; bIdx < totalMainBeats; bIdx++) {
    beatGroups.push({ beatNum: (bIdx % 4) + 1, cells: mainArr.slice(bIdx * 4, (bIdx + 1) * 4), attacks: [] });
  }
  if (block.hasTailBeat && Array.isArray(block.tailCells) && block.tailCells.some(isAttack)) {
    beatGroups.push({ beatNum: 1, cells: mapToSteps(block.tailCells, 4), attacks: [] });
  }

  const allAttacks = [];
  for (const bg of beatGroups) {
    for (let s = 0; s < bg.cells.length; s++) {
      const c = bg.cells[s];
      if (isAttack(c)) {
        const rawSyl = String(c.syllable).trim(), joinsNextWord = rawSyl.endsWith('-'), cleanSyl = formatSylCase(rawSyl, isFirstSyl);
        isFirstSyl = false;
        const att = { subdiv: s, rawSyl, cleanSyl, joinsNextWord };
        bg.attacks.push(att); allAttacks.push(att);
      }
    }
  }
  if (allAttacks.length > 0) allAttacks[allAttacks.length - 1].joinsNextWord = false;

  let txtOut = '', htmlOut = '';
  for (let g = 0; g < beatGroups.length; g++) {
    const bg = beatGroups[g], nextBg = beatGroups[g + 1];
    if (bg.attacks.length === 0) { txtOut += `[${bg.beatNum}]_ `; continue; }
    txtOut += bg.attacks[0].subdiv === 0 ? `[${bg.beatNum}]` : `[${bg.beatNum}]_ `;
    for (let i = 0; i < bg.attacks.length; i++) {
      const att = bg.attacks[i], nextInBeat = bg.attacks[i + 1];
      txtOut += att.cleanSyl;
      htmlOut += underlineFirstSyllableLetter(att.cleanSyl) + (att.joinsNextWord ? '' : ' ');
      if (nextInBeat) {
        const needsRest = (att.subdiv === 0 && nextInBeat.subdiv === 3) || (bg.attacks.length === 3 && nextInBeat.subdiv - att.subdiv >= 2);
        if (needsRest) txtOut += ' _ ';
        else if (!att.joinsNextWord) txtOut += ' ';
      } else {
        const weldsToNextBeat = att.joinsNextWord && Boolean(nextBg && nextBg.attacks.length > 0 && nextBg.attacks[0].subdiv === 0);
        if (!weldsToNextBeat && g < beatGroups.length - 1) txtOut += ' ';
      }
    }
  }

  const core = txtOut.trim().replace(/\s{2,}/g, ' '), htmlCore = htmlOut.trim().replace(/\s{2,}/g, ' ');
  return {
    rawLine: isTutti ? `***${core}***` : role === 'puxador' ? `*${core}*` : core,
    htmlLine: isTutti ? `<em><strong>${htmlCore}</strong></em>` : role === 'puxador' ? `<strong>${htmlCore}</strong>` : htmlCore,
  };
}

export function convertScannedVocalBatchToOrganizador(scanResult) {
  const patterns = Array.isArray(scanResult?.patterns) ? scanResult.patterns : [];
  const seqCols = Array.isArray(scanResult?.sequenceColumns) ? scanResult.sequenceColumns : [];
  const blockMap = new Map(patterns.map((p) => [String(p.code || '').trim().toUpperCase(), p]));
  const rawLines = [], htmlLines = [];
  const norm = (c) => (!c || ['X', '-', '—', '_'].includes(String(c).trim().toUpperCase()) ? null : String(c).trim().toUpperCase());

  if (seqCols.length > 0) {
    let pauseRun = 0;
    const flushPause = () => { if (pauseRun > 0) { rawLines.push(`[PAUSE ${pauseRun}M]`); pauseRun = 0; } };
    for (const col of seqCols) {
      const pCode = norm(col.puxCode), cCode = norm(col.corCode);
      if (!pCode && !cCode) { pauseRun++; continue; }
      flushPause();
      if (pCode && cCode && pCode === cCode && blockMap.has(pCode)) {
        const r = convertScannedPatternToOrganizadorLine(blockMap.get(pCode), 'puxador', true);
        rawLines.push(r.rawLine); htmlLines.push(r.htmlLine);
      } else {
        if (pCode && blockMap.has(pCode)) { const r = convertScannedPatternToOrganizadorLine(blockMap.get(pCode), 'puxador', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
        if (cCode && blockMap.has(cCode)) { const r = convertScannedPatternToOrganizadorLine(blockMap.get(cCode), 'coro', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
      }
    }
    flushPause();
  } else {
    for (const b of patterns) { const r = convertScannedPatternToOrganizadorLine(b, 'puxador', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
  }
  return { rawTxtCode: rawLines.join('\n'), parolesOriginales: htmlLines.length ? `<p>${htmlLines.join('<br>')}</p>` : '', lines: rawLines };
}

export async function scanVocalPaperMultiPhotos(photoDataUrls = [], options = {}) {
  const apiKey = options.apiKey || getScanApiKey();
  if (!apiKey) return { success: false, error: "Clé d'accès requise pour la lecture optique", needsApiKey: true };
  const refBlock = options.referenceLyrics?.trim()
    ? `\nTEXTE OFFICIEL DE RÉFÉRENCE :\n"""\n${options.referenceLyrics.trim()}\n"""\n« Les paroles officielles de ce chant sont déjà connues ci-dessus. L'écriture manuscrite sur la grille peut être rapide, abrégée ou sans accents. Utilise obligatoirement les mots et syllabes du texte officiel fourni pour identifier chaque syllabe manuscrite, tout en respectant à 100 % les cases de temps/subdivisions où elles sont inscrites sur la grille. »`
    : '';
  const prompt = `Tu es le moteur de lecture optique de l'Atelier Papier du Chant (O Girador). Analyse ces photos (CHANT-SEQ, CHANT-NOTES-1M/2M, CHANT-RYTHME).${refBlock}
Règles: 1) Sur CHANT-SEQ, lis sequenceColumns:[{measureNumber,puxCode,corCode}]. 2) Sur les feuilles Patterns, lis patterns:[{code:"P1",measuresCount,hasAnacrusis,hasTailBeat,rhythmOnlyMode,anacrusisCells:[{stepIndex,syllable,isTie,pitchKey,octaveShift}],mainCells:[...],tailCells:[...]}]. Préserve les tirets "-" de fin de syllabe (ex: "VO-") et les apostrophes d'élision (ex: "E'O", "XE'O"). Réponds UNIQUEMENT en JSON valide.`;
  const parts = [{ text: prompt }];
  for (const rawUrl of photoDataUrls) {
    const comp = await compressImageForScan(rawUrl);
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: comp.replace(/^data:image\/\w+;base64,/, '') } });
  }
  for (const model of SCAN_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: 'application/json', temperature: 0.1 } }),
      });
      if (!res.ok) continue;
      const json = await res.json(), rawText = (json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}').replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)?.[0] || rawText);
      return { success: true, ...convertScannedVocalBatchToOrganizador(parsed), scanResult: parsed };
    } catch {}
  }
  return { success: false, error: 'Échec de la lecture optique multi-pages' };
}