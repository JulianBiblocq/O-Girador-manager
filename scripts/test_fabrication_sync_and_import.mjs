import assert from 'assert';
import fs from 'fs';

console.log("===============================================================");
console.log("🧪 TEST MISSION : SYNCHRO ÉTAPES, GABARIT JSON & IMPORT FABRICATION");
console.log("===============================================================\n");

// --- Test 1 : Contrôle statique du gabarit téléchargeable dans useDocumentUploadPipeline.js ---
console.log("▶️ Test 1 : Vérification de l'absence de résidus Toadas dans le modèle de fabrication");
const pipelineCode = fs.readFileSync('src/hooks/useDocumentUploadPipeline.js', 'utf8');

assert(pipelineCode.includes("const isFabrication = category === 'TutosFabrication' || category === 'fabrication';"),
  "useDocumentUploadPipeline.js doit identifier la catégorie fabrication");
assert(pipelineCode.includes("modele_import_fabrication.json"),
  "Le modèle doit être nommé modele_import_fabrication.json");

// Extraire la branche isFabrication de downloadTemplate
const matchTemplate = pipelineCode.match(/else if \(isFabrication\) \{[\s\S]*?templateObj = (\[[\s\S]*?\]);/);
assert(matchTemplate, "La structure templateObj pour isFabrication doit être présente");
const templateObj = new Function(`return ${matchTemplate[1]}`)();
const sample = templateObj[0];

const forbiddenToadaFields = ['nacao', 'rythme', 'parolesOriginales', 'parolesPhonetiques', 'traduction', 'puxador', 'coro'];
for (const field of forbiddenToadaFields) {
  assert.strictEqual(sample[field], undefined, `Le champ parasite '${field}' ne doit PAS être présent dans le gabarit de fabrication`);
}

const requiredFields = [
  'titre',
  'thematiqueFabrication',
  'instrumentConcerne',
  'materielRequis',
  'outilsNecessaires',
  'visuelAnimeUrl',
  'contenuFabrication',
  'anecdote',
  'etapesFabrication',
  'questionsQcm'
];
for (const field of requiredFields) {
  assert(sample[field] !== undefined, `Le champ requis '${field}' doit être présent dans le gabarit de fabrication`);
}

assert(Array.isArray(sample.etapesFabrication) && sample.etapesFabrication.length === 2, "Le gabarit doit contenir 2 étapes d'exemple");
assert.strictEqual(sample.etapesFabrication[0].id, 1);
assert.strictEqual(sample.etapesFabrication[1].id, 2);
assert(Array.isArray(sample.etapesFabrication[0].materiaux), "materiaux doit être un tableau");
assert(Array.isArray(sample.etapesFabrication[0].outils), "outils doit être un tableau");
console.log("  ✅ [PASS] Gabarit JSON de fabrication 100% épuré et conforme.");

// --- Test 2 : Contrôle de la synchronisation par index dans DocumentFormFabricationFields.jsx ---
console.log("\n▶️ Test 2 : Contrôle du ciblage strict par index dans DocumentFormFabricationFields.jsx");
const formCode = fs.readFileSync('src/components/documents/form/DocumentFormFabricationFields.jsx', 'utf8');

assert(formCode.includes("const updateEtape = (indexToUpdate, field, value) => {"),
  "updateEtape doit accepter indexToUpdate en 1er argument");
assert(formCode.includes("idx === indexToUpdate ? { ...etape, [field]: value } : etape"),
  "updateEtape doit muter uniquement l'élément d'index idx === indexToUpdate");

assert(formCode.includes("const toggleEtapeMateriel = (indexToUpdate, mat) => {"),
  "toggleEtapeMateriel doit cibler par indexToUpdate");
assert(formCode.includes("const toggleEtapeOutil = (indexToUpdate, outil) => {"),
  "toggleEtapeOutil doit cibler par indexToUpdate");
assert(formCode.includes("const removeEtape = (indexToRemove) => {"),
  "removeEtape doit cibler par indexToRemove");

assert(formCode.includes("key={etape.id || `etape-fab-${index}`}"),
  "La clé React doit utiliser le fallback etape-fab-${index}");
assert(formCode.includes("value={etape.sousTitre || ''}"),
  "sousTitre doit avoir le fallback || ''");
assert(formCode.includes("value={etape.description || ''}"),
  "description doit avoir le fallback || ''");

// Simulation unitaire du comportement
let steps = [
  { id: undefined, sousTitre: "Étape 1", description: "Desc 1" },
  { id: undefined, sousTitre: "Étape 2", description: "Desc 2" },
  { id: undefined, sousTitre: "Étape 3", description: "Desc 3" }
];
const updateStepFn = (prev, indexToUpdate, field, value) =>
  prev.map((etape, idx) => idx === indexToUpdate ? { ...etape, [field]: value } : etape);

steps = updateStepFn(steps, 1, 'description', 'Description modifiée pour Étape 2');
assert.strictEqual(steps[0].description, "Desc 1", "L'étape 0 ne doit PAS être modifiée");
assert.strictEqual(steps[1].description, "Description modifiée pour Étape 2", "L'étape 1 doit être modifiée");
assert.strictEqual(steps[2].description, "Desc 3", "L'étape 2 ne doit PAS être modifiée");
console.log("  ✅ [PASS] Ciblage strict par index validé (zéro contamination entre étapes).");

// --- Test 3 : Initialisation sécurisée dans DocumentUploadForm.jsx ---
console.log("\n▶️ Test 3 : Contrôle de l'initialisation sécurisée dans DocumentUploadForm.jsx");
const uploadFormCode = fs.readFileSync('src/components/DocumentUploadForm.jsx', 'utf8');

assert(uploadFormCode.includes("const [etapesFabrication, setEtapesFabrication] = useState(() => {"),
  "DocumentUploadForm.jsx doit utiliser une fonction d'initialisation pour etapesFabrication");
assert(uploadFormCode.includes("id: step.id || Date.now() + idx"),
  "Chaque étape doit se voir attribuer un identifiant unique lors du chargement");
assert(uploadFormCode.includes("materiaux: Array.isArray(step.materiaux) ? step.materiaux : []"),
  "materiaux doit être garanti sous forme de tableau");
assert(uploadFormCode.includes("outils: Array.isArray(step.outils) ? step.outils : []"),
  "outils doit être garanti sous forme de tableau");
console.log("  ✅ [PASS] Initialisation sécurisée d'etapesFabrication validée.");

// --- Test 4 : Normalisation lors de l'import par lot dans useDocumentUploadPipeline.js ---
console.log("\n▶️ Test 4 : Contrôle de la normalisation lors de l'import par lot");
assert(pipelineCode.includes("id: step.id || Date.now() + idx + Math.random()"),
  "L'import par lot doit injecter un id unique dans chaque étape si absent");
assert(pipelineCode.includes("materiaux: parseTagsList(step.materiaux)"),
  "materiaux de chaque étape doit être normalisé via parseTagsList (tolérance string/array)");
assert(pipelineCode.includes("outils: parseTagsList(step.outils)"),
  "outils de chaque étape doit être normalisé via parseTagsList (tolérance string/array)");
assert(pipelineCode.includes("thematiqueFabrication: item.thematiqueFabrication || 'lutherie'"),
  "thematiqueFabrication doit être conservé lors de l'import");
console.log("  ✅ [PASS] Normalisation automatique à l'importation validée.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DE LA MISSION SONT VALIDÉES !");
console.log("===============================================================\n");
