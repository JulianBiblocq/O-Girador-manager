/**
 * Utilitaires de résolution et normalisation canonique des identifiants d'organisation (Multi-Tenants).
 */

/**
 * Normalise un identifiant d'organisation vers sa casse canonique reconnue par Firestore.
 * Par exemple, 'samambaia' (provenant d'un sous-domaine DNS ou d'un paramètre d'URL) est normalisé en 'Samambaia'.
 * 
 * @param {string|null|undefined} groupId - L'identifiant brut du groupe
 * @returns {string|null|undefined} L'identifiant normalisé canonique
 */
export function canonicalizeGroupId(groupId) {
  if (!groupId || typeof groupId !== 'string') return groupId;
  const trimmed = groupId.trim();
  if (trimmed.toLowerCase() === 'samambaia') {
    return 'Samambaia';
  }
  return trimmed;
}

/**
 * Vérifie si deux identifiants de groupe sont équivalents (insensible à la casse).
 * 
 * @param {string|null|undefined} g1 
 * @param {string|null|undefined} g2 
 * @returns {boolean}
 */
export function isSameGroupCaseInsensitive(g1, g2) {
  if (!g1 || !g2) return g1 === g2;
  return String(g1).trim().toLowerCase() === String(g2).trim().toLowerCase();
}
