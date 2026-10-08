import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Script de test unitaire validant l'ergonomie mobile du Porte-Voix :
 * 1. Présence du bouton retour mobile-first ⬅️ Salons (sans masque hidden sur mobile)
 * 2. Bascule directe sur la liste des salons (setMobileView('channels')) sans rechargement
 * 3. Conteneur CSS étanche anti-double scroll (100dvh, overflow-hidden, overscroll-contain)
 * 4. Verrouillage du scroll global de document.body / html
 * 5. Seule zone défilante autorisée (ThreadMessageList avec overflow-y-auto)
 * 6. Barre de saisie ancrée en bas avec safe-area (ThreadReplyBar shrink-0)
 */

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ÉCHEC : ${message}`);
    failures++;
  } else {
    console.log(`✅ SUCCÈS : ${message}`);
  }
}

console.log('--- Test Ergonomie Mobile du Porte-Voix (ThreadView & Forum) ---');

// 1. Analyse de ThreadView.jsx
const threadViewPath = resolve('src/components/ThreadView.jsx');
const threadViewContent = readFileSync(threadViewPath, 'utf-8');

assert(
  threadViewContent.includes('h-[100dvh]') &&
  threadViewContent.includes('max-h-[100dvh]') &&
  threadViewContent.includes('overflow-hidden') &&
  threadViewContent.includes('overscroll-contain'),
  'ThreadView : Le conteneur parent applique une structure stricte 100dvh sans débordement (overflow-hidden overscroll-contain)'
);

assert(
  threadViewContent.includes("document.body.style.overflow = 'hidden'") &&
  threadViewContent.includes("document.documentElement.style.overflow = 'hidden'"),
  'ThreadView : Le défilement global de document.body et document.documentElement est verrouillé pour bloquer tout double scroll'
);

assert(
  threadViewContent.includes("useHardwareBack"),
  'ThreadView : Le retour matériel mobile (Android / swipe / gesture) est intercepté pour fermer la discussion de façon fluide'
);

assert(
  threadViewContent.includes("forum.channelsHeader") || threadViewContent.includes("Salons"),
  'ThreadView : L\'en-tête comporte le libellé explicite vers les Salons'
);

assert(
  !threadViewContent.includes('<span className="hidden sm:inline">{t(\'common.back\')}</span>'),
  'ThreadView : Le libellé du bouton retour n\'est plus masqué sur mobile (suppression de hidden sm:inline)'
);

assert(
  threadViewContent.includes('shrink-0 z-20'),
  'ThreadView : L\'en-tête de la discussion est fixé avec shrink-0 (ne s\'écrase jamais)'
);

// 2. Analyse de Forum.jsx
const forumPath = resolve('src/components/Forum.jsx');
const forumContent = readFileSync(forumPath, 'utf-8');

assert(
  forumContent.includes("setMobileView('channels')"),
  'Forum : handleCloseThread bascule directement sur la liste des salons principaux (mobileView -> channels)'
);

assert(
  forumContent.includes("searchParams.has('threadId')") || forumContent.includes("searchParams.delete('threadId')"),
  'Forum : Le paramètre threadId est nettoyé de façon idempotente sans rechargement de page'
);

assert(
  forumContent.includes("handleUrlPopState") || forumContent.includes("addEventListener('popstate'"),
  'Forum : L\'événement popstate synchronise l\'état pour fermer le sujet lors d\'un retour arrière'
);

// 3. Analyse de ThreadMessageList.jsx
const threadMessageListPath = resolve('src/components/forum/thread/ThreadMessageList.jsx');
const threadMessageListContent = readFileSync(threadMessageListPath, 'utf-8');

assert(
  threadMessageListContent.includes('flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2'),
  'ThreadMessageList : Seule la zone des messages est autorisée à défiler (flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2)'
);

// 4. Analyse de ThreadReplyBar.jsx
const threadReplyBarPath = resolve('src/components/forum/thread/ThreadReplyBar.jsx');
const threadReplyBarContent = readFileSync(threadReplyBarPath, 'utf-8');

assert(
  threadReplyBarContent.includes('shrink-0 border-t') &&
  threadReplyBarContent.includes('pb-[max(env(safe-area-inset-bottom),0.75rem)]'),
  'ThreadReplyBar : La barre de saisie est ancrée en bas avec shrink-0 border-t pb-[max(env(safe-area-inset-bottom),0.75rem)]'
);

if (failures > 0) {
  console.error(`\n❌ ${failures} test(s) en échec.`);
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES TESTS D\'ERGONOMIE MOBILE SONT VALIDÉS AVEC SUCCÈS !');
  process.exit(0);
}
