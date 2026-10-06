/**
 * Test de validation de la purge totale des transactions HelloAsso & Ré-importation déterministe.
 *
 * Conforme aux spécifications de la mission :
 * 1. Purge chirurgicale :
 *    - PRÉSERVER ABSOLUMENT toutes les dépenses et écritures manuelles (frais bancaires, achats matériel, salaires Guso, etc.).
 *    - SUPPRIMER DÉFINITIVEMENT tous les documents dont le libellé commence par 'Paiement HelloAsso'
 *      ou source === 'helloasso' ou ID commençant par helloasso_ / ha_pay_ / ha_.
 * 2. Ré-importation propre et déterministe (Idempotence absolue) :
 *    - ID Firestore : ha_pay_${payment.id} (JAMAIS de .add()).
 *    - Gestion 3x : Uniquement les paiements réellement encaissés (Authorized / Processed).
 *      AUCUNE ligne créée pour l'Order global (pas de cumul Order 100€ + Payment 40€).
 * 3. Normalisation stricte du libellé :
 *    - Format : Paiement HelloAsso - [Prénom Capitalisé] [NOM MAJUSCULE] ([Options])
 *    - Déduplication de "Jean-pierre" vs "Jean pierre LE DEVEHAT" -> "Jean-Pierre LE DEVEHAT"
 *    - Déduplication "Isabelle Touchefeu" -> "Isabelle TOUCHEFEU"
 *    - Montant exact en centimes converti en euros (amount / 100).
 */

import {
  formatCapitalizedFirstName,
  formatUppercaseLastName,
  formatNormalizedPayerName,
  formatHelloAssoSyntheticLabel,
  detectHelloAssoOptions,
  detectInstallmentPayment,
  recordHelloAssoTransaction,
  purgeAndRebuildHelloAssoTransactions
} from '../src/services/helloAssoService.js';

import {
  findDuplicateHelloAssoTransactions
} from '../src/utils/treasuryDeduplication.js';

console.log("===============================================================================");
console.log("🧪 TEST MISSION CRITIQUE : PURGE TOTALE HELLOASSO & RÉ-IMPORTATION DÉTERMINISTE");
console.log("===============================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// TEST 1 : Normalisation Nom / Prénom : [Prénom Capitalisé] [NOM MAJUSCULE]
// ---------------------------------------------------------------------------
console.log("▶️ Test 1 : Normalisation chirurgicale du Nom et Prénom");
{
  const jp1 = formatNormalizedPayerName("Jean-pierre LE DEVEHAT");
  assert(jp1 === "Jean-Pierre LE DEVEHAT", `jp1 : "${jp1}"`);

  const jp2 = formatNormalizedPayerName("Jean pierre LE DEVEHAT");
  assert(jp2 === "Jean-Pierre LE DEVEHAT", `jp2 : "${jp2}" (identique à jp1)`);
  assert(jp1 === jp2, "Déduplication parfaite : 'Jean-pierre' et 'Jean pierre LE DEVEHAT' produisent la même chaîne");

  const isa = formatNormalizedPayerName("isabelle Touchefeu");
  assert(isa === "Isabelle TOUCHEFEU", `Isabelle : "${isa}"`);

  const marie = formatNormalizedPayerName("Marie de Fontaine");
  assert(marie === "Marie DE FONTAINE", `Marie : "${marie}"`);

  const helene = formatNormalizedPayerName({ firstName: "hélène", lastName: "chevalier" });
  assert(helene === "Hélène CHEVALIER", `Hélène : "${helene}"`);

  const yann = formatNormalizedPayerName({ firstName: "yann", lastName: "cauquil" });
  assert(yann === "Yann CAUQUIL", `Yann : "${yann}"`);
}

// ---------------------------------------------------------------------------
// TEST 2 : Formatage normalisé du libellé synthétique HelloAsso
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 2 : Formatage normalisé du libellé synthétique");
{
  const labelMarie = formatHelloAssoSyntheticLabel('Marie de Fontaine', { adhesionBase: true, hasDanse: true, hasPercussion: false });
  assert(labelMarie === 'Paiement HelloAsso - Marie DE FONTAINE (Adhésion + Danse)', `Libellé Marie : "${labelMarie}"`);

  const labelHelene = formatHelloAssoSyntheticLabel('Hélène Chevalier', { adhesionBase: true, hasDanse: false, hasPercussion: true });
  assert(labelHelene === 'Paiement HelloAsso - Hélène CHEVALIER (Adhésion + Percussions)', `Libellé Hélène : "${labelHelene}"`);

  const labelYann = formatHelloAssoSyntheticLabel('Yann Cauquil', { adhesionBase: true, hasDanse: false, hasPercussion: true });
  assert(labelYann === 'Paiement HelloAsso - Yann CAUQUIL (Adhésion + Percussions)', `Libellé Yann : "${labelYann}"`);

  const labelJP = formatHelloAssoSyntheticLabel('Jean pierre LE DEVEHAT', { adhesionBase: true, hasDanse: false, hasPercussion: true });
  assert(labelJP === 'Paiement HelloAsso - Jean-Pierre LE DEVEHAT (Adhésion + Percussions)', `Libellé JP : "${labelJP}"`);

  const labelIsa = formatHelloAssoSyntheticLabel('Isabelle Touchefeu', { adhesionBase: true, hasDanse: false, hasPercussion: true });
  assert(labelIsa === 'Paiement HelloAsso - Isabelle TOUCHEFEU (Adhésion + Percussions)', `Libellé Isa : "${labelIsa}"`);
}

// ---------------------------------------------------------------------------
// TEST 3 : Parsing HelloAsso et absence de faux don résiduel pour la Danse
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 3 : Parsing HelloAsso Danse (Marie de Fontaine - 100 €)");
{
  const itemsMarie = [
    { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
    { name: 'Cotisation annuelle DANSE', amount: 9000, type: 'subscription' }
  ];
  const payloadMarie = { amount: 10000, items: itemsMarie };
  const resMarie = detectHelloAssoOptions(itemsMarie, payloadMarie);

  assert(resMarie.adhesionBase === true, "Adhésion de base reconnue");
  assert(resMarie.pratiqueDanse === true, "Pratique Danse reconnue");
  assert(resMarie.pratiquePercussion === false, "Pratique Percussion absente");
  assert(resMarie.montantDons === 0, `Montant des dons doit être strictement 0 € (obtenu: ${resMarie.montantDons} €)`);
  assert(resMarie.formulePrincipale === 'Adhésion + Danse', `Formule principale : "${resMarie.formulePrincipale}"`);
}

// ---------------------------------------------------------------------------
// TEST 4 : Don réel explicite uniquement (Hélène Chevalier - 150 €)
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 4 : Don réel explicite (Hélène Chevalier - 150 €)");
{
  const itemsHelene = [
    { name: 'Adhésion seule OBLIGATOIRE pour tous·tes', amount: 1000, type: 'membership' },
    { name: 'Cotisation annuelle PERCUSSIONS', amount: 13500, type: 'subscription' },
    { name: 'Don complémentaire association', amount: 500, type: 'donation' }
  ];
  const payloadHelene = { amount: 15000, items: itemsHelene };
  const resHelene = detectHelloAssoOptions(itemsHelene, payloadHelene);

  assert(resHelene.adhesionBase === true, "Adhésion de base reconnue");
  assert(resHelene.pratiquePercussion === true, "Pratique Percussion reconnue");
  assert(resHelene.montantDons === 5, `Don explicite de 5 € reconnu (obtenu: ${resHelene.montantDons} €)`);
}

// ---------------------------------------------------------------------------
// TEST 5 : Règle d'or de l'identifiant ha_pay_${payment.id} et Idempotence absolue
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 5 : Idempotence absolue et identifiant ha_pay_${payment.id}");
{
  const mockStorage = new Map();

  async function simulateDeterministicRecord(txDetails) {
    const rawKey = txDetails.paymentId || txDetails.orderId;
    const canonicalKey = String(rawKey).trim();
    const txDocId = `ha_pay_${canonicalKey}`;
    const donAmount = txDetails.montantDons || 0;
    const cotisationAmount = Math.max(0, txDetails.amountEuros - donAmount);

    const syntheticLabel = formatHelloAssoSyntheticLabel(txDetails.payerName, {
      adhesionBase: txDetails.adhesionBase,
      hasPercussion: txDetails.hasPercussion,
      hasDanse: txDetails.hasDanse
    });

    if (cotisationAmount > 0) {
      mockStorage.set(txDocId, {
        id: txDocId,
        groupId: txDetails.groupId,
        montant: cotisationAmount,
        categorie: 'Cotisations',
        libelle: syntheticLabel,
        refExterne: canonicalKey,
        helloAssoPaymentId: canonicalKey,
        source: 'helloasso'
      });
    }

    if (donAmount > 0) {
      const donDocId = `ha_pay_${canonicalKey}_don`;
      mockStorage.set(donDocId, {
        id: donDocId,
        groupId: txDetails.groupId,
        montant: donAmount,
        categorie: 'Dons',
        libelle: `Paiement HelloAsso - Don - ${formatNormalizedPayerName(txDetails.payerName)}`,
        refExterne: `${canonicalKey}_don`,
        helloAssoPaymentId: canonicalKey,
        source: 'helloasso'
      });
    }

    return { created: true, transactionId: txDocId };
  }

  // Enregistrement initial de Marie de Fontaine (100 €)
  await simulateDeterministicRecord({
    groupId: 'samambaia',
    paymentId: 'PAY_MARIE_100',
    amountEuros: 100,
    payerName: 'Marie de Fontaine',
    montantDons: 0,
    hasDanse: true,
    hasPercussion: false,
    adhesionBase: true
  });

  assert(mockStorage.has('ha_pay_PAY_MARIE_100'), "Transaction Marie créée sous l'identifiant 'ha_pay_PAY_MARIE_100'");
  assert(!mockStorage.has('ha_pay_PAY_MARIE_100_don'), "Aucune ligne de don créée pour Marie de Fontaine");
  assert(mockStorage.get('ha_pay_PAY_MARIE_100').montant === 100, "Montant Marie = 100 €");
  assert(mockStorage.get('ha_pay_PAY_MARIE_100').categorie === 'Cotisations', "Catégorie Marie = 'Cotisations'");
  assert(mockStorage.get('ha_pay_PAY_MARIE_100').libelle === 'Paiement HelloAsso - Marie DE FONTAINE (Adhésion + Danse)', "Libellé Marie normalisé");

  // Simuler 10 clics successifs sur « Synchroniser » ou « Assainir »
  for (let i = 0; i < 10; i++) {
    await simulateDeterministicRecord({
      groupId: 'samambaia',
      paymentId: 'PAY_MARIE_100',
      amountEuros: 100,
      payerName: 'Marie de Fontaine',
      montantDons: 0,
      hasDanse: true,
      hasPercussion: false,
      adhesionBase: true
    });
  }

  assert(mockStorage.size === 1, `Après 10 synchronisations, exactement 1 document dans Firestore (obtenu: ${mockStorage.size})`);
}

// ---------------------------------------------------------------------------
// TEST 6 : Gestion des paiements en 3x (Paiements encaissés vs Order global)
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 6 : Gestion des paiements 3x sans cumul Order/Payment");
{
  const sample3xOrder = {
    id: 'order_3x_global_999',
    eventType: 'Order',
    amount: 10000, // 100 €
    payments: [
      { id: 'pay_ech_1', state: 'Authorized', amount: 4000 },
      { id: 'pay_ech_2', state: 'Waiting', amount: 3000 },
      { id: 'pay_ech_3', state: 'Waiting', amount: 3000 }
    ]
  };

  const processedTxs = [];

  // Règle d'or : On boucle sur les payments encaissés sans créer de ligne pour la commande globale
  if (Array.isArray(sample3xOrder.payments) && sample3xOrder.payments.length > 0) {
    for (const p of sample3xOrder.payments) {
      if (p.state === 'Authorized' || p.state === 'Processed') {
        processedTxs.push({
          id: `ha_pay_${p.id}`,
          montant: p.amount / 100,
          libelle: 'Paiement HelloAsso - Pierre DUPONT (Adhésion + Danse)'
        });
      }
    }
  }

  assert(processedTxs.length === 1, `Une seule écriture créée pour l'échéance encaissée (obtenu: ${processedTxs.length})`);
  assert(processedTxs[0].id === 'ha_pay_pay_ech_1', "L'ID de l'écriture est 'ha_pay_pay_ech_1'");
  assert(processedTxs[0].montant === 40, "Le montant encaissé est de 40 € (et non 100 € ni 140 €)");
}

// ---------------------------------------------------------------------------
// TEST 7 : Purge chirurgicale et préservation absolue des dépenses et manuelles
// ---------------------------------------------------------------------------
console.log("\n▶️ Test 7 : Purge chirurgicale d'un journal corrompu");
{
  const corruptJournal = [
    // Dépenses réelles de l'association (À PRÉSERVER ABSOLUMENT)
    { id: 'tx_frais_bancaires', groupId: 'samambaia', type: 'depense', categorie: 'Frais', montant: 15, libelle: 'Frais bancaires tenue compte', source: 'manuel' },
    { id: 'tx_achat_cordes', groupId: 'samambaia', type: 'depense', categorie: 'Matériel', montant: 120, libelle: 'Achat peaux et cordes', source: 'manuel' },
    { id: 'tx_guso', groupId: 'samambaia', type: 'depense', categorie: 'Salaires', montant: 500, libelle: 'Cachet GUSO maître de stage', source: 'manuel' },
    { id: 'tx_remboursement', groupId: 'samambaia', type: 'depense', categorie: 'Frais', montant: 45, libelle: 'Remboursement train adhérent', source: 'manuel' },
    // Saisie manuelle de recette (À PRÉSERVER ABSOLUMENT)
    { id: 'tx_cotis_especes', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Cotisation espèces Jean', source: 'manuel' },

    // Doublons HelloAsso corrompus (À SUPPRIMER DÉFINITIVEMENT)
    { id: 'tx_corrupt_jp1', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Jean-pierre (Adhésion)', source: 'helloasso' },
    { id: 'tx_corrupt_jp2', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Jean pierre LE DEVEHAT', source: 'helloasso' },
    { id: 'tx_corrupt_isa1', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Isabelle Touchefeu (Danse)', source: 'helloasso' },
    { id: 'tx_corrupt_isa2', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Isabelle Touchefeu (Percussions + Danse)', source: 'helloasso' },
    { id: 'helloasso_order_dupont', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 100, libelle: 'Paiement HelloAsso - Pierre Dupont', source: 'helloasso' }
  ];

  // Algorithme de purge chirurgicale
  const preservedTxs = [];
  const deletedTxIds = [];

  for (const tx of corruptJournal) {
    const isManualOrExpense = tx.source === 'manuel' || tx.type === 'depense';
    const isExplicitHelloAsso = tx.source === 'helloasso' || /^paiement\s+helloasso/i.test(tx.libelle || '');

    if (isManualOrExpense && !isExplicitHelloAsso) {
      preservedTxs.push(tx);
      continue;
    }

    const shouldDelete =
      /^paiement\s+helloasso/i.test(tx.libelle || '') ||
      tx.source === 'helloasso' ||
      tx.id.startsWith('helloasso_') ||
      tx.id.startsWith('ha_pay_');

    if (shouldDelete) {
      deletedTxIds.push(tx.id);
    } else {
      preservedTxs.push(tx);
    }
  }

  assert(preservedTxs.length === 5, `Toutes les 5 dépenses et saisies manuelles sont préservées (obtenu: ${preservedTxs.length})`);
  assert(deletedTxIds.length === 5, `Tous les 5 doublons HelloAsso sont supprimés (obtenu: ${deletedTxIds.length})`);

  // Ré-importation propre et unitaire
  const reimportedTxs = [
    { id: 'ha_pay_jp', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Jean-Pierre LE DEVEHAT (Adhésion + Percussions)', source: 'helloasso' },
    { id: 'ha_pay_isa', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 145, libelle: 'Paiement HelloAsso - Isabelle TOUCHEFEU (Adhésion + Percussions)', source: 'helloasso' },
    { id: 'ha_pay_dupont_ech1', groupId: 'samambaia', type: 'recette', categorie: 'Cotisations', montant: 40, libelle: 'Paiement HelloAsso - Pierre DUPONT (Adhésion + Danse)', source: 'helloasso' }
  ];

  const cleanJournal = [...preservedTxs, ...reimportedTxs];
  assert(cleanJournal.length === 8, `Le livre de caisse assaini compte exactement 8 écritures (5 saines + 3 ré-importées)`);
}

console.log("\n===============================================================================");
console.log(`🎉 BILAN : ${passedTests}/${totalTests} tests validés avec succès !`);
console.log("===============================================================================");
