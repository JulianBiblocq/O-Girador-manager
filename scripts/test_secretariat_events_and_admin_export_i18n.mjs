import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Test: Internationalisation Secrétariat (StudioEventsManager & AdminExport)...');

// 1. Charger les dictionnaires
const frModule = await import('../src/locales/fr.js');
const ptModule = await import('../src/locales/pt.js');

const fr = frModule.fr;
const pt = ptModule.pt;

assert(fr.secretariat, 'Le namespace secretariat doit exister dans fr.js');
assert(pt.secretariat, 'Le namespace secretariat doit exister dans pt.js');

const expectedKeys = [
  'eventsManagementTitle',
  'eventsManagementSubtitle',
  'btnScheduleSeries',
  'searchEventsPlaceholder',
  'filterTypeLabel',
  'filterAllTypes',
  'kpiTotal',
  'kpiPerc',
  'kpiDanse',
  'kpiValidation',
  'eventTypeRepetition',
  'eventTypePrestation',
  'eventTypeAtelier',
  'eventTypeAutre',
  'eventTypeStage',
  'eventTypeReunion',
  'thColTitle',
  'thColType',
  'thColDescription',
  'thColDate',
  'thColStartTime',
  'thColEndTime',
  'thColSimpleLocation',
  'thColDeadline',
  'inputDescriptionPlaceholder',
  'inputDateFormat',
  'membersDirectoryTitle',
  'btnExportData',
  'allRoles',
  'searchMemberDirectoryPlaceholder',
  'thFullName',
  'thEmail',
  'thPhone',
  'thRole',
  'thInstruments',
  'badgeMemberMasc',
  'badgeMemberFem',
];

for (const key of expectedKeys) {
  assert(fr.secretariat[key], `Clé manquante dans fr.secretariat : ${key}`);
  assert(pt.secretariat[key], `Clé manquante dans pt.secretariat : ${key}`);
}

console.log(`✅ Les 37 clés secretariat sont présentes et symétriques en FR et PT.`);

// 2. Vérifier les composants cibles
const studioEventsPath = path.join(rootDir, 'src/components/studio/StudioEventsManager.jsx');
const eventsDataGridPath = path.join(rootDir, 'src/components/studio/EventsDataGrid.jsx');
const eventsDataGridRowPath = path.join(rootDir, 'src/components/studio/EventsDataGridRow.jsx');
const adminExportPath = path.join(rootDir, 'src/components/AdminExport.jsx');

const studioEventsContent = fs.readFileSync(studioEventsPath, 'utf8');
const eventsDataGridContent = fs.readFileSync(eventsDataGridPath, 'utf8');
const eventsDataGridRowContent = fs.readFileSync(eventsDataGridRowPath, 'utf8');
const adminExportContent = fs.readFileSync(adminExportPath, 'utf8');

// Assertions sur StudioEventsManager.jsx
assert(studioEventsContent.includes("t('secretariat.eventsManagementTitle')"), 'StudioEventsManager doit utiliser secretariat.eventsManagementTitle');
assert(studioEventsContent.includes("t('secretariat.eventsManagementSubtitle')"), 'StudioEventsManager doit utiliser secretariat.eventsManagementSubtitle');
assert(studioEventsContent.includes("t('secretariat.btnScheduleSeries')"), 'StudioEventsManager doit utiliser secretariat.btnScheduleSeries');
assert(studioEventsContent.includes("t('secretariat.searchEventsPlaceholder')"), 'StudioEventsManager doit utiliser secretariat.searchEventsPlaceholder');
assert(studioEventsContent.includes("t('secretariat.filterTypeLabel')"), 'StudioEventsManager doit utiliser secretariat.filterTypeLabel');
assert(studioEventsContent.includes("t('secretariat.filterAllTypes'"), 'StudioEventsManager doit utiliser secretariat.filterAllTypes');
assert(studioEventsContent.includes("t('secretariat.kpiTotal'"), 'StudioEventsManager doit utiliser secretariat.kpiTotal');
assert(studioEventsContent.includes("t('secretariat.kpiPerc'"), 'StudioEventsManager doit utiliser secretariat.kpiPerc');
assert(studioEventsContent.includes("t('secretariat.kpiDanse'"), 'StudioEventsManager doit utiliser secretariat.kpiDanse');
assert(studioEventsContent.includes("t('secretariat.kpiValidation'"), 'StudioEventsManager doit utiliser secretariat.kpiValidation');
console.log('✅ StudioEventsManager.jsx est parfaitement raccordé à i18n.');

// Assertions sur EventsDataGrid.jsx
assert(eventsDataGridContent.includes("t('secretariat.thColTitle')"), 'EventsDataGrid doit utiliser thColTitle');
assert(eventsDataGridContent.includes("t('secretariat.thColType')"), 'EventsDataGrid doit utiliser thColType');
assert(eventsDataGridContent.includes("t('secretariat.thColDescription')"), 'EventsDataGrid doit utiliser thColDescription');
assert(eventsDataGridContent.includes("t('secretariat.thColDate')"), 'EventsDataGrid doit utiliser thColDate');
assert(eventsDataGridContent.includes("t('secretariat.thColStartTime')"), 'EventsDataGrid doit utiliser thColStartTime');
assert(eventsDataGridContent.includes("t('secretariat.thColEndTime')"), 'EventsDataGrid doit utiliser thColEndTime');
assert(eventsDataGridContent.includes("t('secretariat.thColSimpleLocation')"), 'EventsDataGrid doit utiliser thColSimpleLocation');
assert(eventsDataGridContent.includes("t('secretariat.thColDeadline')"), 'EventsDataGrid doit utiliser thColDeadline');
console.log('✅ EventsDataGrid.jsx est parfaitement raccordé à i18n.');

// Assertions sur EventsDataGridRow.jsx
assert(eventsDataGridRowContent.includes("t('secretariat.inputDescriptionPlaceholder')"), 'EventsDataGridRow doit utiliser inputDescriptionPlaceholder');
console.log('✅ EventsDataGridRow.jsx est parfaitement raccordé à i18n.');

// Assertions sur AdminExport.jsx
assert(adminExportContent.includes("t('secretariat.membersDirectoryTitle'"), 'AdminExport doit utiliser secretariat.membersDirectoryTitle');
assert(adminExportContent.includes("t('secretariat.btnExportData')"), 'AdminExport doit utiliser secretariat.btnExportData');
assert(adminExportContent.includes("t('secretariat.allRoles')"), 'AdminExport doit utiliser secretariat.allRoles');
assert(adminExportContent.includes("t('secretariat.searchMemberDirectoryPlaceholder')"), 'AdminExport doit utiliser secretariat.searchMemberDirectoryPlaceholder');
assert(adminExportContent.includes("t('secretariat.thFullName')"), 'AdminExport doit utiliser secretariat.thFullName');
assert(adminExportContent.includes("t('secretariat.thEmail')"), 'AdminExport doit utiliser secretariat.thEmail');
assert(adminExportContent.includes("t('secretariat.thPhone')"), 'AdminExport doit utiliser secretariat.thPhone');
assert(adminExportContent.includes("t('secretariat.thRole')"), 'AdminExport doit utiliser secretariat.thRole');
assert(adminExportContent.includes("t('secretariat.thInstruments')"), 'AdminExport doit utiliser secretariat.thInstruments');
assert(adminExportContent.includes("t('secretariat.badgeMemberMasc')"), 'AdminExport doit utiliser secretariat.badgeMemberMasc');
assert(adminExportContent.includes("t('secretariat.badgeMemberFem')"), 'AdminExport doit utiliser secretariat.badgeMemberFem');
console.log('✅ AdminExport.jsx est parfaitement raccordé à i18n.');

console.log('🎉 Tous les tests unitaires i18n Secrétariat sont validés avec succès !');
