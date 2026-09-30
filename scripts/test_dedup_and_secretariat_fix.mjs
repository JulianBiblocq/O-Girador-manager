/**
 * Test de non-régression et validation :
 * 1. Distinction stricte entre pôle 'Secrétariat' et rôle électif 'Secrétaire'.
 * 2. Déduplication absolue du C.A. (zéro répétition 'trois fois le CA').
 * 3. Préservation de l'héritage institutionnel légitime pour le Bureau (Président, Trésorier, Secrétaire).
 */

import {
  getEffectiveMemberTags,
  getCanonicalTagKey,
  isInstitutionalTag,
  resolvePedagogicalRoles
} from '../src/utils/memberUtils.js';

import {
  isDefaultMemberBadge
} from '../src/components/trombinoscope/trombinoscopeUtils.js';

import { formatTagGender, filterUserAssignedTags } from '../src/utils/tagUtils.js';

console.log('🧪 Démarrage du test de déduplication et de distinction Secrétariat / Secrétaire...');

// --- TEST 1 : Profil de Julian (Mestre avec tag Secrétariat et CA) ---
const julian = {
  id: 'julian_user',
  prenom: 'Julian',
  nom: 'Biblocq',
  genre: 'homme',
  role: 'mestre',
  tags: ['Mestre', 'Direction', 'CA', 'Secrétariat']
};

const julianEffectiveTags = getEffectiveMemberTags(julian);
console.log('Julian effective tags:', julianEffectiveTags);

// Julian ne doit JAMAIS avoir 'Secrétaire' ni 'Bureau' induit par 'Secrétariat'
const hasSecretaire = julianEffectiveTags.some(t => {
  const k = getCanonicalTagKey(t);
  return k === 'secretaire';
});
if (hasSecretaire) {
  throw new Error('❌ ÉCHEC : Julian ne doit PAS recevoir le titre de "Secrétaire" à cause de son étiquette "Secrétariat" !');
}

// Julian ne doit PAS avoir 'Bureau' induit s'il ne l'a pas explicitement
const hasBureau = julianEffectiveTags.some(t => {
  const k = getCanonicalTagKey(t);
  return k === 'bureau';
});
if (hasBureau) {
  throw new Error('❌ ÉCHEC : Julian ne doit PAS recevoir l\'étiquette "Bureau" s\'il n\'a pas de rôle Bureau.');
}

// Vérification du C.A. : il ne doit y avoir qu'UN SEUL tag CA
const caTags = julianEffectiveTags.filter(t => getCanonicalTagKey(t) === 'ca');
if (caTags.length !== 1) {
  throw new Error(`❌ ÉCHEC : Julian doit avoir exactement 1 tag CA dans ses tags effectifs, reçu: ${caTags.length} (${JSON.stringify(caTags)})`);
}
console.log('✅ 1. Profil Julian validé : aucun faux positif "Secrétaire", aucun faux "Bureau", et 1 seul "CA".');

// --- TEST 2 : Déduplication dans la modale avec tagsDisponibles et variantes d'écriture ---
const tagsDisponibles = [
  { id: 'ca', nomM: 'C.A.', nomF: 'C.A.' },
  { id: 'secretariat', nomM: 'Secrétariat', nomF: 'Secrétariat' },
  { id: 'bureau', nomM: 'Bureau', nomF: 'Bureau' },
  { id: 'mestre', nomM: 'Mestre', nomF: 'Mestra' }
];

// Cas où le membre a 'CA', 'C.A.', et l'objet config tag 'ca'
const memberWithDuplicateCA = {
  id: 'dup_ca_user',
  prenom: 'Test',
  nom: 'Doublon',
  genre: 'homme',
  tags: ['CA', 'C.A.', 'Conseil d\'administration']
};

const effectiveWithDup = getEffectiveMemberTags(memberWithDuplicateCA);
const assignedFromConfig = filterUserAssignedTags(effectiveWithDup, tagsDisponibles);

const seenCanonical = new Set();
const resultList = [];
assignedFromConfig.forEach((tag) => {
  const key = getCanonicalTagKey(tag);
  if (key && !seenCanonical.has(key)) {
    seenCanonical.add(key);
    resultList.push(tag);
  }
});
const rawMemberTags = memberWithDuplicateCA.tags;
rawMemberTags.forEach((tag) => {
  const key = getCanonicalTagKey(tag);
  if (key && !seenCanonical.has(key)) {
    seenCanonical.add(key);
    resultList.push(tag);
  }
});
effectiveWithDup.forEach((tag) => {
  if (isInstitutionalTag(tag)) {
    const key = getCanonicalTagKey(tag);
    if (key && !seenCanonical.has(key)) {
      seenCanonical.add(key);
      resultList.push(tag);
    }
  }
});

// Simulation du rendu dans MemberDetailCardContent
const seenLabels = new Set();
const finalVisible = [];
resultList.forEach((tag) => {
  const formatted = formatTagGender(tag, 'homme', false, tagsDisponibles);
  const norm = String(formatted).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\.\-_]/g, '').trim();
  if (!norm || seenLabels.has(norm)) return;
  seenLabels.add(norm);
  finalVisible.push(formatted);
});

console.log('Final visible badges for duplicate CA member:', finalVisible);
if (finalVisible.filter(l => l.toLowerCase().includes('c.a') || l.toLowerCase().includes('ca')).length !== 1) {
  throw new Error(`❌ ÉCHEC : "C.A." doit apparaître exactement 1 fois, reçu : ${JSON.stringify(finalVisible)}`);
}
console.log('✅ 2. Éradication des doublons validée : "C.A." n\'apparaît qu\'une seule fois.');

// --- TEST 3 : Vrai secrétaire élu au Bureau ---
const realSecretaire = {
  id: 'sec_1',
  prenom: 'Camille',
  nom: 'Dupont',
  genre: 'femme',
  role: 'secretaire',
  tags: []
};

const secEffectiveTags = getEffectiveMemberTags(realSecretaire);
const secKeys = secEffectiveTags.map(t => getCanonicalTagKey(t));
if (!secKeys.includes('secretaire') || !secKeys.includes('bureau') || !secKeys.includes('ca')) {
  throw new Error(`❌ ÉCHEC : Le secrétaire élu doit avoir Secrétaire, Bureau et C.A., reçu : ${JSON.stringify(secKeys)}`);
}
console.log('✅ 3. Héritage institutionnel du Secrétaire élu validé (Secrétaire -> Bureau -> C.A.).');

// --- TEST 4 : Vrai président élu au Bureau ---
const president = {
  id: 'pres_1',
  prenom: 'Claire',
  nom: 'Vallet',
  genre: 'femme',
  tags: ['Présidente']
};

const presEffectiveTags = getEffectiveMemberTags(president);
const presKeys = presEffectiveTags.map(t => getCanonicalTagKey(t));
if (!presKeys.includes('president') || !presKeys.includes('bureau') || !presKeys.includes('ca')) {
  throw new Error(`❌ ÉCHEC : La présidente doit avoir Présidente, Bureau et C.A., reçu : ${JSON.stringify(presKeys)}`);
}
console.log('✅ 4. Héritage institutionnel de la Présidente validé (Présidente -> Bureau -> C.A.).');

console.log('\n🎉 TOUS LES TESTS DE DÉDUPLICATION ET DE SÉPARATION SECRÉTARIAT / SECRÉTAIRE SONT VALIDÉS AVEC SUCCÈS !\n');
