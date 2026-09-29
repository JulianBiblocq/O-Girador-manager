import { formatPratiques } from '../src/utils/instrumentUtils.js';

console.log("=== VÉRIFICATION CONTENU CSV D'EXPORT ===");

// Simulation d'une liste de membres représentatifs
const sampleMembers = [
  { prenom: 'Nathalie', nom: 'Le floch', email: 'nath5683@hotmail.fr', telephone: '0652140293', role: 'membre', genre: 'feminin', pratiqueDanse: true, instrumentsJoues: [] },
  { prenom: 'Sophie', nom: 'Le Huec', email: 'sophie.lehuec@sfr.fr', telephone: '0622677712', role: 'membre', genre: 'feminin', pratiqueDanse: true, instrumentsJoues: [] },
  { prenom: 'Amandine', nom: 'Fustec', email: 'amandine.fustec@hotmail.fr', telephone: '0683225226', role: 'membre', genre: 'feminin', pratiqueDanse: true, instrumentsJoues: ['Caixa', 'Alfaia'] },
  { prenom: 'Julian', nom: 'Biblocq', email: 'julian.bzh@gmail.com', telephone: '0612345678', role: 'mestre', genre: 'masculin', pratiqueDanse: false, instrumentsJoues: ['Caixa', 'Alfaia', 'Gonguê'] }
];

const headers = ["Nom", "Prénom", "Email", "Téléphone", "Rôle", "Instruments joués"];

const rows = sampleMembers.map(m => [
  m.nom,
  m.prenom,
  m.email,
  m.telephone,
  m.role,
  formatPratiques(m)
]);

// Formatage CSV avec BOM UTF-8 et séparateur point-virgule
const csvContent = "\uFEFF" + [headers, ...rows]
  .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
  .join("\n");

console.log("Extrait CSV produit :");
console.log(csvContent);

// Vérifications d'intégrité
if (!csvContent.includes('"Le floch";"Nathalie";"nath5683@hotmail.fr";"0652140293";"membre";"Danse"')) {
  throw new Error("Échec : Nathalie doit avoir 'Danse' dans la colonne Instrument");
}

if (!csvContent.includes('"Le Huec";"Sophie";"sophie.lehuec@sfr.fr";"0622677712";"membre";"Danse"')) {
  throw new Error("Échec : Sophie doit avoir 'Danse' dans la colonne Instrument");
}

if (!csvContent.includes('"Fustec";"Amandine";"amandine.fustec@hotmail.fr";"0683225226";"membre";"Caixa, Alfaia, Danse"')) {
  throw new Error("Échec : Amandine doit avoir 'Caixa, Alfaia, Danse' dans la colonne Instrument");
}

if (!csvContent.includes('"Biblocq";"Julian";"julian.bzh@gmail.com";"0612345678";"mestre";"Caixa, Alfaia, Gonguê"')) {
  throw new Error("Échec : Julian doit avoir 'Caixa, Alfaia, Gonguê' sans Danse");
}

console.log("✅ Toutes les assertions du fichier CSV d'export sont vérifiées !");
