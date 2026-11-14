/**
 * Utilitaire de sérialisation, conversion HTML et export/import des Toadas (.txt) (< 145 lignes).
 * Conforme à la Grammaire Vocale v2 (préservation stricte de `<u>` et filtrage de `0`, `𝄽`, `_`, `───`, `/`, `+`).
 */
import { CHORD_REGEX, isSectionHeader } from './toadaMeasureParser.js';
import { normalizeElisionApostrophes } from './vocalGrammarV2.js';

export const TOADA_TXT_LEGEND = `
# ==========================================
# LÉGENDE DU FORMAT TOADA (.txt) O GIRADOR :
# ------------------------------------------
# +     : Anacrouse (mesure d'élan)
# /     : Mesure liée à la précédente
# 0 / 𝄽 : Silence vocal explicite
# _     : Tenue de voyelle ou mélisme legato
# *mot* : Puxador / Soliste (Gras)
# texte : Chœur / Coro (Normal)
# [Dm7] : Accord harmonique ([G/B] renversé)
# [sig:4/4] : Signature rythmique explicite
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
      const content = (m.rawContent || '').trim();
      const lines = content.split(/\r?\n/).map((l, idx) => (idx === 0 ? l.trim() : ` ${l.trim()}`));
      blocks.push(`${prefix}${lines.join('\n')}`);
    }
  }
  return blocks.join('\n\n');
}

export function stripToadaTechnicalMarkers(text = '') {
  if (!text || typeof text !== 'string') return '';
  return normalizeElisionApostrophes(text)
    .replace(/<u\b[^>]*>/gi, '\uE000')
    .replace(/<\/u>/gi, '\uE001')
    .replace(/<([a-z][a-z0-9]*)\b[^>]*>/gi, '\uE002$1\uE003')
    .replace(/<\/([a-z][a-z0-9]*)>/gi, '\uE004$1\uE003')
    .replace(/\[sig:[^\]]+\]/gi, '')
    .replace(/\[(?:sim|nosim)\]/gi, '')
    .replace(/\[\s*(?:PAUSE|SILENCE)[^\]]*\]/gi, '')
    .replace(CHORD_REGEX, '')
    .replace(/^\s*(\*{0,3}\s*)[+/!]+\s*/gm, '$1')
    .replace(/(^|\n)\s*[\/!]+(?=\*|[\p{L}[\uE000])/gu, '$1')
    .replace(/(?:^|(?<=[\s*\]\uE003]))0(?=$|[\s*\[\uE000\uE002\uE004])/gu, '')
    .replace(/\[(?:M\d+[•.:\u00b7])?(?:\d+(?:\.\d+)?|\+)\]/gi, '')
    .replace(/(?<![\p{L}\d])0(?![\p{L}\d])/gu, '')
    .replace(/[𝄽_!]/gu, '')
    .replace(/───/g, '')
    .replace(/(^|\s|\*)\+\s+/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .replace(/\uE002([a-z][a-z0-9]*)\uE003/gi, '<$1>')
    .replace(/\uE004([a-z][a-z0-9]*)\uE003/gi, '</$1>')
    .replace(/\uE000/g, '<u>')
    .replace(/\uE001/g, '</u>');
}

export function toadaToCleanHtml(rawTxtCode = '') {
  if (!rawTxtCode || typeof rawTxtCode !== 'string') return '';
  if (/<(?!\/?u\b)[a-z][\s\S]*>/i.test(rawTxtCode)) {
    return stripToadaTechnicalMarkers(rawTxtCode).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  }

  const normalizedTxt = rawTxtCode.replace(/\*([^*]+)\*/g, (_, inner) =>
    inner.split(/\r?\n/).map((part) => (part.trim() ? `*${part.trim()}*` : '')).join('\n')
  );

  const paragraphs = normalizedTxt.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const htmlParas = [];

  for (const para of paragraphs) {
    const lines = para.split(/\r?\n/);
    if (isSectionHeader(lines[0])) {
      const secTitle = lines[0].replace(/^\s*\[|\]\s*$/g, '').trim();
      htmlParas.push(`<h4 class="toada-section-title">${secTitle}</h4>`);
      lines.shift();
      if (lines.length === 0) continue;
    }
    const cleanLines = lines
      .map((line) => stripToadaTechnicalMarkers(line).replace(/\*([^*]+)\*/g, '<strong>$1</strong>'))
      .filter((c) => c.replace(/<[^>]+>/g, '').trim().length > 0);
    if (cleanLines.length > 0) htmlParas.push(`<p>${cleanLines.join('<br>')}</p>`);
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
