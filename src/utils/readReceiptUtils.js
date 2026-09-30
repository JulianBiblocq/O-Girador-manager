/**
 * readReceiptUtils.js
 * Utilitaires purs pour le formatage et le calcul des accusés de lecture horodatés.
 */

/**
 * Formate la date de lecture sous la forme stricte « Lu le 20 mai à 14:32 ».
 *
 * @param {string|Date|Object} dateInput - Date ISO ou objet Date
 * @returns {string} Libellé formaté
 */
export function formatReadReceiptDate(dateInput) {
  if (!dateInput) return '';
  const dateObj = dateInput instanceof Date 
    ? dateInput 
    : (dateInput?.toDate ? dateInput.toDate() : new Date(dateInput));

  if (isNaN(dateObj.getTime())) return '';

  const day = dateObj.getDate();
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const month = months[dateObj.getMonth()];
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `Lu le ${day} ${month} à ${hours}:${minutes}`;
}

/**
 * Calcule les statistiques de lecture : liste ordonnée des lecteurs et membres n'ayant pas encore lu.
 *
 * @param {Object} lectures - Map { [userId]: { luLe, nom } }
 * @param {Array} allMembers - Liste de tous les membres actifs du groupe
 * @param {string} [authorId] - Identifiant de l'auteur à exclure des non-lecteurs
 * @returns {{ readCount: number, readers: Array, unreadMembers: Array }}
 */
export function getReadReceiptStats(lectures = {}, allMembers = [], authorId = null) {
  const safeLectures = (lectures && typeof lectures === 'object') ? lectures : {};
  const safeMembers = Array.isArray(allMembers) ? allMembers : [];

  const readers = Object.entries(safeLectures).map(([uid, data]) => {
    const matchingMember = safeMembers.find(m => m.id === uid || m.uid === uid);
    return {
      userId: uid,
      nom: data?.nom || `${matchingMember?.prenom || ''} ${matchingMember?.nom || ''}`.trim() || 'Membre',
      luLe: data?.luLe || null,
      photoURL: matchingMember?.photoURL || null
    };
  });

  // Tri des lecteurs par date la plus récente en premier
  readers.sort((a, b) => new Date(b.luLe || 0) - new Date(a.luLe || 0));

  // Membres n'ayant pas encore lu (en excluant l'auteur)
  const unreadMembers = safeMembers
    .filter(m => {
      const memberId = m.id || m.uid;
      if (!memberId) return false;
      if (authorId && memberId === authorId) return false;
      return !safeLectures[memberId];
    })
    .map(m => ({
      userId: m.id || m.uid,
      nom: `${m.prenom || ''} ${m.nom || ''}`.trim() || m.email || 'Membre',
      photoURL: m.photoURL || null
    }));

  return {
    readCount: readers.length,
    readers,
    unreadMembers
  };
}
