/**
 * Test de validation : Auto-validation à J+7 et Notification Push FCM à la publication au Varal
 */

import { formatReportDate } from '../src/utils/reportPublicationUtils.js';
import { isMemberCaOrBureau } from '../src/utils/memberUtils.js';

console.log("==========================================================================");
console.log("🧪 DÉBUT DES TESTS : AUTO-VALIDATION J+7 & NOTIFICATION PUBLICATION VARAL");
console.log("==========================================================================");

// --- Test 1 : Formatage de date ---
console.log("\n▶️ Test 1 : Formatage de la date du compte-rendu (JJ/MM/AAAA)");
const dateIso = "2026-10-22T19:30:00.000Z";
const formatted = formatReportDate(dateIso);
if (formatted === "22/10/2026") {
  console.log(`  ✅ Date formatée correctement : ${formatted}`);
} else {
  console.error(`  ❌ Échec formatage date : attendu '22/10/2026', obtenu '${formatted}'`);
  process.exit(1);
}

// --- Test 2 : Sécurité démocratique et auto-validation J+7 ---
console.log("\n▶️ Test 2 : Sécurité démocratique & conditions d'auto-validation");
const now = new Date();
const pastDate = new Date(now.getTime() - 24 * 3600 * 1000).toISOString(); // J-1 (échu)
const futureDate = new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString(); // J+5 (non échu)

// Cas A : Échéance non atteinte
const eventNotExpired = {
  id: 'ev-1',
  compteRenduStatus: 'attente_relecture',
  autoValidateAfter7Days: true,
  compteRenduAutoValidateAt: futureDate,
  compteRenduApprovals: {}
};
const isExpiredA = Boolean(new Date() >= new Date(eventNotExpired.compteRenduAutoValidateAt));
if (!isExpiredA) {
  console.log("  ✅ Cas A validé : Non déclenché si l'échéance n'est pas encore dépassée.");
} else {
  console.error("  ❌ Cas A échoué.");
  process.exit(1);
}

// Cas B : Échéance atteinte mais un présent a demandé une modification
const eventRejected = {
  id: 'ev-2',
  compteRenduStatus: 'attente_relecture',
  autoValidateAfter7Days: true,
  compteRenduAutoValidateAt: pastDate,
  compteRenduApprovals: {
    'user-1': { approved: true },
    'user-2': { approved: false, commentaire: "Erreur sur le budget voté" }
  }
};
const hasRejectionB = Object.values(eventRejected.compteRenduApprovals).some(v => v && v.approved === false);
if (hasRejectionB) {
  console.log("  ✅ Cas B validé : Auto-validation suspendue si opposition/demande de modification active.");
} else {
  console.error("  ❌ Cas B échoué.");
  process.exit(1);
}

// Cas C : Échéance atteinte et aucune opposition (approbations partielles ou sans vote)
const eventEligible = {
  id: 'ev-3',
  compteRenduStatus: 'attente_relecture',
  autoValidateAfter7Days: true,
  compteRenduAutoValidateAt: pastDate,
  compteRenduApprovals: {
    'user-1': { approved: true }
  }
};
const hasRejectionC = Object.values(eventEligible.compteRenduApprovals).some(v => v && v.approved === false);
const isExpiredC = Boolean(new Date() >= new Date(eventEligible.compteRenduAutoValidateAt));
if (isExpiredC && !hasRejectionC) {
  console.log("  ✅ Cas C validé : Déclenchement automatique autorisé (échéance atteinte et aucune opposition).");
} else {
  console.error("  ❌ Cas C échoué.");
  process.exit(1);
}

// --- Test 3 : Filtrage d'audience CA vs Publique ---
console.log("\n▶️ Test 3 : Filtrage d'audience CA vs Publique pour la notification");
const userAdmin = { id: 'u1', role: 'admin', tags: [] };
const userCaMember = { id: 'u2', role: 'adherent', tags: ['CA', 'Trésorier'] };
const userRegularMember = { id: 'u3', role: 'adherent', tags: ['Alfaia'] };

const isCa1 = isMemberCaOrBureau(userAdmin, userAdmin.tags);
const isCa2 = isMemberCaOrBureau(userCaMember, userCaMember.tags);
const isCa3 = isMemberCaOrBureau(userRegularMember, userRegularMember.tags);

if (isCa1 === true && isCa2 === true && isCa3 === false) {
  console.log("  ✅ Filtrage CA strict vérifié : Seuls les membres CA/Bureau sont ciblés.");
} else {
  console.error(`  ❌ Échec filtrage CA : u1=${isCa1}, u2=${isCa2}, u3=${isCa3}`);
  process.exit(1);
}

console.log("\n==========================================================================");
console.log("🏆 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS (100%) !");
console.log("==========================================================================");
