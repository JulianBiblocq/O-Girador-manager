import fs from 'fs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('🧪 Démarrage du test unitaire i18n chirurgical (Dashboard Pédagogie, Danse & Varal Culture)...');

// 1. Clés attendues
const expectedPedagogyKeys = [
  'trainerImmediateAccess',
  'quizzesCompletedCount',
  'quizzesCompletedCount_plural',
  'blindTestSub',
  'signalRecognitionSub',
  'tabDanse',
  'matrixSubtitle',
  'legendComfortable',
  'legendWorking',
  'legendFragile',
  'officialSeasonBadge',
  'emptyDanseTitle',
  'emptyDanseDesc',
];

const expectedDocumentsKeys = [
  'btnBothTables',
  'btnNewToada',
  'tableBCultureTitle',
  'tableBCultureSubtitle',
  'thCultureTitle',
  'thThemeStamp',
  'btnConsult',
  'btnEditTextQcm',
  'catOrixasSpiritualite',
  'catMusiqueNacoes',
  'catHistoireCortege',
  'catCuisineRecettes',
  'catTerritoire',
  'catCourRoyale',
];

let errors = [];

// Vérification de la parité dans pedagogy
expectedPedagogyKeys.forEach((key) => {
  if (!fr.pedagogy || typeof fr.pedagogy[key] !== 'string') {
    errors.push(`Clé manquante dans fr.js: pedagogy.${key}`);
  }
  if (!pt.pedagogy || typeof pt.pedagogy[key] !== 'string') {
    errors.push(`Clé manquante dans pt.js: pedagogy.${key}`);
  }
});

// Vérification de la parité dans documents
expectedDocumentsKeys.forEach((key) => {
  if (!fr.documents || typeof fr.documents[key] !== 'string') {
    errors.push(`Clé manquante dans fr.js: documents.${key}`);
  }
  if (!pt.documents || typeof pt.documents[key] !== 'string') {
    errors.push(`Clé manquante dans pt.js: documents.${key}`);
  }
});

if (errors.length > 0) {
  console.error('❌ Erreurs de parité dans les locales :', errors);
  process.exit(1);
}
console.log(`✅ [1/2] Les 27 clés (13 pedagogy + 14 documents) sont présentes et symétriques en FR et PT.`);

// 2. Vérification des raccordements dans les composants cibles
const checkWiring = [
  {
    file: 'src/components/pedagogy/DefisSummaryCard.jsx',
    requiredPatterns: [
      'pedagogy.trainerImmediateAccess',
      'pedagogy.quizzesCompletedCount',
      'pedagogy.quizzesCompletedCount_plural',
      'pedagogy.blindTestSub',
      'pedagogy.signalRecognitionSub'
    ]
  },
  {
    file: 'src/components/mestre/MestrePedagogyDashboard.jsx',
    requiredPatterns: [
      'pedagogy.tabDanse'
    ]
  },
  {
    file: 'src/components/pedagogy/PercussionRepertoireAnalytics.jsx',
    requiredPatterns: [
      'pedagogy.matrixSubtitle',
      'pedagogy.legendComfortable',
      'pedagogy.legendWorking',
      'pedagogy.legendFragile'
    ]
  },
  {
    file: 'src/components/pedagogy/PercussionPieceRow.jsx',
    requiredPatterns: [
      'pedagogy.officialSeasonBadge'
    ]
  },
  {
    file: 'src/components/pedagogy/DanseChoregraphieAnalytics.jsx',
    requiredPatterns: [
      'pedagogy.emptyDanseTitle',
      'pedagogy.emptyDanseDesc'
    ]
  },
  {
    file: 'src/components/pedagogy/PedagogyDocumentsView.jsx',
    requiredPatterns: [
      'documents.btnBothTables',
      'documents.btnNewToada',
      'documents.tableBCultureTitle',
      'documents.tableBCultureSubtitle'
    ]
  },
  {
    file: 'src/components/pedagogy/CultureFichesTable.jsx',
    requiredPatterns: [
      'documents.catOrixasSpiritualite',
      'documents.catMusiqueNacoes',
      'documents.catHistoireCortege',
      'documents.catCuisineRecettes',
      'documents.catTerritoire',
      'documents.catCourRoyale',
      'documents.thCultureTitle',
      'documents.thThemeStamp',
      'documents.btnConsult',
      'documents.btnEditTextQcm'
    ]
  }
];

let wiringErrors = [];
checkWiring.forEach(({ file, requiredPatterns }) => {
  if (!fs.existsSync(file)) {
    wiringErrors.push(`Fichier introuvable : ${file}`);
    return;
  }
  const code = fs.readFileSync(file, 'utf8');
  requiredPatterns.forEach((pat) => {
    if (!code.includes(pat)) {
      wiringErrors.push(`Pattern non trouvé dans ${file} : "${pat}"`);
    }
  });
});

if (wiringErrors.length > 0) {
  console.error('❌ Erreurs de câblage dans les composants :', wiringErrors);
  process.exit(1);
}
console.log(`✅ [2/2] Câblage i18n validé sur les 7 composants cibles.`);
console.log('🏆 SUCCÈS TOTAL : La mission chirurgicale i18n est 100% validée !');
