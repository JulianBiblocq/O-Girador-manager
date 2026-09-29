import { formatPratiques, getPratiquesList } from '../src/utils/instrumentUtils.js';

console.log("=== TEST FORMAT PRATIQUES & GET PRATIQUES LIST ===");

// 1. Danseur pur (ex: Sophie ou Nathalie inscrite à la danse uniquement)
const danseurPur = {
  nom: 'Danseuse',
  prenom: 'Sophie',
  pratiqueDanse: true,
  instrumentsJoues: []
};
const res1 = formatPratiques(danseurPur);
const list1 = getPratiquesList(danseurPur);
console.log("1. Danseur pur :", res1, list1);
if (res1 !== 'Danse' || list1.length !== 1 || list1[0] !== 'Danse') {
  throw new Error(`Échec test 1 : attendu "Danse", obtenu "${res1}"`);
}

// 2. Danseuse pure avec instrumentPrincipal: 'Danse'
const danseurPur2 = {
  nom: 'Test',
  prenom: 'Nathalie',
  pratiqueDanse: true,
  instrumentPrincipal: 'Danse'
};
const res2 = formatPratiques(danseurPur2);
const list2 = getPratiquesList(danseurPur2);
console.log("2. Danseur pur avec instrumentPrincipal 'Danse' :", res2, list2);
if (res2 !== 'Danse' || list2.length !== 1 || list2[0] !== 'Danse') {
  throw new Error(`Échec test 2 : attendu "Danse" sans doublon, obtenu "${res2}"`);
}

// 3. Polyvalent Percussion + Danse
const polyvalent = {
  nom: 'Poly',
  prenom: 'Alex',
  pratiqueDanse: true,
  instrumentsJoues: ['Caixa', 'Tarol']
};
const res3 = formatPratiques(polyvalent);
const list3 = getPratiquesList(polyvalent);
console.log("3. Polyvalent :", res3, list3);
if (res3 !== 'Caixa, Tarol, Danse' || list3.length !== 3 || list3[2] !== 'Danse') {
  throw new Error(`Échec test 3 : attendu "Caixa, Tarol, Danse", obtenu "${res3}"`);
}

// 4. Percussionniste pur
const percuPur = {
  nom: 'Batteur',
  prenom: 'Julien',
  pratiqueDanse: false,
  instrumentsJoues: ['Alfaia Marcante']
};
const res4 = formatPratiques(percuPur);
const list4 = getPratiquesList(percuPur);
console.log("4. Percu pur :", res4, list4);
if (res4 !== 'Alfaia Marcante' || list4.length !== 1) {
  throw new Error(`Échec test 4 : attendu "Alfaia Marcante", obtenu "${res4}"`);
}

// 5. Membre en attente
const enAttente = {
  nom: 'Nouveau',
  prenom: 'Inconnu',
  statutActuel: 'en_attente'
};
const res5 = formatPratiques(enAttente);
console.log("5. En attente :", res5);
if (res5 !== 'En attente') {
  throw new Error(`Échec test 5 : attendu "En attente", obtenu "${res5}"`);
}

// 6. Membre sans pratique
const sansPratique = {
  nom: 'Membre',
  prenom: 'Standard'
};
const res6 = formatPratiques(sansPratique);
console.log("6. Sans pratique :", res6);
if (res6 !== '-') {
  throw new Error(`Échec test 6 : attendu "-", obtenu "${res6}"`);
}

console.log("✅ Tous les tests unitaires formatPratiques sont validés !");
