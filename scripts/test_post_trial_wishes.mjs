import fs from 'fs';
import path from 'path';

console.log("=== TEST SUITE: Vœux d'instruments post-essai pour adhérents en attente ===");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Test PostTrialWishesCard
const postTrialWishesCardPath = path.resolve('src/components/auth/PostTrialWishesCard.jsx');
assert(fs.existsSync(postTrialWishesCardPath), 'PostTrialWishesCard.jsx exists');
const postTrialContent = fs.readFileSync(postTrialWishesCardPath, 'utf-8');
assert(postTrialContent.includes('Tu as réalisé tes séances d\'essai ? Renseigne tes souhaits d\'instruments'), 'PostTrialWishesCard contains official invitation message');
assert(postTrialContent.includes('voeuxInstruments') && postTrialContent.includes('voeuPrincipal'), 'PostTrialWishesCard updates voeuxInstruments and voeuPrincipal');
assert(postTrialContent.includes('wish1') && postTrialContent.includes('wish2') && postTrialContent.includes('wish3'), 'PostTrialWishesCard manages 3 distinct wishes');

// 2. Test PendingValidationScreen integration
const pendingScreenPath = path.resolve('src/components/auth/PendingValidationScreen.jsx');
assert(fs.existsSync(pendingScreenPath), 'PendingValidationScreen.jsx exists');
const pendingScreenContent = fs.readFileSync(pendingScreenPath, 'utf-8');
assert(pendingScreenContent.includes('PostTrialWishesCard'), 'PendingValidationScreen imports and renders PostTrialWishesCard');

// 3. Test MusicalOrientationForm unlocking
const musicalFormPath = path.resolve('src/components/profile/MusicalOrientationForm.jsx');
assert(fs.existsSync(musicalFormPath), 'MusicalOrientationForm.jsx exists');
const musicalFormContent = fs.readFileSync(musicalFormPath, 'utf-8');
assert(musicalFormContent.includes('Mes Souhaits d\'Instruments (Orientation & Casting)'), 'MusicalOrientationForm includes 3 wishes section');
assert(musicalFormContent.includes('voeuPrincipal') && musicalFormContent.includes('voeuSecondaire') && musicalFormContent.includes('voeuTertiaire'), 'MusicalOrientationForm binds all 3 wishes');
assert(!musicalFormContent.includes('if (!hasAssignedInstrument) return null;'), 'MusicalOrientationForm is not blocked for members without assigned instruments');

// 4. Test SystemUserList discrete badges
const systemUserListPath = path.resolve('src/components/admin/SystemUserList.jsx');
assert(fs.existsSync(systemUserListPath), 'SystemUserList.jsx exists');
const systemUserListContent = fs.readFileSync(systemUserListPath, 'utf-8');
assert(systemUserListContent.includes('Vœu ${idx + 1} : ${wish}') || systemUserListContent.includes('Vœu '), 'SystemUserList displays discrete badges for each wish');

// 5. Test SystemAdminPanel automatic pre-fill on validation
const systemAdminPanelPath = path.resolve('src/components/SystemAdminPanel.jsx');
assert(fs.existsSync(systemAdminPanelPath), 'SystemAdminPanel.jsx exists');
const systemAdminPanelContent = fs.readFileSync(systemAdminPanelPath, 'utf-8');
assert(systemAdminPanelContent.includes('wish1') && systemAdminPanelContent.includes('updateData.instrument = wish1'), 'SystemAdminPanel pre-fills instrument with Wish 1 upon validation');
assert(systemAdminPanelContent.includes('updateData.isNew = false') || systemAdminPanelContent.includes('isNew: false'), 'SystemAdminPanel marks isNew as false');

// 6. Test MestreOrientationCasting Post-essai badge and quick validate
const mestreCastingPath = path.resolve('src/components/mestre/MestreOrientationCasting.jsx');
assert(fs.existsSync(mestreCastingPath), 'MestreOrientationCasting.jsx exists');
const mestreCastingContent = fs.readFileSync(mestreCastingPath, 'utf-8');
assert(mestreCastingContent.includes('🆕 Post-essai'), 'MestreOrientationCasting renders 🆕 Post-essai badge for isNew members');
assert(mestreCastingContent.includes('updatePayload.isNew = false'), 'MestreOrientationCasting handleQuickValidate clears isNew status');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
