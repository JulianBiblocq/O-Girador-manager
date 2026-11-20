// Test automatisé : Impression adaptative centrée, préférences profil/presets, couverture & sommaire Carnet (< 138 lignes).
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';
import {
  BUILTIN_TOADA_PRINT_PRESETS,
  normalizePrintSections,
  normalizeCustomPresets,
  arePrintConfigsEqual,
  detectActiveBuiltinPreset,
  resolveToadaPrintDensity
} from '../src/utils/toadaPrintPrefsUtils.js';
import {
  extractCleanSongLyrics,
  parseLineSegments,
  countNonEmptyLyricsLines,
  resolveLyricsColumnsMode
} from '../src/utils/songCardLyricsUtils.js';
import {
  filterSongbookCandidates,
  sortAndIndexSongbookSongs,
  groupIndexedSongsForToc
} from '../src/utils/songbookSortUtils.js';

console.log('🧪 TEST : Impression adaptative Toadas, Presets Profil & Carnet de chants...');

// 1. Plafond strict < 140 lignes sur tous les modules créés et modifiés
const targetModules = [
  'src/utils/toadaPrintMarginsUtils.js',
  'src/utils/toadaPrintPrefsUtils.js',
  'src/hooks/useToadaPrintPrefs.js',
  'src/utils/songCardLyricsUtils.js',
  'src/utils/songbookSortUtils.js',
  'src/utils/toadaPrintRunner.js',
  'src/hooks/useAssociationPrintBranding.js',
  'src/hooks/useSongCardController.js',
  'src/styles/toada-print.css',
  'src/components/pedagogy/print/ToadaPrintMarginsControl.jsx',
  'src/components/pedagogy/print/ToadaPrintControlsPanel.jsx',
  'src/components/pedagogy/print/SongbookExtraControls.jsx',
  'src/components/pedagogy/print/SongbookCoverPage.jsx',
  'src/components/pedagogy/print/SongbookTocPage.jsx',
  'src/components/pedagogy/print/PrintableSongbook.jsx',
  'src/components/song/SongCardLyricsSingleCol.jsx',
  'src/components/song/SongCardLyricsSection.jsx',
  'src/components/song/SongCardDetailsSection.jsx',
  'src/components/song/SongCardHeader.jsx',
  'src/components/PrintConfigModal.jsx',
  'src/components/SongCard.jsx',
  'src/components/documents/varal/VaralCategoryRopeActions.jsx',
  'src/components/documents/varal/VaralCategoryRope.jsx',
  'src/components/pedagogy/PedagogyDocumentsView.jsx',
  'src/components/member/MemberRepertoireHeader.jsx',
  'src/components/member/MemberRepertoireView.jsx',
  'src/components/member/PieceLyricsModal.jsx',
  'src/components/student/StudentToadasProgress.jsx'
];

for (const rel of targetModules) {
  const full = path.resolve(rel);
  assert(fs.existsSync(full), `Fichier manquant : ${rel}`);
  const txt = fs.readFileSync(full, 'utf8');
  const lines = txt.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;
  assert(lines < 140, `Plafond < 140 lignes dépassé dans ${rel} (${lines} lignes)`);
}
console.log(`  ✅ [1/5] ${targetModules.length} modules vérifiés strictement < 140 lignes.`);

// 2. Parité i18n stricte 1:1 fr.toadaPrint / pt.toadaPrint
const frKeys = Object.keys(fr.toadaPrint || {});
const ptKeys = Object.keys(pt.toadaPrint || {});
assert.deepStrictEqual(frKeys, ptKeys, 'Parité 1:1 stricte requise entre fr.toadaPrint et pt.toadaPrint');
assert(frKeys.length >= 40, 'Dictionnaire toadaPrint complet requis');
for (const k of frKeys) {
  assert(typeof fr.toadaPrint[k] === 'string' && fr.toadaPrint[k].trim().length > 0, `fr.toadaPrint.${k} vide`);
  assert(typeof pt.toadaPrint[k] === 'string' && pt.toadaPrint[k].trim().length > 0, `pt.toadaPrint.${k} vide`);
}
console.log(`  ✅ [2/5] Parité i18n 1:1 validée (${frKeys.length} clés FR/PT).`);

// 3. Presets rapides, limite 2 presets perso & densité Zoom Confort
assert.strictEqual(BUILTIN_TOADA_PRINT_PRESETS.length, 3);
assert.strictEqual(detectActiveBuiltinPreset({ original: true, phonetic: false, translation: false, lexicon: false, anecdote: false }), 'pupitre');
assert.strictEqual(detectActiveBuiltinPreset({ original: true, phonetic: false, translation: true, lexicon: false, anecdote: true }), 'etude');
const normLegacy = normalizePrintSections({ originale: true, phonetique: false, traduction: true, lexique: false, anecdote: false });
assert.strictEqual(normLegacy.original, true);
assert.strictEqual(normLegacy.phonetic, false);
assert.strictEqual(normLegacy.translation, true);
const capped = normalizeCustomPresets([{ name: 'A', config: {} }, { name: 'B', config: {} }, { name: 'C', config: {} }]);
assert.strictEqual(capped.length, 2, 'Maximum 2 presets personnalisés');
assert(arePrintConfigsEqual({ format: 'A5', bwMode: true }, { format: 'A5', isBW: true }));
assert.strictEqual(resolveToadaPrintDensity({ activeLangCount: 1, hasBottomSections: false }), 'pupitre');
assert.strictEqual(resolveToadaPrintDensity({ activeLangCount: 1, hasBottomSections: true }), 'comfort');
assert.strictEqual(resolveToadaPrintDensity({ activeLangCount: 2, hasBottomSections: true }), 'compact');
console.log('  ✅ [3/5] Presets, normalisation hybride et échelle Zoom Confort validés.');

// 4. Étanchéité parolesOriginales (jamais rawTxtCode), gras Puxador & arbitrage colonnes
const mockSong = {
  parolesOriginales: '<p><strong>[1] <u>Ô</u> Lu_an<u>d</u>a</strong></p><p>Chœur <u>d</u>e ré_ponse [2]</p>',
  rawTxtCode: 'NE_JAMAIS_LIRE_CE_CODE_BRUT [99]'
};
const { origLines } = extractCleanSongLyrics(mockSong);
assert.strictEqual(countNonEmptyLyricsLines(origLines), 2);
const seg0 = parseLineSegments(origLines[0]);
const seg1 = parseLineSegments(origLines[1]);
assert.strictEqual(seg0[0].isBold, true);
assert.strictEqual(seg0[0].text, 'Ô Luanda');
assert.strictEqual(seg1[0].isBold, false);
assert.strictEqual(seg1[0].text, 'Chœur de réponse');
assert.strictEqual(resolveLyricsColumnsMode({ mode: 'auto', nonEmptyLineCount: 10, hasBottomSections: true }), 'single-centered');
assert.strictEqual(resolveLyricsColumnsMode({ mode: 'auto', nonEmptyLineCount: 18, hasBottomSections: false }), 'single-centered');
assert.strictEqual(resolveLyricsColumnsMode({ mode: 'auto', nonEmptyLineCount: 18, hasBottomSections: true }), 'two-columns');
assert.strictEqual(resolveLyricsColumnsMode({ mode: 'single-centered', nonEmptyLineCount: 24, hasBottomSections: true }), 'single-centered');
assert.strictEqual(resolveLyricsColumnsMode({ mode: 'two-columns', nonEmptyLineCount: 6, hasBottomSections: false }), 'two-columns');
console.log('  ✅ [4/5] Étanchéité parolesOriginales, gras Puxador et arbitrage colonnes validés.');

// 5. Filtrage archives, tri Carnet (titre, rythme, nação) et indexation #01...
const songsSample = [
  { id: 's1', titre: 'Zumbi', nacao: 'Estrela Brilhante', rythme: 'Baque Parado' },
  { id: 's2', titre: 'Aruanda', nacao: 'Porto Rico', rythme: 'Luanda' },
  { id: 's3', titre: 'Chant Ancien', nacao: 'Porto Rico', rythme: 'Martelo', isArchived: true }
];
assert.strictEqual(filterSongbookCandidates(songsSample, { includeArchived: false }).length, 2);
assert.strictEqual(filterSongbookCandidates(songsSample, { includeArchived: true }).length, 3);
const byTitle = sortAndIndexSongbookSongs(filterSongbookCandidates(songsSample), { sortBy: 'title' });
assert.strictEqual(byTitle[0].formattedIndex, '#01');
assert.strictEqual(byTitle[0].song.titre, 'Aruanda');
const byRhythm = sortAndIndexSongbookSongs(filterSongbookCandidates(songsSample), { sortBy: 'rhythm' });
assert.strictEqual(byRhythm[0].song.rythme, 'Baque Parado');
const tocGroups = groupIndexedSongsForToc(byRhythm, 'rhythm');
assert.strictEqual(tocGroups.length, 2);
assert.strictEqual(tocGroups[0].groupTitle, 'Baque Parado');
console.log('  ✅ [5/5] Filtrage archives, tri et sommaire indexé (#01...) validés.');
console.log('🏆 SUCCÈS TOTAL : IMPRESSION ADAPTATIVE & CARNET DE CHANTS 100% VALIDÉS !');
