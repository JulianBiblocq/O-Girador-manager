/**
 * vocalSheetTab4ETemplate.js
 * Feuille 5 : Tablature de Chant à 4 Étages ([CODE: CHANT-TAB-4E]) A4 Paysage 100 % N&B + Décodeur optique via vocalDurationWeldParser (< 120 lignes).
 */
import { parseWeldedDurationTokens } from './vocalDurationWeldParser.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderOrganizadorTab4EPageInner(meta = {}, options = {}) {
  const titre = esc((meta.titre || '______________________').toUpperCase());
  const startP = Number(options.startPatternNumber ?? 1);
  const isBlank = Boolean(options.blankPatternLabels || options.patternNumberingMode === 'blank');
  const prefills = options.prefillFromProject && Array.isArray(options.prefillPatterns) ? options.prefillPatterns : [];
  const sq = 'position:absolute;width:5.5mm;height:5.5mm;background:#000000;color:#ffffff;font-size:6pt;display:flex;align-items:center;justify-content:center;font-weight:900;';

  const blocks = Array.from({ length: 4 }, (_, idx) => {
    const patNum = startP + idx, pre = prefills[patNum - 1] || null;
    const patLabel = isBlank && !pre?.code ? '[P__]' : `[ ${esc(pre?.code || `P${patNum}`)} ]`;
    const noteTokens = Array.isArray(pre?.referenceNotes) ? pre.referenceNotes : [];
    const sylTokens = pre?.lyricsText ? String(pre.lyricsText).trim().split(/\s+/).filter(Boolean) : [];

    const tempsCells = Array.from({ length: 8 }, (_, b) => `<th colspan="4" class="open-temps-cell" style="height:5mm;border-right:1.5px solid #000000;font-size:8pt;font-weight:900;">${pre ? (b % 4) + 1 : ''}</th>`).join('');
    const subdivCells = Array.from({ length: 32 }, (_, s) => `<td style="height:6.2mm;vertical-align:top;text-align:left;padding:0.2mm 0.5mm;font-size:4.8pt;font-weight:700;${(s + 1) % 4 === 0 ? 'border-right:1.5px solid #000000;' : 'border-right:1px dotted #000000;'}">${(s % 4) + 1}</td>`).join('');
    const notesCells = Array.from({ length: 8 }, (_, b) => `<td colspan="4" class="open-beat-cell" style="height:7.5mm;border-right:1.5px solid #000000;font-size:8.5pt;font-weight:900;">${esc(noteTokens[b] || '')}</td>`).join('');
    const sylCells = Array.from({ length: 8 }, (_, b) => `<td colspan="4" class="open-beat-cell" style="height:9.5mm;border-right:1.5px solid #000000;font-size:8.5pt;font-weight:900;">${esc(sylTokens[b] ? sylTokens[b].toUpperCase() : '')}</td>`).join('');

    return `<div class="vocal-pattern-block" style="border:2px solid #000000;page-break-inside:avoid;break-inside:avoid;"><table>
      <tr style="border-bottom:1.5px solid #000000;"><th style="width:18mm;height:5mm;border-right:2px solid #000000;line-height:1;"><span style="font-size:7.2pt;font-weight:900;">${patLabel}</span><span style="font-size:4.8pt;display:block;">1. TEMPS</span></th>${tempsCells}</tr>
      <tr style="border-bottom:1.5px solid #000000;"><td style="width:18mm;height:6.2mm;font-size:5.1pt;font-weight:900;border-right:2px solid #000000;">2. SUBDIV.<br/>(ex: 4/4)</td>${subdivCells}</tr>
      <tr style="border-bottom:1.5px solid #000000;"><td style="width:18mm;height:7.5mm;font-size:5.2pt;font-weight:900;border-right:2px solid #000000;">3. NOTES / 0<br/>(C, F#, A3, 0)</td>${notesCells}</tr>
      <tr><td style="width:18mm;height:9.5mm;font-size:5.2pt;font-weight:900;border-right:2px solid #000000;">4. SYLLABES<br/>(MAR- / _)</td>${sylCells}</tr>
    </table></div>`;
  }).join('');

  return `<div class="page vocal-print-page">
    <div class="fiducial-tl" style="${sq}top:1mm;left:1mm;">■</div><div class="fiducial-tr" style="${sq}top:1mm;right:1mm;">■</div>
    <div class="fiducial-bl" style="${sq}bottom:1mm;left:1mm;">■</div><div class="fiducial-br" style="${sq}bottom:1mm;right:1mm;">■</div>
    <div style="height:5.5mm;max-height:6mm;border-bottom:1.8px solid #000000;padding-bottom:0.5mm;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:baseline;gap:6px;overflow:hidden;white-space:nowrap;"><span style="font-size:8.8pt;font-weight:900;text-transform:uppercase;">FEUILLE 5 — TABLATURE 4 ÉTAGES (A4 PAYSAGE • SOUDURE '/')</span><span style="font-size:6pt;font-weight:700;">• TITRE : ${titre} • '/' = durée soudée • '0' = silence • '_' = mélisme/tenue</span></div>
      <span style="border:1.8px solid #000000;padding:0.5px 5px;font-family:monospace;font-size:7.5pt;font-weight:900;">[CODE: CHANT-TAB-4E]</span>
    </div>
    <div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;">${blocks}</div>
  </div>`;
}

export function decodeChantTab4EBlockForOrganizador(block) {
  if (!block) return block;
  const isTab4E = block.sheetCode === 'CHANT-TAB-4E' || Boolean(block.subdivisionLine || block.notesLine || block.syllablesLine);
  if (!isTab4E) return block;
  if (Array.isArray(block.cells) && block.cells.length > 0 && !block.subdivisionLine) return block;

  const durEvents = parseWeldedDurationTokens(block.subdivisionLine || '', false);
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
