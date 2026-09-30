/**
 * Service de synchronisation et de réconciliation HelloAsso & Cotisations.
 * Gère le mapping des options, les paiements échelonnés (3x), la réconciliation
 * des adhérents (customFields / email), l'écriture comptable sans doublon,
 * et la préservation stricte des saisies manuelles du trésorier.
 *
 * Conforme aux règles d'architecture et de modularité O-Girador-manager.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Analyse les articles d'une commande HelloAsso pour catégoriser les options souscrites.
 *
 * @param {Array} items Liste des articles du formulaire HelloAsso
 * @param {Object} [rawData={}] Données brutes de la commande
 * @returns {Object} { formulePrincipale, optionsAdditionnelles, dons, detailsOptions }
 */
export function detectHelloAssoOptions(items = [], rawData = {}) {
  const safeItems = Array.isArray(items) ? items : [];

  let formulePrincipale = null;
  const optionsAdditionnelles = [];
  let montantDons = 0;
  const detailsOptions = [];

  for (const item of safeItems) {
    const rawName = (item.name || item.customName || '').trim();
    const cleanNameLower = rawName.toLowerCase();
    const itemType = (item.type || '').toLowerCase();
    const rawAmount = typeof item.amount === 'number' ? item.amount : (item.amount?.total || 0);
    const amountEuros = rawAmount > 0 ? (rawAmount / 100) : 0;

    const parsedItem = {
      name: rawName,
      type: itemType,
      amount: amountEuros
    };
    detailsOptions.push(parsedItem);

    // Détection des dons
    if (itemType === 'donation' || cleanNameLower.includes('don ') || cleanNameLower === 'don' || cleanNameLower.includes('pourboire')) {
      montantDons += amountEuros;
      continue;
    }

    // Détection des options matérielles / costumes
    const isCostume = cleanNameLower.includes('costume') || cleanNameLower.includes('tenue') || cleanNameLower.includes('t-shirt') || cleanNameLower.includes('jupe') || cleanNameLower.includes('veste');
    const isInstrument = cleanNameLower.includes('instrument') || cleanNameLower.includes('alfaia') || cleanNameLower.includes('caixa') || cleanNameLower.includes('tarol') || cleanNameLower.includes('gonguê') || cleanNameLower.includes('agbê') || cleanNameLower.includes('timbal');

    if (isCostume || isInstrument || cleanNameLower.includes('option') || cleanNameLower.includes('location')) {
      optionsAdditionnelles.push({
        nom: rawName,
        montant: amountEuros,
        categorie: isCostume ? 'costume' : (isInstrument ? 'instrument' : 'autre')
      });
      continue;
    }

    // Détection de la formule d'adhésion principale
    if (!formulePrincipale) {
      if (cleanNameLower.includes('solidaire') || cleanNameLower.includes('réduit') || cleanNameLower.includes('reduit') || cleanNameLower.includes('étudiant') || cleanNameLower.includes('chômeur') || cleanNameLower.includes('rsa')) {
        formulePrincipale = rawName || 'Tarif Solidaire / Réduit';
      } else if (cleanNameLower.includes('bienfaiteur') || cleanNameLower.includes('soutien')) {
        formulePrincipale = rawName || 'Adhésion Soutien';
      } else if (cleanNameLower.includes('adhésion') || cleanNameLower.includes('adhesion') || cleanNameLower.includes('cotisation') || itemType === 'membership') {
        formulePrincipale = rawName || 'Formule Standard';
      }
    }
  }

  // Repli sur le premier item si aucune formule explicite n'a été détectée
  if (!formulePrincipale && safeItems.length > 0) {
    formulePrincipale = safeItems[0].name || 'Adhésion HelloAsso';
  }

  return {
    formulePrincipale: formulePrincipale || 'Adhésion Standard',
    optionsAdditionnelles,
    montantDons,
    detailsOptions
  };
}

/**
 * Analyse si le paiement est un règlement échelonné (ex: prélèvement en 3 fois).
 *
 * @param {Object} data Données de la commande ou du paiement
 * @returns {Object} { isInstallment, isComplete, installmentNumber, installmentCount, status }
 */
export function detectInstallmentPayment(data = {}) {
  const payments = Array.isArray(data.payments) 
    ? data.payments 
    : (Array.isArray(data.order?.payments) ? data.order.payments : []);

  const rawText = JSON.stringify(data).toLowerCase();
  const has3xKeyword = rawText.includes('3 fois') || rawText.includes('3x') || rawText.includes('échelonné') || rawText.includes('echelonne') || rawText.includes('plusieurs fois');

  if (payments.length > 1 || has3xKeyword) {
    const totalPaymentsCount = payments.length > 1 ? payments.length : 3;
    const authorizedPayments = payments.filter(p => (p.state || '').toLowerCase() === 'authorized');
    const authorizedCount = authorizedPayments.length > 0 ? authorizedPayments.length : 1;

    const isComplete = authorizedCount >= totalPaymentsCount;
    return {
      isInstallment: true,
      isComplete,
      installmentNumber: authorizedCount,
      installmentCount: totalPaymentsCount,
      // Si au moins 1 échéance est validée mais pas toutes : statut 'en_cours' (et non 'impayé')
      status: isComplete ? 'a_jour' : 'en_cours',
      paymentStatus: isComplete ? 'paid' : 'en_cours'
    };
  }

  return {
    isInstallment: false,
    isComplete: true,
    installmentNumber: 1,
    installmentCount: 1,
    status: 'a_jour',
    paymentStatus: 'paid'
  };
}

/**
 * Extrait l'identifiant utilisateur (UID) depuis les customFields ou métadonnées du paiement.
 *
 * @param {Array} customFields Liste des champs personnalisés
 * @param {Object} metadata Métadonnées éventuelles
 * @param {Object} data Données brutes
 * @returns {string|null} Identifiant utilisateur si détecté
 */
export function findUserIdentifierFromCustomFields(customFields = [], metadata = {}, data = {}) {
  // 1. Recherche directe dans metadata
  if (metadata?.userId || metadata?.uid || metadata?.user_id) {
    return String(metadata.userId || metadata.uid || metadata.user_id).trim();
  }

  // 2. Recherche dans customFields à la racine
  const allFields = [
    ...(Array.isArray(customFields) ? customFields : []),
    ...(Array.isArray(data.customFields) ? data.customFields : []),
    ...(Array.isArray(data.order?.customFields) ? data.order.customFields : [])
  ];

  for (const field of allFields) {
    const name = String(field?.name || field?.label || '').toLowerCase();
    const val = String(field?.answer || field?.value || '').trim();

    if (
      name.includes('userid') ||
      name.includes('user_id') ||
      name.includes('identifiant') ||
      name.includes('uid') ||
      name.includes('id membre') ||
      name.includes('adh_id')
    ) {
      if (val && val.length > 5) {
        return val;
      }
    }
  }

  // 3. Recherche dans les items de commande
  const items = Array.isArray(data.items) ? data.items : [];
  for (const item of items) {
    if (Array.isArray(item.customFields)) {
      for (const field of item.customFields) {
        const name = String(field?.name || field?.label || '').toLowerCase();
        const val = String(field?.answer || field?.value || '').trim();
        if (
          name.includes('userid') ||
          name.includes('user_id') ||
          name.includes('identifiant') ||
          name.includes('uid')
        ) {
          if (val && val.length > 5) return val;
        }
      }
    }
  }

  return null;
}

/**
 * Réconcilie un paiement HelloAsso avec un membre de l'association.
 * Priorité : 1. customField UID, 2. Adresse email.
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe
 * @param {Object} criteria Critères de recherche { customUserId, payerEmail }
 * @returns {Promise<Object|null>} { id, ...data } du membre trouvé ou null
 */
export async function matchMemberFromPayment(dbInstance, groupId, { customUserId, payerEmail }) {
  if (!groupId) return null;

  const usersRef = collection(dbInstance, 'users');

  // Priorité 1 : Identifiant utilisateur customField
  if (customUserId) {
    try {
      const directDocRef = doc(dbInstance, 'users', customUserId);
      const directSnap = await getDoc(directDocRef);
      if (directSnap.exists()) {
        const data = directSnap.data();
        if (!data.groupId || data.groupId === groupId || data.groupId.toLowerCase() === groupId.toLowerCase()) {
          return { id: directSnap.id, ...data };
        }
      }
    } catch (err) {
      console.warn("matchMemberFromPayment - Erreur vérification directe customUserId :", err);
    }
  }

  // Priorité 2 : Adresse email (payer.email)
  if (payerEmail) {
    const cleanEmail = payerEmail.trim().toLowerCase();
    try {
      const q = query(
        usersRef,
        where('groupId', '==', groupId),
        where('email', '==', cleanEmail),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }

      // Repli si le groupId est en minuscules
      if (groupId !== groupId.toLowerCase()) {
        const qLower = query(
          usersRef,
          where('groupId', '==', groupId.toLowerCase()),
          where('email', '==', cleanEmail),
          limit(1)
        );
        const snapLower = await getDocs(qLower);
        if (!snapLower.empty) {
          const docSnap = snapLower.docs[0];
          return { id: docSnap.id, ...docSnap.data() };
        }
      }
    } catch (err) {
      console.warn("matchMemberFromPayment - Erreur recherche par email :", err);
    }
  }

  return null;
}

/**
 * Enregistre une écriture comptable dans la collection 'transactions' sans doublon.
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe
 * @param {Object} txDetails Détails de la transaction { paymentId, amountEuros, paymentDate, payerName, formule, memberId }
 * @returns {Promise<{ created: boolean, transactionId: string }>}
 */
export async function recordHelloAssoTransaction(dbInstance, groupId, txDetails) {
  const {
    paymentId,
    amountEuros,
    paymentDate = new Date(),
    payerName = 'Adhérent',
    formule = 'Cotisation',
    memberId = null
  } = txDetails;

  if (!groupId || !paymentId || amountEuros <= 0) {
    return { created: false, transactionId: null };
  }

  const strPaymentId = String(paymentId).trim();
  const txRef = collection(dbInstance, 'transactions');

  // 1. Vérification anti-doublon via refExterne ou helloAssoOrderId
  try {
    const checkQuery = query(
      txRef,
      where('groupId', '==', groupId),
      where('refExterne', '==', strPaymentId),
      limit(1)
    );
    const existingSnap = await getDocs(checkQuery);
    if (!existingSnap.empty) {
      return { created: false, transactionId: existingSnap.docs[0].id };
    }

    // Deuxième vérification par helloAssoOrderId pour compatibilité ascendante
    const checkOrderQuery = query(
      txRef,
      where('groupId', '==', groupId),
      where('helloAssoOrderId', '==', strPaymentId),
      limit(1)
    );
    const existingOrderSnap = await getDocs(checkOrderQuery);
    if (!existingOrderSnap.empty) {
      return { created: false, transactionId: existingOrderSnap.docs[0].id };
    }
  } catch (checkErr) {
    console.warn("recordHelloAssoTransaction - Avertissement vérification doublon :", checkErr);
  }

  // 2. Création de l'écriture comptable avec identifiant déterministe pour idempotence absolue
  const txDocId = `helloasso_${strPaymentId}`;
  const docRef = doc(txRef, txDocId);

  const txDateObj = paymentDate instanceof Date 
    ? paymentDate 
    : (paymentDate?.toDate ? paymentDate.toDate() : new Date(paymentDate));

  const payload = {
    groupId,
    date: Timestamp.fromDate(isNaN(txDateObj.getTime()) ? new Date() : txDateObj),
    type: 'recette',
    categorie: 'Cotisation',
    montant: amountEuros,
    libelle: `Paiement HelloAsso - ${payerName} (${formule})`,
    justificatif: 'HelloAsso',
    justificatifNom: `HelloAsso #${strPaymentId}`,
    refExterne: strPaymentId,
    helloAssoOrderId: strPaymentId,
    helloAssoPaymentId: strPaymentId,
    userId: memberId || null,
    source: 'helloasso',
    createdAt: serverTimestamp()
  };

  await setDoc(docRef, payload, { merge: true });
  return { created: true, transactionId: txDocId };
}

/**
 * Traite et synchronise un paiement HelloAsso complet dans Firestore.
 * Met à jour le profil adhérent en préservant les saisies manuelles antérieures du trésorier,
 * et enregistre l'écriture comptable sans doublon.
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe
 * @param {Object} payload Données brutes de la notification ou de l'appel HelloAsso
 * @returns {Promise<Object>} Résultat de la réconciliation et de la synchronisation
 */
export async function processHelloAssoPayment(dbInstance, groupId, payload) {
  if (!groupId || !payload) {
    return { success: false, reason: "Paramètres manquants." };
  }

  const data = payload.data || payload;
  const payer = data.payer || (data.order && data.order.payer) || {};
  const payerEmail = (payer.email || '').trim().toLowerCase();
  const payerFirstName = payer.firstName || '';
  const payerLastName = payer.lastName || '';
  const payerFullName = `${payerFirstName} ${payerLastName}`.trim() || payerEmail || 'Adhérent';

  // Montant en euros
  let rawAmount = 0;
  if (typeof data.amount === 'number') {
    rawAmount = data.amount;
  } else if (data.amount && typeof data.amount === 'object') {
    rawAmount = data.amount.total || data.amount.amount || 0;
  } else if (data.order?.amount) {
    rawAmount = typeof data.order.amount === 'number' ? data.order.amount : (data.order.amount.total || 0);
  }
  const amountEuros = rawAmount > 0 ? (rawAmount / 100) : 0;

  const paymentId = String(data.id || data.order?.id || payload.id || `ha_${Date.now()}`);
  const paymentDate = data.date || data.order?.date || new Date().toISOString();

  // 1. Analyse des options et formules
  const optionsAnalysis = detectHelloAssoOptions(data.items || data.order?.items || [], data);
  const installmentAnalysis = detectInstallmentPayment(data);

  // 2. Recherche du customField utilisateur
  const customUserId = findUserIdentifierFromCustomFields(data.customFields, data.metadata, data);

  // 3. Réconciliation du membre
  const matchedMember = await matchMemberFromPayment(dbInstance, groupId, {
    customUserId,
    payerEmail
  });

  const nowIso = new Date().toISOString();
  let updatedMember = false;

  if (matchedMember) {
    const userRef = doc(dbInstance, 'users', matchedMember.id);

    // Vérification de la protection contre l'écrasement des saisies manuelles du trésorier :
    // Si le trésorier a déjà validé manuellement un mode de règlement spécifique (ex: chèque, espèces, virement)
    // ou marqué une exception manuelle, on conserve ses arbitrages.
    const isManualOverride = Boolean(
      matchedMember.saisieManuelle === true ||
      matchedMember.cotisationManuelle === true ||
      (matchedMember.cotisation?.modeReglement && matchedMember.cotisation.modeReglement !== 'helloasso') ||
      (matchedMember.modeReglement && matchedMember.modeReglement !== 'helloasso' && matchedMember.paymentStatus === 'paid')
    );

    const isFullyPaid = installmentAnalysis.isComplete;
    const isInstallmentActive = installmentAnalysis.isInstallment && !installmentAnalysis.isComplete;

    // Statut : 'en_cours' si paiement 3x avec au moins une échéance payée, sinon 'a_jour'
    const cotisationStatut = isInstallmentActive ? 'en_cours' : (isFullyPaid ? 'a_jour' : 'en_cours');
    const paymentStatusField = isInstallmentActive ? 'en_cours' : 'paid';

    if (!isManualOverride) {
      await updateDoc(userRef, {
        paymentStatus: paymentStatusField,
        cotisation: {
          aJour: true,
          statut: cotisationStatut,
          formule: optionsAnalysis.formulePrincipale,
          montantTotal: amountEuros,
          modeReglement: 'helloasso',
          derniereSynchro: nowIso
        },
        helloAssoLastPayment: {
          paymentId,
          orderId: paymentId,
          amount: amountEuros,
          date: paymentDate,
          formule: optionsAnalysis.formulePrincipale,
          isInstallment: installmentAnalysis.isInstallment,
          installmentNumber: installmentAnalysis.installmentNumber,
          updatedAt: serverTimestamp()
        }
      });
      updatedMember = true;
    } else {
      // Conservation du statut manuel du trésorier tout en enregistrant les métadonnées de paiement HelloAsso
      const existingCotisation = matchedMember.cotisation || {};
      await updateDoc(userRef, {
        helloAssoLastPayment: {
          paymentId,
          orderId: paymentId,
          amount: amountEuros,
          date: paymentDate,
          formule: optionsAnalysis.formulePrincipale,
          isInstallment: installmentAnalysis.isInstallment,
          installmentNumber: installmentAnalysis.installmentNumber,
          updatedAt: serverTimestamp()
        },
        cotisation: {
          ...existingCotisation,
          derniereSynchro: nowIso
        }
      });
      updatedMember = true;
    }
  }

  // 4. Écriture comptable dans la collection 'transactions'
  let txResult = { created: false, transactionId: null };
  if (amountEuros > 0) {
    txResult = await recordHelloAssoTransaction(dbInstance, groupId, {
      paymentId,
      amountEuros,
      paymentDate,
      payerName: matchedMember ? `${matchedMember.prenom || ''} ${matchedMember.nom || ''}`.trim() : payerFullName,
      formule: optionsAnalysis.formulePrincipale,
      memberId: matchedMember?.id || null
    });
  }

  return {
    success: true,
    matched: !!matchedMember,
    memberId: matchedMember?.id || null,
    memberName: matchedMember ? `${matchedMember.prenom || ''} ${matchedMember.nom || ''}`.trim() : null,
    updatedMember,
    formule: optionsAnalysis.formulePrincipale,
    isInstallment: installmentAnalysis.isInstallment,
    status: installmentAnalysis.status,
    transactionCreated: txResult.created,
    transactionId: txResult.transactionId
  };
}

/**
 * Fonction de resynchronisation manuelle appelée depuis l'interface Trésorier (TabCotisations).
 * Parcourt les derniers paiements/logs HelloAsso et met à jour les adhérents et transactions manquantes.
 *
 * @param {string} groupId Identifiant du groupe/association
 * @returns {Promise<{ success: boolean, syncedMembersCount: number, syncedTxCount: number, details: Array }>}
 */
export async function syncHelloAssoPayments(groupId) {
  if (!groupId) {
    return { success: false, syncedMembersCount: 0, syncedTxCount: 0, error: "GroupId manquant." };
  }

  let syncedMembersCount = 0;
  let syncedTxCount = 0;
  const results = [];

  try {
    // 1. Lire les logs de notification HelloAsso récents de l'association
    const logsRef = collection(db, 'associations', groupId, 'helloasso_logs');
    const logsQuery = query(logsRef, limit(100));
    const logsSnap = await getDocs(logsQuery);

    const logItems = [];
    logsSnap.forEach((docSnap) => {
      logItems.push({ id: docSnap.id, ...docSnap.data() });
    });

    for (const log of logItems) {
      try {
        const payloadData = log.rawPayload ? JSON.parse(log.rawPayload) : log;
        const res = await processHelloAssoPayment(db, groupId, payloadData);
        if (res.success) {
          if (res.updatedMember) syncedMembersCount++;
          if (res.transactionCreated) syncedTxCount++;
          results.push(res);
        }
      } catch (logErr) {
        console.warn("syncHelloAssoPayments - Erreur traitement log :", logErr);
      }
    }

    // 2. Traiter également les éventuels paiements en attente dans pending_payments
    try {
      const pendingRef = collection(db, 'pending_payments');
      const pendingQuery = query(pendingRef, where('groupId', '==', groupId), limit(50));
      const pendingSnap = await getDocs(pendingQuery);

      for (const pDoc of pendingSnap.docs) {
        const pData = pDoc.data();
        if (pData.reconciled) continue;

        const res = await processHelloAssoPayment(db, groupId, { data: pData });
        if (res.success && res.matched) {
          syncedMembersCount++;
          if (res.transactionCreated) syncedTxCount++;
          await updateDoc(pDoc.ref, { reconciled: true, reconciledUserId: res.memberId });
        }
      }
    } catch (pendingErr) {
      console.warn("syncHelloAssoPayments - Avertissement pending_payments :", pendingErr);
    }

    return {
      success: true,
      syncedMembersCount,
      syncedTxCount,
      results
    };
  } catch (err) {
    console.error("syncHelloAssoPayments - Erreur générale de synchronisation :", err);
    return {
      success: false,
      syncedMembersCount,
      syncedTxCount,
      error: err.message || err
    };
  }
}
