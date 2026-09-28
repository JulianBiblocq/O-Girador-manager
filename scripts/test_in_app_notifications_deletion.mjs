import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Lancement des tests de validation : SUPPRESSION DES NOTIFICATIONS IN-APP...");

const rootDir = process.cwd();

// 1. Hook useInAppNotifications.js
const hookPath = path.join(rootDir, 'src/hooks/useInAppNotifications.js');
assert(fs.existsSync(hookPath), "useInAppNotifications.js doit exister.");
const hookContent = fs.readFileSync(hookPath, 'utf8');

assert(
  hookContent.includes('deleteDoc'),
  "useInAppNotifications.js doit importer deleteDoc de firebase/firestore."
);
assert(
  hookContent.includes('deleteNotification'),
  "useInAppNotifications.js doit définir et exporter deleteNotification."
);
assert(
  hookContent.includes('clearAllNotifications'),
  "useInAppNotifications.js doit définir et exporter clearAllNotifications."
);
assert(
  hookContent.includes('batch.delete'),
  "clearAllNotifications doit utiliser batch.delete pour la suppression en lot."
);

console.log("✅ 1. useInAppNotifications.js valide (deleteNotification & clearAllNotifications)");

// 2. NotificationItem.jsx
const itemPath = path.join(rootDir, 'src/components/notifications/NotificationItem.jsx');
assert(fs.existsSync(itemPath), "NotificationItem.jsx doit exister.");
const itemContent = fs.readFileSync(itemPath, 'utf8');

assert(
  itemContent.includes('onDelete'),
  "NotificationItem.jsx doit accepter la prop onDelete."
);
assert(
  itemContent.includes('e.stopPropagation()'),
  "NotificationItem.jsx doit appeler e.stopPropagation() sur le bouton de suppression."
);
assert(
  itemContent.includes('onDelete(notification.notifId || notification.id)'),
  "NotificationItem.jsx doit déclencher onDelete avec l'identifiant de la notification."
);

console.log("✅ 2. NotificationItem.jsx valide (bouton suppression discret avec e.stopPropagation)");

// 3. NotificationCenter.jsx
const centerPath = path.join(rootDir, 'src/components/notifications/NotificationCenter.jsx');
assert(fs.existsSync(centerPath), "NotificationCenter.jsx doit exister.");
const centerContent = fs.readFileSync(centerPath, 'utf8');

assert(
  centerContent.includes('deleteNotification') && centerContent.includes('clearAllNotifications'),
  "NotificationCenter.jsx doit extraire deleteNotification et clearAllNotifications du hook."
);
assert(
  centerContent.includes('Tout effacer'),
  "NotificationCenter.jsx doit comporter le bouton Tout effacer."
);
assert(
  centerContent.includes('handleClearAll'),
  "NotificationCenter.jsx doit comporter la fonction handleClearAll."
);
assert(
  centerContent.includes('onDelete={deleteNotification}'),
  "NotificationCenter.jsx doit passer onDelete={deleteNotification} à NotificationItem."
);

console.log("✅ 3. NotificationCenter.jsx valide (bouton global Tout effacer, confirmation et câblage)");
console.log("🎉 TOUS LES TESTS DE SUPPRESSION DES NOTIFICATIONS SONT AU VERT !");
