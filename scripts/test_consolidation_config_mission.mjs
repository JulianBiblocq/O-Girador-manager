import fs from 'fs';
import assert from 'assert';

console.log('🧪 Test de consolidation architecturale...');

// 1. Vérification de POLES_CONFIG dans App.jsx
const appContent = fs.readFileSync('src/App.jsx', 'utf8');

// Config tabs
assert(appContent.includes("id: 'config-agenda'"), "config-agenda doit être dans POLES_CONFIG");
assert(appContent.includes("id: 'config-profile'"), "config-profile doit être dans POLES_CONFIG");
assert(appContent.includes("currentTab === 'config-agenda'"), "Aiguillage config-agenda doit être présent dans App.jsx");
assert(appContent.includes("checkTabAccess('config-agenda', 'config')"), "checkTabAccess doit inclure config-agenda");

// Secrétariat strict (4 tabs)
const secretariatMatch = appContent.match(/id:\s*'secretariat'[\s\S]*?tabs:\s*\[([\s\S]*?)\]/);
assert(secretariatMatch, "Section secretariat trouvée");
const secTabs = (secretariatMatch[1].match(/id:\s*'([^']+)'/g) || []).map(s => s.replace(/id:\s*'|'/g, ''));
console.log('Onglets Secrétariat :', secTabs);
assert.deepStrictEqual(secTabs, ['export-annu', 'activity-reports', 'studio-events', 'varal-secretariat'], "Secrétariat doit avoir exactement ses 4 onglets opérationnels");

// Logistique strict (4 tabs)
const logistiqueMatch = appContent.match(/id:\s*'logistique'[\s\S]*?tabs:\s*\[([\s\S]*?)\]/);
assert(logistiqueMatch, "Section logistique trouvée");
const logTabs = (logistiqueMatch[1].match(/id:\s*'([^']+)'/g) || []).map(s => s.replace(/id:\s*'|'/g, ''));
console.log('Onglets Logistique :', logTabs);
assert.deepStrictEqual(logTabs, ['inventory', 'orders', 'logistics-carpool', 'logistics-kits'], "Logistique doit avoir exactement ses 4 onglets opérationnels (aucun logistics-pupitres)");

// 2. Vérification de TabAgenda.jsx
const tabAgendaContent = fs.readFileSync('src/components/association-settings/TabAgenda.jsx', 'utf8');
assert(tabAgendaContent.includes("import TabLieux from './TabLieux';"), "TabAgenda doit importer TabLieux");
assert(tabAgendaContent.includes("import TabAutomations from './TabAutomations';"), "TabAgenda doit importer TabAutomations");
assert(tabAgendaContent.includes("<TabLieux"), "TabAgenda doit intégrer TabLieux");
assert(tabAgendaContent.includes("<TabAutomations"), "TabAgenda doit intégrer TabAutomations");
assert(tabAgendaContent.includes("EventTypeConfigCard"), "TabAgenda doit conserver EventTypeConfigCard");

// 3. Vérification de TabLieux.jsx (adresse du local)
const tabLieuxContent = fs.readFileSync('src/components/association-settings/TabLieux.jsx', 'utf8');
assert(tabLieuxContent.includes("Local Associatif & Référence Kilométrique"), "TabLieux doit intégrer l'encart Local & frais km");
assert(tabLieuxContent.includes("adresseLocal"), "TabLieux doit gérer le champ adresseLocal");

// 4. Vérification de TabOrganization.jsx et PupitresNomenclatureAccordion.jsx
const tabOrgContent = fs.readFileSync('src/components/association-settings/TabOrganization.jsx', 'utf8');
assert(!tabOrgContent.includes("LieuxAccordion"), "TabOrganization ne doit plus contenir LieuxAccordion");
assert(!tabOrgContent.includes("AgendaCategoriesAccordion"), "TabOrganization ne doit plus contenir AgendaCategoriesAccordion");
assert(tabOrgContent.includes("PupitresNomenclatureAccordion"), "TabOrganization doit intégrer PupitresNomenclatureAccordion");

const pupitresAccordionContent = fs.readFileSync('src/components/association-settings/organization/PupitresNomenclatureAccordion.jsx', 'utf8');
assert(pupitresAccordionContent.includes("InstrumentsCatalogBlock"), "PupitresNomenclatureAccordion doit intégrer InstrumentsCatalogBlock");
assert(pupitresAccordionContent.includes("MARACATU_ROLES_LIST"), "PupitresNomenclatureAccordion doit intégrer MARACATU_ROLES_LIST");

console.log('✅ Tous les tests de validation architecturale ont réussi avec succès !');
