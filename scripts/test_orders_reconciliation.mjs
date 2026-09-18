import assert from 'node:assert';

console.log("🧪 Test du rapprochement des commandes groupées et coordonnées bancaires...");

// 1. Test de résilience de lecture des coordonnées bancaires
function resolveBankDetails(data) {
  const iban = data?.ribIban || data?.iban || data?.bankDetails?.iban || '';
  const bic = data?.bic || data?.bankBic || data?.bankDetails?.bic || '';
  const titulaire = data?.titulaireCompte || data?.nomOfficiel || data?.nom || '';
  return { iban, bic, titulaire };
}

// Cas 1 : champs racine ribIban
const case1 = resolveBankDetails({ ribIban: 'FR76 1234', bic: 'BNPAFRPP', titulaireCompte: 'Asso Maracatu' });
assert.strictEqual(case1.iban, 'FR76 1234');
assert.strictEqual(case1.bic, 'BNPAFRPP');
assert.strictEqual(case1.titulaire, 'Asso Maracatu');

// Cas 2 : champ iban alternatif et nomOfficiel
const case2 = resolveBankDetails({ iban: 'FR76 5678', bankBic: 'SOGEFRPP', nomOfficiel: 'Maracatu O-Girador' });
assert.strictEqual(case2.iban, 'FR76 5678');
assert.strictEqual(case2.bic, 'SOGEFRPP');
assert.strictEqual(case2.titulaire, 'Maracatu O-Girador');

// Cas 3 : imbriqué dans bankDetails et fallback sur nom
const case3 = resolveBankDetails({ bankDetails: { iban: 'FR76 9999', bic: 'CRCAFRPP' }, nom: 'O-Girador' });
assert.strictEqual(case3.iban, 'FR76 9999');
assert.strictEqual(case3.bic, 'CRCAFRPP');
assert.strictEqual(case3.titulaire, 'O-Girador');

// Cas 4 : champs vides
const case4 = resolveBankDetails({});
assert.strictEqual(case4.iban, '');
assert.strictEqual(case4.bic, '');
assert.strictEqual(case4.titulaire, '');

console.log("✅ Résolution des coordonnées bancaires : tous les cas validés.");

// 2. Test du parsing et de la validation du montant facturé
function parseMontantFacture(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return NaN;
  return parseFloat(String(valeur).replace(',', '.'));
}

assert.strictEqual(parseMontantFacture('25,50'), 25.5);
assert.strictEqual(parseMontantFacture('25.50'), 25.5);
assert.strictEqual(parseMontantFacture('120'), 120);
assert.strictEqual(parseMontantFacture(45.8), 45.8);
assert(isNaN(parseMontantFacture('abc')));
assert(isNaN(parseMontantFacture('')));

// Validation stricte montant > 0
function isValidMontant(valeur) {
  const num = parseMontantFacture(valeur);
  return !isNaN(num) && num > 0;
}

assert.strictEqual(isValidMontant('25,50'), true);
assert.strictEqual(isValidMontant('0'), false);
assert.strictEqual(isValidMontant('-10'), false);
assert.strictEqual(isValidMontant(''), false);
assert.strictEqual(isValidMontant('abc'), false);

console.log("✅ Parsing et validation robuste du montant : validés.");

// 3. Test de format de libellé de virement requis
function buildVirementLabel(memberNom, article) {
  return `Commande ${memberNom || 'Membre'} ${article || 'Article'}`.trim();
}

assert.strictEqual(buildVirementLabel('Dupont', 'Alfaia 20"'), 'Commande Dupont Alfaia 20"');
assert.strictEqual(buildVirementLabel('', 'Baguettes'), 'Commande Membre Baguettes');

console.log("✅ Format du libellé de virement : validé.");
console.log("🎉 Tous les tests unitaires du Bloc 2 sont passés avec succès !");
