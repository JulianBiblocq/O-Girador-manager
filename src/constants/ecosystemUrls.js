/**
 * Constantes d'architecture et URLs officielles de l'écosystème O Girador.
 * Domaines de production & cartographie stricte des ports locaux (5170..5178).
 */

export const ECOSYSTEM_DOMAINS = Object.freeze({
  hub: 'https://www.o-girador.com',
  orquestrador: 'https://www.o-girador.com',
  sequenciador: 'https://sequenciador.o-girador.com',
  organizador: 'https://organizador.o-girador.com',
  mostrador: 'https://mostrador.o-girador.com',
  dancador: 'https://dancador.o-girador.com',
  cantador: 'https://cantador.o-girador.com',
  vocalLab: 'https://cantador.o-girador.com',
  afinador: 'https://afinador.o-girador.com',
});

export const LOCAL_DEV_PORTS = Object.freeze({
  hub: 5170,
  orquestrador: 5170,
  sequenciador: 5174,
  organizador: 5175,
  mostrador: 5175,
  dancador: 5176,
  cantador: 5177,
  vocalLab: 5177,
  afinador: 5178,
});

export const ECOSYSTEM_LOCAL_URLS = Object.freeze({
  ORQUESTRADOR: 'http://localhost:5170',
  SEQUENCIADOR: 'http://localhost:5174',
  ORGANIZADOR: 'http://localhost:5175',
  MOSTRADOR: 'http://localhost:5175',
  DANCADOR: 'http://localhost:5176',
  CANTADOR: 'http://localhost:5177',
  VOCAL_LAB: 'http://localhost:5177',
  AFINADOR: 'http://localhost:5178',
});

export const ECOSYSTEM_APPS_REGISTRY = Object.freeze({
  orquestrador: { key: 'orquestrador', label: 'Orquestrador', port: 5170, enabled: true, comingSoon: false },
  sequenciador: { key: 'sequenciador', label: 'Sequenciador', port: 5174, enabled: true, comingSoon: false },
  organizador: { key: 'organizador', label: 'Organizador', port: 5175, enabled: true, comingSoon: false },
  mostrador: { key: 'mostrador', label: 'Mostrador', port: 5175, enabled: true, comingSoon: false },
  dancador: { key: 'dancador', label: 'Dançador', port: 5176, enabled: true, comingSoon: false },
  cantador: { key: 'cantador', label: 'Cantador', port: 5177, enabled: true, comingSoon: false },
  afinador: { key: 'afinador', label: 'Afinador', port: 5178, enabled: false, comingSoon: true },
});

export function getEnabledEcosystemApps() {
  return Object.values(ECOSYSTEM_APPS_REGISTRY).filter((app) => app.enabled !== false);
}

export function isLocalEnvironment() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function getEcosystemUrl(appKey, path = '') {
  let normalizedKey = appKey === 'sequenceur' ? 'sequenciador' : appKey;
  if (normalizedKey === 'vocal' || normalizedKey === 'vocal-lab' || normalizedKey === 'vocallab') {
    normalizedKey = 'cantador';
  }
  const isLocal = isLocalEnvironment();

  let baseUrl = ECOSYSTEM_DOMAINS[normalizedKey] || ECOSYSTEM_DOMAINS.hub;
  if (isLocal && LOCAL_DEV_PORTS[normalizedKey]) {
    baseUrl = `http://localhost:${LOCAL_DEV_PORTS[normalizedKey]}`;
  }

  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') || path.startsWith('?') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
