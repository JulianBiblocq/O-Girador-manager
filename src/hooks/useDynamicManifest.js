import { useEffect, useState } from 'react';
import { LAST_TENANT_STORAGE_KEY } from '../utils/tenantUtils.js';

export const CACHED_ASSO_NAME_PREFIX = 'ogirador_asso_name_';
export const LAST_GROUP_ID_KEY = 'ogirador_last_group_id';
export const PWA_THEME_COLOR = '#8B2A1A';
export const NEUTRAL_APP_TITLE = 'Organizador';

/** Normalise l'identifiant d'association pour l'indexation étanche dans `localStorage`. */
function normalizeGroupKey(groupId) {
  if (!groupId || typeof groupId !== 'string') return '';
  return groupId.trim().toLowerCase();
}

/** Nettoie un nom d'association affiché sans aucun fallback codé en dur. */
function sanitizeAssoDisplayName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName.trim();
}

/** Extrait le paramètre d'association directement depuis une query string (`?groupe=...`). */
export function extractGroupFromSearch(search = '') {
  if (!search || typeof search !== 'string') return '';
  try {
    const sp = new URLSearchParams(search);
    return (sp.get('groupe') || sp.get('tenant') || sp.get('groupId') || sp.get('assoc') || '').trim();
  } catch {
    return '';
  }
}

/** Lit le nom d'association mémorisé localement pour un `groupId` précis (`ogirador_asso_name_${groupId}`). */
export function getCachedAssoName(groupId) {
  const key = normalizeGroupKey(groupId);
  if (!key || typeof window === 'undefined') return '';
  try {
    return sanitizeAssoDisplayName(localStorage.getItem(`${CACHED_ASSO_NAME_PREFIX}${key}`));
  } catch {
    return '';
  }
}

/** Mémorise dans `localStorage` le nom d'une association indexé par son `groupId` ainsi que le dernier `groupId` actif. */
export function saveCachedAssoName(groupId, name) {
  const key = normalizeGroupKey(groupId);
  const clean = sanitizeAssoDisplayName(name);
  if (!key || !clean || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHED_ASSO_NAME_PREFIX}${key}`, clean);
    localStorage.setItem(LAST_GROUP_ID_KEY, groupId.trim());
  } catch {
    // Ignorer les restrictions de stockage privé
  }
}

/** Lit le dernier `groupId` actif mémorisé (en préservant sa casse canonique si disponible). */
export function getLastGroupId() {
  if (typeof window === 'undefined') return '';
  try {
    return (
      localStorage.getItem(LAST_TENANT_STORAGE_KEY) ||
      localStorage.getItem(LAST_GROUP_ID_KEY) ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

/** Construit l'URL HTTPS du manifest dynamique (zéro `blob:` URL pour compatibilité WebAPK Android). */
export function buildDynamicManifestHref(groupId) {
  const clean = typeof groupId === 'string' ? groupId.trim() : '';
  return clean
    ? `/manifest.webmanifest?groupe=${encodeURIComponent(clean)}`
    : '/manifest.webmanifest';
}

/**
 * Hook d'identité PWA 100 % SaaS Multi-Associations :
 * - Pointe `<link rel="manifest">` vers `/manifest.webmanifest?groupe=${encodeURIComponent(groupId)}` (HTTPS, zéro `blob:`).
 * - Réagit aux navigations client (`popstate` / `?groupe=...`) et maintient `apple-mobile-web-app-title` sur `"Organizador"`.
 */
export default function useDynamicManifest({
  groupId = '',
  associationName = '',
  currentRoute = '/app',
  isVitrineMode = false
} = {}) {
  const [urlSearchGroup, setUrlSearchGroup] = useState(() =>
    typeof window !== 'undefined' ? extractGroupFromSearch(window.location.search) : ''
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncFromLocation = () => setUrlSearchGroup(extractGroupFromSearch(window.location.search));
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const explicitRawGroup = typeof groupId === 'string' ? groupId.trim() : '';
    const liveUrlGroup = extractGroupFromSearch(window.location.search) || urlSearchGroup;
    const effectiveRawGroup = explicitRawGroup || liveUrlGroup || getLastGroupId();
    const lookupKey = normalizeGroupKey(effectiveRawGroup);
    const resolvedFromProps = explicitRawGroup ? sanitizeAssoDisplayName(associationName) : '';

    const effectiveAssoName = lookupKey ? (resolvedFromProps || getCachedAssoName(lookupKey)) : '';
    const dynamicTitle = effectiveAssoName ? `Organizador — ${effectiveAssoName}` : NEUTRAL_APP_TITLE;

    if (!isVitrineMode && currentRoute !== '/') {
      document.title = dynamicTitle;
    }

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta && !isVitrineMode) {
      appleTitleMeta.setAttribute('content', 'Organizador');
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', PWA_THEME_COLOR);
    }

    const targetHref = buildDynamicManifestHref(effectiveRawGroup);
    let manifestLink = document.getElementById('app-manifest') || document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.id = 'app-manifest';
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    if (manifestLink.getAttribute('href') !== targetHref) {
      manifestLink.setAttribute('href', targetHref);
    }
  }, [groupId, associationName, currentRoute, isVitrineMode, urlSearchGroup]);
}
