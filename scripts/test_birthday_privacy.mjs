/**
 * Test de validation automatisé :
 * Formatage de l'anniversaire (« 20 Mai ») et respect strict de la confidentialité (Trombinoscope)
 */

import { formatBirthdayShort } from '../src/components/trombinoscope/trombinoscopeUtils.js';
import { formatBirthdayShort as formatFromDateUtils } from '../src/utils/dateUtils.js';
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

console.log('\n--- 🧪 TEST 1 : Formatage exact « 20 Mai » sans année ---');
const formatted = formatBirthdayShort('1985-05-20');
assert(formatted === '20 Mai', `formatBirthdayShort('1985-05-20') renvoie "20 Mai" (obtenu: "${formatted}")`);
assert(!formatted.includes('1985'), 'L\'année 1985 est strictement absente du résultat');

const dateUtilsRes = formatFromDateUtils('1985-05-20');
assert(dateUtilsRes === '20 Mai', 'formatBirthdayShort exporté dans dateUtils fonctionne identiquement');

console.log('\n--- 🧪 TEST 2 : Robustesse sur les différents mois et jours ---');
assert(formatBirthdayShort('2000-01-01') === '1 Janvier', '01-01 -> "1 Janvier"');
assert(formatBirthdayShort('1992-02-29') === '29 Février', '02-29 -> "29 Février"');
assert(formatBirthdayShort('1978-07-14') === '14 Juillet', '07-14 -> "14 Juillet"');
assert(formatBirthdayShort('1989-12-31') === '31 Décembre', '12-31 -> "31 Décembre"');

console.log('\n--- 🧪 TEST 3 : Tolérance timestamps et rejets de dates invalides ---');
assert(formatBirthdayShort('1985-05-20T14:30:00.000Z') === '20 Mai', 'Format ISO timestamp supporté');
assert(formatBirthdayShort(null) === null, 'null -> null');
assert(formatBirthdayShort(undefined) === null, 'undefined -> null');
assert(formatBirthdayShort('') === null, 'chaîne vide -> null');
assert(formatBirthdayShort('date-invalide') === null, 'chaîne non date -> null');
assert(formatBirthdayShort('1985-99-99') === null, 'mois hors limites -> null');

console.log('\n--- 🧪 TEST 4 : Simulation du conditionnement de visibilité (Carte & Modale) ---');
// Membre A : date renseignée ET consentement activé
const memberWithConsent = {
  id: 'u1',
  prenom: 'Lucia',
  dateNaissance: '1985-05-20',
  afficherDateNaissance: true
};

// Membre B : date renseignée MAIS consentement refusé
const memberWithoutConsent = {
  id: 'u2',
  prenom: 'Marc',
  dateNaissance: '1985-05-20',
  afficherDateNaissance: false
};

// Membre C : date renseignée MAIS afficherDateNaissance non défini
const memberDefaultUndefined = {
  id: 'u3',
  prenom: 'Sophie',
  dateNaissance: '1985-05-20'
};

function resolveBirthdayDisplay(member) {
  const isBirthdateConsent = Boolean(member.afficherDateNaissance ?? member.publierDateNaissance);
  return (isBirthdateConsent && member.dateNaissance)
    ? formatBirthdayShort(member.dateNaissance)
    : null;
}

assert(resolveBirthdayDisplay(memberWithConsent) === '20 Mai', 'Membre avec consentement : renvoie "20 Mai"');
assert(resolveBirthdayDisplay(memberWithoutConsent) === null, 'Membre sans consentement (false) : renvoie null (invisible)');
assert(resolveBirthdayDisplay(memberDefaultUndefined) === null, 'Membre sans consentement (undefined) : renvoie null (invisible)');

console.log('\n--- 🧪 TEST 5 : Vérification des fichiers JSX cibles ---');
const stampCardCode = fs.readFileSync(path.resolve('src/components/trombinoscope/MemberStampCard.jsx'), 'utf8');
assert(stampCardCode.includes('formatBirthdayShort'), 'MemberStampCard importe et utilise formatBirthdayShort');
assert(stampCardCode.includes('isBirthdateConsent'), 'MemberStampCard vérifie le consentement strict');
assert(stampCardCode.includes('🎂'), 'MemberStampCard utilise l\'émoji 🎂 pour le rendu');

const detailCardContentCode = fs.readFileSync(path.resolve('src/components/trombinoscope/MemberDetailCardContent.jsx'), 'utf8');
assert(detailCardContentCode.includes('formatBirthdayShort'), 'MemberDetailCardContent importe et utilise formatBirthdayShort');
assert(detailCardContentCode.includes('🎂 {formatBirthdayShort(dateNaissance)}'), 'MemberDetailCardContent affiche l\'anniversaire formaté sans année');

console.log(`\n========================================`);
console.log(`Résultats des tests Anniversaire : ${passed} réussis, ${failed} échoués`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
