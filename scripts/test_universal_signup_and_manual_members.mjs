import fs from 'fs';
import path from 'path';

console.log("=== TEST SUITE: Inscription universelle tout navigateur et création manuelle de membres ===");

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

// 1. Test useGroupContext
const groupContextPath = path.resolve('src/hooks/useGroupContext.js');
assert(fs.existsSync(groupContextPath), 'useGroupContext.js exists');
const groupContextContent = fs.readFileSync(groupContextPath, 'utf-8');
assert(groupContextContent.includes('export function getStoredGroupId'), 'getStoredGroupId function exported');
assert(groupContextContent.includes('export function setStoredGroupId'), 'setStoredGroupId function exported');
assert(groupContextContent.includes('export function resolveResilientGroupId'), 'resolveResilientGroupId function exported');
assert(groupContextContent.includes('needsGroupSelection'), 'manages needsGroupSelection state');
assert(groupContextContent.includes('setManualGroupId'), 'provides setManualGroupId callback');

// 2. Test GroupSelectorStep
const groupSelectorPath = path.resolve('src/components/auth/GroupSelectorStep.jsx');
assert(fs.existsSync(groupSelectorPath), 'GroupSelectorStep.jsx exists');
const groupSelectorContent = fs.readFileSync(groupSelectorPath, 'utf-8');
assert(groupSelectorContent.includes('Quel groupe ou association rejoins-tu ?'), 'GroupSelectorStep displays welcoming invitation question');
assert(groupSelectorContent.includes('onSelectGroup'), 'GroupSelectorStep handles group selection');

// 3. Test RegisterForm
const registerFormPath = path.resolve('src/components/auth/RegisterForm.jsx');
assert(fs.existsSync(registerFormPath), 'RegisterForm.jsx exists');
const registerFormContent = fs.readFileSync(registerFormPath, 'utf-8');
assert(registerFormContent.includes('confirmPassword'), 'RegisterForm manages confirmPassword');
assert(registerFormContent.includes('password !== confirmPassword') || registerFormContent.includes('isMismatch'), 'RegisterForm validates password matching');
assert(registerFormContent.includes('createUserWithEmailAndPassword'), 'RegisterForm uses createUserWithEmailAndPassword');

// 4. Test memberService
const memberServicePath = path.resolve('src/services/memberService.js');
assert(fs.existsSync(memberServicePath), 'memberService.js exists');
const memberServiceContent = fs.readFileSync(memberServicePath, 'utf-8');
assert(memberServiceContent.includes('export async function createManualMember'), 'createManualMember function exported');
assert(memberServiceContent.includes('isNew: false') && memberServiceContent.includes("status: 'active'"), 'createManualMember creates active member directly without pending status');
assert(memberServiceContent.includes('export async function reconcilePreExistingMember'), 'reconcilePreExistingMember function exported');
assert(memberServiceContent.includes('deleteDoc(preExistingDoc.ref)'), 'reconcilePreExistingMember deletes temporary manual doc to prevent duplicates');

// 5. Test ManualMemberModal
const manualModalPath = path.resolve('src/components/directory/ManualMemberModal.jsx');
assert(fs.existsSync(manualModalPath), 'ManualMemberModal.jsx exists');
const manualModalContent = fs.readFileSync(manualModalPath, 'utf-8');
assert(manualModalContent.includes('prenom') && manualModalContent.includes('nom'), 'ManualMemberModal includes prenom and nom');
assert(manualModalContent.includes('pratiquePercussion') && manualModalContent.includes('pratiqueDanse'), 'ManualMemberModal includes practice checkboxes');
assert(manualModalContent.includes('cotisationAjour'), 'ManualMemberModal includes cotisation status toggle');
assert(manualModalContent.includes('createManualMember'), 'ManualMemberModal calls createManualMember');

// 6. Test AdminExport & MemberDirectory
const adminExportPath = path.resolve('src/components/AdminExport.jsx');
assert(fs.existsSync(adminExportPath), 'AdminExport.jsx exists');
const adminExportContent = fs.readFileSync(adminExportPath, 'utf-8');
assert(adminExportContent.includes('ManualMemberModal'), 'AdminExport imports and renders ManualMemberModal');
assert(adminExportContent.includes('Inscrire un membre') || adminExportContent.includes('canCreateMember'), 'AdminExport displays manual register button for bureau');

const memberDirectoryPath = path.resolve('src/components/directory/MemberDirectory.jsx');
assert(fs.existsSync(memberDirectoryPath), 'MemberDirectory.jsx exists');

// 7. Test Login.jsx integration
const loginPath = path.resolve('src/components/Login.jsx');
assert(fs.existsSync(loginPath), 'Login.jsx exists');
const loginContent = fs.readFileSync(loginPath, 'utf-8');
assert(loginContent.includes('useGroupContext'), 'Login.jsx uses useGroupContext');
assert(loginContent.includes('GroupSelectorStep'), 'Login.jsx renders GroupSelectorStep');
assert(loginContent.includes('RegisterForm'), 'Login.jsx renders RegisterForm');

// 8. Test App.jsx auto-reconciliation
const appPath = path.resolve('src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
assert(appContent.includes('reconcilePreExistingMember'), 'App.jsx calls reconcilePreExistingMember');

// 9. Test Onboarding.jsx resilience and auto-reconciliation
const onboardingPath = path.resolve('src/components/Onboarding.jsx');
const onboardingContent = fs.readFileSync(onboardingPath, 'utf-8');
assert(onboardingContent.includes('resolveResilientGroupId'), 'Onboarding.jsx uses resolveResilientGroupId');
assert(onboardingContent.includes('reconcilePreExistingMember'), 'Onboarding.jsx verifies auto-reconciliation');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
