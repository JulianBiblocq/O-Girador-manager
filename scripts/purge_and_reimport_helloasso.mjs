/**
 * Script de Purge totale des transactions HelloAsso & Ré-importation déterministe (Trésorerie)
 *
 * Règles absolues :
 * 1. Purge chirurgicale :
 *    - Parcourt la collection 'transactions'
 *    - PRÉSERVE STRICTEMENT toutes les dépenses (frais bancaires, achats matériel, salaires Guso, etc.)
 *      et toutes les écritures manuelles (source === 'manuel')
 *    - SUPPRIME DÉFINITIVEMENT tous les documents dont le libellé commence par 'Paiement HelloAsso'
 *      ou source === 'helloasso' ou dont l'id commence par 'helloasso_' / 'ha_pay_' / 'ha_'
 * 2. Ré-importation propre et déterministe (Idempotence) :
 *    - ID Firestore : ha_pay_${payment.id} (JAMAIS de .add())
 *    - Gestion 3x : Uniquement les paiements réellement encaissés (Authorized / Processed).
 *      AUCUNE ligne créée pour l'Order global afin de bannir tout cumul artificiel.
 * 3. Normalisation stricte :
 *    - Libellé : Paiement HelloAsso - [Prénom Capitalisé] [NOM MAJUSCULE] ([Options])
 *    - Montant exact en centimes converti en euros (amount / 100).
 *
 * Usage :
 * node scripts/purge_and_reimport_helloasso.mjs [--dry-run]
 */

import {
  formatCapitalizedFirstName,
  formatUppercaseLastName,
  formatNormalizedPayerName,
  formatHelloAssoSyntheticLabel,
  detectHelloAssoOptions,
  detectInstallmentPayment
} from '../src/services/helloAssoService.js';

console.log("===============================================================================");
console.log("🧹 PURGE TOTALE HELLOASSO & RÉ-IMPORTATION DÉTERMINISTE (TRÉSORERIE)");
console.log("===============================================================================\n");

// 1. Simulation d'un journal des opérations réel corrompu
const sampleTransactions = [
  // Écritures saines et dépenses à PRÉSERVER ABSOLUMENT
  { id: 'tx_depense_1', groupId: 'samambaia', type: 'depense', categorie: 'Frais bancaires', montant: 12.50, libelle: 'Cotisation tenue de compte Crédit Agricole', source: 'manuel' },
  { id: 'tx_depense_2', groupId: 'samambaia', type: 'depense', categorie: 'Matériel', montant: 450.00, libelle: 'Achat peaux d\'Alfaia et cordes de tension', source: 'manuel' },
  { id: 'tx_depense_3', groupId: 'samambaia', type: 'depense', categorie: 'Salaires', montant: 620.00, libelle: 'Règlement GUSO intervenant maître de stage', source: 'manuel' },
  { id: 'tx_depense_4', groupId: 'samambaia', type: 'depense', categorie: 'Remboursement frais', montant: 75.30, libelle: 'Remboursement essence déplacement festival', source: 'manuel' },
  { id: 'tx_recette_manuelle', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145.00, libelle: 'Adhésion espèces remise en main propre', source: 'manuel' },

  // Écritures HelloAsso corrompues avec variations de casse, accents et doublons Order/Payment 3x
  { id: 'tx_legacy_101', groupId: 'samambaia', type: 'recette', categorie: 'Cotisation', montant: 145.00, libelle: 'Paiement HelloAsso - Jean-pierre (Adhésion + Percussions)', source: 'helloasso' },
  { id: 'tx_legacy_102', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145.00, libelle: 'Paiement HelloAsso - Jean pierre LE DEVEHAT (Adhésion + Percussions)', source: 'helloasso' },
  { id: 'tx_legacy_103', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145.00, libelle: 'Paiement HelloAsso - Isabelle Touchefeu (Percussions)', source: 'helloasso' },
  { id: 'tx_legacy_104', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145.00, libelle: 'Paiement HelloAsso - Isabelle Touchefeu (Adhésion + Percussions + Danse)', source: 'helloasso' },

  // Doublons 3x : Commande globale 100 € + mensualité 40 € !
  { id: 'helloasso_order_3x_global', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 100.00, libelle: 'Paiement HelloAsso - Pierre DUPONT (Commande globale 3x)', source: 'helloasso', helloAssoOrderId: 'order_dupont_3x' },
  { id: 'ha_pay_installment_1', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 40.00, libelle: 'Paiement HelloAsso - Pierre Dupont (Échéance 1/3)', source: 'helloasso', helloAssoPaymentId: 'pay_dupont_ech1' }
];

console.log(`▶️ État initial du journal : ${sampleTransactions.length} écritures.`);

// ÉTAPE 1 : Purge chirurgicale
console.log("\n▶️ Exécution de la purge chirurgicale...");
const preservedTransactions = [];
const deletedTransactionIds = [];

for (const tx of sampleTransactions) {
  const libelle = tx.libelle || '';
  const source = (tx.source || '').toLowerCase();
  const type = (tx.type || '').toLowerCase();
  const docId = tx.id;

  const isManualOrExpense = source === 'manuel' || type === 'depense';
  const isExplicitHelloAsso = source === 'helloasso' || /^paiement\s+helloasso/i.test(libelle);

  if (isManualOrExpense && !isExplicitHelloAsso) {
    preservedTransactions.push(tx);
    continue; // PRÉSERVÉ ABSOLUMENT
  }

  const isHelloAsso =
    /^paiement\s+helloasso/i.test(libelle) ||
    source === 'helloasso' ||
    docId.startsWith('helloasso_') ||
    docId.startsWith('ha_pay_') ||
    docId.startsWith('ha_') ||
    Boolean(tx.helloAssoOrderId) ||
    Boolean(tx.helloAssoPaymentId);

  if (isHelloAsso) {
    deletedTransactionIds.push(docId);
  } else {
    preservedTransactions.push(tx);
  }
}

console.log(`  ✅ Écritures préservées (dépenses + saisies manuelles) : ${preservedTransactions.length}`);
console.log(`  ❌ Écritures HelloAsso corrompues supprimées : ${deletedTransactionIds.length} (${deletedTransactionIds.join(', ')})`);

// ÉTAPE 2 : Ré-importation déterministe depuis les véritables paiements réels de la campagne
console.log("\n▶️ Ré-importation déterministe sous ha_pay_${payment.id}...");

const campaignRawLogs = [
  // Jean-Pierre LE DEVEHAT : Paiement comptant 145 € (14500 centimes)
  {
    id: 'log_ha_01',
    data: {
      id: 'pay_jdevehat_99',
      eventType: 'Payment',
      state: 'Authorized',
      amount: 14500, // en centimes
      date: '2026-09-10T14:30:00Z',
      payer: { firstName: 'Jean pierre', lastName: 'LE DEVEHAT', email: 'jp.devehat@example.org' },
      items: [
        { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
        { name: 'Cotisation annuelle PERCUSSIONS', amount: 13500, type: 'subscription' }
      ]
    }
  },
  // Isabelle Touchefeu : Paiement comptant 145 € (14500 centimes)
  {
    id: 'log_ha_02',
    data: {
      id: 'pay_itouchefeu_77',
      eventType: 'Payment',
      state: 'Authorized',
      amount: 14500,
      date: '2026-09-11T10:15:00Z',
      payer: { firstName: 'isabelle', lastName: 'Touchefeu', email: 'isabelle.touchefeu@example.org' },
      items: [
        { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
        { name: 'Cotisation annuelle PERCUSSIONS', amount: 13500, type: 'subscription' }
      ]
    }
  },
  // Pierre Dupont : Paiement en 3x (100 € total = 40 € + 30 € + 30 €)
  // SEULS les paiements encaissés (Authorized) sont importés, JAMAIS la commande globale !
  {
    id: 'log_ha_03',
    data: {
      id: 'order_pdupont_3x_global',
      eventType: 'Order',
      amount: 10000, // 100 €
      payer: { firstName: 'Pierre', lastName: 'Dupont', email: 'pierre.dupont@example.org' },
      items: [
        { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
        { name: 'Cotisation annuelle DANSE 3x', amount: 9000, type: 'subscription' }
      ],
      payments: [
        { id: 'pay_pdupont_ech1', state: 'Authorized', amount: 4000, date: '2026-09-12T09:00:00Z' },
        { id: 'pay_pdupont_ech2', state: 'Waiting', amount: 3000, date: '2026-10-12T09:00:00Z' },
        { id: 'pay_pdupont_ech3', state: 'Waiting', amount: 3000, date: '2026-11-12T09:00:00Z' }
      ]
    }
  },
  // Marie de Fontaine : 100 € (10000 centimes)
  {
    id: 'log_ha_04',
    data: {
      id: 'pay_mfontaine_01',
      eventType: 'Payment',
      state: 'Authorized',
      amount: 10000,
      date: '2026-09-13T16:20:00Z',
      payer: { firstName: 'Marie', lastName: 'de Fontaine', email: 'marie.fontaine@example.org' },
      items: [
        { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
        { name: 'Cotisation annuelle DANSE', amount: 9000, type: 'subscription' }
      ]
    }
  }
];

const deterministicTransactions = new Map();

for (const log of campaignRawLogs) {
  const data = log.data || log;
  const items = data.items || [];
  const optionsAnalysis = detectHelloAssoOptions(items, data);

  const childPayments = (Array.isArray(data.payments) && data.payments.length > 0) ? data.payments : null;

  if (childPayments) {
    // 3x : Boucler sur les paiements encaissés sans créer de ligne pour la commande globale
    for (const p of childPayments) {
      const pState = (p.state || '').toLowerCase();
      if (pState !== 'authorized' && pState !== 'processed') {
        continue; // Ignorer les échéances futures en attente
      }

      const pId = String(p.id).trim();
      const pTxDocId = `ha_pay_${pId}`;
      const amountEuros = p.amount / 100;

      const pPayer = p.payer || data.payer || {};
      const payerNameNormalized = formatNormalizedPayerName({
        firstName: pPayer.firstName,
        lastName: pPayer.lastName
      });

      const label = formatHelloAssoSyntheticLabel(payerNameNormalized, {
        adhesionBase: optionsAnalysis.adhesionBase,
        hasPercussion: optionsAnalysis.pratiquePercussion,
        hasDanse: optionsAnalysis.pratiqueDanse
      });

      deterministicTransactions.set(pTxDocId, {
        id: pTxDocId,
        groupId: 'samambaia',
        type: 'recette',
        categorie: 'Cotisations',
        montant: amountEuros,
        libelle: label,
        source: 'helloasso'
      });
    }
  } else {
    // Paiement direct
    const pState = (data.state || '').toLowerCase();
    if (pState && pState !== 'authorized' && pState !== 'processed') continue;

    const pId = String(data.id).trim();
    const pTxDocId = `ha_pay_${pId}`;
    const amountEuros = data.amount / 100;

    const payer = data.payer || {};
    const payerNameNormalized = formatNormalizedPayerName({
      firstName: payer.firstName,
      lastName: payer.lastName
    });

    const label = formatHelloAssoSyntheticLabel(payerNameNormalized, {
      adhesionBase: optionsAnalysis.adhesionBase,
      hasPercussion: optionsAnalysis.pratiquePercussion,
      hasDanse: optionsAnalysis.pratiqueDanse
    });

    deterministicTransactions.set(pTxDocId, {
      id: pTxDocId,
      groupId: 'samambaia',
      type: 'recette',
      categorie: 'Cotisations',
      montant: amountEuros,
      libelle: label,
      source: 'helloasso'
    });
  }
}

console.log(`\n▶️ Nouvelles écritures déterministes reconstruites : ${deterministicTransactions.size}`);
for (const [id, tx] of deterministicTransactions.entries()) {
  console.log(`  [${id}] ${tx.libelle} -> ${tx.montant} €`);
}

const finalRebuiltJournal = [...preservedTransactions, ...Array.from(deterministicTransactions.values())];
console.log(`\n===============================================================================`);
console.log(`🏆 RÉSULTAT FINAL : Le livre de caisse compte exactement ${finalRebuiltJournal.length} écritures.`);
console.log(`   - Dépenses & manuelles préservées : ${preservedTransactions.length}`);
console.log(`   - Écritures HelloAsso uniques déterministes : ${deterministicTransactions.size}`);
console.log(`===============================================================================`);
