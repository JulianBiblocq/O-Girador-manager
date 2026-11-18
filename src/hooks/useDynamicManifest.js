import { useEffect } from 'react';

export const CACHED_ASSO_NAME_PREFIX = 'ogirador_asso_name_';
export const LAST_GROUP_ID_KEY = 'ogirador_last_group_id';
export const PWA_THEME_COLOR = '#8B2A1A';
export const NEUTRAL_APP_TITLE = 'O Girador';

/**
 * Normalise l'identifiant d'association pour l'indexation étanche dans `localStorage`.
 */
function normalizeGroupKey(groupId) {
  if (!groupId || typeof groupId !== 'string') return '';
  return groupId.trim().toLowerCase();
}

/**
 * Nettoie un nom d'association affiché sans aucun fallback codé en dur.
 */
function sanitizeAssoDisplayName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName.trim();
}

/**
 * Lit le nom d'association mémorisé localement pour un `groupId` précis (`ogirador_asso_name_${groupId}`).
 * Retourne `""` si aucun `groupId` n'est actif ou si aucun cache n'existe pour ce groupe.
 */
export function getCachedAssoName(groupId) {
  const key = normalizeGroupKey(groupId);
  if (!key || typeof window === 'undefined') return '';
  try {
    return sanitizeAssoDisplayName(localStorage.getItem(`${CACHED_ASSO_NAME_PREFIX}${key}`));
  } catch {
    return '';
  }
}

/**
 * Mémorise dans `localStorage` le nom d'une association indexé par son `groupId`,
 * ainsi que le dernier `groupId` actif (`ogirador_last_group_id`).
 */
export function saveCachedAssoName(groupId, name) {
  const key = normalizeGroupKey(groupId);
  const clean = sanitizeAssoDisplayName(name);
  if (!key || !clean || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHED_ASSO_NAME_PREFIX}${key}`, clean);
    localStorage.setItem(LAST_GROUP_ID_KEY, key);
  } catch {
    // Ignorer les restrictions de stockage privé
  }
}

/**
 * Lit le dernier `groupId` actif mémorisé (utilisé avant toute réponse Firestore pour éviter un saut de nom).
 */
export function getLastGroupId() {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeGroupKey(localStorage.getItem(LAST_GROUP_ID_KEY) || '');
  } catch {
    return '';
  }
}

/**
 * Hook d'identité 100 % SaaS Multi-Associations :
 * - Garde `<link rel="manifest" href="/manifest.json">` strictement statique (zéro `blob:`).
 * - `document.title = assoName` (ex. « Baque do Sol », « Samb'à Bulles ») : nom lu depuis Firestore ou depuis le cache
 *   `ogirador_asso_name_${groupId}`, avec repli sur le dernier groupe actif pour éviter tout saut au rechargement.
 * - Titre neutre « O Girador » uniquement si aucun groupe n'est connu.
 */
export default function useDynamicManifest({
  groupId = '',
  associationName = '',
  currentRoute = '/app',
  isVitrineMode = false
} = {}) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const explicitGroupId = normalizeGroupKey(groupId);
    const cleanGroupId = explicitGroupId || getLastGroupId();
    const resolvedFromProps = explicitGroupId ? sanitizeAssoDisplayName(associationName) : '';

    // La persistance du nom (`ogirador_asso_name_${groupId}`) est faite par App.jsx à la réponse Firestore
    // (donnée issue du bon groupe), jamais ici, afin de ne jamais mélanger deux associations.

    const effectiveAssoName = cleanGroupId ? (resolvedFromProps || getCachedAssoName(cleanGroupId)) : '';
    const dynamicTitle = effectiveAssoName || NEUTRAL_APP_TITLE;

    if (!isVitrineMode && currentRoute !== '/') {
      document.title = dynamicTitle;
    }

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', dynamicTitle);
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', PWA_THEME_COLOR);
    }

    // Garantir que le lien manifest reste strictement statique (/manifest.json) sans jamais créer de blob:
    const manifestLink = document.getElementById('app-manifest') || document.querySelector('link[rel="manifest"]');
    if (manifestLink && manifestLink.getAttribute('href') !== '/manifest.json') {
      manifestLink.setAttribute('href', '/manifest.json');
    }
  }, [groupId, associationName, currentRoute, isVitrineMode]);
}
