import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Catégories par défaut lorsque l'association n'a pas encore configuré de liste spécifique.
 */
export const DEFAULT_CUSTOM_CATEGORIES = ['Débutant', 'Confirmé'];

/**
 * Récupère le nom lisible d'une catégorie (qu'elle soit une chaîne ou un objet { name }).
 * @param {string|Object} c - Entrée catégorie.
 * @returns {string} Nom de la catégorie.
 */
export function getCategoryName(c) {
  if (!c) return '';
  if (typeof c === 'object' && c !== null) return (c.name || c.label || c.title || '').trim();
  return String(c).trim();
}

/**
 * Récupère la liste des catégories personnalisées avec fallback sur les catégories par défaut.
 * @param {Object} settings - Objet de configuration de l'association.
 * @returns {Array<string>} Liste des catégories.
 */
export function getCustomCategories(settings) {
  if (settings && Array.isArray(settings.customCategories) && settings.customCategories.length > 0) {
    return settings.customCategories.map(cat => getCategoryName(cat)).filter(Boolean);
  }
  return DEFAULT_CUSTOM_CATEGORIES;
}

/**
 * Résout une valeur de catégorie / niveau pour assurer la rétrocompatibilité des historiques 'debutant' et 'confirme'.
 * - 'debutant' ➔ 1ère catégorie de la liste (index 0)
 * - 'confirme' ➔ 2ème catégorie de la liste (index 1)
 * @param {string} value - Valeur actuelle (ex: 'debutant', 'confirme', ou un nom de catégorie personnalisé).
 * @param {Array<string|Object>} customCategories - Liste des catégories configurées.
 * @returns {string} Nom de catégorie résolu.
 */
export function resolveCategory(value, customCategories = DEFAULT_CUSTOM_CATEGORIES) {
  if (!value) return '';
  const catList = Array.isArray(customCategories) && customCategories.length > 0
    ? customCategories
    : DEFAULT_CUSTOM_CATEGORIES;

  const lowerVal = String(value).trim().toLowerCase().replace(/é|è|ê/g, 'e');

  const catDebutant = getCategoryName(catList[0]) || 'Débutant';
  const catConfirme = getCategoryName(catList[1]) || 'Confirmé';

  if (lowerVal === 'debutant') {
    return catDebutant;
  }
  if (lowerVal === 'confirme') {
    return catConfirme;
  }

  // Si la valeur correspond déjà à une catégorie existante
  const matched = catList.find(c => getCategoryName(c).toLowerCase().replace(/é|è|ê/g, 'e') === lowerVal);
  if (matched) {
    return getCategoryName(matched);
  }

  return value;
}

/**
 * Vérifie si la catégorie du membre correspond au public requis par l'événement.
 * @param {string} userCategory - Catégorie ou niveau du membre.
 * @param {string} eventRequiredPublic - Public cible / niveau requis par l'événement.
 * @param {Array<string|Object>} customCategories - Liste des catégories configurées.
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
 * Exécute une mise à jour en lot (batch) dans Firestore pour remplacer le texte 'debutant', 'confirme'
 * ou un ancien nom de catégorie des profils membres ('users') par les nouveaux noms correspondants.
 * @param {Object} db - Instance Firestore.
 * @param {string} groupId - Identifiant de l'association.
 * @param {Array<string|Object>} newCategories - Nouvelle liste des catégories configurées.
 * @param {Object|null} renameMap - Dictionnaire d'anciens noms vers nouveaux noms { [oldName]: newName }.
 * @returns {Promise<{ count: number, success: boolean }>} Résultat de la synchronisation.
 */
export async function batchMigrateUserCategories(db, groupId, newCategories = DEFAULT_CUSTOM_CATEGORIES, renameMap = null) {
  if (!db || !groupId || !Array.isArray(newCategories) || newCategories.length === 0) return { count: 0, success: true };

  const catDebutant = getCategoryName(newCategories[0]) || 'Débutant';
  const catConfirme = getCategoryName(newCategories[1]) || 'Confirmé';

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { count: 0, success: true };

    // Découpage en lots si le nombre de membres dépasse 400 (limite Firestore de 500 ops)
    const BATCH_SIZE = 400;
    let currentBatch = writeBatch(db);
    let count = 0;

    const normalizeLevel = (val) => String(val || '').trim().toLowerCase().replace(/é|è|ê/g, 'e');

    for (const docSnap of snapshot.docs) {
      const userData = docSnap.data();
      let needsUpdate = false;
      const updates = {};

      const checkAndUpdate = (fieldName) => {
        const val = userData[fieldName];
        if (!val) return;

        // Cas 1 : Remplacement ciblé via renameMap (ex: 'Débutant' -> 'Première année')
        if (renameMap) {
          for (const [oldName, newName] of Object.entries(renameMap)) {
            if (val === oldName || normalizeLevel(val) === normalizeLevel(oldName)) {
              if (val !== newName) {
                updates[fieldName] = newName;
                needsUpdate = true;
              }
              return;
            }
          }
        }

        // Cas 2 : Remplacement des statuts initiaux (débutant / confirmé)
        const norm = normalizeLevel(val);
        if (norm === 'debutant' && val !== catDebutant) {
          updates[fieldName] = catDebutant;
          needsUpdate = true;
        } else if (norm === 'confirme' && val !== catConfirme) {
          updates[fieldName] = catConfirme;
          needsUpdate = true;
        }
      };

      checkAndUpdate('niveau');
      checkAndUpdate('niveauMusique');
      checkAndUpdate('niveauDanse');

      // Vérification des instrumentsNiveaux (map { [instrument]: level })
      if (userData.instrumentsNiveaux && typeof userData.instrumentsNiveaux === 'object') {
        let instUpdated = false;
        const newInstNiveaux = { ...userData.instrumentsNiveaux };
        for (const [inst, lvl] of Object.entries(newInstNiveaux)) {
          if (renameMap) {
            for (const [oldName, newName] of Object.entries(renameMap)) {
              if (lvl === oldName || normalizeLevel(lvl) === normalizeLevel(oldName)) {
                if (lvl !== newName) {
                  newInstNiveaux[inst] = newName;
                  instUpdated = true;
                }
              }
            }
          }
          const norm = normalizeLevel(lvl);
          if (norm === 'debutant' && lvl !== catDebutant) {
            newInstNiveaux[inst] = catDebutant;
            instUpdated = true;
          } else if (norm === 'confirme' && lvl !== catConfirme) {
            newInstNiveaux[inst] = catConfirme;
            instUpdated = true;
          }
        }
        if (instUpdated) {
          updates.instrumentsNiveaux = newInstNiveaux;
          needsUpdate = true;
        }
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

    return { count, success: true };
  } catch (err) {
    console.error("Erreur lors de la migration batch des catégories membres dans Firestore :", err);
    throw err;
  }
}
