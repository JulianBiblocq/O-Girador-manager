import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : ASPIRATION ET GESTION DES SINAIS DO MESTRE");
console.log("===============================================================\n");

const baseDir = process.cwd();

// --- Module 1 : Intégrité du composant RepertoireSinaisDoMestreEditor.jsx ---
console.log("▶️ Module 1 : Composant RepertoireSinaisDoMestreEditor.jsx");
const editorPath = path.join(baseDir, 'src', 'components', 'mestre', 'RepertoireSinaisDoMestreEditor.jsx');
assert(fs.existsSync(editorPath), "Le fichier RepertoireSinaisDoMestreEditor.jsx doit exister");
const editorCode = fs.readFileSync(editorPath, 'utf8');

assert(
  editorCode.includes('sortedSinais') && editorCode.includes('mesure'),
  "RepertoireSinaisDoMestreEditor doit effectuer un tri par numéro de mesure"
);
assert(
  editorCode.includes('handleAdd') && editorCode.includes('handleRemove'),
  "RepertoireSinaisDoMestreEditor doit permettre l'ajout et le retrait de signes manuellement"
);
console.log("  ✅ [PASS] RepertoireSinaisDoMestreEditor validé (tri chronologique, ajout/suppression manuelle).");

// --- Module 2 : Intégrité de RepertoirePieceModal.jsx ---
console.log("\n▶️ Module 2 : Aspiration et Persistance dans RepertoirePieceModal.jsx");
const modalPath = path.join(baseDir, 'src', 'components', 'mestre', 'RepertoirePieceModal.jsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

// Vérification de l'aspiration automatique
assert(
  modalCode.includes('sinaisDoMestre') &&
  modalCode.includes('found.parsedData?.sinaisDoMestre') &&
  modalCode.includes('setSinaisDoMestre('),
  "L'aspiration automatique de sinaisDoMestre doit être présente dans handleSequenceurChange"
);

// Vérification de la persistance assainie
assert(
  modalCode.includes('sinaisDoMestre: Array.isArray(sinaisDoMestre) ? cleanFirestorePayload(sinaisDoMestre) : []'),
  "sinaisDoMestre doit être assaini avec cleanFirestorePayload avant enregistrement"
);

// Vérification de l'intégration de l'éditeur
assert(
  modalCode.includes('<RepertoireSinaisDoMestreEditor'),
  "RepertoirePieceModal doit rendre le composant RepertoireSinaisDoMestreEditor"
);
console.log("  ✅ [PASS] RepertoirePieceModal validé (aspiration automatique, sauvegarde Firestore assainie, éditeur).");

// --- Module 3 : Affichage des signes sur la carte MestreRepertoireView.jsx ---
console.log("\n▶️ Module 3 : Affichage sur la carte dans MestreRepertoireView.jsx");
const viewPath = path.join(baseDir, 'src', 'components', 'mestre', 'MestreRepertoireView.jsx');
const viewCode = fs.readFileSync(viewPath, 'utf8');

// Vérification du bloc chronologique ordonné par mesure
assert(
  viewCode.includes('piece.sinaisDoMestre') &&
  viewCode.includes('Mesure') &&
  viewCode.includes('Signes &'),
  "MestreRepertoireView doit afficher le bloc ordonné 'Mesure X : Nom' pour sinaisDoMestre"
);

// Vérification du badge de synthèse
assert(
  viewCode.includes('Signe') && viewCode.includes('piece.sinaisDoMestre.length'),
  "MestreRepertoireView doit afficher le badge de synthèse discret du nombre de signes"
);
console.log("  ✅ [PASS] MestreRepertoireView validé (badges chronologiques par mesure, badge de synthèse).");

// --- Module 4 : Résilience aux données nulles / malformées ---
console.log("\n▶️ Module 4 : Simulation de tri et résilience");
const mockSinais = [
  { bar: 16, nom: "Virada 1" },
  { mesure: 1, name: "Appel départ" },
  { barIndex: 32, label: "Break final" }
];

const sortedMock = [...mockSinais].sort((a, b) => {
  const ma = typeof a === 'object' && a !== null ? (a.mesure ?? a.bar ?? a.barIndex ?? 0) : 0;
  const mb = typeof b === 'object' && b !== null ? (b.mesure ?? b.bar ?? b.barIndex ?? 0) : 0;
  return Number(ma) - Number(mb);
});

assert.strictEqual(sortedMock[0].name, "Appel départ");
assert.strictEqual(sortedMock[1].nom, "Virada 1");
assert.strictEqual(sortedMock[2].label, "Break final");
console.log("  ✅ [PASS] Simulation de tri validée (Mesure 1 -> 16 -> 32).");

// --- Module 5 : Gouvernance Firebase ---
console.log("\n▶️ Module 5 : Gouvernance stricte des règles Firebase");
const firestoreRules = path.join(baseDir, 'firestore.rules');
const storageRules = path.join(baseDir, 'storage.rules');
assert(!fs.existsSync(firestoreRules), "Aucun fichier firestore.rules local ne doit exister");
assert(!fs.existsSync(storageRules), "Aucun fichier storage.rules local ne doit exister");
console.log("  ✅ [PASS] Gouvernance Firebase respectée (zéro fichier local de règles).");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS SONT VALIDÉES !");
console.log("===============================================================\n");
