/**
 * Resolves and deduplicates recipient email addresses based on announcement targets.
 * 
 * This function guarantees that each recipient will only receive the announcement once,
 * even if they match multiple criteria (e.g. they are in the admin role and belong to targeted instrument groups).
 * 
 * @param {Array<string>} cibles - The list of targeted groups/roles (e.g. ['Tous'], ['role:admin', 'Caisses claires'])
 * @param {Array<Object>} users - The list of all users in the association
 * @returns {Array<string>} - A deduplicated list of lowercase email addresses
 */
export function getDeduplicatedRecipientEmails(cibles, users) {
  if (!Array.isArray(cibles) || cibles.length === 0) return [];
  if (!Array.isArray(users)) return [];

  const uniqueEmails = new Set();

  users.forEach(user => {
    // Only target active users with email addresses
    if (!user.email || user.statutActuel !== 'active') return;

    let isTargeted = false;

    if (cibles.includes('Tous')) {
      isTargeted = true;
    } else {
      // 1. Check if user role matches administrative target
      if (cibles.includes('role:admin')) {
        const role = user.role || 'membre';
        if (role === 'mestre' || role === 'super-admin' || user.isSystemAdmin === true) {
          isTargeted = true;
        }
      }

      // 2. Check if user is in any of the targeted instrument/level groups
      if (!isTargeted && Array.isArray(user.tags)) {
        if (user.tags.some(tag => cibles.includes(tag))) {
          isTargeted = true;
        }
      }
    }

    if (isTargeted) {
      // Deduplicate by adding to Set in uniform lowercase format
      uniqueEmails.add(user.email.toLowerCase().trim());
    }
  });

  return Array.from(uniqueEmails);
}
