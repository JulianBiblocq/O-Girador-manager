/**
 * Test unitaire et de robustesse de tablatureFormatter.js
 */
import assert from 'assert';
import { formatPieceTablature, generateTablatureCore, INSTRUMENTS_CATALOG } from '../src/utils/tablatureFormatter.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : FORMATAGE DE TABLATURE TEXTUELLE (TRIPTYQUE)");
console.log("===============================================================\n");

// 1. Catalogue des instruments
console.log("▶️ Test 1 : Catalogue des instruments");
assert.ok(INSTRUMENTS_CATALOG.length >= 12, "Le catalogue doit contenir les instruments principaux");
assert.ok(INSTRUMENTS_CATALOG.some(i => i.id === 'marcante' && i.type === 'hands'), "Marcante doit être de type hands");
assert.ok(INSTRUMENTS_CATALOG.some(i => i.id === 'apito'), "Apito doit être présent dans le catalogue");
assert.ok(INSTRUMENTS_CATALOG.some(i => i.id === 'puxador' && i.type === 'voice'), "Puxador doit être de type voice");
console.log("  ✅ [PASS] Catalogue des instruments validé.");

// 2. Résilience sur données nulles ou anormales
console.log("\n▶️ Test 2 : Résilience aux données nulles / malformées");
assert.strictEqual(formatPieceTablature(null), "", "Doit retourner une chaîne vide sur null");
assert.strictEqual(formatPieceTablature(undefined), "", "Doit retourner une chaîne vide sur undefined");
assert.strictEqual(formatPieceTablature({}), "", "Doit retourner une chaîne vide sur objet vide");
assert.strictEqual(formatPieceTablature({ tracks: "non-array" }), "", "Doit tolérer un type incorrect sans planter");
assert.strictEqual(formatPieceTablature({ tracks: [{ patterns: null }] }), "", "Doit gérer les pistes avec patterns nuls");
console.log("  ✅ [PASS] Résilience totale validée (aucun crash).");

// 3. Formatage d'un Preset complet
console.log("\n▶️ Test 3 : Formatage d'un Preset complet avec pistes régulières et exclusion voix/apito");
const samplePreset = {
  bpm: 112,
  timeSig: '4/4',
  totalMeasures: 2,
  metadata: {
    toada: 'Baque Luanda',
    compositor: 'Mestre Salustiano',
    ritmo: 'Baque Virado'
  },
  letras: 'Ô Luanda, terra de meu pai...',
  tracks: [
    {
      id: 1,
      instrumentIdx: 0, // marcante
      patterns: [
        {
          id: 101,
          steps: 16,
          activeSteps: ['D', 0, 0, 0, 'E', 0, 0, 0, 'D', 0, 0, 0, 'E', 0, 0, 0],
          measureAssignments: { 0: true, 1: true }
        }
      ]
    },
    {
      id: 2,
      instrumentIdx: 3, // caixa
      patterns: [
        {
          id: 102,
          steps: 16,
          activeSteps: ['D', 'e', 'D', 'e', 'D', 'e', 'D', 'e', 'D', 'e', 'D', 'e', 'D', 'e', 'D', 'e'],
          measureAssignments: { 0: true, 1: true }
        }
      ]
    },
    {
      id: 3,
      instrumentIdx: 9, // apito -> doit être exclu
      patterns: [
        {
          id: 103,
          steps: 16,
          activeSteps: ['X', 0, 'X', 0],
          measureAssignments: { 0: true }
        }
      ]
    },
    {
      id: 4,
      instrumentIdx: 10, // puxador -> doit être exclu
      patterns: [
        {
          id: 104,
          steps: 16,
          activeSteps: ['A', 'B'],
          measureAssignments: { 0: true }
        }
      ]
    }
  ]
};

const formatted = formatPieceTablature(samplePreset);
assert.ok(formatted.includes("TITRE : BAQUE LUANDA"), "Le titre doit être affiché");
assert.ok(formatted.includes("COMPOSITEUR : Mestre Salustiano"), "Le compositeur doit être affiché");
assert.ok(formatted.includes("RYTHME : Baque Virado"), "Le rythme doit être affiché");
assert.ok(formatted.includes("TEMPO DE BASE : 112 BPM"), "Le tempo doit être affiché");
assert.ok(formatted.includes("Marcante"), "Marcante doit être présent dans la tablature");
assert.ok(formatted.includes("Caixa"), "Caixa doit être présente dans la tablature");
assert.ok(!formatted.includes("Apito"), "Apito doit être exclu de la tablature");
assert.ok(!formatted.includes("Puxador"), "Puxador doit être exclu de la tablature");
assert.ok(formatted.includes("Ô Luanda, terra de meu pai..."), "Les paroles doivent être présentes");
console.log("  ✅ [PASS] Preset complet formaté avec succès.");

// 4. Test d'un Motif unitaire (Pattern)
console.log("\n▶️ Test 4 : Formatage d'un motif individuel (Pattern)");
const samplePattern = {
  name: 'Virada Alfaia',
  steps: 8,
  activeSteps: ['D', 'D', 'E', 0, 'D', 'E', 'D', 0]
};
const patFormatted = formatPieceTablature(samplePattern);
assert.ok(patFormatted.includes("TITRE : VIRADA ALFAIA"), "Le nom du motif doit être affiché");
assert.ok(patFormatted.includes("[ Motif ]"), "Le bloc Motif doit être présent");
assert.ok(patFormatted.includes("D D E - D E D -"), "Les steps doivent être correctement transcrits");
console.log("  ✅ [PASS] Motif individuel formaté avec succès.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS : TOUS LES TESTS TABLATURE SONT VALIDÉS !");
console.log("===============================================================\n");
