/**
 * Test unitaire automatisé pour le Centre de Notifications Internes et Navigation Directe.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("=== Lancement des tests du Centre de Notifications Internes ===");

// 1. Vérification des règles de sécurité Firestore
console.log("\n[Test 1] Vérification de firestore.rules...");
const firestoreRulesCandidates = [
  path.join(rootDir, 'ogirador-backend', 'firestore.rules.DEPRECATED'),
  path.join(rootDir, 'ogirador-backend', 'firestore.rules'),
  path.join(rootDir, '..', 'o-girador-orquestrador', 'firestore.rules')
];
const firestoreRulesPath = firestoreRulesCandidates.find(p => fs.existsSync(p)) || firestoreRulesCandidates[0];
assert(fs.existsSync(firestoreRulesPath), "Le fichier firestore.rules doit exister");
const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');

assert(
  rulesContent.includes('match /in_app_notifications/{notifId}'),
  "firestore.rules doit contenir la sous-collection in_app_notifications"
);
assert(
  rulesContent.includes('allow read, update: if request.auth != null && request.auth.uid == userId;'),
  "La règle de lecture et mise à jour pour le propriétaire doit être présente"
);
assert(
  rulesContent.includes('allow create: if request.auth != null;'),
  "La règle de création authentifiée doit être présente"
);
console.log("✓ Règles Firestore validées avec succès.");

// 2. Vérification du service inAppNotificationService.js
console.log("\n[Test 2] Vérification de inAppNotificationService.js...");
const servicePath = path.join(rootDir, 'src', 'utils', 'inAppNotificationService.js');
assert(fs.existsSync(servicePath), "inAppNotificationService.js doit exister");
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(serviceContent.includes('NOTIFICATION_TYPES'), "NOTIFICATION_TYPES doit être défini");
assert(serviceContent.includes('createInAppNotification'), "createInAppNotification doit être exporté");
assert(serviceContent.includes('dispatchInAppAndPushNotification'), "dispatchInAppAndPushNotification doit être exporté");
assert(serviceContent.includes('users'), "La collection racine users doit être ciblée");
assert(serviceContent.includes('in_app_notifications'), "La sous-collection in_app_notifications doit être ciblée");
console.log("✓ inAppNotificationService.js validé avec succès.");

// 3. Vérification du hook useInAppNotifications.js
console.log("\n[Test 3] Vérification de useInAppNotifications.js...");
const hookPath = path.join(rootDir, 'src', 'hooks', 'useInAppNotifications.js');
assert(fs.existsSync(hookPath), "useInAppNotifications.js doit exister");
const hookContent = fs.readFileSync(hookPath, 'utf8');

assert(hookContent.includes('limit(50)'), "La requête doit être bornée à 50 documents");
assert(hookContent.includes('writeBatch'), "markAllAsRead doit utiliser writeBatch");
assert(hookContent.includes('return () => unsubscribe()'), "Le hook doit retourner la fonction de désabonnement onSnapshot");
assert(hookContent.includes('unreadCount'), "Le hook doit exposer un unreadCount");
assert(hookContent.includes('markAsRead'), "Le hook doit exposer markAsRead");
assert(hookContent.includes('markAllAsRead'), "Le hook doit exposer markAllAsRead");
console.log("✓ useInAppNotifications.js validé avec succès.");

// 4. Vérification du composant NotificationCenter.jsx
console.log("\n[Test 4] Vérification de NotificationCenter.jsx...");
const notifCenterPath = path.join(rootDir, 'src', 'components', 'notifications', 'NotificationCenter.jsx');
assert(fs.existsSync(notifCenterPath), "NotificationCenter.jsx doit exister");
const notifCenterContent = fs.readFileSync(notifCenterPath, 'utf8');

assert(notifCenterContent.includes('useInAppNotifications'), "NotificationCenter doit utiliser useInAppNotifications");
assert(notifCenterContent.includes('NotificationItem'), "NotificationCenter doit utiliser le sous-composant NotificationItem");
assert(notifCenterContent.includes('unreadCount'), "NotificationCenter doit afficher le compteur d'alertes non lues");
assert(notifCenterContent.includes('markAllAsRead'), "NotificationCenter doit proposer l'action Tout marquer comme lu");
console.log("✓ NotificationCenter.jsx validé avec succès.");

// 5. Vérification du sous-composant NotificationItem.jsx
console.log("\n[Test 5] Vérification de NotificationItem.jsx...");
const itemPath = path.join(rootDir, 'src', 'components', 'notifications', 'NotificationItem.jsx');
assert(fs.existsSync(itemPath), "NotificationItem.jsx doit exister");
const itemContent = fs.readFileSync(itemPath, 'utf8');

assert(itemContent.includes('formatRelativeDate'), "NotificationItem doit formater la date relative");
assert(itemContent.includes('getNotificationIcon'), "NotificationItem doit attribuer des icônes selon la catégorie");
assert(itemContent.includes('isUnread'), "NotificationItem doit gérer le contraste non lu vs lu");
console.log("✓ NotificationItem.jsx validé avec succès.");

// 6. Vérification du Deep Linking dans App.jsx et LayoutShell.jsx
console.log("\n[Test 6] Vérification du routage Deep Linking...");
const appPath = path.join(rootDir, 'src', 'App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes('handleNotificationNavigate'), "App.jsx doit déclarer handleNotificationNavigate");
assert(appContent.includes('onNotificationNavigate={handleNotificationNavigate}'), "App.jsx doit transmettre onNotificationNavigate à LayoutShell");
assert(appContent.includes('member-expense-section'), "App.jsx doit faire défiler vers member-expense-section");
assert(appContent.includes('threadId'), "App.jsx doit gérer threadId");
assert(appContent.includes('eventId'), "App.jsx doit gérer eventId");
assert(appContent.includes('frais-km'), "App.jsx doit gérer l'onglet frais-km de trésorerie");

const shellPath = path.join(rootDir, 'src', 'components', 'LayoutShell.jsx');
const shellContent = fs.readFileSync(shellPath, 'utf8');

assert(shellContent.includes('NotificationCenter'), "LayoutShell doit importer et intégrer NotificationCenter");
assert(shellContent.includes('onNotificationNavigate'), "LayoutShell doit recevoir onNotificationNavigate");
console.log("✓ Deep Linking et LayoutShell validés avec succès.");

console.log("\n🎉 TOUS LES TESTS UNITAIRES DU CENTRE DE NOTIFICATIONS SONT PASSÉS SANS ERREUR ! 🎉");
