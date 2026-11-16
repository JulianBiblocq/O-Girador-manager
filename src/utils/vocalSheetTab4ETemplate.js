/**
 * vocalSheetTab4ETemplate.js
 * Feuille 5 : Tablature de Chant à 4 Étages ([CODE: CHANT-TAB-4E]) A4 Paysage 100 % N&B (5 systèmes/page, taquets 1.5 mm)
 * + Décodeur optique via vocalDurationWeldParser (< 120 lignes).
 */
import { parseWeldedDurationTokens } from './vocalDurationWeldParser.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSubdivTicks(isLastBeat) {
  const t123 = [1, 2, 3].map((n) =>
    `<span style="flex:1;height:1.5mm;border-right:0.8px solid #9a9a9a;font-size:4.1pt;font-weight:700;color:#666666;text-align:left;padding-left:0.4mm;line-height:1.5mm;">${n}</span>`
  ).join('');
  const t4Bdr = isLastBeat ? '' : 'border-right:1.1px solid #555555;';
  const t4 = `<span style="flex:1;height:1.8mm;${t4Bdr}font-size:4.1pt;font-weight:700;color:#666666;text-align:left;padding-left:0.4mm;line-height:1.5mm;">4</span>`;
  return `<div style="display:flex;width:100%;height:1.8mm;align-items:flex-start;">${t123}${t4}</div>`;
}

export function renderOrganizadorTab4EPageInner(meta = {}, options = {}) {
  const titre = esc((meta.titre || '________________').toUpperCase());
  const blocksCount = Number(options.patternsCount ?? 5);
  const startP = Number(options.startPatternNumber ?? 1);
  const isBlank = Boolean(options.blankPatternLabels || options.patternNumberingMode === 'blank');
  const prefills = options.prefillFromProject && Array.isArray(options.prefillPatterns) ? options.prefillPatterns : [];
  const fallbackNotes = Array.isArray(options.prefillNotes) ? options.prefillNotes : [];
  const fallbackSyls = options.prefillLyrics ? String(options.prefillLyrics).trim().split(/\s+/).filter(Boolean) : [];
  const sq = 'position:absolute;width:5.5mm;height:5.5mm;background:#000000;color:#ffffff;font-size:6pt;display:flex;align-items:center;justify-content:center;font-weight:900;';
  const colGroup = `<colgroup><col style="width:18mm;"/>${'<col/>'.repeat(8)}</colgroup>`;

  const blocks = Array.from({ length: blocksCount }, (_, idx) => {
    const patNum = startP + idx, pre = prefills[patNum - 1] || null;
    const patLabel = isBlank && !pre?.code ? '[P__]' : `[ ${esc(pre?.code || `P${patNum}`)} ]`;
    const noteTokens = Array.isArray(pre?.referenceNotes) ? pre.referenceNotes : (idx === 0 ? fallbackNotes : []);
    const sylTokens = pre?.lyricsText
      ? String(pre.lyricsText).trim().split(/\s+/).filter(Boolean)
      : (idx === 0 ? fallbackSyls : []);
    const hasPre = Boolean(pre || noteTokens.length > 0 || sylTokens.length > 0);

    const tempsCells = Array.from({ length: 8 }, (_, b) => `<th class="open-temps-cell" style="height:4.5mm;border-left:none;border-right:${b === 7 ? 'none' : '1.5px solid #000000'};font-size:7.8pt;font-weight:900;">${hasPre ? (b % 4) + 1 : ''}</th>`).join('');
    const subdivCells = Array.from({ length: 8 }, (_, b) => `<td class="subdiv-open-cell" style="height:6.5mm;vertical-align:top;padding:0;border-left:none;border-right:none;">${renderSubdivTicks(b === 7)}</td>`).join('');
    const notesCells = Array.from({ length: 8 }, (_, b) => `<td class="open-beat-cell" style="height:7.5mm;border-left:none;border-right:${b === 7 ? 'none' : '1.5px solid #000000'};font-size:8.4pt;font-weight:900;padding:0 2px;">${esc(noteTokens[b] || '')}</td>`).join('');
    const sylCells = Array.from({ length: 8 }, (_, b) => `<td class="open-beat-cell" style="height:9.5mm;border-left:none;border-right:${b === 7 ? 'none' : '1.5px solid #000000'};font-size:8.4pt;font-weight:900;padding:0 2px;">${esc(sylTokens[b] ? sylTokens[b].toUpperCase() : '')}</td>`).join('');

    return `<div class="vocal-pattern-block" style="border:2px solid #000000;page-break-inside:avoid;break-inside:avoid;"><table>${colGroup}
      <tr style="border-bottom:1.5px solid #000000;"><th style="width:18mm;height:4.5mm;border-right:2px solid #000000;padding:0 1px;line-height:1;"><span style="font-size:7pt;font-weight:900;">${patLabel}</span><span style="font-size:4.6pt;font-weight:800;display:block;">1. TEMPS</span></th>${tempsCells}</tr>
      <tr style="border-bottom:1.5px solid #000000;"><td style="width:18mm;height:6.5mm;font-size:4.8pt;font-weight:900;border-right:2px solid #000000;line-height:1.05;">2. SUBDIV.<br/>(ex: 4, 2+2, 4/4)</td>${subdivCells}</tr>
      <tr style="border-bottom:1.5px solid #000000;"><td style="width:18mm;height:7.5mm;font-size:5pt;font-weight:900;border-right:2px solid #000000;line-height:1.05;">3. NOTES / 0<br/>(C, F#, A3, 0)</td>${notesCells}</tr>
      <tr><td style="width:18mm;height:9.5mm;font-size:5pt;font-weight:900;border-right:2px solid #000000;line-height:1.05;">4. SYLLABES<br/>(MAR- / _)</td>${sylCells}</tr>
    </table></div>`;
  }).join('');

  return `<div class="page vocal-print-page" style="padding:3mm 4.5mm;gap:1.8mm;">
    <div class="fiducial-tl" style="${sq}top:1mm;left:1mm;">■</div><div class="fiducial-tr" style="${sq}top:1mm;right:1mm;">■</div>
    <div class="fiducial-bl" style="${sq}bottom:1mm;left:1mm;">■</div><div class="fiducial-br" style="${sq}bottom:1mm;right:1mm;">■</div>
    <div style="height:5.5mm;max-height:5.8mm;border-bottom:1.8px solid #000000;padding:0 3mm 0.6mm 3mm;display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <div style="min-width:0;flex:1;display:flex;align-items:baseline;gap:5px;overflow:hidden;white-space:nowrap;">
        <span style="font-size:8.6pt;font-weight:900;text-transform:uppercase;flex-shrink:0;">FEUILLE 5 — TABLATURE 4 ÉTAGES (A4 PAYSAGE • 8 TEMPS)</span>
        <span style="font-size:5.7pt;font-weight:700;overflow:hidden;text-overflow:ellipsis;">• TITRE : ${titre} • '/' = durée soudée (4/4) • '0' = silence • '_' = mélisme/tenue • '-' = mot coupé</span>
      </div>
      <span class="optical-sheet-code" style="display:inline-block;white-space:nowrap;flex-shrink:0;border:2px solid #000000;padding:0.5px 5px;font-family:monospace;font-size:7.6pt;font-weight:900;letter-spacing:0.3px;background:#ffffff;color:#000000;">[CODE: CHANT-TAB-4E]</span>
    </div>
    <div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.2mm;">${blocks}</div>
  </div>`;
}

export function decodeChantTab4EBlockForOrganizador(block) {
  if (!block) return block;
  const isTab4E = block.sheetCode === 'CHANT-TAB-4E' || Boolean(block.subdivisionLine || block.notesLine || block.syllablesLine);
  if (!isTab4E) return block;
  if (Array.isArray(block.cells) && block.cells.length > 0 && !block.subdivisionLine) return block;

  const durEvents = parseWeldedDurationTokens(String(block.subdivisionLine || '').replace(/\+/g, ' '), false);
  const noteTokens = String(block.notesLine || '').trim().split(/\s+/).filter(Boolean);
  const sylTokens = String(block.syllablesLine || '').trim().split(/\s+/).filter(Boolean);
  if (durEvents.length === 0) return block;

  const cells = [];
  let stepCursor = 0;
  for (let i = 0; i < durEvents.length && stepCursor < 32; i++) {
    const dur = Math.max(1, Math.round(durEvents[i].totalSubdivisions));
    const rawNote = noteTokens[i] ?? '', rawSyl = sylTokens[i] ?? '';
    const isRest = rawNote === '0' || rawNote === '𝄽' || rawSyl === '0' || rawSyl === '𝄽';
    if (!isRest) {
      cells.push({
        stepIndex: stepCursor,
        durationSteps: dur,
        pitchKey: rawNote && rawNote !== '-' ? rawNote : undefined,
        syllable: rawSyl || 'LA',
        isTie: rawSyl === '───' || (rawSyl === '_' && !rawNote),
      });
    }
    stepCursor += dur;
  }
  return { ...block, beatNumbers: block.beatNumbers || [1, 2, 3, 4, 1, 2, 3, 4], cells };
}
