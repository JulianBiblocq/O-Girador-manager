/**
 * Fonctions utilitaires pour la normalisation et le formatage de genre des Étiquettes / Badges.
 */

/**
 * Filtre une liste d'instruments pour exclure les rôles de direction et la pratique de la danse
 * des choix de percussions accessibles aux élèves (Mestre, Direction, Danse, etc.).
 * @param {Array<string>} list - Liste brute des instruments de l'association
 * @returns {Array<string>} Liste filtrée d'instruments de percussion pour les élèves
 */
export function filterPublicPercussionInstruments(list = []) {
  if (!Array.isArray(list)) return [];
  // Exclut les rôles de direction, la danse et les sous-voix spécifiques d'Alfaia des choix publics
  const EXCLUDED_KEYWORDS = ['mestre', 'direction', 'chef de bateria', 'danse', 'marcante', 'meião', 'meiao', 'repique'];
  return list.filter(item => {
    if (!item || typeof item !== 'string') return false;
    const lower = item.toLowerCase().trim();
    return !EXCLUDED_KEYWORDS.some(k => lower === k || lower.includes(k));
  });
}

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

/**
 * Calcule la liste consolidée des Pupitres pour l'association.
 * Regroupe les instruments liés (ex: "Agbê & Mineiro", "Caixa & Tarol") et inclut
 * les instruments autonomes non liés configurés dans instrumentsDisponibles.
 *
 * @param {Array<string>} instrumentsDisponibles - Liste des instruments actifs
 * @param {Array<Object>} linkedInstruments - Liste des liaisons de pupitres
 * @returns {Array<string>} Liste des noms de pupitres sélectionnables
 */
export function computePupitresList(instrumentsDisponibles = [], linkedInstruments = []) {
  const result = [];
  const usedInstruments = new Set();
  // Exclut les rôles de direction, la danse et les sous-voix d'Alfaia (Marcante, Meião, Repique) des pupitres
  const EXCLUDED_KEYWORDS = ['mestre', 'direction', 'chef de bateria', 'danse', 'marcante', 'meião', 'meiao', 'repique'];

  // 1. Groupes d'instruments liés configurés (ex: "Agbê & Mineiro", "Caixa & Tarol", "Caixas")
  (linkedInstruments || []).forEach(group => {
    const groupInsts = Array.isArray(group.instruments)
      ? group.instruments
      : (Array.isArray(group) ? group : [group.inst1, group.inst2].filter(Boolean));
    if (groupInsts.length > 0) {
      const name = group.name && group.name.trim() ? group.name.trim() : groupInsts.join(' + ');
      const lowerName = name.toLowerCase().trim();
      if (!EXCLUDED_KEYWORDS.some(k => lowerName === k)) {
        result.push(name);
        groupInsts.forEach(i => usedInstruments.add(String(i).toLowerCase().trim()));
      }
    }
  });

  // 2. Consolidation automatique du pupitre "Caixas" si Caixa et Tarol sont présents sans groupe lié explicite
  const lowerInsts = (instrumentsDisponibles || []).map(i => String(i).toLowerCase().trim());
  const hasCaixa = lowerInsts.includes('caixa');
  const hasTarol = lowerInsts.includes('tarol');
  const caixaUsed = usedInstruments.has('caixa');
  const tarolUsed = usedInstruments.has('tarol');

  if (hasCaixa && hasTarol && !caixaUsed && !tarolUsed) {
    result.push('Caixas');
    usedInstruments.add('caixa');
    usedInstruments.add('tarol');
  }

  // 3. Instruments autonomes configurés (non inclus dans un groupe lié et hors mots-clés réservés)
  (instrumentsDisponibles || []).forEach(inst => {
    const lower = String(inst).toLowerCase().trim();
    if (!usedInstruments.has(lower) && !EXCLUDED_KEYWORDS.some(k => lower === k)) {
      result.push(inst);
    }
  });

  // 4. Si "Alfaia" n'est pas déjà présent mais que des voix d'Alfaia étaient fournies, assurer la présence du pupitre "Alfaia"
  const hasAlfaia = result.some(r => r.toLowerCase().trim() === 'alfaia');
  const hadAlfaiaSubvoice = lowerInsts.some(k => ['marcante', 'meião', 'meiao', 'repique'].includes(k));
  if (!hasAlfaia && hadAlfaiaSubvoice) {
    result.unshift('Alfaia');
  }

  return result;
}

/**
 * Résout le pupitre canonique correspondant à un nom d'instrument ou sous-voix.
 * Mappe notamment Marcante/Meião/Repique vers Alfaia, et Caixa/Tarol vers Caixas.
 *
 * @param {string} instName - Nom de l'instrument ou de la voix
 * @param {Array<string>} pupitresList - Liste des pupitres disponibles
 * @param {Array<Object>} linkedInstruments - Groupes liés de l'association
 * @returns {string} Nom du pupitre canonique résolu
 */
export function resolvePupitreForInstrument(instName, pupitresList = [], linkedInstruments = []) {
  if (!instName || instName === 'En attente') return '';
  const cleanInst = String(instName).trim();
  const lower = cleanInst.toLowerCase();

  // 1. Si c'est déjà exactement un pupitre reconnu dans pupitresList
  const exactMatch = (pupitresList || []).find(p => p.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  // 2. Sous-voix d'Alfaia -> Pupitre Alfaia
  if (lower === 'marcante' || lower === 'meião' || lower === 'meiao' || lower === 'repique') {
    const alfaiaPupitre = (pupitresList || []).find(p => p.toLowerCase().includes('alfaia'));
    return alfaiaPupitre || 'Alfaia';
  }

  // 3. Caixa ou Tarol -> Pupitre Caixas (ou groupe lié correspondant)
  if (lower === 'caixa' || lower === 'tarol' || lower === 'caisse') {
    const caixasPupitre = (pupitresList || []).find(p => p.toLowerCase().includes('caixa') || p.toLowerCase().includes('tarol'));
    if (caixasPupitre) return caixasPupitre;
  }

  // 4. Groupes d'instruments liés configurés (ex: "Agbê & Mineiro")
  const matchingGroup = (linkedInstruments || []).find(group => {
    const groupInsts = Array.isArray(group.instruments)
      ? group.instruments
      : (Array.isArray(group) ? group : [group.inst1, group.inst2].filter(Boolean));
    return groupInsts.some(i => String(i).toLowerCase().trim() === lower);
  });

  if (matchingGroup) {
    const gName = matchingGroup.name && matchingGroup.name.trim()
      ? matchingGroup.name.trim()
      : (Array.isArray(matchingGroup.instruments) ? matchingGroup.instruments.join(' + ') : '');
    if ((pupitresList || []).includes(gName)) return gName;
  }

  return cleanInst;
}

