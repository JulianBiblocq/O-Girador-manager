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
  const hasCaixa = lowerInsts.some(k => k === 'caixa' || k === 'caixas');
  const hasTarol = lowerInsts.some(k => k === 'tarol' || k === 'tarols');
  const caixaUsed = usedInstruments.has('caixa') || usedInstruments.has('caixas');
  const tarolUsed = usedInstruments.has('tarol') || usedInstruments.has('tarols');

  if (hasCaixa && hasTarol && !caixaUsed && !tarolUsed) {
    result.push('Caixas');
    usedInstruments.add('caixa');
    usedInstruments.add('caixas');
    usedInstruments.add('tarol');
    usedInstruments.add('tarols');
  }

  // 3. Instruments autonomes configurés (non inclus dans un groupe lié et hors mots-clés réservés)
  (instrumentsDisponibles || []).forEach(inst => {
    const lower = String(inst).toLowerCase().trim();
    if (!usedInstruments.has(lower) && !EXCLUDED_KEYWORDS.some(k => lower === k)) {
      result.push(inst);
      usedInstruments.add(lower);
    }
  });

  // 4. Si "Alfaia" n'est pas déjà présent mais que des voix d'Alfaia étaient fournies, assurer la présence du pupitre "Alfaia"
  const hasAlfaia = result.some(r => r.toLowerCase().trim().includes('alfaia'));
  const hadAlfaiaSubvoice = lowerInsts.some(k => ['marcante', 'meião', 'meiao', 'repique'].includes(k));
  if (!hasAlfaia && hadAlfaiaSubvoice) {
    result.unshift('Alfaia');
  }

  // 5. Normalisation et déduplication canonique des pupitres (Fusion singulier/pluriel vers le libellé unique)
  const canonicalResult = [];
  result.forEach(p => {
    const pTrim = String(p).trim();
    const pLower = pTrim.toLowerCase();

    // Déduplication Alfaia vs Alfaias -> si les deux sont présents, privilégier 'Alfaias'
    if (pLower.includes('alfaia')) {
      const existingAlfaiaIdx = canonicalResult.findIndex(cp => cp.toLowerCase().includes('alfaia'));
      if (existingAlfaiaIdx === -1) {
        canonicalResult.push(pTrim);
      } else if (!canonicalResult[existingAlfaiaIdx].toLowerCase().endsWith('s') && pLower.endsWith('s')) {
        canonicalResult[existingAlfaiaIdx] = pTrim;
      }
      return;
    }

    // Déduplication Caixa vs Caixas -> si les deux sont présents, privilégier 'Caixas'
    if (pLower.includes('caixa')) {
      const existingCaixaIdx = canonicalResult.findIndex(cp => cp.toLowerCase().includes('caixa'));
      if (existingCaixaIdx === -1) {
        canonicalResult.push(pTrim);
      } else if (!canonicalResult[existingCaixaIdx].toLowerCase().endsWith('s') && pLower.endsWith('s')) {
        canonicalResult[existingCaixaIdx] = pTrim;
      }
      return;
    }

    // Déduplication exacte insensible à la casse
    if (!canonicalResult.some(cp => cp.toLowerCase() === pLower)) {
      canonicalResult.push(pTrim);
    }
  });

  return canonicalResult;
}

/**
 * Normalise canoniquement le nom d'un instrument vers le libellé officiel unique du pupitre.
 * Fusionne obligatoirement 'Alfaia' et 'Alfaias' vers le libellé officiel unique (ex. 'Alfaias'),
 * ainsi que 'Caixa', 'Tarol' et 'Caixas' vers 'Caixas', tout en respectant les groupes liés.
 *
 * @param {string} instName - Nom de l'instrument ou de la voix
 * @param {Array<string>} pupitresList - Liste officielle des pupitres de l'association
 * @param {Array<Object>} linkedInstruments - Groupes d'instruments liés configurés
 * @returns {string} Nom du pupitre canonique résolu
 */
export function resolvePupitreForInstrument(instName, pupitresList = [], linkedInstruments = []) {
  if (!instName || typeof instName !== 'string') return '';
  const cleanInst = instName.trim();
  if (!cleanInst || cleanInst.toLowerCase() === 'en attente') return '';

  const lower = cleanInst.toLowerCase();

  // 1. Groupes d'instruments liés configurés (ex: "Agbê & Mineiro", "Caixa & Tarol")
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
    if (gName) {
      const matchInPupitres = (pupitresList || []).find(p => p.toLowerCase().trim() === gName.toLowerCase().trim());
      return matchInPupitres || gName;
    }
  }

  // 2. Normalisation canonique d'Alfaia (singulier, pluriel et sous-voix Marcante, Meião, Repique)
  if (lower.includes('alfaia') || lower === 'marcante' || lower === 'meião' || lower === 'meiao' || lower === 'repique') {
    const matchingAlfaias = (pupitresList || []).filter(p => p.toLowerCase().includes('alfaia'));
    if (matchingAlfaias.length > 0) {
      // Priorité au libellé pluriel 'Alfaias' s'il est présent dans l'association
      const pluralMatch = matchingAlfaias.find(p => p.toLowerCase().trim().endsWith('s'));
      return pluralMatch || matchingAlfaias[0];
    }
    return 'Alfaias';
  }

  // 3. Normalisation canonique de Caixa (Caixa, Caixas, Tarol, Caisse)
  if (lower.includes('caixa') || lower === 'tarol' || lower.includes('caisse')) {
    const matchingCaixas = (pupitresList || []).filter(p => p.toLowerCase().includes('caixa') || p.toLowerCase().includes('tarol'));
    if (matchingCaixas.length > 0) {
      const pluralMatch = matchingCaixas.find(p => p.toLowerCase().trim().endsWith('s'));
      return pluralMatch || matchingCaixas[0];
    }
    return 'Caixas';
  }

  // 4. Tolérance singulier/pluriel pour les autres pupitres (Agbê(s), Gonguê(s), Mineiro(s), etc.)
  // a) Correspondance exacte
  const exactMatch = (pupitresList || []).find(p => p.toLowerCase().trim() === lower);
  if (exactMatch) return exactMatch;

  // b) Tolérance pluriel/singulier
  const pluralVariant = (pupitresList || []).find(p => {
    const pLower = p.toLowerCase().trim();
    return pLower === `${lower}s` || (lower.endsWith('s') && pLower === lower.slice(0, -1));
  });
  if (pluralVariant) return pluralVariant;

  // c) Recherche par inclusion
  const inclusionMatch = (pupitresList || []).find(p => {
    const pLower = p.toLowerCase().trim();
    return pLower.includes(lower) || lower.includes(pLower);
  });
  if (inclusionMatch) return inclusionMatch;

  return cleanInst;
}

export const canonicalizePupitreName = resolvePupitreForInstrument;

/**
 * Résolution en cascade de l'instrument d'un participant :
 * 1. participant.instrumentChoisi ou participant.assignedInstrument (choix spécifique à la date).
 * 2. À défaut, userInfo.instrumentPrincipal ou userInfo.instrument (issu du document profil dans users).
 * 3. Si aucun instrument n'existe dans ces deux sources, seulement alors classer le membre dans « En attente ».
 *
 * @param {Object} participant - Inscription spécifique à la date (ins)
 * @param {Object} userInfo - Profil utilisateur résolu dans la collection users
 * @returns {string} Instrument brut résolu ou 'En attente'
 */
export function resolveParticipantInstrument(participant, userInfo) {
  const isInvalid = (val) => {
    if (!val || typeof val !== 'string') return true;
    const trimmed = val.trim().toLowerCase();
    return !trimmed || 
      trimmed === 'en attente' || 
      trimmed === 'en_attente' || 
      trimmed === 'autre' || 
      trimmed === 'non défini' || 
      trimmed === 'non defini' || 
      trimmed === 'aucun';
  };

  // 1. Choix spécifique à la date
  const dateInst = participant?.instrumentChoisi || participant?.assignedInstrument;
  if (!isInvalid(dateInst)) {
    return String(dateInst).trim();
  }

  // 2. Profil utilisateur dans la collection users
  const profileInst = userInfo?.instrumentPrincipal || userInfo?.instrument;
  if (!isInvalid(profileInst)) {
    return String(profileInst).trim();
  }

  // 2 bis. Repli sur le premier instrument joué déclaré dans le profil
  if (Array.isArray(userInfo?.instrumentsJoues) && userInfo.instrumentsJoues.length > 0) {
    const firstPlayed = userInfo.instrumentsJoues.find(i => !isInvalid(i));
    if (firstPlayed) return String(firstPlayed).trim();
  }

  // 3. Repli si aucun instrument valide n'a été trouvé
  return 'En attente';
}

/**
 * Filtre les étiquettes attribuées à un utilisateur pour ne conserver QUE celles
 * qui correspondent réellement à une étiquette configurée dans l'association (tagsDisponibles).
 * Éradique ainsi les badges fantômes ou orphelins non désirés.
 * 
 * @param {Array<string|object>} userTags - Étiquettes actuellement rattachées au profil
 * @param {Array<string|object>} tagsDisponibles - Étiquettes actives configurées dans l'association
 * @returns {Array<string|object>} Liste assainie des étiquettes légitimes
 */
export function filterUserAssignedTags(userTags = [], tagsDisponibles = []) {
  if (!Array.isArray(userTags) || userTags.length === 0) return [];
  if (!Array.isArray(tagsDisponibles) || tagsDisponibles.length === 0) return [];

  // Création d'un ensemble de clés valides en minuscules pour comparaison robuste
  const validKeys = new Set();
  tagsDisponibles.forEach(item => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim().toLowerCase();
      if (trimmed) validKeys.add(trimmed);
    } else if (typeof item === 'object') {
      if (item.id) validKeys.add(String(item.id).trim().toLowerCase());
      if (item.nomM) validKeys.add(String(item.nomM).trim().toLowerCase());
      if (item.nomF) validKeys.add(String(item.nomF).trim().toLowerCase());
      if (item.name) validKeys.add(String(item.name).trim().toLowerCase());
      if (item.nom) validKeys.add(String(item.nom).trim().toLowerCase());
    }
  });

  return userTags.filter(tag => {
    if (!tag) return false;
    if (typeof tag === 'string') {
      return validKeys.has(tag.trim().toLowerCase());
    }
    if (typeof tag === 'object') {
      const tagId = tag.id ? String(tag.id).trim().toLowerCase() : '';
      const tagM = tag.nomM ? String(tag.nomM).trim().toLowerCase() : '';
      const tagF = tag.nomF ? String(tag.nomF).trim().toLowerCase() : '';
      const tagName = tag.name ? String(tag.name).trim().toLowerCase() : '';
      const tagNom = tag.nom ? String(tag.nom).trim().toLowerCase() : '';
      return (
        (tagId && validKeys.has(tagId)) ||
        (tagM && validKeys.has(tagM)) ||
        (tagF && validKeys.has(tagF)) ||
        (tagName && validKeys.has(tagName)) ||
        (tagNom && validKeys.has(tagNom))
      );
    }
    return false;
  });
}

