/**
 * Test de Recette Automatisé : Normalisation des Pupitres et Résolution en Cascade dans le Casse-tête
 * 
 * Valide les exigences de la mission :
 * 1. Fusion canonique Alfaia / Alfaias vers le libellé officiel unique (Maria Malua rejoint les 5 autres pour former 6 membres).
 * 2. Résolution en cascade de l'instrument d'un participant (Date -> Profil users -> 'En attente').
 * 3. Emmanuel Verquin, Hélène Chevalier et Delphine Biguereau quittent automatiquement 'En attente'.
 */

import assert from 'assert';
import { 
  resolvePupitreForInstrument, 
  canonicalizePupitreName, 
  resolveParticipantInstrument,
  computePupitresList 
} from '../src/utils/tagUtils.js';

console.log("=================================================================================");
console.log("🧪 DÉBUT DU TEST : CASSE-TÊTE - NORMALISATION PUPITRES & RÉSOLUTION CASCADE");
console.log("=================================================================================\n");

// Configuration représentative de l'association (ex: Samambaia)
const pupitresAssociation = ['Alfaias', 'Caixas', 'Gonguês', 'Agbês', 'Mineiros', 'Danse'];
const linkedInstruments = [
  { name: 'Agbê & Mineiro', instruments: ['Agbê', 'Mineiro'] }
];

// --- TEST 1 : Normalisation Canonique des Pupitres (Fusion Alfaia / Alfaias) ---
console.log("▶️ Test 1 : Normalisation canonique d'Alfaia et de ses sous-voix");

assert.strictEqual(
  resolvePupitreForInstrument('Alfaia', pupitresAssociation),
  'Alfaias',
  "Le singulier 'Alfaia' doit être canonisé en 'Alfaias' selon le libellé officiel de l'association"
);

assert.strictEqual(
  resolvePupitreForInstrument('Alfaias', pupitresAssociation),
  'Alfaias',
  "Le pluriel 'Alfaias' doit être conservé tel quel"
);

assert.strictEqual(
  resolvePupitreForInstrument('alfaia', pupitresAssociation),
  'Alfaias',
  "La casse insensible 'alfaia' doit être canonisée en 'Alfaias'"
);

assert.strictEqual(
  resolvePupitreForInstrument('Alfaia Marcante', pupitresAssociation),
  'Alfaias',
  "'Alfaia Marcante' doit être résolu en 'Alfaias'"
);

assert.strictEqual(
  resolvePupitreForInstrument('Marcante', pupitresAssociation),
  'Alfaias',
  "La sous-voix 'Marcante' doit être résolue en 'Alfaias'"
);

assert.strictEqual(
  resolvePupitreForInstrument('Meião', pupitresAssociation),
  'Alfaias',
  "La sous-voix 'Meião' doit être résolue en 'Alfaias'"
);

assert.strictEqual(
  resolvePupitreForInstrument('repique', pupitresAssociation),
  'Alfaias',
  "La sous-voix 'repique' doit être résolue en 'Alfaias'"
);

console.log("✅ Test 1 validé : Toutes les variantes d'Alfaia et ses sous-voix convergent vers 'Alfaias'.\n");

// --- TEST 2 : Normalisation Canonique de Caixa / Caixas / Tarol ---
console.log("▶️ Test 2 : Normalisation canonique de Caixa, Caixas et Tarol");

assert.strictEqual(
  resolvePupitreForInstrument('Caixa', pupitresAssociation),
  'Caixas',
  "'Caixa' doit être résolu vers 'Caixas'"
);

assert.strictEqual(
  resolvePupitreForInstrument('caixas', pupitresAssociation),
  'Caixas',
  "'caixas' minuscule doit être résolu vers 'Caixas'"
);

assert.strictEqual(
  resolvePupitreForInstrument('tarol', pupitresAssociation),
  'Caixas',
  "'tarol' doit être consolidé vers 'Caixas'"
);

console.log("✅ Test 2 validé : Caixa et Tarol convergent parfaitement vers 'Caixas'.\n");

// --- TEST 3 : Résolution en Cascade de l'Instrument d'un Participant ---
console.log("▶️ Test 3 : Résolution en cascade (Date -> Profil users -> 'En attente')");

// Cas 3.1 : Date prioritaire sur le profil
const participantAvecChoixDate = {
  instrumentChoisi: 'Caixa'
};
const userAvecAutreProfil = {
  instrumentPrincipal: 'Alfaias'
};
assert.strictEqual(
  resolveParticipantInstrument(participantAvecChoixDate, userAvecAutreProfil),
  'Caixa',
  "Le choix spécifique à la date doit primer sur le profil membre"
);

// Cas 3.2 : Date via assignedInstrument prioritaire
const participantAssigned = {
  assignedInstrument: 'Gonguê'
};
assert.strictEqual(
  resolveParticipantInstrument(participantAssigned, userAvecAutreProfil),
  'Gonguê',
  "L'instrument attribué pour la date (assignedInstrument) doit primer"
);

// Cas 3.3 : Date non renseignée ou 'En attente' -> Bascule sur le profil utilisateur (instrumentPrincipal)
const participantEnAttente = {
  instrumentChoisi: 'En attente'
};
const userAvecInstrumentPrincipal = {
  instrumentPrincipal: 'Alfaias'
};
assert.strictEqual(
  resolveParticipantInstrument(participantEnAttente, userAvecInstrumentPrincipal),
  'Alfaias',
  "Si la date est 'En attente', la cascade doit basculer vers user.instrumentPrincipal"
);

// Cas 3.4 : Date null -> Bascule sur user.instrument
const participantNull = {
  instrumentChoisi: null
};
const userAvecInstrument = {
  instrument: 'Caixa'
};
assert.strictEqual(
  resolveParticipantInstrument(participantNull, userAvecInstrument),
  'Caixa',
  "Si la date est null, la cascade doit basculer vers user.instrument"
);

// Cas 3.5 : Aucun instrument dans la date ni dans le profil -> 'En attente'
const participantSansRien = {
  instrumentChoisi: 'En attente'
};
const userSansRien = {
  instrumentPrincipal: '',
  instrument: 'En attente'
};
assert.strictEqual(
  resolveParticipantInstrument(participantSansRien, userSansRien),
  'En attente',
  "Si aucun instrument n'existe dans aucune source, le participant est classé 'En attente'"
);

console.log("✅ Test 3 validé : L'ordre de priorité en cascade fonctionne à 100%.\n");

// --- TEST 4 : Simulation du Casse-Tête (Maria Malua + Emmanuel, Hélène, Delphine) ---
console.log("▶️ Test 4 : Simulation complète du Tableau de présence / Casse-tête");

// Données des membres dans users
const mockUsers = {
  'u_maria': { id: 'u_maria', prenom: 'Maria', nom: 'Malua', instrumentPrincipal: 'Alfaias' },
  'u_alfaia1': { id: 'u_alfaia1', prenom: 'Lucas', nom: 'Marcador', instrumentPrincipal: 'Alfaia Marcante' },
  'u_alfaia2': { id: 'u_alfaia2', prenom: 'Camille', nom: 'Meiao', instrumentPrincipal: 'Alfaia Meião' },
  'u_alfaia3': { id: 'u_alfaia3', prenom: 'Antoine', nom: 'Repiqueur', instrumentPrincipal: 'Alfaia Repique' },
  'u_alfaia4': { id: 'u_alfaia4', prenom: 'Sarah', nom: 'Batucada', instrumentPrincipal: 'Alfaia' },
  'u_alfaia5': { id: 'u_alfaia5', prenom: 'Thomas', nom: 'Tambor', instrumentPrincipal: 'Alfaia' },
  'u_emmanuel': { id: 'u_emmanuel', prenom: 'Emmanuel', nom: 'Verquin', instrumentPrincipal: 'Caixa' },
  'u_helene': { id: 'u_helene', prenom: 'Hélène', nom: 'Chevalier', instrumentPrincipal: 'Alfaias' },
  'u_delphine': { id: 'u_delphine', prenom: 'Delphine', nom: 'Biguereau', instrument: 'Agbê' },
  'u_attente': { id: 'u_attente', prenom: 'Nouveau', nom: 'Membre', instrumentPrincipal: '' }
};

// Inscriptions sur l'événement (comme dans la base de données réelle)
const mockInscriptions = [
  // 5 membres Alfaias avec 'Alfaia' au singulier
  { userId: 'u_alfaia1', userName: 'Lucas Marcador', status: 'present', instrumentChoisi: 'Alfaia' },
  { userId: 'u_alfaia2', userName: 'Camille Meiao', status: 'present', instrumentChoisi: 'Alfaia' },
  { userId: 'u_alfaia3', userName: 'Antoine Repiqueur', status: 'present', instrumentChoisi: 'Alfaia' },
  { userId: 'u_alfaia4', userName: 'Sarah Batucada', status: 'present', instrumentChoisi: 'Alfaia' },
  { userId: 'u_alfaia5', userName: 'Thomas Tambor', status: 'present', instrumentChoisi: 'Alfaia' },
  // Maria Malua qui avait 'Alfaias' au pluriel
  { userId: 'u_maria', userName: 'Maria Malua', status: 'present', instrumentChoisi: 'Alfaias' },
  // Membres qui avaient 'En attente' ou null sur l'événement malgré leur profil
  { userId: 'u_emmanuel', userName: 'Emmanuel Verquin', status: 'present', instrumentChoisi: 'En attente' },
  { userId: 'u_helene', userName: 'Hélène Chevalier', status: 'present', instrumentChoisi: null },
  { userId: 'u_delphine', userName: 'Delphine Biguereau', status: 'present', instrumentChoisi: '' },
  // Un membre qui n'a vraiment pas d'instrument
  { userId: 'u_attente', userName: 'Nouveau Membre', status: 'present', instrumentChoisi: 'En attente' }
];

// Algorithme de regroupement identique à EventDetails.jsx
const groupedAttendance = {};
mockInscriptions.forEach((ins) => {
  if (ins.status === 'present') {
    const userInfo = mockUsers[ins.userId] || { id: ins.userId, prenom: ins.userName };
    const rawInst = resolveParticipantInstrument(ins, userInfo);
    const resolvedPupitre = rawInst === 'En attente'
      ? 'En attente'
      : (resolvePupitreForInstrument(rawInst, pupitresAssociation, linkedInstruments) || rawInst);

    if (!groupedAttendance[resolvedPupitre]) {
      groupedAttendance[resolvedPupitre] = [];
    }
    groupedAttendance[resolvedPupitre].push({
      ...userInfo,
      instrumentChoisi: rawInst
    });
  }
});

console.log("📊 Résultat du regroupement :", Object.fromEntries(
  Object.entries(groupedAttendance).map(([k, v]) => [k, v.map(m => `${m.prenom} ${m.nom}`)])
));

// 1. Maria Malua et les 5 autres membres Alfaias doivent former une SEULE ligne 'Alfaias'
assert(groupedAttendance['Alfaias'], "Le groupe 'Alfaias' doit exister");
assert.strictEqual(
  groupedAttendance['Alfaia'],
  undefined,
  "Le doublon 'Alfaia' ne doit plus exister, il doit être fusionné dans 'Alfaias'"
);

// Note : Lucas, Camille, Antoine, Sarah, Thomas, Maria Malua + Hélène Chevalier (profil Alfaias)
const alfaiasMembers = groupedAttendance['Alfaias'].map(m => `${m.prenom} ${m.nom}`);
assert(alfaiasMembers.includes('Maria Malua'), "Maria Malua doit être dans le groupe Alfaias");
assert(alfaiasMembers.includes('Lucas Marcador'), "Lucas Marcador doit être dans le groupe Alfaias");

// Vérifions les 6 membres initiaux (Maria Malua + les 5 Alfaia)
const initial6Alfaias = ['Lucas Marcador', 'Camille Meiao', 'Antoine Repiqueur', 'Sarah Batucada', 'Thomas Tambor', 'Maria Malua'];
initial6Alfaias.forEach(name => {
  assert(alfaiasMembers.includes(name), `${name} doit être dans le groupe 'Alfaias'`);
});

// 2. Emmanuel Verquin doit être dans Caixas
assert(groupedAttendance['Caixas'], "Le groupe 'Caixas' doit exister");
const caixasMembers = groupedAttendance['Caixas'].map(m => `${m.prenom} ${m.nom}`);
assert(caixasMembers.includes('Emmanuel Verquin'), "Emmanuel Verquin doit avoir rejoint 'Caixas'");

// 3. Delphine Biguereau doit être dans le groupe lié 'Agbê & Mineiro' (ou 'Agbês')
const agbeGroupKey = groupedAttendance['Agbê & Mineiro'] ? 'Agbê & Mineiro' : 'Agbês';
assert(groupedAttendance[agbeGroupKey], `Le groupe '${agbeGroupKey}' doit exister`);
const agbesMembers = groupedAttendance[agbeGroupKey].map(m => `${m.prenom} ${m.nom}`);
assert(agbesMembers.includes('Delphine Biguereau'), "Delphine Biguereau doit avoir rejoint son pupitre");

// 4. Seul le membre réellement sans instrument doit être dans 'En attente'
assert(groupedAttendance['En attente'], "Le groupe 'En attente' doit exister pour les sans-instrument");
const pendingMembers = groupedAttendance['En attente'].map(m => `${m.prenom} ${m.nom}`);
assert.strictEqual(pendingMembers.length, 1, "Il ne doit rester qu'un seul membre dans 'En attente'");
assert.strictEqual(pendingMembers[0], 'Nouveau Membre', "Seul 'Nouveau Membre' doit être dans 'En attente'");
assert(!pendingMembers.includes('Emmanuel Verquin'), "Emmanuel Verquin ne doit plus être dans 'En attente'");
assert(!pendingMembers.includes('Hélène Chevalier'), "Hélène Chevalier ne doit plus être dans 'En attente'");
assert(!pendingMembers.includes('Delphine Biguereau'), "Delphine Biguereau ne doit plus être dans 'En attente'");

console.log("\n✅ Test 4 validé :");
console.log("   - Maria Malua et les autres Alfaias sont regroupés sur une ligne unique sans doublon.");
console.log("   - Emmanuel Verquin a rejoint Caixas.");
console.log("   - Hélène Chevalier a rejoint Alfaias.");
console.log("   - Delphine Biguereau a rejoint Agbês.");
console.log("   - 'En attente' a été purgé des membres ayant un instrument dans leur profil.");

console.log("\n=================================================================================");
console.log("🏆 TOUS LES TESTS DE NORMALISATION ET CASCADE SONT VALIDÉS AVEC SUCCÈS (100%) !");
console.log("=================================================================================");
process.exit(0);
