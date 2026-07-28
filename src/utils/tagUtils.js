/**
 * Fonctions utilitaires pour la normalisation et le formatage de genre des Étiquettes / Badges.
 */

/**
 * Normalise un élément d'étiquette (chaîne ou objet) vers un objet standard :
 * { id: string, nomM: string, nomF: string, inheritsFrom: Array }
 */
export function normalizeTag(tag) {
  if (!tag) return { id: '', nomM: '', nomF: '', inheritsFrom: [] };
  if (typeof tag === 'string') {
    return { id: tag, nomM: tag, nomF: tag, inheritsFrom: [] };
  }
  const name = tag.nomM || tag.name || tag.nom || tag.id || '';
  const nomM = tag.nomM || tag.nomMasculin || name;
  const nomF = tag.nomF || tag.nomFeminin || nomM || name;
  const inheritsFrom = Array.isArray(tag.inheritsFrom) ? tag.inheritsFrom : [];
  return {
    id: tag.id || nomM || name,
    nomM,
    nomF,
    inheritsFrom
  };
}

/**
 * Retourne l'identifiant unique ou la clé d'une étiquette (chaîne ou objet).
 */
export function getTagId(tag) {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  return tag.id || tag.nomM || tag.name || tag.nom || '';
}

/**
 * Recherche l'objet étiquette correspondant dans la liste tagsDisponibles par identifiant ou nom.
 */
export function findTagObject(tagKey, tagsDisponibles = []) {
  if (!tagKey) return null;
  const keyStr = typeof tagKey === 'string' ? tagKey : getTagId(tagKey);
  if (!keyStr) return null;

  for (const item of tagsDisponibles) {
    if (typeof item === 'string') {
      if (item.toLowerCase() === keyStr.toLowerCase()) {
        return { id: item, nomM: item, nomF: item };
      }
    } else if (item && typeof item === 'object') {
      const itemId = item.id || item.nomM || item.name || item.nom || '';
      if (
        itemId.toLowerCase() === keyStr.toLowerCase() ||
        (item.nomM && item.nomM.toLowerCase() === keyStr.toLowerCase()) ||
        (item.nomF && item.nomF.toLowerCase() === keyStr.toLowerCase()) ||
        (item.name && item.name.toLowerCase() === keyStr.toLowerCase())
      ) {
        return normalizeTag(item);
      }
    }
  }

  return normalizeTag(tagKey);
}

/**
 * Formate le libellé d'affichage d'une étiquette selon le genre du membre et la préférence de l'association.
 * 
 * Règles :
 * 1. userGenre === 'femme' -> tag.nomF
 * 2. userGenre === 'homme' -> tag.nomM
 * 3. userGenre === 'autre' ou vide -> secours vers globalUseFeminine (si true -> tag.nomF, sinon tag.nomM)
 * 
 * @param {string|object} tag - L'étiquette (chaîne ou objet)
 * @param {string} userGenre - Genre du membre ('homme', 'femme', 'autre', ou vide)
 * @param {boolean} globalUseFeminine - Réglage d'association pour la valeur par défaut au féminin
 * @param {Array} tagsDisponibles - Liste optionnelle des étiquettes d'association pour recherche
 * @returns {string} Libellé d'étiquette formaté (Masculin ou Féminin)
 */
export function formatTagGender(tag, userGenre, globalUseFeminine = false, tagsDisponibles = []) {
  let tagObj = null;

  if (tagsDisponibles && Array.isArray(tagsDisponibles) && tagsDisponibles.length > 0) {
    tagObj = findTagObject(tag, tagsDisponibles);
  } else {
    tagObj = normalizeTag(tag);
  }

  if (!tagObj) return typeof tag === 'string' ? tag : '';

  const nomM = tagObj.nomM || tagObj.id || '';
  const nomF = tagObj.nomF || tagObj.nomM || tagObj.id || '';

  const cleanGenre = (userGenre || '').toLowerCase();

  // Règle 1 : Genre Femme -> Libellé féminin
  if (cleanGenre === 'femme') {
    return nomF || nomM;
  }

  // Règle 2 : Genre Homme -> Libellé masculin
  if (cleanGenre === 'homme') {
    return nomM || nomF;
  }

  // Règle 3 : Autre / Non spécifié -> Préférence globale de l'association
  if (globalUseFeminine) {
    return nomF || nomM;
  }

  return nomM || nomF;
}

/**
 * Résout les étiquettes effectives d'un membre en incluant l'héritage récursif via inheritsFrom.
 * 
 * @param {Array<string|object>} userTags - Étiquettes directes attribuées au profil utilisateur
 * @param {Array<object|string>} tagsDisponibles - Liste complète des étiquettes disponibles de l'association
 * @returns {Array<string>} Tableau des identifiants/noms d'étiquettes effectifs (directs + hérités)
 */
export function resolveEffectiveUserTags(userTags = [], tagsDisponibles = []) {
  if (!Array.isArray(userTags) || userTags.length === 0) return [];

  const effectiveTagIds = new Set();
  const queue = [];

  // Initialisation de la file avec les étiquettes directes du membre
  userTags.forEach(t => {
    const tagId = getTagId(t);
    if (tagId) {
      queue.push(tagId);
    }
  });

  // Dictionnaire pour une recherche rapide des badges par identifiant/nom
  const tagMap = new Map();
  if (Array.isArray(tagsDisponibles)) {
    tagsDisponibles.forEach(item => {
      if (item) {
        const id = getTagId(item);
        if (id) {
          tagMap.set(id.toLowerCase(), item);
        }
        if (typeof item === 'object') {
          if (item.nomM) tagMap.set(item.nomM.toLowerCase(), item);
          if (item.nomF) tagMap.set(item.nomF.toLowerCase(), item);
        }
      }
    });
  }

  // Parcours en largeur (BFS) avec protection contre les boucles d'héritage circulaires
  const visited = new Set();

  while (queue.length > 0) {
    const currentTagId = queue.shift();
    const currentLower = currentTagId.toLowerCase();

    if (visited.has(currentLower)) continue;
    visited.add(currentLower);
    effectiveTagIds.add(currentTagId);

    // Recherche de l'objet badge dans tagsDisponibles pour vérifier les héritages (inheritsFrom)
    const tagObj = tagMap.get(currentLower);
    if (tagObj && typeof tagObj === 'object' && Array.isArray(tagObj.inheritsFrom)) {
      tagObj.inheritsFrom.forEach(parentTagId => {
        const parentId = getTagId(parentTagId);
        if (parentId && !visited.has(parentId.toLowerCase())) {
          queue.push(parentId);
        }
      });
    }
  }

  return Array.from(effectiveTagIds);
}
