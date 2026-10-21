/**
 * Utilitaire de sérialisation, conversion HTML et export/import des Toadas (.txt) (< 140 lignes).
 * Conforme aux standards d'interopérabilité Organizador <-> Cantador.
 */
import { CHORD_REGEX, isSectionHeader } from './toadaMeasureParser.js';

export const TOADA_TXT_LEGEND = `
# ==========================================
# LÉGENDE DU FORMAT TOADA (.txt) O-GIRADOR :
# ------------------------------------------
# +     : Anacrouse (mesure d'élan)
# /     : Mesure liée à la précédente
# *mot* : Puxador / Soliste (Gras)
# texte : Chœur / Coro (Normal)
# [Dm7] : Accord harmonique
# Espace au début d'une ligne : Retour visuel dans la même mesure (Shift + Entrée)
# Double saut de ligne : Nouvelle mesure (Entrée)
# [Intro], [Refrain] : En-têtes de section
# ==========================================
`.trim();

export function serializeToadaMeasures(sections = []) {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  const blocks = [];

  for (const sec of sections) {
    if (sec.name && sec.name.trim()) blocks.push(`[${sec.name.trim()}]`);
    for (const m of sec.measures || []) {
      const prefix = m.hasAnacrusis ? '+ ' : m.isLinked ? '/ ' : '';
      let content = (m.rawContent || '').trim();
      // Gestion des lignes multiples dans la même mesure (retour visuel avec espace)
      const lines = content.split(/\r?\n/).map((l, idx) => {
        if (idx === 0) return l.trim();
        return ` ${l.trim()}`;
      });
      blocks.push(`${prefix}${lines.join('\n')}`);
    }
  }
  return blocks.join('\n\n');
}

export function toadaToCleanHtml(rawTxtCode = '') {
  if (!rawTxtCode || typeof rawTxtCode !== 'string') return '';
  if (/<[a-z][\s\S]*>/i.test(rawTxtCode)) return rawTxtCode;

  const paragraphs = rawTxtCode.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const htmlParas = [];

  for (const para of paragraphs) {
    const lines = para.split(/\r?\n/);
    if (isSectionHeader(lines[0])) {
      const secTitle = lines[0].replace(/^\s*\[|\]\s*$/g, '').trim();
      htmlParas.push(`<h4 class="toada-section-title">${secTitle}</h4>`);
      lines.shift();
      if (lines.length === 0) continue;
    }

    const cleanLines = lines.map((line) => {
      let clean = line
        .replace(/^\s*[+/]\s*/, '')
        .replace(CHORD_REGEX, '')
        .trim();
      // Remplace *gras* par <strong>
      clean = clean.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
      return clean;
    }).filter(Boolean);

    if (cleanLines.length > 0) {
      htmlParas.push(`<p>${cleanLines.join('<br>')}</p>`);
    }
  }

  return htmlParas.join('\n');
}

export function generateToadaTxtWithLegend(rawTxtCode, meta = {}) {
  const headerLines = [];
  if (meta.titre) headerLines.push(`# Titre: ${meta.titre}`);
  if (meta.signature || meta.timeSignature) headerLines.push(`# Signature: ${meta.signature || meta.timeSignature}`);
  if (meta.bpm || meta.bpmDefaut) headerLines.push(`# BPM: ${meta.bpm || meta.bpmDefaut}`);
  if (meta.tonalite || meta.tonaliteDefaut) headerLines.push(`# Tonalite: ${meta.tonalite || meta.tonaliteDefaut}`);

  const header = headerLines.length > 0 ? `${headerLines.join('\n')}\n\n` : '';
  return `${header}${(rawTxtCode || '').trim()}\n\n${TOADA_TXT_LEGEND}\n`;
}

export function downloadToadaTxtFile(filename, rawTxtCode, meta = {}) {
  const content = generateToadaTxtWithLegend(rawTxtCode, meta);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'toada'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
