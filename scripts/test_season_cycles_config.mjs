import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_SEASON_START_MONTH,
  DEFAULT_FISCAL_START_MONTH,
  getSeasonFromDate,
  getCurrentSeason,
  getSeasonDateRange,
  getFiscalYearDateRange,
  isPastSeason,
  getSeasonOptions
} from '../src/utils/seasonUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : CYCLES ANNUELS & GESTION DES SAISONS");
console.log("===============================================================\n");

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
// MODULE 1 : Logique métier de seasonUtils.js
// -------------------------------------------------------------
console.log("▶️ Module 1 : Calculs temporels et repli gracieux (seasonUtils.js)");

// 1.1 Constantes par défaut
assert(DEFAULT_SEASON_START_MONTH === 9, "DEFAULT_SEASON_START_MONTH vaut bien 9 (Septembre)");
assert(DEFAULT_FISCAL_START_MONTH === 1, "DEFAULT_FISCAL_START_MONTH vaut bien 1 (Janvier)");

// 1.2 Rentrée scolaire / associative standard (Septembre)
assert(getSeasonFromDate('2026-09-01', 9) === '2026-2027', "01/09/2026 avec rentrée en sept. -> '2026-2027'");
assert(getSeasonFromDate('2026-08-31', 9) === '2025-2026', "31/08/2026 avec rentrée en sept. -> '2025-2026'");
assert(getSeasonFromDate('2026-01-15', 9) === '2025-2026', "15/01/2026 avec rentrée en sept. -> '2025-2026'");

// 1.3 Année civile (Janvier)
assert(getSeasonFromDate('2026-09-01', 1) === '2026', "01/09/2026 en année civile -> '2026'");
assert(getSeasonFromDate('2026-01-01', 1) === '2026', "01/01/2026 en année civile -> '2026'");

// 1.4 Plage de dates de saison (getSeasonDateRange)
const rangeSept = getSeasonDateRange('2026-2027', 9);
assert(rangeSept.startDate === '2026-09-01' && rangeSept.endDate === '2027-08-31', "Plage 2026-2027 (début sept) : 01/09/2026 au 31/08/2027");

const rangeCivil = getSeasonDateRange('2026', 1);
assert(rangeCivil.startDate === '2026-01-01' && rangeCivil.endDate === '2026-12-31', "Plage 2026 (début janv) : 01/01/2026 au 31/12/2026");

const rangeMars = getSeasonDateRange('2026-2027', 3);
assert(rangeMars.startDate === '2026-03-01' && rangeMars.endDate === '2027-02-28', "Plage 2026-2027 (début mars) : 01/03/2026 au 28/02/2027");

// 1.5 Plage de dates de l'exercice comptable (getFiscalYearDateRange)
const fiscalCivil = getFiscalYearDateRange('2026-09-20', 1, 0);
assert(fiscalCivil.startDate === '2026-01-01' && fiscalCivil.endDate === '2026-12-31' && fiscalCivil.fiscalYearLabel === '2026', "Exercice civil en cours au 20/09/2026 -> 01/01/2026 au 31/12/2026 ('2026')");

const fiscalCivilNMinus1 = getFiscalYearDateRange('2026-09-20', 1, -1);
assert(fiscalCivilNMinus1.startDate === '2025-01-01' && fiscalCivilNMinus1.endDate === '2025-12-31' && fiscalCivilNMinus1.fiscalYearLabel === '2025', "Exercice civil N-1 au 20/09/2026 -> 01/01/2025 au 31/12/2025 ('2025')");

const fiscalSept = getFiscalYearDateRange('2026-09-20', 9, 0);
assert(fiscalSept.startDate === '2026-09-01' && fiscalSept.endDate === '2027-08-31' && fiscalSept.fiscalYearLabel === '2026-2027', "Exercice décalé septembre en cours au 20/09/2026 -> '2026-2027'");

// 1.6 isPastSeason & getSeasonOptions
assert(isPastSeason('2025-2026', '2026-2027') === true, "isPastSeason '2025-2026' < '2026-2027' est vrai");
assert(isPastSeason('2026-2027', '2026-2027') === false, "isPastSeason '2026-2027' == '2026-2027' est faux");
assert(isPastSeason('2025', '2026') === true, "isPastSeason '2025' < '2026' est vrai");

const options = getSeasonOptions('2026-2027', ['2023-2024']);
assert(options.includes('2026-2027') && options.includes('2025-2026') && options.includes('2023-2024'), "getSeasonOptions consolide la saison active, les antécédents et les extras");

// -------------------------------------------------------------
// MODULE 2 : Hook de configuration (useAssociationSettings.js)
// -------------------------------------------------------------
console.log("\n▶️ Module 2 : Hook useAssociationSettings.js");
const hookPath = path.join(rootDir, 'src', 'hooks', 'useAssociationSettings.js');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

assert(hookContent.includes('saisonDebutMois: 9'), "useAssociationSettings contient saisonDebutMois: 9 dans initialFormData");
assert(hookContent.includes('exerciceDebutMois: 1'), "useAssociationSettings contient exerciceDebutMois: 1 dans initialFormData");
assert(hookContent.includes('saisonDebutMois: data.saisonDebutMois !== undefined'), "useAssociationSettings hydrate saisonDebutMois depuis Firestore");
assert(hookContent.includes('exerciceDebutMois: data.exerciceDebutMois !== undefined'), "useAssociationSettings hydrate exerciceDebutMois depuis Firestore");
assert(hookContent.includes('saisonDebutMois: Number(formData.saisonDebutMois) || 9'), "useAssociationSettings persiste saisonDebutMois dans handleSave");
assert(hookContent.includes('exerciceDebutMois: Number(formData.exerciceDebutMois) || 1'), "useAssociationSettings persiste exerciceDebutMois dans handleSave");

// -------------------------------------------------------------
// MODULE 3 : Interface TabOrganization.jsx
// -------------------------------------------------------------
console.log("\n▶️ Module 3 : Interface TabOrganization.jsx");
const tabOrgPath = path.join(rootDir, 'src', 'components', 'association-settings', 'TabOrganization.jsx');
const tabOrgContent = fs.readFileSync(tabOrgPath, 'utf-8');

assert(tabOrgContent.includes('getSeasonDateRange'), "TabOrganization importe getSeasonDateRange");
assert(tabOrgContent.includes('getCurrentSeason'), "TabOrganization importe getCurrentSeason");
assert(tabOrgContent.includes('getFiscalYearDateRange'), "TabOrganization importe getFiscalYearDateRange");
assert(tabOrgContent.includes('id="saisonDebutMois"'), "TabOrganization dispose du champ sélecteur saisonDebutMois");
assert(tabOrgContent.includes('id="exerciceDebutMois"'), "TabOrganization dispose du champ sélecteur exerciceDebutMois");
assert(tabOrgContent.includes('currentSeasonRange'), "TabOrganization calcule currentSeasonRange pour l'aperçu dynamique");
assert(tabOrgContent.includes('currentFiscalRange'), "TabOrganization calcule currentFiscalRange pour l'aperçu dynamique");

// -------------------------------------------------------------
// MODULE 4 : Internationalisation (fr.js & pt.js)
// -------------------------------------------------------------
console.log("\n▶️ Module 4 : Traductions (fr.js & pt.js)");
const frPath = path.join(rootDir, 'src', 'locales', 'fr.js');
const ptPath = path.join(rootDir, 'src', 'locales', 'pt.js');
const frContent = fs.readFileSync(frPath, 'utf-8');
const ptContent = fs.readFileSync(ptPath, 'utf-8');

assert(frContent.includes('calendarSettings:') && ptContent.includes('calendarSettings:'), "calendarSettings est présent dans fr.js et pt.js");
assert(frContent.includes('months:') && ptContent.includes('months:'), "months est présent dans fr.js et pt.js");

console.log("\n===============================================================");
console.log(`🏆 RÉSULTAT : ${passedTests}/${totalTests} TESTS PASSÉS AVEC SUCCÈS !`);
console.log("===============================================================");
