import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  sanitizeQuizText,
  normalizeQuizMediaUrl,
  isQuizMediaUrl,
  hasLeak,
  filterDistractorsByLength,
  generateQuizFromPieceSignals,
  generateQuizFromRepertoirePiece
} from '../src/utils/quizGenerator.js';
import { detectAlfaiaSticks } from '../src/utils/sequencerParser.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : SÉCURISATION DU GÉNÉRATEUR QCM & FOCUS RÉPERTOIRE");
console.log("===============================================================\n");

// --- Module 1 : Nettoyage typographique sanitizeQuizText ---
console.log("▶️ Module 1 : Assainissement typographique (sanitizeQuizText)");
assert.strictEqual(sanitizeQuizText('« Grand Tambour »'), 'Grand Tambour');
assert.strictEqual(sanitizeQuizText('"Rythme" (Baque Luanda) [Gonguê]'), 'Rythme');
assert.strictEqual(sanitizeQuizText("‘Maracatu’ et “Caboclo”."), 'Maracatu et Caboclo');
assert.strictEqual(sanitizeQuizText(" +  texte   avec   espaces   multiples * {{count}} "), 'Texte avec espaces multiples');
assert.strictEqual(sanitizeQuizText(null), '');
assert.strictEqual(sanitizeQuizText(undefined), '');
console.log("  ✅ [PASS] sanitizeQuizText retire rigoureusement le contenu entre parenthèses/crochets, guillemets, astérisques, variables et normalise la casse.");

// --- Module 2 : Règle anti-fuite hasLeak ---
console.log("\n▶️ Module 2 : Détection de fuite (hasLeak)");
// Fuite évidente : le mot "bacalhau" est dans la question
assert.strictEqual(
  hasLeak("Quelle baguette ou frappe de bacalhau est utilisée ?", "1 grosse mailloche + 1 bacalhau"),
  true,
  "hasLeak doit détecter 'bacalhau' présent dans la question"
);
// Fuite évidente avec Orixá
assert.strictEqual(
  hasLeak("Quel est l'attribut sacré de l'orixa Oxum dans ce rituel ?", "Oxum et son miroir doré"),
  true,
  "hasLeak doit détecter 'oxum' dans la question"
);
// Pas de fuite : mots de liaison ignorés et texte à trous légitime
assert.strictEqual(
  hasLeak("Dans ce chant pour la reine, quel est l'instrument avec cette voix ?", "Tambour d'alfaia"),
  false,
  "hasLeak ne doit pas lever de faux positif sur les mots de liaison (dans, pour, avec, cette, quel)"
);
assert.strictEqual(
  hasLeak("Complétez le vers suivant : Le tambour ______ résonne dans la nuit", "lointain"),
  false,
  "hasLeak ne doit pas bloquer un texte à trous légitime"
);
console.log("  ✅ [PASS] hasLeak isole les mots significatifs (>3 car.) et ignore les mots de liaison.");

// --- Module 3 : Calibrage de longueur des leurres filterDistractorsByLength ---
console.log("\n▶️ Module 3 : Calibrage de longueur des leurres (filterDistractorsByLength)");
const targetDef = "tambour en bois"; // 3 mots, 15 caractères
const candidatePool = [
  "cloche en fer", // 3 mots, 13 car (diff: 0 mot, diff car: 2/15 = 13% <= 35%) -> OK
  "caisse en peau", // 3 mots, 14 car (diff: 0 mot, diff car: 1/15 = 7% <= 35%) -> OK
  "grand gonguê", // 2 mots, 12 car (diff: -1 mot, diff car: 3/15 = 20% <= 35%) -> OK
  "tambour", // 1 mot, 7 car (diff: 2 mots > 1, diff car: 8/15 = 53% > 35%) -> REJET
  "C'est un grand tambour d'alfaia traditionnel de maracatu pour les cérémonies religieuses", // 12 mots -> REJET
  "tambour en bois" // même texte -> REJET
];

const filtered = filterDistractorsByLength(targetDef, candidatePool);
assert.strictEqual(filtered.includes("cloche en fer"), true, "cloche en fer doit être acceptée");
assert.strictEqual(filtered.includes("grand gonguê"), true, "grand gonguê doit être acceptée");
assert.strictEqual(filtered.includes("tambour"), false, "tambour (trop court) doit être rejeté");
assert.strictEqual(filtered.includes("C'est un grand tambour d'alfaia traditionnel de maracatu pour les cérémonies religieuses"), false, "distracteur trop long doit être rejeté");
assert.strictEqual(filtered.includes("tambour en bois"), false, "la réponse exacte ne doit pas être dans les leurres");
console.log("  ✅ [PASS] filterDistractorsByLength calibre fidèlement les écarts (±1 mot, ±35% caractères).");

// --- Module 4 : Détection binaire du matériel Alfaia (detectAlfaiaSticks) ---
console.log("\n▶️ Module 4 : Détection binaire Alfaia (detectAlfaiaSticks)");
// Cas A : Présence de 'I' ou 'i' -> 1 grosse mailloche + 1 bacalhau
const trackWithBacalhau = {
  name: "Alfaia 1",
  activeSteps: ['X', '-', 'I', '-', 'X', '-', 'I', '-']
};
const resultA = detectAlfaiaSticks([trackWithBacalhau]);
assert.strictEqual(resultA.hasBacalhau, true);
assert.strictEqual(resultA.correctAnswer, "1 grosse mailloche + 1 bacalhau");
assert.strictEqual(resultA.wrongAnswer, "2 grosses mailloches");
assert(resultA.question && resultA.question.type === 'materiel_alfaia');
assert(resultA.question.choices.some(c => c.text === "1 grosse mailloche + 1 bacalhau" && c.isCorrect));
assert(resultA.question.choices.some(c => c.text === "2 grosses mailloches" && !c.isCorrect));

// Cas B : Aucun 'I' -> 2 grosses mailloches
const trackWithoutBacalhau = {
  name: "Alfaia Meião",
  activeSteps: ['X', '-', 'X', '-', 'X', '-', 'X', '-']
};
const resultB = detectAlfaiaSticks([trackWithoutBacalhau]);
assert.strictEqual(resultB.hasBacalhau, false);
assert.strictEqual(resultB.correctAnswer, "2 grosses mailloches");
assert.strictEqual(resultB.wrongAnswer, "1 grosse mailloche + 1 bacalhau");
assert(resultB.question && resultB.question.type === 'materiel_alfaia');
assert(resultB.question.choices.some(c => c.text === "2 grosses mailloches" && c.isCorrect));
assert(resultB.question.choices.some(c => c.text === "1 grosse mailloche + 1 bacalhau" && !c.isCorrect));
console.log("  ✅ [PASS] detectAlfaiaSticks analyse les pas et génère la question matériel adéquate.");

// --- Module 5 : Générateur Focus Répertoire (generateQuizFromRepertoirePiece) ---
console.log("\n▶️ Module 5 : Générateur Focus Répertoire (generateQuizFromRepertoirePiece)");
const mockPieceDoc = {
  id: "piece_luanda_01",
  titre: "Baque de Luanda",
  sequenceurId: "preset_luanda",
  toadaDocId: "song_luanda_01",
  cultureDocId: "culture_iemanja_01",
  sinaisDoMestre: [
    { id: "sig_1", name: "Virada 1", consigne: "Break et relance rapide", imageUrl: "https://example.com/sig1.jpg" }
  ]
};

const mockContextData = {
  presetData: {
    tracks: [
      { name: "Alfaia Marcante", activeSteps: ['X', '-', 'I', '-', 'X', '-', 'I', '-', 'X', '-', 'X', '-', 'I', '-', 'X', '-'] },
      { name: "Caixa", activeSteps: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'] }
    ]
  },
  allPresets: [
    {
      id: "other_preset",
      tracks: [
        { name: "Alfaia", activeSteps: ['X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-'] }
      ]
    }
  ],
  toadaDoc: {
    id: "song_luanda_01",
    titre: "Toada de Luanda",
    notesLexique: [
      { mot: "Maracatu", explication: "Cortège royal afro-brésilien" },
      { mot: "Baque", explication: "Rythme ou pulsation" }
    ],
    paroles: "Ô Luanda meu Luanda\nNa batida do tambor\nVem chegando a nossa gente"
  },
  cultureDoc: {
    id: "culture_iemanja_01",
    type: "culture_fiche",
    themeCulture: "orixas",
    personnageOrisha: "Iemanjá",
    symbolesSacres: "Abebé miroir argenté",
    couleursTheme: ["#3B82F6"]
  },
  catalogSignals: [
    { id: "sig_1", name: "Virada 1", consigne: "Break et relance rapide", imageUrl: "https://example.com/sig1.jpg" },
    { id: "sig_2", name: "Arrêt complet", consigne: "Fin du morceau", imageUrl: "https://example.com/sig2.jpg" }
  ]
};

const generatedQuiz = generateQuizFromRepertoirePiece(mockPieceDoc, mockContextData);
assert(Array.isArray(generatedQuiz), "Le quiz retourné doit être un tableau");
assert(generatedQuiz.length >= 3, `Le quiz doit comporter plusieurs axes (trouvé: ${generatedQuiz.length})`);

// 1. Axe Matériel présent
const materielQ = generatedQuiz.find(q => q.type === 'materiel_alfaia');
assert(materielQ, "Axe Matériel présent dans le Focus Répertoire");
assert.strictEqual(materielQ.correctAnswer, "1 grosse mailloche + 1 bacalhau");

// 2. Axe Mestria présent
const mestriaQ = generatedQuiz.find(q => q.type === 'mestre_signal_consigne' || q.type === 'image_options');
assert(mestriaQ, "Axe Mestria présent dans le Focus Répertoire");

// 3. Axe Tablature présent
const tabQ = generatedQuiz.find(q => q.type === 'pattern_rythmique');
assert(tabQ, "Axe Tablature présent dans le Focus Répertoire");
assert(tabQ.choices.length >= 2, "La question tablature doit comporter des leurres");

// 4. Axe Paroles présent
const parolesQ = generatedQuiz.find(q => q.type === 'song_lexique' || q.type === 'song_verse_hole');
assert(parolesQ, "Axe Paroles présent dans le Focus Répertoire");

// 5. Axe Culture présent
const cultureQ = generatedQuiz.find(q => q.type === 'culture' || q.type === 'symbole_orixa' || q.type === 'devinette_visuelle');
assert(cultureQ, "Axe Culture présent dans le Focus Répertoire");

console.log(`  ✅ [PASS] generateQuizFromRepertoirePiece synthétise les 5 axes avec succès (${generatedQuiz.length} questions générées).`);

// --- Module 6 : Contrôle statique et modularité (< 200 lignes) ---
console.log("\n▶️ Module 6 : Contrôle statique et modularité des composants UI");
const unfoldedPath = path.resolve('src/components/member/MemberPieceUnfoldedContent.jsx');
const modalPath = path.resolve('src/components/member/PieceQuizModal.jsx');

assert(fs.existsSync(unfoldedPath), "MemberPieceUnfoldedContent.jsx doit exister");
assert(fs.existsSync(modalPath), "PieceQuizModal.jsx doit exister");

const unfoldedLines = fs.readFileSync(unfoldedPath, 'utf8').split('\n').length;
const modalLines = fs.readFileSync(modalPath, 'utf8').split('\n').length;

console.log(`  ℹ️ MemberPieceUnfoldedContent.jsx : ${unfoldedLines} lignes (< 200)`);
console.log(`  ℹ️ PieceQuizModal.jsx : ${modalLines} lignes (< 200)`);

assert(unfoldedLines < 200, `MemberPieceUnfoldedContent.jsx doit faire moins de 200 lignes (actuel: ${unfoldedLines})`);
assert(modalLines < 200, `PieceQuizModal.jsx doit faire moins de 200 lignes (actuel: ${modalLines})`);

const unfoldedContent = fs.readFileSync(unfoldedPath, 'utf8');
assert(unfoldedContent.includes('Réviser ce morceau') || unfoldedContent.includes('reviserCeMorceau'), "Le bouton Réviser ce morceau doit être présent");
assert(unfoldedContent.includes('PieceQuizModal'), "PieceQuizModal doit être importé et rendu dans MemberPieceUnfoldedContent");

console.log("  ✅ [PASS] Tous les composants respectent scrupuleusement la règle anti-monolithe (< 200 lignes).");

// --- Module 7 : Non-régression QCM Signes du Mestre (interpolation {{name}} FR/PT + préservation URLs https://) ---
console.log("\n▶️ Module 7 : Non-régression QCM Signes du Mestre (interpolation {{name}} + URLs https://)");
const makeT = (dict) => (dotPath, fallbackOrParams, maybeParams) => {
  const fb = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
  const params = maybeParams !== undefined && maybeParams !== null ? maybeParams : (fb === undefined ? fallbackOrParams : undefined);
  let val = dotPath.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), dict) ?? fb;
  if (typeof val === 'string' && params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) val = val.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, 'g'), String(v));
    }
  }
  return val;
};

const storageUrl1 = "https://firebasestorage.googleapis.com/v0/b/o-girador-7828c.firebasestorage.app/o/sinais%2Fvirada_1_TokenAbC.png?alt=media&token=AbC123XyZ";
const corruptedUrl2 = "Https://firebasestorage.googleapis.com/v0/b/o-girador-7828c.firebasestorage.app/o/sinais%2Fparada_2.png?alt=media&token=DeF456";
const storageUrl3 = "https://firebasestorage.googleapis.com/v0/b/o-girador-7828c.firebasestorage.app/o/sinais%2Farrasto_3.png?alt=media&token=GhI789";
const storageUrl4 = "https://firebasestorage.googleapis.com/v0/b/o-girador-7828c.firebasestorage.app/o/sinais%2Fbaque_4.png?alt=media&token=JkL012";

assert.strictEqual(sanitizeQuizText(storageUrl1), storageUrl1, "sanitizeQuizText ne doit JAMAIS capitaliser ni tronquer une URL https://");
assert.strictEqual(sanitizeQuizText(corruptedUrl2), corruptedUrl2.replace(/^Https:/, 'https:'), "sanitizeQuizText doit normaliser Https:// en https:// sans toucher au token");
assert.strictEqual(isQuizMediaUrl(storageUrl1), true);
assert.strictEqual(normalizeQuizMediaUrl(corruptedUrl2).startsWith('https://'), true);

const pieceWithLabelSignals = {
  id: 'piece_signes_test',
  titre: 'Baque Virado Royal',
  sinaisDoMestre: [
    { id: 's1', label: 'Appel Virada Royale', action: 'Double roulement puis reprise', imageUrl: storageUrl1 },
    { id: 's2', title: 'Coupure Sèche', action: 'Arrêt net sur le temps 4' }
  ]
};
const catalogMocks = [
  { id: 's2_cat', nom: 'Parada Geral', imageUrl: corruptedUrl2 },
  { id: 's3_cat', name: 'Arrasto', imageUrl: storageUrl3 },
  { id: 's4_cat', label: 'Retomada', imageUrl: storageUrl4 }
];

for (const [lang, dict] of [['FR', fr], ['PT', pt]]) {
  const tFn = makeT(dict);
  const sigQs = generateQuizFromPieceSignals(pieceWithLabelSignals, pieceWithLabelSignals.sinaisDoMestre, catalogMocks, { t: tFn });
  assert(sigQs.length >= 3, `[${lang}] generateQuizFromPieceSignals doit produire les questions visuelles et consignes`);
  for (const q of sigQs) {
    assert(!/\{\{.*?\}\}|\{[a-zA-Z0-9_]+\}/.test(q.questionText), `[${lang}] Aucune balise {{...}} résiduelle dans : ${q.questionText}`);
  }
  const imgQ = sigQs.find((q) => q.type === 'image_options');
  assert(imgQ, `[${lang}] Une question image_options doit être générée`);
  assert(imgQ.questionText.includes('Appel Virada Royale'), `[${lang}] Le label du signe doit être interpolé dans l'énoncé : ${imgQ.questionText}`);
  for (const c of imgQ.choices) {
    assert.strictEqual(c.isImage, true, `[${lang}] Chaque option image doit porter isImage: true`);
    assert(c.text.startsWith('https://'), `[${lang}] Aucune URL ne doit commencer par Https:// : ${c.text}`);
  }

  // Vérification de bout en bout via generateQuizFromRepertoirePiece (avec sanitizeQuizQuestions actif)
  const fullPieceQuiz = generateQuizFromRepertoirePiece(pieceWithLabelSignals, { catalogSignals: catalogMocks, t: tFn }, { t: tFn });
  const survivedImgOrSig = fullPieceQuiz.filter((q) => q.type === 'image_options' || q.type === 'mestre_signal_consigne');
  assert(survivedImgOrSig.length >= 1, `[${lang}] Les questions Signes du Mestre survivent à sanitizeQuizQuestions sans faux positif hasAnswerLeak`);
  for (const q of fullPieceQuiz) {
    assert(!/\{\{.*?\}\}/.test(q.questionText), `[${lang}] Zéro {{...}} dans generateQuizFromRepertoirePiece`);
    for (const c of q.choices || []) {
      if (/^https?:\/\//i.test(c.text)) {
        assert(c.text.startsWith('https://') || c.text.startsWith('http://'), `[${lang}] Casse intacte de l'URL dans les choix finaux : ${c.text}`);
      }
    }
  }
}

const gridPath = path.resolve('src/components/pedagogy/QuizOptionsGrid.jsx');
assert(fs.existsSync(gridPath), "QuizOptionsGrid.jsx doit exister");
const gridSrc = fs.readFileSync(gridPath, 'utf8');
assert(gridSrc.includes('loading="lazy"') && gridSrc.includes('object-contain') && gridSrc.includes('🖐️'), "QuizOptionsGrid.jsx doit rendre <img loading=\"lazy\" object-contain> avec repli 🖐️");
console.log("  ✅ [PASS] Interpolation FR/PT de {{name}}, préservation https:// et grille 2x2 QuizOptionsGrid validées.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : LE GÉNÉRATEUR QCM ET LE MODE FOCUS SONT SÉCURISÉS !");
console.log("===============================================================\n");
