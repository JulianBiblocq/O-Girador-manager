/**
 * Utilitaire de sécurisation et d'assainissement des données pour Firestore.
 * Élimine récursivement toutes les clés dont la valeur est `undefined` (et optionnellement `null`)
 * afin d'éviter les rejets et exceptions bloquantes du SDK Firebase ou des règles de sécurité.
 *
 * @param {any} obj Payload ou fragment de données à nettoyer
 * @param {Object} [options] Options d'assainissement
 * @param {boolean} [options.removeNull=false] Supprime également les valeurs nulles si true
 * @returns {any} Copie nettoyée de l'objet
 */
export function cleanFirestorePayload(obj, { removeNull = false } = {}) {
  if (obj === undefined || (removeNull && obj === null)) {
    return null;
  }
  if (obj === null) {
    return null;
  }

  // Préservation des types primitifs et des instances spéciales (Date, Timestamp, etc.)
  if (typeof obj !== 'object' || obj instanceof Date || (obj && typeof obj.toDate === 'function')) {
    return obj;
  }

  // Traitement des tableaux : filtrer les éléments non désirés et assainir les enfants
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined && (!removeNull || item !== null))
      .map(item => cleanFirestorePayload(item, { removeNull }));
  }

  // Traitement des objets ordinaires
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && (!removeNull || value !== null)) {
      cleaned[key] = (typeof value === 'object' && value !== null && !(value instanceof Date) && typeof value.toDate !== 'function')
        ? cleanFirestorePayload(value, { removeNull })
        : value;
    }
  }

  return cleaned;
}

/**
 * Assainisseur strict dédié aux écritures sur la collection 'users/{uid}'.
 * Supprime systématiquement les propriétés 'undefined' et 'null'
 * pour garantir une écriture 100% conforme aux règles Firestore.
 *
 * @param {Object} userDoc Payload utilisateur
 * @returns {Object} Payload assaini
 */
export function sanitizeUserDocPayload(userDoc) {
  if (!userDoc || typeof userDoc !== 'object') return {};
  return cleanFirestorePayload(userDoc, { removeNull: true }) || {};
}
