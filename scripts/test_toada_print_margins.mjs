// Test unitaire : Marges d'impression, gouttière de reliure (@page :left/:right) & persistance profil (< 138 lignes).
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';
import {
  DEFAULT_PRINT_MARGINS,
  normalizePrintMargins,
  arePrintMarginsEqual,
  buildToadaPrintPageCss
} from '../src/utils/toadaPrintMarginsUtils.js';
import {
  normalizePrintConfig,
  normalizeCustomPresets,
  buildPersistedToadaPrintPrefs,
  arePrintConfigsEqual
} from '../src/utils/toadaPrintPrefsUtils.js';

console.log('🧪 TEST : Marges d\'impression & Marge de reliure (Fiche seule & Carnet de chants)...');

function countLines(rel) {
  const txt = fs.readFileSync(path.resolve(rel), 'utf8');
  return txt.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;
}

function assertNoUndefinedOrNullDeep(obj, trail = 'root') {
  assert.notStrictEqual(obj, undefined, `Valeur undefined interdite sur ${trail}`);
  assert.notStrictEqual(obj, null, `Valeur null interdite sur ${trail}`);
  if (typeof obj === 'number') assert(Number.isFinite(obj), `Nombre non fini sur ${trail}`);
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => assertNoUndefinedOrNullDeep(item, `${trail}[${i}]`));
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      assertNoUndefinedOrNullDeep(v, `${trail}.${k}`);
    }
  }
}

// 1. Vérification des plafonds anti-monolithe stricts
const budgets = [
  ['src/utils/toadaPrintMarginsUtils.js', 100],
  ['src/components/pedagogy/print/ToadaPrintMarginsControl.jsx', 120],
  ['src/components/pedagogy/print/ToadaPrintControlsPanel.jsx', 135],
  ['src/utils/toadaPrintPrefsUtils.js', 140],
  ['src/hooks/useToadaPrintPrefs.js', 140],
  ['src/utils/toadaPrintRunner.js', 140],
  ['src/styles/toada-print.css', 140],
  ['src/components/SongCard.jsx', 140],
  ['src/components/PrintConfigModal.jsx', 140],
  ['src/hooks/useSongCardController.js', 140],
  ['src/components/pedagogy/print/PrintableSongbook.jsx', 140]
];
for (const [file, cap] of budgets) {
  const n = countLines(file);
  assert(n < cap, `Plafond < ${cap} L dépassé dans ${file} (${n} L)`);
}
console.log('  ✅ [1/5] Plafonds stricts (< 100 / < 120 / < 135 / < 140 lignes) respectés.');

// 2. Rétrocompatibilité & bornage strict (0..35 mm pour custom, 0..25 mm pour gutterMm)
assert.deepStrictEqual(normalizePrintMargins(undefined), DEFAULT_PRINT_MARGINS);
assert.deepStrictEqual(normalizePrintMargins({ preset: 'narrow' }), {
  preset: 'narrow', top: 6, right: 6, bottom: 6, left: 6, gutterMm: 0, bindingSide: 'left'
});
assert.deepStrictEqual(normalizePrintMargins({ preset: 'wide', gutterMm: 15, bindingSide: 'alternating' }), {
  preset: 'wide', top: 18, right: 18, bottom: 18, left: 18, gutterMm: 15, bindingSide: 'alternating'
});
const clamped = normalizePrintMargins({
  preset: 'custom', top: -8, right: 50, bottom: 0, left: 14, gutterMm: 42, bindingSide: 'unknown'
});
assert.deepStrictEqual(clamped, {
  preset: 'custom', top: 0, right: 35, bottom: 0, left: 14, gutterMm: 25, bindingSide: 'left'
});
assert(arePrintMarginsEqual(undefined, { preset: 'normal', top: 12, right: 12, bottom: 12, left: 12 }));
console.log('  ✅ [2/5] Rétrocompatibilité profil existant et bornage mm validés.');

// 3. Calcul exact de la règle CSS @page (narrow, normal, custom, left vs alternating :left/:right)
assert.strictEqual(
  buildToadaPrintPageCss({ format: 'A4', margins: { preset: 'narrow' } }),
  '@page { size: A4 portrait; margin: 6mm 6mm 6mm 6mm; }'
);
assert.strictEqual(
  buildToadaPrintPageCss({ format: 'A4', margins: { preset: 'normal', gutterMm: 8, bindingSide: 'left' } }),
  '@page { size: A4 portrait; margin: 12mm 12mm 12mm 20mm; }'
);
assert.strictEqual(
  buildToadaPrintPageCss({ format: 'A4', margins: { preset: 'normal', gutterMm: 0, bindingSide: 'alternating' } }),
  '@page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }'
);
const altCss = buildToadaPrintPageCss({
  format: 'A5',
  margins: { preset: 'custom', top: 10, right: 8, bottom: 14, left: 10, gutterMm: 15, bindingSide: 'alternating' }
});
assert.strictEqual(
  altCss,
  [
    '@page { size: A5 portrait; margin: 10mm 8mm 14mm 10mm; }',
    '@page :right { margin-left: 25mm; margin-right: 8mm; }',
    '@page :left { margin-left: 10mm; margin-right: 23mm; }'
  ].join('\n')
);
console.log('  ✅ [3/5] Règles CSS @page (simple, reliure gauche et recto-verso :right/:left) validées.');

// 4. Persistance profil (defaultConfig) & customPresets garantie 0 undefined / 0 null
const legacyCfg = normalizePrintConfig({ format: 'A5', bwMode: true });
assert.deepStrictEqual(legacyCfg.margins, DEFAULT_PRINT_MARGINS);
assert(!arePrintConfigsEqual(legacyCfg, { ...legacyCfg, margins: { preset: 'narrow' } }));

const persistedWithDefault = buildPersistedToadaPrintPrefs({
  defaultConfig: { format: 'A5', margins: { preset: 'narrow', gutterMm: 8, bindingSide: 'alternating', extra: undefined } },
  customPresets: [{ name: 'Livret Relié', config: { format: 'A5', margins: { preset: 'custom', top: 9, left: undefined, gutterMm: 15, bindingSide: 'alternating' } } }],
  updatedAt: '2026-11-20T04:00:00.000Z'
});
assertNoUndefinedOrNullDeep(persistedWithDefault);
assert.strictEqual(persistedWithDefault.defaultConfig.margins.preset, 'narrow');
assert.strictEqual(persistedWithDefault.defaultConfig.margins.gutterMm, 8);
assert.strictEqual(persistedWithDefault.customPresets[0].config.margins.top, 9);
assert.strictEqual(persistedWithDefault.customPresets[0].config.margins.left, 12);

const persistedWithoutDefault = buildPersistedToadaPrintPrefs({ defaultConfig: null, customPresets: normalizeCustomPresets([]) });
assertNoUndefinedOrNullDeep(persistedWithoutDefault);
assert(!('defaultConfig' in persistedWithoutDefault));
console.log('  ✅ [4/5] Persistance Firestore & presets sans aucun undefined ni null validée.');

// 5. Fidélité millimétrique CSS (.print-song-page padding: 0) & parité i18n FR/PT
const printCss = fs.readFileSync(path.resolve('src/styles/toada-print.css'), 'utf8');
assert(printCss.includes('padding: 0 !important;') && printCss.includes('margin: 0 !important;'));
assert.deepStrictEqual(Object.keys(fr.toadaPrint), Object.keys(pt.toadaPrint));
assert(fr.toadaPrint.marginsBrowserHint.includes('Marges : Par défaut'));
console.log('  ✅ [5/5] Zéro padding parasite @media print et parité i18n FR/PT validés.');
console.log('🏆 SUCCÈS TOTAL : MARGES D\'IMPRESSION & RELIURE 100% VALIDÉES !');
