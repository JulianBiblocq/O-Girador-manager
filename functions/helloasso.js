/**
 * Module HelloAsso pour les Cloud Functions Firebase.
 * Gère le mapping des options, paiements 3x et la réconciliation adhérents.
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
 * Détecte les options d'adhésion, les pratiques (danse/percussion) et matérielles depuis les items HelloAsso.
 * Mappe également les identifiants normalisés d'options selon les options configurées de l'association.
 *
 * @param {Array<Object>} items Liste des articles du panier ou de la commande HelloAsso
 * @param {Object} rawData Données brutes de la notification
 * @param {Array<Object>} [configuredOptions=[]] Liste des options configurées dans l'association (optionsCotisation)
 * @returns {Object} Analyse complète des options, drapeaux métier et identifiants
 */
function detectHelloAssoOptions(items = [], rawData = {}, configuredOptions = []) {
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

    // 1. Dons complémentaires (5 €, 10 €, 20 € ou montant libre)
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

  // Détection globale 3x depuis l'ensemble du payload de la commande
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
function formatCapitalizedFirstName(str) {
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
function formatUppercaseLastName(str) {
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
function formatNormalizedPayerName(input) {
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
 */
function formatHelloAssoSyntheticLabel(payerName, { adhesionBase = true, hasPercussion = false, hasDanse = false, options = [] } = {}) {
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
 * Détecte si le paiement est un prélèvement en plusieurs fois (3x).
 */
function detectInstallmentPayment(data = {}) {
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
 * Extrait l'identifiant utilisateur customField.
 */
function findUserIdentifierFromCustomFields(customFields = [], metadata = {}, data = {}) {
  if (metadata?.userId || metadata?.uid || metadata?.user_id) {
    return String(metadata.userId || metadata.uid || metadata.user_id).trim();
  }

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
      if (val && val.length > 5) return val;
    }
  }

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

module.exports = {
  detectHelloAssoOptions,
  detectInstallmentPayment,
  findUserIdentifierFromCustomFields,
  formatCapitalizedFirstName,
  formatUppercaseLastName,
  formatNormalizedPayerName,
  formatHelloAssoSyntheticLabel
};
