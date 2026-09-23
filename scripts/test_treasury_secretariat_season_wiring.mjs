/**
 * Test Automatisé : Raccordement Trésorerie, Notes de frais, Bilans AG & Exports
 * Valide l'intégration des cycles temporels (saison d'activité et exercice comptable)
 * sur les 4 pôles sans altération des règles de sécurité Firestore.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_SEASON_START_MONTH,
  DEFAULT_FISCAL_START_MONTH,
  getSeasonFromDate,
  getCurrentSeason,
  getPreviousSeason,
  getSeasonDateRange,
  getFiscalYearDateRange,
  isPastSeason
} from '../src/utils/seasonUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("==================================================================");
console.log("🧪 TEST : RACCORDEMENT TRÉSORERIE, NOTES DE FRAIS, AG & EXPORTS");
console.log("==================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// MODULE 1 : Pôle Notes de frais (useExpenseClaims & Composants)
// -------------------------------------------------------------
console.log("▶️ Module 1 : Pôle Notes de frais (useExpenseClaims, Modal & Vues)");

const hookPath = path.join(rootDir, 'src', 'hooks', 'useExpenseClaims.js');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

assert(hookContent.includes('saisonDebutMois'), "useExpenseClaims gère l'état saisonDebutMois");
assert(hookContent.includes('DEFAULT_SEASON_START_MONTH'), "useExpenseClaims importe DEFAULT_SEASON_START_MONTH comme fallback");
assert(hookContent.includes('getSeasonFromDate'), "useExpenseClaims calcule la saison via getSeasonFromDate");
assert(hookContent.includes('const saison = getSeasonFromDate('), "addExpenseClaim calcule et persiste la saison dynamique calculée");

const modalPath = path.join(rootDir, 'src', 'components', 'expenses', 'ExpenseClaimModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf-8');
assert(modalContent.includes('saisonDebutMois'), "ExpenseClaimModal accepte la prop saisonDebutMois");
assert(modalContent.includes('getSeasonFromDate('), "ExpenseClaimModal utilise getSeasonFromDate dynamiquement");

const treasuryClaimsPath = path.join(rootDir, 'src', 'components', 'treasury', 'TreasuryExpenseClaims.jsx');
const treasuryClaimsContent = fs.readFileSync(treasuryClaimsPath, 'utf-8');
assert(treasuryClaimsContent.includes('getCurrentSeason('), "TreasuryExpenseClaims initialise currentSeason dynamiquement");
assert(treasuryClaimsContent.includes('isPastSeason(claim.saison, currentSeason)'), "TreasuryExpenseClaims filtre les impayés passés en mémoire sans index composite");

const memberExpensePath = path.join(rootDir, 'src', 'components', 'expenses', 'MemberExpenseSection.jsx');
const memberExpenseContent = fs.readFileSync(memberExpensePath, 'utf-8');
assert(memberExpenseContent.includes('getCurrentSeason('), "MemberExpenseSection utilise getCurrentSeason");
assert(memberExpenseContent.includes('saisonDebutMois={effectiveStartMonth}'), "MemberExpenseSection transmet la saison au modal");

// -------------------------------------------------------------
// MODULE 2 : Pôle Secrétariat & AG (SecretariatReportsView & Slideshow)
// -------------------------------------------------------------
console.log("\n▶️ Module 2 : Pôle Secrétariat & AG (SecretariatReportsView & AgSlideshowModal)");

const secrReportsPath = path.join(rootDir, 'src', 'components', 'secretariat', 'SecretariatReportsView.jsx');
const secrReportsContent = fs.readFileSync(secrReportsPath, 'utf-8');

assert(secrReportsContent.includes('getSeasonDateRange'), "SecretariatReportsView importe getSeasonDateRange");
assert(secrReportsContent.includes('getFiscalYearDateRange'), "SecretariatReportsView importe getFiscalYearDateRange");
assert(secrReportsContent.includes('getPreviousSeason'), "SecretariatReportsView importe getPreviousSeason");
assert(!secrReportsContent.includes("'09-01'"), "SecretariatReportsView ne contient plus de date '09-01' codée en dur");
assert(secrReportsContent.includes('periodLabel={periodLabel}'), "SecretariatReportsView transmet periodLabel à AgSlideshowModal");

// Test de robustesse du décrément getPreviousSeason
assert(getPreviousSeason('2026-2027') === '2025-2026', "Décrément robuste saison décalée : '2026-2027' -> '2025-2026'");
assert(getPreviousSeason('2026') === '2025', "Décrément robuste saison civile : '2026' -> '2025'");
assert(getPreviousSeason('Invalide') === 'Invalide', "Repli gracieux si libellé non reconnu");

const slideshowPath = path.join(rootDir, 'src', 'components', 'secretariat', 'reports', 'AgSlideshowModal.jsx');
const slideshowContent = fs.readFileSync(slideshowPath, 'utf-8');
assert(slideshowContent.includes('periodLabel'), "AgSlideshowModal accepte la prop periodLabel");
assert(slideshowContent.includes('{periodLabel}'), "AgSlideshowModal injecte le libellé de période dans les slides et livret A4");

// -------------------------------------------------------------
// MODULE 3 : Pôles Trésorerie & Studio (Dashboard, Exports & Activité)
// -------------------------------------------------------------
console.log("\n▶️ Module 3 : Pôles Trésorerie & Studio (TreasuryDashboard, ReportsExports, ActivityReports)");

const treasuryDashPath = path.join(rootDir, 'src', 'components', 'treasury', 'TreasuryDashboard.jsx');
const treasuryDashContent = fs.readFileSync(treasuryDashPath, 'utf-8');
assert(treasuryDashContent.includes('getFiscalYearDateRange'), "TreasuryDashboard importe getFiscalYearDateRange");
assert(treasuryDashContent.includes('DEFAULT_FISCAL_START_MONTH'), "TreasuryDashboard importe DEFAULT_FISCAL_START_MONTH");
assert(!treasuryDashContent.includes("getMonth() >= 8"), "TreasuryDashboard n'utilise plus getMonth() >= 8");
assert(treasuryDashContent.includes('setUserHasCustomizedDates(true)'), "TreasuryDashboard préserve la liberté de modification de l'utilisateur");

const reportsExportsPath = path.join(rootDir, 'src', 'components', 'ReportsExports.jsx');
const reportsExportsContent = fs.readFileSync(reportsExportsPath, 'utf-8');
assert(reportsExportsContent.includes('getFiscalYearDateRange'), "ReportsExports importe getFiscalYearDateRange");
assert(!reportsExportsContent.includes("getMonth() >= 8"), "ReportsExports n'utilise plus getMonth() >= 8");
assert(reportsExportsContent.includes('\\uFEFF'), "ReportsExports inclut le BOM UTF-8 (\\uFEFF) pour Excel");
assert(reportsExportsContent.includes('.join(";")'), "ReportsExports utilise le point-virgule comme séparateur CSV");

const activityReportsPath = path.join(rootDir, 'src', 'components', 'studio', 'ActivityReports.jsx');
const activityReportsContent = fs.readFileSync(activityReportsPath, 'utf-8');
assert(activityReportsContent.includes('getSeasonDateRange'), "ActivityReports importe getSeasonDateRange");
assert(activityReportsContent.includes('getCurrentSeason'), "ActivityReports importe getCurrentSeason");
assert(!activityReportsContent.includes("getMonth() >= 8"), "ActivityReports n'utilise plus getMonth() >= 8");
assert(activityReportsContent.includes('\\uFEFF'), "ActivityReports inclut le BOM UTF-8 (\\uFEFF) pour Excel");
assert(activityReportsContent.includes('.join(";")'), "ActivityReports utilise le point-virgule comme séparateur CSV");

// -------------------------------------------------------------
// MODULE 4 : Gouvernance de Sécurité Firebase
// -------------------------------------------------------------
console.log("\n▶️ Module 4 : Gouvernance de Sécurité Firebase");
const firestoreRulesExists = fs.existsSync(path.join(rootDir, 'firestore.rules'));
const storageRulesExists = fs.existsSync(path.join(rootDir, 'storage.rules'));
assert(!firestoreRulesExists, "Aucun fichier local firestore.rules n'est présent dans ce dépôt (gouvernance centralisée)");
assert(!storageRulesExists, "Aucun fichier local storage.rules n'est présent dans ce dépôt (gouvernance centralisée)");

// -------------------------------------------------------------
// Bilan final
// -------------------------------------------------------------
console.log("\n==================================================================");
console.log(`📊 Résultat : ${passedTests} / ${totalTests} assertions validées avec succès.`);
console.log("==================================================================");

if (passedTests === totalTests) {
  console.log("🎉 RACCORDEMENT COMPLET TRÉSORERIE, SECRÉTARIAT & STUDIO VALIDÉ !");
  process.exit(0);
} else {
  console.error("❌ CERTAINES ASSERTIONS ONT ÉCHOUÉ.");
  process.exit(1);
}
