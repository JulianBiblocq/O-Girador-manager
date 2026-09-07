/**
 * Utilitaire de sécurisation et d'assainissement des données pour Firestore.
 * Élimine récursivement toutes les clés dont la valeur est `undefined`
 * afin d'éviter les rejets et exceptions bloquantes du SDK Firebase.
 *
 * @param {any} obj Payload ou fragment de données à nettoyer
 * @returns {any} Copie nettoyée de l'objet
 */
export function cleanFirestorePayload(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }

  // Préservation des types primitifs et des instances spéciales
  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  // Traitement des tableaux : filtrer les éléments undefined et assainir les enfants
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanFirestorePayload(item));
  }

  // Traitement des objets ordinaires
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = (typeof value === 'object' && value !== null && !(value instanceof Date))
        ? cleanFirestorePayload(value)
        : value;
    }
  }

  return cleaned;
}
