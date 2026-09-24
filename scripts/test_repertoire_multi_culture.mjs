import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  findMatchingCultureDoc,
  buildResolutionDictionaries,
  resolvePieceLiveTechnicalData
} from '../src/utils/repertoireMatcher.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : MULTI-LIAISON DES FICHES CULTURE (RÉPERTOIRE)");
console.log("===============================================================\n");

const baseDir = process.cwd();

// --- Test 1 : findMatchingCultureDoc supporte cultureDocIds et cultureDocId ---
console.log("▶️ Test 1 : findMatchingCultureDoc avec cultureDocIds et cultureDocId");
const mockCultureList = [
  { id: 'cult_1', titre: 'Obaluaê', texte: 'Divinité de la terre et de la guérison.' },
  { id: 'cult_2', titre: 'Nação Porto Rico', texte: 'Fondée en 1916 à Recife.' },
  { id: 'cult_3', titre: 'Maracatu de Baque Virado', texte: 'Tradition afro-brésilienne.' }
];

// A. Via tableau cultureDocIds
const matchArray = findMatchingCultureDoc({ cultureDocIds: ['cult_2', 'cult_1'] }, mockCultureList);
assert.strictEqual(matchArray?.id, 'cult_2', "Doit trouver le premier id du tableau cultureDocIds");

// B. Via ancien cultureDocId unique
const matchLegacy = findMatchingCultureDoc({ cultureDocId: 'cult_3' }, mockCultureList);
assert.strictEqual(matchLegacy?.id, 'cult_3', "Doit trouver via cultureDocId historique");

// C. Via titre normalisé
const matchTitle = findMatchingCultureDoc('Obaluae', mockCultureList);
assert.strictEqual(matchTitle?.id, 'cult_1', "Doit trouver par titre sans accent");
console.log("  ✅ [PASS] findMatchingCultureDoc validé.");

// --- Test 2 : Résolution dynamique multi-fiches dans resolvePieceLiveTechnicalData ---
console.log("\n▶️ Test 2 : Résolution dynamique multi-fiches dans resolvePieceLiveTechnicalData");
const dicts = buildResolutionDictionaries({
  catalogRhythms: [],
  toadasList: [],
  cultureDocsList: mockCultureList,
  choreographies: []
});

// A. Morceau avec plusieurs fiches culturelles
const pieceMulti = {
  id: 'piece_opanije',
  titre: 'Opanijé',
  cultureDocIds: ['cult_1', 'cult_2']
};
const resMulti = resolvePieceLiveTechnicalData(pieceMulti, dicts);
assert.strictEqual(resMulti.hasCulture, true, "hasCulture doit valoir true");
assert.strictEqual(Array.isArray(resMulti.activeCultureDocs), true, "activeCultureDocs doit être un tableau");
assert.strictEqual(resMulti.activeCultureDocs.length, 2, "Doit avoir résolu 2 fiches culture");
assert.strictEqual(resMulti.activeCultureDocs[0].id, 'cult_1');
assert.strictEqual(resMulti.activeCultureDocs[1].id, 'cult_2');
assert.strictEqual(resMulti.activeCultureDoc?.id, 'cult_1', "activeCultureDoc doit pointer sur la première pour rétrocompatibilité");
assert(resMulti.activeHistoire.includes('Obaluaê') || resMulti.activeHistoire.includes('guérison'), "L'histoire active doit intégrer les textes culturels");
assert(resMulti.activeHistoire.includes('1916') || resMulti.activeHistoire.includes('Recife'), "L'histoire active doit agréger les fiches culturelles");

// B. Morceau rétrocompatible avec ancien champ cultureDocId
const pieceLegacy = {
  id: 'piece_baque',
  titre: 'Baque Luanda',
  cultureDocId: 'cult_3'
};
const resLegacy = resolvePieceLiveTechnicalData(pieceLegacy, dicts);
assert.strictEqual(resLegacy.hasCulture, true, "hasCulture doit valoir true pour ancien cultureDocId");
assert.strictEqual(resLegacy.activeCultureDocs.length, 1, "Doit résoudre 1 fiche culture");
assert.strictEqual(resLegacy.activeCultureDocs[0].id, 'cult_3');
assert.strictEqual(resLegacy.activeCultureDoc?.id, 'cult_3');

// C. Morceau sans fiche culturelle
const pieceNone = {
  id: 'piece_none',
  titre: 'Morceau Inconnu'
};
const resNone = resolvePieceLiveTechnicalData(pieceNone, dicts);
assert.strictEqual(resNone.hasCulture, false, "hasCulture doit valoir false sans fiche");
assert.strictEqual(resNone.activeCultureDocs.length, 0);
assert.strictEqual(resNone.activeCultureDoc, null);
console.log("  ✅ [PASS] Résolution vivante multi-fiches et rétrocompatibilité validées.");

// --- Test 3 : Contrôle statique de RepertoirePieceModal.jsx ---
console.log("\n▶️ Test 3 : Contrôle statique de RepertoirePieceModal.jsx");
const modalPath = path.join(baseDir, 'src/components/mestre/RepertoirePieceModal.jsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

assert(modalCode.includes('selectedCultureIds'), "RepertoirePieceModal doit gérer l'état selectedCultureIds");
assert(modalCode.includes('cultureDocIds: Array.from'), "RepertoirePieceModal doit persister cultureDocIds dédoublonné");
assert(modalCode.includes('Détacher cette fiche culturelle'), "RepertoirePieceModal doit proposer un bouton pour détacher chaque fiche");
assert(modalCode.includes('Rattacher une fiche culturelle'), "RepertoirePieceModal doit proposer d'ajouter une fiche supplémentaire");
console.log("  ✅ [PASS] RepertoirePieceModal respecte la saisie multi-fiches.");

// --- Test 4 : Contrôle statique de MestreRepertoireView.jsx ---
console.log("\n▶️ Test 4 : Contrôle statique de MestreRepertoireView.jsx");
const viewPath = path.join(baseDir, 'src/components/mestre/MestreRepertoireView.jsx');
const viewCode = fs.readFileSync(viewPath, 'utf8');

assert(viewCode.includes('activeCultureDocs'), "MestreRepertoireView doit exploiter activeCultureDocs");
assert(viewCode.includes('culturePickerData'), "MestreRepertoireView doit gérer culturePickerData pour le choix multi-fiches");
assert(viewCode.includes('fiches Culture'), "MestreRepertoireView doit afficher le libellé groupé en cas de fiches multiples");
console.log("  ✅ [PASS] MestreRepertoireView propose l'affichage multi-fiches.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS MULTI-CULTURE SONT VALIDÉES !");
console.log("===============================================================\n");
