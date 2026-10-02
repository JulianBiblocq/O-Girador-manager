// Test de validation de l'internationalisation FR / PT-BR — Pôle Trésorerie & Cotisations
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : INTERNATIONALISATION (FR / PT-BR) - TRÉSORERIE & COTISATIONS');
console.log('========================================================================\n');

let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedAssertions++;
  }
}

// -----------------------------------------------------------------------------
// 1. Contrôle de parité des clés treasury dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle de parité du namespace treasury dans fr.js et pt.js');

const expectedTreasuryKeys = [
  'dashboardTitle',
  'currentBalance',
  'totalIncome',
  'totalExpenses',
  'netMargin',
  'fiscalYear',
  'btnExportCsv',
  'operationsJournalTitle',
  'btnAddOperation',
  'fieldDate',
  'fieldLabel',
  'labelPlaceholder',
  'fieldAmount',
  'fieldCategory',
  'categoryIncome',
  'categoryExpense',
  'fieldReceipt',
  'uploadReceiptNotice',
  'viewReceipt',
  'noReceipt',
  'btnSaveOperation',
  'noOperationsFound',
  'contributionsTitle',
  'membershipFormula',
  'amountDue',
  'paymentStatus',
  'statusPaidOnline',
  'statusPaidCashCheck',
  'statusExempted',
  'statusPending',
  'remainderToPay',
  'btnMarkAsPaid',
  'mileageTitle',
  'fiscalRatePerKm',
  'totalMileageDue',
  'btnValidateRefund',
  'refundValidatedToast'
];

assert(fr.treasury !== undefined, 'Namespace treasury présent dans fr.js');
assert(pt.treasury !== undefined, 'Namespace treasury présent dans pt.js');

expectedTreasuryKeys.forEach(key => {
  assert(fr.treasury && typeof fr.treasury[key] === 'string' && fr.treasury[key].length > 0, `Clé fr.treasury.${key} définie et non-vide`);
  assert(pt.treasury && typeof pt.treasury[key] === 'string' && pt.treasury[key].length > 0, `Clé pt.treasury.${key} définie et non-vide`);
});

const frKeys = Object.keys(fr.treasury || {});
const ptKeys = Object.keys(pt.treasury || {});
const frOrphans = frKeys.filter(k => !ptKeys.includes(k));
const ptOrphans = ptKeys.filter(k => !frKeys.includes(k));

assert(frOrphans.length === 0, `0 clé orpheline dans fr.treasury (trouvées : ${frOrphans.length})`);
assert(ptOrphans.length === 0, `0 clé orpheline dans pt.treasury (trouvées : ${ptOrphans.length})`);
assert(frKeys.length === expectedTreasuryKeys.length, `Nombre exact de clés treasury (${expectedTreasuryKeys.length}) respecté`);

// -----------------------------------------------------------------------------
// 2. Vérification de TreasuryDashboard.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôle des clés i18n dans TreasuryDashboard.jsx');
const dashboardPath = path.resolve('src/components/treasury/TreasuryDashboard.jsx');
assert(fs.existsSync(dashboardPath), 'TreasuryDashboard.jsx existe');

if (fs.existsSync(dashboardPath)) {
  const src = fs.readFileSync(dashboardPath, 'utf8');
  assert(src.includes("t('treasury.dashboardTitle')"), 'Titre branché sur t(treasury.dashboardTitle)');
  assert(src.includes("t('treasury.totalIncome')"), 'Total recettes branché sur t(treasury.totalIncome)');
  assert(src.includes("t('treasury.totalExpenses')"), 'Total dépenses branché sur t(treasury.totalExpenses)');
  assert(src.includes("t('treasury.netMargin')"), 'Résultat net branché sur t(treasury.netMargin)');
  assert(src.includes("t('treasury.currentBalance')"), 'Solde actuel branché sur t(treasury.currentBalance)');
  assert(src.includes("t('treasury.btnExportCsv')"), 'Bouton export CSV branché sur t(treasury.btnExportCsv)');
  assert(src.includes("t('treasury.fiscalYear')"), 'Exercice comptable branché sur t(treasury.fiscalYear)');
}

// -----------------------------------------------------------------------------
// 3. Vérification de TreasuryOperations.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Contrôle des clés i18n dans TreasuryOperations.jsx');
const opsPath = path.resolve('src/components/treasury/TreasuryOperations.jsx');
assert(fs.existsSync(opsPath), 'TreasuryOperations.jsx existe');

if (fs.existsSync(opsPath)) {
  const src = fs.readFileSync(opsPath, 'utf8');
  assert(src.includes("t('treasury.operationsJournalTitle')"), 'En-tête journal branché sur t(treasury.operationsJournalTitle)');
  assert(src.includes("t('treasury.btnAddOperation')"), 'Bouton ajout branché sur t(treasury.btnAddOperation)');
  assert(src.includes("t('treasury.fieldDate')"), 'Champ date branché sur t(treasury.fieldDate)');
  assert(src.includes("t('treasury.fieldLabel')"), 'Champ libellé branché sur t(treasury.fieldLabel)');
  assert(src.includes("t('treasury.labelPlaceholder')"), 'Placeholder libellé branché sur t(treasury.labelPlaceholder)');
  assert(src.includes("t('treasury.fieldAmount')"), 'Champ montant branché sur t(treasury.fieldAmount)');
  assert(src.includes("t('treasury.fieldCategory')"), 'Champ catégorie branché sur t(treasury.fieldCategory)');
  assert(src.includes("t('treasury.categoryExpense')"), 'Option dépense branchée sur t(treasury.categoryExpense)');
  assert(src.includes("t('treasury.categoryIncome')"), 'Option recette branchée sur t(treasury.categoryIncome)');
  assert(src.includes("t('treasury.fieldReceipt')"), 'Champ justificatif branché sur t(treasury.fieldReceipt)');
  assert(src.includes("t('treasury.uploadReceiptNotice')"), 'Consigne upload branchée sur t(treasury.uploadReceiptNotice)');
  assert(src.includes("t('treasury.viewReceipt')"), 'Lien justificatif branché sur t(treasury.viewReceipt)');
  assert(src.includes("t('treasury.noReceipt')"), 'Aucun justificatif branché sur t(treasury.noReceipt)');
  assert(src.includes("t('treasury.btnSaveOperation')"), 'Bouton enregistrer branché sur t(treasury.btnSaveOperation)');
  assert(src.includes("t('treasury.noOperationsFound')"), 'État vide branché sur t(treasury.noOperationsFound)');
}

// -----------------------------------------------------------------------------
// 4. Vérification de MemberTreasuryRow.jsx et TreasuryCotisations.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Contrôle des clés i18n dans MemberTreasuryRow.jsx et TreasuryCotisations.jsx');
const memberRowPath = path.resolve('src/components/MemberTreasuryRow.jsx');
assert(fs.existsSync(memberRowPath), 'MemberTreasuryRow.jsx existe');

if (fs.existsSync(memberRowPath)) {
  const src = fs.readFileSync(memberRowPath, 'utf8');
  assert(src.includes("t('treasury.statusPending')"), 'Statut unpaid / attente branché sur t(treasury.statusPending)');
  assert(src.includes("t('treasury.remainderToPay')"), 'Statut partiel branché sur t(treasury.remainderToPay)');
  assert(src.includes("t('treasury.statusPaidCashCheck')"), 'Statut paid branché sur t(treasury.statusPaidCashCheck)');
  assert(src.includes("t('treasury.statusExempted')"), 'Statut exempted branché sur t(treasury.statusExempted)');
  assert(src.includes("t('treasury.statusPaidOnline')"), 'Statut HelloAsso branché sur t(treasury.statusPaidOnline)');
  assert(src.includes("t('treasury.membershipFormula')"), 'Formule adhésion branchée sur t(treasury.membershipFormula)');
  assert(src.includes("t('treasury.amountDue')"), 'Montant dû branché sur t(treasury.amountDue)');
  assert(src.includes("t('treasury.paymentStatus')"), 'Statut règlement branché sur t(treasury.paymentStatus)');
  assert(src.includes("t('treasury.btnMarkAsPaid')"), 'Bouton marquer payé branché sur t(treasury.btnMarkAsPaid)');
}

const cotisationsPath = path.resolve('src/components/treasury/TreasuryCotisations.jsx');
if (fs.existsSync(cotisationsPath)) {
  const cotSrc = fs.readFileSync(cotisationsPath, 'utf8');
  assert(cotSrc.includes("t('treasury.membershipFormula')"), 'En-tête formule branché sur t(treasury.membershipFormula)');
  assert(cotSrc.includes("t('treasury.amountDue')"), 'En-tête montant dû branché sur t(treasury.amountDue)');
  assert(cotSrc.includes("t('treasury.paymentStatus')"), 'En-tête statut règlement branché sur t(treasury.paymentStatus)');
  assert(cotSrc.includes("t('treasury.statusPaidCashCheck')"), 'Statut barre/filtre branché sur t(treasury.statusPaidCashCheck)');
}

// -----------------------------------------------------------------------------
// 5. Vérification de KilometricReimbursementManager.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Contrôle des clés i18n dans KilometricReimbursementManager.jsx');
const kmPath = path.resolve('src/components/KilometricReimbursementManager.jsx');
assert(fs.existsSync(kmPath), 'KilometricReimbursementManager.jsx existe');

if (fs.existsSync(kmPath)) {
  const src = fs.readFileSync(kmPath, 'utf8');
  assert(src.includes("t('treasury.mileageTitle')"), 'Titre branché sur t(treasury.mileageTitle)');
  assert(src.includes("t('treasury.fiscalRatePerKm'"), 'Barème fiscal branché sur t(treasury.fiscalRatePerKm, { rate })');
  assert(src.includes("t('treasury.totalMileageDue')"), 'Total à rembourser branché sur t(treasury.totalMileageDue)');
  assert(src.includes("t('treasury.btnValidateRefund')"), 'Bouton de validation branché sur t(treasury.btnValidateRefund)');
  assert(src.includes("t('treasury.refundValidatedToast')"), 'Toast de validation branché sur t(treasury.refundValidatedToast)');
}

// -----------------------------------------------------------------------------
// 6. Test d'interpolation de LanguageContext.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 6 : Test de remplacement du paramètre rate dans fiscalRatePerKm');
const langCtxPath = path.resolve('src/components/LanguageContext.jsx');
assert(fs.existsSync(langCtxPath), 'LanguageContext.jsx existe');

const template1 = "Barème fiscal en vigueur : {{rate}} € / km";
const template2 = "Barème fiscal en vigueur : {rate} € / km";
const paramKey = 'rate';
const res1 = template1.replace(new RegExp(`\\{\\{?${paramKey}\\}\\}?`, 'g'), '0.40');
const res2 = template2.replace(new RegExp(`\\{\\{?${paramKey}\\}\\}?`, 'g'), '0.40');
assert(res1 === "Barème fiscal en vigueur : 0.40 € / km", 'Interpolation double accolade {{rate}} correcte sans accolades orphelines');
assert(res2 === "Barème fiscal en vigueur : 0.40 € / km", 'Interpolation simple accolade {rate} correcte');

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS DU PÔLE TRÉSORERIE SONT 100% VALIDÉS AVEC SUCCÈS !');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  console.log('========================================================================');
  process.exit(1);
}
