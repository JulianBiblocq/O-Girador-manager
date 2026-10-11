import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🎨 TEST SUITE : PALETTE PAR DÉFAUT SAMAMBAIA / CORDEL 🎨\n");

// 1. Vérification de DEFAULT_BRANDING et DEFAULT_PUBLIC_THEME dans useAssociationSettings.js
console.log("▶️ Test 1 : Vérification des constantes dans useAssociationSettings.js...");
const settingsFileContent = fs.readFileSync('src/hooks/useAssociationSettings.js', 'utf-8');

assert(settingsFileContent.includes("export const DEFAULT_BRANDING = {"), "DEFAULT_BRANDING doit être exporté.");
assert(settingsFileContent.includes("primary: '#8B2A1A'"), "DEFAULT_BRANDING.primary doit être #8B2A1A.");
assert(settingsFileContent.includes("secondary: '#15803D'"), "DEFAULT_BRANDING.secondary doit être #15803D.");
assert(settingsFileContent.includes("background: '#F4ECD8'"), "DEFAULT_BRANDING.background doit être #F4ECD8.");
assert(settingsFileContent.includes("text: '#181716'"), "DEFAULT_BRANDING.text doit être #181716.");

assert(settingsFileContent.includes("export const DEFAULT_PUBLIC_THEME = {"), "DEFAULT_PUBLIC_THEME doit être exporté.");
assert(settingsFileContent.includes("primaryColor: '#8B2A1A'"), "DEFAULT_PUBLIC_THEME.primaryColor doit être #8B2A1A.");
assert(settingsFileContent.includes("secondaryColor: '#15803D'"), "DEFAULT_PUBLIC_THEME.secondaryColor doit être #15803D.");
assert(settingsFileContent.includes("backgroundColor: '#F4ECD8'"), "DEFAULT_PUBLIC_THEME.backgroundColor doit être #F4ECD8.");
assert(settingsFileContent.includes("textColor: '#181716'"), "DEFAULT_PUBLIC_THEME.textColor doit être #181716.");
assert(settingsFileContent.includes("buttonBgColor: '#8B2A1A'"), "DEFAULT_PUBLIC_THEME.buttonBgColor doit être #8B2A1A.");
console.log("  ✅ [PASS] Constantes de repli configurées avec la palette Samambaia / Cordel.\n");

// 2. Vérification de l'absence totale de #D32F2F et #1976D2 dans le dossier src
console.log("▶️ Test 2 : Éradication totale des couleurs drapeau bleu/rouge vif (#1976D2 / #D32F2F)...");
function scanDirectory(dir, forbiddenColors) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, forbiddenColors);
    } else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const color of forbiddenColors) {
        if (content.toLowerCase().includes(color.toLowerCase())) {
          throw new Error(`Couleur interdite ${color} trouvée dans ${fullPath}`);
        }
      }
    }
  }
}

scanDirectory('src', ['#D32F2F', '#1976D2', '#2b6cb0', '#9b2c2c']);
console.log("  ✅ [PASS] Aucune occurrence de #D32F2F, #1976D2, #2b6cb0 ou #9b2c2c dans src/.\n");

// 3. Vérification des presets dans WizardStepIdentity.jsx
console.log("▶️ Test 3 : Vérification du Wizard Onboarding (Étape 1 Identité)...");
const wizardIdentityContent = fs.readFileSync('src/components/onboarding/wizard/WizardStepIdentity.jsx', 'utf-8');
assert(wizardIdentityContent.includes("Samambaia (Terre cuite & Fougère sacrée)"), "Preset Samambaia présent");
assert(wizardIdentityContent.includes("Cordel Cuivré"), "Preset Cordel Cuivré présent");
assert(!wizardIdentityContent.toLowerCase().includes("océan recifense"), "Le preset bleu Océan Recifense doit avoir été supprimé.");
assert(!wizardIdentityContent.toLowerCase().includes("maracatu ferveur"), "Le preset rouge vif Maracatu Ferveur doit avoir été supprimé.");
console.log("  ✅ [PASS] Presets du Wizard 100% alignés sur la palette Samambaia / Cordel.\n");

// 4. Vérification de src/index.css
console.log("▶️ Test 4 : Vérification des variables CSS dans src/index.css...");
const cssContent = fs.readFileSync('src/index.css', 'utf-8');
assert(cssContent.includes("--theme-secondary: #15803d;"), "--theme-secondary doit pointer sur #15803d");
assert(cssContent.includes("var(--public-bg, #F4ECD8)"), "public-paper-bg doit avoir le fallback #F4ECD8");
assert(cssContent.includes("var(--public-primary, #8B2A1A)"), "public-rich-text li::marker doit avoir le fallback #8B2A1A");
assert(cssContent.includes("var(--public-secondary, #15803D)"), "public-rich-text a doit avoir le fallback #15803D");
console.log("  ✅ [PASS] Variables CSS conformes aux teintes chaleureuses.\n");

console.log("🎉 TOUTES LES VÉRIFICATIONS DE COULEURS SAMAMBAIA / CORDEL ONT RÉUSSI AVEC SUCCÈS ! 🎉");
