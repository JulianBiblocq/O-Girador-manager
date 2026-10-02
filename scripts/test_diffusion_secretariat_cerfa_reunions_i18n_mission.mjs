import fs from 'fs';
import assert from 'assert';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================================");
console.log("🧪 DÉBUT DU TEST : DIFFUSION, TRÉSORERIE, SECRÉTARIAT, CERFA & RÉUNIONS I18N");
console.log("===============================================================================\n");

// --- 1. Vérification de la présence des 75 clés dans fr et pt ---
console.log("▶️ Module 1 : Vérification de la présence de l'intégralité des 75 clés");

const expectedKeys = [
  // Diffusion (17 clés)
  'diffusion.tabPipeline',
  'diffusion.tabCrm',
  'diffusion.btnNewDossier',
  'diffusion.bannerDesc',
  'diffusion.metricActiveDossiers',
  'diffusion.metricDossiersCount',
  'diffusion.metricDossiersCountPlural',
  'diffusion.metricCommittedAmount',
  'diffusion.metricFollowUps',
  'diffusion.metricFollowUpsCount',
  'diffusion.metricFollowUpsCountPlural',
  'diffusion.displayModeLabel',
  'diffusion.viewSteps',
  'diffusion.viewTable',
  'diffusion.filterByStep',
  'diffusion.allSteps',
  'diffusion.emptyDossiersNotice',

  // Trésorerie (3 clés)
  'treasury.dashboardBannerDesc',
  'treasury.reportsExportsTitle',
  'treasury.reportsExportsSubtitle',

  // Secrétariat Documents (18 clés)
  'secretariatDocs.tabBothTables',
  'secretariatDocs.tabPermanentDocsWithCount',
  'secretariatDocs.tabMeetingsReportsWithCount',
  'secretariatDocs.btnUploadOfficialDoc',
  'secretariatDocs.tableATitle',
  'secretariatDocs.tableASubtitle',
  'secretariatDocs.thDocName',
  'secretariatDocs.thDocType',
  'secretariatDocs.thUpdateDate',
  'secretariatDocs.thActions',
  'secretariatDocs.btnPreview',
  'secretariatDocs.btnReplace',
  'secretariatDocs.tableBTitle',
  'secretariatDocs.tableBSubtitle',
  'secretariatDocs.thMeetingTitle',
  'secretariatDocs.thMeetingHeldDate',
  'secretariatDocs.thMeetingStatus',
  'secretariatDocs.btnPdf',

  // Gouvernance (37 clés)
  'governance.territorialSubtitle',
  'governance.badgeHeadquarters',
  'governance.headquartersCommune',
  'governance.subventionCriterion',
  'governance.externalCommunes',
  'governance.extraCommunalReach',
  'governance.auditedAddresses',
  'governance.completeProfilesCount',
  'governance.legendCommune',
  'governance.legendExternals',
  'governance.pupitrePending',
  'governance.btnAgReportCsv',
  'governance.btnAttendanceCsv',
  'governance.cerfaSubtitle',
  'governance.eventsAnalyzedCount',
  'governance.collectiveActivity',
  'governance.collectiveActivityDesc',
  'governance.publicPerformance',
  'governance.publicPerformanceDesc',
  'governance.boardWorkshopPackages',
  'governance.boardWorkshopPackagesDesc',
  'governance.cerfaNoticeValuation',
  'governance.cumulatedUniqueVisitors',
  'governance.publicSitePeriod',
  'governance.confirmedGigsCount',
  'governance.publicShowcaseImpactNotice',
  'governance.wardrobeCraftTitle',
  'governance.costumesCrafted',
  'governance.ongoingWorkshops',
  'governance.totalMonitoredProjects',
  'governance.instrumentsUnderMaintenance',
  'governance.trackedPartsStock',
  'governance.syntheticIncomeDesc',
  'governance.syntheticExpenseDesc',
  'governance.fieldDayRequired',
  'governance.btnImportTemplate',
  'governance.badgeReservedRoles'
];

function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

for (const key of expectedKeys) {
  const valFr = getVal(fr, key);
  const valPt = getVal(pt, key);
  assert.ok(valFr !== undefined, `Clé FR manquante : ${key}`);
  assert.ok(valPt !== undefined, `Clé PT manquante : ${key}`);
}
console.log(`  ✅ [PASS] Les ${expectedKeys.length} clés sont définies en FR et en PT.`);

// --- 2. Contrôle de symétrie stricte (0 orpheline) ---
console.log("\n▶️ Module 2 : Contrôle de symétrie stricte entre fr.js et pt.js");

function getFlatKeys(obj, prefix = '') {
  let res = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      res.push(...getFlatKeys(obj[k], fullKey));
    } else {
      res.push(fullKey);
    }
  }
  return res;
}

const allFrKeys = getFlatKeys(fr);
const allPtKeys = getFlatKeys(pt);

const missingInPt = allFrKeys.filter(k => !allPtKeys.includes(k));
const missingInFr = allPtKeys.filter(k => !allFrKeys.includes(k));

console.log(`  Nombre de clés FR : ${allFrKeys.length}`);
console.log(`  Nombre de clés PT : ${allPtKeys.length}`);

assert.strictEqual(missingInPt.length, 0, `Clés orphelines dans FR : ${missingInPt.join(', ')}`);
assert.strictEqual(missingInFr.length, 0, `Clés orphelines dans PT : ${missingInFr.join(', ')}`);
assert.strictEqual(allFrKeys.length, allPtKeys.length, "Le nombre total de clés doit être parfaitement identique");

console.log("  ✅ [PASS] Symétrie stricte 1:1 validée (0 clé orpheline).");

// --- 3. Vérification des liaisons useTranslation dans les composants cibles ---
console.log("\n▶️ Module 3 : Vérification du raccordement dans les fichiers composants");

const checks = [
  {
    file: 'src/components/diffusion/GigsPipelineManager.jsx',
    keys: [
      'diffusion.tabPipeline',
      'diffusion.tabCrm',
      'diffusion.btnNewDossier',
      'diffusion.bannerDesc',
      'diffusion.metricActiveDossiers',
      'diffusion.metricDossiersCount',
      'diffusion.metricCommittedAmount',
      'diffusion.metricFollowUps',
      'diffusion.displayModeLabel',
      'diffusion.viewSteps',
      'diffusion.viewTable',
      'diffusion.filterByStep',
      'diffusion.allSteps',
      'diffusion.emptyDossiersNotice'
    ]
  },
  {
    file: 'src/components/treasury/TreasuryDashboard.jsx',
    keys: [
      'treasury.dashboardBannerDesc',
      'treasury.reportsExportsTitle',
      'treasury.reportsExportsSubtitle',
      'treasury.detailedFinancialBalance'
    ]
  },
  {
    file: 'src/components/secretariat/SecretariatDocumentsView.jsx',
    keys: [
      'secretariatDocs.tabBothTables',
      'secretariatDocs.tabPermanentDocsWithCount',
      'secretariatDocs.tabMeetingsReportsWithCount',
      'secretariatDocs.btnUploadOfficialDoc',
      'secretariatDocs.tableATitle',
      'secretariatDocs.tableASubtitle',
      'secretariatDocs.tableBTitle',
      'secretariatDocs.tableBSubtitle'
    ]
  },
  {
    file: 'src/components/secretariat/StatutDocumentsTable.jsx',
    keys: [
      'secretariatDocs.thDocName',
      'secretariatDocs.thDocType',
      'secretariatDocs.thUpdateDate',
      'secretariatDocs.thActions',
      'secretariatDocs.btnPreview',
      'secretariatDocs.btnReplace'
    ]
  },
  {
    file: 'src/components/secretariat/ReunionsPvTable.jsx',
    keys: [
      'secretariatDocs.thMeetingTitle',
      'secretariatDocs.thMeetingHeldDate',
      'secretariatDocs.thMeetingStatus',
      'secretariatDocs.thActions',
      'secretariatDocs.btnPreview',
      'secretariatDocs.btnPdf'
    ]
  },
  {
    file: 'src/components/secretariat/reports/ReportTerritoryCard.jsx',
    keys: [
      'governance.territorialSubtitle',
      'governance.badgeHeadquarters',
      'governance.headquartersCommune',
      'governance.subventionCriterion',
      'governance.externalCommunes',
      'governance.extraCommunalReach',
      'governance.auditedAddresses',
      'governance.completeProfilesCount',
      'governance.legendCommune',
      'governance.legendExternals'
    ]
  },
  {
    file: 'src/components/secretariat/reports/ReportVolunteerCard.jsx',
    keys: [
      'governance.cerfaSubtitle',
      'governance.eventsAnalyzedCount',
      'governance.collectiveActivity',
      'governance.collectiveActivityDesc',
      'governance.publicPerformance',
      'governance.publicPerformanceDesc',
      'governance.boardWorkshopPackages',
      'governance.boardWorkshopPackagesDesc',
      'governance.cerfaNoticeValuation'
    ]
  },
  {
    file: 'src/components/secretariat/reports/ReportAudienceCard.jsx',
    keys: [
      'governance.cumulatedUniqueVisitors',
      'governance.publicSitePeriod',
      'governance.confirmedGigsCount',
      'governance.publicShowcaseImpactNotice'
    ]
  },
  {
    file: 'src/components/secretariat/SecretariatReportsView.jsx',
    keys: [
      'governance.pupitrePending',
      'governance.btnAgReportCsv',
      'governance.btnAttendanceCsv',
      'governance.wardrobeCraftTitle',
      'governance.costumesCrafted',
      'governance.ongoingWorkshops',
      'governance.totalMonitoredProjects',
      'governance.instrumentsUnderMaintenance',
      'governance.trackedPartsStock',
      'governance.syntheticIncomeDesc',
      'governance.syntheticExpenseDesc'
    ]
  },
  {
    file: 'src/components/ReunionManager.jsx',
    keys: [
      'governance.fieldDayRequired',
      'governance.btnImportTemplate'
    ]
  },
  {
    file: 'src/components/common/PageAccessBadgeIndicator.jsx',
    keys: [
      'governance.badgeReservedRoles'
    ]
  }
];

for (const check of checks) {
  const content = fs.readFileSync(check.file, 'utf8');
  for (const key of check.keys) {
    assert.ok(
      content.includes(`'${key}'`) || content.includes(`"${key}"`),
      `Clé ${key} non trouvée dans ${check.file}`
    );
  }
  console.log(`  ✅ [PASS] ${check.file} contient bien toutes ses clés.`);
}

console.log("\n===============================================================================");
console.log("🎉 TOUS LES TESTS DE LA MISSION ONT RÉUSSI AVEC SUCCÈS !");
console.log("===============================================================================");
