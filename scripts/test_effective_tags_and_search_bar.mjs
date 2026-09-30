import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEffectiveMemberTags, isInstitutionalTag } from '../src/utils/memberUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🧪 Lancement des tests : Héritage automatique des badges & Barre de recherche 1-ligne...\n');

// ==========================================
// TEST 1 : Moteur d'héritage getEffectiveMemberTags
// ==========================================
console.log('--- Test 1 : Moteur d\'héritage getEffectiveMemberTags ---');

// 1.1 Femme Présidente via rôle
const presFemme = {
  id: 'u1',
  prenom: 'Anne',
  nom: 'Présidente',
  role: 'president',
  genre: 'femme',
  tags: []
};
const tagsPresFemme = getEffectiveMemberTags(presFemme);
assert.ok(tagsPresFemme.includes('Présidente'), 'Doit inclure "Présidente" pour une femme');
assert.ok(tagsPresFemme.includes('Bureau'), 'Doit inclure "Bureau" automatiquement');
assert.ok(tagsPresFemme.includes('C.A.'), 'Doit inclure "C.A." automatiquement');
console.log('✅ Présidente (femme via role="president") -> Présidente, Bureau, C.A.');

// 1.2 Homme Président via roleOfficiel
const presHomme = {
  id: 'u2',
  prenom: 'Jean',
  nom: 'Président',
  roleOfficiel: 'president',
  genre: 'homme',
  tags: ['Commission Bar']
};
const tagsPresHomme = getEffectiveMemberTags(presHomme);
assert.ok(tagsPresHomme.includes('Président'), 'Doit inclure "Président" pour un homme');
assert.ok(tagsPresHomme.includes('Bureau'), 'Doit inclure "Bureau"');
assert.ok(tagsPresHomme.includes('C.A.'), 'Doit inclure "C.A."');
assert.ok(tagsPresHomme.includes('Commission Bar'), 'Doit préserver les tags existants');
console.log('✅ Président (homme via roleOfficiel="president") -> Président, Bureau, C.A., Commission Bar');

// 1.3 Présidente via tags existants
const presViaTag = {
  id: 'u3',
  prenom: 'Cécile',
  nom: 'Dupont',
  role: 'membre',
  genre: 'femme',
  tags: ['Présidente']
};
const tagsPresViaTag = getEffectiveMemberTags(presViaTag);
assert.ok(tagsPresViaTag.includes('Présidente'));
assert.ok(tagsPresViaTag.includes('Bureau'), 'Doit hériter du Bureau via tag Présidente');
assert.ok(tagsPresViaTag.includes('C.A.'), 'Doit hériter du C.A. via tag Présidente');
console.log('✅ Membre avec tag "Présidente" -> hérite Bureau et C.A.');

// 1.4 Trésorière
const tresorier = {
  id: 'u4',
  prenom: 'Sophie',
  nom: 'Comptes',
  role: 'tresorier',
  genre: 'femme',
  tags: []
};
const tagsTresorier = getEffectiveMemberTags(tresorier);
assert.ok(tagsTresorier.includes('Trésorière'));
assert.ok(tagsTresorier.includes('Bureau'));
assert.ok(tagsTresorier.includes('C.A.'));
console.log('✅ Trésorière -> Trésorière, Bureau, C.A.');

// 1.5 Secrétaire
const secretaire = {
  id: 'u5',
  prenom: 'Michel',
  nom: 'Plume',
  roleOfficiel: 'secretaire',
  tags: []
};
const tagsSecretaire = getEffectiveMemberTags(secretaire);
assert.ok(tagsSecretaire.includes('Secrétaire'));
assert.ok(tagsSecretaire.includes('Bureau'));
assert.ok(tagsSecretaire.includes('C.A.'));
console.log('✅ Secrétaire -> Secrétaire, Bureau, C.A.');

// 1.6 Membre du Bureau direct
const membreBureau = {
  id: 'u6',
  prenom: 'Pierre',
  nom: 'Bureau',
  role: 'bureau',
  tags: []
};
const tagsBureau = getEffectiveMemberTags(membreBureau);
assert.ok(tagsBureau.includes('Bureau'));
assert.ok(tagsBureau.includes('C.A.'));
assert.ok(!tagsBureau.includes('Président'));
console.log('✅ Membre Bureau -> Bureau, C.A.');

// 1.7 Membre ordinaire sans responsabilité
const membreSimple = {
  id: 'u7',
  prenom: 'Paul',
  nom: 'Musique',
  role: 'membre',
  tags: ['Alfaia']
};
const tagsSimple = getEffectiveMemberTags(membreSimple);
assert.deepEqual(tagsSimple, ['Alfaia'], 'Les tags d\'un membre simple ne doivent pas recevoir Bureau/CA');
console.log('✅ Membre ordinaire -> tags inchangés sans Bureau ni C.A.');

// ==========================================
// TEST 2 : isInstitutionalTag
// ==========================================
console.log('\n--- Test 2 : isInstitutionalTag ---');
const institutionalList = ['Présidente', 'Président', 'Bureau', 'C.A.', 'CA', 'Trésorier', 'Trésorière', 'Secrétaire'];
institutionalList.forEach((tag) => {
  assert.strictEqual(isInstitutionalTag(tag), true, `Le tag institutionnel "${tag}" doit renvoyer true`);
});

const nonInstitutionalList = ['Commission Costumes', 'Référent Alfaia', 'Scénographie', 'Choriste'];
nonInstitutionalList.forEach((tag) => {
  assert.strictEqual(isInstitutionalTag(tag), false, `Le tag libre "${tag}" doit renvoyer false`);
});
console.log('✅ Détection rigoureuse des étiquettes institutionnelles validée.');

// ==========================================
// TEST 3 : Structure de Trombinoscope.jsx
// ==========================================
console.log('\n--- Test 3 : Structure Barre de Recherche & Filtrage dans Trombinoscope.jsx ---');
const trombiPath = path.join(projectRoot, 'src/components/Trombinoscope.jsx');
const trombiContent = fs.readFileSync(trombiPath, 'utf8');

// 3.1 Utilisation de getEffectiveMemberTags
assert.ok(
  trombiContent.includes('getEffectiveMemberTags(member)'),
  'Trombinoscope.jsx doit appeler getEffectiveMemberTags(member)'
);
console.log('✅ Trombinoscope.jsx utilise getEffectiveMemberTags pour le calcul des tags effectifs');

// 3.2 Filtrage par tag incluant Bureau et C.A.
assert.ok(
  trombiContent.includes('cleanFilter === \'ca\'') && trombiContent.includes('cleanFilter === \'bureau\''),
  'Trombinoscope.jsx doit gérer la correspondance des filtres CA et Bureau'
);
console.log('✅ Filtrage par tag prêt pour Bureau et C.A.');

// 3.3 Disposition 1-ligne desktop
assert.ok(
  trombiContent.includes('flex flex-col md:flex-row md:items-center gap-2 md:gap-3'),
  'La toolbar doit utiliser "flex flex-col md:flex-row md:items-center gap-2 md:gap-3"'
);
console.log('✅ Barre de recherche configurée en 1 seule ligne horizontale continue sur desktop');

// 3.4 Champ de recherche flex-1 avec placeholder attendu
assert.ok(
  trombiContent.includes('placeholder="Prénom, nom, surnom..."'),
  'Le placeholder doit être "Prénom, nom, surnom..."'
);
assert.ok(
  trombiContent.includes('flex-1 min-w-0'),
  'Le conteneur de recherche textuelle doit avoir flex-1 min-w-0'
);
console.log('✅ Champ texte flexible avec loupe et placeholder "Prénom, nom, surnom..."');

// 3.5 Sélecteurs compacts shrink-0
assert.ok(
  trombiContent.includes('w-full md:w-auto shrink-0'),
  'Les menus déroulants doivent être w-full md:w-auto shrink-0'
);
console.log('✅ Menus déroulants compacts w-auto shrink-0');

// 3.6 Bouton remise à zéro et compteur
assert.ok(
  trombiContent.includes('hasActiveFilter'),
  'Gestion du bouton de réinitialisation via hasActiveFilter'
);
console.log('✅ Compteur d\'adhérents et bouton de remise à zéro présents');

// ==========================================
// TEST 4 : MemberDetailModal.jsx
// ==========================================
console.log('\n--- Test 4 : Héritage dans MemberDetailModal.jsx ---');
const modalPath = path.join(projectRoot, 'src/components/trombinoscope/MemberDetailModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert.ok(
  modalContent.includes('getEffectiveMemberTags'),
  'MemberDetailModal.jsx doit importer et utiliser getEffectiveMemberTags'
);
assert.ok(
  modalContent.includes('isInstitutionalTag'),
  'MemberDetailModal.jsx doit inclure automatiquement les tags institutionnels dans validTags'
);
console.log('✅ MemberDetailModal.jsx garantit l\'affichage des étiquettes institutionnelles.');

console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
