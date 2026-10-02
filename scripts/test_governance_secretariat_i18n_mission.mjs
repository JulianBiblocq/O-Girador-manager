// Test de validation de l'internationalisation FR / PT-BR — Pôle Gouvernance & Secrétariat
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('=================================================================================');
console.log('🧪 TEST MISSION : INTERNATIONALISATION GOUVERNANCE & SECRÉTARIAT (FR / PT-BR)');
console.log('=================================================================================\n');

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
// 1. Contrôle de présence et exactitude des 48 clés dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle des 48 clés de gouvernance dans fr.js et pt.js');

const governanceKeys = [
  // Écran Réunions, Ordres du jour & PV
  'meetingsTitle',
  'meetingsSubtitle',
  'step1',
  'step2',
  'step3',
  'step4',
  'btnNewMeeting',
  'btnReportsArchives',

  // Formulaire de réunion / sondage
  'formCreateMeetingTitle',
  'tabFixedDate',
  'tabMultiDatePoll',
  'placeholderMeetingTitle',
  'meetingLocationLabel',
  'locationPlaceholder',
  'startTime',
  'endTime',
  'agendaSectionTitle',
  'agendaPointPlaceholder',
  'btnAddAgendaPoint',
  'optionalDocLink',
  'btnScheduleMeeting',

  // Studio Réunions & Sondages
  'studioTitle',
  'studioSubtitle',
  'thMeetingTheme',
  'thDateSlot',
  'thAgenda',
  'thVotesStatus',
  'thAction',

  // Écran Rapports d'AG & CERFA 12156
  // Section 1 : Vie associative
  'metricCotisations',
  'metricActifs',
  'metricAJour',
  'metricEnAttente',
  'ancrageTerritorialTitle',
  'topCommunes',

  // Section 2 : Pratique collective & Prestations
  'metricPrestations',
  'metricRepetitions',
  'metricStagesAteliers',
  'metricReunionsAg',
  'avgEffectifScene',
  'totalPresencesRecorded',

  // Section Bénévolat CERFA
  'volunteeringCerfaTitle',
  'volunteeringHoursDesc',

  // Section Rayonnement & Vitrine
  'showcaseTrafficTitle',
  'metricShowcaseViews',
  'metricFormsReceived',
  'metricTrafficConcentration',

  // Section Patrimoine & Lutherie
  'metricLutherieMaterial',
  'metricInstrumentsInService',
];

assert(governanceKeys.length === 48, `Nombre attendu de clés : 48 (reçu : ${governanceKeys.length})`);

governanceKeys.forEach((key) => {
  assert(
    fr.governance && typeof fr.governance[key] === 'string' && fr.governance[key].length > 0,
    `Clé fr.governance.${key} présente et non vide`
  );
  assert(
    pt.governance && typeof pt.governance[key] === 'string' && pt.governance[key].length > 0,
    `Clé pt.governance.${key} présente et non vide`
  );
});

// Vérification de valeurs spécifiques clés
assert(fr.governance.meetingsTitle === "Réunions, ordres du jour & procès-verbaux", "FR meetingsTitle conforme");
assert(pt.governance.meetingsTitle === "Reuniões, pautas & atas", "PT meetingsTitle conforme");

assert(fr.governance.formCreateMeetingTitle === "Créer une réunion ou un sondage", "FR formCreateMeetingTitle conforme");
assert(pt.governance.formCreateMeetingTitle === "Criar uma reunião ou enquete", "PT formCreateMeetingTitle conforme");

assert(fr.governance.studioTitle === "Studio Réunions & Sondages", "FR studioTitle conforme");
assert(pt.governance.studioTitle === "Estúdio de Reuniões & Enquetes", "PT studioTitle conforme");

assert(fr.governance.ancrageTerritorialTitle === "Ancrage territorial & Commune (CERFA)", "FR ancrageTerritorialTitle conforme");
assert(pt.governance.ancrageTerritorialTitle === "Inserção territorial & Município (CERFA)", "PT ancrageTerritorialTitle conforme");

assert(fr.governance.volunteeringCerfaTitle === "Bénévolat & Vie de troupe (CERFA 12156)", "FR volunteeringCerfaTitle conforme");
assert(pt.governance.volunteeringCerfaTitle === "Voluntariado & Vida em grupo (CERFA 12156)", "PT volunteeringCerfaTitle conforme");

assert(fr.governance.showcaseTrafficTitle === "Rayonnement & Vitrine publique", "FR showcaseTrafficTitle conforme");
assert(pt.governance.showcaseTrafficTitle === "Divulgação & Site público", "PT showcaseTrafficTitle conforme");

assert(fr.governance.metricLutherieMaterial === "Lutherie & Matériel", "FR metricLutherieMaterial conforme");
assert(pt.governance.metricLutherieMaterial === "Luthieria & Instrumentos", "PT metricLutherieMaterial conforme");

// -----------------------------------------------------------------------------
// 2. Symétrie globale des dictionnaires (0 orpheline)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Symétrie globale des dictionnaires fr.js et pt.js');

function countKeys(obj) {
  let count = 0;
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      count += countKeys(obj[k]);
    } else {
      count++;
    }
  }
  return count;
}

const frTotal = countKeys(fr);
const ptTotal = countKeys(pt);
assert(frTotal === ptTotal, `Symétrie stricte des dictionnaires : FR (${frTotal}) === PT (${ptTotal})`);

// -----------------------------------------------------------------------------
// 3. Contrôle des branchements useTranslation dans les composants
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Contrôle des branchements useTranslation dans les composants');

const reunionManagerCode = fs.readFileSync(path.resolve('src/components/ReunionManager.jsx'), 'utf-8');
assert(reunionManagerCode.includes("t('governance.studioTitle')"), "ReunionManager utilise t('governance.studioTitle')");
assert(reunionManagerCode.includes("t('governance.btnNewMeeting')"), "ReunionManager utilise t('governance.btnNewMeeting')");
assert(reunionManagerCode.includes("t('governance.btnReportsArchives')"), "ReunionManager utilise t('governance.btnReportsArchives')");
assert(reunionManagerCode.includes("t('governance.formCreateMeetingTitle')"), "ReunionManager utilise t('governance.formCreateMeetingTitle')");
assert(reunionManagerCode.includes("t('governance.tabFixedDate')"), "ReunionManager utilise t('governance.tabFixedDate')");
assert(reunionManagerCode.includes("t('governance.tabMultiDatePoll')"), "ReunionManager utilise t('governance.tabMultiDatePoll')");
assert(reunionManagerCode.includes("t('governance.placeholderMeetingTitle')"), "ReunionManager utilise t('governance.placeholderMeetingTitle')");
assert(reunionManagerCode.includes("t('governance.meetingLocationLabel')"), "ReunionManager utilise t('governance.meetingLocationLabel')");
assert(reunionManagerCode.includes("t('governance.locationPlaceholder')"), "ReunionManager utilise t('governance.locationPlaceholder')");
assert(reunionManagerCode.includes("t('governance.startTime')"), "ReunionManager utilise t('governance.startTime')");
assert(reunionManagerCode.includes("t('governance.endTime')"), "ReunionManager utilise t('governance.endTime')");
assert(reunionManagerCode.includes("t('governance.agendaSectionTitle')"), "ReunionManager utilise t('governance.agendaSectionTitle')");
assert(reunionManagerCode.includes("t('governance.agendaPointPlaceholder')"), "ReunionManager utilise t('governance.agendaPointPlaceholder')");
assert(reunionManagerCode.includes("t('governance.btnAddAgendaPoint')"), "ReunionManager utilise t('governance.btnAddAgendaPoint')");
assert(reunionManagerCode.includes("t('governance.optionalDocLink')"), "ReunionManager utilise t('governance.optionalDocLink')");
assert(reunionManagerCode.includes("t('governance.btnScheduleMeeting')"), "ReunionManager utilise t('governance.btnScheduleMeeting')");
assert(reunionManagerCode.includes("t('governance.studioSubtitle')"), "ReunionManager utilise t('governance.studioSubtitle')");
assert(reunionManagerCode.includes("t('governance.thMeetingTheme')"), "ReunionManager utilise t('governance.thMeetingTheme')");
assert(reunionManagerCode.includes("t('governance.thDateSlot')"), "ReunionManager utilise t('governance.thDateSlot')");
assert(reunionManagerCode.includes("t('governance.thAgenda')"), "ReunionManager utilise t('governance.thAgenda')");
assert(reunionManagerCode.includes("t('governance.thVotesStatus')"), "ReunionManager utilise t('governance.thVotesStatus')");
assert(reunionManagerCode.includes("t('governance.thAction')"), "ReunionManager utilise t('governance.thAction')");

const infoPoleBannerCode = fs.readFileSync(path.resolve('src/components/InfoPoleBanner.jsx'), 'utf-8');
assert(infoPoleBannerCode.includes("t('governance.meetingsTitle')"), "InfoPoleBanner utilise t('governance.meetingsTitle')");
assert(infoPoleBannerCode.includes("t('governance.meetingsSubtitle')"), "InfoPoleBanner utilise t('governance.meetingsSubtitle')");
assert(infoPoleBannerCode.includes("t('governance.step1')"), "InfoPoleBanner utilise t('governance.step1')");
assert(infoPoleBannerCode.includes("t('governance.step2')"), "InfoPoleBanner utilise t('governance.step2')");
assert(infoPoleBannerCode.includes("t('governance.step3')"), "InfoPoleBanner utilise t('governance.step3')");
assert(infoPoleBannerCode.includes("t('governance.step4')"), "InfoPoleBanner utilise t('governance.step4')");
assert(infoPoleBannerCode.includes("t('governance.btnNewMeeting')"), "InfoPoleBanner utilise t('governance.btnNewMeeting')");
assert(infoPoleBannerCode.includes("t('governance.btnReportsArchives')"), "InfoPoleBanner utilise t('governance.btnReportsArchives')");

const secretariatReportsCode = fs.readFileSync(path.resolve('src/components/secretariat/SecretariatReportsView.jsx'), 'utf-8');
assert(secretariatReportsCode.includes("t('governance.metricCotisations')"), "SecretariatReportsView utilise t('governance.metricCotisations')");
assert(secretariatReportsCode.includes("t('governance.metricActifs')"), "SecretariatReportsView utilise t('governance.metricActifs')");
assert(secretariatReportsCode.includes("t('governance.metricAJour')"), "SecretariatReportsView utilise t('governance.metricAJour')");
assert(secretariatReportsCode.includes("t('governance.metricEnAttente')"), "SecretariatReportsView utilise t('governance.metricEnAttente')");
assert(secretariatReportsCode.includes("t('governance.metricPrestations')"), "SecretariatReportsView utilise t('governance.metricPrestations')");
assert(secretariatReportsCode.includes("t('governance.metricRepetitions')"), "SecretariatReportsView utilise t('governance.metricRepetitions')");
assert(secretariatReportsCode.includes("t('governance.metricStagesAteliers')"), "SecretariatReportsView utilise t('governance.metricStagesAteliers')");
assert(secretariatReportsCode.includes("t('governance.metricReunionsAg')"), "SecretariatReportsView utilise t('governance.metricReunionsAg')");
assert(secretariatReportsCode.includes("t('governance.avgEffectifScene')"), "SecretariatReportsView utilise t('governance.avgEffectifScene')");
assert(secretariatReportsCode.includes("t('governance.totalPresencesRecorded')"), "SecretariatReportsView utilise t('governance.totalPresencesRecorded')");
assert(secretariatReportsCode.includes("t('governance.metricLutherieMaterial')"), "SecretariatReportsView utilise t('governance.metricLutherieMaterial')");
assert(secretariatReportsCode.includes("t('governance.metricInstrumentsInService')"), "SecretariatReportsView utilise t('governance.metricInstrumentsInService')");

const territoryCardCode = fs.readFileSync(path.resolve('src/components/secretariat/reports/ReportTerritoryCard.jsx'), 'utf-8');
assert(territoryCardCode.includes("t('governance.ancrageTerritorialTitle')"), "ReportTerritoryCard utilise t('governance.ancrageTerritorialTitle')");
assert(territoryCardCode.includes("t('governance.topCommunes')"), "ReportTerritoryCard utilise t('governance.topCommunes')");

const volunteerCardCode = fs.readFileSync(path.resolve('src/components/secretariat/reports/ReportVolunteerCard.jsx'), 'utf-8');
assert(volunteerCardCode.includes("t('governance.volunteeringCerfaTitle')"), "ReportVolunteerCard utilise t('governance.volunteeringCerfaTitle')");
assert(volunteerCardCode.includes("t('governance.volunteeringHoursDesc')"), "ReportVolunteerCard utilise t('governance.volunteeringHoursDesc')");

const audienceCardCode = fs.readFileSync(path.resolve('src/components/secretariat/reports/ReportAudienceCard.jsx'), 'utf-8');
assert(audienceCardCode.includes("t('governance.showcaseTrafficTitle')"), "ReportAudienceCard utilise t('governance.showcaseTrafficTitle')");
assert(audienceCardCode.includes("t('governance.metricShowcaseViews')"), "ReportAudienceCard utilise t('governance.metricShowcaseViews')");
assert(audienceCardCode.includes("t('governance.metricFormsReceived')"), "ReportAudienceCard utilise t('governance.metricFormsReceived')");
assert(audienceCardCode.includes("t('governance.metricTrafficConcentration')"), "ReportAudienceCard utilise t('governance.metricTrafficConcentration')");

// -----------------------------------------------------------------------------
// Résultat final
// -----------------------------------------------------------------------------
console.log('\n=================================================================================');
if (failedAssertions === 0) {
  console.log('🎉 TOUS LES TESTS DE LA MISSION GOUVERNANCE & SECRÉTARIAT SONT AU VERT !');
  console.log('=================================================================================\n');
  process.exit(0);
} else {
  console.error(`💥 ÉCHEC : ${failedAssertions} assertion(s) en erreur.`);
  console.log('=================================================================================\n');
  process.exit(1);
}
