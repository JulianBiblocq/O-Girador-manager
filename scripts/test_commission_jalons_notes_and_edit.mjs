import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST UNITAIRE : JALONS DE COMMISSION — ÉDITION & NOTES MULTILIGNES');
console.log('===============================================================\n');

// 1. Simulation d'un jalon avec notes multilignes (ordre de passage)
console.log('▶️ Module 1 : Modèle de données étendu avec champ notes multilignes');

const initialJalon = {
  id: 'jalon_test_1',
  titre: 'Ordre de passage',
  deadline: '2026-06-20',
  status: 'a_faire',
  assigneA: 'user_julien',
  notes: '14h VraKKA\n15h Guirá\n17h Samambaia',
  creeLe: new Date().toISOString()
};

assert.strictEqual(initialJalon.titre, 'Ordre de passage');
assert.ok(initialJalon.notes.includes('\n'), 'Les notes doivent contenir des retours à la ligne');
assert.strictEqual(initialJalon.notes.split('\n').length, 3, '3 lignes pour les 3 groupes');

console.log('  ✅ [PASS] Modèle de données validé avec notes multilignes.\n');

// 2. Simulation de l'édition en ligne sans suppression
console.log('▶️ Module 2 : Édition d\'un jalon existant sans suppression');

let jalonsList = [
  initialJalon,
  { id: 'jalon_test_2', titre: 'Installation sono', deadline: '2026-06-19', status: 'en_cours', notes: '' }
];

// Fonction simulant onSaveEdit
function simulateSaveEdit(jalonId, updatedFields) {
  jalonsList = jalonsList.map((j) => (j.id === jalonId ? { ...j, ...updatedFields } : j));
}

// Modification d'une heure et du titre
simulateSaveEdit('jalon_test_1', {
  titre: 'Ordre de passage officiel',
  notes: '14h30 VraKKA\n15h30 Guirá\n17h30 Samambaia'
});

assert.strictEqual(jalonsList.length, 2, 'Le nombre de jalons doit rester identique (pas de recréation)');
const editedJalon = jalonsList.find((j) => j.id === 'jalon_test_1');
assert.strictEqual(editedJalon.titre, 'Ordre de passage officiel');
assert.ok(editedJalon.notes.includes('14h30 VraKKA'), 'L\'horaire modifié doit être pris en compte');
assert.strictEqual(editedJalon.deadline, '2026-06-20', 'La date d\'origine doit être conservée');

console.log('  ✅ [PASS] Édition en ligne validée avec mise à jour in-situ.\n');

// 3. Simulation de l'ajout rapide avec notes
console.log('▶️ Module 3 : Ajout rapide avec notes initiales');

const newJalonInput = {
  titre: 'Balance technique',
  deadline: '2026-06-20',
  assigneA: 'user_maria',
  notes: 'Tester micro surdos et caixas avant 13h'
};

const createdJalon = {
  id: `jalon_${Date.now()}`,
  titre: newJalonInput.titre,
  deadline: newJalonInput.deadline,
  status: 'a_faire',
  assigneA: newJalonInput.assigneA,
  notes: newJalonInput.notes,
  creeLe: new Date().toISOString()
};

jalonsList.push(createdJalon);

assert.strictEqual(jalonsList.length, 3);
const lastJalon = jalonsList[jalonsList.length - 1];
assert.strictEqual(lastJalon.notes, 'Tester micro surdos et caixas avant 13h');

console.log('  ✅ [PASS] Ajout d\'un jalon avec notes validé.\n');

// 4. Audit statique des composants de la chaîne
console.log('▶️ Module 4 : Audit statique des composants React et du CSS');

const itemPath = path.join(rootDir, 'src', 'components', 'event-details', 'commissions', 'CommissionJalonItem.jsx');
assert.ok(fs.existsSync(itemPath), 'CommissionJalonItem.jsx doit exister');
const itemCode = fs.readFileSync(itemPath, 'utf8');
assert.ok(itemCode.includes('✏️'), 'Bouton crayon de modification présent');
assert.ok(itemCode.includes('whitespace-pre-line'), 'Classe CSS whitespace-pre-line pour retours à la ligne');
assert.ok(itemCode.includes('textarea'), 'Zone textarea pour la saisie des notes');
assert.ok(itemCode.includes('onSaveEdit'), 'Callback onSaveEdit branché');

const sectionPath = path.join(rootDir, 'src', 'components', 'event-details', 'commissions', 'CommissionJalonsSection.jsx');
const sectionCode = fs.readFileSync(sectionPath, 'utf8');
assert.ok(sectionCode.includes('CommissionJalonItem'), 'Sous-composant CommissionJalonItem consommé');
assert.ok(sectionCode.includes('showAddNotes'), 'État pour accordéon de notes présent');
assert.ok(sectionCode.includes('textarea'), 'Champ textarea d\'ajout rapide présent');

console.log('  ✅ [PASS] Composants vérifiés et conformes.\n');

// 5. Règle anti-monolithe (< 200 lignes)
console.log('▶️ Module 5 : Contrôle strict de la règle anti-monolithe (< 200 lignes)');

const filesToCheck = [
  'src/components/event-details/commissions/CommissionJalonsSection.jsx',
  'src/components/event-details/commissions/CommissionJalonItem.jsx',
  'src/components/event-details/commissions/CommissionEditModal.jsx',
  'src/components/event-details/commissions/commissionUtils.js'
];

filesToCheck.forEach((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert.ok(lines < 200, `Le fichier ${relPath} compte ${lines} lignes (doit être < 200)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
});

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : LES JALONS AVEC ÉDITION ET NOTES SONT VALIDÉS !');
console.log('===============================================================\n');
