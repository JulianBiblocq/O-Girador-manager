/**
 * Constantes d'architecture et URLs officielles de l'écosystème O-Girador.
 * Domaines de production OVH & mapping des ports de développement local.
 */

export const ECOSYSTEM_DOMAINS = Object.freeze({
  hub: 'https://www.o-girador.com',
  orquestrador: 'https://www.o-girador.com',
  sequenciador: 'https://sequenciador.o-girador.com',
  organizador: 'https://organizador.o-girador.com',
  dancador: 'https://dancador.o-girador.com',
  mostrador: 'https://mostrador.o-girador.com',
});

export const LOCAL_DEV_PORTS = Object.freeze({
  hub: 5170,
  orquestrador: 5170,
  sequenciador: 5174,
  organizador: 5175,
  dancador: 5176,
  mostrador: 5170,
});

export const ECOSYSTEM_LOCAL_URLS = Object.freeze({
  ORQUESTRADOR: 'http://localhost:5170',
  SEQUENCIADOR: 'http://localhost:5174',
  ORGANIZADOR: 'http://localhost:5175',
  DANCADOR: 'http://localhost:5176',
});

export function isLocalEnvironment() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function getEcosystemUrl(appKey, path = '') {
  const normalizedKey = appKey === 'sequenceur' ? 'sequenciador' : appKey;
  const isLocal = isLocalEnvironment();

  let baseUrl = ECOSYSTEM_DOMAINS[normalizedKey] || ECOSYSTEM_DOMAINS.hub;
  if (isLocal && LOCAL_DEV_PORTS[normalizedKey]) {
    baseUrl = `http://localhost:${LOCAL_DEV_PORTS[normalizedKey]}`;
  }

  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') || path.startsWith('?') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
