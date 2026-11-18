import { useState, useEffect, useCallback } from 'react';
import { canonicalizeGroupId, LAST_TENANT_STORAGE_KEY, saveLastKnownTenantId } from '../utils/tenantUtils';

const STORAGE_GROUP_KEY = 'girador_saved_group_id';
const LEGACY_STORAGE_KEYS = [LAST_TENANT_STORAGE_KEY, 'girador_group_id', 'o_girador_tenant', 'savedGroupId', 'ogirador_last_group_id'];

export const RESERVED_SUBDOMAINS = Object.freeze([
  'orquestrador', 'organizador', 'sequenciador', 'cantador', 'dancador',
  'mostrador', 'afinador', 'www', 'app', 'admin', 'api',
  'manager', 'dansador', 'o-girador-organizador', 'o-girador-7828c', 'o-girador-mostrador', 'web'
]);

/**
 * Récupère le code de groupe mémorisé dans le localStorage.
 */
export function getStoredGroupId() {
  if (typeof window === 'undefined') return null;
  try {
    const current = localStorage.getItem(STORAGE_GROUP_KEY);
    if (current && current.trim()) return canonicalizeGroupId(current.trim());

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy && legacy.trim()) return canonicalizeGroupId(legacy.trim());
    }
  } catch (err) {
    console.warn("useGroupContext - Erreur lors de la lecture du localStorage :", err);
  }
  return null;
}

/**
 * Mémorise un identifiant de groupe dans le localStorage pour assurer la persistance entre sessions.
 *
 * @param {string} groupId - L'identifiant normalisé du groupe
 */
export function setStoredGroupId(groupId) {
  if (typeof window === 'undefined') return;
  try {
    if (!groupId) {
      saveLastKnownTenantId(null);
      localStorage.removeItem('selected_group_id');
      localStorage.removeItem('girador_group_id');
    } else {
      const canonical = canonicalizeGroupId(groupId);
      saveLastKnownTenantId(canonical);
    }
  } catch (err) {
    console.warn("useGroupContext - Erreur lors de l'enregistrement dans le localStorage :", err);
  }
}

/**
 * Tente de déduire le code de groupe à partir du sous-domaine de l'hôte web.
 *
 * @returns {string|null}
 */
export function extractGroupIdFromHost() {
  if (typeof window === 'undefined') return null;
  try {
    const hostname = window.location.hostname.toLowerCase();
    
    // Si localhost ou IP, pas de sous-domaine déductible
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    const parts = hostname.split('.');
    if (parts.length > 2) {
      const candidate = parts[0];
      if (!RESERVED_SUBDOMAINS.includes(candidate)) {
        return canonicalizeGroupId(candidate);
      }
    }
  } catch (err) {
    console.warn("useGroupContext - Erreur lors de la déduction d'hôte :", err);
  }
  return null;
}

/**
 * Détermine le groupId avec résilience maximale (URL -> localStorage -> hôte -> variable d'env).
 */
export function resolveResilientGroupId() {
  if (typeof window === 'undefined') return { groupId: null, source: 'none' };

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('groupe') || searchParams.get('group') || searchParams.get('tenant') || searchParams.get('assoc');
    if (urlParam && urlParam.trim()) {
      const canonical = canonicalizeGroupId(urlParam.trim());
      setStoredGroupId(canonical);
      return { groupId: canonical, source: 'url' };
    }
  } catch (err) {
    console.warn("useGroupContext - Erreur lecture query string :", err);
  }

  // 2. Vérification dans le localStorage
  const stored = getStoredGroupId();
  if (stored) {
    return { groupId: stored, source: 'storage' };
  }

  // 3. Déduction depuis l'hôte / sous-domaine
  const hostGroup = extractGroupIdFromHost();
  if (hostGroup) {
    return { groupId: hostGroup, source: 'host' };
  }

  // 4. Configuration d'environnement par défaut (si spécifiée)
  const envTenant = import.meta.env?.VITE_DEFAULT_TENANT;
  if (envTenant && typeof envTenant === 'string' && envTenant.trim()) {
    return { groupId: canonicalizeGroupId(envTenant.trim()), source: 'env' };
  }

  return { groupId: null, source: 'none' };
}

/**
 * Hook React personnalisé pour la gestion résiliente du groupe d'appartenance
 * Fournit l'état courant, la détection des cas orphelins (sans groupe) et la sélection manuelle bienveillante.
 */
export default function useGroupContext(profileData = null) {
  const [resolved, setResolved] = useState(() => {
    // Si un profil utilisateur authentifié est déjà actif, son groupId est la vérité de référence
    if (profileData?.groupId) {
      const canonical = canonicalizeGroupId(profileData.groupId);
      setStoredGroupId(canonical);
      return { groupId: canonical, source: 'profile' };
    }
    return resolveResilientGroupId();
  });

  // Mettre à jour si le profileData change en cours d'utilisation
  useEffect(() => {
    if (profileData?.groupId) {
      const canonical = canonicalizeGroupId(profileData.groupId);
      setStoredGroupId(canonical);
      setResolved({ groupId: canonical, source: 'profile' });
    }
  }, [profileData?.groupId]);

  // Écoute également les changements dans l'URL (ex: navigation deep link)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUrlChange = () => {
      const latest = resolveResilientGroupId();
      if (latest.groupId && latest.groupId !== resolved.groupId) {
        setResolved(latest);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [resolved.groupId]);

  // Définition manuelle ou réinitialisation du groupe actif
  const setManualGroupId = useCallback((customGroupId) => {
    if (!customGroupId || !customGroupId.trim()) return;
    const canonical = canonicalizeGroupId(customGroupId.trim());
    setStoredGroupId(canonical);
    setResolved({ groupId: canonical, source: 'manual' });
  }, []);

  const clearGroup = useCallback(() => {
    setStoredGroupId(null);
    if (typeof window !== 'undefined') {
      try {
        const u = new URL(window.location.href);
        ['groupe', 'group', 'tenant', 'assoc', 'groupId'].forEach((k) => u.searchParams.delete(k));
        window.history.replaceState({}, '', `${u.pathname}${u.search}${u.hash}`);
      } catch { /* Ignorer */ }
    }
    setResolved({ groupId: null, source: 'none' });
  }, []);

  return { groupId: resolved.groupId, source: resolved.source, needsGroupSelection: !resolved.groupId, setManualGroupId, clearGroup };
}
