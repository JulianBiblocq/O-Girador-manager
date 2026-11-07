/**
 * Utilitaire de normalisation et de résolution des pupitres pour les bilans
 * (« Répartition par pupitre » de la Vie Associative & Adhésions).
 */

/**
 * Nettoie une chaîne (minuscules, sans accents, sans espaces superflus).
 * @param {string} str
 * @returns {string}
 */
export const normalizePupitreToken = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const PENDING_TOKENS = new Set([
  '',
  'en attente',
  'non defini',
  'non-defini',
  'aucun',
  'aucune',
  'undefined',
  'null',
  'en orientation',
  'en-orientation',
  "en cours d'orientation"
]);

const ACTIVE_DANCE_LEVELS = new Set([
  'debutant',
  'confirme',
  'la releve',
  'la reference',
  'intermediaire',
  'avance'
]);

/**
 * Harmonise et normalise le nom d'un pupitre ou instrument sur les catégories officielles :
 * - Agbê / Agbês / Mineiro ➔ Sementes
 * - Alfaia / Alfaias ➔ Alfaias
 * - Caixa / Caixas / Tarol ➔ Caixas
 * - Gonguê ➔ Gonguê
 * - Danse ➔ Danse
 * - Vide / null / Non défini / En attente ➔ En attente
 *
 * @param {string} rawName Nom brut du pupitre ou instrument
 * @returns {string} Nom canonique normalisé
 */
export const normalizePupitreName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'En attente';
  const primary = rawName.split(/[+/&,]/)[0].trim();
  const clean = normalizePupitreToken(primary);

  if (PENDING_TOKENS.has(clean)) {
    return 'En attente';
  }

  // Fusion sur les 4 pupitres officiels de percussion + Danse
  if (
    clean.includes('agbe') ||
    clean.includes('mineiro') ||
    clean.includes('semente') ||
    clean.includes('xequere') ||
    clean.includes('shekere') ||
    clean.includes('ganza') ||
    clean.includes('chocalho')
  ) {
    return 'Sementes';
  }
  if (clean.includes('alfaia') || clean.includes('bombo') || clean.includes('tambor')) {
    return 'Alfaias';
  }
  if (clean.includes('caixa') || clean.includes('caisse') || clean.includes('tarol') || clean.includes('snare')) {
    return 'Caixas';
  }
  if (clean.includes('gongue') || clean.includes('agogo')) {
    return 'Gonguê';
  }
  if (clean.includes('danse')) {
    return 'Danse';
  }
  if (clean === 'chant' || clean === 'chants' || clean === 'voix') {
    return 'Chant';
  }
  if (clean === 'mestre') {
    return 'Mestre';
  }

  return primary.charAt(0).toUpperCase() + primary.slice(1);
};

/**
 * Détecte si un adhérent est inscrit à la danse.
 * @param {Object} member Profil de l'adhérent
 * @returns {boolean}
 */
export const isMemberPracticingDance = (member) => {
  if (!member || typeof member !== 'object') return false;
  if (member.pratiqueDanse === true) return true;
  if (normalizePupitreToken(member.instrument) === 'danse') return true;
  if (normalizePupitreToken(member.instrumentPrincipal) === 'danse') return true;
  if (normalizePupitreToken(member.pupitre) === 'danse') return true;

  const normLevel = normalizePupitreToken(member.niveauDanse);
  if (normLevel && ACTIVE_DANCE_LEVELS.has(normLevel)) {
    return true;
  }
  return false;
};

/**
 * Détermine la catégorie de pupitre officielle d'un membre pour la « Répartition par pupitre » :
 * 1. Lecture synchronisée de l'instrument de percussion (`instrumentPrincipal` puis `instrument`,
 *    en ignorant `'En attente'` si l'autre champ contient un pupitre valide).
 * 2. Si aucun instrument de percussion validé n'est présent et que le membre pratique la danse,
 *    retourne `'Danse'`.
 * 3. Sinon, regroupe sur l'unique ligne `'En attente'`.
 *
 * @param {Object} member Profil de l'adhérent
 * @returns {string}
 */
export const resolveMemberReportPupitre = (member) => {
  if (!member || typeof member !== 'object') return 'En attente';

  const candidates = [
    member.instrumentPrincipal,
    member.instrument,
    member.pupitre,
    member.section
  ];

  for (const raw of candidates) {
    const normalized = normalizePupitreName(raw);
    if (normalized !== 'En attente' && normalized !== 'Non défini' && normalized !== 'Danse') {
      return normalized;
    }
  }

  if (isMemberPracticingDance(member)) {
    return 'Danse';
  }

  return 'En attente';
};

