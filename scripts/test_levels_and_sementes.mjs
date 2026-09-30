/**
 * Test de validation automatisé :
 * Niveaux « La relève / La référence » et unification du pupitre Sementes
 */

import { formatMemberLevel, resolveMemberLevel } from '../src/utils/memberUtils.js';
import {
  resolveMemberInstrumentSubtitle,
  extractMemberBadges,
  formatMemberLevel as formatFromTrombi
} from '../src/components/trombinoscope/trombinoscopeUtils.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

console.log('\n--- 🧪 TEST 1 : Normalisation des niveaux (« La référence » / « La relève ») ---');
const confirmes = ['confirme', 'confirmé', 'reference', 'la_reference', 'la référence', '2', 'CONFIRME'];
confirmes.forEach(val => {
  assert(formatMemberLevel(val) === 'La référence', `Niveau "${val}" normalisé en "La référence"`);
});

const debutants = ['debutant', 'débutant', 'releve', 'la_releve', 'la relève', '1', 'DEBUTANT'];
debutants.forEach(val => {
  assert(formatMemberLevel(val) === 'La relève', `Niveau "${val}" normalisé en "La relève"`);
});

assert(formatMemberLevel(null) === null, 'null renvoie null (pas de fallback "Débutant")');
assert(formatMemberLevel(undefined) === null, 'undefined renvoie null');
assert(formatMemberLevel('') === null, 'chaîne vide renvoie null');
assert(formatMemberLevel('Mestre Initié') === 'Mestre Initié', 'Valeur personnalisée préservée');
assert(formatFromTrombi('confirme') === 'La référence', 'Export trombinoscopeUtils identique');

console.log('\n--- 🧪 TEST 2 : Résolution du niveau d\'un membre ---');
const mReference = { id: '1', prenom: 'Alex', niveau: 'confirme' };
const mReleve = { id: '2', prenom: 'Julie', level: 'releve' };
const mInstrumentLevel = { id: '3', prenom: 'Sam', instrumentPrincipal: 'Alfaia', niveauxParInstrument: { 'Alfaia': 'reference' } };
const mDanceLevel = { id: '4', prenom: 'Léa', niveauDanse: 'debutant' };
const mNoLevel = { id: '5', prenom: 'Claude' };

assert(resolveMemberLevel(mReference) === 'La référence', 'Membre avec niveau: confirme -> "La référence"');
assert(resolveMemberLevel(mReleve) === 'La relève', 'Membre avec level: releve -> "La relève"');
assert(resolveMemberLevel(mInstrumentLevel) === 'La référence', 'Membre avec niveauxParInstrument -> "La référence"');
assert(resolveMemberLevel(mDanceLevel) === 'La relève', 'Membre avec niveauDanse -> "La relève"');
assert(resolveMemberLevel(mNoLevel) === null, 'Membre sans niveau -> null (aucun fallback automatique)');

console.log('\n--- 🧪 TEST 3 : Unification stricte du sous-titre pour les Sementes & Caixas ---');
const mAgbe = { id: 's1', prenom: 'Clara', instrumentPrincipal: 'Agbê' };
const mMineiro = { id: 's2', prenom: 'Paul', instrumentPrincipal: 'Mineiro' };
const mSementes = { id: 's3', prenom: 'Nadia', instrument: 'Sementes' };
const mTarol = { id: 'c1', prenom: 'Théo', instrumentPrincipal: 'Tarol' };
const mCaixa = { id: 'c2', prenom: 'Benoit', instrument: 'Caixa' };
const mAlfaia = { id: 'a1', prenom: 'Marc', instrumentPrincipal: 'Alfaia' };

assert(resolveMemberInstrumentSubtitle(mAgbe) === 'Sementes', 'Clara (Agbê) affiche "Sementes" sous sa photo');
assert(resolveMemberInstrumentSubtitle(mMineiro) === 'Sementes', 'Paul (Mineiro) affiche "Sementes" sous sa photo');
assert(resolveMemberInstrumentSubtitle(mSementes) === 'Sementes', 'Nadia (Sementes) affiche "Sementes" sous sa photo');
assert(resolveMemberInstrumentSubtitle(mTarol) === 'Caixas', 'Théo (Tarol) affiche "Caixas" sous sa photo');
assert(resolveMemberInstrumentSubtitle(mCaixa) === 'Caixas', 'Benoit (Caixa) affiche "Caixas" sous sa photo');
assert(resolveMemberInstrumentSubtitle(mAlfaia) === 'Alfaias', 'Marc (Alfaia) affiche "Alfaias" sous sa photo');

console.log('\n--- 🧪 TEST 4 : Disparition des mentions séparées "agbê" et "mineiro" dans les badges ---');
const badgesAgbeMember = extractMemberBadges({ instrumentPrincipal: 'Agbê', instrumentsJoues: ['Mineiro', 'Agbê'] }, 'sementes');
assert(!badgesAgbeMember.includes('Mineiro'), 'Aucun badge Mineiro pour le membre du pupitre Sementes');
assert(!badgesAgbeMember.includes('Agbê'), 'Aucun badge Agbê pour le membre du pupitre Sementes');

const badgesTarolMember = extractMemberBadges({ instrumentPrincipal: 'Tarol', instrumentsJoues: ['Caixa'] }, 'caixas');
assert(!badgesTarolMember.includes('Tarol'), 'Aucun badge Tarol pour le membre du pupitre Caixas');
assert(!badgesTarolMember.includes('Caixa'), 'Aucun badge Caixa pour le membre du pupitre Caixas');

console.log('\n--- 🧪 TEST 5 : Vérification de l\'absence du fallback "Débutant" dans le JSX ---');
const detailCardContent = fs.readFileSync(path.resolve('src/components/trombinoscope/MemberDetailCardContent.jsx'), 'utf8');
assert(!detailCardContent.includes("instNiveau === 'confirme' ? 'Confirmé' : 'Débutant'"), 'Ancien fallback Débutant supprimé de MemberDetailCardContent.jsx');
assert(detailCardContent.includes('formatMemberLevel(instNiveau)'), 'formatMemberLevel utilisé pour les instruments');
assert(detailCardContent.includes('formatMemberLevel(niveauDanse)'), 'formatMemberLevel utilisé pour la danse');

const stampCardContent = fs.readFileSync(path.resolve('src/components/trombinoscope/MemberStampCard.jsx'), 'utf8');
assert(stampCardContent.includes('instrumentSubtitle'), 'MemberStampCard affiche instrumentSubtitle');
assert(stampCardContent.includes('memberLevel'), 'MemberStampCard affiche memberLevel');

console.log(`\n========================================`);
console.log(`Résultats des tests Niveaux & Sementes : ${passed} réussis, ${failed} échoués`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
