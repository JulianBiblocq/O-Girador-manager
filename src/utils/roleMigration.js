/**
 * Utilitaire de migration des Rôles et des Étiquettes (Tags).
 * Garantit que les rôles système sont strictement limités à 'mestre', 'admin' et 'membre'.
 * Les titres de fonction associative comme 'Trésorier', 'Logistique', 'Président', 'Secrétaire', etc. sont basculés dans les étiquettes.
 */

export const VALID_SYSTEM_ROLES = ['mestre', 'admin', 'membre'];

/**
 * Normalise les rôles obsolètes ou personnalisés vers des rôles système valides et des étiquettes.
 * @param {Object} userData - Objet document utilisateur contenant le rôle et les étiquettes
 * @returns {{ newRole: string, newTags: Array<string>, needsMigration: boolean }}
 */
export function getMigratedRoleAndTags(userData) {
  const rawRole = (userData?.role || 'membre').trim();
  const currentTags = Array.isArray(userData?.tags) ? [...userData.tags] : [];

  const lowerRole = rawRole.toLowerCase();

  // Si c'est déjà un rôle système valide
  if (VALID_SYSTEM_ROLES.includes(lowerRole)) {
    return {
      newRole: lowerRole,
      newTags: currentTags,
      needsMigration: false
    };
  }

  // Gestion du rôle obsolète 'super-admin' mappé vers 'mestre'
  if (lowerRole === 'super-admin') {
    return {
      newRole: 'mestre',
      newTags: currentTags,
      needsMigration: true
    };
  }

  // Sinon, rawRole est un titre de fonction associative (ex: Trésorier, Logistique, etc.)
  let tagToAdd = rawRole;
  if (lowerRole === 'tresorier') tagToAdd = 'Trésorier';
  else if (lowerRole === 'logistique') tagToAdd = 'Logistique';
  else if (lowerRole === 'moderator' || lowerRole === 'modérateur') tagToAdd = 'Modérateur';
  else if (lowerRole === 'president' || lowerRole === 'président') tagToAdd = 'Président';
  else if (lowerRole === 'secretaire' || lowerRole === 'secrétaire') tagToAdd = 'Secrétaire';

  // Mettre la première lettre du badge en majuscule
  if (tagToAdd && typeof tagToAdd === 'string') {
    tagToAdd = tagToAdd.charAt(0).toUpperCase() + tagToAdd.slice(1);
  }

  const updatedTags = [...currentTags];
  if (tagToAdd && !updatedTags.includes(tagToAdd)) {
    updatedTags.push(tagToAdd);
  }

  // Les fonctions de gestion et d'administration s'associent au droit système 'admin'
  const adminKeywords = ['tresorier', 'trésorier', 'logistique', 'bureau', 'president', 'président', 'secretaire', 'secrétaire', 'ca', 'moderator', 'modérateur', 'admin'];
  const isManagementFunction = adminKeywords.some(k => lowerRole.includes(k));

  const newRole = isManagementFunction ? 'admin' : 'membre';

  return {
    newRole,
    newTags: updatedTags,
    needsMigration: true
  };
}
