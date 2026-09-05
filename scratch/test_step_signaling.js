import { getStepSignal, getCompletedStepsCount, getStepProgressRatio } from '../src/utils/workshopProjectionUtils.js';

console.log("=== TESTS DE SIGNALÉTIQUE D'USINAGE ===");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("❌ ÉCHEC :", msg);
    failed++;
  } else {
    console.log("✅ SUCCÈS :", msg);
  }
}

// 1. Matrice pour pièce à 4 étapes, en cours à l'étape 4 (index 3, en_cours)
// C'est le fameux cas du "Bug 4/4 vert"
const s0 = getStepSignal(0, 3, 'en_cours');
assert(s0.status === 'validated' && s0.icon === '✓' && s0.colorClass.includes('emerald'), "Étape 1 (index 0 < 3) est VERTE ✓");

const s1 = getStepSignal(1, 3, 'en_cours');
assert(s1.status === 'validated' && s1.icon === '✓' && s1.colorClass.includes('emerald'), "Étape 2 (index 1 < 3) est VERTE ✓");

const s2 = getStepSignal(2, 3, 'en_cours');
assert(s2.status === 'validated' && s2.icon === '✓' && s2.colorClass.includes('emerald'), "Étape 3 (index 2 < 3) est VERTE ✓");

const s3 = getStepSignal(3, 3, 'en_cours');
assert(s3.status === 'in_progress' && s3.icon === '🛠️' && s3.colorClass.includes('amber-600'), "Étape 4 (index 3 === 3, en_cours) est OCRE 🛠️ et NON VERTE");

// 2. Étape en attente de contrôle
const sWaiting = getStepSignal(3, 3, 'en_attente_controle');
assert(sWaiting.status === 'waiting' && sWaiting.icon === '⏳' && sWaiting.colorClass.includes('animate-pulse'), "Étape en attente de contrôle est AMBRE PULSE ⏳");

// 3. Étape terminée
const sFinished = getStepSignal(3, 3, 'terminee');
assert(sFinished.status === 'validated' && sFinished.icon === '✓' && sFinished.colorClass.includes('emerald'), "Étape quand statutEtape === 'terminee' est VERTE ✓");

// 4. Étape future (à venir)
const sFuture = getStepSignal(2, 1, 'en_cours');
assert(sFuture.status === 'upcoming' && sFuture.icon === '3' && sFuture.colorClass.includes('stone-200'), "Étape future (index 2 > 1) est GRISE NEUTRE");

// 5. Compteurs d'avancement et ratios textuels
assert(getCompletedStepsCount(4, 0, 'en_cours') === 0, "Étape 1 démarrée -> 0 étape terminée");
assert(getStepProgressRatio(4, 0, 'en_cours') === '0 / 4 terminées', "Ratio étape 1 -> '0 / 4 terminées'");

assert(getCompletedStepsCount(4, 1, 'en_cours') === 1, "Étape 2 en cours -> 1 étape terminée");
assert(getStepProgressRatio(4, 1, 'en_cours') === '1 / 4 terminées', "Ratio étape 2 -> '1 / 4 terminées'");

assert(getCompletedStepsCount(4, 3, 'en_cours') === 3, "Étape 4 en cours -> 3 étapes terminées (PAS 4 !)");
assert(getStepProgressRatio(4, 3, 'en_cours') === '3 / 4 terminées', "Ratio étape 4 en cours -> '3 / 4 terminées' (PAS 4/4 !)");

assert(getCompletedStepsCount(4, 3, 'en_attente_controle') === 3, "Étape 4 en attente contrôle -> 3 étapes terminées");
assert(getStepProgressRatio(4, 3, 'en_attente_controle') === '3 / 4 terminées', "Ratio étape 4 en attente -> '3 / 4 terminées'");

assert(getCompletedStepsCount(4, 3, 'terminee') === 4, "Statut 'terminee' -> 4 étapes terminées");
assert(getStepProgressRatio(4, 3, 'terminee') === '4 / 4 terminées', "Statut 'terminee' -> '4 / 4 terminées'");

console.log(`\nBilan : ${failed === 0 ? 'TOUS LES TESTS ONT RÉUSSI' : `${failed} ERREUR(S)`}`);
process.exit(failed);
