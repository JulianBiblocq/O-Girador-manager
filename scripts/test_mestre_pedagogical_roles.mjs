/**
 * Test de validation unitaire : Rôles pédagogiques Mestre / Mestra de Danse
 * Vérifie l'isolation stricte entre permissions techniques et rôles associatifs.
 */

import { resolvePedagogicalRoles, getEffectiveMemberTags } from '../src/utils/memberUtils.js';
import {
  resolveMemberInstrumentSubtitle,
  isDefaultMemberBadge,
  isPedagogicalTag
} from '../src/components/trombinoscope/trombinoscopeUtils.js';

console.log('🧪 Démarrage du test de validation des rôles pédagogiques Mestre / Mestra...');

// 1. Utilisateur avec simple rôle technique 'mestre' sans étiquette pédagogique
const technicalOnlyUser = {
  id: 'tech_1',
  prenom: 'Alex',
  nom: 'Tech',
  role: 'mestre', // Rôle applicatif technique
  tags: ['Bénévole'],
  instrumentPrincipal: 'Alfaia'
};

const techRoles = resolvePedagogicalRoles(technicalOnlyUser);
if (techRoles.isMestreBatucada || techRoles.isMestreDanse) {
  throw new Error('❌ ÉCHEC : Le rôle technique "mestre" ne doit PAS donner le titre pédagogique sans étiquette.');
}
console.log('✅ 1. Rôle applicatif technique isolé : aucun badge Mestre induit.');

// 2. Julian (Mestre de batucada via étiquette 'Mestre')
const julian = {
  id: 'julian_1',
  prenom: 'Julian',
  nom: 'Biblocq',
  genre: 'homme',
  role: 'mestre',
  tags: ['Mestre', 'Direction', 'Bureau', 'CA'],
  instrumentPrincipal: 'Mestre',
  instrumentsJoues: ['Caixa', 'Gonguê', 'Alfaia']
};

const julianRoles = resolvePedagogicalRoles(julian);
if (!julianRoles.isMestreBatucada || julianRoles.isMestreDanse) {
  throw new Error('❌ ÉCHEC : Julian doit être reconnu comme Mestre de Batucada.');
}
if (julianRoles.pedagogicalTitle !== 'Mestre') {
  throw new Error(`❌ ÉCHEC : Titre attendu 'Mestre', reçu '${julianRoles.pedagogicalTitle}'`);
}
const julianSubtitle = resolveMemberInstrumentSubtitle(julian);
if (!julianSubtitle.includes('Mestre')) {
  throw new Error(`❌ ÉCHEC : Le sous-titre de Julian doit contenir 'Mestre', reçu: '${julianSubtitle}'`);
}
console.log(`✅ 2. Julian reconnu Mestre de batucada : titre='${julianRoles.pedagogicalTitle}', sous-titre='${julianSubtitle}', icône='${julianRoles.icon}'`);

// 3. Amandine (Mestra de danse référente)
const amandine = {
  id: 'amandine_1',
  prenom: 'Amandine',
  nom: 'Fustec',
  genre: 'feminin',
  role: 'membre',
  pratiqueDanse: true,
  instrumentsJoues: ['Caixa', 'Alfaia']
};

const amandineRoles = resolvePedagogicalRoles(amandine);
if (!amandineRoles.isMestreDanse || amandineRoles.isMestreBatucada) {
  throw new Error('❌ ÉCHEC : Amandine doit être reconnue comme Mestra de danse.');
}
if (amandineRoles.pedagogicalTitle !== 'Mestra de danse') {
  throw new Error(`❌ ÉCHEC : Titre attendu 'Mestra de danse', reçu '${amandineRoles.pedagogicalTitle}'`);
}
const amandineSubtitle = resolveMemberInstrumentSubtitle(amandine);
if (amandineSubtitle !== 'Mestra de danse') {
  throw new Error(`❌ ÉCHEC : Le sous-titre d'Amandine doit être 'Mestra de danse', reçu '${amandineSubtitle}'`);
}
console.log(`✅ 3. Amandine reconnue Mestra de danse : titre='${amandineRoles.pedagogicalTitle}', sous-titre='${amandineSubtitle}', icône='${amandineRoles.icon}'`);

// 4. Irène (Mestra de danse référente)
const irene = {
  id: 'irene_1',
  prenom: 'Irène',
  nom: 'Danse',
  tags: ['Danse'],
  instrumentPrincipal: 'Danse'
};

const ireneRoles = resolvePedagogicalRoles(irene);
if (!ireneRoles.isMestreDanse) {
  throw new Error('❌ ÉCHEC : Irène doit être reconnue comme Mestra de danse.');
}
if (ireneRoles.pedagogicalTitle !== 'Mestra de danse') {
  throw new Error(`❌ ÉCHEC : Titre attendu 'Mestra de danse', reçu '${ireneRoles.pedagogicalTitle}'`);
}
console.log(`✅ 4. Irène reconnue Mestra de danse : titre='${ireneRoles.pedagogicalTitle}', icône='${ireneRoles.icon}'`);

// 5. Autre membre avec tag 'Mestra de danse' explicite
const danceTeacher = {
  id: 'teacher_1',
  prenom: 'Clara',
  nom: 'Silva',
  genre: 'femme',
  tags: ['Mestra de danse'],
  instrumentPrincipal: 'Danse'
};
const teacherRoles = resolvePedagogicalRoles(danceTeacher);
if (!teacherRoles.isMestreDanse || teacherRoles.pedagogicalTitle !== 'Mestra de danse') {
  throw new Error('❌ ÉCHEC : Clara avec tag "Mestra de danse" doit être reconnue comme telle.');
}
console.log(`✅ 5. Tag explicite "Mestra de danse" validé pour profil générique.`);

// 6. Membre ordinaire (adulte débutant Caixa)
const regularMember = {
  id: 'regular_1',
  prenom: 'Lucas',
  nom: 'Martin',
  role: 'membre',
  tags: ['Adhérent'],
  instrumentPrincipal: 'Caixa'
};

const regularRoles = resolvePedagogicalRoles(regularMember);
if (regularRoles.isMestreBatucada || regularRoles.isMestreDanse) {
  throw new Error('❌ ÉCHEC : Lucas ne doit avoir aucune distinction Mestre.');
}
const regularSubtitle = resolveMemberInstrumentSubtitle(regularMember);
if (regularSubtitle !== 'Caixas') {
  throw new Error(`❌ ÉCHEC : Sous-titre attendu 'Caixas', reçu '${regularSubtitle}'`);
}
console.log(`✅ 6. Membre ordinaire validé sans badge Mestre : sous-titre='${regularSubtitle}'`);

// 7. Vérification de l'expansion getEffectiveMemberTags
const julianEffectiveTags = getEffectiveMemberTags(julian);
if (!julianEffectiveTags.includes('Mestre')) {
  throw new Error('❌ ÉCHEC : getEffectiveMemberTags(julian) doit inclure "Mestre"');
}
const amandineEffectiveTags = getEffectiveMemberTags(amandine);
if (!amandineEffectiveTags.includes('Mestra de danse')) {
  throw new Error('❌ ÉCHEC : getEffectiveMemberTags(amandine) doit inclure "Mestra de danse"');
}
console.log('✅ 7. getEffectiveMemberTags intègre les badges honorifiques pédagogiques.');

// 8. Vérification de isPedagogicalTag
if (!isPedagogicalTag('Mestre') || !isPedagogicalTag('Mestra de danse') || isPedagogicalTag('Trésorier')) {
  throw new Error('❌ ÉCHEC : isPedagogicalTag ne fonctionne pas correctement.');
}
console.log('✅ 8. isPedagogicalTag filtre et valide parfaitement les titres pédagogiques.');

console.log('\n🎉 TOUS LES TESTS DES RÔLES PÉDAGOGIQUES MESTRE / DANSE SONT PASSÉS AVEC SUCCÈS !\n');
