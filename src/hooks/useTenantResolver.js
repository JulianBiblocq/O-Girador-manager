import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { DEMO_GROUP_ID } from '../data/demoData';
import {
  canonicalizeGroupId, isCustomDomainHost, registerCanonicalGroupId,
  saveLastKnownTenantId, saveCachedDomainGroupId, getCachedDomainGroupId,
  resolveCanonicalGroupFromFirestore
} from '../utils/tenantUtils';
import {
  isLockedVitrineHost, isMostradorPlatformHost, isPublicVolunteerRoute,
  extractVitrineSlugFromPath, buildOrganizadorMemberUrl
} from '../utils/vitrineLockUtils';
import { getVitrineUrl } from '../utils/urlUtils';
import { RESERVED_SUBDOMAINS } from './useGroupContext';

/**
 * Hook de résolution dynamique Multi-Associations (Organizador & Mostrador).
 * Verrouille inconditionnellement Mostrador sur les domaines personnalisés et `mostrador.o-girador.com`.
 */
export default function useTenantResolver() {
  const [tenantState, setTenantState] = useState(() => {
    let initialMode = 'organizador', initGroup = null, initTenantId = null;
    if (typeof window !== 'undefined') {
      const h = window.location.hostname || '', p = window.location.pathname || '';
      const s = new URLSearchParams(window.location.search || '');
      const urlTenant = s.get('tenant') || s.get('groupe') || s.get('groupId') || s.get('assoc');

      if (isLockedVitrineHost(h)) {
        initialMode = 'mostrador';
        if (isCustomDomainHost(h)) {
          initGroup = getCachedDomainGroupId(h);
          initTenantId = initGroup ? initGroup.toLowerCase() : null;
        } else {
          const raw = extractVitrineSlugFromPath(p, h) || urlTenant || '';
          if (raw.trim()) {
            initTenantId = raw.trim().toLowerCase();
            initGroup = canonicalizeGroupId(raw.trim());
          }
        }
      } else if (h.includes('organizador') || h.includes('manager') || h === 'localhost' || h === '127.0.0.1') {
        initialMode = (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || isPublicVolunteerRoute(p)) ? 'mostrador' : 'organizador';
        if (urlTenant) { initTenantId = urlTenant.trim().toLowerCase(); initGroup = canonicalizeGroupId(urlTenant); }
      } else if (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || isPublicVolunteerRoute(p)) {
        initialMode = 'mostrador';
        if (urlTenant?.trim()) { initTenantId = urlTenant.trim().toLowerCase(); initGroup = canonicalizeGroupId(urlTenant.trim()); }
      }
    }
    return {
      appMode: initialMode, groupId: initGroup, tenantId: initTenantId,
      isLocalhost: false, isTenantLoading: true, tenantError: null, error: null, notFound: false,
      urls: { mostrador: '', organizador: '' }
    };
  });

  useEffect(() => {
    const resolveTenant = async () => {
      if (typeof window === 'undefined') return;
      const hostname = window.location.hostname, urlParams = new URLSearchParams(window.location.search);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const pathname = window.location.pathname || '';
      const pathSlug = extractVitrineSlugFromPath(pathname, hostname);

      try {
        if (isDemoMode()) {
          const isMostrador = urlParams.get('app') === 'mostrador' || pathname.includes('/vitrine') || pathname.includes('/mostrador') || isPublicVolunteerRoute(pathname);
          setTenantState({
            appMode: isMostrador ? 'mostrador' : 'organizador', groupId: DEMO_GROUP_ID, tenantId: DEMO_GROUP_ID,
            isLocalhost: isLocal, isTenantLoading: false, tenantError: null, error: null, notFound: false,
            urls: { mostrador: '/demo?app=mostrador', organizador: '/demo?app=organizador' }
          });
          return;
        }

        let currentMode = 'organizador', extractedGroupId = null, resolvedAssocData = null, hasError = null;
        const tenantParam = urlParams.get('tenant') || urlParams.get('groupe') || urlParams.get('groupId') || urlParams.get('assoc');

        if (isCustomDomainHost(hostname)) {
          currentMode = 'mostrador';
          try {
            const cleanHost = hostname.replace(/^www\./, '');
            const possibleHostnames = Array.from(new Set([hostname, cleanHost, `www.${cleanHost}`]));
            const q = query(collection(db, 'associations'), where('customDomains', 'array-contains-any', possibleHostnames));
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3500));
            const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
            if (snapshot && !snapshot.empty) {
              const matchedDoc = snapshot.docs[0];
              extractedGroupId = matchedDoc.id;
              resolvedAssocData = matchedDoc.data() || {};
              registerCanonicalGroupId(matchedDoc.id);
              saveCachedDomainGroupId(hostname, matchedDoc.id);
              saveLastKnownTenantId(matchedDoc.id);
            } else if (tenantParam) {
              extractedGroupId = tenantParam;
            } else {
              hasError = 'NOT_FOUND';
            }
          } catch (error) {
            console.warn('useTenantResolver - Timeout ou erreur résolution customDomains :', error);
            extractedGroupId = getCachedDomainGroupId(hostname) || tenantParam || null;
            if (!extractedGroupId) hasError = 'ERROR';
          }
        } else if (isMostradorPlatformHost(hostname)) {
          currentMode = 'mostrador';
          extractedGroupId = pathSlug || tenantParam || null;
        } else if (isLocal) {
          const isPathVitrine = pathname.startsWith('/vitrine') || pathname.startsWith('/mostrador') || isPublicVolunteerRoute(pathname);
          currentMode = (urlParams.get('app') === 'mostrador' || isPathVitrine) ? 'mostrador' : (urlParams.get('app') || import.meta.env.VITE_DEFAULT_APP || 'organizador');
          extractedGroupId = (currentMode === 'mostrador' && pathSlug) ? pathSlug : (tenantParam || import.meta.env.VITE_DEFAULT_TENANT || null);
        } else if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
          currentMode = 'orquestrador';
          extractedGroupId = tenantParam || null;
        } else {
          if (hostname.includes('sequenciador')) currentMode = 'sequenciador';
          else if (hostname.includes('dancador')) currentMode = 'dancador';
          else if (hostname.includes('cantador')) currentMode = 'cantador';
          const parts = hostname.split('.');
          if (!extractedGroupId && parts.length > 2 && !RESERVED_SUBDOMAINS.includes(parts[0].toLowerCase())) extractedGroupId = parts[0];
          if (!extractedGroupId && tenantParam) extractedGroupId = tenantParam;
          if (urlParams.get('app') === 'mostrador' || pathname.startsWith('/vitrine') || pathname.startsWith('/mostrador') || isPublicVolunteerRoute(pathname)) currentMode = 'mostrador';
        }

        if (extractedGroupId && !resolvedAssocData) {
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 3500));
          const check = await Promise.race([resolveCanonicalGroupFromFirestore(db, extractedGroupId), timeoutPromise]);
          if (check?.timeout || check?.networkError) { extractedGroupId = canonicalizeGroupId(extractedGroupId); hasError = null; }
          else if (check?.exists && check.canonicalId) { extractedGroupId = check.canonicalId; resolvedAssocData = check.data; hasError = null; }
          else { extractedGroupId = null; hasError = 'NOT_FOUND'; }
        }

        const canonicalGroupId = extractedGroupId ? canonicalizeGroupId(extractedGroupId) : null;
        const mostradorUrl = isLocal
          ? (canonicalGroupId ? `/?app=mostrador&tenant=${encodeURIComponent(canonicalGroupId)}` : '/?app=mostrador')
          : getVitrineUrl(canonicalGroupId, resolvedAssocData || {});
        const organizadorUrl = buildOrganizadorMemberUrl(canonicalGroupId, { isLocal });

        setTenantState({
          appMode: currentMode, groupId: canonicalGroupId, tenantId: canonicalGroupId ? canonicalGroupId.toLowerCase() : null,
          isLocalhost: isLocal, isTenantLoading: false, tenantError: hasError, error: hasError, notFound: hasError === 'NOT_FOUND',
          urls: { mostrador: mostradorUrl, organizador: organizadorUrl }
        });
      } catch (err) {
        console.error('useTenantResolver - Erreur critique inattendue :', err);
        setTenantState({
          appMode: isLockedVitrineHost(hostname) ? 'mostrador' : 'organizador', groupId: null, tenantId: null, isLocalhost: isLocal,
          isTenantLoading: false, tenantError: null, error: null, notFound: false,
          urls: { mostrador: '', organizador: buildOrganizadorMemberUrl(null, { isLocal }) }
        });
      }
    };
    resolveTenant();
  }, []);

  return tenantState;
}
