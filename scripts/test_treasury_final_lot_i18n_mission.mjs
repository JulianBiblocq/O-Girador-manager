// Test de validation de l'internationalisation FR / PT-BR — Pôle Trésorerie (Lot Final)
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : TRÉSORERIE (LOT FINAL) - ÉRADICATION TEXTES EN DUR');
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
// 1. Contrôle des 75 clés du lot final dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle des 75 clés du lot final dans fr.treasury et pt.treasury');

const finalLotKeys = [
  // Bilan détaillé & Coordonnées bancaires (Image 1)
  'detailedFinancialBalance',
  'catCotisationsAdhesions',
  'catRecettesEvents',
  'catOperationsDiverses',
  'catFraisEvents',
  'catDefraiementsKm',
  'bankDetailsBillingTitle',
  'toggleExpand',
  'toggleCollapse',
  'cashProjectionTitle',
  'btnEditBalances',

  // Comptes bancaires & Alertes (Image 2)
  'thAccountName',
  'thCurrentBalance',
  'thAlertThreshold',
  'thLastUpdate',
  'accountChecking',
  'accountSavings',
  'accountCash',
  'neverUpdated',

  // Cotisations & Cautions (Image 3)
  'badgeReservedTreasurer',
  'searchMemberPlaceholder',
  'filterAllCautions',
  'btnSyncHelloasso',

  // Finances des Événements (Image 4)
  'eventsFinancialModelNotice',
  'thDate',
  'thTitleType',
  'thLocation',
  'thIncome',
  'thExpenses',
  'thBalance',
  'btnEdit',

  // Opérations diverses & Pièces (Image 5)
  'btnNewCategory',
  'catMaterial',
  'chooseFileBtn',
  'noFileChosen',
  'tagCotisations',

  // Notes de frais & Remboursements (Image 6)
  'tabExpensesReceipts',
  'tabMileageCarpool',
  'btnBack',
  'notesToProcess',
  'readyToPayCount',
  'totalDueMembers',
  'refundedOnSeasonYear',
  'showAllUnpaid',
  'searchMemberReason',
  'allStatuses',
  'refundRequestsTitle',
  'thSeason',
  'thMember',
  'thReason',
  'thAmount',
  'thReceipt',
  'thMemberIban',
  'thStatus',
  'btnViewReceipt',
  'btnCopyIban',
  'btnReject',
  'ibanNotProvided',

  // Grand Livre & Exports (Image 7)
  'ledgerBannerDesc',
  'ledgerPeriodTitle',
  'btnExportCsvLedger',
  'dateStart',
  'dateEnd',
  'totalIncomePlus',
  'totalExpensesMinus',
  'periodBalance',
  'ledgerTableTitle',
  'filterLedgerPlaceholder',
  'thDebit',
  'thCredit',
  'thCategory',
  'thLabelDetail',
  'totalPeriod',
  'catCotisationAdhesion',
  'catCotisationOption'
];

assert(finalLotKeys.length === 75, `Le lot final contient exactement 75 clés identifiées (trouvées : ${finalLotKeys.length})`);

finalLotKeys.forEach(key => {
  assert(fr.treasury && typeof fr.treasury[key] === 'string' && fr.treasury[key].length > 0, `Clé fr.treasury.${key} définie et non-vide`);
  assert(pt.treasury && typeof pt.treasury[key] === 'string' && pt.treasury[key].length > 0, `Clé pt.treasury.${key} définie et non-vide`);
});

// -----------------------------------------------------------------------------
// 2. Contrôle de parité globale et zéro orpheline
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Symétrie globale des dictionnaires fr.js et pt.js');

const getLeaves = (o, pfx = '') =>
  Object.keys(o).flatMap(k =>
    typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])
      ? getLeaves(o[k], pfx + k + '.')
      : [pfx + k]
  );

const frLeaves = getLeaves(fr);
const ptLeaves = getLeaves(pt);
const frOrphans = frLeaves.filter(k => !ptLeaves.includes(k));
const ptOrphans = ptLeaves.filter(k => !frLeaves.includes(k));

assert(frOrphans.length === 0, `0 clé orpheline dans fr.js (trouvées : ${frOrphans.length})`);
assert(ptOrphans.length === 0, `0 clé orpheline dans pt.js (trouvées : ${ptOrphans.length})`);
assert(frLeaves.length === ptLeaves.length, `Symétrie stricte confirmée : FR (${frLeaves.length}) === PT (${ptLeaves.length})`);

// -----------------------------------------------------------------------------
// 3. Contrôle des branchements dans les composants de Trésorerie
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Contrôle des branchements useTranslation dans les composants');

// Image 1 : TreasuryDashboard.jsx
const dashSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryDashboard.jsx'), 'utf8');
assert(dashSrc.includes("t('treasury.detailedFinancialBalance')"), "TreasuryDashboard branche t('treasury.detailedFinancialBalance')");
assert(dashSrc.includes("t('treasury.catCotisationsAdhesions')"), "TreasuryDashboard branche t('treasury.catCotisationsAdhesions')");
assert(dashSrc.includes("t('treasury.catRecettesEvents')"), "TreasuryDashboard branche t('treasury.catRecettesEvents')");
assert(dashSrc.includes("t('treasury.catOperationsDiverses')"), "TreasuryDashboard branche t('treasury.catOperationsDiverses')");
assert(dashSrc.includes("t('treasury.catFraisEvents')"), "TreasuryDashboard branche t('treasury.catFraisEvents')");
assert(dashSrc.includes("t('treasury.catDefraiementsKm')"), "TreasuryDashboard branche t('treasury.catDefraiementsKm')");
assert(dashSrc.includes("t('treasury.bankDetailsBillingTitle')"), "TreasuryDashboard branche t('treasury.bankDetailsBillingTitle')");
assert(dashSrc.includes("t('treasury.toggleExpand')"), "TreasuryDashboard branche t('treasury.toggleExpand')");
assert(dashSrc.includes("t('treasury.toggleCollapse')"), "TreasuryDashboard branche t('treasury.toggleCollapse')");

// Image 1 & 2 : BankAccountsTracker.jsx
const bankSrc = fs.readFileSync(path.resolve('src/components/treasury/BankAccountsTracker.jsx'), 'utf8');
assert(bankSrc.includes("t('treasury.cashProjectionTitle')"), "BankAccountsTracker branche t('treasury.cashProjectionTitle')");
assert(bankSrc.includes("t('treasury.btnEditBalances')"), "BankAccountsTracker branche t('treasury.btnEditBalances')");
assert(bankSrc.includes("t('treasury.thAccountName')"), "BankAccountsTracker branche t('treasury.thAccountName')");
assert(bankSrc.includes("t('treasury.thCurrentBalance')"), "BankAccountsTracker branche t('treasury.thCurrentBalance')");
assert(bankSrc.includes("t('treasury.thAlertThreshold')"), "BankAccountsTracker branche t('treasury.thAlertThreshold')");
assert(bankSrc.includes("t('treasury.thLastUpdate')"), "BankAccountsTracker branche t('treasury.thLastUpdate')");
assert(bankSrc.includes("t('treasury.accountChecking')"), "BankAccountsTracker branche t('treasury.accountChecking')");
assert(bankSrc.includes("t('treasury.accountSavings')"), "BankAccountsTracker branche t('treasury.accountSavings')");
assert(bankSrc.includes("t('treasury.accountCash')"), "BankAccountsTracker branche t('treasury.accountCash')");
assert(bankSrc.includes("t('treasury.neverUpdated')"), "BankAccountsTracker branche t('treasury.neverUpdated')");

// Image 3 : TreasuryCotisations.jsx
const cotisSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryCotisations.jsx'), 'utf8');
assert(cotisSrc.includes("t('treasury.badgeReservedTreasurer')"), "TreasuryCotisations branche t('treasury.badgeReservedTreasurer')");
assert(cotisSrc.includes("t('treasury.searchMemberPlaceholder')"), "TreasuryCotisations branche t('treasury.searchMemberPlaceholder')");
assert(cotisSrc.includes("t('treasury.filterAllCautions')"), "TreasuryCotisations branche t('treasury.filterAllCautions')");
assert(cotisSrc.includes("t('treasury.btnSyncHelloasso')"), "TreasuryCotisations branche t('treasury.btnSyncHelloasso')");

// Image 4 : TreasuryEvents.jsx & TreasuryEventsRow.jsx
const evtsSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryEvents.jsx'), 'utf8');
assert(evtsSrc.includes("t('treasury.eventsFinancialModelNotice')"), "TreasuryEvents branche t('treasury.eventsFinancialModelNotice')");
assert(evtsSrc.includes("t('treasury.thDate')"), "TreasuryEvents branche t('treasury.thDate')");
assert(evtsSrc.includes("t('treasury.thTitleType')"), "TreasuryEvents branche t('treasury.thTitleType')");
assert(evtsSrc.includes("t('treasury.thLocation')"), "TreasuryEvents branche t('treasury.thLocation')");
assert(evtsSrc.includes("t('treasury.thIncome')"), "TreasuryEvents branche t('treasury.thIncome')");
assert(evtsSrc.includes("t('treasury.thExpenses')"), "TreasuryEvents branche t('treasury.thExpenses')");
assert(evtsSrc.includes("t('treasury.thBalance')"), "TreasuryEvents branche t('treasury.thBalance')");

const rowSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryEventsRow.jsx'), 'utf8');
assert(rowSrc.includes("t('treasury.btnEdit')"), "TreasuryEventsRow branche t('treasury.btnEdit')");

// Image 5 : TreasuryOperations.jsx
const opsSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryOperations.jsx'), 'utf8');
assert(opsSrc.includes("t('treasury.btnNewCategory')"), "TreasuryOperations branche t('treasury.btnNewCategory')");
assert(opsSrc.includes("t('treasury.catMaterial')"), "TreasuryOperations branche t('treasury.catMaterial')");
assert(opsSrc.includes("t('treasury.chooseFileBtn')"), "TreasuryOperations branche t('treasury.chooseFileBtn')");
assert(opsSrc.includes("t('treasury.noFileChosen')"), "TreasuryOperations branche t('treasury.noFileChosen')");
assert(opsSrc.includes("t('treasury.tagCotisations')"), "TreasuryOperations branche t('treasury.tagCotisations')");

// Image 6 : TreasuryFraisTab.jsx & TreasuryExpenseClaims.jsx
const fraisTabSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryFraisTab.jsx'), 'utf8');
assert(fraisTabSrc.includes("t('treasury.tabExpensesReceipts')"), "TreasuryFraisTab branche t('treasury.tabExpensesReceipts')");
assert(fraisTabSrc.includes("t('treasury.tabMileageCarpool')"), "TreasuryFraisTab branche t('treasury.tabMileageCarpool')");
assert(fraisTabSrc.includes("t('treasury.btnBack')"), "TreasuryFraisTab branche t('treasury.btnBack')");

const claimsSrc = fs.readFileSync(path.resolve('src/components/treasury/TreasuryExpenseClaims.jsx'), 'utf8');
assert(claimsSrc.includes("t('treasury.notesToProcess')"), "TreasuryExpenseClaims branche t('treasury.notesToProcess')");
assert(claimsSrc.includes("t('treasury.readyToPayCount'"), "TreasuryExpenseClaims branche t('treasury.readyToPayCount')");
assert(claimsSrc.includes("t('treasury.totalDueMembers')"), "TreasuryExpenseClaims branche t('treasury.totalDueMembers')");
assert(claimsSrc.includes("t('treasury.refundedOnSeasonYear'"), "TreasuryExpenseClaims branche t('treasury.refundedOnSeasonYear')");
assert(claimsSrc.includes("t('treasury.showAllUnpaid')"), "TreasuryExpenseClaims branche t('treasury.showAllUnpaid')");
assert(claimsSrc.includes("t('treasury.searchMemberReason')"), "TreasuryExpenseClaims branche t('treasury.searchMemberReason')");
assert(claimsSrc.includes("t('treasury.allStatuses')"), "TreasuryExpenseClaims branche t('treasury.allStatuses')");
assert(claimsSrc.includes("t('treasury.refundRequestsTitle'"), "TreasuryExpenseClaims branche t('treasury.refundRequestsTitle')");
assert(claimsSrc.includes("t('treasury.thDate')"), "TreasuryExpenseClaims branche t('treasury.thDate')");
assert(claimsSrc.includes("t('treasury.thSeason')"), "TreasuryExpenseClaims branche t('treasury.thSeason')");
assert(claimsSrc.includes("t('treasury.thMember')"), "TreasuryExpenseClaims branche t('treasury.thMember')");
assert(claimsSrc.includes("t('treasury.thReason')"), "TreasuryExpenseClaims branche t('treasury.thReason')");
assert(claimsSrc.includes("t('treasury.thAmount')"), "TreasuryExpenseClaims branche t('treasury.thAmount')");
assert(claimsSrc.includes("t('treasury.thReceipt')"), "TreasuryExpenseClaims branche t('treasury.thReceipt')");
assert(claimsSrc.includes("t('treasury.thMemberIban')"), "TreasuryExpenseClaims branche t('treasury.thMemberIban')");
assert(claimsSrc.includes("t('treasury.thStatus')"), "TreasuryExpenseClaims branche t('treasury.thStatus')");
assert(claimsSrc.includes("t('treasury.btnViewReceipt')"), "TreasuryExpenseClaims branche t('treasury.btnViewReceipt')");
assert(claimsSrc.includes("t('treasury.btnCopyIban')"), "TreasuryExpenseClaims branche t('treasury.btnCopyIban')");
assert(claimsSrc.includes("t('treasury.btnReject')"), "TreasuryExpenseClaims branche t('treasury.btnReject')");
assert(claimsSrc.includes("t('treasury.ibanNotProvided')"), "TreasuryExpenseClaims branche t('treasury.ibanNotProvided')");

// Image 7 : ReportsExports.jsx
const reportsSrc = fs.readFileSync(path.resolve('src/components/ReportsExports.jsx'), 'utf8');
assert(reportsSrc.includes("t('treasury.ledgerBannerDesc')"), "ReportsExports branche t('treasury.ledgerBannerDesc')");
assert(reportsSrc.includes("t('treasury.ledgerPeriodTitle')"), "ReportsExports branche t('treasury.ledgerPeriodTitle')");
assert(reportsSrc.includes("t('treasury.btnExportCsvLedger')"), "ReportsExports branche t('treasury.btnExportCsvLedger')");
assert(reportsSrc.includes("t('treasury.dateStart')"), "ReportsExports branche t('treasury.dateStart')");
assert(reportsSrc.includes("t('treasury.dateEnd')"), "ReportsExports branche t('treasury.dateEnd')");
assert(reportsSrc.includes("t('treasury.totalIncomePlus')"), "ReportsExports branche t('treasury.totalIncomePlus')");
assert(reportsSrc.includes("t('treasury.totalExpensesMinus')"), "ReportsExports branche t('treasury.totalExpensesMinus')");
assert(reportsSrc.includes("t('treasury.periodBalance')"), "ReportsExports branche t('treasury.periodBalance')");
assert(reportsSrc.includes("t('treasury.ledgerTableTitle')"), "ReportsExports branche t('treasury.ledgerTableTitle')");
assert(reportsSrc.includes("t('treasury.filterLedgerPlaceholder')"), "ReportsExports branche t('treasury.filterLedgerPlaceholder')");
assert(reportsSrc.includes("t('treasury.thDate')"), "ReportsExports branche t('treasury.thDate')");
assert(reportsSrc.includes("t('treasury.thCategory')"), "ReportsExports branche t('treasury.thCategory')");
assert(reportsSrc.includes("t('treasury.thLabelDetail')"), "ReportsExports branche t('treasury.thLabelDetail')");
assert(reportsSrc.includes("t('treasury.thDebit')"), "ReportsExports branche t('treasury.thDebit')");
assert(reportsSrc.includes("t('treasury.thCredit')"), "ReportsExports branche t('treasury.thCredit')");
assert(reportsSrc.includes("t('treasury.totalPeriod')"), "ReportsExports branche t('treasury.totalPeriod')");
assert(reportsSrc.includes("t('treasury.catCotisationAdhesion')"), "ReportsExports branche t('treasury.catCotisationAdhesion')");
assert(reportsSrc.includes("t('treasury.catCotisationOption')"), "ReportsExports branche t('treasury.catCotisationOption')");

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS DU LOT FINAL TRÉSORERIE SONT AU VERT !');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  process.exit(1);
}
