import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { groupVideosByFamily, getDefaultActiveBlockId, normalizeVideoItem } from '../src/utils/repertoireVideoUtils.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : LECTEUR RÉPERTOIRE 2 NIVEAUX & PASSERELLES VARAL');
console.log('========================================================================\n');

let allPassed = true;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    allPassed = false;
  }
}

// -------------------------------------------------------------
// Test 1 : Utilitaires et catégorisation vidéo (repertoireVideoUtils.js)
// -------------------------------------------------------------
console.log('▶️ Test 1 : Classification à 2 niveaux et smart-default élève');

const mockVideos = [
  { url: 'https://youtube.com/watch?v=1', titre: 'Frappe Marcante', instruments: ['Alfaia Marcante'] },
  { url: 'https://youtube.com/watch?v=2', titre: 'Variations Meião', instruments: ['Alfaia Meião'] },
  { url: 'https://youtube.com/watch?v=3', titre: 'Tuto Repique', instruments: ['Repique'] },
  { url: 'https://youtube.com/watch?v=4', titre: 'Tuto Caixa & Tarol', instruments: ['Caixa', 'Tarol'] },
  { url: 'https://youtube.com/watch?v=5', titre: 'Gonguê Cloche', instruments: ['Gonguê'] },
  { url: 'https://youtube.com/watch?v=6', titre: 'Jeu d\'Agbê', instruments: ['Agbê'] },
  { url: 'https://youtube.com/watch?v=7', titre: 'Captation Concert Recife', instruments: [], isLiveOrGlobal: true }
];

const blocks = groupVideosByFamily(mockVideos);

assert(blocks.length === 5, `5 blocs de niveau 1 créés (trouvé: ${blocks.length})`);

const alfaiasBlock = blocks.find((b) => b.id === 'alfaias');
assert(Boolean(alfaiasBlock), 'Bloc Alfaias présent');
assert(alfaiasBlock?.videos.length === 3, `Bloc Alfaias contient 3 sous-voix (Marcante, Meião, Repique)`);

const caixasBlock = blocks.find((b) => b.id === 'caixas');
assert(Boolean(caixasBlock), 'Bloc Caixas présent');
assert(caixasBlock?.videos.length === 1, `Bloc Caixas contient 1 vidéo regroupant Caixa & Tarol`);

const gongueBlock = blocks.find((b) => b.id === 'gongue');
assert(Boolean(gongueBlock), 'Bloc Gonguê présent');

const sementesBlock = blocks.find((b) => b.id === 'sementes');
assert(Boolean(sementesBlock), 'Bloc Sementes présent (Agbê)');

const liveBlock = blocks.find((b) => b.id === 'live_ensemble');
assert(Boolean(liveBlock), '5e bloc dédié Live / Ensemble présent');
assert(liveBlock?.videos.length === 1, 'Bloc Live contient la captation concert');

// Smart-default joueur d'Alfaia Repique
const defaultForRepique = getDefaultActiveBlockId(blocks, 'Alfaia Repique');
assert(defaultForRepique === 'alfaias', `Joueur d'Alfaia Repique pré-sélectionne le bloc Alfaias (trouvé: ${defaultForRepique})`);

// Rétrocompatibilité : vidéo sans instrument = Live
const legacyNormalized = normalizeVideoItem({ url: 'https://youtube.com/watch?v=old', titre: 'Vidéo sans instrument' });
assert(legacyNormalized.isLiveOrGlobal === true, 'Vidéo rétrocompatible sans instrument classée en isLiveOrGlobal: true');

// Rétrocompatibilité format chaîne
const stringNorm = normalizeVideoItem({ url: 'https://youtube.com/watch?v=str', instruments: 'Caixa, Tarol' });
assert(Array.isArray(stringNorm.instruments) && stringNorm.instruments.length === 2, 'Normalisation réussie des instruments en chaîne séparée par virgule');

console.log('\n▶️ Test 2 : Contrôle statique PieceVideoSection.jsx (< 200 lignes)');
const videoSectionPath = resolve('src/components/repertoire/PieceVideoSection.jsx');
assert(existsSync(videoSectionPath), 'PieceVideoSection.jsx existe');
const videoSectionContent = readFileSync(videoSectionPath, 'utf-8');
const videoSectionLines = videoSectionContent.trim().split('\n').length;
assert(videoSectionLines < 200, `PieceVideoSection < 200 lignes (actuel: ${videoSectionLines})`);
assert(videoSectionContent.includes('blocks.map'), 'Affichage des blocs de familles niveau 1');
assert(videoSectionContent.includes('currentVideos.map'), 'Affichage des sous-pastilles niveau 2');

console.log('\n▶️ Test 3 : Contrôle statique BatchAssignVideoModal.jsx (< 180 lignes)');
const batchModalPath = resolve('src/components/repertoire/BatchAssignVideoModal.jsx');
assert(existsSync(batchModalPath), 'BatchAssignVideoModal.jsx existe');
const batchModalContent = readFileSync(batchModalPath, 'utf-8');
const batchModalLines = batchModalContent.trim().split('\n').length;
assert(batchModalLines < 180, `BatchAssignVideoModal < 180 lignes (actuel: ${batchModalLines})`);
assert(batchModalContent.includes('writeBatch'), 'Validation par writeBatch Firestore');
assert(batchModalContent.includes('handleSelectAllPieces'), 'Bouton Tout cocher présent');
assert(batchModalContent.includes('handleDeselectAllPieces'), 'Bouton Décocher tout présent');

console.log('\n▶️ Test 4 : Contrôle statique RepertoirePasserelleButton.jsx (< 120 lignes)');
const passerellePath = resolve('src/components/repertoire/RepertoirePasserelleButton.jsx');
assert(existsSync(passerellePath), 'RepertoirePasserelleButton.jsx existe');
const passerelleContent = readFileSync(passerellePath, 'utf-8');
const passerelleLines = passerelleContent.trim().split('\n').length;
assert(passerelleLines < 120, `RepertoirePasserelleButton < 120 lignes (actuel: ${passerelleLines})`);
assert(passerelleContent.includes('open-repertoire-piece'), 'Émission de l\'événement open-repertoire-piece');
assert(passerelleContent.includes('Fiche Répertoire'), 'Libellé Cordel du bouton présent');

console.log('\n▶️ Test 5 : Sélecteur de Toada dans RepertoirePieceModal.jsx');
const pieceModalPath = resolve('src/components/mestre/RepertoirePieceModal.jsx');
const pieceModalContent = readFileSync(pieceModalPath, 'utf-8');
assert(pieceModalContent.includes('toadaFilterMode'), 'Gestion du filtre à bascule pour les Toadas');
assert(pieceModalContent.includes('toadaUsageMap'), 'Détection des Toadas déjà liées à un autre morceau');
assert(pieceModalContent.includes('Non attribuées'), 'Bouton de filtre pour les Toadas non attribuées');
assert(pieceModalContent.includes('Déjà liée à'), 'Mention de morceau lié pour les Toadas déjà attribuées');

console.log('\n▶️ Test 6 : Passerelles retour intégrées dans SongCard et CultureCard');
const songCardContent = readFileSync(resolve('src/components/SongCard.jsx'), 'utf-8');
assert(songCardContent.includes('RepertoirePasserelleButton'), 'SongCard intègre RepertoirePasserelleButton');

const cultureCardContent = readFileSync(resolve('src/components/CultureCard.jsx'), 'utf-8');
assert(cultureCardContent.includes('RepertoirePasserelleButton'), 'CultureCard intègre RepertoirePasserelleButton');

console.log('\n========================================================================');
if (allPassed) {
  console.log('🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DE LA MISSION SONT VALIDÉES !');
  process.exit(0);
} else {
  console.error('❌ ÉCHEC : CERTAINES ASSERTIONS ONT ÉCHOUÉ.');
  process.exit(1);
}
