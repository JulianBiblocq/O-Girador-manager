/**
 * Module HelloAsso pour les Cloud Functions Firebase.
 * Gère le mapping des options, paiements 3x et la réconciliation adhérents.
 */

/**
 * Détecte les options d'adhésion et matérielles depuis les items HelloAsso.
 */
function detectHelloAssoOptions(items = [], rawData = {}) {
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

    detailsOptions.push({
      name: rawName,
      type: itemType,
      amount: amountEuros
    });

    if (itemType === 'donation' || cleanNameLower.includes('don ') || cleanNameLower === 'don' || cleanNameLower.includes('pourboire')) {
      montantDons += amountEuros;
      continue;
    }

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
