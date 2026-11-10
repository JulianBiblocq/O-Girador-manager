import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  CUSTOM_EXTERNAL_LINK_VALUE,
  MEGAPHONE_INTERNAL_DESTINATIONS,
  isExternalActionLink,
  extractDeepLinkTarget,
  resolveInternalDestination,
  triggerMegaphoneCtaNavigation
} from '../src/utils/megaphoneNavigationUtils.js';

console.log('===============================================================');
console.log('📣🔔 TEST : MÉGAPHONE + CLOCHE INTERNE (NOTIFICATION CENTER)');
console.log('===============================================================\n');

// 1. Contrôle de la règle anti-monolithe (< 200 lignes)
console.log('▶️ Test 1 : Règle anti-monolithe (< 200 lignes)');
const filesToCheck = [
  'src/utils/megaphoneNavigationUtils.js',
  'src/hooks/useNotificationPanelPosition.js',
  'src/components/annonces/AnnonceCtaFields.jsx',
  'src/components/annonces/AnnonceCardItem.jsx',
  'src/components/annonces/AnnonceForm.jsx',
  'src/components/notifications/NotificationItem.jsx'
];
for (const relPath of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), relPath);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
  assert.ok(lines < 200, `${relPath} dépasse 200 lignes (${lines} lignes)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
}

// 2. Table de correspondance robuste des destinations internes
console.log('\n▶️ Test 2 : Table de correspondance robuste (Membre standard vs Admin)');
const expectedMemberMappings = [
  { input: '/profil', poleId: 'mon-espace', tabId: 'profil' },
  { input: '/profile', poleId: 'mon-espace', tabId: 'profil' },
  { input: '/agenda', poleId: 'mon-espace', tabId: 'agenda' },
  { input: '/forum', poleId: 'mon-espace', tabId: 'forum' },
  { input: '/porte-voix', poleId: 'mon-espace', tabId: 'forum' },
  { input: '/varal', poleId: 'mon-espace', tabId: 'varal' },
  { input: '/documents', poleId: 'mon-espace', tabId: 'varal' },
  { input: '/trombinoscope', poleId: 'mon-espace', tabId: 'trombinoscope' },
  { input: '/mon-parcours', poleId: 'mon-espace', tabId: 'mon-parcours' },
  { input: '/materiel', poleId: 'mon-espace', tabId: 'materiel' },
  { input: '/vestiaire', poleId: 'mon-espace', tabId: 'vestiaire' },
  { input: '/mon-vestiaire', poleId: 'mon-espace', tabId: 'vestiaire' },
  { input: '/treasury', poleId: 'mon-espace', tabId: 'cotisation' },
  { input: '/tresorerie', poleId: 'mon-espace', tabId: 'cotisation' }
];

for (const tc of expectedMemberMappings) {
  const res = resolveInternalDestination(tc.input, { hasAccessTresorerie: false });
  assert.ok(res, `Destination non résolue pour ${tc.input}`);
  assert.equal(res.poleId, tc.poleId, `Pôle incorrect pour ${tc.input}`);
  assert.equal(res.tabId, tc.tabId, `Onglet incorrect pour ${tc.input}`);
}
console.log('  ✅ [PASS] Toutes les destinations internes du Mégaphone sont validées.');

// 3. Cibles issues des notifications par badges et discussions (Cloche NotificationCenter)
console.log('\n▶️ Test 3 : Cibles des notifications par badges et discussions (Cloche)');

// 3a. /profil?tab=frais -> Pôle "mon-espace", onglet "profil" + scroll vers les notes de frais
const profilFrais = resolveInternalDestination('/profil?tab=frais', { hasAccessTresorerie: false });
assert.equal(profilFrais.poleId, 'mon-espace');
assert.equal(profilFrais.tabId, 'profil');
assert.equal(profilFrais.scrollToId, 'member-expense-section');

// 3b. /events/:id, /events/:id?focus=comments, /agenda?eventId=...
const evDirect = resolveInternalDestination('/events/evt_123', { hasAccessTresorerie: false });
assert.equal(evDirect.poleId, 'mon-espace');
assert.equal(evDirect.tabId, 'agenda');
assert.equal(evDirect.eventId, 'evt_123');

const evComments = resolveInternalDestination('/events/evt_123?focus=comments', { hasAccessTresorerie: false });
assert.equal(evComments.poleId, 'mon-espace');
assert.equal(evComments.tabId, 'agenda');
assert.equal(evComments.eventId, 'evt_123');
assert.equal(evComments.eventTab, 'discussion');
assert.equal(evComments.focusComments, true);

const evAgenda = resolveInternalDestination('/agenda?eventId=evt_456&tab=discussion', { hasAccessTresorerie: false });
assert.equal(evAgenda.poleId, 'mon-espace');
assert.equal(evAgenda.tabId, 'agenda');
assert.equal(evAgenda.eventId, 'evt_456');
assert.equal(evAgenda.eventTab, 'discussion');
assert.equal(evAgenda.focusComments, true);

// 3c. /forum?threadId=... ou /forum?tab=groups&conversationId=...
const forumThread = resolveInternalDestination('/forum?threadId=th_789', { hasAccessTresorerie: false });
assert.equal(forumThread.poleId, 'mon-espace');
assert.equal(forumThread.tabId, 'forum');
assert.equal(forumThread.threadId, 'th_789');
assert.equal(forumThread.forumInitialTab, 'discussions');

const forumGroup = resolveInternalDestination('/forum?tab=groups&conversationId=conv_99', { hasAccessTresorerie: false });
assert.equal(forumGroup.poleId, 'mon-espace');
assert.equal(forumGroup.tabId, 'forum');
assert.equal(forumGroup.forumInitialTab, 'groups');
assert.equal(forumGroup.conversationId, 'conv_99');

// 3d. /treasury?tab=frais-km | cotisations | commandes -> Pôle "tresorerie" sur le bon sous-onglet
for (const subTab of ['frais-km', 'cotisations', 'commandes']) {
  const trSub = resolveInternalDestination(`/treasury?tab=${subTab}`, { hasAccessTresorerie: true });
  assert.equal(trSub.poleId, 'tresorerie');
  assert.equal(trSub.tabId, subTab);
}

// 3e. /mestre?tab=casting ou /app?pole=mestre&tab=mestre-orientation -> Pôle "mestre", onglet "mestre-orientation"
for (const mUrl of ['/mestre?tab=casting', '/app?pole=mestre&tab=mestre-orientation']) {
  const mRes = resolveInternalDestination(mUrl, { hasAccessTresorerie: true });
  assert.equal(mRes.poleId, 'mestre');
  assert.equal(mRes.tabId, 'mestre-orientation');
}

// 3f. /logistics?tab=inventaire -> Pôle "logistique"
const logRes = resolveInternalDestination('/logistics?tab=inventaire', { hasAccessTresorerie: true });
assert.equal(logRes.poleId, 'logistique');
assert.equal(logRes.tabId, 'inventory');

// 3g. /diffusion?tab=pipeline -> Pôle "diffusion"
const diffRes = resolveInternalDestination('/diffusion?tab=pipeline', { hasAccessTresorerie: true });
assert.equal(diffRes.poleId, 'diffusion');
assert.equal(diffRes.tabId, 'gigs-pipeline');

console.log('  ✅ [PASS] Les 7 familles de cibles (profil?tab=frais, events/:id?focus=comments, forum, treasury, mestre, logistics, diffusion) sont validées.');

// 4. Clic CTA : stopPropagation, liens externes et navigation interne sans rechargement
console.log('\n▶️ Test 4 : Clic sur le bouton CTA (stopPropagation, externe & interne)');
let propagationStopped = false;
let navigatedTarget = null;
const mockEvent = {
  stopPropagation: () => {
    propagationStopped = true;
  }
};

const handledInternal = triggerMegaphoneCtaNavigation(
  '/materiel',
  {
    onNotificationNavigate: (url) => {
      navigatedTarget = resolveInternalDestination(url, { hasAccessTresorerie: false });
    }
  },
  mockEvent
);
assert.equal(handledInternal, true);
assert.equal(propagationStopped, true);
assert.equal(navigatedTarget.poleId, 'mon-espace');
assert.equal(navigatedTarget.tabId, 'materiel');
assert.equal(isExternalActionLink('https://www.helloasso.com/associations/samambaia'), true);
assert.equal(extractDeepLinkTarget('/app?target=/profil').pathname, '/profil');
console.log('  ✅ [PASS] stopPropagation(), ouverture externe (http/https) et bascule interne instantanée validés.');

// 5. Contrôle du raccordement NotificationCenter.jsx, useInAppNotifications.js, WidgetAnnonces.jsx et App.jsx
console.log('\n▶️ Test 5 : Raccordement NotificationCenter, useInAppNotifications, WidgetAnnonces & App');
const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.jsx'), 'utf8');
const notifCenterSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/notifications/NotificationCenter.jsx'), 'utf8');
const useInAppSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/hooks/useInAppNotifications.js'), 'utf8');
const widgetSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/WidgetAnnonces.jsx'), 'utf8');

assert.ok(notifCenterSrc.includes('const target = notif.targetUrl || notif.link'), 'NotificationCenter.jsx doit récupérer notif.targetUrl || notif.link');
assert.ok(useInAppSrc.includes('...data,\n            docId: docSnap.id') || useInAppSrc.includes('...data,\r\n            docId: docSnap.id'), 'useInAppNotifications.js doit placer docId: docSnap.id après ...data');
assert.ok(useInAppSrc.includes('updateDoc(docRef, { isRead: true, read: true })'), 'markAsRead doit mettre à jour isRead: true et read: true');
assert.ok(widgetSrc.includes('payload.actionLink && payload.actionLink.trim() ? payload.actionLink.trim() : \'/app\''), 'WidgetAnnonces.jsx doit enregistrer actionLink dans targetUrl');
assert.ok(appSrc.includes('const resolved = resolveInternalDestination(targetUrl, { hasAccessTresorerie })'), 'handleNotificationNavigate doit utiliser resolveInternalDestination');
assert.equal(MEGAPHONE_INTERNAL_DESTINATIONS.length, 9);
assert.equal(CUSTOM_EXTERNAL_LINK_VALUE, '__custom_external__');

console.log('  ✅ [PASS] Raccordement complet entre NotificationCenter.jsx, useInAppNotifications.js, WidgetAnnonces.jsx et handleNotificationNavigate validé.');

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : CLOCHE INTERNE & MÉGAPHONE RACCORDÉS !');
console.log('===============================================================\n');
