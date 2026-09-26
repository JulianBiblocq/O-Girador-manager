// Utilitaires transversaux pour les jeux multijoueurs (Roda Quiz, Défis en direct)

/**
 * Constantes des thèmes de défis
 */
export const GAME_ROOM_THEMES = {
  rythme: {
    id: 'rythme',
    label: 'Défi Rythme',
    icon: '🥁',
    description: 'Tempo, breaks, variations et repères rythmiques'
  },
  culture: {
    id: 'culture',
    label: 'Défi Culture',
    icon: '📜',
    description: 'Histoire du Maracatu, toadas, traditions et instruments'
  },
  cadavre_exquis: {
    id: 'cadavre_exquis',
    label: '🤝 Cadavre Exquis (Coopération)',
    icon: '🤝',
    description: 'Relais polyrythmique en chaîne et délibération au Conseil de Batterie'
  }
};

/**
 * Vérifie si le module des Défis & Quiz en direct (Multijoueur) est actif pour l'utilisateur.
 * Règle de gouvernance :
 * - Si enabledModules.defisEnLigne === true : accessible pour tous les adhérents.
 * - Si désactivé ou non configuré : masqué pour les adhérents ordinaires, mais accessible
 *   aux profils de test (isSystemAdmin, super-admin, mestre).
 *
 * @param {Object} enabledModules Modules configurés pour l'association
 * @param {Object} profileData Profil de l'utilisateur connecté
 * @returns {boolean}
 */
export function isDefisEnLigneEnabled(enabledModules, profileData) {
  const isPrivileged = Boolean(
    profileData?.isSystemAdmin === true ||
    (profileData?.role || '').toLowerCase() === 'super-admin' ||
    (profileData?.role || '').toLowerCase() === 'mestre'
  );

  // Si l'utilisateur est un profil d'administration ou Mestre, le module est toujours actif pour tests
  if (isPrivileged) return true;

  // Pour les membres ordinaires, strictement conditionné par l'interrupteur de l'association
  return Boolean(enabledModules?.defisEnLigne === true);
}

/**
 * Vérifie si une salle de jeu dépasse la durée de validité de 10 minutes.
 * Nettoyage automatique : tout salon créé il y a plus de 10 minutes est ignoré.
 *
 * @param {Object} room Document de la salle Firestore
 * @param {number} maxAgeMinutes Durée maximale en minutes (10 min par défaut)
 * @returns {boolean}
 */
export function isRoomExpired(room, maxAgeMinutes = 10) {
  if (!room || !room.createdAt) return false;
  const createdTime = room.createdAt.toMillis 
    ? room.createdAt.toMillis() 
    : (room.createdAt.seconds ? room.createdAt.seconds * 1000 : null);

  if (!createdTime) return false;
  const ageMs = Date.now() - createdTime;
  return ageMs > maxAgeMinutes * 60 * 1000;
}

/**
 * Formate le titre d'un salon selon son thème
 * @param {string} theme 
 * @returns {string}
 */
export function formatThemeTitle(theme) {
  return GAME_ROOM_THEMES[theme]?.label || 'Défi en direct';
}

/**
 * Récupère l'icône associée au thème
 * @param {string} theme 
 * @returns {string}
 */
export function formatThemeIcon(theme) {
  return GAME_ROOM_THEMES[theme]?.icon || '🏆';
}
