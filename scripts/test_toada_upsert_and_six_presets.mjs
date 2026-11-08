/**
 * Test unitaire automatisé — Fusion Intelligente (Upsert JSON) & Pré-intégration des 6 Toadas (< 140 lignes).
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  SIX_TOADA_PRESETS,
  findSixPresetForTitle,
  buildToadaStructure,
  syncSixToadasPresetsToDocs
} from '../src/utils/toadaSixPresetsSync.js';
import {
  executeSmartBatchImport,
  formatAndCleanVaralLyrics
} from '../src/utils/toadaBatchUpsertService.js';
import { toadaToCleanHtml } from '../src/utils/toadaSerializer.js';

console.log('🧪 Démarrage des tests : Fusion Intelligente (Upsert JSON) & 6 Structures Musicales Toadas...');

// 1. Vérification des 6 Toadas de référence dans toadaSixPresetsSync.js
assert.strictEqual(SIX_TOADA_PRESETS.length, 6, 'Doit contenir exactement 6 Toadas de référence');
const expectedBpmMap = {
  'Vou pra Bahia': 100,
  'Morô omim má': 80,
  'Costa Velha': 75,
  'Tem Macaíba': 105,
  'Arreda do Caminho': 65,
  'Senhora do Rosário': 75
};

for (const preset of SIX_TOADA_PRESETS) {
  assert.strictEqual(preset.bpm, expectedBpmMap[preset.titre], `BPM exact attendu pour ${preset.titre}`);
  assert.strictEqual(preset.signatureRythmique, '4/4', `Signature 4/4 attendue pour ${preset.titre}`);
  assert.ok(preset.rawTxtCode && preset.rawTxtCode.includes('[1]'), `rawTxtCode annoté requis pour ${preset.titre}`);

  const struct = buildToadaStructure(preset.rawTxtCode, preset.signatureRythmique);
  assert.ok(struct && struct.totalMeasures > 0, `toadaStructure calculée valide pour ${preset.titre}`);

  const cleanHtml = toadaToCleanHtml(preset.rawTxtCode);
  const textOnly = cleanHtml.replace(/<[^>]+>/g, '');
  assert.ok(!/\[\d+\]/.test(textOnly), `Aucun marqueur [1]..[4] dans parolesOriginales pour ${preset.titre}`);
  assert.ok(!textOnly.includes('_'), `Aucun marqueur _ dans parolesOriginales pour ${preset.titre}`);
  assert.ok(!textOnly.includes('/'), `Aucun marqueur / dans parolesOriginales pour ${preset.titre}`);
  assert.ok(!textOnly.includes('!'), `Aucun marqueur ! dans parolesOriginales pour ${preset.titre}`);
}
assert.ok(findSixPresetForTitle('moro omim ma')?.bpm === 80, 'Recherche tolérante aux accents et à la casse');
assert.ok(findSixPresetForTitle('Senhora do Rosario')?.bpm === 75, 'Recherche tolérante pour Senhora do Rosário');
console.log('✅ 1/4 Données exactes des 6 Toadas et propreté 100 % de parolesOriginales validées.');

// 2. Vérification de la Fusion Intelligente (Upsert sans doublon : updateDoc vs addDoc)
const existingFirestoreDocs = [
  {
    id: 'doc_existing_bahia_123',
    titre: 'Vou pra Bahia',
    categorie: 'Toadas',
    type: 'song',
    groupId: 'samambaia',
    parolesOriginales: '<p><strong>Eu vou pra Bahia brincar</strong><br>Vou vadiar carnaval</p>',
    nacao: 'Estrela Brilhante'
  }
];

const updatedCalls = [];
const addedCalls = [];

const importBatch = [
  {
    titre: 'vou pra bahia', // Doit matcher doc_existing_bahia_123 via normalizeString
    bpm: 100,
    signatureRythmique: '4/4',
    rawTxtCode: SIX_TOADA_PRESETS[0].rawTxtCode
  },
  {
    titre: 'Toada Inédite Nova', // N'existe pas encore -> addDoc
    bpm: 92,
    signatureRythmique: '4/4',
    rawTxtCode: '*[1]Canto [2]novo [3]da na[4]ção*\n[1] _ Res[2]posta [3]do co[4]rão !'
  }
];

const importResult = await executeSmartBatchImport({
  db: null,
  data: importBatch,
  existingDocs: existingFirestoreDocs,
  groupId: 'samambaia',
  category: 'Toadas',
  categoryName: 'Toadas',
  computedType: 'song',
  updateDocFn: async (id, payload) => updatedCalls.push({ id, payload }),
  addDocFn: async (payload) => {
    addedCalls.push(payload);
    return { id: 'doc_created_999' };
  }
});

assert.strictEqual(importResult.updatedCount, 1, '1 fiche existante doit être mise à jour via updateDoc');
assert.strictEqual(importResult.createdCount, 1, '1 nouvelle fiche doit être créée via addDoc');
assert.strictEqual(updatedCalls[0].id, 'doc_existing_bahia_123', 'L’identifiant Firestore existant doit être préservé');
assert.strictEqual(updatedCalls[0].payload.bpm, 100, 'BPM mis à jour sur la fiche existante');
assert.strictEqual(updatedCalls[0].payload.signatureRythmique, '4/4', 'signatureRythmique mise à jour');
assert.ok(updatedCalls[0].payload.toadaStructure?.totalMeasures >= 2, 'toadaStructure calculée et enregistrée');
assert.strictEqual(
  updatedCalls[0].payload.parolesOriginales,
  '<p><strong>Eu vou pra Bahia brincar</strong><br>Vou vadiar carnaval</p>',
  'parolesOriginales existantes préservées intactes'
);
assert.strictEqual(updatedCalls[0].payload.nacao, 'Estrela Brilhante', 'Champs existants préservés');

assert.strictEqual(addedCalls[0].bpm, 92, 'BPM enregistré sur la nouvelle fiche');
assert.ok(!addedCalls[0].parolesOriginales.includes('[1]'), 'parolesOriginales de la nouvelle fiche sans [1]');
assert.ok(!addedCalls[0].parolesOriginales.includes('_'), 'parolesOriginales de la nouvelle fiche sans _');
assert.ok(!addedCalls[0].parolesOriginales.includes('!'), 'parolesOriginales de la nouvelle fiche sans !');
assert.strictEqual(formatAndCleanVaralLyrics('*[1] _ Olá !*'), '<strong>Olá</strong>', 'Nettoyage formatAndCleanVaralLyrics validé');
console.log('✅ 2/4 Fusion Intelligente (Upsert updateDoc / addDoc) et préservation des IDs validées.');

// 3. Vérification de l'auto-sync silencieux des 6 Toadas (syncSixToadasPresetsToDocs)
const mockVaralDocs = [
  { id: 'id_moro', titre: 'Morô omim má', categorie: 'Toadas', rawTxtCode: '' },
  { id: 'id_costa', titre: 'Costa Velha', type: 'song', rawTxtCode: '   ' },
  { id: 'id_macaiba', titre: 'Tem Macaíba', categorie: 'Toadas', rawTxtCode: '*Déjà rempli*' }
];
const autoSyncUpdates = [];
const syncRes = await syncSixToadasPresetsToDocs({
  documents: mockVaralDocs,
  updateDocFn: async (id, payload) => autoSyncUpdates.push({ id, payload })
});
assert.strictEqual(syncRes.updatedCount, 2, 'Seules les 2 fiches avec rawTxtCode vide doivent être injectées');
assert.deepStrictEqual(syncRes.updatedIds, ['id_moro', 'id_costa']);
assert.strictEqual(autoSyncUpdates[0].payload.bpm, 80);
assert.strictEqual(autoSyncUpdates[1].payload.bpm, 75);
console.log('✅ 3/4 Auto-sync silencieux des 6 Toadas (uniquement si rawTxtCode vide) validé.');

// 4. Contrôle strict < 140 lignes et zéro apostrophe
const checkedFiles = [
  'src/utils/toadaSixPresetsSync.js',
  'src/utils/toadaBatchUpsertService.js',
  'src/utils/toadaSerializer.js',
  'src/utils/documentCulturePayloadHelper.js',
  'src/utils/documentSingleSubmitService.js',
  'src/hooks/useDocumentUploadPipeline.js',
  'src/components/pedagogy/ToadasTable.jsx',
  'src/components/documents/form/DocumentFormBatchSection.jsx',
  'src/components/documents/form/DocumentFormToadaFields.jsx'
];
const forbiddenRegex = /(Organizad|Sequenciad|Séquenciad|Cantad|Orquestrad|Orchestrad|Mostrad|Dançad)'[Oo]r/g;

for (const rel of checkedFiles) {
  const content = fs.readFileSync(path.resolve(rel), 'utf8');
  const lines = content.split('\n').length;
  assert.ok(lines < 140, `${rel} dépasse 140 lignes (${lines} lignes)`);
  assert.strictEqual((content.match(forbiddenRegex) || []).length, 0, `Apostrophe interdite dans ${rel}`);
}
console.log('✅ 4/4 Limite stricte < 140 lignes et 0 apostrophe validées sur tous les fichiers.');
console.log('🎉 Tous les tests Upsert Toadas & 6 Structures Musicales sont passés avec succès !');

