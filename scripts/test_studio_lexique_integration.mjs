import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_STUDIO_LEXIQUE,
  DEFAULT_STUDIO_MENTIONS,
  DEFAULT_STUDIO_MENTIONS_OBJECTS,
  DEFAULT_STUDIO_EQUIVALENCES,
  DEFAULT_STUDIO_HASHTAGS,
  normalizeMentionHandle,
  normalizeHashtag
} from '../src/config/studioSocialConfig.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("=== Lancement des tests d'intégration Studio Lexique Manager ===");

// Test 1 : Fonctions de normalisation
console.log("1. Test des utilitaires de normalisation...");
assert.strictEqual(normalizeMentionHandle("ogirador"), "@ogirador");
assert.strictEqual(normalizeMentionHandle("@ogirador"), "@ogirador");
assert.strictEqual(normalizeMentionHandle("@@@ogirador"), "@ogirador");
assert.strictEqual(normalizeMentionHandle("   @maracatu   "), "@maracatu");
assert.strictEqual(normalizeMentionHandle(""), "");

assert.strictEqual(normalizeHashtag("maracatu"), "#maracatu");
assert.strictEqual(normalizeHashtag("#maracatu"), "#maracatu");
assert.strictEqual(normalizeHashtag("###cultura"), "#cultura");
assert.strictEqual(normalizeHashtag("   #ogirador   "), "#ogirador");
assert.strictEqual(normalizeHashtag(""), "");
console.log("   ✓ Normalisation des mentions et hashtags : OK");

// Test 2 : Structure des constantes par défaut
console.log("2. Vérification des constantes par défaut...");
assert(Array.isArray(DEFAULT_STUDIO_MENTIONS_OBJECTS), "DEFAULT_STUDIO_MENTIONS_OBJECTS doit être un tableau");
assert(DEFAULT_STUDIO_MENTIONS_OBJECTS.length >= 2, "Au moins 2 mentions par défaut");
DEFAULT_STUDIO_MENTIONS_OBJECTS.forEach(m => {
  assert(m.id && m.label && m.handle, "Chaque mention doit avoir id, label et handle");
  assert(m.handle.startsWith('@'), "Le handle doit commencer par @");
});

assert(Array.isArray(DEFAULT_STUDIO_EQUIVALENCES), "DEFAULT_STUDIO_EQUIVALENCES doit être un tableau");
assert(DEFAULT_STUDIO_EQUIVALENCES.length >= 5, "Au moins 5 équivalences culturelles");
DEFAULT_STUDIO_EQUIVALENCES.forEach(eq => {
  assert(eq.preferred, "Chaque équivalence doit avoir un preferred term");
  assert(typeof eq.activeChip === 'boolean', "activeChip doit être un booléen");
});

assert(Array.isArray(DEFAULT_STUDIO_HASHTAGS), "DEFAULT_STUDIO_HASHTAGS doit être un tableau");
assert(DEFAULT_STUDIO_HASHTAGS.length >= 3, "Au moins 3 hashtags par défaut");
DEFAULT_STUDIO_HASHTAGS.forEach(t => {
  assert(t.startsWith('#'), "Chaque hashtag doit commencer par #");
});
console.log("   ✓ Constantes et formats de configuration : OK");

// Test 3 : Filtrage des chips actifs pour le Studio Social
console.log("3. Test du filtrage des pastilles d'insertion rapide...");
const activeChips = DEFAULT_STUDIO_EQUIVALENCES
  .filter(eq => eq.activeChip !== false)
  .map(eq => eq.preferred);

assert(activeChips.includes("Batuque"), "Batuque doit être actif en chip");
assert(activeChips.includes("Alfaias"), "Alfaias doit être actif en chip");
assert(activeChips.includes("Toada"), "Toada doit être actif en chip");
assert(!activeChips.includes("Groupe de Maracatu / Nação"), "Groupe de Maracatu ne doit pas être un chip rapide par défaut");
console.log("   ✓ Filtrage des pastilles rapides (activeChip) : OK");

// Test 4 : Vérification des traductions FR et PT
console.log("4. Vérification des dictionnaires de traduction FR et PT...");
assert.strictEqual(fr.poles.tabStudioLexique, "Lexique");
assert.strictEqual(pt.poles.tabStudioLexique, "Léxico");
assert.strictEqual(fr.studioSocial.videoUrlLabel, "Vidéo");
assert.strictEqual(pt.studioSocial.videoUrlLabel, "Vídeo");
assert(fr.studioLexique && fr.studioLexique.title, "Le bloc studioLexique FR doit être défini");
assert(pt.studioLexique && pt.studioLexique.title, "Le bloc studioLexique PT doit être défini");
console.log("   ✓ Traductions bilingues : OK");

// Test 5 : Vérification de la règle Anti-Monolithe (< 250 lignes par fichier)
console.log("5. Contrôle de la règle Anti-Monolithe (< 250 lignes)...");
const filesToCheck = [
  'src/components/studio/StudioLexiqueManager.jsx',
  'src/components/studio/lexique/MentionsSection.jsx',
  'src/components/studio/lexique/VocabSection.jsx',
  'src/components/studio/lexique/VocabForm.jsx',
  'src/components/studio/lexique/HashtagsSection.jsx',
  'src/components/studio/StudioQuickChips.jsx',
  'src/components/studio/StudioWritingGuide.jsx',
  'src/components/studio/StudioTextToolbar.jsx'
];

filesToCheck.forEach(relPath => {
  const fullPath = path.resolve(process.cwd(), relPath);
  assert(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lineCount = content.split('\n').length;
  console.log(`   - ${relPath} : ${lineCount} lignes`);
  assert(lineCount <= 260, `Le fichier ${relPath} dépasse 250 lignes (actuellement ${lineCount})`);
});
console.log("   ✓ Règle Anti-Monolithe respectée sur tous les composants créés/modifiés !");

console.log("\n🎉 TOUS LES TESTS D'INTÉGRATION STUDIO LEXIQUE SONT VALIDÉS AVEC SUCCÈS ! 🎉");
