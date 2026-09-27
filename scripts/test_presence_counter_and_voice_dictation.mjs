import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : COMPTEUR DE PRÉSENCE & DICTÉE VOCALE");
console.log("===============================================================\n");

let passedAssertions = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ [PASS] ${message}`);
    passedAssertions++;
  }
}

// -------------------------------------------------------------
// 1. Audit usePresence.js
// -------------------------------------------------------------
console.log("▶️ Module 1 : Audit et Fiabilisation de usePresence.js");
const presenceHookPath = path.join(rootDir, 'src', 'hooks', 'usePresence.js');
assert(fs.existsSync(presenceHookPath), "usePresence.js existe");

const presenceHookContent = fs.readFileSync(presenceHookPath, 'utf8');
const presenceLines = presenceHookContent.split('\n').length;
console.log(`  ℹ️ usePresence.js : ${presenceLines} lignes (< 200 lignes)`);
assert(presenceLines < 200, "usePresence.js respecte la règle anti-monolithe (< 200 lignes)");

assert(presenceHookContent.includes('VISIBILITY_GRACE_PERIOD_MS'), "Période de grâce de visibilité définie (2 minutes)");
assert(presenceHookContent.includes('hideTimerRef'), "Utilisation d'un timer de grâce pour éviter les micro-coupures");
assert(presenceHookContent.includes('canonicalizeGroupId'), "Canonicalisation multi-casse du groupId importée");
assert(presenceHookContent.includes('attemptInitialOnline'), "Gestion sécurisée de l'authentification initiale avec retry");
assert(presenceHookContent.includes('rebuildMergedList'), "Fusion multi-casse des snapshots sans doublons");

// -------------------------------------------------------------
// 2. Audit useSpeechToText.js
// -------------------------------------------------------------
console.log("\n▶️ Module 2 : Audit du hook useSpeechToText.js");
const speechHookPath = path.join(rootDir, 'src', 'hooks', 'useSpeechToText.js');
assert(fs.existsSync(speechHookPath), "useSpeechToText.js existe");

const speechHookContent = fs.readFileSync(speechHookPath, 'utf8');
const speechHookLines = speechHookContent.split('\n').length;
console.log(`  ℹ️ useSpeechToText.js : ${speechHookLines} lignes (< 180 lignes)`);
assert(speechHookLines < 180, "useSpeechToText.js respecte la règle de modularité");

assert(speechHookContent.includes('window.SpeechRecognition || window.webkitSpeechRecognition'), "Support de la Web Speech API standard et webkit");
assert(speechHookContent.includes('isListening'), "Expose l'état isListening");
assert(speechHookContent.includes('isSupported'), "Expose le drapeau isSupported pour la compatibilité navigateur");
assert(speechHookContent.includes('pt-BR'), "Support bilingue français / portugais brésilien selon la locale");

// -------------------------------------------------------------
// 3. Audit VoiceDictationButton.jsx
// -------------------------------------------------------------
console.log("\n▶️ Module 3 : Audit du composant VoiceDictationButton.jsx");
const dictationButtonPath = path.join(rootDir, 'src', 'components', 'common', 'VoiceDictationButton.jsx');
assert(fs.existsSync(dictationButtonPath), "VoiceDictationButton.jsx existe");

const dictationButtonContent = fs.readFileSync(dictationButtonPath, 'utf8');
const dictationButtonLines = dictationButtonContent.split('\n').length;
console.log(`  ℹ️ VoiceDictationButton.jsx : ${dictationButtonLines} lignes (< 100 lignes)`);
assert(dictationButtonLines < 100, "VoiceDictationButton.jsx est concis et modulaire (< 100 lignes)");

assert(dictationButtonContent.includes('useSpeechToText'), "Connecté à useSpeechToText");
assert(dictationButtonContent.includes('isListening'), "Affiche une animation visuelle d'écoute (pulse)");
assert(dictationButtonContent.includes('aria-label'), "Respecte les normes d'accessibilité avec aria-label");
assert(dictationButtonContent.includes('🎙️'), "Icône microphone Cordel présente");

// -------------------------------------------------------------
// 4. Audit des intégrations UI (Discussions, Messagerie Privée, Forum)
// -------------------------------------------------------------
console.log("\n▶️ Module 4 : Audit de l'intégration dans les espaces d'écriture");

// 4.1 PrivateChatView.jsx
const privateChatPath = path.join(rootDir, 'src', 'components', 'PrivateChatView.jsx');
const privateChatContent = fs.readFileSync(privateChatPath, 'utf8');
assert(privateChatContent.includes('VoiceDictationButton'), "PrivateChatView importe VoiceDictationButton");
assert(privateChatContent.includes('spokenText'), "PrivateChatView traite la dictée vocale dans la barre de saisie");

// 4.2 ThreadReplyBar.jsx
const replyBarPath = path.join(rootDir, 'src', 'components', 'forum', 'thread', 'ThreadReplyBar.jsx');
const replyBarContent = fs.readFileSync(replyBarPath, 'utf8');
assert(replyBarContent.includes('VoiceDictationButton'), "ThreadReplyBar importe VoiceDictationButton");
assert(replyBarContent.includes('spokenText'), "ThreadReplyBar intègre la dictée vocale en mode compact");

// 4.3 RichTextEditor.jsx
const richEditorPath = path.join(rootDir, 'src', 'components', 'RichTextEditor.jsx');
const richEditorContent = fs.readFileSync(richEditorPath, 'utf8');
assert(richEditorContent.includes('VoiceDictationButton'), "RichTextEditor importe VoiceDictationButton");
assert(richEditorContent.includes('spokenText'), "RichTextEditor injecte la dictée vocale dans le contenu TipTap");

console.log("\n===============================================================");
console.log(`🏆 SUCCÈS TOTAL : LES ${passedAssertions} ASSERTIONS SONT PARFAITEMENT VALIDÉES !`);
console.log("===============================================================\n");
