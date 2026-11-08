import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeUserDocPayload } from '../src/utils/firestoreUtils.js';

// Vérification unitaire de l'assainisseur anti-écrasement fcmTokens
const samplePayload = {
  prenom: 'Camille',
  nom: 'Silva',
  fcmTokens: [],
  pushOptInContract: true
};
const cleaned = sanitizeUserDocPayload(samplePayload);
assert.equal(cleaned.fcmTokens, undefined, 'sanitizeUserDocPayload doit supprimer tout tableau brut fcmTokens');
assert.equal(cleaned.pushOptInContract, true, 'sanitizeUserDocPayload doit conserver pushOptInContract');

// Vérification statique de la taille des modules créés / refondus (<= 140 lignes)
const checkedFiles = [
  'src/utils/pushDiagnosticsUtils.js',
  'src/utils/pushNotificationHelper.js',
  'src/hooks/useAutoSyncPushToken.js',
  'src/hooks/useProfilePushActions.js',
  'src/components/dashboard/PushGuidedBlockerSteps.jsx',
  'src/components/dashboard/PushActivationModal.jsx',
  'src/components/dashboard/NotificationBanner.jsx',
  'src/components/profile/NotificationDiagnostic.jsx',
  'src/components/secretariat/reports/UsageStatsBanner.jsx',
  'src/components/admin/AdminDirectoryMemberRow.jsx',
  'src/utils/usageStatsUtils.js',
  'src/utils/firestoreUtils.js'
];

for (const rel of checkedFiles) {
  const fullPath = path.resolve(process.cwd(), rel);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/).length;
  assert.ok(lines <= 140, `${rel} dépasse 140 lignes (${lines} lignes)`);
}

// Vérification du contenu fonctionnel clé dans pushDiagnosticsUtils.js
const diagSource = fs.readFileSync(path.resolve(process.cwd(), 'src/utils/pushDiagnosticsUtils.js'), 'utf8');
for (const code of [
  'IOS_NOT_INSTALLED',
  'IN_APP_BROWSER',
  'PERMISSION_DENIED',
  'TOKEN_SYNC_ERROR',
  'NEVER_ANSWERED',
  'pushOptInContract'
]) {
  assert.ok(diagSource.includes(code), `pushDiagnosticsUtils.js doit gérer ${code}`);
}

console.log('✅ Tous les contrôles du Contrat Push Permanent & Télé-diagnostic Admin sont validés.');

