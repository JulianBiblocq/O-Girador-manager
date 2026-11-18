/**
 * Utilitaires génériques de résolution et normalisation multi-associations (SaaS).
 * Aucune association n'est codée en dur : la casse canonique provient de Firestore (`associations/{id}`).
 */

export const LAST_TENANT_STORAGE_KEY = 'og_last_tenant_id';
const CANONICAL_MAP_STORAGE_KEY = 'og_canonical_group_map';
const DOMAIN_MAP_STORAGE_KEY = 'og_domain_group_map';

const INVALID_TENANTS = new Set([
  'o-girador-7828c', 'o-girador-organizador', 'o-girador-mostrador',
  'orquestrador', 'organizador', 'sequenciador', 'cantador', 'dancador',
  'mostrador', 'afinador', 'manager', 'dansador', 'default', 'public', 'www', 'app', 'admin', 'api'
]);

const canonicalMemoryMap = new Map();
let memoryHydrated = false;

function hydrateCanonicalMap() {
  if (memoryHydrated || typeof window === 'undefined') return;
  memoryHydrated = true;
  try {
    const raw = localStorage.getItem(CANONICAL_MAP_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof k === 'string' && typeof v === 'string' && v.trim()) {
          canonicalMemoryMap.set(k.toLowerCase(), v.trim());
        }
      });
    }
  } catch {
    // Stockage local restreint ou indisponible
  }
}

export function isValidTenantIdentifier(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return Boolean(trimmed) && !INVALID_TENANTS.has(trimmed.toLowerCase());
}

/** Enregistre la casse canonique officielle (`docSnap.id`) en mémoire et dans `localStorage`. */
export function registerCanonicalGroupId(canonicalDocId) {
  if (!isValidTenantIdentifier(canonicalDocId)) return;
  hydrateCanonicalMap();
  const clean = canonicalDocId.trim();
  canonicalMemoryMap.set(clean.toLowerCase(), clean);
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_MAP_STORAGE_KEY, JSON.stringify(Object.fromEntries(canonicalMemoryMap)));
  } catch {
    // Ignorer en navigation restreinte
  }
}

/** Retourne la casse canonique connue pour un `groupId` (ou la valeur nettoyée par défaut). */
export function canonicalizeGroupId(groupId) {
  if (!groupId || typeof groupId !== 'string') return groupId;
  const trimmed = groupId.trim();
  if (!trimmed) return '';
  hydrateCanonicalMap();
  return canonicalMemoryMap.get(trimmed.toLowerCase()) || trimmed;
}

/** Génère dynamiquement les variantes de casse d'un identifiant pour `where('groupId', 'in', ...)`. */
export function buildGroupVariants(rawGroupId) {
  const trimmed = String(rawGroupId || '').trim();
  if (!trimmed || !isValidTenantIdentifier(trimmed)) return [];
  const canonical = canonicalizeGroupId(trimmed) || trimmed;
  const lower = trimmed.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const upper = trimmed.toUpperCase();
  return Array.from(new Set([canonical, trimmed, lower, capitalized, upper])).filter(Boolean);
}

export const buildGroupQueryVariants = buildGroupVariants;

export function isSameGroupCaseInsensitive(g1, g2) {
  if (!g1 || !g2) return g1 === g2;
  return String(g1).trim().toLowerCase() === String(g2).trim().toLowerCase();
}

/** Détecte si l'hôte courant est un nom de domaine vitrine personnalisé externe à l'infrastructure O Girador. */
export function isCustomDomainHost(hostname) {
  const h = String(hostname || '').trim().toLowerCase();
  if (!h || h === 'localhost' || h === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return false;
  if (h === 'o-girador.com' || h.endsWith('.o-girador.com')) return false;
  if (h.endsWith('.web.app') || h.endsWith('.firebaseapp.com')) return false;
  return true;
}

/** Persiste le dernier groupe canonique connu (`og_last_tenant_id`) pour réouverture directe en PWA. */
export function saveLastKnownTenantId(groupId) {
  if (typeof window === 'undefined') return;
  try {
    if (!groupId || !isValidTenantIdentifier(groupId)) {
      localStorage.removeItem(LAST_TENANT_STORAGE_KEY);
      localStorage.removeItem('girador_saved_group_id');
      return;
    }
    const canonical = canonicalizeGroupId(groupId);
    localStorage.setItem(LAST_TENANT_STORAGE_KEY, canonical);
    localStorage.setItem('girador_saved_group_id', canonical);
  } catch {
    // Ignorer les restrictions de stockage
  }
}

export function getLastKnownTenantId() {
  if (typeof window === 'undefined') return null;
  try {
    const candidate = localStorage.getItem(LAST_TENANT_STORAGE_KEY)
      || localStorage.getItem('girador_saved_group_id')
      || localStorage.getItem('ogirador_last_group_id');
    return isValidTenantIdentifier(candidate) ? canonicalizeGroupId(candidate) : null;
  } catch {
    return null;
  }
}

export function saveCachedDomainGroupId(hostname, canonicalId) {
  if (typeof window === 'undefined' || !hostname || !isValidTenantIdentifier(canonicalId)) return;
  try {
    const raw = localStorage.getItem(DOMAIN_MAP_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[String(hostname).trim().toLowerCase()] = canonicalId.trim();
    localStorage.setItem(DOMAIN_MAP_STORAGE_KEY, JSON.stringify(map));
  } catch { /* Ignorer */ }
}

export function getCachedDomainGroupId(hostname) {
  if (typeof window === 'undefined' || !hostname) return null;
  try {
    const map = JSON.parse(localStorage.getItem(DOMAIN_MAP_STORAGE_KEY) || '{}');
    const found = map[String(hostname).trim().toLowerCase()];
    return isValidTenantIdentifier(found) ? canonicalizeGroupId(found) : null;
  } catch { return null; }
}

export { resolveCanonicalGroupFromFirestore } from './tenantFirestoreResolver.js';
