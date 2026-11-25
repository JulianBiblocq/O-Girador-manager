import { isCustomDomainHost } from './tenantUtils.js';

/**
 * Utilitaires de verrouillage strict du mode Vitrine publique (Mostrador)
 * et reconnaissance universelle de la route publique `/benevoles/:eventId`.
 * Zéro nom d'association codé en dur (architecture 100 % SaaS).
 */

export const VITRINE_RESERVED_SEGMENTS = new Set([
  'api', 'login', 'setup', 'app', 'dashboard', 'vitrine',
  'mostrador', 'demo', 'agenda', 'events', 'benevoles', 'index.html', 'app.html'
]);

/** Extrait `eventId` si le chemin correspond à la page publique `/benevoles/:eventId`. */
export function extractPublicVolunteerEventId(pathname = '') {
  const clean = String(pathname || '').split('?')[0].split('#')[0];
  const m = clean.match(/^\/(?:(?:vitrine|mostrador)\/[^/]+\/|(?!(?:api|login|setup|app|dashboard|demo|agenda|events)\/)[^/]+\/)?benevoles\/([^/]+)\/?$/i);
  return m && m[1] ? decodeURIComponent(m[1].trim()) : null;
}

export function isPublicVolunteerRoute(pathname = '') {
  return Boolean(extractPublicVolunteerEventId(pathname));
}

/** Détecte si l'hôte courant correspond au portail public mutualisé Mostrador. */
export function isMostradorPlatformHost(hostname) {
  const h = String(hostname || '').trim().toLowerCase().replace(/:\d+$/, '');
  if (!h || h.includes('organizador') || h.includes('manager')) return false;
  return (
    h === 'mostrador.o-girador.com' ||
    h.endsWith('.mostrador.o-girador.com') ||
    h === 'o-girador-mostrador.web.app' ||
    h === 'o-girador-mostrador.firebaseapp.com' ||
    h.includes('mostrador')
  );
}

/** Indique si le domaine courant doit être verrouillé INCONDITIONNELLEMENT en mode Vitrine (Mostrador). */
export function isLockedVitrineHost(hostname) {
  return isCustomDomainHost(hostname) || isMostradorPlatformHost(hostname);
}

/** Nettoie un chemin interne résiduel sur un domaine verrouillé Vitrine tout en préservant `/benevoles/:eventId`. */
export function sanitizeLockedVitrinePathname(hostname, pathname) {
  const rawPath = String(pathname || '/').trim() || '/';
  if (isPublicVolunteerRoute(rawPath)) return rawPath;
  if (!isLockedVitrineHost(hostname)) return rawPath;

  const firstSeg = rawPath.split('/').filter(Boolean)[0]?.toLowerCase() || '';
  if (isCustomDomainHost(hostname)) {
    return VITRINE_RESERVED_SEGMENTS.has(firstSeg) ? '/' : rawPath;
  }
  if (['app', 'dashboard', 'login', 'setup', 'events', 'agenda', 'index.html', 'app.html'].includes(firstSeg)) {
    return '/';
  }
  return rawPath;
}

/** Extrait l'identifiant d'association porté par le chemin d'une URL Vitrine mutualisée. */
export function extractVitrineSlugFromPath(pathname, hostname = '') {
  if (isCustomDomainHost(hostname)) return null;
  const rawPath = String(pathname || '').split('?')[0].split('#')[0];
  const segments = rawPath.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstLower = segments[0].toLowerCase();
  if (firstLower === 'vitrine' || firstLower === 'mostrador') {
    const second = segments[1]?.trim() || '';
    if (!second || VITRINE_RESERVED_SEGMENTS.has(second.toLowerCase())) return null;
    return second;
  }

  if (VITRINE_RESERVED_SEGMENTS.has(firstLower)) return null;
  return segments[0].trim() || null;
}

/** Détermine de façon déterministe si l'application doit s'afficher en mode public (Mostrador). */
export function resolveIsVitrineMode({ hostname = '', pathname = '', search = '', appMode = '' } = {}) {
  if (isPublicVolunteerRoute(pathname)) return true;
  if (isLockedVitrineHost(hostname)) return true;

  const searchParams = new URLSearchParams(search || '');
  const path = String(pathname || '');
  const isExplicitVitrineRequest =
    searchParams.get('app') === 'mostrador' ||
    path.startsWith('/vitrine') ||
    path.startsWith('/mostrador') ||
    path.includes('/vitrine') ||
    path.includes('/mostrador');

  const lowerHost = String(hostname || '').trim().toLowerCase();
  if (lowerHost.includes('organizador') || lowerHost.includes('manager')) {
    return isExplicitVitrineRequest;
  }
  if (appMode === 'mostrador') return true;
  return isExplicitVitrineRequest;
}

/** Construit l'URL officielle du bouton "Espace Membre" de la Vitrine vers Organizador. */
export function buildOrganizadorMemberUrl(groupId, { isLocal = false, isDemo = false, eventId = '' } = {}) {
  const eidParam = eventId ? `&eventId=${encodeURIComponent(eventId)}&tab=program` : '';
  if (isDemo) return `/demo?app=organizador${eidParam}`;
  const cleanGroup = String(groupId || '').trim();
  if (isLocal) {
    return cleanGroup
      ? `/login?app=organizador&groupe=${encodeURIComponent(cleanGroup)}${eidParam}`
      : `/login?app=organizador${eidParam}`;
  }
  return cleanGroup
    ? `https://organizador.o-girador.com/?groupe=${encodeURIComponent(cleanGroup)}${eidParam}`
    : `https://organizador.o-girador.com/${eidParam ? `?${eidParam.slice(1)}` : ''}`;
}
