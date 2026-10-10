import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertCommissionToVaralDoc } from '../src/utils/commissionVaralAdapter.js';
import { parseCommissionMarkdown, getCommissionBookletData } from '../src/utils/commissionBookletParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST RICHESSE ÉDITORIALE DES COMMISSIONS AU VARAL');
console.log('===============================================================\n');

// 1. Test de génération du livret avec jalons détaillés et liens
console.log('▶️ Test 1 : Génération du document Varal enrichi');
const fakeEvent = {
  id: 'evt_carnaval_2026',
  titre: 'Grand Carnaval 2026',
  dateDebut: '2026-03-01'
};

const fakeCommission = {
  id: 'comm_musique',
  titre: 'Programmation musicale',
  icone: '🎶',
  description: 'Sélection des artistes et calage des balances.\nDeuxième paragraphe de mission.',
  jalons: [
    {
      id: 'j1',
      titre: 'Boucler la liste des groupes',
      status: 'fait',
      deadline: '2026-02-15',
      notes: 'Groupes confirmés :\n- Guirá : https://youtube.com/watch?v=sample1\n- VraKKA : contact@vrakka.org\nOrdre de passage : 14h Guirá, 15h30 VraKKA'
    },
    {
      id: 'j2',
      titre: 'Validation fiches techniques',
      status: 'en_cours',
      deadline: '2026-02-25',
      notes: 'Consulter la fiche : [Fiche Technique](https://monsite.fr/fiche.pdf)'
    },
    {
      id: 'j3',
      titre: 'Balance son Jour J',
      status: 'a_faire',
      deadline: '2026-03-01'
    }
  ]
};

const varalDoc = convertCommissionToVaralDoc(fakeEvent, fakeCommission, ['Camille', 'Lucas']);

// Vérifications sur le contenu Markdown
assert.ok(varalDoc.contenu.includes('## 🎯 Mission & Description'), 'Section Mission présente');
assert.ok(varalDoc.contenu.includes('Deuxième paragraphe de mission.'), 'Description multi-paragraphes préservée');
assert.ok(varalDoc.contenu.includes('[x] **Boucler la liste des groupes** [✅ Fait] (Butoir : 2026-02-15)'), 'Ligne principale jalon fait');
assert.ok(varalDoc.contenu.includes('[ ] **Validation fiches techniques** [⏳ En cours] (Butoir : 2026-02-25)'), 'Ligne principale jalon en cours');
assert.ok(varalDoc.contenu.includes('  > Groupes confirmés :'), 'Notes jalon indentées');
assert.ok(varalDoc.contenu.includes('https://youtube.com/watch?v=sample1'), 'URL YouTube présente dans les notes');
assert.ok(varalDoc.contenu.includes('  > Ordre de passage : 14h Guirá, 15h30 VraKKA'), 'Ordre de passage multiligne présent');
console.log('  ✅ [PASS] Génération convertCommissionToVaralDoc conforme.\n');

// 2. Test du parseur de livret pour le lecteur Varal
console.log('▶️ Test 2 : Analyse syntaxique du livret (commissionBookletParser)');
const parsed = parseCommissionMarkdown(varalDoc.contenu);

assert.ok(parsed.description.includes('Deuxième paragraphe de mission.'), 'Description extraite');
assert.strictEqual(parsed.jalons.length, 3, '3 jalons doivent être extraits');

// Jalon 1
const j1 = parsed.jalons[0];
assert.strictEqual(j1.titre, 'Boucler la liste des groupes');
assert.strictEqual(j1.status, 'fait');
assert.strictEqual(j1.statusLabel, 'Terminé');
assert.strictEqual(j1.deadline, '2026-02-15');
assert.ok(j1.notes.includes('Guirá : https://youtube.com/watch?v=sample1'), 'Notes j1 avec URL');
assert.ok(j1.notes.includes('Ordre de passage : 14h Guirá, 15h30 VraKKA'), 'Notes j1 multilignes');

// Jalon 2
const j2 = parsed.jalons[1];
assert.strictEqual(j2.titre, 'Validation fiches techniques');
assert.strictEqual(j2.status, 'en_cours');
assert.strictEqual(j2.statusLabel, 'En cours');
assert.strictEqual(j2.deadline, '2026-02-25');
assert.ok(j2.notes.includes('[Fiche Technique](https://monsite.fr/fiche.pdf)'), 'Notes j2 avec lien Markdown');

// Jalon 3 (sans notes)
const j3 = parsed.jalons[2];
assert.strictEqual(j3.titre, 'Balance son Jour J');
assert.strictEqual(j3.status, 'a_faire');
assert.strictEqual(j3.statusLabel, 'À faire');
assert.strictEqual(j3.notes, '', 'Pas de notes pour j3');

console.log('  ✅ [PASS] Analyse syntaxique conforme.\n');

// 3. Test de getCommissionBookletData avec fallback
console.log('▶️ Test 3 : Normalisation avec getCommissionBookletData');
const dataNormalisee = getCommissionBookletData(varalDoc);
assert.strictEqual(dataNormalisee.jalons.length, 3);
assert.strictEqual(dataNormalisee.jalons[0].status, 'fait');
console.log('  ✅ [PASS] Normalisation conforme.\n');

// 4. Test de la règle anti-monolithe (< 200 lignes)
console.log('▶️ Test 4 : Contrôle de la règle anti-monolithe (< 200 lignes)');
const filesToCheck = [
  'src/utils/commissionVaralAdapter.js',
  'src/utils/commissionBookletParser.js',
  'src/components/documents/varal/CommissionDocReader.jsx'
];

filesToCheck.forEach((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Fichier ${relPath} doit exister`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert.ok(lines < 200, `${relPath} a ${lines} lignes (doit être < 200)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
});

console.log('\n===============================================================');
console.log('🏆 TOUS LES TESTS DE RICHESSE ÉDITORIALE SONT VALIDÉS !');
console.log('===============================================================\n');
