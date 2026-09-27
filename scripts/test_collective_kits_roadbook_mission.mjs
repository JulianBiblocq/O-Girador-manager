import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { calculateKitStatus, DEFAULT_REGIE_KITS } from '../src/utils/kitUtils.js';

console.log("🚀 Lancement des tests de validation de la MISSION : MALLETTES COLLECTIVES RÉGIE & FEUILLE DE ROUTE...");

const rootDir = process.cwd();

// 1. Règle anti-monolithe (< 200 lignes)
const componentsToCheck = [
  'src/components/logistics/CollectiveKitsManager.jsx',
  'src/components/logistics/KitDetailModal.jsx',
  'src/components/logistics/KitItemRow.jsx',
  'src/components/event-details/RoadbookKitsChecklist.jsx',
  'src/components/event-details/RoadbookInteractiveContent.jsx',
  'src/components/event-details/RoadbookPrintView.jsx',
  'src/components/event-details/RoadbookModal.jsx',
  'src/hooks/useCollectiveKits.js'
];

for (const relPath of componentsToCheck) {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister.`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  console.log(`📏 [Anti-monolithe] ${relPath} : ${lineCount} lignes`);
  assert(
    lineCount < 200,
    `Le fichier ${relPath} (${lineCount} lignes) dépasse le seuil strict de 200 lignes !`
  );
}

// 2. Modèle de données & calcul d'état de santé du kit (calculateKitStatus)
console.log("🧪 Test de la fonction calculateKitStatus...");

const okKit = {
  items: [
    { id: '1', nom: 'Item 1', quantiteCible: 2, quantiteActuelle: 2, statut: 'ok' },
    { id: '2', nom: 'Item 2', quantiteCible: 1, quantiteActuelle: 1, statut: 'ok' }
  ]
};
const okResult = calculateKitStatus(okKit);
assert.strictEqual(okResult.status, 'ok');
assert.strictEqual(okResult.color, 'green');
assert.strictEqual(okResult.label, 'Complet');

const toCompleteKit = {
  items: [
    { id: '1', nom: 'Item 1', quantiteCible: 5, quantiteActuelle: 3, statut: 'a_completer' },
    { id: '2', nom: 'Item 2', quantiteCible: 2, quantiteActuelle: 2, statut: 'ok' }
  ]
};
const toCompleteResult = calculateKitStatus(toCompleteKit);
assert.strictEqual(toCompleteResult.status, 'a_completer');
assert.strictEqual(toCompleteResult.color, 'orange');

const toBuyKit = {
  items: [
    { id: '1', nom: 'Item 1', quantiteCible: 4, quantiteActuelle: 0, statut: 'ok' }, // quantité 0 -> à racheter
    { id: '2', nom: 'Item 2', quantiteCible: 2, quantiteActuelle: 1, statut: 'a_racheter' }
  ]
};
const toBuyResult = calculateKitStatus(toBuyKit);
assert.strictEqual(toBuyResult.status, 'a_racheter');
assert.strictEqual(toBuyResult.color, 'red');
assert(toBuyResult.toBuyCount >= 2);

assert(DEFAULT_REGIE_KITS.length >= 3, "Il doit y avoir au moins 3 kits types configurés.");
const hasMakeup = DEFAULT_REGIE_KITS.some(k => k.type === 'maquillage');
const hasAid = DEFAULT_REGIE_KITS.some(k => k.type === 'secours');
const hasTools = DEFAULT_REGIE_KITS.some(k => k.type === 'outils_live');
assert(hasMakeup && hasAid && hasTools, "Les 3 types maquillage, secours et outillage doivent être présents.");

// 3. Vérification de CollectiveKitsManager.jsx et KitDetailModal.jsx
const managerPath = path.join(rootDir, 'src/components/logistics/CollectiveKitsManager.jsx');
const managerContent = fs.readFileSync(managerPath, 'utf8');
assert(managerContent.includes('useCollectiveKits'), "CollectiveKitsManager doit importer et utiliser useCollectiveKits.");
assert(managerContent.includes('calculateKitStatus'), "CollectiveKitsManager doit évaluer la santé des kits.");
assert(managerContent.includes('KitDetailModal'), "CollectiveKitsManager doit ouvrir KitDetailModal.");

const modalPath = path.join(rootDir, 'src/components/logistics/KitDetailModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');
const rowPath = path.join(rootDir, 'src/components/logistics/KitItemRow.jsx');
const rowContent = fs.readFileSync(rowPath, 'utf8');
assert(rowContent.includes('a_racheter'), "KitItemRow doit gérer le statut a_racheter.");
assert(modalContent.includes('Signer la vérification maintenant'), "KitDetailModal doit permettre de signer la vérification.");

// 4. Vérification de la connexion feuille de route (RoadbookKitsChecklist.jsx)
const checklistPath = path.join(rootDir, 'src/components/event-details/RoadbookKitsChecklist.jsx');
const checklistContent = fs.readFileSync(checklistPath, 'utf8');
assert(checklistContent.includes('maquillageRequis'), "RoadbookKitsChecklist doit tester maquillageRequis.");
assert(checklistContent.includes('trousseSecoursBouchons'), "RoadbookKitsChecklist doit tester trousseSecoursBouchons.");
assert(checklistContent.includes('useCollectiveKits'), "RoadbookKitsChecklist doit se brancher sur useCollectiveKits.");
assert(checklistContent.includes('openMaquillage'), "RoadbookKitsChecklist doit gérer le dépliage de la mallette maquillage.");
assert(checklistContent.includes('openSecours'), "RoadbookKitsChecklist doit gérer le dépliage de la trousse de secours.");

// 5. Vérification du raccordement dans InventoryManager.jsx
const inventoryPath = path.join(rootDir, 'src/components/InventoryManager.jsx');
const inventoryContent = fs.readFileSync(inventoryPath, 'utf8');
assert(inventoryContent.includes('CollectiveKitsManager'), "InventoryManager.jsx doit intégrer CollectiveKitsManager.");

// 6. Vérification des dictionnaires de langues
const frPath = path.join(rootDir, 'src/locales/fr.js');
const ptPath = path.join(rootDir, 'src/locales/pt.js');
const frContent = fs.readFileSync(frPath, 'utf8');
const ptContent = fs.readFileSync(ptPath, 'utf8');

assert(frContent.includes('collectiveKits:'), "fr.js doit contenir collectiveKits.");
assert(frContent.includes('makeupKit'), "fr.js doit contenir makeupKit.");
assert(ptContent.includes('collectiveKits:'), "pt.js doit contenir collectiveKits.");
assert(ptContent.includes('makeupKit'), "pt.js doit contenir makeupKit.");

console.log("✅ TOUS LES TESTS DE LA MISSION MALLETTES COLLECTIVES RÉGIE SONT PASSÉS AVEC SUCCÈS !");
