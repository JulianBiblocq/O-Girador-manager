import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCommissionToCordelDoc, convertCommissionToVaralDoc } from '../src/utils/commissionVaralAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST DES PASSERELLES TRANSVERSES : FORUM, VARAL & ROADBOOK');
console.log('===============================================================\n');

// -------------------------------------------------------------
// MODULE 1 : FORMATAGE VARAL (LIVRET CORDEL)
// -------------------------------------------------------------
console.log('▶️ Module 1 : Formatage normalisé du livret Cordel (Varal)');

assert.strictEqual(typeof formatCommissionToCordelDoc, 'function', 'formatCommissionToCordelDoc doit être exportée');
assert.strictEqual(typeof convertCommissionToVaralDoc, 'function', 'convertCommissionToVaralDoc doit être exportée');

const dummyEvent = {
  id: 'evt_festival_2026',
  titre: 'Festival Maracatu 2026',
  dateDebut: '2026-06-21',
  groupId: 'samambaia'
};

const dummyCommission = {
  id: 'comm_sceno_01',
  titre: 'Scénographie & Lumières',
  icone: '🏮',
  description: 'Création des décors et mise en valeur du plateau.',
  budget: { alloue: 450 },
  jalons: [
    { id: 'j1', titre: 'Achat des lanternes', status: 'fait', deadline: '2026-05-15' },
    { id: 'j2', titre: 'Installation sur scène', status: 'en_cours', deadline: '2026-06-20' }
  ],
  creneauxBenevoles: [
    { id: 'c1', titre: 'Accrochage rideaux', horaireDebut: '09:00', horaireFin: '11:00', places: 3, inscritsIds: ['u1'] }
  ],
  besoinsMateriel: [
    { id: 'b1', article: 'Câbles multiprises 10m', quantite: 4, statut: 'reserve', responsableId: 'u2' }
  ]
};

const varalDoc = formatCommissionToCordelDoc(dummyEvent, dummyCommission, ['Julien B.', 'Maria S.']);

assert.strictEqual(varalDoc.categorie, 'projet_evt_festival_2026', 'La catégorie doit être projet_{eventId}');
assert.strictEqual(varalDoc.titre, '🏮 Scénographie & Lumières', 'Le titre doit intégrer icône et libellé');
assert.strictEqual(varalDoc.auteur, 'Julien B. & Maria S.', 'Les auteurs doivent être les référents formatés');
assert.strictEqual(varalDoc.type, 'cordel_commission', "Le type doit être 'cordel_commission'");
assert.strictEqual(varalDoc.commissionSourceId, 'comm_sceno_01', 'commissionSourceId doit correspondre à la commission');
assert.strictEqual(varalDoc.eventId, 'evt_festival_2026', 'eventId doit correspondre');

// Vérification de la présence des sections Markdown
assert.ok(varalDoc.contenu.includes('# 🏮 Commission : Scénographie & Lumières'), 'Titre principal Markdown');
assert.ok(varalDoc.contenu.includes('[x] **Achat des lanternes**'), 'Jalon complété coché [x]');
assert.ok(varalDoc.contenu.includes('[ ] **Installation sur scène**'), 'Jalon en cours non coché [ ]');
assert.ok(varalDoc.contenu.includes('Accrochage rideaux'), 'Poste bénévole mentionné');
assert.ok(varalDoc.contenu.includes('Câbles multiprises 10m'), 'Besoin matériel mentionné');
assert.ok(varalDoc.contenu.includes('👤 Julien B.'), 'Contact référent 1');
assert.ok(varalDoc.contenu.includes('👤 Maria S.'), 'Contact référent 2');

console.log('  ✅ [PASS] Formatage du livret Cordel validé avec succès.\n');

// -------------------------------------------------------------
// MODULE 2 : ADAPTATEUR FORUM & PASSERELLE PORTE-VOIX
// -------------------------------------------------------------
console.log('▶️ Module 2 : Adaptateur Forum & passerelle Porte-Voix');

const forumAdapterPath = path.join(rootDir, 'src', 'utils', 'commissionForumAdapter.js');
assert.ok(fs.existsSync(forumAdapterPath), 'commissionForumAdapter.js doit exister');

const forumAdapterCode = fs.readFileSync(forumAdapterPath, 'utf8');
assert.ok(forumAdapterCode.includes('getOrCreateCommissionForumThread'), 'getOrCreateCommissionForumThread exportée');
assert.ok(forumAdapterCode.includes("categorie: 'Projets'"), "Catégorie 'Projets' requise");
assert.ok(forumAdapterCode.includes('threadId'), 'Gestion du threadId requise');
assert.ok(forumAdapterCode.includes('commissionSourceId'), 'Traçabilité commissionSourceId requise');
assert.ok(forumAdapterCode.includes('reponses:'), 'Message inaugural dans reponses requis');

console.log('  ✅ [PASS] commissionForumAdapter.js validé.\n');

// -------------------------------------------------------------
// MODULE 3 : HOOK useEventCommissions
// -------------------------------------------------------------
console.log('▶️ Module 3 : Méthodes exportées par useEventCommissions.js');

const hookPath = path.join(rootDir, 'src', 'hooks', 'useEventCommissions.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

assert.ok(hookCode.includes('publishCommissionToVaral'), 'publishCommissionToVaral présent');
assert.ok(hookCode.includes('getOrCreateCommissionThread'), 'getOrCreateCommissionThread présent');

console.log('  ✅ [PASS] useEventCommissions.js intègre les 2 passerelles.\n');

// -------------------------------------------------------------
// MODULE 4 : BOUTON COMPACT VARAL (3 ÉTATS STRICTS)
// -------------------------------------------------------------
console.log('▶️ Module 4 : Bouton compact Varal (3 états stricts)');

const varalActionPath = path.join(rootDir, 'src', 'components', 'event-details', 'commissions', 'CommissionVaralAction.jsx');
const varalActionCode = fs.readFileSync(varalActionPath, 'utf8');

assert.ok(varalActionCode.includes('📜 Publier au Varal'), 'Libellé état non publié conforme');
assert.ok(varalActionCode.includes('✅ À jour au Varal'), 'Libellé état synchro conforme');
assert.ok(varalActionCode.includes('🔄 Synchroniser au Varal'), 'Libellé état modifié après synchro conforme');
assert.ok(varalActionCode.includes('animate-pulse'), 'Pastille d alerte pulsante en cas de désynchronisation');

console.log('  ✅ [PASS] Les 3 états stricts du bouton compact Varal sont validés.\n');

// -------------------------------------------------------------
// MODULE 5 : BOUTON SALON DÉBAT DANS CommissionCard
// -------------------------------------------------------------
console.log('▶️ Module 5 : Bouton Salon Débat dans CommissionCard.jsx');

const cardPath = path.join(rootDir, 'src', 'components', 'event-details', 'commissions', 'CommissionCard.jsx');
const cardCode = fs.readFileSync(cardPath, 'utf8');

assert.ok(cardCode.includes('Salon Débat'), 'Bouton Salon Débat présent');
assert.ok(cardCode.includes('getOrCreateCommissionThread'), 'Appel à getOrCreateCommissionThread présent');
assert.ok(cardCode.includes("onNavigateToView('forum', { threadId"), 'Navigation vers forum avec threadId présente');

console.log('  ✅ [PASS] Bouton Salon Débat et navigation Porte-Voix validés.\n');

// -------------------------------------------------------------
// MODULE 6 : ROADBOOK & CONSOLIDATION COMMISSIONS
// -------------------------------------------------------------
console.log('▶️ Module 6 : Consolidation Roadbook (Postes et Régie)');

const roadbookModalPath = path.join(rootDir, 'src', 'components', 'event-details', 'RoadbookModal.jsx');
const roadbookModalCode = fs.readFileSync(roadbookModalPath, 'utf8');

assert.ok(roadbookModalCode.includes('event?.hasCommissions'), 'Prise en compte du flag hasCommissions');
assert.ok(roadbookModalCode.includes('useEventCommissions'), 'Chargement des commissions pour le roadbook');

const interactivePath = path.join(rootDir, 'src', 'components', 'event-details', 'RoadbookInteractiveContent.jsx');
const interactiveCode = fs.readFileSync(interactivePath, 'utf8');
assert.ok(interactiveCode.includes('RoadbookCommissionsSection'), 'Section commissions écran branchée');

const printPath = path.join(rootDir, 'src', 'components', 'event-details', 'RoadbookPrintView.jsx');
const printCode = fs.readFileSync(printPath, 'utf8');
assert.ok(printCode.includes('RoadbookCommissionsPrintSection'), 'Section commissions A4 print branchée');

console.log('  ✅ [PASS] Déversement des commissions dans le Roadbook écran et print validé.\n');

// -------------------------------------------------------------
// MODULE 7 : RÈGLE ANTI-MONOLITHE (< 200 LIGNES)
// -------------------------------------------------------------
console.log('▶️ Module 7 : Contrôle de la règle anti-monolithe (< 200 lignes)');

const filesToCheck = [
  'src/utils/commissionVaralAdapter.js',
  'src/utils/commissionForumAdapter.js',
  'src/hooks/useEventCommissions.js',
  'src/components/event-details/commissions/CommissionVaralAction.jsx',
  'src/components/event-details/commissions/CommissionCard.jsx',
  'src/components/event-details/commissions/EventCommissionsHub.jsx',
  'src/components/event-details/RoadbookModal.jsx',
  'src/components/event-details/RoadbookInteractiveContent.jsx',
  'src/components/event-details/RoadbookPrintView.jsx',
  'src/components/event-details/RoadbookCommissionsSection.jsx',
  'src/components/event-details/RoadbookCommissionsPrintSection.jsx'
];

filesToCheck.forEach((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert.ok(lines < 200, `Le fichier ${relPath} compte ${lines} lignes (doit être < 200 lignes)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
});

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : TOUTES LES PASSERELLES TRANSVERSES SONT 100% OPÉRATIONNELLES !');
console.log('===============================================================\n');
