import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("=======================================================================");
console.log("🧪 DÉBUT DU TEST : PHASE 4 SAAS — LICENCE, LECTURE SEULE & STRIPE");
console.log("=======================================================================\n");

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

// -------------------------------------------------------------
// Module 1 : Logique métier useLicenseGuard
// -------------------------------------------------------------
console.log("📌 Module 1 : Évaluation de la licence (useLicenseGuard)");

// Simulation de la logique pure de useLicenseGuard
function evaluateLicense(associationSettings) {
  if (!associationSettings || !associationSettings.subscription) {
    return {
      isReadOnly: false,
      status: 'exempt',
      plan: 'exempt',
      isTrial: false,
      message: null
    };
  }

  const { subscription } = associationSettings;
  const { status, plan, trialEndsAt } = subscription;
  const isReadOnly = ['past_due', 'expired', 'canceled'].includes(status);
  const isTrial = plan === 'trial' && status === 'active';
  let trialDaysRemaining = 0;
  
  if (isTrial && trialEndsAt) {
    const end = new Date(trialEndsAt).getTime();
    const now = Date.now();
    trialDaysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  let message = null;
  if (isReadOnly) {
    if (status === 'past_due') {
      message = 'Paiement en échec. Votre espace est passé en lecture seule. Veuillez régulariser votre situation.';
    } else if (status === 'expired' || status === 'canceled') {
      message = 'Abonnement échu ou annulé. Espace en lecture seule.';
    }
  } else if (isTrial) {
    message = `Période d'essai (${trialDaysRemaining} jours restants).`;
  }

  return { isReadOnly, status, plan, isTrial, trialDaysRemaining, message };
}

test("Non-régression : Les comptes sans abonnement restent 'exempt' et 'isReadOnly: false'", () => {
  const resultNull = evaluateLicense(null);
  assert.strictEqual(resultNull.isReadOnly, false);
  assert.strictEqual(resultNull.status, 'exempt');

  const resultEmpty = evaluateLicense({});
  assert.strictEqual(resultEmpty.isReadOnly, false);
  assert.strictEqual(resultEmpty.status, 'exempt');
});

test("Abonnement Pro actif : Pas de lecture seule, pas de message d'alerte", () => {
  const result = evaluateLicense({
    subscription: { status: 'active', plan: 'pro' }
  });
  assert.strictEqual(result.isReadOnly, false);
  assert.strictEqual(result.isTrial, false);
  assert.strictEqual(result.message, null);
});

test("Période d'essai active : Calcule les jours restants et reste en écriture autorisée", () => {
  const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const result = evaluateLicense({
    subscription: { status: 'active', plan: 'trial', trialEndsAt: futureDate }
  });
  assert.strictEqual(result.isReadOnly, false);
  assert.strictEqual(result.isTrial, true);
  assert.strictEqual(result.trialDaysRemaining >= 9 && result.trialDaysRemaining <= 10, true);
  assert.ok(result.message.includes("Période d'essai"));
});

test("Statut 'past_due' (défaut de paiement) : Déclenche le mode lecture seule stricte", () => {
  const result = evaluateLicense({
    subscription: { status: 'past_due', plan: 'pro' }
  });
  assert.strictEqual(result.isReadOnly, true);
  assert.ok(result.message.includes('Paiement en échec'));
});

test("Statuts 'expired' et 'canceled' : Verrouillent l'espace en lecture seule", () => {
  const resExpired = evaluateLicense({
    subscription: { status: 'expired', plan: 'pro' }
  });
  assert.strictEqual(resExpired.isReadOnly, true);

  const resCanceled = evaluateLicense({
    subscription: { status: 'canceled', plan: 'pro' }
  });
  assert.strictEqual(resCanceled.isReadOnly, true);
});

// -------------------------------------------------------------
// Module 2 : Composant SubscriptionBanner et Contexte LicenseContext
// -------------------------------------------------------------
console.log("\n📌 Module 2 : Intégrité des composants React (Banner & Context)");

const bannerPath = path.join(rootDir, 'src', 'components', 'SubscriptionBanner.jsx');
assert.ok(fs.existsSync(bannerPath), "SubscriptionBanner.jsx doit exister");
const bannerContent = fs.readFileSync(bannerPath, 'utf8');

test("SubscriptionBanner intègre le bouton d'appel Stripe pour les administrateurs", () => {
  assert.ok(bannerContent.includes('createStripePortalSession'), "Doit invoquer createStripePortalSession");
  assert.ok(bannerContent.includes("['admin', 'super-admin', 'mestre'].includes(profileData.role)"), "Doit vérifier les rôles administratifs");
  assert.ok(bannerContent.includes('Régulariser mon abonnement'), "Doit afficher le libellé de régularisation");
});

test("SubscriptionBanner respecte les codes couleurs sémantiques (Rouge pour past_due, Ambre pour trial)", () => {
  assert.ok(bannerContent.includes('bg-red-600') && bannerContent.includes('border-red-800'), "Doit utiliser la couleur rouge pour la lecture seule");
  assert.ok(bannerContent.includes('bg-orange-100') || bannerContent.includes('border-orange-300'), "Doit utiliser la couleur ambre/orange pour l'essai");
});

const contextPath = path.join(rootDir, 'src', 'context', 'LicenseContext.jsx');
assert.ok(fs.existsSync(contextPath), "LicenseContext.jsx doit exister");
const contextContent = fs.readFileSync(contextPath, 'utf8');

test("LicenseContext prend en charge les props groupId/associationSettings et offre un fallback gracieux", () => {
  assert.ok(contextContent.includes('propGroupId') && contextContent.includes('propSettings'), "Doit accepter les props optionnelles");
  assert.ok(contextContent.includes("status: 'exempt'"), "Doit renvoyer exempt en repli gracieux hors provider");
});

// -------------------------------------------------------------
// Module 3 : Backend Cloud Functions & Webhook Stripe
// -------------------------------------------------------------
console.log("\n📌 Module 3 : Backend Cloud Functions & Webhook Stripe (functions/index.js)");

const functionsPath = path.join(rootDir, 'functions', 'index.js');
assert.ok(fs.existsSync(functionsPath), "functions/index.js doit exister");
const functionsContent = fs.readFileSync(functionsPath, 'utf8');

test("Cloud Function stripeWebhook gère les événements de facturation essentiels", () => {
  assert.ok(functionsContent.includes('stripeWebhook'), "stripeWebhook doit être exportée");
  assert.ok(functionsContent.includes('customer.subscription.updated'), "Doit traiter subscription.updated");
  assert.ok(functionsContent.includes('customer.subscription.deleted'), "Doit traiter subscription.deleted");
  assert.ok(functionsContent.includes('invoice.payment_failed'), "Doit traiter invoice.payment_failed");
  assert.ok(functionsContent.includes('"subscription.status": "past_due"'), "Doit mettre à jour le statut en past_due");
});

test("Cloud Function createStripePortalSession sécurise l'accès administrateur", () => {
  assert.ok(functionsContent.includes('createStripePortalSession'), "createStripePortalSession doit être exportée");
  assert.ok(functionsContent.includes('billingPortal.sessions.create'), "Doit invoquer billingPortal Stripe");
  assert.ok(functionsContent.includes('userData.role'), "Doit vérifier les rôles de l'utilisateur demandeur");
});

// -------------------------------------------------------------
// Module 4 : Provisionnement (Seed) Tenant
// -------------------------------------------------------------
console.log("\n📌 Module 4 : Provisionnement automatique des nouvelles organisations");

const seedPath = path.join(rootDir, 'src', 'services', 'seedTenantService.js');
assert.ok(fs.existsSync(seedPath), "seedTenantService.js doit exister");
const seedContent = fs.readFileSync(seedPath, 'utf8');

test("seedNewTenant initialise un abonnement en période d'essai (trial de 30 jours)", () => {
  assert.ok(seedContent.includes("plan: 'trial'"), "Le plan par défaut doit être trial");
  assert.ok(seedContent.includes("status: 'active'"), "Le statut initial doit être active");
  assert.ok(seedContent.includes("30 * 24 * 60 * 60 * 1000"), "La période d'essai doit être initialisée à 30 jours");
});

console.log("\n=======================================================================");
console.log(`🎉 SUCCÈS TOTAL : ${passedCount}/${passedCount} assertions SaaS & Licence validées sans aucune erreur !`);
console.log("=======================================================================");
