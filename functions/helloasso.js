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
  const matchedOptionIds = new Set();

  for (const item of safeItems) {
    const rawName = (item.name || item.customName || '').trim();
    const cleanNameLower = rawName.toLowerCase();
    const cleanNormalized = normalizeStr(rawName);
    const itemType = (item.type || '').toLowerCase();
    const rawAmount = typeof item.amount === 'number' ? item.amount : (item.amount?.total || 0);
    const amountEuros = rawAmount > 0 ? (rawAmount / 100) : 0;

    detailsOptions.push({
      name: rawName,
      type: itemType,
      amount: amountEuros
    });

    // 1. Détection des dons et pourboires
    if (itemType === 'donation' || cleanNormalized.includes('don ') || cleanNormalized === 'don' || cleanNormalized.includes('pourboire')) {
      montantDons += amountEuros;
      continue;
    }

    // 2. Détection de l'adhésion de base (mots-clés : adhésion, adhesion, cotisation, membership)
    if (
      cleanNormalized.includes('adhesion') ||
      cleanNormalized.includes('cotisation') ||
      itemType === 'membership' ||
      cleanNormalized.includes('adherent') ||
      cleanNormalized.includes('membre')
    ) {
      hasAdhesionBase = true;
    }

    // 3. Détection de la pratique Danse (mots-clés : danse, danseur, danseuse, dansador...)
    if (
      cleanNormalized.includes('danse') ||
      cleanNormalized.includes('danseur') ||
      cleanNormalized.includes('danseuse') ||
      cleanNormalized.includes('dansador')
    ) {
      hasDanse = true;
    }

    // 4. Détection de la pratique Percussion (mots-clés : percussion, batucada, alfaia, caixa, tarol...)
    const isPercussionInstrument = (
      cleanNormalized.includes('percussion') ||
      cleanNormalized.includes('batucada') ||
      cleanNormalized.includes('alfaia') ||
      cleanNormalized.includes('caixa') ||
      cleanNormalized.includes('tarol') ||
      cleanNormalized.includes('gongue') ||
      cleanNormalized.includes('agbe') ||
      cleanNormalized.includes('mineiro') ||
      cleanNormalized.includes('timbal')
    );
    if (isPercussionInstrument) {
      hasPercussion = true;
    }

    // 5. Rapprochement avec les options de cotisation configurées de l'association
    for (const opt of safeConfiguredOptions) {
      const optId = opt?.id || opt?.code;
      if (!optId) continue;
      const optNomNormalized = normalizeStr(opt.nom || opt.name || opt.label || '');
      const optIdNormalized = normalizeStr(optId);

      // Correspondance par nom complet, sous-chaîne significative ou identifiant
      const isNameMatch = optNomNormalized.length >= 3 && (
        cleanNormalized.includes(optNomNormalized) ||
        optNomNormalized.includes(cleanNormalized)
      );
      const isIdMatch = optIdNormalized.length >= 3 && cleanNormalized.includes(optIdNormalized);

      // Correspondance sémantique par famille (ex: option danse <-> item danse, option alfaia <-> item alfaia)
      const isDanseOptionMatch = optNomNormalized.includes('danse') && cleanNormalized.includes('danse');
      const isAlfaiaMatch = optNomNormalized.includes('alfaia') && cleanNormalized.includes('alfaia');
      const isCaixaMatch = optNomNormalized.includes('caixa') && cleanNormalized.includes('caixa');
      const isTarolMatch = optNomNormalized.includes('tarol') && cleanNormalized.includes('tarol');
      const isGongueMatch = optNomNormalized.includes('gongue') && cleanNormalized.includes('gongue');
      const isAgbeMatch = optNomNormalized.includes('agbe') && cleanNormalized.includes('agbe');
      const isCostumeMatch = (optNomNormalized.includes('costume') || optNomNormalized.includes('tenue')) &&
                             (cleanNormalized.includes('costume') || cleanNormalized.includes('tenue') || cleanNormalized.includes('jupe'));

      if (isNameMatch || isIdMatch || isDanseOptionMatch || isAlfaiaMatch || isCaixaMatch || isTarolMatch || isGongueMatch || isAgbeMatch || isCostumeMatch) {
        matchedOptionIds.add(optId);
      }
    }

    // 6. Typage des options additionnelles matérielles / costumes
    const isCostume = cleanNormalized.includes('costume') || cleanNormalized.includes('tenue') || cleanNormalized.includes('t-shirt') || cleanNormalized.includes('jupe') || cleanNormalized.includes('veste');
    const isInstrument = cleanNormalized.includes('instrument') || isPercussionInstrument;

    if (isCostume || isInstrument || cleanNormalized.includes('option') || cleanNormalized.includes('location')) {
      optionsAdditionnelles.push({
        nom: rawName,
        montant: amountEuros,
        categorie: isCostume ? 'costume' : (isInstrument ? 'instrument' : 'autre')
      });
      continue;
    }

    // 7. Détection de la formule d'adhésion principale
    if (!formulePrincipale) {
      if (cleanNormalized.includes('solidaire') || cleanNormalized.includes('reduit') || cleanNormalized.includes('etudiant') || cleanNormalized.includes('chomeur') || cleanNormalized.includes('rsa')) {
        formulePrincipale = rawName || 'Tarif Solidaire / Réduit';
      } else if (cleanNormalized.includes('bienfaiteur') || cleanNormalized.includes('soutien')) {
        formulePrincipale = rawName || 'Adhésion Soutien';
      } else if (cleanNormalized.includes('adhesion') || cleanNormalized.includes('cotisation') || itemType === 'membership') {
        formulePrincipale = rawName || 'Formule Standard';
      }
    }
  }

  // Repli sur le premier item si aucune formule explicite n'a été isolée
  if (!formulePrincipale && safeItems.length > 0) {
    formulePrincipale = safeItems[0].name || 'Adhésion HelloAsso';
  }

  // Si une formule d'adhésion principale est trouvée, considérer l'adhésion de base comme acquise
  if (formulePrincipale) {
    hasAdhesionBase = true;
  }

  return {
    formulePrincipale: formulePrincipale || 'Adhésion Standard',
    optionsAdditionnelles,
    montantDons,
    detailsOptions,
    adhesionBase: hasAdhesionBase,
    pratiqueDanse: hasDanse,
    pratiquePercussion: hasPercussion,
    selectedOptions: Array.from(matchedOptionIds)
  };
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
  findUserIdentifierFromCustomFields
};
