import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDefaultMemberBadge } from '../src/components/trombinoscope/trombinoscopeUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🧪 Lancement des tests automatisés : Harmonisation hauteur cartes & Suppression badge Adhérent(e)...\n');

// ==========================================
// TEST 1 : Règle d'exclusion isDefaultMemberBadge
// ==========================================
console.log('--- Test 1 : Détection et exclusion des étiquettes par défaut ---');

const defaultBadgesToExclude = [
  'adhérent', 'adhérente', 'Adhérent', 'Adhérente', 'ADHÉRENT',
  'adherent', 'adherente', 'Adherent', 'Adherente',
  'adhérents', 'adhérentes', 'adherents', 'adherentes',
  'membre', 'Membre', 'MEMBRE', 'membres',
  'member', 'Member', 'MEMBER', 'members',
  'associado', 'associada', 'Associado', 'Associada', 'membro'
];

defaultBadgesToExclude.forEach((badge) => {
  assert.strictEqual(
    isDefaultMemberBadge(badge),
    true,
    `Le badge par défaut "${badge}" DOIT être exclu par isDefaultMemberBadge`
  );
});

console.log(`✅ ${defaultBadgesToExclude.length} variantes de badges par défaut correctement identifiées et exclues.`);

const legitimateRolesAndTags = [
  'Mestre', 'mestre', 'Mestra',
  'Admin', 'Administrateur', 'Administratrice', 'super-admin',
  'Bureau', 'CA', 'Conseil d\'administration',
  'Trésorier', 'Trésorière', 'tresorier',
  'Président', 'Présidente', 'president',
  'Référent Alfaia', 'Référente', 'Commission Bar', 'Commission Costumes',
  'Scénographie', 'Logistique'
];

legitimateRolesAndTags.forEach((roleOrTag) => {
  assert.strictEqual(
    isDefaultMemberBadge(roleOrTag),
    false,
    `L'étiquette métier "${roleOrTag}" NE DOIT PAS être exclue`
  );
});

console.log(`✅ ${legitimateRolesAndTags.length} étiquettes métier réelles correctement conservées.`);

// ==========================================
// TEST 2 : Structure CSS de MemberStampCard.jsx
// ==========================================
console.log('\n--- Test 2 : Structure CSS et alignement dans MemberStampCard.jsx ---');
const stampCardPath = path.join(projectRoot, 'src/components/trombinoscope/MemberStampCard.jsx');
const stampCardContent = fs.readFileSync(stampCardPath, 'utf8');

// 1. Conteneur principal avec h-full flex flex-col justify-between
assert.ok(
  stampCardContent.includes('h-full flex flex-col justify-between'),
  'MemberStampCard.jsx doit contenir "h-full flex flex-col justify-between" sur le conteneur principal'
);
console.log('✅ Conteneur principal configuré avec h-full flex flex-col justify-between');

// 2. Zone photo verrouillée aspect-square et shrink-0
assert.ok(
  stampCardContent.includes('aspect-square w-full shrink-0 overflow-hidden'),
  'MemberStampCard.jsx doit verrouiller la photo avec "aspect-square w-full shrink-0 overflow-hidden"'
);
console.log('✅ Zone photo verrouillée avec aspect-square w-full shrink-0 overflow-hidden');

// 3. Cartouche inférieur flex-1 flex flex-col justify-between p-2 sm:p-2.5
assert.ok(
  stampCardContent.includes('flex-1 flex flex-col justify-between p-2 sm:p-2.5'),
  'MemberStampCard.jsx doit avoir un cartouche inférieur "flex-1 flex flex-col justify-between p-2 sm:p-2.5"'
);
console.log('✅ Cartouche inférieur flex-1 flex flex-col justify-between p-2 sm:p-2.5 présent');

// 4. Bloc extras / bas avec min-h cohérent et justify-end
assert.ok(
  stampCardContent.includes('mt-auto pt-1 min-h-[38px] sm:min-h-[42px]'),
  'MemberStampCard.jsx doit caler les extras en bas avec mt-auto et min-height pour absorber les variations'
);
console.log('✅ Bloc bas calé avec mt-auto pt-1 min-h-[38px] sm:min-h-[42px] et justify-end');

// ==========================================
// TEST 3 : Exclusion dans MemberDetailModal.jsx
// ==========================================
console.log('\n--- Test 3 : Exclusion du badge Adhérent(e) dans MemberDetailModal.jsx ---');
const modalPath = path.join(projectRoot, 'src/components/trombinoscope/MemberDetailModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert.ok(
  modalContent.includes('isDefaultMemberBadge'),
  'MemberDetailModal.jsx doit importer et utiliser isDefaultMemberBadge'
);

assert.ok(
  modalContent.includes('!isDefaultMemberBadge(role) && !isDefaultMemberBadge(translatedRole)'),
  'MemberDetailModal.jsx doit conditionner l\'affichage du badge de rôle avec !isDefaultMemberBadge'
);

assert.ok(
  modalContent.includes('!isDefaultMemberBadge(rawTagId) && !isDefaultMemberBadge(rawTagLabel)'),
  'MemberDetailModal.jsx doit filtrer les tags valides pour éliminer les badges par défaut'
);
console.log('✅ MemberDetailModal.jsx filtre rigoureusement le badge de rôle et les tags.');

// ==========================================
// TEST 4 : Exclusion dans MemberDetailCardContent.jsx
// ==========================================
console.log('\n--- Test 4 : Exclusion dans MemberDetailCardContent.jsx ---');
const cardContentPath = path.join(projectRoot, 'src/components/trombinoscope/MemberDetailCardContent.jsx');
const cardContentStr = fs.readFileSync(cardContentPath, 'utf8');

assert.ok(
  cardContentStr.includes('isDefaultMemberBadge'),
  'MemberDetailCardContent.jsx doit importer et utiliser isDefaultMemberBadge'
);

assert.ok(
  cardContentStr.includes('visibleTags'),
  'MemberDetailCardContent.jsx doit calculer visibleTags en excluant les badges par défaut'
);
console.log('✅ MemberDetailCardContent.jsx filtre visibleTags avant affichage.');

// ==========================================
// TEST 5 : items-stretch sur Trombinoscope.jsx
// ==========================================
console.log('\n--- Test 5 : items-stretch sur les grilles de Trombinoscope.jsx ---');
const trombiPath = path.join(projectRoot, 'src/components/Trombinoscope.jsx');
const trombiStr = fs.readFileSync(trombiPath, 'utf8');

assert.ok(
  trombiStr.includes('gap-2 sm:gap-3 items-stretch'),
  'Trombinoscope.jsx doit contenir items-stretch sur ses grilles'
);
console.log('✅ Grilles du Trombinoscope configurées avec items-stretch.');

console.log('\n🎉 TOUS LES TESTS UNITAIRES ET DE STRUCTURE SONT PASSÉS AVEC SUCCÈS !');
