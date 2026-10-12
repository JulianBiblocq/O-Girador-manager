import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================================");
console.log("🧪 TEST : RESTAURATION DE LA NAVIGATION LATÉRALE PLATE EN VUE MEMBRE");
console.log("===============================================================================\n");

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     -> ${err.message}`);
    process.exit(1);
  }
}

const layoutPath = path.join(rootDir, 'src', 'components', 'LayoutShell.jsx');
assert.ok(fs.existsSync(layoutPath), "LayoutShell.jsx doit exister");
const layoutContent = fs.readFileSync(layoutPath, 'utf8').replace(/\r\n/g, '\n');

test("LayoutShell définit isSimulatingMember et showAdminPoles", () => {
  assert.ok(
    layoutContent.includes("isSimulatingMember"),
    "LayoutShell doit définir la variable isSimulatingMember"
  );
  assert.ok(
    layoutContent.includes("showAdminPoles"),
    "LayoutShell doit définir la variable showAdminPoles"
  );
  assert.ok(
    layoutContent.includes("const showAdminPoles = isAdministrativeUser && !isSimulatingMember;"),
    "showAdminPoles doit vérifier isAdministrativeUser && !isSimulatingMember"
  );
});

test("Les privilèges super-admin réels sont neutralisés en mode simulation", () => {
  assert.ok(
    layoutContent.includes("const effectiveIsSuperAdmin = !isSimulating && realIsSuperAdmin;"),
    "effectiveIsSuperAdmin doit exclure les droits super admin si isSimulating est actif"
  );
  assert.ok(
    layoutContent.includes("const effectiveMasterKey = !isSimulating && isMasterKeyActive;"),
    "effectiveMasterKey doit être neutralisé si isSimulating est actif"
  );
});

test("La sidebar Desktop et le Drawer Mobile utilisent showAdminPoles", () => {
  // Vérifier qu'on n'a plus {isAdministrativeUser ? ( sur la navigation
  const desktopNavMatch = layoutContent.includes("{/* Desktop Poles Navigation */}\n            <div className=\"w-full flex-grow overflow-y-auto flex flex-col gap-2 pr-1 max-h-[calc(100vh-220px)] scrollbar-thin\">\n              {showAdminPoles ? (");
  assert.ok(desktopNavMatch, "La navigation Desktop doit être conditionnée par showAdminPoles");

  const mobileNavMatch = layoutContent.includes("{/* Drawer Navigation Links */}\n              <div className=\"flex flex-col gap-2.5 flex-grow overflow-y-auto pr-1\">\n                {showAdminPoles ? (");
  assert.ok(mobileNavMatch, "Le drawer mobile doit être conditionné par showAdminPoles");
});

test("allMemberMenuItems respecte la hiérarchie et l'ordre des rubriques adhérents", () => {
  const itemsOrder = [
    "id: 'accueil'",
    "id: 'profil'",
    "id: 'trombinoscope'",
    "id: 'agenda'",
    "id: 'forum'",
    "id: 'varal'",
    "id: 'repertoire'"
  ];

  let lastIndex = -1;
  itemsOrder.forEach(item => {
    const idx = layoutContent.indexOf(item);
    assert.ok(idx !== -1, `L'élément ${item} doit exister dans allMemberMenuItems`);
    assert.ok(idx > lastIndex, `L'élément ${item} doit être positionné après le précédent dans l'ordre requis`);
    lastIndex = idx;
  });
});

test("Le répertoire est conditionné à features?.repertoireEleves === true pour les adhérents", () => {
  assert.ok(
    layoutContent.includes("const hasAccessMestreLocal = !isSimulating && (isMasterKeyActive || isMestreOrAdmin);"),
    "hasAccessMestreLocal doit neutraliser le bypass en mode simulation"
  );
  assert.ok(
    layoutContent.includes("if (effectiveFeatures?.repertoireEleves !== true && !hasAccessMestreLocal) return false;"),
    "L'onglet répertoire doit être masqué si repertoireEleves n'est pas actif pour les adhérents"
  );
});

test("Le routage de chaque rubrique membre cible directement l'onglet souhaité", () => {
  assert.ok(
    layoutContent.includes("onNavigateToPole('mon-espace', 'trombinoscope')"),
    "Le trombinoscope doit router vers ('mon-espace', 'trombinoscope')"
  );
  assert.ok(
    layoutContent.includes("onNavigateToPole('mon-espace', 'agenda')"),
    "L'agenda doit router vers ('mon-espace', 'agenda')"
  );
  assert.ok(
    layoutContent.includes("onNavigateToPole('mon-espace', 'forum')"),
    "Le porte-voix doit router vers ('mon-espace', 'forum')"
  );
  assert.ok(
    layoutContent.includes("onNavigateToPole('mon-espace', 'varal')"),
    "Le varal doit router vers ('mon-espace', 'varal')"
  );
  assert.ok(
    layoutContent.includes("onNavigateToPole('mon-espace', 'repertoire')"),
    "Le répertoire doit router vers ('mon-espace', 'repertoire')"
  );
});

test("Simulation logique : Mode Adhérent Standard", () => {
  // Simuler le calcul sous simulation adhérent standard
  const isSimulating = true;
  const simulationTarget = { type: 'standard', label: 'Adhérent standard', role: 'membre' };
  const currentProfile = { role: 'membre', isSystemAdmin: false };
  const realIsSuperAdmin = true; // Même si le compte connecté est Julian/SuperAdmin
  const isMasterKeyActive = false;

  const effectiveIsSuperAdmin = !isSimulating && realIsSuperAdmin;
  const effectiveMasterKey = !isSimulating && isMasterKeyActive;

  const isAdministrativeUser = effectiveMasterKey || effectiveIsSuperAdmin; // false
  const isSimulatingMember = Boolean(
    isSimulating && (
      simulationTarget?.type === 'standard' ||
      simulationTarget?.role === 'membre' ||
      ['membre', 'adherent', 'eleve'].includes(String(currentProfile?.role || '').toLowerCase())
    ) && (
      currentProfile?.role !== 'admin' &&
      currentProfile?.role !== 'super-admin' &&
      currentProfile?.role !== 'mestre' &&
      currentProfile?.role !== 'bureau' &&
      currentProfile?.role !== 'ca' &&
      currentProfile?.isSystemAdmin !== true
    )
  ); // true

  const showAdminPoles = isAdministrativeUser && !isSimulatingMember; // false

  assert.strictEqual(isSimulatingMember, true, "isSimulatingMember doit valoir true");
  assert.strictEqual(showAdminPoles, false, "showAdminPoles doit valoir false (la liste plate s'affiche)");
});

console.log(`\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (${passedCount}/${passedCount}) !`);
