/**
 * vocalPaperSheetPrinter.js
 * Impression A4 Paysage 100 % Noir & Blanc et Panier Multi-Feuilles de l'Atelier Papier du Chant depuis Organizador (< 115 lignes).
 * Toutes les 4 feuilles (Séquence, Patterns & Notes, Paroles & Rythme, Guide) sont en A4 Paysage avec @page { size: A4 landscape; margin: 7mm; }.
 */

const KEYBOARD_ROWS = [
  { key: 'G#', label: 'G#', isBlack: true }, { key: 'G', label: 'G', isBlack: false }, { key: 'F#', label: 'F#', isBlack: true },
  { key: 'F', label: 'F', isBlack: false }, { key: 'E', label: 'E', isBlack: false }, { key: 'D#', label: 'D#', isBlack: true },
  { key: 'D', label: 'D', isBlack: false }, { key: 'C#', label: 'C#', isBlack: true }, { key: 'C', label: 'C', isBlack: false, strong: true },
  { key: 'B', label: 'B', isBlack: false }, { key: 'A#', label: 'A#', isBlack: true }, { key: 'A', label: 'A', isBlack: false, strong: true },
];

function renderCornersAndCode(code, title, subtitle) {
  const sq = 'position:absolute;width:5.5mm;height:5.5mm;background:#000000;color:#ffffff;font-size:6pt;display:flex;align-items:center;justify-content:center;font-weight:900;';
  return `
    <div style="${sq}top:1mm;left:1mm;">■</div><div style="${sq}top:1mm;right:1mm;">■</div>
    <div style="${sq}bottom:1mm;left:1mm;">■</div><div style="${sq}bottom:1mm;right:1mm;">■</div>
    <div style="height:5.5mm;max-height:6mm;border-bottom:1.8px solid #000000;padding-bottom:0.5mm;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:baseline;gap:6px;overflow:hidden;white-space:nowrap;"><span style="font-size:8.8pt;font-weight:900;text-transform:uppercase;">${title}</span><span style="font-size:6pt;font-weight:700;">• ${subtitle}</span></div>
      <span style="border:1.8px solid #000000;padding:0.5px 5px;font-family:monospace;font-size:7.5pt;font-weight:900;">[CODE: ${code}]</span>
    </div>`;
}

export function renderOrganizadorSingleVocalPageInner(sheetType = 'sequence', meta = {}, options = {}) {
  const titre = (meta.titre || '______________________').toUpperCase(), bpm = meta.bpmDefaut || '____', sig = meta.signature || '4/4';
  const startP = Number(options.startPatternNumber ?? 1);
  const isBlank = Boolean(options.blankPatternLabels || options.patternNumberingMode === 'blank');
  const blankTemps55 = Array.from({ length: 8 }, () => `<th colspan="4" class="open-temps-cell" style="height:5.5mm;border-right:1.5px solid #000000;"></th>`).join('');
  const blankTemps45 = Array.from({ length: 8 }, () => `<th colspan="4" class="open-temps-cell" style="height:4.5mm;border-right:1.5px solid #000000;"></th>`).join('');

  if (sheetType === 'sequence') {
    const sys = [1, 9, 17, 25].map((startM) => {
      const ths = Array.from({ length: 8 }, (_, i) => `<th style="height:4.2mm;font-size:8pt;">M${startM + i}</th>`).join('');
      const tds = Array.from({ length: 8 }, () => `<td style="height:6.2mm;"></td>`).join('');
      return `<table><tr><th style="width:16mm;font-size:7.5pt;">MESURE</th>${ths}</tr><tr><td style="font-weight:900;font-size:8pt;">PUX</td>${tds}</tr><tr><td style="font-weight:900;font-size:8pt;">COR</td>${tds}</tr></table>`;
    }).join('');
    const memoRows = Array.from({ length: 5 }, (_, r) => `<tr><td style="width:13mm;height:4.8mm;font-weight:900;font-size:7.6pt;">P${r * 2 + 1}</td><td style="text-align:left;padding-left:6px;font-size:7.4pt;">Incipit : ______________________________________________________</td><td style="width:13mm;height:4.8mm;font-weight:900;font-size:7.6pt;">P${r * 2 + 2}</td><td style="text-align:left;padding-left:6px;font-size:7.4pt;">Incipit : ______________________________________________________</td></tr>`).join('');
    return `<div class="page vocal-print-page">${renderCornersAndCode('CHANT-SEQ', `FEUILLE 1 — SÉQUENCE & PAROLES (${titre} • ${bpm} BPM • ${sig})`, 'A4 Paysage • Inscrire P1..Pn ou X (Pause) sur Pux et Cor • P5/P5 = Unisson • X/X = [PAUSE 1M]')}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2mm;">${sys}</div><div><div style="font-size:7.2pt;font-weight:900;margin-bottom:1px;">INDEX AIDE-MÉMOIRE DES PATTERNS (P1..P10)</div><table><tbody>${memoRows}</tbody></table></div></div>`;
  }
  if (sheetType === 'notes_1m' || sheetType === 'notes_2m') {
    const code = sheetType === 'notes_2m' ? 'CHANT-NOTES-2M' : 'CHANT-NOTES-1M';
    const emptyTds = Array.from({ length: 32 }, (_, i) => `<td style="height:1.8mm;padding:0;line-height:1;font-size:6.5pt;${(i + 1) % 4 === 0 ? 'border-right:1.5px solid #000000;' : 'border-right:1px dotted #000000;'}"></td>`).join('');
    const octTds = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:5.5mm;border-right:1.5px solid #000000;"></td>`).join('');
    const sylTds = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:11.5mm;border-right:1.5px solid #000000;"></td>`).join('');
    const kbHtml = KEYBOARD_ROWS.map((k) => `<tr style="${k.strong ? 'border-bottom:1.8px solid #000000;' : ''}"><td class="${k.isBlack ? 'hatch-bw' : ''}" style="width:8.5mm;height:1.8mm;padding:0;line-height:1;font-size:${k.isBlack ? '5.5pt' : '6.5pt'};font-weight:900;text-align:center;border-right:2px solid #000000;"><span style="background:#ffffff;padding:0 1px;line-height:1;">${k.label}</span></td>${emptyTds}</tr>`).join('');
    const blocks = Array.from({ length: 3 }, (_, idx) => `<div class="vocal-pattern-block" style="border:2px solid #000000;page-break-inside:avoid;break-inside:avoid;"><table><tr style="border-bottom:1.5px solid #000000;"><th style="width:8.5mm;height:5.5mm;padding:0;line-height:1;border-right:2px solid #000000;"><span style="font-size:6.8pt;font-weight:900;display:block;">${isBlank ? '[P__]' : `[P${startP + idx}]`}</span><span style="font-size:4.4pt;display:block;">TEMPS</span></th>${blankTemps55}</tr><tr style="border-bottom:1.8px solid #000000;"><td style="width:8.5mm;height:5.5mm;padding:0;line-height:1;font-size:5pt;font-weight:900;border-right:2px solid #000000;">OCT<br/>3/4/5</td>${octTds}</tr>${kbHtml}<tr style="border-top:2px solid #000000;"><td style="width:8.5mm;height:11.5mm;padding:0;line-height:1;font-size:5.2pt;font-weight:900;border-right:2px solid #000000;">SYL</td>${sylTds}</tr></table></div>`).join('');
    return `<div class="page vocal-print-page">${renderCornersAndCode(code, 'FEUILLE 2 — PATTERNS & NOTES (A4 PAYSAGE • 8 TEMPS LIBRES / 32 SUBDIVISIONS)', `TITRE : ${titre} • Grave A (en bas) ➔ Aigu G# (en haut) • Trait (───) = note`)}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:3mm;">${blocks}</div></div>`;
  }
  if (sheetType === 'rhythm_only') {
    const rhythmCells = Array.from({ length: 32 }, (_, i) => `<td style="height:5.5mm;vertical-align:top;text-align:left;padding:0.2mm 0.5mm;font-size:4.8pt;font-weight:700;${(i + 1) % 4 === 0 ? 'border-right:1.5px solid #000000;' : 'border-right:1px dotted #000000;'}">${(i % 4) + 1}</td>`).join('');
    const openSyls = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:11mm;border-right:1.5px solid #000000;"></td>`).join('');
    const blocks = Array.from({ length: 6 }, (_, idx) => `<div class="vocal-pattern-block" style="border:2px solid #000000;page-break-inside:avoid;break-inside:avoid;"><table><tr style="border-bottom:1.5px solid #000000;"><th style="width:14mm;height:4.5mm;border-right:2px solid #000000;line-height:1;"><span style="font-size:7.2pt;font-weight:900;">${isBlank ? '[P__]' : `[ P${startP + idx} ]`}</span><span style="font-size:4.8pt;display:block;">TEMPS</span></th>${blankTemps45}</tr><tr style="border-bottom:2px solid #000000;"><td style="width:14mm;height:5.5mm;font-size:5.3pt;font-weight:900;border-right:2px solid #000000;">RYTHME<br/>(───)</td>${rhythmCells}</tr><tr><td style="width:14mm;height:11mm;font-size:5.6pt;font-weight:900;border-right:2px solid #000000;">SYLLABES</td>${openSyls}</tr></table></div>`).join('');
    return `<div class="page vocal-print-page">${renderCornersAndCode('CHANT-RYTHME', 'FEUILLE 3 — PAROLES & RYTHME (A4 PAYSAGE • 8 TEMPS LIBRES / 32 SUBDIVISIONS)', `TITRE : ${titre} • TEMPS (1..4) • Trait RYTHME (───) • SYLLABES ouverte`)}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;">${blocks}</div></div>`;
  }
  return `<div class="page vocal-print-page">${renderCornersAndCode('CHANT-GUIDE', "FEUILLE 4 — GUIDE & CONVENTIONS D'ÉCRITURE MANUSCRITE (A4 PAYSAGE)", 'Atelier Papier du Chant — O Girador (100 % Noir & Blanc)')}<div style="font-size:8.6pt;line-height:1.38;display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;flex:1;"><div style="border:2px solid #000000;padding:7px;"><b>1. Grille Universelle A4 Paysage à 8 Temps Libres (32 subdivisions) :</b> Sur les Feuilles 2 (3 systèmes/page) et 3 (6 systèmes/page), inscrivez les numéros de temps dans la bande <b>TEMPS</b> : soit <b>2|3|4|1|2|3|4|1</b> (anacrouse + 1M + chute +T1), soit <b>1|2|3|4|1|2|3|4</b> (2M complètes). Même code P__ sur 2 lignes = fusion multi-mesures !</div><div style="border:2px solid #000000;padding:7px;"><b>2. Traits Horizontaux (───) & Bande SYLLABES ouverte :</b> Tracer un trait horizontal dans la ligne de note (ou la bande RYTHME 5.5mm) et écrire la syllabe en MAJUSCULES BÂTONS juste sous le début du trait. Tiret <b>-</b> = même mot • Apostrophe = élision (<b>E'O</b>).</div><div style="border:2px solid #000000;padding:7px;"><b>3. Clavier Piano Roll 1 Octave (A en bas ➔ G# en haut) & Bande OCT (3/4/5) :</b> Les notes montent du grave en bas (<b>A</b>, juste au-dessus de SYLLABES) vers l'aigu en haut (<b>G#</b>, sous OCT). 12 lignes ultra-compactes (1.8mm), lettres A B C D E F G seules.</div></div></div>`;
}

export function wrapOrganizadorPagesInA4Landscape(innerPagesHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4 landscape;margin:7mm;}@media print{html,body{width:283mm;margin:0!important;padding:0!important;background:#ffffff!important;color:#000000!important;filter:grayscale(100%) contrast(105%)!important;-webkit-filter:grayscale(100%) contrast(105%)!important;color-scheme:only light!important;}}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{margin:0;background:#ffffff;color:#000000;font-family:Arial,sans-serif;filter:grayscale(100%) contrast(105%);}.page,.vocal-print-page{position:relative;width:283mm;max-width:283mm;height:196mm;max-height:196mm;margin:0 auto;padding:3.5mm 4.5mm;border:2px solid #000000;background:#ffffff;color:#000000;display:flex;flex-direction:column;justify-content:flex-start;gap:2mm;overflow:hidden;page-break-inside:avoid;break-inside:avoid;page-break-after:always;break-after:page;}.vocal-print-page:last-child,.page:last-child{page-break-after:auto!important;break-after:auto!important;}.hatch-bw{background-image:repeating-linear-gradient(45deg,#000000 0,#000000 1px,#ffffff 1px,#ffffff 3.5px)!important;}table{width:100%;border-collapse:collapse;table-layout:fixed;}th,td{border:1px solid #000000;text-align:center;padding:0;line-height:1;}</style></head><body>${innerPagesHtml}</body></html>`;
}

export function buildOrganizadorVocalSheetHTML(sheetType = 'sequence', meta = {}, options = {}) {
  return wrapOrganizadorPagesInA4Landscape(renderOrganizadorSingleVocalPageInner(sheetType, meta, options));
}

export function buildOrganizadorVocalCartBatchHTML(cart = {}, meta = {}, options = {}) {
  const opts = typeof options === 'string' ? { patternNumberingMode: options } : (options || {});
  const clamp = (v) => Math.max(0, Math.min(20, Number(v || 0)));
  const seq = clamp(cart.sequence), notes = clamp(cart.notes), rhythm = clamp(cart.rhythm), guide = clamp(cart.instructions);
  const mode = opts.patternNumberingMode || (opts.blankPatternLabels ? 'blank' : 'continuous');
  const pages = [];
  let nextP = Number(opts.startPatternNumber ?? 1);
  for (let i = 0; i < seq; i++) pages.push(renderOrganizadorSingleVocalPageInner('sequence', meta, opts));
  for (let i = 0; i < notes; i++) {
    pages.push(renderOrganizadorSingleVocalPageInner('notes_1m', meta, { ...opts, startPatternNumber: mode === 'continuous' ? nextP : 1, patternNumberingMode: mode, blankPatternLabels: mode === 'blank' }));
    if (mode === 'continuous') nextP += 3;
  }
  for (let i = 0; i < rhythm; i++) {
    pages.push(renderOrganizadorSingleVocalPageInner('rhythm_only', meta, { ...opts, startPatternNumber: mode === 'continuous' ? nextP : 1, patternNumberingMode: mode, blankPatternLabels: mode === 'blank' }));
    if (mode === 'continuous') nextP += 6;
  }
  for (let i = 0; i < guide; i++) pages.push(renderOrganizadorSingleVocalPageInner('instructions', meta, opts));
  return wrapOrganizadorPagesInA4Landscape(pages.join('\n'));
}

export function printOrganizadorHtmlDocument(html) {
  if (typeof document === 'undefined') return;
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
    finally { setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000); }
  }, 250);
}

export function printOrganizadorVocalSheet(sheetType = 'sequence', meta = {}, options = {}) {
  printOrganizadorHtmlDocument(buildOrganizadorVocalSheetHTML(sheetType, meta, options));
}
