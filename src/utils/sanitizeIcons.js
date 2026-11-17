/**
 * Utilitaires centralisés d'assainissement et d'interdiction des émojis mégaphone système (bleu-blanc-rouge sur Apple/iOS).
 */

export const FORBIDDEN_MEGAPHONE_REGEX = /[\u{1F4E2}\u{1F4E3}]\uFE0F?/gu;

/**
 * Supprime les émojis mégaphone interdits d'une chaîne de caractères.
 * @param {string} str Chaîne d'entrée
 * @returns {string} Chaîne nettoyée
 */
export function stripForbiddenMegaphones(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(FORBIDDEN_MEGAPHONE_REGEX, '');
}

/**
 * Retourne `true` si la valeur contient l'un des émojis mégaphone interdits.
 * @param {string} str Chaîne à tester
 * @returns {boolean}
 */
export function isForbiddenMegaphone(str) {
  if (typeof str !== 'string' || !str) return false;
  return /[\u{1F4E2}\u{1F4E3}]\uFE0F?/u.test(str);
}
