/**
 * Configuration, catégories d'émoticônes, lexique par défaut et équivalences culturelles
 * pour le Studio Social et la rédaction de publications.
 */

/**
 * Catégories d'émoticônes enrichies et ciblées pour la rédaction du Studio Social.
 */
export const EMOJI_CATEGORIES = [
  {
    id: 'nature',
    label: 'Éléments & Nature',
    icon: '🌿',
    emojis: ['⚡', '🌩️', '🌧️', '☀️', '🔥', '🌊', '🌿', '🪴', '🌴', '🍃']
  },
  {
    id: 'rythme',
    label: 'Rythme & Danse',
    icon: '🥁',
    emojis: ['🥁', '💃', '🕺', '🤸', '🎶', '🔊']
  },
  {
    id: 'fete',
    label: 'Fête & Cortège',
    icon: '🎉',
    emojis: ['🎉', '🎊', '👑', '✨', '🥳', '🎭', '🎪', '🪅']
  },
  {
    id: 'pratique',
    label: 'Infos pratiques',
    icon: '📅',
    emojis: ['📅', '📍', '⏰', '🎟️', '🔗', '📸']
  }
];

/**
 * Mots-clés lexicaux par défaut pour les univers percussifs (Maracatu, Batucada, etc.)
 */
export const DEFAULT_STUDIO_LEXIQUE = [
  'batuque',
  'alfaias',
  'toada',
  'cortejo',
  'puxador'
];

/**
 * Mentions par défaut pour les réseaux sociaux
 */
export const DEFAULT_STUDIO_MENTIONS = [
  '@ogirador',
  '@maracatu'
];

/**
 * Mentions par défaut pour les réseaux sociaux (format objet avec libellé et handle)
 */
export const DEFAULT_STUDIO_MENTIONS_OBJECTS = [
  { id: 'men-1', label: 'O Girador', handle: '@ogirador' },
  { id: 'men-2', label: 'Maracatu', handle: '@maracatu' }
];

/**
 * Hashtags officiels par défaut de l'association
 */
export const DEFAULT_STUDIO_HASHTAGS = [
  '#OGirador',
  '#Maracatu',
  '#BaqueVirado',
  '#CulturaPopular'
];

/**
 * Données des équivalences culturelles et bonnes pratiques de rédaction pour les univers traditionnels.
 */
export const CULTURAL_EQUIVALENCES = [
  {
    id: 'eq-1',
    preferred: 'Batuque',
    recommande: 'Batuque',
    avoid: 'Bateria',
    aEviter: 'Bateria',
    context: 'Désigne l’ensemble percussif sacré du Maracatu de Baque Virado (la bateria est propre aux écoles de Samba).',
    contexte: 'Désigne l’ensemble percussif sacré du Maracatu de Baque Virado (la bateria est propre aux écoles de Samba).',
    activeChip: true
  },
  {
    id: 'eq-2',
    preferred: 'Groupe de Maracatu / Nação',
    recommande: 'Groupe de Maracatu / Nação',
    avoid: 'Batucada',
    aEviter: 'Batucada',
    context: 'Le Maracatu est une culture séculaire de cour royale afro-brésilienne originaire de Pernambuco.',
    contexte: 'Le Maracatu est une culture séculaire de cour royale afro-brésilienne originaire de Pernambuco.',
    activeChip: false
  },
  {
    id: 'eq-3',
    preferred: 'Toada',
    recommande: 'Toada',
    avoid: 'Chanson / Morceau',
    aEviter: 'Chanson / Morceau',
    context: 'Chant traditionnel à réponse, entonné par le chanteur et repris par l’ensemble des participants.',
    contexte: 'Chant traditionnel à réponse, entonné par le chanteur et repris par l’ensemble des participants.',
    activeChip: true
  },
  {
    id: 'eq-4',
    preferred: 'Alfaias',
    recommande: 'Alfaias',
    avoid: 'Grosses caisses / Tambours',
    aEviter: 'Grosses caisses / Tambours',
    context: 'Nom officiel des tambours traditionnels en bois et cordages accordés manuellement.',
    contexte: 'Nom officiel des tambours traditionnels en bois et cordages accordés manuellement.',
    activeChip: true
  },
  {
    id: 'eq-5',
    preferred: 'Puxador / Cantador',
    recommande: 'Puxador / Cantador',
    avoid: 'Chanteur principal',
    aEviter: 'Chanteur principal',
    context: 'Terme traditionnel désignant la voix qui mène et transmet les toadas.',
    contexte: 'Terme traditionnel désignant la voix qui mène et transmet les toadas.',
    activeChip: true
  },
  {
    id: 'eq-6',
    preferred: 'Cortejo',
    recommande: 'Cortejo',
    avoid: 'Défilé / Parade',
    aEviter: 'Défilé / Parade',
    context: 'Déambulation cérémonielle incarnant la cour royale, ses dignitaires et les batukeiros.',
    contexte: 'Déambulation cérémonielle incarnant la cour royale, ses dignitaires et les batukeiros.',
    activeChip: true
  },
  {
    id: 'eq-7',
    preferred: 'Baque Virado',
    recommande: 'Baque Virado',
    avoid: 'Rythme brésilien',
    aEviter: 'Rythme brésilien',
    context: 'Signature rythmique syncopée et ternaire emblématique de la tradition du Maracatu.',
    contexte: 'Signature rythmique syncopée et ternaire emblématique de la tradition du Maracatu.',
    activeChip: false
  }
];

export const DEFAULT_STUDIO_EQUIVALENCES = CULTURAL_EQUIVALENCES;

/**
 * Normalise un nom de compte pour s'assurer qu'il commence par '@' sans doublon.
 * @param {string} handle 
 * @returns {string}
 */
export function normalizeMentionHandle(handle) {
  if (!handle) return '';
  const trimmed = String(handle).trim();
  const withoutAt = trimmed.replace(/^@+/, '');
  return withoutAt ? `@${withoutAt}` : '';
}

/**
 * Normalise un hashtag pour s'assurer qu'il commence par '#' sans doublon.
 * @param {string} tag 
 * @returns {string}
 */
export function normalizeHashtag(tag) {
  if (!tag) return '';
  const trimmed = String(tag).trim();
  const withoutHash = trimmed.replace(/^#+/, '');
  return withoutHash ? `#${withoutHash}` : '';
}
