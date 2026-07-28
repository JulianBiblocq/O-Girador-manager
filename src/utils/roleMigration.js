/**
 * Role and Tag Migration Utility
 * Ensures that system roles are strictly limited to 'mestre', 'admin', and 'membre'.
 * Function titles like 'Trésorier', 'Logistique', 'Président', 'Secrétaire', etc. are migrated into tags.
 */

export const VALID_SYSTEM_ROLES = ['mestre', 'admin', 'membre'];

/**
 * Normalizes legacy or non-standard roles to valid system roles and tags.
 * @param {Object} userData - User document object containing role and tags
 * @returns {{ newRole: string, newTags: Array<string>, needsMigration: boolean }}
 */
export function getMigratedRoleAndTags(userData) {
  const rawRole = (userData?.role || 'membre').trim();
  const currentTags = Array.isArray(userData?.tags) ? [...userData.tags] : [];

  const lowerRole = rawRole.toLowerCase();

  // If already a valid system role
  if (VALID_SYSTEM_ROLES.includes(lowerRole)) {
    return {
      newRole: lowerRole,
      newTags: currentTags,
      needsMigration: false
    };
  }

  // Handle legacy 'super-admin' mapping to 'mestre'
  if (lowerRole === 'super-admin') {
    return {
      newRole: 'mestre',
      newTags: currentTags,
      needsMigration: true
    };
  }

  // Otherwise, rawRole is a custom function title (e.g. Trésorier, Logistique, etc.)
  let tagToAdd = rawRole;
  if (lowerRole === 'tresorier') tagToAdd = 'Trésorier';
  else if (lowerRole === 'logistique') tagToAdd = 'Logistique';
  else if (lowerRole === 'moderator' || lowerRole === 'modérateur') tagToAdd = 'Modérateur';
  else if (lowerRole === 'president' || lowerRole === 'président') tagToAdd = 'Président';
  else if (lowerRole === 'secretaire' || lowerRole === 'secrétaire') tagToAdd = 'Secrétaire';

  // Format tag name nicely
  if (tagToAdd && typeof tagToAdd === 'string') {
    tagToAdd = tagToAdd.charAt(0).toUpperCase() + tagToAdd.slice(1);
  }

  const updatedTags = [...currentTags];
  if (tagToAdd && !updatedTags.includes(tagToAdd)) {
    updatedTags.push(tagToAdd);
  }

  // Management and administrative functions map to 'admin' system access
  const adminKeywords = ['tresorier', 'trésorier', 'logistique', 'bureau', 'president', 'président', 'secretaire', 'secrétaire', 'ca', 'moderator', 'modérateur', 'admin'];
  const isManagementFunction = adminKeywords.some(k => lowerRole.includes(k));

  const newRole = isManagementFunction ? 'admin' : 'membre';

  return {
    newRole,
    newTags: updatedTags,
    needsMigration: true
  };
}
