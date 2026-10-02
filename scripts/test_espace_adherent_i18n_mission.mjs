// Test de validation de l'internationalisation FR / PT-BR — Parcours Espace Adhérent
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : INTERNATIONALISATION PARCOURS ESPACE ADHÉRENT (FR / PT)');
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
// 1. Contrôle de présence et exactitude des clés dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle des clés de l\'Espace Adhérent dans fr.js et pt.js');

// Pedagogy - Catégories du Varal Culture
const pedKeys = ['categoryMusiqueStyles', 'categoryCuisine', 'categoryOrixas', 'categoryTerritoire'];
pedKeys.forEach(k => {
  assert(fr.pedagogy && typeof fr.pedagogy[k] === 'string' && fr.pedagogy[k].length > 0, `Clé fr.pedagogy.${k} présente`);
  assert(pt.pedagogy && typeof pt.pedagogy[k] === 'string' && pt.pedagogy[k].length > 0, `Clé pt.pedagogy.${k} présente`);
});
assert(fr.pedagogy.categoryMusiqueStyles === "Musique & Styles", "FR categoryMusiqueStyles conforme");
assert(pt.pedagogy.categoryMusiqueStyles === "Música & Estilos", "PT categoryMusiqueStyles conforme");
assert(fr.pedagogy.categoryCuisine === "Cuisine & Gastronomie", "FR categoryCuisine conforme");
assert(pt.pedagogy.categoryCuisine === "Culinária & Gastronomia", "PT categoryCuisine conforme");
assert(fr.pedagogy.categoryOrixas === "Orixás & Spiritualité", "FR categoryOrixas conforme");
assert(pt.pedagogy.categoryOrixas === "Orixás & Espiritualidade", "PT categoryOrixas conforme");
assert(fr.pedagogy.categoryTerritoire === "Territoire & Géographie", "FR categoryTerritoire conforme");
assert(pt.pedagogy.categoryTerritoire === "Território & Geografia", "PT categoryTerritoire conforme");

// Repertoire Membre
const repKeys = ['memberSubtitle', 'btnExpandAll', 'btnCollapseAll'];
repKeys.forEach(k => {
  assert(fr.repertoire && typeof fr.repertoire[k] === 'string' && fr.repertoire[k].length > 0, `Clé fr.repertoire.${k} présente`);
  assert(pt.repertoire && typeof pt.repertoire[k] === 'string' && pt.repertoire[k].length > 0, `Clé pt.repertoire.${k} présente`);
});
assert(fr.repertoire.memberSubtitle === "Morceaux au programme, entraînements et demandes de révision", "FR memberSubtitle conforme");
assert(pt.repertoire.memberSubtitle === "Músicas no repertório, treinos e pedidos de revisão", "PT memberSubtitle conforme");
assert(fr.repertoire.btnExpandAll === "Tout déplier", "FR btnExpandAll conforme");
assert(pt.repertoire.btnExpandAll === "Expandir tudo", "PT btnExpandAll conforme");
assert(fr.repertoire.btnCollapseAll === "Tout replier", "FR btnCollapseAll conforme");
assert(pt.repertoire.btnCollapseAll === "Recolher tudo", "PT btnCollapseAll conforme");

// Logistics - Matériel & Instruments
assert(fr.logistics && typeof fr.logistics.myInstrumentsNotice === 'string' && fr.logistics.myInstrumentsNotice.length > 0, "Clé fr.logistics.myInstrumentsNotice présente");
assert(pt.logistics && typeof pt.logistics.myInstrumentsNotice === 'string' && pt.logistics.myInstrumentsNotice.length > 0, "Clé pt.logistics.myInstrumentsNotice présente");

// Trombi - Trombinoscope & Filtres
const trombiKeys = ['searchPlaceholder', 'allPupitres', 'allTags', 'membersCount', 'membersCountPlural'];
trombiKeys.forEach(k => {
  assert(fr.trombi && typeof fr.trombi[k] === 'string' && fr.trombi[k].length > 0, `Clé fr.trombi.${k} présente`);
  assert(pt.trombi && typeof pt.trombi[k] === 'string' && pt.trombi[k].length > 0, `Clé pt.trombi.${k} présente`);
});
assert(fr.trombi.searchPlaceholder === "Prénom, nom, surnom...", "FR searchPlaceholder conforme");
assert(pt.trombi.searchPlaceholder === "Nome, sobrenome, apelido...", "PT searchPlaceholder conforme");
assert(fr.trombi.allPupitres === "Tous les pupitres", "FR allPupitres conforme");
assert(pt.trombi.allPupitres === "Todos os naipes", "PT allPupitres conforme");
assert(fr.trombi.allTags === "Toutes les étiquettes", "FR allTags conforme");
assert(pt.trombi.allTags === "Todas as etiquetas", "PT allTags conforme");

// Forum - Porte-Voix
const forumKeys = ['tabPrivateMessages', 'tabGroups', 'btnChannels', 'defaultChannelGeneral'];
forumKeys.forEach(k => {
  assert(fr.forum && typeof fr.forum[k] === 'string' && fr.forum[k].length > 0, `Clé fr.forum.${k} présente`);
  assert(pt.forum && typeof pt.forum[k] === 'string' && pt.forum[k].length > 0, `Clé pt.forum.${k} présente`);
});
assert(fr.forum.tabPrivateMessages === "Messages privés", "FR tabPrivateMessages conforme");
assert(pt.forum.tabPrivateMessages === "Mensagens privadas", "PT tabPrivateMessages conforme");
assert(fr.forum.tabGroups === "Groupes", "FR tabGroups conforme");
assert(pt.forum.tabGroups === "Grupos", "PT tabGroups conforme");
assert(fr.forum.btnChannels === "Salons", "FR btnChannels conforme");
assert(pt.forum.btnChannels === "Canais", "PT btnChannels conforme");
assert(fr.forum.defaultChannelGeneral === "Général", "FR defaultChannelGeneral conforme");
assert(pt.forum.defaultChannelGeneral === "Geral", "PT defaultChannelGeneral conforme");

// Documents - Varal de Documents
const docKeys = ['filterAllWithCount', 'filterVisibleWithCount', 'filterArchivedWithCount'];
docKeys.forEach(k => {
  assert(fr.documents && typeof fr.documents[k] === 'string' && fr.documents[k].length > 0, `Clé fr.documents.${k} présente`);
  assert(pt.documents && typeof pt.documents[k] === 'string' && pt.documents[k].length > 0, `Clé pt.documents.${k} présente`);
});
assert(fr.documents.filterAllWithCount === "Tous ({{count}})", "FR filterAllWithCount conforme");
assert(pt.documents.filterAllWithCount === "Todos ({{count}})", "PT filterAllWithCount conforme");
assert(fr.documents.filterVisibleWithCount === "Visibles ({{count}})", "FR filterVisibleWithCount conforme");
assert(pt.documents.filterVisibleWithCount === "Visíveis ({{count}})", "PT filterVisibleWithCount conforme");
assert(fr.documents.filterArchivedWithCount === "Archivés ({{count}})", "FR filterArchivedWithCount conforme");
assert(pt.documents.filterArchivedWithCount === "Arquivados ({{count}})", "PT filterArchivedWithCount conforme");

// -----------------------------------------------------------------------------
// 2. Contrôle de MonCarnetAisance.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôle des catégories culturelles dans MonCarnetAisance.jsx');
const carnetPath = path.resolve('src/components/pedagogy/MonCarnetAisance.jsx');
assert(fs.existsSync(carnetPath), 'MonCarnetAisance.jsx existe');
if (fs.existsSync(carnetPath)) {
  const src = fs.readFileSync(carnetPath, 'utf8');
  assert(src.includes("t('pedagogy.categoryOrixas')"), "categoryOrixas branché");
  assert(src.includes("t('pedagogy.categoryCuisine')"), "categoryCuisine branché");
  assert(src.includes("t('pedagogy.categoryMusiqueStyles')"), "categoryMusiqueStyles branché");
  assert(src.includes("t('pedagogy.categoryTerritoire')"), "categoryTerritoire branché");
}

// -----------------------------------------------------------------------------
// 3. Contrôle de MemberRepertoireHeader.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Contrôle de MemberRepertoireHeader.jsx');
const repHeaderPath = path.resolve('src/components/member/MemberRepertoireHeader.jsx');
assert(fs.existsSync(repHeaderPath), 'MemberRepertoireHeader.jsx existe');
if (fs.existsSync(repHeaderPath)) {
  const src = fs.readFileSync(repHeaderPath, 'utf8');
  assert(src.includes("t('repertoire.memberSubtitle')"), "Sous-titre répertoire branché sur t(repertoire.memberSubtitle)");
  assert(src.includes("t('repertoire.btnExpandAll')"), "Bouton tout déplier branché sur t(repertoire.btnExpandAll)");
  assert(src.includes("t('repertoire.btnCollapseAll')"), "Bouton tout replier branché sur t(repertoire.btnCollapseAll)");
}

// -----------------------------------------------------------------------------
// 4. Contrôle de UserMateriel.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Contrôle de UserMateriel.jsx');
const materielPath = path.resolve('src/components/profile/UserMateriel.jsx');
assert(fs.existsSync(materielPath), 'UserMateriel.jsx existe');
if (fs.existsSync(materielPath)) {
  const src = fs.readFileSync(materielPath, 'utf8');
  assert(src.includes("t('logistics.myInstrumentsNotice')"), "Notice matériel branchée sur t(logistics.myInstrumentsNotice)");
}

// -----------------------------------------------------------------------------
// 5. Contrôle de Trombinoscope.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Contrôle de Trombinoscope.jsx');
const trombiPath = path.resolve('src/components/Trombinoscope.jsx');
assert(fs.existsSync(trombiPath), 'Trombinoscope.jsx existe');
if (fs.existsSync(trombiPath)) {
  const src = fs.readFileSync(trombiPath, 'utf8');
  assert(src.includes("t('trombi.searchPlaceholder')"), "Placeholder recherche branché sur t(trombi.searchPlaceholder)");
  assert(src.includes("t('trombi.allPupitres')"), "Option tous pupitres branchée sur t(trombi.allPupitres)");
  assert(src.includes("t('trombi.allTags')"), "Option tous tags branchée sur t(trombi.allTags)");
  assert(src.includes("t('trombi.membersCountPlural'"), "Compteur membres au pluriel branché sur t(trombi.membersCountPlural)");
}

// -----------------------------------------------------------------------------
// 6. Contrôle de Forum.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 6 : Contrôle de Forum.jsx');
const forumPath = path.resolve('src/components/Forum.jsx');
assert(fs.existsSync(forumPath), 'Forum.jsx existe');
if (fs.existsSync(forumPath)) {
  const src = fs.readFileSync(forumPath, 'utf8');
  assert(src.includes("t('forum.tabPrivateMessages')"), "Onglet Messages privés branché sur t(forum.tabPrivateMessages)");
  assert(src.includes("t('forum.tabGroups')"), "Onglet Groupes branché sur t(forum.tabGroups)");
  assert(src.includes("t('forum.btnChannels')"), "Bouton Salons branché sur t(forum.btnChannels)");
  assert(src.includes("t('forum.defaultChannelGeneral')"), "Fallback Général branché sur t(forum.defaultChannelGeneral)");
}

// -----------------------------------------------------------------------------
// 7. Contrôle de VaralCategoryRope.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 7 : Contrôle de VaralCategoryRope.jsx');
const ropePath = path.resolve('src/components/documents/varal/VaralCategoryRope.jsx');
assert(fs.existsSync(ropePath), 'VaralCategoryRope.jsx existe');
if (fs.existsSync(ropePath)) {
  const src = fs.readFileSync(ropePath, 'utf8');
  assert(src.includes("t('documents.filterAllWithCount'"), "Filtre Tous branché sur t(documents.filterAllWithCount)");
  assert(src.includes("t('documents.filterVisibleWithCount'"), "Filtre Visibles branché sur t(documents.filterVisibleWithCount)");
  assert(src.includes("t('documents.filterArchivedWithCount'"), "Filtre Archivés branché sur t(documents.filterArchivedWithCount)");
}

// -----------------------------------------------------------------------------
// 8. Test d'interpolation dynamique des variables
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 8 : Test d\'interpolation dynamique des variables');
function interpolate(template, params) {
  let str = template;
  Object.keys(params).forEach(k => {
    str = str.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, 'g'), params[k]);
  });
  return str;
}

const interpMembresFr1 = interpolate(fr.trombi.membersCount, { count: 1 });
const interpMembresFrN = interpolate(fr.trombi.membersCountPlural, { count: 24 });
const interpMembresPt1 = interpolate(pt.trombi.membersCount, { count: 1 });
const interpMembresPtN = interpolate(pt.trombi.membersCountPlural, { count: 24 });
assert(interpMembresFr1 === "1 membre", `Interpolation FR 1 membre : ${interpMembresFr1}`);
assert(interpMembresFrN === "24 membres", `Interpolation FR 24 membres : ${interpMembresFrN}`);
assert(interpMembresPt1 === "1 integrante", `Interpolation PT 1 integrante : ${interpMembresPt1}`);
assert(interpMembresPtN === "24 integrantes", `Interpolation PT 24 integrantes : ${interpMembresPtN}`);

const interpDocsFr = interpolate(fr.documents.filterAllWithCount, { count: 8 });
const interpDocsPt = interpolate(pt.documents.filterAllWithCount, { count: 8 });
assert(interpDocsFr === "Tous (8)", `Interpolation FR filterAllWithCount : ${interpDocsFr}`);
assert(interpDocsPt === "Todos (8)", `Interpolation PT filterAllWithCount : ${interpDocsPt}`);

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS PARCOURS ESPACE ADHÉRENT SONT 100% VALIDÉS AVEC SUCCÈS !');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  console.log('========================================================================');
  process.exit(1);
}
