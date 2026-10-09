import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST UNITAIRE : STABILITÉ MODALE COMMISSIONS & ANTI-FERMETURE');
console.log('===============================================================\n');

// 1. Audit anti-monolithe (< 200 lignes sur tous les composants cibles)
console.log('▶️ Module 1 : Vérification stricte de la règle anti-monolithe (< 200 lignes)');

const targetFiles = [
  'src/components/event-details/commissions/CommissionJalonItem.jsx',
  'src/components/event-details/commissions/CommissionJalonsSection.jsx',
  'src/components/event-details/commissions/CommissionBasicInfoFields.jsx',
  'src/components/event-details/commissions/CommissionBudgetSection.jsx',
  'src/components/event-details/commissions/CommissionBenevolesSection.jsx',
  'src/components/event-details/commissions/CommissionMaterielSection.jsx',
  'src/components/event-details/commissions/CommissionEditModal.jsx',
  'src/components/event-details/commissions/EventCommissionsHub.jsx',
  'src/hooks/useEventCommissions.js',
  'src/hooks/useModalEscape.js',
  'src/components/event-details/EventQuickActionsBar.jsx',
  'src/components/Tooltip.jsx',
  'src/components/agenda/AgendaAddMenu.jsx',
  'src/components/forum/MentionAutocomplete.jsx',
  'src/components/forum/EmojiPickerPopover.jsx'
];

for (const relPath of targetFiles) {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister.`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  console.log(`  - ${relPath}: ${lineCount} lignes`);
  assert.ok(
    lineCount < 200,
    `Le fichier ${relPath} dépasse la limite stricte de 200 lignes (${lineCount} lignes)`
  );
}
console.log('  ✅ [PASS] Règle anti-monolithe respectée sur tous les fichiers.\n');

// 2. Vérification de l'absence de formulaires imbriqués (<form>) dans les sous-sections
console.log('▶️ Module 2 : Élimination des balises <form> imbriquées');

const subSectionFiles = [
  'src/components/event-details/commissions/CommissionJalonItem.jsx',
  'src/components/event-details/commissions/CommissionJalonsSection.jsx',
  'src/components/event-details/commissions/CommissionBudgetSection.jsx',
  'src/components/event-details/commissions/CommissionBenevolesSection.jsx',
  'src/components/event-details/commissions/CommissionMaterielSection.jsx'
];

for (const relPath of subSectionFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  assert.ok(
    !content.includes('<form'),
    `Le sous-composant ${relPath} ne doit pas contenir de balise <form> (source de submit parasite)`
  );
}
console.log('  ✅ [PASS] Aucune balise <form> imbriquée détectée.\n');

// 3. Vérification des boutons type="button", gestion de la touche Entrée et Échap locale
console.log('▶️ Module 3 : Interception touche Entrée/Échap et boutons type="button"');

// 3.1 CommissionJalonItem
const jalonItemCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionJalonItem.jsx'), 'utf8');
assert.ok(jalonItemCode.includes('handleEditKeyDown'), 'handleEditKeyDown présent pour intercepter le clavier');
assert.ok(jalonItemCode.includes('e.key === \'Enter\''), 'Détection de la touche Entrée');
assert.ok(jalonItemCode.includes('e.key === \'Escape\''), 'Détection de la touche Échap locale');
assert.ok(jalonItemCode.includes('e.stopPropagation()'), 'e.stopPropagation() présent');
assert.ok(jalonItemCode.includes('e.preventDefault()'), 'e.preventDefault() présent');

// 3.2 CommissionJalonsSection
const jalonsSectionCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionJalonsSection.jsx'), 'utf8');
assert.ok(jalonsSectionCode.includes('handleJalonKeyDown'), 'handleJalonKeyDown présent');
assert.ok(jalonsSectionCode.includes('e.target.tagName !== \'TEXTAREA\''), 'Protection pour autoriser les retours chariot dans le textarea');

// 3.3 CommissionBudgetSection
const budgetCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionBudgetSection.jsx'), 'utf8');
assert.ok(budgetCode.includes('handleAddDevis'), 'handleAddDevis présent');
assert.ok(!budgetCode.includes('type="submit"'), 'Aucun type="submit" dans CommissionBudgetSection');

// 3.4 CommissionBenevolesSection
const benevolesCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionBenevolesSection.jsx'), 'utf8');
assert.ok(benevolesCode.includes('handleAddCreneau'), 'handleAddCreneau présent');
assert.ok(!benevolesCode.includes('type="submit"'), 'Aucun type="submit" dans CommissionBenevolesSection');

// 3.5 CommissionMaterielSection
const materielCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionMaterielSection.jsx'), 'utf8');
assert.ok(materielCode.includes('handleAddBesoin'), 'handleAddBesoin présent');
assert.ok(!materielCode.includes('type="submit"'), 'Aucun type="submit" dans CommissionMaterielSection');

console.log('  ✅ [PASS] Tous les boutons ont type="button" et les inputs interceptent la touche Entrée/Échap.\n');

// 4. Étanchement du Backdrop, backdropMouseDownRef et stopPropagation
console.log('▶️ Module 4 : Étanchement du fond grisé (Backdrop) et backdropMouseDownRef');

const editModalCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/CommissionEditModal.jsx'), 'utf8');
assert.ok(
  editModalCode.includes('backdropMouseDownRef'),
  'CommissionEditModal doit posséder backdropMouseDownRef pour filtrer les mousedown du backdrop'
);
assert.ok(
  editModalCode.includes('isConnected'),
  'CommissionEditModal doit vérifier e.target.isConnected'
);
assert.ok(
  editModalCode.includes('onClick={(e) => e.stopPropagation()}'),
  'CommissionEditModal doit comporter onClick={(e) => e.stopPropagation()} sur la boîte de dialogue interne'
);

const hubCode = fs.readFileSync(path.join(rootDir, 'src/components/event-details/commissions/EventCommissionsHub.jsx'), 'utf8');
assert.ok(
  hubCode.includes('backdropMouseDownRef'),
  'EventCommissionsHub doit posséder backdropMouseDownRef'
);
assert.ok(
  hubCode.includes('isConnected'),
  'EventCommissionsHub doit vérifier e.target.isConnected'
);
assert.ok(
  hubCode.includes('onClick={(e) => e.stopPropagation()}'),
  'EventCommissionsHub doit comporter onClick={(e) => e.stopPropagation()} sur la boîte interne'
);

console.log('  ✅ [PASS] Backdrops étanches avec vérification mousedown + isConnected.\n');

// 5. Traceurs console.trace sur tous les chemins de fermeture
console.log('▶️ Module 5 : Présence des traceurs console.trace');

const eventDetailsCode = fs.readFileSync(path.join(rootDir, 'src/components/EventDetails.jsx'), 'utf8');
assert.ok(
  eventDetailsCode.includes('console.trace') && eventDetailsCode.includes('showCommissionsHub'),
  'EventDetails.jsx doit comporter console.trace sur la fermeture de showCommissionsHub'
);

assert.ok(
  hubCode.includes('console.trace') && hubCode.includes('handleCloseModal'),
  'EventCommissionsHub.jsx doit comporter console.trace sur handleCloseModal'
);

assert.ok(
  editModalCode.includes('console.trace') && editModalCode.includes('CommissionEditModal'),
  'CommissionEditModal.jsx doit comporter console.trace'
);

const modalEscapeCode = fs.readFileSync(path.join(rootDir, 'src/hooks/useModalEscape.js'), 'utf8');
assert.ok(
  modalEscapeCode.includes('console.trace'),
  'useModalEscape.js doit comporter console.trace lors de l\'appui sur Échap'
);

console.log('  ✅ [PASS] Traceurs de fermeture console.trace opérationnels.\n');

// 6. Sécurisation des listeners de clic extérieur (Click-Away)
console.log('▶️ Module 6 : Sécurisation isConnected sur les listeners document Click-Away');

const clickAwayFiles = [
  'src/components/event-details/EventQuickActionsBar.jsx',
  'src/components/Tooltip.jsx',
  'src/components/notifications/NotificationCenter.jsx',
  'src/components/navigation/EcosystemAppLauncher.jsx',
  'src/components/navigation/ViewSimulatorSelector.jsx',
  'src/components/mestre/RepertoirePieceStatusSelector.jsx',
  'src/components/agenda/AgendaAddMenu.jsx',
  'src/components/forum/MentionAutocomplete.jsx',
  'src/components/forum/EmojiPickerPopover.jsx',
  'src/components/MemberTreasuryRow.jsx',
  'src/components/PrivateChatView.jsx',
  'src/components/forum/thread/ThreadReplyBar.jsx'
];

for (const relPath of clickAwayFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  assert.ok(
    content.includes('isConnected'),
    `Le composant ${relPath} doit vérifier isConnected avant d'exécuter son click outside`
  );
}
console.log('  ✅ [PASS] Tous les écouteurs de clic extérieur vérifient isConnected.\n');

console.log('===============================================================');
console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
console.log('===============================================================');
