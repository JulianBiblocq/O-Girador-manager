import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  isProjectRopeCategory,
  isProjectPresentationDoc,
  isPinnedFirstOnProjectRope,
  sortProjectRopeDocuments,
  canUserDepositOnProjectRope,
  canUserManageProjectDoc
} from '../src/utils/projectVaralUtils.js';

console.log('===============================================================');
console.log('🎪 TEST : VARAL — DÉPÔT LIBRE SUR LES CORDES PROJET');
console.log('===============================================================\n');

// 1. Contrôle de la règle anti-monolithe (< 200 lignes)
console.log('▶️ Test 1 : Règle anti-monolithe (< 200 lignes)');
const filesToCheck = [
  'src/utils/projectVaralUtils.js',
  'src/components/documents/form/DocumentFormProjectFields.jsx',
  'src/components/documents/varal/ProjectPresentationReader.jsx',
  'src/utils/documentSingleSubmitService.js',
  'src/hooks/useDocumentUploadPipeline.js',
  'src/utils/commissionVaralAdapter.js',
  'src/components/event-details/commissions/EventCommissionsHub.jsx'
];

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/).length;
  assert.ok(lines < 200, `${relPath} dépasse 200 lignes (${lines} lignes)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
}

// 2. Permissions de dépôt sur une corde projet_
console.log('\n▶️ Test 2 : Permissions "+ Déposer" sur une corde projet_');
const eventId = 'evt_30ans';
const categoryId = `projet_${eventId}`;
assert.equal(isProjectRopeCategory(categoryId), true);

const projectDocs = [
  {
    id: 'comm_1',
    type: 'cordel_commission',
    categoryId,
    referentsIds: ['user_ref_1']
  }
];
const allEventsMap = {
  [eventId]: {
    id: eventId,
    titre: 'Les 30 ans de Samambaia',
    commissions: [
      { id: 'c2', title: 'Logistique', referents: [{ uid: 'user_ref_2' }] }
    ]
  }
};

// Admin / Mestre / Super-Admin
assert.equal(
  canUserDepositOnProjectRope({ categoryId, role: 'mestre', user: { uid: 'u1' }, projectDocs, allEventsMap }),
  true
);
// Membre du Bureau / CA
assert.equal(
  canUserDepositOnProjectRope({
    categoryId,
    role: 'membre',
    userTags: ['bureau'],
    user: { uid: 'u2' },
    projectDocs,
    allEventsMap
  }),
  true
);
// Référent via document de commission sur la corde
assert.equal(
  canUserDepositOnProjectRope({
    categoryId,
    role: 'membre',
    user: { uid: 'user_ref_1' },
    projectDocs,
    allEventsMap
  }),
  true
);
// Référent via l'objet événement dans allEventsMap
assert.equal(
  canUserDepositOnProjectRope({
    categoryId,
    role: 'membre',
    user: { uid: 'user_ref_2' },
    projectDocs: [],
    allEventsMap
  }),
  true
);
// Simple membre non-référent
assert.equal(
  canUserDepositOnProjectRope({
    categoryId,
    role: 'membre',
    userTags: [],
    user: { uid: 'user_lambda' },
    projectDocs,
    allEventsMap
  }),
  false
);
console.log('  ✅ [PASS] Droits de dépôt (Admin, Mestre, Bureau/CA, Référent de commission) validés.');

// 3. Tri sur le fil de la corde Projet (isPinnedFirst / projet_presentation tout à gauche)
console.log('\n▶️ Test 3 : Tri épinglé en tête de corde (tout à gauche)');
const unsortedDocs = [
  { id: 'doc_pdf', titre: 'Plan du site.pdf', type: 'pdf', createdAt: 3000 },
  { id: 'comm_log', titre: 'Commission Logistique', type: 'cordel_commission', createdAt: 2000 },
  { id: 'doc_album', titre: 'Photos repérage', type: 'dossier_externe', createdAt: 4000 },
  {
    id: 'doc_pres',
    titre: 'Les 30 ans de Samambaia — Le Grand Projet',
    type: 'projet_presentation',
    isPinnedFirst: true,
    createdAt: 1000
  }
];

const sortedDocs = sortProjectRopeDocuments(unsortedDocs);
assert.equal(sortedDocs[0].id, 'doc_pres', 'La présentation globale épinglée doit être tout à gauche (index 0)');
assert.equal(sortedDocs[1].id, 'comm_log', 'Les livrets de commissions doivent suivre immédiatement la présentation');
assert.equal(isProjectPresentationDoc(sortedDocs[0]), true);
assert.equal(isPinnedFirstOnProjectRope(sortedDocs[0]), true);
console.log('  ✅ [PASS] Tri sur la corde projet_ conforme (Présentation -> Commissions -> Documents/Albums).');

// 4. Droits d'édition et de suppression (auteur, Bureau, Mestre)
console.log('\n▶️ Test 4 : Droits d’édition et suppression des documents manuels');
const manualDoc = {
  id: 'doc_pres',
  categoryId,
  type: 'projet_presentation',
  authorId: 'user_ref_1'
};
const autoCommissionDoc = {
  id: 'comm_log',
  categoryId,
  type: 'cordel_commission',
  isCommissionVaralDoc: true,
  authorId: 'user_ref_1'
};

assert.equal(
  canUserManageProjectDoc({ docItem: manualDoc, user: { uid: 'user_ref_1' }, role: 'membre' }),
  true,
  "L'auteur doit pouvoir éditer/supprimer son document manuel"
);
assert.equal(
  canUserManageProjectDoc({ docItem: manualDoc, user: { uid: 'user_bureau' }, role: 'membre', userTags: ['ca'] }),
  true,
  'Un membre du CA/Bureau doit pouvoir éditer/supprimer un document manuel'
);
assert.equal(
  canUserManageProjectDoc({ docItem: manualDoc, user: { uid: 'user_other' }, role: 'membre', userTags: [] }),
  false,
  'Un tiers non-Bureau ne doit pas pouvoir supprimer le document manuel'
);
assert.equal(
  canUserManageProjectDoc({ docItem: manualDoc, user: { uid: 'user_mestre' }, role: 'mestre' }),
  true,
  'Le Mestre/Admin doit pouvoir éditer/supprimer un document manuel'
);
assert.equal(
  canUserManageProjectDoc({ docItem: autoCommissionDoc, user: { uid: 'user_ref_1' }, role: 'membre' }),
  false,
  'Les livrets automatiques de commission restent protégés contre la modification manuelle directe par un simple référent'
);
console.log('  ✅ [PASS] Permissions d’édition/suppression et protection des commissions validées.');

// 5. Contrôle statique des 3 modes et de la lecture sécurisée
console.log('\n▶️ Test 5 : Présence des 3 onglets Projet et lecture sécurisée');
const formFieldsSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/documents/form/DocumentFormProjectFields.jsx'),
  'utf8'
);
assert.ok(formFieldsSrc.includes('🌟 Présentation / Note illustrée'), 'Onglet Mode A manquant');
assert.ok(formFieldsSrc.includes('📄 Fichier (PDF ou Photo)'), 'Onglet Mode B manquant');
assert.ok(formFieldsSrc.includes('📸 Album Photos / Dossier Cloud'), 'Onglet Mode C manquant');
assert.ok(formFieldsSrc.includes('Épingler en tête de la corde (avant les commissions)'), 'Case Épingler en tête manquante');

const readerSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/documents/varal/ProjectPresentationReader.jsx'),
  'utf8'
);
assert.ok(readerSrc.includes('whitespace-pre-line'), 'Préservation des retours à la ligne (whitespace-pre-line) manquante');
assert.ok(readerSrc.includes('renderRichTextWithLinks'), 'Rendu des liens cliquables sécurisés manquant');

const coverSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/documents/varal/VaralBookletCover.jsx'),
  'utf8'
);
assert.ok(coverSrc.includes('🌟 Présentation'), 'Macaron distinctif "🌟 Présentation" manquant sur la couverture');

console.log('  ✅ [PASS] Sous-formulaire 3 modes, macaron Cordel et lecteur déroulant validés.');

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : DÉPÔT LIBRE SUR LES CORDES PROJET VALIDÉ !');
console.log('===============================================================\n');
