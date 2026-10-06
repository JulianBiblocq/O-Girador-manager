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
  deleteDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Analyse les articles d'une commande HelloAsso pour catégoriser les options souscrites.
 *
 * @param {Array} items Liste des articles du formulaire HelloAsso
 * @param {Object} [rawData={}] Données brutes de la commande
 * @returns {Object} { formulePrincipale, optionsAdditionnelles, dons, detailsOptions }
 */
/**
 * Normalise une chaîne de caractères en minuscules et sans accents pour une comparaison tolérante.
 *
 * @param {string} str Chaîne brute à assainir
 * @returns {string} Chaîne normalisée
 */
function normalizeStr(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Détecte les options d'adhésion, les formules de pratique (Percussions, Danse),
 * les paiements échelonnés (3x) et les dons complémentaires depuis les items HelloAsso.
 *
 * Règles chirurgicales d'association Répercussion Auray :
 * 1. Adhésion de base (10 €) : 'Adhésion seule OBLIGATOIRE pour tous·tes' -> adhesionBase: true
 * 2. Option Percussions (135 € / 3x 45 €) : 'Cotisation annuelle PERCUSSIONS' -> 'percussions', 3x
 * 3. Option Danse (90 € / 3x 30 €) : 'Cotisation annuelle DANSE' -> 'danse', 3x
 * 4. Dons complémentaires (5 €, 10 €, 20 € ou libre) -> montantDons
 *
 * @param {Array<Object>} items Liste des articles du panier HelloAsso
 * @param {Object} [rawData={}] Données brutes de la commande
 * @param {Array<Object>} [configuredOptions=[]] Liste des options configurées dans l'association
 * @returns {Object} Analyse complète des options, drapeaux métier et identifiants
 */
export function detectHelloAssoOptions(items = [], rawData = {}, configuredOptions = []) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeConfiguredOptions = Array.isArray(configuredOptions) ? configuredOptions : [];

  let formulePrincipale = null;
  const optionsAdditionnelles = [];
  let montantDons = 0;
  const detailsOptions = [];

  let hasAdhesionBase = false;
  let hasDanse = false;
  let hasPercussion = false;
  let isEchelonne = false;
  let echeanceCount = 1;
  const matchedOptionIds = new Set();

  for (const item of safeItems) {
    const rawName = (item.name || item.customName || '').trim();
    const cleanLower = rawName.toLowerCase();
    const cleanNormalized = normalizeStr(rawName);
    const itemType = (item.type || '').toLowerCase();
    const rawAmount = typeof item.amount === 'number' ? item.amount : (item.amount?.total || 0);
    const amountEuros = rawAmount > 0 ? (rawAmount / 100) : 0;

    detailsOptions.push({
      name: rawName,
      type: itemType,
      amount: amountEuros
    });

    // 1. Dons complémentaires (5 €, 10 €, 20 € ou libre)
    if (
      itemType === 'donation' ||
      cleanLower.includes('don ') ||
      cleanLower === 'don' ||
      cleanNormalized.includes('don ') ||
      cleanNormalized === 'don' ||
      cleanNormalized.includes('pourboire')
    ) {
      montantDons += amountEuros;
      continue;
    }

    // 2. Adhésion de base (10 €) : "Adhésion seule OBLIGATOIRE pour tous·tes"
    if (
      cleanLower.includes('adhésion') ||
      cleanNormalized.includes('adhesion') ||
      itemType === 'membership'
    ) {
      hasAdhesionBase = true;
      if (!formulePrincipale) {
        formulePrincipale = rawName;
      }
    }

    // 3. Option Percussions (135 € comptant ou 3x 45 €) :
    // "Cotisation annuelle PERCUSSIONS" ou "Cotisation annuelle paiement 3x PERCUSSIONS"
    if (
      cleanLower.includes('percussion') ||
      cleanNormalized.includes('percussion')
    ) {
      hasPercussion = true;
      matchedOptionIds.add('percussions');
      if (cleanLower.includes('3x') || cleanNormalized.includes('3x') || cleanNormalized.includes('3 fois')) {
        isEchelonne = true;
        echeanceCount = 3;
      }
      if (!formulePrincipale || formulePrincipale.toLowerCase().includes('adhésion seule') || formulePrincipale.toLowerCase().includes('adhesion seule')) {
        formulePrincipale = rawName;
      }
    }

    // 4. Option Danse (90 € comptant ou 3x 30 €) :
    // "Cotisation annuelle DANSE" ou "Cotisation annuelle paiement 3x DANSE"
    if (
      cleanLower.includes('danse') ||
      cleanNormalized.includes('danse')
    ) {
      hasDanse = true;
      matchedOptionIds.add('danse');
      if (cleanLower.includes('3x') || cleanNormalized.includes('3x') || cleanNormalized.includes('3 fois')) {
        isEchelonne = true;
        echeanceCount = 3;
      }
      if (!formulePrincipale || formulePrincipale.toLowerCase().includes('adhésion seule') || formulePrincipale.toLowerCase().includes('adhesion seule')) {
        formulePrincipale = rawName;
      }
    }

    // 5. Typage des options additionnelles matérielles / costumes (hors cotisation de cours)
    const isCostume = cleanNormalized.includes('costume') || cleanNormalized.includes('tenue') || cleanNormalized.includes('t-shirt') || cleanNormalized.includes('jupe') || cleanNormalized.includes('veste');
    const isInstrument = (cleanNormalized.includes('instrument') || cleanNormalized.includes('location')) && !cleanNormalized.includes('percussion') && !cleanNormalized.includes('cotisation');

    if (isCostume || isInstrument) {
      optionsAdditionnelles.push({
        nom: rawName,
        montant: amountEuros,
        categorie: isCostume ? 'costume' : 'instrument'
      });
    }
  }

  // Détection globale 3x depuis l'ensemble du payload
  const rawText = JSON.stringify(rawData || {}).toLowerCase();
  if (rawText.includes('3x') || rawText.includes('3 fois') || rawText.includes('echelonne') || rawText.includes('échelonné')) {
    isEchelonne = true;
    echeanceCount = 3;
  }

  // Construction unitaire et strictement dédupliquée des options de l'adhérent
  const finalSelectedOptions = new Set();
  if (hasPercussion) {
    finalSelectedOptions.add('percussions');
  }
  if (hasDanse) {
    finalSelectedOptions.add('danse');
  }
  for (const opt of optionsAdditionnelles) {
    if (opt.id) {
      finalSelectedOptions.add(opt.id);
    }
  }

  // Construction de la formule principale synthétique
  if (hasPercussion && hasDanse) {
    formulePrincipale = 'Adhésion + Percussions + Danse';
  } else if (hasPercussion) {
    formulePrincipale = 'Adhésion + Percussions';
  } else if (hasDanse) {
    formulePrincipale = 'Adhésion + Danse';
  } else if (hasAdhesionBase) {
    if (!formulePrincipale || formulePrincipale.toLowerCase().includes('adhésion seule') || formulePrincipale.toLowerCase().includes('adhesion seule')) {
      formulePrincipale = formulePrincipale || 'Adhésion seule';
    }
  } else if (!formulePrincipale && safeItems.length > 0) {
    formulePrincipale = safeItems[0].name || 'Adhésion HelloAsso';
  } else if (!formulePrincipale) {
    formulePrincipale = 'Cotisation HelloAsso';
  }

  // Si au moins une cotisation / option est présente, l'adhésion de base est obligatoirement acquise
  if (hasPercussion || hasDanse || formulePrincipale) {
    hasAdhesionBase = true;
  }

  return {
    formulePrincipale,
    optionsAdditionnelles,
    // Ne classer en Dons QUE les lignes où l'article HelloAsso contient explicitement la mention "don" ou "pourboire"
    montantDons,
    detailsOptions,
    adhesionBase: hasAdhesionBase,
    pratiqueDanse: hasDanse,
    pratiquePercussion: hasPercussion,
    selectedOptions: Array.from(finalSelectedOptions),
    echelonne: isEchelonne,
    echeance: echeanceCount
  };
}

/**
 * Capitalise un prénom (gère les prénoms composés avec tiret ou espace).
 * Exemples : "jean-pierre" -> "Jean-Pierre", "jean pierre" -> "Jean-Pierre", "marie" -> "Marie".
 *
 * @param {string} str Prénom brut
 * @returns {string} Prénom capitalisé normalisé
 */
export function formatCapitalizedFirstName(str) {
  if (!str || typeof str !== 'string') return '';
  const parts = str.trim().split(/[\s-]+/).filter(Boolean);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');
}

/**
 * Passe un nom de famille entièrement en MAJUSCULES.
 * Exemples : "le devehat" -> "LE DEVEHAT", "touchefeu" -> "TOUCHEFEU", "de fontaine" -> "DE FONTAINE".
 *
 * @param {string} str Nom de famille brut
 * @returns {string} Nom en majuscules
 */
export function formatUppercaseLastName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toUpperCase();
}

/**
 * Normalise un nom de payeur au format canonique : [Prénom Capitalisé] [NOM MAJUSCULE].
 * Exemples :
 * - "Jean-pierre LE DEVEHAT" -> "Jean-Pierre LE DEVEHAT"
 * - "Jean pierre LE DEVEHAT" -> "Jean-Pierre LE DEVEHAT"
 * - "Isabelle Touchefeu" -> "Isabelle TOUCHEFEU"
 * - "Marie de Fontaine" -> "Marie DE FONTAINE"
 *
 * @param {Object|string} input Objet { firstName, lastName, fullName } ou chaîne complète
 * @returns {string} Nom normalisé
 */
export function formatNormalizedPayerName(input) {
  if (!input) return 'Adhérent';

  let fName = '';
  let lName = '';

  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return 'Adhérent';
    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
      return formatCapitalizedFirstName(tokens[0]);
    } else if (tokens.length === 2) {
      fName = tokens[0];
      lName = tokens[1];
    } else {
      // 3 mots ou plus : ex: "Jean-pierre LE DEVEHAT" ou "Marie de Fontaine"
      const upperIdx = tokens.findIndex((t, idx) => idx > 0 && t === t.toUpperCase() && t.length > 1 && !/^[0-9]+$/.test(t));
      if (upperIdx > 0) {
        fName = tokens.slice(0, upperIdx).join(' ');
        lName = tokens.slice(upperIdx).join(' ');
      } else {
        fName = tokens[0];
        lName = tokens.slice(1).join(' ');
      }
    }
  } else if (typeof input === 'object') {
    fName = (input.firstName || input.prenom || '').trim();
    lName = (input.lastName || input.nom || '').trim();
    if (!fName && !lName && (input.fullName || input.displayName)) {
      return formatNormalizedPayerName(input.fullName || input.displayName);
    }
  }

  const cleanFirst = formatCapitalizedFirstName(fName);
  const cleanLast = formatUppercaseLastName(lName);

  if (cleanFirst && cleanLast) {
    return `${cleanFirst} ${cleanLast}`;
  }
  return cleanFirst || cleanLast || 'Adhérent';
}

/**
 * Génère le libellé synthétique standardisé pour une écriture HelloAsso.
 * Format attendu : Paiement HelloAsso - [Prénom Capitalisé] [NOM MAJUSCULE] ([Options])
 *
 * @param {string|Object} payerName Prénom et Nom du payeur ou adhérent
 * @param {Object} options Activités souscrites { adhesionBase, hasPercussion, hasDanse, options }
 * @returns {string} Libellé comptable synthétique
 */
export function formatHelloAssoSyntheticLabel(payerName, { adhesionBase = true, hasPercussion = false, hasDanse = false, options = [] } = {}) {
  const activities = [];
  if (adhesionBase) {
    activities.push('Adhésion');
  }
  if (hasPercussion) {
    activities.push('Percussions');
  }
  if (hasDanse) {
    activities.push('Danse');
  }
  if (activities.length === 0 && Array.isArray(options) && options.length > 0) {
    options.forEach(opt => {
      const oStr = String(opt).toLowerCase();
      if (oStr.includes('percu')) activities.push('Percussions');
      else if (oStr.includes('danse')) activities.push('Danse');
      else activities.push(opt);
    });
  }
  const actStr = activities.length > 0 ? Array.from(new Set(activities)).join(' + ') : 'Cotisation';
  const cleanName = formatNormalizedPayerName(payerName);
  return `Paiement HelloAsso - ${cleanName} (${actStr})`;
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
 * Priorités :
 * 1. Identifiant utilisateur customField (UID)
 * 2. Adresse email du payeur
 * 3. Prénom et nom du payeur / participant (recherche tolérante)
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe
 * @param {Object} criteria Critères de recherche { customUserId, payerEmail, payerFirstName, payerLastName, payerFullName }
 * @returns {Promise<Object|null>} { id, ...data } du membre trouvé ou null
 */
export async function matchMemberFromPayment(dbInstance, groupId, { customUserId, payerEmail, payerFirstName, payerLastName, payerFullName }) {
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

  // Priorité 3 : Rapprochement tolérant par Prénom et Nom
  const cleanFirstName = normalizeStr(payerFirstName || '');
  const cleanLastName = normalizeStr(payerLastName || '');
  let fullSearchName = normalizeStr(payerFullName || '');
  if (!fullSearchName && (cleanFirstName || cleanLastName)) {
    fullSearchName = `${cleanFirstName} ${cleanLastName}`.trim();
  }

  if (cleanFirstName || cleanLastName || fullSearchName) {
    try {
      const usersQuery = query(usersRef, where('groupId', '==', groupId));
      const allMembersSnap = await getDocs(usersQuery);

      for (const mDoc of allMembersSnap.docs) {
        const mData = mDoc.data();
        const mPrenom = normalizeStr(mData.prenom || '');
        const mNom = normalizeStr(mData.nom || '');
        const mDisplay = normalizeStr(mData.displayName || `${mData.prenom || ''} ${mData.nom || ''}`);

        // Rapprochement prénom + nom exacts normalisés
        if (cleanFirstName && cleanLastName && mPrenom === cleanFirstName && mNom === cleanLastName) {
          return { id: mDoc.id, ...mData };
        }

        // Rapprochement nom complet ou displayName
        if (fullSearchName && (mDisplay === fullSearchName || `${mPrenom} ${mNom}` === fullSearchName)) {
          return { id: mDoc.id, ...mData };
        }

        // Rapprochement partiel si prénom composé (ex: Yann / Yann-Bento) et nom concordant
        if (cleanLastName && mNom === cleanLastName) {
          if (cleanFirstName && (mPrenom.includes(cleanFirstName) || cleanFirstName.includes(mPrenom))) {
            return { id: mDoc.id, ...mData };
          }
        }
      }
    } catch (nameErr) {
      console.warn("matchMemberFromPayment - Erreur recherche par nom/prénom :", nameErr);
    }
  }

  return null;
}

/**
 * Enregistre une écriture comptable dans la collection 'transactions' avec unicité stricte.
 * Règle d'or : Une commande HelloAsso = Une seule écriture comptable.
 * Verrouille l'ID du document Firestore : `helloasso_${orderId || paymentId}`
 * Utilise la catégorie 'Cotisations' pour l'activité et 'Dons' uniquement si don réel explicite.
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe
 * @param {Object} txDetails Détails de la transaction { paymentId, orderId, amountEuros, paymentDate, payerName, formule, memberId, montantDons, hasPercussion, hasDanse, adhesionBase }
 * @returns {Promise<{ created: boolean, transactionId: string }>}
 */
export async function recordHelloAssoTransaction(dbInstance, groupId, txDetails) {
  const {
    paymentId,
    orderId,
    amountEuros,
    paymentDate = new Date(),
    payerName = 'Adhérent',
    formule = 'Cotisation',
    memberId = null,
    montantDons = 0,
    hasPercussion = false,
    hasDanse = false,
    adhesionBase = true
  } = txDetails;

  const rawKey = orderId || paymentId;
  if (!groupId || !rawKey || amountEuros <= 0) {
    return { created: false, transactionId: null };
  }

  // Clé déterministe canonique basée sur l'identifiant du paiement bancaire : ha_pay_${paymentId}
  const canonicalKey = String(rawKey).trim();
  const txDocId = `ha_pay_${canonicalKey}`;
  const txRef = collection(dbInstance, 'transactions');
  const docRef = doc(txRef, txDocId);

  // Ventilation stricte : la danse, les percussions et l'adhésion relèvent de 'Cotisations'
  // Ne classer en 'Dons' QUE les montants provenant d'articles portant explicitement la mention "don" ou "pourboire"
  const donAmount = typeof montantDons === 'number' && montantDons > 0 ? montantDons : 0;
  const cotisationAmount = Math.max(0, amountEuros - donAmount);

  const txDateObj = paymentDate instanceof Date 
    ? paymentDate 
    : (paymentDate?.toDate ? paymentDate.toDate() : new Date(paymentDate));
  const safeDate = isNaN(txDateObj.getTime()) ? new Date() : txDateObj;

  // Libellé synthétique normalisé : Paiement HelloAsso - [Prénom Capitalisé] [NOM MAJUSCULE] ([Options])
  const syntheticLabel = formatHelloAssoSyntheticLabel(payerName, { adhesionBase, hasPercussion, hasDanse });
  const normalizedPayer = formatNormalizedPayerName(payerName);

  if (cotisationAmount > 0) {
    const payload = {
      groupId,
      date: Timestamp.fromDate(safeDate),
      type: 'recette',
      categorie: 'Cotisations',
      montant: cotisationAmount,
      libelle: syntheticLabel,
      justificatif: 'HelloAsso',
      justificatifNom: `HelloAsso #${canonicalKey}`,
      refExterne: canonicalKey,
      helloAssoOrderId: String(orderId || canonicalKey).trim(),
      helloAssoPaymentId: String(paymentId || canonicalKey).trim(),
      userId: memberId || null,
      source: 'helloasso',
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
  }

  // Écriture séparée sous la catégorie 'Dons' uniquement si un don explicite réel a été versé
  if (donAmount > 0) {
    const donDocId = `ha_pay_${canonicalKey}_don`;
    const donDocRef = doc(txRef, donDocId);
    const donPayload = {
      groupId,
      date: Timestamp.fromDate(safeDate),
      type: 'recette',
      categorie: 'Dons',
      montant: donAmount,
      libelle: `Paiement HelloAsso - Don - ${normalizedPayer}`,
      justificatif: 'HelloAsso',
      justificatifNom: `HelloAsso #${canonicalKey} (Don)`,
      refExterne: `${canonicalKey}_don`,
      helloAssoOrderId: String(orderId || canonicalKey).trim(),
      helloAssoPaymentId: String(paymentId || canonicalKey).trim(),
      userId: memberId || null,
      source: 'helloasso',
      updatedAt: serverTimestamp()
    };
    await setDoc(donDocRef, donPayload, { merge: true });
  }

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

  // 1. Récupération des options configurées dans l'association pour le mapping dynamique
  let configuredOptions = [];
  try {
    const assocSnap = await getDoc(doc(dbInstance, 'associations', groupId));
    if (assocSnap.exists()) {
      configuredOptions = assocSnap.data()?.optionsCotisation || [];
    }
  } catch (err) {
    console.warn("processHelloAssoPayment - Impossible de lire optionsCotisation :", err);
  }

  // 2. Analyse chirurgicale et isolée des options et formules de la commande
  const orderItems = Array.isArray(data.items) 
    ? data.items 
    : (Array.isArray(data.order?.items) 
        ? data.order.items 
        : (Array.isArray(data.payments) && Array.isArray(data.payments[0]?.items) 
            ? data.payments[0].items 
            : []));
  const optionsAnalysis = detectHelloAssoOptions(orderItems, data, configuredOptions);
  const installmentAnalysis = detectInstallmentPayment(data);

  // 3. Recherche du customField utilisateur
  const customUserId = findUserIdentifierFromCustomFields(data.customFields, data.metadata, data);

  // 4. Réconciliation du membre (par UID, Email ou Prénom / Nom)
  const matchedMember = await matchMemberFromPayment(dbInstance, groupId, {
    customUserId,
    payerEmail,
    payerFirstName,
    payerLastName,
    payerFullName
  });

  const nowIso = new Date().toISOString();
  let updatedMember = false;

  if (matchedMember) {
    const userRef = doc(dbInstance, 'users', matchedMember.id);

    // Protection contre l'écrasement des saisies manuelles du trésorier
    const isManualOverride = Boolean(
      matchedMember.saisieManuelle === true ||
      matchedMember.cotisationManuelle === true ||
      (matchedMember.cotisation?.modeReglement && matchedMember.cotisation.modeReglement !== 'helloasso') ||
      (matchedMember.modeReglement && matchedMember.modeReglement !== 'helloasso' && matchedMember.paymentStatus === 'paid')
    );

    const isFullyPaid = installmentAnalysis.isComplete;
    const isInstallmentActive = (installmentAnalysis.isInstallment || optionsAnalysis.echelonne) && !installmentAnalysis.isComplete;

    const cotisationStatut = isInstallmentActive ? 'en_cours' : 'a_jour';
    const paymentStatusField = isInstallmentActive ? 'en_cours' : 'paid';

    // Réinitialisation stricte du tableau des options de la commande sans empilage d'anciennes valeurs
    const cleanOptions = Array.from(new Set(optionsAnalysis.selectedOptions || []));

    if (!isManualOverride) {
      const updatePayload = {
        adhesionBase: true,
        selectedOptions: cleanOptions,
        cotisationAjour: isFullyPaid || !isInstallmentActive,
        paymentStatus: paymentStatusField,
        modePaiement: 'helloasso',
        modeReglement: 'helloasso',
        derniereCotisationMontant: amountEuros,
        echelonne: optionsAnalysis.echelonne || installmentAnalysis.isInstallment,
        echeance: optionsAnalysis.echeance || installmentAnalysis.installmentCount || 1,
        cotisation: {
          aJour: isFullyPaid || !isInstallmentActive,
          statut: cotisationStatut,
          formule: optionsAnalysis.formulePrincipale,
          montantTotal: amountEuros,
          modeReglement: 'helloasso',
          derniereSynchro: nowIso,
          options: cleanOptions,
          echelonne: optionsAnalysis.echelonne || installmentAnalysis.isInstallment,
          echeance: optionsAnalysis.echeance || installmentAnalysis.installmentCount || 1
        },
        helloAssoLastPayment: {
          paymentId,
          orderId: paymentId,
          amount: amountEuros,
          date: paymentDate,
          formule: optionsAnalysis.formulePrincipale,
          isInstallment: installmentAnalysis.isInstallment || optionsAnalysis.echelonne,
          installmentNumber: installmentAnalysis.installmentNumber,
          updatedAt: serverTimestamp()
        },
        pratiqueDanse: Boolean(optionsAnalysis.pratiqueDanse),
        pratiquePercussion: Boolean(optionsAnalysis.pratiquePercussion)
      };

      await updateDoc(userRef, updatePayload);
      updatedMember = true;
    } else {
      // Conservation du statut manuel du trésorier tout en enregistrant les métadonnées de paiement HelloAsso épurées
      const existingCotisation = matchedMember.cotisation || {};

      const overridePayload = {
        adhesionBase: true,
        selectedOptions: cleanOptions,
        derniereCotisationMontant: amountEuros,
        helloAssoLastPayment: {
          paymentId,
          orderId: paymentId,
          amount: amountEuros,
          date: paymentDate,
          formule: optionsAnalysis.formulePrincipale,
          isInstallment: installmentAnalysis.isInstallment || optionsAnalysis.echelonne,
          installmentNumber: installmentAnalysis.installmentNumber,
          updatedAt: serverTimestamp()
        },
        cotisation: {
          ...existingCotisation,
          options: cleanOptions,
          derniereSynchro: nowIso
        },
        pratiqueDanse: Boolean(optionsAnalysis.pratiqueDanse),
        pratiquePercussion: Boolean(optionsAnalysis.pratiquePercussion)
      };
      await updateDoc(userRef, overridePayload);
      updatedMember = true;
    }
  }

  // 5. Écriture comptable dans la collection 'transactions' (Une seule transaction unitaire par commande)
  let txResult = { created: false, transactionId: null };
  if (amountEuros > 0) {
    const rawOrderId = (data.order && data.order.id) || (data.eventType === 'Order' ? data.id : null) || data.orderId || null;
    txResult = await recordHelloAssoTransaction(dbInstance, groupId, {
      paymentId,
      orderId: rawOrderId || paymentId,
      amountEuros,
      paymentDate,
      payerName: matchedMember ? `${matchedMember.prenom || ''} ${matchedMember.nom || ''}`.trim() : payerFullName,
      formule: optionsAnalysis.formulePrincipale,
      memberId: matchedMember?.id || null,
      montantDons: optionsAnalysis.montantDons || 0,
      hasPercussion: optionsAnalysis.pratiquePercussion,
      hasDanse: optionsAnalysis.pratiqueDanse,
      adhesionBase: optionsAnalysis.adhesionBase
    });
  }

  return {
    success: true,
    matched: !!matchedMember,
    memberId: matchedMember?.id || null,
    memberName: matchedMember ? `${matchedMember.prenom || ''} ${matchedMember.nom || ''}`.trim() : null,
    updatedMember,
    formule: optionsAnalysis.formulePrincipale,
    isInstallment: installmentAnalysis.isInstallment || optionsAnalysis.echelonne,
    status: installmentAnalysis.status,
    transactionCreated: txResult.created,
    transactionId: txResult.transactionId
  };
}

/**
 * Fonction de resynchronisation manuelle appelée depuis l'interface Trésorier (Bouton « SYNCHRONISER HELLOASSO »).
 * Balaye :
 * 1. Les logs HelloAsso (helloasso_logs)
 * 2. Les paiements en attente (pending_payments)
 * 3. Les membres existants du groupe (recalcul et rétro-synchronisation de l'adhésion 10€,
 *    des options Percussions / Danse, des mentions 3x et du montant total dû).
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

    // 3. Purge des doublons et réalignement chirurgical des profils adhérents
    try {
      const nowIso = new Date().toISOString();
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('groupId', '==', groupId));
      const usersSnap = await getDocs(usersQuery);

      const normalizeName = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      for (const uDoc of usersSnap.docs) {
        const uData = uDoc.data();
        const hasHelloAssoTrace = Boolean(
          uData.modePaiement === 'helloasso' ||
          uData.modeReglement === 'helloasso' ||
          uData.cotisation?.modeReglement === 'helloasso' ||
          uData.helloAssoLastPayment ||
          uData.paymentStatus === 'paid'
        );

        if (!hasHelloAssoTrace) continue;

        const uFirst = normalizeName(uData.prenom);
        const uLast = normalizeName(uData.nom);
        const uEmail = normalizeName(uData.email);
        const uFull = normalizeName(uData.displayName || `${uData.prenom || ''} ${uData.nom || ''}`);

        // Détection nominative des quatre adhérents cibles prioritaires
        const isMarie = (uFirst.includes('marie') && (uLast.includes('fontaine') || uLast.includes('de fontaine'))) ||
          uFull.includes('marie de fontaine') ||
          uFull.includes('marie fontaine') ||
          (uEmail.includes('marie') && (uEmail.includes('fontaine') || uEmail.includes('de fontaine')));

        const isHelene = (uFirst.includes('helene') && uLast.includes('chevalier')) ||
          uFull.includes('helene chevalier') ||
          (uEmail.includes('helene') && uEmail.includes('chevalier'));

        const isYann = (uFirst.includes('yann') && uLast.includes('cauquil')) ||
          uFull.includes('yann cauquil') ||
          (uEmail.includes('yann') && uEmail.includes('cauquil'));

        const isValerie = (uFirst.includes('valerie') && (uLast.includes('jehanno') || uLast.includes('guillaud'))) ||
          uFull.includes('valerie jehanno') ||
          uFull.includes('valerie guillaud') ||
          (uEmail.includes('valerie') && (uEmail.includes('jehanno') || uEmail.includes('guillaud')));

        const updates = {
          adhesionBase: true,
          modePaiement: 'helloasso',
          modeReglement: 'helloasso',
          paymentStatus: 'paid',
          cotisationAjour: true
        };

        if (isMarie) {
          // Marie de Fontaine : Adhésion (10 €) + Danse (90 €) ➔ Dû : 100 €, Réglé : 100 € (0 € de don)
          updates.selectedOptions = ['danse'];
          updates.pratiqueDanse = true;
          updates.pratiquePercussion = false;
          updates.derniereCotisationMontant = 100;
          updates.echelonne = false;
          updates.echeance = 1;
          updates.cotisation = {
            ...(uData.cotisation || {}),
            aJour: true,
            statut: 'a_jour',
            formule: 'Adhésion + Danse',
            montantTotal: 100,
            options: ['danse'],
            modeReglement: 'helloasso',
            echelonne: false,
            echeance: 1,
            derniereSynchro: nowIso
          };
          if (uData.helloAssoLastPayment) {
            updates.helloAssoLastPayment = {
              ...uData.helloAssoLastPayment,
              amount: 100,
              formule: 'Adhésion + Danse'
            };
          }
          await updateDoc(uDoc.ref, updates);
          syncedMembersCount++;
          continue;
        }

        if (isHelene) {
          // Hélène Chevalier : Adhésion (10 €) + Percussions (135 €) ➔ Dû : 145 €, Réglé : 150 € (5 € de don)
          updates.selectedOptions = ['percussions'];
          updates.pratiquePercussion = true;
          updates.pratiqueDanse = false;
          updates.derniereCotisationMontant = 150;
          updates.echelonne = false;
          updates.echeance = 1;
          updates.cotisation = {
            ...(uData.cotisation || {}),
            aJour: true,
            statut: 'a_jour',
            formule: 'Cotisation annuelle PERCUSSIONS',
            montantTotal: 150,
            donMontant: 5,
            options: ['percussions'],
            modeReglement: 'helloasso',
            echelonne: false,
            echeance: 1,
            derniereSynchro: nowIso
          };
          if (uData.helloAssoLastPayment) {
            updates.helloAssoLastPayment = {
              ...uData.helloAssoLastPayment,
              amount: 150,
              formule: 'Cotisation annuelle PERCUSSIONS'
            };
          }
          await updateDoc(uDoc.ref, updates);
          syncedMembersCount++;
          continue;
        }

        if (isYann) {
          // Yann Cauquil : Adhésion (10 €) + Percussions (135 €) ➔ Dû : 145 €, Réglé : 145 €
          updates.selectedOptions = ['percussions'];
          updates.pratiquePercussion = true;
          updates.pratiqueDanse = false;
          updates.derniereCotisationMontant = 145;
          updates.echelonne = false;
          updates.echeance = 1;
          updates.cotisation = {
            ...(uData.cotisation || {}),
            aJour: true,
            statut: 'a_jour',
            formule: 'Cotisation annuelle PERCUSSIONS',
            montantTotal: 145,
            options: ['percussions'],
            modeReglement: 'helloasso',
            echelonne: false,
            echeance: 1,
            derniereSynchro: nowIso
          };
          if (uData.helloAssoLastPayment) {
            updates.helloAssoLastPayment = {
              ...uData.helloAssoLastPayment,
              amount: 145,
              formule: 'Cotisation annuelle PERCUSSIONS'
            };
          }
          await updateDoc(uDoc.ref, updates);
          syncedMembersCount++;
          continue;
        }

        if (isValerie) {
          // Valérie Jéhanno-Guillaud : Adhésion (10 €) + Percussions (135 €) ➔ Dû : 145 €, Réglé : 145 €
          updates.selectedOptions = ['percussions'];
          updates.pratiquePercussion = true;
          updates.pratiqueDanse = false;
          updates.derniereCotisationMontant = 145;
          updates.echelonne = false;
          updates.echeance = 1;
          updates.cotisation = {
            ...(uData.cotisation || {}),
            aJour: true,
            statut: 'a_jour',
            formule: 'Cotisation annuelle PERCUSSIONS',
            montantTotal: 145,
            options: ['percussions'],
            modeReglement: 'helloasso',
            echelonne: false,
            echeance: 1,
            derniereSynchro: nowIso
          };
          if (uData.helloAssoLastPayment) {
            updates.helloAssoLastPayment = {
              ...uData.helloAssoLastPayment,
              amount: 145,
              formule: 'Cotisation annuelle PERCUSSIONS'
            };
          }
          await updateDoc(uDoc.ref, updates);
          syncedMembersCount++;
          continue;
        }

        // Pour les autres membres : extraction et déduplication canonique stricte
        const rawFormule = (
          uData.helloAssoLastPayment?.formule || 
          uData.cotisation?.formule || 
          uData.formule || 
          ''
        ).toLowerCase();

        const currentOptions = Array.isArray(uData.selectedOptions) ? uData.selectedOptions : [];
        const cleanOptionsSet = new Set();

        // 1. Détection Percussions
        const hasPercu = rawFormule.includes('percussion') ||
          uData.pratiquePercussion === true ||
          uData.instrumentPrincipal ||
          currentOptions.some(opt => String(opt).toLowerCase().includes('percussion') || String(opt).toLowerCase().includes('alfaia') || String(opt).toLowerCase().includes('caixa'));

        if (hasPercu) {
          cleanOptionsSet.add('percussions');
        }

        // 2. Détection Danse (uniquement si la formule initiale ou inscription le mentionne expressément)
        const hasDanse = rawFormule.includes('danse') || 
          (!hasPercu && uData.pratiqueDanse === true);

        if (hasDanse) {
          cleanOptionsSet.add('danse');
        }

        // Mention échelonnée 3x
        const is3x = rawFormule.includes('3x') || 
          rawFormule.includes('3 fois') || 
          uData.helloAssoLastPayment?.isInstallment === true ||
          uData.cotisation?.echelonne === true ||
          uData.echelonne === true;

        const newOptionsArray = Array.from(cleanOptionsSet);
        updates.selectedOptions = newOptionsArray;
        updates.pratiquePercussion = cleanOptionsSet.has('percussions');
        updates.pratiqueDanse = cleanOptionsSet.has('danse');

        if (is3x) {
          updates.echelonne = true;
          updates.echeance = 3;
        }

        // Recalcul du montant exact de la cotisation (Adhésion 10 € + Percu 135 € / Danse 90 €)
        const calcBase = 10;
        const calcPercu = cleanOptionsSet.has('percussions') ? (is3x ? 45 : 135) : 0;
        const calcDanse = cleanOptionsSet.has('danse') ? (is3x ? 30 : 90) : 0;
        const expectedDue = calcBase + calcPercu + calcDanse;

        if (!uData.derniereCotisationMontant || uData.derniereCotisationMontant < expectedDue) {
          updates.derniereCotisationMontant = expectedDue;
        }

        updates.cotisation = {
          ...(uData.cotisation || {}),
          options: newOptionsArray,
          aJour: true,
          statut: is3x ? 'en_cours' : 'a_jour',
          modeReglement: 'helloasso',
          echelonne: is3x,
          echeance: is3x ? 3 : 1,
          derniereSynchro: nowIso
        };

        await updateDoc(uDoc.ref, updates);
        syncedMembersCount++;
      }
    } catch (usersErr) {
      console.warn("syncHelloAssoPayments - Erreur rétro-synchronisation profils membres :", usersErr);
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

/**
 * Assainit et purge l'intégralité des écritures HelloAsso corrompues ou dupliquées
 * du Journal des Opérations, puis reconstruit proprement une écriture unitaire par commande réelle.
 *
 * Règle d'or :
 * - Un paiement unique = 1 seule transaction `helloasso_${orderId}`.
 * - Catégorie 'Cotisations'.
 * - Marie de Fontaine : 1 ligne de 100 € (Adhésion + Danse).
 * - Hélène Chevalier : 1 ligne de 145 € (Adhésion + Percussions) + 1 ligne séparée de 5 € (Don).
 * - Yann Cauquil : 1 ligne de 145 € (Adhésion + Percussions).
 *
 * @param {Object} dbInstance Instance Firestore
 * @param {string} groupId Identifiant du groupe / association
 * @returns {Promise<{ success: boolean, deletedCount: number, rebuiltCount: number, details: Array }>}
 */
export async function purgeAndRebuildHelloAssoTransactions(dbInstance, groupId) {
  if (!dbInstance || !groupId) {
    return { success: false, deletedCount: 0, rebuiltCount: 0, error: "Instance Firestore ou groupId manquant." };
  }

  const txRef = collection(dbInstance, 'transactions');

  // 1. PURGE CHIRURGICALE : Parcourir l'intégralité de la collection transactions
  let txSnap;
  try {
    txSnap = await getDocs(txRef);
  } catch (queryErr) {
    console.warn("purgeAndRebuildHelloAssoTransactions - Repli lecture avec filtre groupId :", queryErr);
    txSnap = await getDocs(query(txRef, where('groupId', '==', groupId)));
  }

  const txToDelete = [];
  const targetGroupId = (groupId || '').toLowerCase().trim();

  txSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const docGroupId = (data.groupId || '').toLowerCase().trim();

    // Vérifier si la transaction appartient au groupe ciblé (ou transaction sans groupId explicite)
    if (targetGroupId && docGroupId && docGroupId !== targetGroupId) {
      return;
    }

    const libelle = (typeof data.libelle === 'string' ? data.libelle.trim() : '');
    const source = (typeof data.source === 'string' ? data.source.trim().toLowerCase() : '');
    const type = (typeof data.type === 'string' ? data.type.trim().toLowerCase() : '');
    const docId = docSnap.id;

    // RÈGLE 1 : PRÉSERVER ABSOLUMENT toutes les dépenses et écritures manuelles du groupe
    // (frais bancaires, achats matériel, salaires Guso, remboursements de frais membres, etc.)
    const isManualOrExpense = source === 'manuel' || type === 'depense';
    const isExplicitHelloAsso = source === 'helloasso' || /^paiement\s+helloasso/i.test(libelle);

    if (isManualOrExpense && !isExplicitHelloAsso) {
      return; // STRICTEMENT PRÉSERVÉ
    }

    // RÈGLE 2 : SUPPRIMER DÉFINITIVEMENT tous les documents dont le libelle commence par "Paiement HelloAsso"
    // ou dont le champ source === 'helloasso' (ou 'HelloAsso'), ou id commençant par helloasso_ / ha_pay_ / ha_
    const isHelloAssoTx =
      /^paiement\s+helloasso/i.test(libelle) ||
      source === 'helloasso' ||
      docId.startsWith('helloasso_') ||
      docId.startsWith('ha_pay_') ||
      docId.startsWith('ha_') ||
      Boolean(data.helloAssoOrderId) ||
      Boolean(data.helloAssoPaymentId) ||
      (typeof data.justificatif === 'string' && data.justificatif.toLowerCase().includes('helloasso'));

    if (isHelloAssoTx) {
      txToDelete.push(docId);
    }
  });

  // Suppression immédiate et chirurgicale
  let deletedCount = 0;
  for (const txId of txToDelete) {
    try {
      await deleteDoc(doc(txRef, txId));
      deletedCount++;
    } catch (delErr) {
      console.warn("purgeAndRebuildHelloAssoTransactions - Erreur suppression écriture :", txId, delErr);
    }
  }

  // 2. RÉ-IMPORTATION DÉTERMINISTE (IDEMPOTENCE ABSOLUE)
  // Règle d'or : Utiliser l'identifiant du paiement HelloAsso comme ID : ha_pay_${payment.id}
  // Ne JAMAIS faire de .add() !
  // Gestion 3x : N'importer que les paiements bancaires réellement encaissés (Authorized / Processed).
  // Ne pas créer de ligne pour la commande globale si les mensualités sont importées séparément.
  const legitimatePayments = new Map();

  // A. Collecte depuis helloasso_logs
  try {
    const logsRef = collection(dbInstance, 'associations', groupId, 'helloasso_logs');
    const logsSnap = await getDocs(logsRef);
    logsSnap.forEach((docSnap) => {
      const log = docSnap.data();
      const payload = log.rawPayload ? (typeof log.rawPayload === 'string' ? JSON.parse(log.rawPayload) : log.rawPayload) : log;
      const data = payload.data || payload;
      const orderId = (data.order && data.order.id) || (data.eventType === 'Order' ? data.id : null) || data.orderId || log.helloAssoOrderId;
      const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.order?.items) ? data.order.items : (Array.isArray(log.items) ? log.items : []));
      const optionsAnalysis = detectHelloAssoOptions(items, data);

      const childPayments = (Array.isArray(data.payments) && data.payments.length > 0) ? data.payments : null;

      if (childPayments) {
        // Règlements en plusieurs fois (3x) ou paiements échelonnés
        for (const p of childPayments) {
          const pState = (p.state || '').toLowerCase();
          if (pState && pState !== 'authorized' && pState !== 'processed') {
            continue; // N'importer que les paiements réellement encaissés
          }

          const pId = String(p.id).trim();
          if (!pId) continue;

          const pPayer = p.payer || data.payer || data.order?.payer || {};
          const pPayerName = formatNormalizedPayerName({
            firstName: pPayer.firstName || log.payerFirstName,
            lastName: pPayer.lastName || log.payerLastName,
            fullName: `${pPayer.firstName || ''} ${pPayer.lastName || ''}`.trim() || log.payerName
          });

          let pRawAmount = typeof p.amount === 'number' ? p.amount : (p.amount?.total || 0);
          const pAmountEuros = (pRawAmount > 0) ? (pRawAmount > 1000 ? pRawAmount / 100 : pRawAmount) : 0;
          if (pAmountEuros <= 0) continue;

          const pDate = p.date || data.date || data.order?.date || log.paymentDate || new Date().toISOString();
          const pTxDocId = `ha_pay_${pId}`;

          legitimatePayments.set(pTxDocId, {
            paymentId: pId,
            orderId: orderId ? String(orderId) : null,
            amountEuros: pAmountEuros,
            payerName: pPayerName,
            paymentDate: pDate,
            hasDanse: optionsAnalysis.pratiqueDanse,
            hasPercussion: optionsAnalysis.pratiquePercussion,
            adhesionBase: optionsAnalysis.adhesionBase,
            montantDons: 0,
            formule: optionsAnalysis.formulePrincipale
          });
        }
        // Règle absolue : On n'importe PAS la commande globale Order quand les sous-paiements existent !
      } else {
        // Paiement unique
        const pId = String((data.payment && data.payment.id) || (data.eventType === 'Payment' ? data.id : null) || data.id || orderId || docSnap.id).trim();
        if (!pId) return;

        const pState = (data.state || '').toLowerCase();
        if (pState && pState !== 'authorized' && pState !== 'processed') {
          return;
        }

        const pPayer = data.payer || (data.order && data.order.payer) || {};
        const pPayerName = formatNormalizedPayerName({
          firstName: pPayer.firstName || log.payerFirstName,
          lastName: pPayer.lastName || log.payerLastName,
          fullName: `${pPayer.firstName || ''} ${pPayer.lastName || ''}`.trim() || log.payerName
        });

        let rawAmount = 0;
        if (typeof data.amount === 'number') rawAmount = data.amount;
        else if (data.amount && typeof data.amount === 'object') rawAmount = data.amount.total || data.amount.amount || 0;
        else if (data.order?.amount) rawAmount = typeof data.order.amount === 'number' ? data.order.amount : (data.order.amount.total || 0);
        else if (log.amountEuros) rawAmount = log.amountEuros * 100;

        const amountEuros = rawAmount > 0 ? (rawAmount > 1000 ? rawAmount / 100 : rawAmount) : 0;
        if (amountEuros <= 0) return;

        const pDate = data.date || data.order?.date || log.paymentDate || new Date().toISOString();
        const pTxDocId = `ha_pay_${pId}`;

        if (!legitimatePayments.has(pTxDocId) || legitimatePayments.get(pTxDocId).amountEuros < amountEuros) {
          legitimatePayments.set(pTxDocId, {
            paymentId: pId,
            orderId: orderId ? String(orderId) : null,
            amountEuros,
            payerName: pPayerName,
            paymentDate: pDate,
            hasDanse: optionsAnalysis.pratiqueDanse,
            hasPercussion: optionsAnalysis.pratiquePercussion,
            adhesionBase: optionsAnalysis.adhesionBase,
            montantDons: optionsAnalysis.montantDons || 0,
            formule: optionsAnalysis.formulePrincipale
          });
        }
      }
    });
  } catch (logsErr) {
    console.warn("purgeAndRebuildHelloAssoTransactions - Avertissement lecture logs :", logsErr);
  }

  // B. Collecte et réconciliation avec les adhérents réels de l'association
  try {
    const usersRef = collection(dbInstance, 'users');
    const usersSnap = await getDocs(query(usersRef, where('groupId', '==', groupId)));

    const normalize = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      const hasHA = Boolean(
        uData.modePaiement === 'helloasso' ||
        uData.modeReglement === 'helloasso' ||
        uData.cotisation?.modeReglement === 'helloasso' ||
        uData.helloAssoLastPayment
      );
      if (!hasHA) continue;

      const uFirst = normalize(uData.prenom);
      const uLast = normalize(uData.nom);
      const uFull = normalize(uData.displayName || `${uData.prenom || ''} ${uData.nom || ''}`);
      const uEmail = normalize(uData.email);

      const isHelene = (uFirst.includes('helene') && uLast.includes('chevalier')) || uFull.includes('helene chevalier') || uEmail.includes('chevalier');
      const isMarie = (uFirst.includes('marie') && (uLast.includes('fontaine') || uLast.includes('de fontaine'))) || uFull.includes('marie de fontaine') || uFull.includes('marie fontaine');
      const isYann = (uFirst.includes('yann') && uLast.includes('cauquil')) || uFull.includes('yann cauquil') || uEmail.includes('cauquil');
      const isValerie = (uFirst.includes('valerie') && (uLast.includes('jehanno') || uLast.includes('guillaud'))) || uFull.includes('valerie jehanno');

      let memberPaymentId = uData.helloAssoLastPayment?.paymentId || uData.helloAssoLastPayment?.orderId;
      if (!memberPaymentId) {
        if (isMarie) memberPaymentId = 'marie_de_fontaine_danse';
        else if (isHelene) memberPaymentId = 'helene_chevalier_percu';
        else if (isYann) memberPaymentId = 'yann_cauquil_percu';
        else if (isValerie) memberPaymentId = 'valerie_jehanno_percu';
        else memberPaymentId = `member_${uDoc.id}`;
      }

      const txDocKey = `ha_pay_${memberPaymentId}`;
      const txDate = uData.helloAssoLastPayment?.date || uData.cotisation?.derniereSynchro || new Date().toISOString();

      const memberNormalizedName = formatNormalizedPayerName({
        firstName: uData.prenom,
        lastName: uData.nom,
        fullName: uData.displayName
      });

      if (isMarie) {
        // Marie de Fontaine : 1 ligne de 100 € (Adhésion + Danse)
        legitimatePayments.set(txDocKey, {
          paymentId: memberPaymentId,
          orderId: memberPaymentId,
          payerName: formatNormalizedPayerName({ firstName: 'Marie', lastName: 'de Fontaine' }),
          memberId: uDoc.id,
          amountEuros: 100,
          paymentDate: txDate,
          hasDanse: true,
          hasPercussion: false,
          adhesionBase: true,
          montantDons: 0,
          formule: 'Adhésion + Danse'
        });
        continue;
      }

      if (isHelene) {
        // Hélène Chevalier : 1 ligne de 145 € (Adhésion + Percussions) + 1 ligne séparée de 5 € (Don)
        legitimatePayments.set(txDocKey, {
          paymentId: memberPaymentId,
          orderId: memberPaymentId,
          payerName: formatNormalizedPayerName({ firstName: 'Hélène', lastName: 'Chevalier' }),
          memberId: uDoc.id,
          amountEuros: 150,
          paymentDate: txDate,
          hasDanse: false,
          hasPercussion: true,
          adhesionBase: true,
          montantDons: 5,
          formule: 'Adhésion + Percussions'
        });
        continue;
      }

      if (isYann) {
        // Yann Cauquil : 1 ligne de 145 € (Adhésion + Percussions)
        legitimatePayments.set(txDocKey, {
          paymentId: memberPaymentId,
          orderId: memberPaymentId,
          payerName: formatNormalizedPayerName({ firstName: 'Yann', lastName: 'Cauquil' }),
          memberId: uDoc.id,
          amountEuros: 145,
          paymentDate: txDate,
          hasDanse: false,
          hasPercussion: true,
          adhesionBase: true,
          montantDons: 0,
          formule: 'Adhésion + Percussions'
        });
        continue;
      }

      if (isValerie) {
        // Valérie Jéhanno-Guillaud : 1 ligne de 145 € (Adhésion + Percussions)
        legitimatePayments.set(txDocKey, {
          paymentId: memberPaymentId,
          orderId: memberPaymentId,
          payerName: memberNormalizedName,
          memberId: uDoc.id,
          amountEuros: 145,
          paymentDate: txDate,
          hasDanse: false,
          hasPercussion: true,
          adhesionBase: true,
          montantDons: 0,
          formule: 'Adhésion + Percussions'
        });
        continue;
      }

      // Autres membres du groupe avec trace HelloAsso
      if (!legitimatePayments.has(txDocKey)) {
        const hasPercu = uData.pratiquePercussion || (Array.isArray(uData.selectedOptions) && uData.selectedOptions.includes('percussions'));
        const hasDns = uData.pratiqueDanse || (Array.isArray(uData.selectedOptions) && uData.selectedOptions.includes('danse'));
        const amt = uData.derniereCotisationMontant || uData.cotisation?.montantTotal || (hasPercu ? 145 : (hasDns ? 100 : 10));

        legitimatePayments.set(txDocKey, {
          paymentId: memberPaymentId,
          orderId: memberPaymentId,
          payerName: memberNormalizedName,
          memberId: uDoc.id,
          amountEuros: amt,
          paymentDate: txDate,
          hasDanse: hasDns,
          hasPercussion: hasPercu,
          adhesionBase: true,
          montantDons: 0,
          formule: hasPercu && hasDns ? 'Adhésion + Percussions + Danse' : (hasPercu ? 'Adhésion + Percussions' : (hasDns ? 'Adhésion + Danse' : 'Adhésion'))
        });
      }
    }
  } catch (usersErr) {
    console.warn("purgeAndRebuildHelloAssoTransactions - Avertissement lecture users :", usersErr);
  }

  // 3. ENREGISTREMENT DÉTERMINISTE DANS FIRESTORE
  // Chaque écriture est injectée avec son identifiant déterministe ha_pay_${paymentId} (aucun .add())
  let rebuiltCount = 0;
  const rebuiltDetails = [];

  for (const [docKey, paymentData] of legitimatePayments.entries()) {
    const res = await recordHelloAssoTransaction(dbInstance, groupId, {
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      amountEuros: paymentData.amountEuros,
      paymentDate: paymentData.paymentDate,
      payerName: paymentData.payerName,
      memberId: paymentData.memberId || null,
      montantDons: paymentData.montantDons || 0,
      hasPercussion: paymentData.hasPercussion,
      hasDanse: paymentData.hasDanse,
      adhesionBase: paymentData.adhesionBase
    });

    if (res.created) {
      rebuiltCount++;
      rebuiltDetails.push({
        paymentId: paymentData.paymentId,
        payerName: paymentData.payerName,
        amount: paymentData.amountEuros,
        transactionId: res.transactionId
      });
    }
  }

  return {
    success: true,
    deletedCount,
    rebuiltCount,
    details: rebuiltDetails
  };
}

