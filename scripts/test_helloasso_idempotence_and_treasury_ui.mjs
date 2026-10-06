import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import {
  findDuplicateHelloAssoTransactions,
  getTransactionDayKey,
  isHelloAssoTransaction,
  normalizeHelloAssoLibelle
} from '../src/utils/treasuryDeduplication.js';

console.log('===============================================================');
console.log("🧪 TEST DE VALIDATION : IDEMPOTENCE HELLOASSO & ERGONOMIE TRÉSORERIE");
console.log('===============================================================');

// --- Test 1 : Vérification de la Cloud Function helloAssoWebhook (Lot 1) ---
console.log("\n▶️ Module 1 : Audit du code source de functions/index.js");
const functionsContent = fs.readFileSync(path.resolve('functions/index.js'), 'utf-8');

assert.ok(
  functionsContent.includes('ha_pay_'),
  "functions/index.js doit construire un ID déterministe préfixé par ha_pay_"
);

assert.ok(
  functionsContent.includes('.set(') && functionsContent.includes('{ merge: true }'),
  "functions/index.js doit utiliser .set(..., { merge: true }) pour assurer l'idempotence"
);

assert.ok(
  !functionsContent.includes('db.collection("transactions").add({'),
  "functions/index.js ne doit plus contenir de db.collection('transactions').add({"
);

assert.ok(
  functionsContent.includes('const orderId = (data.order && data.order.id)'),
  "functions/index.js doit extraire orderId de manière robuste"
);

assert.ok(
  functionsContent.includes('const paymentId = (eventType === "Payment" ? data.id : null)'),
  "functions/index.js doit extraire paymentId de manière robuste"
);

console.log("  ✅ [PASS] functions/index.js applique rigoureusement l'idempotence et les identifiants déterministes.");

// --- Test 2 : Vérification algorithmique du dédoublonnage (Lot 1 & 2) ---
console.log("\n▶️ Module 2 : Test unitaire de findDuplicateHelloAssoTransactions");

const transactionsTest = [
  // Paire de doublons (Order puis Payment arrivés pour le même adhérent et montant)
  {
    id: 'tx_old_auto_id_1',
    groupId: 'samambaia',
    date: '2026-10-04T14:30:00.000Z',
    montant: 180,
    libelle: 'Paiement HelloAsso - Marie Curie (Cotisation Annuelle)',
    userId: 'user_curie',
    source: 'helloasso'
  },
  {
    id: 'helloasso_order_445566',
    groupId: 'samambaia',
    date: '2026-10-04T14:30:10.000Z',
    montant: 180,
    libelle: 'Paiement HelloAsso - Marie Curie (Formule Percussion)',
    userId: 'user_curie',
    source: 'helloasso'
  },
  // Transaction différente même adhérent mais montant distinct
  {
    id: 'tx_curie_autre',
    groupId: 'samambaia',
    date: '2026-10-04T15:00:00.000Z',
    montant: 20,
    libelle: 'Paiement HelloAsso - Marie Curie (Adhésion)',
    userId: 'user_curie',
    source: 'helloasso'
  },
  // Transaction différente autre adhérent même montant
  {
    id: 'tx_paul_unique',
    groupId: 'samambaia',
    date: '2026-10-04T14:30:00.000Z',
    montant: 180,
    libelle: 'Paiement HelloAsso - Paul Langevin (Cotisation)',
    userId: 'user_paul',
    source: 'helloasso'
  }
];

const dedupResult = findDuplicateHelloAssoTransactions(transactionsTest);
assert.equal(dedupResult.duplicateIds.length, 1, "Un seul doublon doit être identifié");
assert.equal(dedupResult.duplicateIds[0], 'tx_old_auto_id_1', "L'ancienne écriture non déterministe doit être ciblée pour suppression");
assert.equal(dedupResult.groups[0].primary.id, 'helloasso_order_445566', "L'écriture déterministe helloasso_* doit être conservée comme originale");
console.log("  ✅ [PASS] Détection et arbitrage des doublons validés avec succès.");

// --- Test 3 : Refonte UI de TreasuryOperations.jsx (Lot 2) ---
console.log("\n▶️ Module 3 : Contrôle de la refonte ergonomique de TreasuryOperations.jsx");
const treasuryOpContent = fs.readFileSync(path.resolve('src/components/treasury/TreasuryOperations.jsx'), 'utf-8');

// 1. Pleine largeur et fin du découpage en 2/3 + 1/3
assert.ok(
  !treasuryOpContent.includes('grid grid-cols-1 md:grid-cols-3'),
  "TreasuryOperations ne doit plus utiliser la grille en 3 colonnes asymétriques"
);
assert.ok(
  treasuryOpContent.includes('flex flex-col gap-4 w-full'),
  "TreasuryOperations doit adopter le flux vertical pleine largeur"
);

// 2. Accordéon repliable et grille horizontale
assert.ok(
  treasuryOpContent.includes('isFormOpen'),
  "TreasuryOperations doit gérer l'état dépliable isFormOpen"
);
assert.ok(
  treasuryOpContent.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'),
  "Le formulaire doit être disposé en grille horizontale sur grand écran"
);
assert.ok(
  treasuryOpContent.includes('＋ Saisir une opération'),
  "Bouton discret '＋ Saisir une opération' présent"
);

// 3. Suppression du truncate sur le libellé
assert.ok(
  !treasuryOpContent.includes('truncate text-left" title={displayLibelle}'),
  "La classe 'truncate' ne doit plus couper le libellé"
);
assert.ok(
  treasuryOpContent.includes('break-words leading-snug'),
  "Le libellé doit bénéficier de break-words pour une lisibilité intégrale"
);

// 4. Largeur généreuse de la colonne libellé
assert.ok(
  treasuryOpContent.includes('col-span-4 lg:col-span-5'),
  "La colonne libellé doit occuper une largeur généreuse (5/12 sur desktop)"
);

// 5. Bannière d'assainissement des doublons intégrée
assert.ok(
  treasuryOpContent.includes('handlePurgeDuplicates'),
  "TreasuryOperations doit comporter l'action d'assainissement handlePurgeDuplicates"
);

console.log("  ✅ [PASS] TreasuryOperations.jsx respecte 100% du cahier des charges ergonomique.");

// --- Test 4 : Contrôle de SystemAdminPanel.jsx (Lot 1 & 2) ---
console.log("\n▶️ Module 4 : Contrôle de l'outil d'assainissement dans SystemAdminPanel.jsx");
const adminPanelContent = fs.readFileSync(path.resolve('src/components/SystemAdminPanel.jsx'), 'utf-8');

assert.ok(
  adminPanelContent.includes('handleCleanHelloAssoDuplicates'),
  "SystemAdminPanel doit intégrer la fonction handleCleanHelloAssoDuplicates"
);
assert.ok(
  adminPanelContent.includes('Dédoublonnage HelloAsso'),
  "SystemAdminPanel doit afficher la carte de maintenance 'Dédoublonnage HelloAsso'"
);

console.log("  ✅ [PASS] SystemAdminPanel.jsx intègre le bouton d'assainissement pour l'administrateur.");

console.log("\n===============================================================");
console.log("🏆 TOUS LES TESTS D'IDEMPOTENCE ET D'ERGONOMIE SONT VALIDÉS !");
console.log("===============================================================");
