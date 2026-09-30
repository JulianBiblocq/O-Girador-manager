/**
 * Test de validation automatisé - Fiche 6 :
 * Refonte du Trombinoscope — Grille plate, 5 pupitres SaaS et isolation des renforts
 */

import {
  FIVE_PUPITRES,
  isDanseMember,
  isRenfortMember,
  isChantReferent,
  resolveMemberPrimaryPupitre,
  extractMemberBadges
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

console.log('\n--- 🧪 TEST 1 : Ordre et intégrité des 5 pupitres SaaS ---');
assert(FIVE_PUPITRES.length === 5, 'Il y a exactement 5 pupitres canoniques');
assert(FIVE_PUPITRES[0].id === 'alfaias' && FIVE_PUPITRES[0].icon === '/icones/alfaia.svg', 'Pupitre 1 = Alfaias avec gravure /icones/alfaia.svg');
assert(FIVE_PUPITRES[1].id === 'caixas' && FIVE_PUPITRES[1].icon === '/icones/caixa.svg', 'Pupitre 2 = Caixas avec gravure /icones/caixa.svg');
assert(FIVE_PUPITRES[2].id === 'gongue' && FIVE_PUPITRES[2].icon === '/icones/gongue.svg', 'Pupitre 3 = Gonguê avec gravure /icones/gongue.svg');
assert(FIVE_PUPITRES[3].id === 'sementes' && FIVE_PUPITRES[3].icon === '/icones/agbe.svg', 'Pupitre 4 = Sementes avec gravure Agbê (/icones/agbe.svg)');
assert(FIVE_PUPITRES[4].id === 'danse' && FIVE_PUPITRES[4].icon === '/icones/danse.svg', 'Pupitre 5 = Danse avec gravure /icones/danse.svg');

console.log('\n--- 🧪 TEST 2 : Absence de groupe Chant orphelin & Badge Chant individuel ---');
const chantInFive = FIVE_PUPITRES.some(p => p.id === 'chant' || p.name?.toLowerCase().includes('chant'));
assert(!chantInFive, 'Aucune section Chant isolée parmi les 5 pupitres canoniques');

// Test de détection du chanteur référent / soliste
const leadSingerMember = { id: 'u1', prenom: 'Lucia', instrumentPrincipal: 'Alfaia', isLeadChant: true };
const regularSinger = { id: 'u2', prenom: 'Pierre', instrumentPrincipal: 'Alfaia', tags: ['choriste'] };
const solisteByTag = { id: 'u3', prenom: 'Awa', instrumentPrincipal: 'Gonguê', tags: ['Soliste'] };

assert(isChantReferent(leadSingerMember) === true, 'Lucia est détectée comme chanteuse référente (isLeadChant: true)');
assert(isChantReferent(regularSinger) === false, 'Pierre (choriste ordinaire) n\'a pas le badge soliste');
assert(isChantReferent(solisteByTag) === true, 'Awa avec tag Soliste est détectée comme chanteuse soliste');

console.log('\n--- 🧪 TEST 3 : Résolution de pupitre principal et dédoublonnage ---');
const mAlfaia = { id: 'm1', prenom: 'Marc', instrumentPrincipal: 'Alfaia Marcante', instrumentSecondaire: 'Caixa' };
const mTarol = { id: 'm2', prenom: 'Thomas', instrumentPrincipal: 'Tarol', instrumentsJoues: ['Caixa'] };
const mSementes = { id: 'm3', prenom: 'Sophie', instrumentPrincipal: 'Agbê', instrumentsJoues: ['Mineiro'] };
const mDanse = { id: 'm4', prenom: 'Daniela', pratiqueDanse: true };

assert(resolveMemberPrimaryPupitre(mAlfaia) === 'alfaias', 'Marc (Alfaia Marcante) -> alfaias');
assert(resolveMemberPrimaryPupitre(mTarol) === 'caixas', 'Thomas (Tarol) -> caixas (regroupement)');
assert(resolveMemberPrimaryPupitre(mSementes) === 'sementes', 'Sophie (Agbê) -> sementes (regroupement)');
assert(resolveMemberPrimaryPupitre(mDanse) === 'danse', 'Daniela (pratiqueDanse) -> danse');

console.log('\n--- 🧪 TEST 4 : Badges légers des instruments secondaires et sous-voix ---');
const badgesAlfaia = extractMemberBadges(mAlfaia, 'alfaias');
assert(badgesAlfaia.includes('Marcante'), 'Sous-voix Marcante présente en badge');
assert(badgesAlfaia.includes('Caixas'), 'Instrument secondaire Caixas présent en badge unifié');

const badgesTarol = extractMemberBadges(mTarol, 'caixas');
assert(!badgesTarol.includes('Tarol'), 'Aucune distinction Tarol isolée pour le pupitre Caixas');

const badgesSementes = extractMemberBadges(mSementes, 'sementes');
assert(!badgesSementes.includes('Mineiro'), 'Disparition de la distinction isolée Mineiro pour le pupitre Sementes');
assert(!badgesSementes.includes('Agbê'), 'Disparition de la distinction isolée Agbê pour le pupitre Sementes');

console.log('\n--- 🧪 TEST 5 : Isolation des renforts extérieurs ---');
const renfortByStatus = { id: 'r1', prenom: 'Julien', statutActuel: 'renfort', instrumentPrincipal: 'Alfaia' };
const renfortByTag = { id: 'r2', prenom: 'Camille', tags: ['renfort-2025'], instrumentPrincipal: 'Caixa' };
const regularMember = { id: 'm5', prenom: 'Adhérent', statutActuel: 'active', tags: ['adherent'] };

assert(isRenfortMember(renfortByStatus) === true, 'Julien avec statutActuel=renfort est un renfort');
assert(isRenfortMember(renfortByTag) === true, 'Camille avec tag renfort est un renfort');
assert(isRenfortMember(regularMember) === false, 'Adhérent actif régulier n\'est PAS un renfort');

console.log('\n--- 🧪 TEST 6 : Vérification du code JSX de Trombinoscope.jsx ---');
const trombiCode = fs.readFileSync(path.resolve('src/components/Trombinoscope.jsx'), 'utf8');
assert(!trombiCode.includes("id: 'chant_danse'"), 'Aucune section orpheline chant_danse dans le code');
assert(trombiCode.includes('🎪 Renforts & Musiciens extérieurs'), 'Section dédiée "🎪 Renforts & Musiciens extérieurs" présente');
assert(trombiCode.includes('FIVE_PUPITRES.map'), 'Itération sur les 5 pupitres SaaS');

console.log(`\n========================================`);
console.log(`Résultats des tests Fiche 6 : ${passed} réussis, ${failed} échoués`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
