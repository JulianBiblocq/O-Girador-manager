/**
 * Test unitaire : Normalisation et découpage des paroles dans SongCardLyricsSection
 * Vérifie que normalizeToLineArray et parseLineSegments gèrent sans erreur tous les formats de données,
 * en particulier les objets { puxador, coro, isMixed, segments } issus de parseLyricsString.
 */
import assert from 'node:assert';
import { parseLyricsString } from '../src/utils/lyricsParser.js';

console.log('🧪 Test: Normalisation et sécurisation des paroles pour SongCard...');

// Reproduit la logique interne de SongCardLyricsSection
const CHORD_STRIP_REGEX = /\[[A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*\]/g;
const SECTION_STRIP_REGEX = /^\s*\[(?!(?:[A-G][b#]?))[^\]]+\]\s*$/i;

function cleanVaralLyrics(text) {
  if (typeof text !== 'string') return text ? String(text) : '';
  return text.replace(/\[\d+\]/g, '').replace(/\[sig:[^\]]+\]/gi, '').replace(/_/g, '');
}

function normalizeToLineArray(content) {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.flatMap((c) => normalizeToLineArray(c));
  }
  if (typeof content === 'object') {
    if (Array.isArray(content.lines)) {
      return content.lines.flatMap((c) => normalizeToLineArray(c));
    }
    if (typeof content.text === 'string' && !content.puxador && !content.coro && !content.segments) {
      return normalizeToLineArray(content.text);
    }
    return [content];
  }
  if (typeof content !== 'string') {
    return [String(content)];
  }

  const cleaned = cleanVaralLyrics(content);
  if (/<[a-z][\s\S]*>/i.test(cleaned)) {
    const parsed = parseLyricsString(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.flatMap((c) => normalizeToLineArray(c));
    }
    const clean = cleaned
      .replace(/<p\b[^>]*>\s*(?:<br\b[^>]*>|&nbsp;|\s)*<\/p>/gi, '\n\n')
      .replace(/<\/p>|<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return clean.split(/\r?\n/).map((l) => l.trim());
  }
  return cleaned.split(/\r?\n/).map((l) => l.trim());
}

function parseLineSegments(line) {
  if (!line) return [];
  if (typeof line !== 'string') {
    if (line.segments && Array.isArray(line.segments)) {
      return line.segments.map((seg) => ({
        text: typeof seg.text === 'string' ? cleanVaralLyrics(seg.text) : (seg.text || ''),
        isBold: Boolean(seg.isBold)
      }));
    }
    if (line.puxador && (line.coro || line.choeur)) {
      return [
        { text: cleanVaralLyrics(line.puxador), isBold: true },
        { text: ' ' + cleanVaralLyrics(line.coro || line.choeur), isBold: false }
      ];
    }
    if (line.puxador) return [{ text: cleanVaralLyrics(line.puxador), isBold: true }];
    if (line.coro || line.choeur) return [{ text: cleanVaralLyrics(line.coro || line.choeur), isBold: false }];
    if (line.text) return [{ text: cleanVaralLyrics(line.text), isBold: Boolean(line.isBold) }];
    return [];
  }

  if (SECTION_STRIP_REGEX.test(line)) return [];

  const clean = line
    .replace(/^\s*[+/]\s*/, '')
    .replace(CHORD_STRIP_REGEX, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[sig:[^\]]+\]/gi, '')
    .replace(/_/g, '')
    .replace(/(^|\s|\*)\+\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) return [];

  return clean.split(/(\*[^*]+\*)/g).filter(Boolean).map((p) => {
    const isBold = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    return { text: isBold ? p.slice(1, -1) : p, isBold };
  });
}

// 1. Test avec du HTML riche contenant Puxador en gras
const richHtml = `
<p><strong>Ô marinheiro</strong></p>
<p>o barco vai navegar</p>
<p><strong>Vem cá,</strong> vem ver o mar balançar</p>
`;
const lines = normalizeToLineArray(richHtml);
assert.strictEqual(lines.length, 3, 'Doit retourner 3 lignes');
assert.strictEqual(typeof lines[0], 'object', 'Ligne 1 doit être un objet puxador');
assert.strictEqual(lines[0].puxador, 'Ô marinheiro');

// Vérification que parseLineSegments traite les lignes sans crash ni split error
const segs0 = parseLineSegments(lines[0]);
assert.strictEqual(segs0.length, 1);
assert.strictEqual(segs0[0].isBold, true);
assert.strictEqual(segs0[0].text, 'Ô marinheiro');

const segs1 = parseLineSegments(lines[1]);
assert.strictEqual(segs1.length, 1);
assert.strictEqual(segs1[0].isBold, false);
assert.strictEqual(segs1[0].text, 'o barco vai navegar');

const segs2 = parseLineSegments(lines[2]);
assert.strictEqual(segs2.length, 2);
assert.strictEqual(segs2[0].isBold, true);
assert.strictEqual(segs2[1].isBold, false);
console.log('✅ Cas 1 validé : HTML avec gras découpé en objets et segments sans aucune erreur.');

// 2. Test avec tableau d'objets directs
const objArray = [
  { puxador: 'Solo A' },
  { coro: 'Coro B' },
  { isMixed: true, segments: [{ text: 'Solo', isBold: true }, { text: ' Chœur', isBold: false }] }
];
const normObjs = normalizeToLineArray(objArray);
assert.strictEqual(normObjs.length, 3);
assert.strictEqual(parseLineSegments(normObjs[0])[0].text, 'Solo A');
assert.strictEqual(parseLineSegments(normObjs[1])[0].text, 'Coro B');
assert.strictEqual(parseLineSegments(normObjs[2]).length, 2);
console.log('✅ Cas 2 validé : Tableau d\'objets bruts géré sans exception t.split.');

// 3. Test avec texte brut et nouvelles lignes
const rawText = "Ligne 1\n*Puxador*\nLigne 3";
const normRaw = normalizeToLineArray(rawText);
assert.strictEqual(normRaw.length, 3);
assert.strictEqual(parseLineSegments(normRaw[1])[0].isBold, true);
console.log('✅ Cas 3 validé : Texte brut avec astérisques markdown préservé.');

// 4. Test avec entrées nulles, vides, ou imprévues
assert.deepStrictEqual(normalizeToLineArray(null), []);
assert.deepStrictEqual(normalizeToLineArray(undefined), []);
assert.deepStrictEqual(normalizeToLineArray(''), []);
assert.deepStrictEqual(parseLineSegments(null), []);
assert.deepStrictEqual(parseLineSegments(''), []);
assert.deepStrictEqual(parseLineSegments('[Refrain]'), []);
console.log('✅ Cas 4 validé : Résilience aux valeurs nulles et en-têtes [Refrain].');

console.log('🎉 TOUS LES TESTS DE NORMALISATION ET DÉCOUPAGE SONG_CARD ONT RÉUSSI !');
