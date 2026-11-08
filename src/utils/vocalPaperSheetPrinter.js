/**
 * vocalPaperSheetPrinter.js
 * Impression A4 100 % Noir & Blanc des 4 feuilles de l'Atelier Papier du Chant depuis Organizador (< 120 lignes).
 * Repères d'angle optiques ■, clavier 1 octave (La..Sol#) hachuré N&B, OCT / ±, Ana T3-T4, +T1 et iframe invisible.
 */

const KEYBOARD_ROWS = [
  { label: 'La (A)', isBlack: false, strong: true }, { label: 'Si♭', isBlack: true }, { label: 'Si (B)', isBlack: false },
  { label: 'Do (C)', isBlack: false, strong: true }, { label: 'Do#', isBlack: true }, { label: 'Ré (D)', isBlack: false },
  { label: 'Mi♭', isBlack: true }, { label: 'Mi (E)', isBlack: false }, { label: 'Fa (F)', isBlack: false },
  { label: 'Fa#', isBlack: true }, { label: 'Sol (G)', isBlack: false }, { label: 'Sol#', isBlack: true },
];

function renderCornersAndCode(code, title, subtitle) {
  const sq = 'position:absolute;width:6.5mm;height:6.5mm;background:#000;color:#fff;font-size:7pt;display:flex;align-items:center;justify-content:center;font-weight:900;';
  return `
    <div style="${sq}top:1.5mm;left:1.5mm;">■</div><div style="${sq}top:1.5mm;right:1.5mm;">■</div>
    <div style="${sq}bottom:1.5mm;left:1.5mm;">■</div><div style="${sq}bottom:1.5mm;right:1.5mm;">■</div>
    <div style="border-bottom:2px solid #000;padding-bottom:3px;margin-bottom:5px;display:flex;justify-content:space-between;align-items:center;">
      <div><div style="font-size:11pt;font-weight:900;text-transform:uppercase;">${title}</div><div style="font-size:7.5pt;font-weight:700;">${subtitle}</div></div>
      <span style="border:2px solid #000;padding:1px 6px;font-family:monospace;font-size:8.5pt;font-weight:900;">[CODE: ${code}]</span>
    </div>`;
}

export function buildOrganizadorVocalSheetHTML(sheetType = 'sequence', meta = {}) {
  const orientation = sheetType === 'notes_2m' ? 'landscape' : 'portrait';
  const maxW = orientation === 'landscape' ? '281mm' : '194mm', pageH = orientation === 'landscape' ? 'calc(210mm - 14mm)' : 'calc(297mm - 14mm)';
  const titre = (meta.titre || '______________________').toUpperCase(), bpm = meta.bpmDefaut || '____', sig = meta.signature || '4/4';
  let bodyHtml = '';

  if (sheetType === 'sequence') {
    const sys = [1, 9, 17, 25].map((startM) => {
      const ths = Array.from({ length: 8 }, (_, i) => `<th style="height:18px;font-size:8pt;">M${startM + i}</th>`).join('');
      const tds = Array.from({ length: 8 }, () => `<td style="height:24px;"></td>`).join('');
      return `<table style="margin-bottom:4px;"><tr><th style="width:16mm;font-size:7.5pt;">MESURE</th>${ths}</tr><tr><td style="font-weight:900;font-size:8pt;">PUX</td>${tds}</tr><tr><td style="font-weight:900;font-size:8pt;">COR</td>${tds}</tr></table>`;
    }).join('');
    const lines = Array.from({ length: 8 }, (_, i) => `<div style="display:flex;gap:6px;border-bottom:1px solid #000;padding:3px 0;font-size:8pt;font-weight:900;"><span style="width:14mm;">[ P${i + 1} ]</span><span style="flex:1;"></span></div>`).join('');
    bodyHtml = `${renderCornersAndCode('CHANT-SEQ', `FEUILLE 1 — SÉQUENCE & PAROLES (${titre} • ${bpm} BPM • ${sig})`, 'Inscrire P1..Pn ou X (Pause) sur Pux et Cor • P5/P5 = Unisson • X/X = [PAUSE 1M]')}${sys}<div style="border:2px solid #000;padding:5px;flex:1;"><div style="font-size:8.5pt;font-weight:900;border-bottom:1.5px solid #000;margin-bottom:3px;">PAROLES DE RÉFÉRENCE PAR PATTERN (P1..P8)</div>${lines}</div>`;
  } else if (sheetType === 'notes_1m' || sheetType === 'notes_2m') {
    const is2M = sheetType === 'notes_2m', count = is2M ? 2 : 3, totalBeats = (is2M ? 2 : 1) * 4 + 3;
    const colsCount = totalBeats * 4;
    const emptyTds = Array.from({ length: colsCount }, (_, i) => `<td style="height:11px;${(i + 1) % 4 === 0 ? 'border-right:2px solid #000;' : ''}"></td>`).join('');
    const sylTds = Array.from({ length: colsCount }, (_, i) => `<td style="height:21px;${(i + 1) % 4 === 0 ? 'border-right:2px solid #000;' : ''}"></td>`).join('');
    const kbHtml = KEYBOARD_ROWS.map((k) => `<tr style="${k.strong ? 'border-top:2px solid #000;' : ''}"><td class="${k.isBlack ? 'hatch-bw' : ''}" style="width:15mm;font-size:6.5pt;font-weight:900;text-align:left;padding-left:2px;border-right:2px solid #000;"><span style="background:#fff;padding:0 1px;">${k.label}</span></td>${emptyTds}</tr>`).join('');
    const blocks = Array.from({ length: count }, (_, idx) => `<div style="border:2px solid #000;margin-bottom:4px;"><div style="padding:2px 6px;font-size:8pt;font-weight:900;border-bottom:1.5px solid #000;">[ PATTERN : P${idx + 1} ] (Neutre — Ana T3-T4 | Temps 1..4 | +T1)</div><table><tr><td style="width:15mm;font-size:6.5pt;font-weight:900;border-right:2px solid #000;">OCT / ±</td>${emptyTds}</tr>${kbHtml}<tr style="border-top:2px solid #000;"><td style="font-size:6.5pt;font-weight:900;border-right:2px solid #000;">SYLLABES</td>${sylTds}</tr></table></div>`).join('');
    bodyHtml = `${renderCornersAndCode(is2M ? 'CHANT-NOTES-2M' : 'CHANT-NOTES-1M', `FEUILLE 2 — PATTERNS & CLAVIER 1 OCTAVE (${is2M ? '2 MESURES' : '1 MESURE'})`, 'Clavier La ➔ Sol# • Touches noires hachurées N&B • Syllabes en MAJUSCULES BÂTONS')}${blocks}`;
  } else if (sheetType === 'rhythm_only') {
    const headers = ['ANA T3', 'ANA T4', 'TEMPS 1', 'TEMPS 2', 'TEMPS 3', 'TEMPS 4', '+T1'].map((h) => `<th colspan="4" style="font-size:7.5pt;border-right:2px solid #000;">${h}</th>`).join('');
    const subs = Array.from({ length: 28 }, (_, i) => `<td style="font-size:6.5pt;height:12px;${(i + 1) % 4 === 0 ? 'border-right:2px solid #000;' : ''}">${(i % 4) + 1}</td>`).join('');
    const cells = Array.from({ length: 28 }, (_, i) => `<td style="height:26px;${(i + 1) % 4 === 0 ? 'border-right:2px solid #000;' : ''}"></td>`).join('');
    const blocks = Array.from({ length: 5 }, (_, idx) => `<div style="border:2px solid #000;margin-bottom:5px;"><div style="padding:2px 6px;font-size:8pt;font-weight:900;border-bottom:1.5px solid #000;">[ PATTERN : P${idx + 1} ] (Rythme & Syllabes — Sans Notes)</div><table><tr>${headers}</tr><tr>${subs}</tr><tr>${cells}</tr></table></div>`).join('');
    bodyHtml = `${renderCornersAndCode('CHANT-RYTHME', `FEUILLE 3 — PAROLES & RYTHME SEUL (${titre})`, 'Syllabes en MAJUSCULES BÂTONS • Tiret "-" = même mot • "───►" = tenue • "E\'O" = élision')}${blocks}`;
  } else {
    bodyHtml = `${renderCornersAndCode('CHANT-GUIDE', "FEUILLE 4 — GUIDE & CONVENTIONS D'ÉCRITURE MANUSCRITE", 'Atelier Papier du Chant — O Girador (100 % Noir & Blanc)')}<div style="font-size:9pt;line-height:1.45;display:flex;flex-direction:column;gap:8px;flex:1;"><div style="border:2px solid #000;padding:8px;"><b>1. Séparation Patterns / Rôles :</b> Patterns neutres [Pattern : P1..Pn]. Sur la Feuille Séquence : <b>Pux : P1 - P2 - X - X - P5</b> / <b>Cor : X - X - P3 - P4 - P5</b> (P5/P5 = Unisson ***...*** ; X/X = [PAUSE 1M]).</div><div style="border:2px solid #000;padding:8px;"><b>2. Syllabes & Liaisons :</b> Écrire en MAJUSCULES BÂTONS. Tiret <b>-</b> en fin de case = soudure intra-mot (<b>VO-</b> | <b>VÓ</b> ➔ <i>Vovó</i>). Apostrophe dans la même case = élision (<b>E'O</b>). Flèche <b>───►</b> = tenue.</div><div style="border:2px solid #000;padding:8px;"><b>3. Clavier 1 Octave (La ➔ Sol#) :</b> 12 lignes de La à Sol#, filets forts sur La et Do, ligne <b>OCT / ±</b> (+1 / -1) au-dessus.</div></div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4 ${orientation};margin:7mm;}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;}.page{position:relative;max-width:${maxW};height:${pageH};margin:0 auto;padding:8.5mm 9mm;border:2px solid #000;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;}.hatch-bw{background-image:repeating-linear-gradient(45deg,#000 0,#000 1px,#fff 1px,#fff 3.5px)!important;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #000;text-align:center;}</style></head><body><div class="page">${bodyHtml}</div></body></html>`;
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
