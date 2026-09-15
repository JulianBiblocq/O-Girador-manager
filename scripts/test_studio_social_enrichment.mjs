import assert from 'node:assert';
import { 
  EMOJI_CATEGORIES, 
  DEFAULT_STUDIO_LEXIQUE, 
  DEFAULT_STUDIO_MENTIONS, 
  CULTURAL_EQUIVALENCES 
} from '../src/config/studioSocialConfig.js';
import { insertTextAtCursor } from '../src/utils/unicodeUtils.js';

console.log('🧪 Test: Enrichissement du Studio Social (Émoticônes, Chips et Guide)...');

// 1. Test des 4 catégories d'émoticônes
assert.strictEqual(EMOJI_CATEGORIES.length, 4, 'Il doit y avoir 4 catégories');
const categoryIds = EMOJI_CATEGORIES.map(c => c.id);
assert.deepStrictEqual(categoryIds, ['nature', 'rythme', 'fete', 'pratique']);

const natureEmojis = EMOJI_CATEGORIES.find(c => c.id === 'nature').emojis;
assert.ok(natureEmojis.includes('⚡') && natureEmojis.includes('🌿'), 'Catégorie Nature doit contenir les éléments');

const rythmeEmojis = EMOJI_CATEGORIES.find(c => c.id === 'rythme').emojis;
assert.ok(rythmeEmojis.includes('🥁') && rythmeEmojis.includes('💃'), 'Catégorie Rythme doit contenir les percussions et danse');

const feteEmojis = EMOJI_CATEGORIES.find(c => c.id === 'fete').emojis;
assert.ok(feteEmojis.includes('🎉') && feteEmojis.includes('👑'), 'Catégorie Fête doit contenir les célébrations et cortège');

const pratiqueEmojis = EMOJI_CATEGORIES.find(c => c.id === 'pratique').emojis;
assert.ok(pratiqueEmojis.includes('📅') && pratiqueEmojis.includes('📍'), 'Catégorie Pratique doit contenir date et lieu');
console.log('✅ Sélecteur d émojis catégorisé validé.');

// 2. Test du lexique et des mentions par défaut
assert.ok(DEFAULT_STUDIO_LEXIQUE.includes('batuque'), 'Le lexique doit contenir batuque');
assert.ok(DEFAULT_STUDIO_LEXIQUE.includes('alfaias'), 'Le lexique doit contenir alfaias');
assert.ok(DEFAULT_STUDIO_LEXIQUE.includes('toada'), 'Le lexique doit contenir toada');
assert.ok(DEFAULT_STUDIO_LEXIQUE.includes('cortejo'), 'Le lexique doit contenir cortejo');
assert.ok(DEFAULT_STUDIO_LEXIQUE.includes('puxador'), 'Le lexique doit contenir puxador');

assert.ok(DEFAULT_STUDIO_MENTIONS.includes('@ogirador'), 'Les mentions doivent inclure @ogirador');
console.log('✅ Lexique et mentions par défaut validés.');

// 3. Test de la table des équivalences culturelles du guide
assert.ok(CULTURAL_EQUIVALENCES.length >= 7, 'Le guide doit comporter les équivalences clés');
const batuqueItem = CULTURAL_EQUIVALENCES.find(e => e.recommande === 'Batuque');
assert.ok(batuqueItem && batuqueItem.aEviter === 'Bateria', 'Équivalence Batuque vs Bateria validée');

const maracatuItem = CULTURAL_EQUIVALENCES.find(e => e.recommande.includes('Maracatu'));
assert.ok(maracatuItem && maracatuItem.aEviter === 'Batucada', 'Équivalence Maracatu vs Batucada validée');

const toadaItem = CULTURAL_EQUIVALENCES.find(e => e.recommande === 'Toada');
assert.ok(toadaItem && toadaItem.aEviter.includes('Chanson'), 'Équivalence Toada vs Chanson validée');
console.log('✅ Guide rédactionnel et équivalences culturelles validés.');

// 4. Test d insertion au curseur
const initialText = 'Venez nous voir au concert !';
const cursorStart = 19; // après "au "
const cursorEnd = 19;
const { newText, newCursorPos } = insertTextAtCursor(initialText, cursorStart, cursorEnd, 'cortejo ');
assert.strictEqual(newText, 'Venez nous voir au cortejo concert !');
assert.strictEqual(newCursorPos, 19 + 'cortejo '.length);
console.log('✅ Insertion au curseur validée.');

console.log('🎉 Tous les tests de l enrichissement du Studio Social sont validés avec succès !');
