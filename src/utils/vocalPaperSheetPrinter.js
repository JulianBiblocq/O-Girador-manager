/**
 * vocalPaperSheetPrinter.js
 * Impression A4 100 % Noir & Blanc des feuilles de l'Atelier Papier du Chant depuis Organizador (< 95 lignes).
 * Feuille 2 (CHANT-NOTES, 4 systèmes/page) et Feuille 3 (CHANT-RYTHME, 6 systèmes/page) en A4 Paysage à 8 Temps Libres (32 subdivisions de 8.4mm).
 */

const KEYBOARD_ROWS = [
  { label: 'La (A)', isBlack: false, strong: true }, { label: 'Si♭', isBlack: true }, { label: 'Si (B)', isBlack: false },
  { label: 'Do (C)', isBlack: false, strong: true }, { label: 'Do#', isBlack: true }, { label: 'Ré (D)', isBlack: false },
  { label: 'Mi♭', isBlack: true }, { label: 'Mi (E)', isBlack: false }, { label: 'Fa (F)', isBlack: false },
  { label: 'Fa#', isBlack: true }, { label: 'Sol (G)', isBlack: false }, { label: 'Sol#', isBlack: true },
];

function renderCornersAndCode(code, title, subtitle) {
  const sq = 'position:absolute;width:6mm;height:6mm;background:#000;color:#fff;font-size:6.5pt;display:flex;align-items:center;justify-content:center;font-weight:900;';
  return `
    <div style="${sq}top:1.2mm;left:1.2mm;">■</div><div style="${sq}top:1.2mm;right:1.2mm;">■</div>
    <div style="${sq}bottom:1.2mm;left:1.2mm;">■</div><div style="${sq}bottom:1.2mm;right:1.2mm;">■</div>
    <div style="height:6mm;max-height:6.5mm;border-bottom:2px solid #000;padding-bottom:0.8mm;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:baseline;gap:6px;overflow:hidden;white-space:nowrap;"><span style="font-size:9.2pt;font-weight:900;text-transform:uppercase;">${title}</span><span style="font-size:6.2pt;font-weight:700;">• ${subtitle}</span></div>
      <span style="border:2px solid #000;padding:1px 6px;font-family:monospace;font-size:8pt;font-weight:900;">[CODE: ${code}]</span>
    </div>`;
}

export function buildOrganizadorVocalSheetHTML(sheetType = 'sequence', meta = {}) {
  const orientation = sheetType === 'notes_1m' || sheetType === 'notes_2m' || sheetType === 'rhythm_only' ? 'landscape' : 'portrait';
  const maxW = orientation === 'landscape' ? '283mm' : '196mm', pageH = orientation === 'landscape' ? 'calc(210mm - 14mm)' : 'calc(297mm - 14mm)';
  const titre = (meta.titre || '______________________').toUpperCase(), bpm = meta.bpmDefaut || '____', sig = meta.signature || '4/4';
  const blankTemps = Array.from({ length: 8 }, () => `<th colspan="4" class="open-temps-cell" style="height:4.5mm;border-right:1.5px solid #000;"></th>`).join('');
  let bodyHtml = '';

  if (sheetType === 'sequence') {
    const sys = [1, 9, 17, 25].map((startM) => {
      const ths = Array.from({ length: 8 }, (_, i) => `<th style="height:18px;font-size:8pt;">M${startM + i}</th>`).join('');
      const tds = Array.from({ length: 8 }, () => `<td style="height:26px;"></td>`).join('');
      return `<table><tr><th style="width:16mm;font-size:7.5pt;">MESURE</th>${ths}</tr><tr><td style="font-weight:900;font-size:8pt;">PUX</td>${tds}</tr><tr><td style="font-weight:900;font-size:8pt;">COR</td>${tds}</tr></table>`;
    }).join('');
    const lines = Array.from({ length: 10 }, (_, i) => `<div style="display:flex;gap:6px;border-bottom:1px solid #000;padding:2px 0;font-size:7.8pt;font-weight:900;"><span style="width:14mm;">[ P${i + 1} ]</span><span style="flex:1;"></span></div>`).join('');
    bodyHtml = `${renderCornersAndCode('CHANT-SEQ', `FEUILLE 1 — SÉQUENCE & PAROLES (${titre} • ${bpm} BPM • ${sig})`, 'Inscrire P1..Pn ou X (Pause) sur Pux et Cor • P5/P5 = Unisson • X/X = [PAUSE 1M]')}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;">${sys}</div><div style="border:2px solid #000;padding:4px;"><div style="font-size:8pt;font-weight:900;border-bottom:1.5px solid #000;margin-bottom:2px;">PAROLES DE RÉFÉRENCE PAR PATTERN (P1..P10)</div>${lines}</div>`;
  } else if (sheetType === 'notes_1m' || sheetType === 'notes_2m') {
    const code = sheetType === 'notes_2m' ? 'CHANT-NOTES-2M' : 'CHANT-NOTES-1M';
    const emptyTds = Array.from({ length: 32 }, (_, i) => `<td style="height:2.2mm;${(i + 1) % 4 === 0 ? 'border-right:1.5px solid #000;' : 'border-right:1px dotted #000;'}"></td>`).join('');
    const octTds = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:5.5mm;border-right:1.5px solid #000;"></td>`).join('');
    const sylTds = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:9.5mm;border-right:1.5px solid #000;"></td>`).join('');
    const kbHtml = KEYBOARD_ROWS.map((k) => `<tr style="${k.strong ? 'border-top:1.8px solid #000;' : ''}"><td class="${k.isBlack ? 'hatch-bw' : ''}" style="width:14mm;height:2.2mm;font-size:5.6pt;font-weight:900;text-align:left;padding-left:2px;border-right:2px solid #000;"><span style="background:#fff;padding:0 1px;">${k.label}</span></td>${emptyTds}</tr>`).join('');
    const blocks = Array.from({ length: 4 }, (_, idx) => `<div class="vocal-pattern-block" style="border:2px solid #000;page-break-inside:avoid;break-inside:avoid;"><table><tr style="border-bottom:1.5px solid #000;"><th style="width:14mm;height:4.5mm;border-right:2px solid #000;line-height:1;"><span style="font-size:7pt;font-weight:900;">[ P${idx + 1} ]</span><span style="font-size:4.8pt;display:block;">TEMPS</span></th>${blankTemps}</tr><tr style="border-bottom:1.8px solid #000;"><td style="width:14mm;height:5.5mm;font-size:5.4pt;font-weight:900;border-right:2px solid #000;">OCT / ±<br/>(3/4/5)</td>${octTds}</tr>${kbHtml}<tr style="border-top:2px solid #000;"><td style="width:14mm;height:9.5mm;font-size:5.6pt;font-weight:900;border-right:2px solid #000;">SYLLABES</td>${sylTds}</tr></table></div>`).join('');
    bodyHtml = `${renderCornersAndCode(code, 'FEUILLE 2 — PATTERNS & NOTES (A4 PAYSAGE • 8 TEMPS LIBRES / 32 SUBDIVISIONS)', `TITRE : ${titre} • Numéroter TEMPS (1..4) • Trait (───) = note • SYLLABES sous le trait`)}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;">${blocks}</div>`;
  } else if (sheetType === 'rhythm_only') {
    const rhythmCells = Array.from({ length: 32 }, (_, i) => `<td style="height:5.5mm;vertical-align:top;text-align:left;padding:0.2mm 0.5mm;font-size:4.8pt;font-weight:700;${(i + 1) % 4 === 0 ? 'border-right:1.5px solid #000;' : 'border-right:1px dotted #000;'}">${(i % 4) + 1}</td>`).join('');
    const openSyls = Array.from({ length: 8 }, () => `<td colspan="4" class="open-beat-cell" style="height:11mm;border-right:1.5px solid #000;"></td>`).join('');
    const blocks = Array.from({ length: 6 }, (_, idx) => `<div class="vocal-pattern-block" style="border:2px solid #000;page-break-inside:avoid;break-inside:avoid;"><table><tr style="border-bottom:1.5px solid #000;"><th style="width:14mm;height:4.5mm;border-right:2px solid #000;line-height:1;"><span style="font-size:7.2pt;font-weight:900;">[ P${idx + 1} ]</span><span style="font-size:4.8pt;display:block;">TEMPS</span></th>${blankTemps}</tr><tr style="border-bottom:2px solid #000;"><td style="width:14mm;height:5.5mm;font-size:5.3pt;font-weight:900;border-right:2px solid #000;">RYTHME<br/>(───)</td>${rhythmCells}</tr><tr><td style="width:14mm;height:11mm;font-size:5.6pt;font-weight:900;border-right:2px solid #000;">SYLLABES</td>${openSyls}</tr></table></div>`).join('');
    bodyHtml = `${renderCornersAndCode('CHANT-RYTHME', 'FEUILLE 3 — PAROLES & RYTHME (A4 PAYSAGE • 8 TEMPS LIBRES / 32 SUBDIVISIONS)', `TITRE : ${titre} • TEMPS (1..4) • Trait RYTHME (───) • SYLLABES ouverte`)}<div style="display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;">${blocks}</div>`;
  } else {
    bodyHtml = `${renderCornersAndCode('CHANT-GUIDE', "FEUILLE 4 — GUIDE & CONVENTIONS D'ÉCRITURE MANUSCRITE", 'Atelier Papier du Chant — O Girador (100 % Noir & Blanc)')}<div style="font-size:9pt;line-height:1.42;display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;flex:1;"><div style="border:2px solid #000;padding:8px;"><b>1. Grille Universelle A4 Paysage à 8 Temps Libres (32 subdivisions de 8.4mm) :</b> Sur les Feuilles 2 (4 systèmes/page) et 3 (6 systèmes/page), inscrivez les numéros de temps dans la bande <b>TEMPS (4.5mm)</b> : soit <b>2|3|4|1|2|3|4|1</b> (jusqu'à 3T d'anacrouse + 1M + chute +T1), soit <b>1|2|3|4|1|2|3|4</b> (2M complètes), ou uniquement les <b>1</b> aux débuts de mesures. Même code P__ sur 2 lignes = fusion multi-mesures !</div><div style="border:2px solid #000;padding:8px;"><b>2. Traits Horizontaux (───) & Bande SYLLABES ouverte :</b> Tracer un trait horizontal dans la ligne de note (ou la bande RYTHME 5.5mm) et écrire la syllabe en MAJUSCULES BÂTONS juste sous le début du trait. Tiret <b>-</b> = même mot • Apostrophe = élision (<b>E'O</b>).</div><div style="border:2px solid #000;padding:8px;"><b>3. Clavier 1 Octave (La ➔ Sol#) & Bande OCTAVE (3/4/5) :</b> 12 lignes compactes (2.2mm), filets forts sur La et Do, bande ouverte <b>OCT / ± (3/4/5)</b> (5.5mm) au-dessus.</div></div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4 ${orientation};margin:7mm;}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;}.page{position:relative;max-width:${maxW};height:${pageH};margin:0 auto;padding:4mm 6.5mm;border:2px solid #000;display:flex;flex-direction:column;justify-content:flex-start;gap:2.5mm;overflow:hidden;}.hatch-bw{background-image:repeating-linear-gradient(45deg,#000 0,#000 1px,#fff 1px,#fff 3.5px)!important;}table{width:100%;border-collapse:collapse;table-layout:fixed;}th,td{border:1px solid #000;text-align:center;}</style></head><body><div class="page">${bodyHtml}</div></body></html>`;
}

export function printOrganizadorVocalSheet(sheetType = 'sequence', meta = {}) {
  if (typeof document === 'undefined') return;
  const html = buildOrganizadorVocalSheetHTML(sheetType, meta);
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
