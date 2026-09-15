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
 * Données des équivalences culturelles et bonnes pratiques de rédaction pour les univers traditionnels.
 */
export const CULTURAL_EQUIVALENCES = [
  {
    recommande: 'Batuque',
    aEviter: 'Bateria',
    contexte: 'Désigne l’ensemble percussif sacré du Maracatu de Baque Virado (la bateria est propre aux écoles de Samba).'
  },
  {
    recommande: 'Groupe de Maracatu / Nação',
    aEviter: 'Batucada',
    contexte: 'Le Maracatu est une culture séculaire de cour royale afro-brésilienne originaire de Pernambuco.'
  },
  {
    recommande: 'Toada',
    aEviter: 'Chanson / Morceau',
    contexte: 'Chant traditionnel à réponse, entonné par le chanteur et repris par l’ensemble des participants.'
  },
  {
    recommande: 'Alfaias',
    aEviter: 'Grosses caisses / Tambours',
    contexte: 'Nom officiel des tambours traditionnels en bois et cordages accordés manuellement.'
  },
  {
    recommande: 'Puxador / Cantador',
    aEviter: 'Chanteur principal',
    contexte: 'Terme traditionnel désignant la voix qui mène et transmet les toadas.'
  },
  {
    recommande: 'Cortejo',
    aEviter: 'Défilé / Parade',
    contexte: 'Déambulation cérémonielle incarnant la cour royale, ses dignitaires et les batukeiros.'
  },
  {
    recommande: 'Baque Virado',
    aEviter: 'Rythme brésilien',
    contexte: 'Signature rythmique syncopée et ternaire emblématique de la tradition du Maracatu.'
  }
];
