/**
 * vocalPaperToOrganizadorConverter.js
 * Conversion d'un lot multi-photos de l'Atelier Papier du Chant (Séquence Pux/Cor + Grille universelle 8 temps libres P1..Pn)
 * directement en rawTxtCode ([1]..[4], _, *...*, ***...***, [PAUSE kM]) et parolesOriginales (<u> sur chaque syllabe) (< 130 lignes).
 */
import { SCAN_MODELS, getScanApiKey, compressImageForScan } from './toadaManuscriptScannerService';

export function underlineFirstSyllableLetter(syl = '') {
  const chars = Array.from(syl), idx = chars.findIndex((c) => /[\p{L}\p{N}]/u.test(c));
  return idx < 0 ? syl : `${chars.slice(0, idx).join('')}<u>${chars[idx]}</u>${chars.slice(idx + 1).join('')}`;
}

function formatSylCase(raw = '', isFirst = false) {
  const t = String(raw).trim().replace(/-+$/, '').replace(/[’‘]/g, "'");
  if (!t) return '';
  const b = (t === t.toUpperCase() && t !== t.toLowerCase()) ? t.toLowerCase() : t;
  return isFirst ? b.charAt(0).toUpperCase() + b.slice(1) : b;
}

const isCellActive = (c) => Boolean(c && (c.isTie || (c.pitchKey && String(c.pitchKey).trim()) || (c.durationSteps && c.durationSteps > 0) || (c.syllable && String(c.syllable).trim() && String(c.syllable).trim() !== '_')));

function normalizeAndMergeBlocks(blocks = []) {
  const merged = new Map();
  for (const raw of blocks) {
    let b = raw;
    if (Array.isArray(raw?.beatNumbers) || Array.isArray(raw?.cells)) {
      const digits = Array.from({ length: 8 }, (_, i) => { const m = String(raw.beatNumbers?.[i] ?? '').match(/[1-4]/); return m ? Number(m[0]) : null; });
      const anc = digits.findIndex((v) => v !== null), beats = anc < 0 ? [1, 2, 3, 4, 1, 2, 3, 4] : digits.map((ex, c) => ex ?? ((((digits[anc] - 1) + (c - anc)) % 4 + 4) % 4 + 1));
      const map = new Map((raw.cells || raw.mainCells || []).filter((c) => c && typeof c.stepIndex === 'number').map((c) => [c.stepIndex, { ...c }]));
      const hasAct = (col) => [0, 1, 2, 3].some((s) => isCellActive(map.get(col * 4 + s)));
      const startB = Math.max(0, beats.indexOf(1)), anacrusisCells = [], mainCells = [], tailCells = [];
      for (let col = 0; col < startB; col++) for (let s = 0; s < 4; s++) if (map.has(col * 4 + s)) anacrusisCells.push({ ...map.get(col * 4 + s), stepIndex: (beats[col] - 1) * 4 + s });
      const second234 = startB === 0 && [5, 6, 7].some((col) => hasAct(col) || (digits[col] !== null && digits[col] >= 2)), measuresCount = second234 ? 2 : 1;
      for (let off = 0; off < measuresCount * 4 && startB + off < 8; off++) for (let s = 0; s < 4; s++) if (map.has((startB + off) * 4 + s)) mainCells.push({ ...map.get((startB + off) * 4 + s), stepIndex: off * 4 + s });
      const tailCol = startB === 0 ? (!second234 && hasAct(4) ? 4 : -1) : (startB + 4 < 8 && beats[startB + 4] === 1 && hasAct(startB + 4) ? startB + 4 : -1);
      if (tailCol >= 0) for (let s = 0; s < 4; s++) if (map.has(tailCol * 4 + s)) tailCells.push({ ...map.get(tailCol * 4 + s), stepIndex: s });
      b = { ...raw, measuresCount, anacrusisCells, mainCells, tailCells, _anaSteps: 16 };
    }
    const key = String(b.code || 'P1').trim().toUpperCase();
    if (!merged.has(key)) merged.set(key, { ...b, code: key });
    else {
      const prev = merged.get(key), off = (prev.measuresCount || 1) * 16;
      prev.mainCells = [...(prev.mainCells || []), ...(b.mainCells || []).map((c) => ({ ...c, stepIndex: c.stepIndex + off }))];
      prev.measuresCount = Math.min(4, (prev.measuresCount || 1) + (b.measuresCount || 1));
      if (Array.isArray(b.tailCells) && b.tailCells.length > 0) prev.tailCells = b.tailCells;
    }
  }
  return Array.from(merged.values());
}

export function convertScannedPatternToOrganizadorLine(block, role = 'puxador', isTutti = false) {
  const beatGroups = [], allAttacks = [];
  let isFirstSyl = true;
  const mapToSteps = (cells = [], total = 16) => {
    const map = new Map();
    for (const c of cells) if (c && typeof c.stepIndex === 'number') map.set(c.stepIndex, c);
    return Array.from({ length: total }, (_, idx) => map.get(idx) || null);
  };
  const isAttack = (cell) => Boolean(cell && !cell.isTie && !['', '───', '---', '───►', '_'].includes(String(cell.syllable || '').trim()));

  if (Array.isArray(block.anacrusisCells) && block.anacrusisCells.some(isAttack)) {
    const maxIdx = block.anacrusisCells.reduce((m, c) => Math.max(m, c?.stepIndex ?? 0), 0);
    const anaLen = block._anaSteps || (maxIdx >= 8 ? 16 : 8), anaBeats = anaLen / 4, ana = mapToSteps(block.anacrusisCells, anaLen);
    let firstB = 0;
    for (let b = 0; b < anaBeats; b++) if (ana.slice(b * 4, (b + 1) * 4).some(isAttack)) { firstB = b; break; }
    for (let b = firstB; b < anaBeats; b++) beatGroups.push({ beatNum: (4 - anaBeats) + b + 1, cells: ana.slice(b * 4, (b + 1) * 4), attacks: [] });
  }
  const totalMainBeats = Math.max(1, Number(block.measuresCount || 1)) * 4, mainArr = mapToSteps(block.mainCells, totalMainBeats * 4);
  for (let bIdx = 0; bIdx < totalMainBeats; bIdx++) beatGroups.push({ beatNum: (bIdx % 4) + 1, cells: mainArr.slice(bIdx * 4, (bIdx + 1) * 4), attacks: [] });
  if (Array.isArray(block.tailCells) && block.tailCells.some(isAttack)) beatGroups.push({ beatNum: 1, cells: mapToSteps(block.tailCells, 4), attacks: [] });

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
        if (needsRest) txtOut += ' _ '; else if (!att.joinsNextWord) txtOut += ' ';
      } else if (!(att.joinsNextWord && nextBg?.attacks?.[0]?.subdiv === 0) && g < beatGroups.length - 1) txtOut += ' ';
    }
  }
  const core = txtOut.trim().replace(/\s{2,}/g, ' '), htmlCore = htmlOut.trim().replace(/\s{2,}/g, ' ');
  return { rawLine: isTutti ? `***${core}***` : role === 'puxador' ? `*${core}*` : core, htmlLine: isTutti ? `<em><strong>${htmlCore}</strong></em>` : role === 'puxador' ? `<strong>${htmlCore}</strong>` : htmlCore };
}

export function convertScannedVocalBatchToOrganizador(scanResult) {
  const patterns = normalizeAndMergeBlocks(Array.isArray(scanResult?.patterns) ? scanResult.patterns : []), seqCols = Array.isArray(scanResult?.sequenceColumns) ? scanResult.sequenceColumns : [];
  const blockMap = new Map(patterns.map((p) => [String(p.code || '').trim().toUpperCase(), p])), rawLines = [], htmlLines = [];
  const norm = (c) => (!c || ['X', '-', '—', '_'].includes(String(c).trim().toUpperCase()) ? null : String(c).trim().toUpperCase());
  if (seqCols.length > 0) {
    let pauseRun = 0;
    const flushPause = () => { if (pauseRun > 0) { rawLines.push(`[PAUSE ${pauseRun}M]`); pauseRun = 0; } };
    for (const col of seqCols) {
      const pCode = norm(col.puxCode), cCode = norm(col.corCode);
      if (!pCode && !cCode) { pauseRun++; continue; }
      flushPause();
      if (pCode && cCode && pCode === cCode && blockMap.has(pCode)) { const r = convertScannedPatternToOrganizadorLine(blockMap.get(pCode), 'puxador', true); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
      else {
        if (pCode && blockMap.has(pCode)) { const r = convertScannedPatternToOrganizadorLine(blockMap.get(pCode), 'puxador', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
        if (cCode && blockMap.has(cCode)) { const r = convertScannedPatternToOrganizadorLine(blockMap.get(cCode), 'coro', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
      }
    }
    flushPause();
  } else for (const b of patterns) { const r = convertScannedPatternToOrganizadorLine(b, 'puxador', false); rawLines.push(r.rawLine); htmlLines.push(r.htmlLine); }
  return { rawTxtCode: rawLines.join('\n'), parolesOriginales: htmlLines.length ? `<p>${htmlLines.join('<br>')}</p>` : '', lines: rawLines };
}

export async function scanVocalPaperMultiPhotos(photoDataUrls = [], options = {}) {
  const apiKey = options.apiKey || getScanApiKey();
  if (!apiKey) return { success: false, error: "Clé d'accès requise pour la lecture optique", needsApiKey: true };
  const refBlock = options.referenceLyrics?.trim() ? `\nTEXTE OFFICIEL :\n"""\n${options.referenceLyrics.trim()}\n"""\n« Utilise obligatoirement les mots et syllabes du texte officiel fourni pour identifier chaque syllabe manuscrite, tout en respectant à 100 % les cases de temps/subdivisions où elles sont inscrites sur la grille. »` : '';
  const prompt = `Tu es le moteur de lecture optique de l'Atelier Papier du Chant (O Girador). Analyse ces photos (CHANT-SEQ, CHANT-NOTES-1M/2M à 3 blocs/page, CHANT-RYTHME Paysage à 8 temps libres / 32 subdivisions). Sur CHANT-NOTES, les 12 lignes de notes montent du grave en bas (A, au-dessus de SYLLABES) vers l'aigu en haut (G#, sous OCT) : de haut en bas ["G#","G","F#","F","E","D#","D","C#","C","B","A#","A"].${refBlock}\nLis sequenceColumns:[{measureNumber,puxCode,corCode}], beatNumbers (8 chiffres de la bande TEMPS) et cells (stepIndex 0..31, durationSteps, pitchKey, syllable). Réponds UNIQUEMENT en JSON valide.`;
  const parts = [{ text: prompt }];
  for (const rawUrl of photoDataUrls) { const comp = await compressImageForScan(rawUrl); parts.push({ inline_data: { mime_type: 'image/jpeg', data: comp.replace(/^data:image\/\w+;base64,/, '') } }); }
  for (const model of SCAN_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: 'application/json', temperature: 0.1 } }) });
      if (!res.ok) continue;
      const json = await res.json(), rawText = (json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}').replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)?.[0] || rawText);
      return { success: true, ...convertScannedVocalBatchToOrganizador(parsed), scanResult: parsed };
    } catch {}
  }
  return { success: false, error: 'Échec de la lecture optique multi-pages' };
}
