import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('🧪 TEST MISSION : HARMONISATION ONGLET RÉPERTOIRE & ACCORDÉON ADHÉRENT');
console.log('========================================================================\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    allPassed = false;
  }
}

// -----------------------------------------------------------------------------
// 1. Libellé de l'onglet sans émoji (App.jsx, fr.js, pt.js)
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Nettoyage du libellé de l\'onglet');
const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
const frContent = fs.readFileSync(path.resolve('src/locales/fr.js'), 'utf-8');
const ptContent = fs.readFileSync(path.resolve('src/locales/pt.js'), 'utf-8');

assert('App.jsx : label Répertoire sans émoji dans mon-espace', appContent.includes("{ id: 'repertoire', label: 'Répertoire', labelKey: 'tabRepertoire' }"));
assert('fr.js : tabRepertoire sans émoji', frContent.includes('tabRepertoire: "Répertoire"'));
assert('pt.js : tabRepertoire sans émoji', ptContent.includes('tabRepertoire: "Repertório"'));

// -----------------------------------------------------------------------------
// 2. Contrôles de repliage global et Grille responsive (MemberRepertoireView.jsx)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôles de repliage global et Grille responsive');
const viewContent = fs.readFileSync(path.resolve('src/components/member/MemberRepertoireView.jsx'), 'utf-8');
const viewLines = viewContent.split('\n').length;

assert(`MemberRepertoireView < 220 lignes (actuel: ${viewLines})`, viewLines < 220);
assert('Grille responsive 2 colonnes PC / 1 colonne mobile', viewContent.includes('grid grid-cols-1 md:grid-cols-2 gap-4'));
assert('État local expandedPieces (Set)', viewContent.includes('expandedPieces') && viewContent.includes('new Set()'));
assert('Bascule globale Tout déplier / replier', viewContent.includes('Tout déplier') || viewContent.includes('allExpanded'));

// -----------------------------------------------------------------------------
// 3. Carte Morceau Accordéon (MemberPieceCard.jsx)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Carte Morceau Accordéon');
const cardContent = fs.readFileSync(path.resolve('src/components/member/MemberPieceCard.jsx'), 'utf-8');
const cardLines = cardContent.split('\n').length;
const unfoldedContent = fs.readFileSync(path.resolve('src/components/member/MemberPieceUnfoldedContent.jsx'), 'utf-8');

assert(`MemberPieceCard < 200 lignes (actuel: ${cardLines})`, cardLines < 200);
assert('Indicateur chevron ▸ / ▾', cardContent.includes("'▾' : '▸'") || cardContent.includes('"▾" : "▸"'));
assert('Bouton 1-clic Révision demandée', cardContent.includes('Révision demandée') && cardContent.includes('Demander à réviser'));
assert('Curseur de confort 4 pastilles cliquable', cardContent.includes('COMFORT_LEVELS') && cardContent.includes('onSetComfortLevel'));
assert('Contenu multimédia déplié conditionnel', cardContent.includes('isExpanded') && cardContent.includes('MemberPieceUnfoldedContent'));

// -----------------------------------------------------------------------------
// 4. Ressources en lecture seule stricte dans le panneau déplié
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Ressources multimédias en lecture seule stricte');
assert('Notes du Mestre affichées si présentes', unfoldedContent.includes('piece.notes'));
assert('Lecteur audio Cordel', unfoldedContent.includes('<audio'));
assert('Bouton Paroles Toada', unfoldedContent.includes('activeToada'));
assert('Fiches Culture', unfoldedContent.includes('cultureDocs'));
assert('Bloc Entraînements (PieceAisanceSection)', unfoldedContent.includes('PieceAisanceSection'));
assert('Chorégraphie Dançad\'Or', unfoldedContent.includes('activeChoreography'));
assert('Vidéo', unfoldedContent.includes('videoUrl'));

// Vérification de l'absence totale d'outils d'édition
const forbiddenKeywords = ['crayon', 'editPiece', 'handleDelete', 'corbeille', 'btn-delete'];
let hasForbidden = false;
for (const kw of forbiddenKeywords) {
  if (unfoldedContent.includes(kw) || cardContent.includes(kw)) {
    hasForbidden = true;
    break;
  }
}
assert('EXCLUSION STRICTE : Aucun outil d\'édition ni suppression', !hasForbidden);

console.log('\n========================================================================');
if (allPassed) {
  console.log('🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS SONT VALIDÉES SANS ERREUR !');
  process.exit(0);
} else {
  console.error('❌ ÉCHEC : CERTAINES ASSERTIONS ONT ÉCHOUÉ.');
  process.exit(1);
}
