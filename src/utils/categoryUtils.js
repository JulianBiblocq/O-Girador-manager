import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Catégories par défaut lorsque l'association n'a pas encore configuré de liste spécifique.
 */
export const DEFAULT_CUSTOM_CATEGORIES = ['Débutant', 'Confirmé'];

/**
 * Récupère la liste des catégories personnalisées avec fallback sur les catégories par défaut.
 * @param {Object} settings - Objet de configuration de l'association.
 * @returns {Array<string>} Liste des catégories.
 */
export function getCustomCategories(settings) {
  if (settings && Array.isArray(settings.customCategories) && settings.customCategories.length > 0) {
    return settings.customCategories;
  }
  return DEFAULT_CUSTOM_CATEGORIES;
}

/**
 * Résout une valeur de catégorie / niveau pour assurer la rétrocompatibilité des historiques 'debutant' et 'confirme'.
 * - 'debutant' ➔ 1ère catégorie de la liste (index 0)
 * - 'confirme' ➔ 2ème catégorie de la liste (index 1)
 * @param {string} value - Valeur actuelle (ex: 'debutant', 'confirme', ou un nom de catégorie personnalisé).
 * @param {Array<string>} customCategories - Liste des catégories configurées.
 * @returns {string} Nom de catégorie résolu.
 */
export function resolveCategory(value, customCategories = DEFAULT_CUSTOM_CATEGORIES) {
  if (!value) return '';
  const catList = Array.isArray(customCategories) && customCategories.length > 0
    ? customCategories
    : DEFAULT_CUSTOM_CATEGORIES;

  const lowerVal = String(value).trim().toLowerCase();

  if (lowerVal === 'debutant') {
    return catList[0] || 'Débutant';
  }
  if (lowerVal === 'confirme') {
    return catList[1] || 'Confirmé';
  }

  return value;
}

/**
 * Vérifie si la catégorie du membre correspond au public requis par l'événement.
 * @param {string} userCategory - Catégorie ou niveau du membre.
 * @param {string} eventRequiredPublic - Public cible / niveau requis par l'événement.
 * @param {Array<string>} customCategories - Liste des catégories configurées.
 * @returns {boolean} Vrai si le membre est éligible ou si aucun public restreint n'est défini.
 */
export function isUserCategoryMatchingEvent(userCategory, eventRequiredPublic, customCategories = DEFAULT_CUSTOM_CATEGORIES) {
  if (!eventRequiredPublic || eventRequiredPublic === 'tous' || eventRequiredPublic === 'aucun' || eventRequiredPublic === 'tout_le_monde') {
    return true;
  }

  const resolvedUserCat = resolveCategory(userCategory, customCategories);
  const resolvedEventCat = resolveCategory(eventRequiredPublic, customCategories);

  return resolvedUserCat === resolvedEventCat;
}

/**
 * Exécute une mise à jour en lot (batch) dans Firestore pour remplacer le texte 'debutant' et 'confirme'
 * des profils membres ('users') par les nouveaux noms de catégories correspondants.
 * @param {Object} db - Instance Firestore.
 * @param {string} groupId - Identifiant de l'association.
 * @param {Array<string>} newCategories - Nouvelle liste des catégories configurées.
 */
export async function batchMigrateUserCategories(db, groupId, newCategories = DEFAULT_CUSTOM_CATEGORIES) {
  if (!db || !groupId || !Array.isArray(newCategories) || newCategories.length === 0) return;

  const catDebutant = newCategories[0] || 'Débutant';
  const catConfirme = newCategories[1] || 'Confirmé';

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    // Découpage en lots si le nombre de membres dépasse 450 (limite Firestore de 500 ops)
    const BATCH_SIZE = 400;
    let currentBatch = writeBatch(db);
    let count = 0;

    for (const docSnap of snapshot.docs) {
      const userData = docSnap.data();
      let needsUpdate = false;
      const updates = {};

      if (userData.niveau === 'debutant') {
        updates.niveau = catDebutant;
        needsUpdate = true;
      } else if (userData.niveau === 'confirme') {
        updates.niveau = catConfirme;
        needsUpdate = true;
      }

      if (userData.niveauMusique === 'debutant') {
        updates.niveauMusique = catDebutant;
        needsUpdate = true;
      } else if (userData.niveauMusique === 'confirme') {
        updates.niveauMusique = catConfirme;
        needsUpdate = true;
      }

      if (userData.niveauDanse === 'debutant') {
        updates.niveauDanse = catDebutant;
        needsUpdate = true;
      } else if (userData.niveauDanse === 'confirme') {
        updates.niveauDanse = catConfirme;
        needsUpdate = true;
      }

      if (needsUpdate) {
        currentBatch.update(doc(db, 'users', docSnap.id), updates);
        count++;

        if (count % BATCH_SIZE === 0) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
        }
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await currentBatch.commit();
    }

    console.log(`Migration Firestore batch complétée : ${count} profils membres mis à jour avec les catégories.`);
  } catch (err) {
    console.error("Erreur lors de la migration batch des catégories membres dans Firestore :", err);
  }
}
