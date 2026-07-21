/**
 * Utility functions for Tag / Badge normalization and gender formatting.
 */

/**
 * Normalizes a tag item (string or object) into a standard tag object:
 * { id: string, nomM: string, nomF: string }
 */
export function normalizeTag(tag) {
  if (!tag) return { id: '', nomM: '', nomF: '' };
  if (typeof tag === 'string') {
    return { id: tag, nomM: tag, nomF: tag };
  }
  const name = tag.nomM || tag.name || tag.nom || tag.id || '';
  const nomM = tag.nomM || tag.nomMasculin || name;
  const nomF = tag.nomF || tag.nomFeminin || nomM || name;
  return {
    id: tag.id || nomM || name,
    nomM,
    nomF
  };
}

/**
 * Returns the unique ID/Key of a tag (string or object)
 */
export function getTagId(tag) {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  return tag.id || tag.nomM || tag.name || tag.nom || '';
}

/**
 * Finds the matching tag object in tagsDisponibles list by tag ID or name
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
 * Formats a tag's display label based on user's gender and association fallback
 * 
 * Rules:
 * 1. userGenre === 'femme' -> tag.nomF
 * 2. userGenre === 'homme' -> tag.nomM
 * 3. userGenre === 'autre' or empty -> fallback to globalUseFeminine (if true -> tag.nomF, else tag.nomM)
 * 
 * @param {string|object} tag - The tag string or object
 * @param {string} userGenre - User's gender ('homme', 'femme', 'autre', or empty)
 * @param {boolean} globalUseFeminine - Association setting for feminine fallback
 * @param {Array} tagsDisponibles - Optional array of association tags for object lookup
 * @returns {string} Formatted tag label (Masculine or Feminine)
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

  // Rule 1: Femme -> Feminine label
  if (cleanGenre === 'femme') {
    return nomF || nomM;
  }

  // Rule 2: Homme -> Masculine label
  if (cleanGenre === 'homme') {
    return nomM || nomF;
  }

  // Rule 3: Autre / Empty -> Global association preference
  if (globalUseFeminine) {
    return nomF || nomM;
  }

  return nomM || nomF;
}
