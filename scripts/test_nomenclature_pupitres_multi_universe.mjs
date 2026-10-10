import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getUniverseNomenclaturePresets,
  getUniverseRolesList,
  getDefaultUniverseNomenclature,
  getUniverseAccordionTitle,
  getUniverseNomenclatureTabTitle,
  BATUCADA_PRESETS,
  DEFAULT_BATUCADA_NOMENCLATURE,
  BATUCADA_STANDARD_ROLES,
  SAMBA_ENREDO_ROLES,
  UNIVERSE_DEFAULT_LINKED_INSTRUMENTS
} from '../src/constants/universeNomenclaturePresets.js';

import {
  DEFAULT_MARACATU_NOMENCLATURE,
  MARACATU_ROLES_LIST
} from '../src/constants/nomenclature.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== TEST SUITE : NOMENCLATURE & PUPITRES MULTI-UNIVERS ===");

// Test 1 : Titres dynamiques de bandeau et d'onglet
console.log("\n▶️ Test 1 : Titres dynamiques selon l'univers");
assert.strictEqual(
  getUniverseAccordionTitle('batucada'),
  "Pupitres & nomenclature (Batucada / Samba de rue)",
  "Le titre Batucada par défaut doit être exact"
);
assert.strictEqual(
  getUniverseAccordionTitle('batucada', 'Samba-Reggae / Bloco'),
  "Pupitres & nomenclature (Samba-Reggae / Bloco)",
  "Le titre Batucada avec preset Samba-Reggae doit être exact"
);
assert.strictEqual(
  getUniverseAccordionTitle('maracatu'),
  "Pupitres, tambours & nomenclature (Baque Virado Traditionnel)",
  "Le titre Maracatu doit être exact et strict"
);
assert.strictEqual(
  getUniverseAccordionTitle('maracatu', 'Baque Virado Traditionnel'),
  "Pupitres, tambours & nomenclature (Baque Virado Traditionnel)",
  "Le titre Maracatu avec preset par défaut ne doit pas répéter de parenthèses"
);
assert.strictEqual(
  getUniverseAccordionTitle(null),
  "Pupitres, tambours & nomenclature (Baque Virado Traditionnel)",
  "Le titre par défaut sans univers doit être Maracatu"
);
assert.strictEqual(
  getUniverseNomenclatureTabTitle('maracatu'),
  "🎵 Nomenclature & Voix (Marcante, Meião...)",
  "L'onglet Maracatu doit afficher les exemples Maracatu"
);
assert.strictEqual(
  getUniverseNomenclatureTabTitle('batucada'),
  "🎵 Nomenclature & Voix (Surdo 1, 2, 3...)",
  "L'onglet Batucada doit afficher les exemples Batucada"
);
console.log("  ✅ [PASS] Titres dynamiques validés.");

// Test 2 : Presets Batucada
console.log("\n▶️ Test 2 : Presets adaptés à l'univers Batucada");
const batucadaPresets = getUniverseNomenclaturePresets('batucada');
assert.strictEqual(batucadaPresets.length, 2, "Batucada propose exactement 2 presets");

const preset1 = batucadaPresets.find(p => p.id === 'batucada_standard');
assert(preset1, "Preset 1 'batucada_standard' existe");
assert.strictEqual(preset1.label, "Batucada Standard (Escola / Rue)", "Label du preset 1 = 'Batucada Standard (Escola / Rue)'");

assert.strictEqual(preset1.mapping.surdo_1, 'Surdo 1');
assert.strictEqual(preset1.mapping.surdo_2, 'Surdo 2');
assert.strictEqual(preset1.mapping.surdo_3, 'Surdo 3');
assert.strictEqual(preset1.mapping.repique, 'Repique');
assert.strictEqual(preset1.mapping.caixa, 'Caixa');
assert.strictEqual(preset1.mapping.tamborim, 'Tamborim');
assert.strictEqual(preset1.mapping.agogo, 'Agogô');
assert.strictEqual(preset1.mapping.chocalho, 'Chocalho');
assert.strictEqual(preset1.mapping.timba, 'Timbal');
assert.strictEqual(preset1.mapping.apito, 'Apito');
assert.strictEqual(preset1.mapping.direction, 'Directeur de batterie');

const preset2 = batucadaPresets.find(p => p.id === 'samba_reggae_bloco');
assert(preset2, "Preset 2 'samba_reggae_bloco' existe");
assert.strictEqual(preset2.label, "Samba-Reggae / Bloco", "Label du preset 2 = 'Samba-Reggae / Bloco'");

assert.strictEqual(preset2.mapping.surdo_1, 'Surdo Fundo');
assert.strictEqual(preset2.mapping.surdo_2, 'Surdo Resposta');
assert.strictEqual(preset2.mapping.surdo_3, 'Surdo Dobra');
assert.strictEqual(preset2.mapping.repique, 'Repique');
assert.strictEqual(preset2.mapping.caixa, 'Caixa');
assert.strictEqual(preset2.mapping.timba, 'Timbal');

console.log("  ✅ [PASS] Presets 'Batucada Standard (Escola / Rue)' et 'Samba-Reggae / Bloco' conformes.");

// Test 3 : Grille des rôles selon le preset
console.log("\n▶️ Test 3 : Rôles dynamiques selon le preset sélectionné");
const rolesStandard = getUniverseRolesList('batucada', 'batucada_standard');
assert.strictEqual(rolesStandard.length, 11, "Batucada Standard a 11 rôles");
const rolesSambaReggae = getUniverseRolesList('batucada', 'samba_reggae_bloco');
assert.strictEqual(rolesSambaReggae.length, 11, "Samba-Reggae a 11 rôles");

const maracatuRoles = getUniverseRolesList('maracatu');
assert.strictEqual(maracatuRoles.length, 13, "Maracatu conserve ses 13 voix traditionnelles");

const maracatuPresets = getUniverseNomenclaturePresets('maracatu');
assert.strictEqual(maracatuPresets.length, 3, "Maracatu conserve strictement ses 3 presets");
assert.strictEqual(maracatuPresets[0].name, 'Baque Virado Traditionnel');
assert.strictEqual(maracatuPresets[1].name, 'Tradition Candomblé / Tambores');
assert.strictEqual(maracatuPresets[2].name, 'Organologique & Fonctionnel');

console.log("  ✅ [PASS] Grilles de rôles dynamiques et rétrocompatibilité Maracatu validées.");

// Test 4 : Initialisation et Liaison automatique des Surdos
console.log("\n▶️ Test 4 : Liaison automatique des Surdos");
const defaultLinked = UNIVERSE_DEFAULT_LINKED_INSTRUMENTS.batucada;
assert.strictEqual(defaultLinked.length, 1);
assert.strictEqual(defaultLinked[0].name, 'Surdos');
assert.deepStrictEqual(defaultLinked[0].instruments, ['Surdo 1', 'Surdo 2', 'Surdo 3']);

const defaultNomBatucada = getDefaultUniverseNomenclature('batucada');
assert.strictEqual(defaultNomBatucada.surdo_1, 'Surdo 1');
assert.strictEqual(defaultNomBatucada.repique, 'Repique');
assert.strictEqual(defaultNomBatucada.caixa, 'Caixa');
console.log("  ✅ [PASS] Liaison Surdos par défaut prête.");

// Test 5 : Règle composant < 200 lignes
console.log("\n▶️ Test 5 : Vérification de la contrainte < 200 lignes");
const accordionPath = path.resolve(__dirname, '../src/components/association-settings/organization/PupitresNomenclatureAccordion.jsx');
const content = fs.readFileSync(accordionPath, 'utf-8');
const linesCount = content.split('\n').length;
console.log(`  📊 Nombre de lignes de PupitresNomenclatureAccordion.jsx : ${linesCount}`);
assert(linesCount < 200, `Le composant doit faire moins de 200 lignes (actuellement ${linesCount})`);
console.log("  ✅ [PASS] Contrainte < 200 lignes respectée.");

console.log("\n🎉 TOUS LES TESTS DE NOMENCLATURE MULTI-UNIVERS SONT AU VERT !");
