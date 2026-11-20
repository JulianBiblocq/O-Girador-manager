import { isCustomDomainHost } from './tenantUtils.js';

/**
 * Utilitaires de verrouillage strict du mode Vitrine publique (Mostrador)
 * sur les domaines personnalisés d'associations et l'hôte Mostrador.
 * Zéro nom d'association codé en dur (architecture 100 % SaaS).
 */

export const VITRINE_RESERVED_SEGMENTS = new Set([
  'api', 'login', 'setup', 'app', 'dashboard', 'vitrine',
  'mostrador', 'demo', 'agenda', 'events', 'index.html', 'app.html'
]);

/**
 * Détecte si l'hôte courant correspond au portail public mutualisé Mostrador.
 */
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

/**
 * Indique si le domaine courant doit être verrouillé INCONDITIONNELLEMENT en mode Vitrine (Mostrador),
 * même lorsqu'une session Firebase Auth existe déjà dans le navigateur.
 */
export function isLockedVitrineHost(hostname) {
  return isCustomDomainHost(hostname) || isMostradorPlatformHost(hostname);
}

/**
 * Nettoie un chemin interne résiduel (/app, /dashboard, /login, /setup) sur un domaine verrouillé Vitrine
 * afin d'éviter tout basculement ou redirection vers l'interface privée sur ce domaine.
 */
export function sanitizeLockedVitrinePathname(hostname, pathname) {
  const rawPath = String(pathname || '/').trim() || '/';
  if (!isLockedVitrineHost(hostname)) return rawPath;

  const firstSeg = rawPath.split('/').filter(Boolean)[0]?.toLowerCase() || '';
  if (isCustomDomainHost(hostname)) {
    if (VITRINE_RESERVED_SEGMENTS.has(firstSeg)) {
      return '/';
    }
    return rawPath;
  }

  if (['app', 'dashboard', 'login', 'setup', 'events', 'agenda', 'index.html', 'app.html'].includes(firstSeg)) {
    return '/';
  }
  return rawPath;
}

/**
 * Extrait l'identifiant d'association éventuel porté par le chemin d'une URL Vitrine mutualisée
 * (ex: `/mon-asso` ou `/vitrine/mon-asso`), en ignorant tous les segments techniques réservés
 * et en excluant les domaines personnalisés (dont le groupe provient de `customDomains`).
 */
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

/**
 * Détermine de façon déterministe si l'application doit s'afficher en mode Vitrine publique (Mostrador).
 */
export function resolveIsVitrineMode({ hostname = '', pathname = '', search = '', appMode = '' } = {}) {
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

/**
 * Construit l'URL officielle du bouton "Espace Membre" de la Vitrine vers Organizador :
 * `https://organizador.o-girador.com/?groupe=${groupId}` en production.
 */
export function buildOrganizadorMemberUrl(groupId, { isLocal = false, isDemo = false } = {}) {
  if (isDemo) return '/demo?app=organizador';
  const cleanGroup = String(groupId || '').trim();
  if (isLocal) {
    return cleanGroup
      ? `/login?app=organizador&groupe=${encodeURIComponent(cleanGroup)}`
      : '/login?app=organizador';
  }
  return cleanGroup
    ? `https://organizador.o-girador.com/?groupe=${encodeURIComponent(cleanGroup)}`
    : 'https://organizador.o-girador.com/';
}
