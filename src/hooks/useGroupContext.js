import { useState, useEffect, useCallback, useMemo } from 'react';
import { canonicalizeGroupId } from '../utils/tenantUtils';

const STORAGE_GROUP_KEY = 'girador_saved_group_id';
const LEGACY_STORAGE_KEYS = ['girador_group_id', 'o_girador_tenant', 'savedGroupId'];

/**
 * Récupère le code de groupe mémorisé dans le localStorage (vérifie la clé actuelle puis les clés historiques).
 *
 * @returns {string|null} Le code groupe ou null
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
      localStorage.removeItem(STORAGE_GROUP_KEY);
    } else {
      const canonical = canonicalizeGroupId(groupId);
      localStorage.setItem(STORAGE_GROUP_KEY, canonical);
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

    // Domaines réservés de l'application
    const reservedSubdomains = [
      'www', 'app', 'mostrador', 'organizador', 'manager', 
      'sequenciador', 'dancador', 'dansador', 'orchestrador', 
      'o-girador-organizador', 'web'
    ];

    const parts = hostname.split('.');
    if (parts.length > 2) {
      const candidate = parts[0];
      if (!reservedSubdomains.includes(candidate)) {
        return canonicalizeGroupId(candidate);
      }
    }
  } catch (err) {
    console.warn("useGroupContext - Erreur lors de la déduction d'hôte :", err);
  }
  return null;
}

/**
 * Détermine le groupId avec résilience maximale :
 * 1. Paramètre URL (?groupe=, ?group=, ?tenant=, ?assoc=) avec mémorisation immédiate
 * 2. Code stocké en localStorage
 * 3. Déduction par l'hôte / sous-domaine
 * 4. Configuration d'environnement par défaut
 *
 * @returns {{ groupId: string|null, source: 'url'|'storage'|'host'|'env'|'none' }}
 */
export function resolveResilientGroupId() {
  if (typeof window === 'undefined') {
    return { groupId: null, source: 'none' };
  }

  // 1. Paramètre dans l'URL
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('groupe') || 
                     searchParams.get('group') || 
                     searchParams.get('tenant') || 
                     searchParams.get('assoc');

    if (urlParam && urlParam.trim()) {
      const canonical = canonicalizeGroupId(urlParam.trim());
      // Mémorisation immédiate dans le localStorage pour immunité contre les pertes de paramètres
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

  // Définition manuelle du groupe (suite à l'étape bienveillante)
  const setManualGroupId = useCallback((customGroupId) => {
    if (!customGroupId || !customGroupId.trim()) return;
    const canonical = canonicalizeGroupId(customGroupId.trim());
    setStoredGroupId(canonical);
    setResolved({ groupId: canonical, source: 'manual' });
  }, []);

  // Réinitialisation du groupe
  const clearGroup = useCallback(() => {
    setStoredGroupId(null);
    setResolved({ groupId: null, source: 'none' });
  }, []);

  return {
    groupId: resolved.groupId,
    source: resolved.source,
    needsGroupSelection: !resolved.groupId,
    setManualGroupId,
    clearGroup
  };
}
