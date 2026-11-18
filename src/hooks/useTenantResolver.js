import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { DEMO_GROUP_ID } from '../data/demoData';
import {
  canonicalizeGroupId,
  isCustomDomainHost,
  registerCanonicalGroupId,
  saveLastKnownTenantId,
  saveCachedDomainGroupId,
  getCachedDomainGroupId,
  resolveCanonicalGroupFromFirestore
} from '../utils/tenantUtils';
import { getVitrineUrl } from '../utils/urlUtils';
import { RESERVED_SUBDOMAINS } from './useGroupContext';

const RESERVED_ROUTES = ['api', 'login', 'setup', 'app', 'vitrine', 'mostrador', 'demo', 'agenda', 'events'];

/**
 * Hook de résolution dynamique Multi-Associations (Organizador & Mostrador).
 * Résout la casse canonique via Firestore (`Promise.allSettled`) et les domaines vitrines via `customDomains`.
 */
export default function useTenantResolver() {
  const [tenantState, setTenantState] = useState(() => {
    let initialMode = 'organizador', initGroup = null, initTenantId = null;
    if (typeof window !== 'undefined') {
      const h = window.location.hostname || '', p = window.location.pathname || '', s = new URLSearchParams(window.location.search || '');
      const pathTenant = p.split('/').filter(Boolean)[0];
      const isPathTenantValid = pathTenant && !RESERVED_ROUTES.includes(pathTenant.toLowerCase());
      const urlTenant = s.get('tenant') || s.get('groupe') || s.get('groupId') || s.get('assoc');

      if (isCustomDomainHost(h)) {
        const cached = getCachedDomainGroupId(h);
        initGroup = cached;
        initTenantId = cached ? cached.toLowerCase() : null;
        initialMode = (p.startsWith('/app') || p.startsWith('/login') || p.startsWith('/events') || p.startsWith('/agenda')) ? 'organizador' : 'mostrador';
      } else if (h.includes('organizador') || h.includes('manager') || h === 'localhost' || h === '127.0.0.1') {
        initialMode = (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador')) ? 'mostrador' : 'organizador';
        if (urlTenant) {
          initTenantId = urlTenant.trim().toLowerCase();
          initGroup = canonicalizeGroupId(urlTenant);
        }
      } else if (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || h.includes('mostrador')) {
        initialMode = 'mostrador';
        const raw = (h.includes('mostrador') && isPathTenantValid) ? pathTenant : (urlTenant || '');
        if (raw.trim()) {
          initTenantId = raw.trim().toLowerCase();
          initGroup = canonicalizeGroupId(raw.trim());
        }
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
      const pathTenant = pathname.split('/').filter(Boolean)[0];
      const isPathTenantValid = pathTenant && !RESERVED_ROUTES.includes(pathTenant.toLowerCase());

      try {
        if (isDemoMode()) {
          const isMostrador = urlParams.get('app') === 'mostrador' || pathname.includes('/vitrine') || pathname.includes('/mostrador');
          setTenantState({
            appMode: isMostrador ? 'mostrador' : 'organizador', groupId: DEMO_GROUP_ID, tenantId: DEMO_GROUP_ID,
            isLocalhost: isLocal, isTenantLoading: false, tenantError: null, error: null, notFound: false,
            urls: { mostrador: '/demo?app=mostrador', organizador: '/demo?app=organizador' }
          });
          return;
        }

        let currentMode = 'organizador', extractedGroupId = null, resolvedAssocData = null, hasError = null;
        const tenantParam = urlParams.get('tenant') || urlParams.get('groupe') || urlParams.get('groupId') || urlParams.get('assoc');

        // 1. Domaine personnalisé d'association (résolution dynamique via customDomains)
        if (isCustomDomainHost(hostname)) {
          const isAppRoute = pathname.startsWith('/app') || pathname.startsWith('/login') || pathname.startsWith('/events') || pathname.startsWith('/agenda');
          currentMode = (urlParams.get('app') === 'mostrador' || pathname.startsWith('/vitrine') || !isAppRoute) ? 'mostrador' : 'organizador';
          if (tenantParam) {
            extractedGroupId = tenantParam;
          } else {
            try {
              const possibleHostnames = [hostname, hostname.startsWith('www.') ? hostname.replace(/^www\./, '') : `www.${hostname}`];
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
              } else {
                hasError = 'NOT_FOUND';
              }
            } catch (error) {
              console.warn('useTenantResolver - Timeout ou erreur résolution customDomains :', error);
              extractedGroupId = getCachedDomainGroupId(hostname);
              if (!extractedGroupId) hasError = 'ERROR';
            }
          }
        } else if (isLocal) {
          const isPathVitrine = pathname.startsWith('/vitrine') || pathname.startsWith('/mostrador');
          currentMode = (urlParams.get('app') === 'mostrador' || isPathVitrine) ? 'mostrador' : (urlParams.get('app') || import.meta.env.VITE_DEFAULT_APP || 'organizador');
          extractedGroupId = (currentMode === 'mostrador' && isPathTenantValid)
            ? pathTenant
            : (tenantParam || import.meta.env.VITE_DEFAULT_TENANT || null);
        } else if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
          currentMode = 'orquestrador';
          extractedGroupId = tenantParam || null;
        } else {
          if (hostname.includes('mostrador')) {
            currentMode = 'mostrador';
            if (isPathTenantValid) extractedGroupId = pathTenant;
          } else if (hostname.includes('sequenciador')) currentMode = 'sequenciador';
          else if (hostname.includes('dancador')) currentMode = 'dancador';
          else if (hostname.includes('cantador')) currentMode = 'cantador';

          const parts = hostname.split('.');
          if (!extractedGroupId && parts.length > 2 && !RESERVED_SUBDOMAINS.includes(parts[0].toLowerCase())) {
            extractedGroupId = parts[0];
          }
          if (!extractedGroupId && tenantParam) extractedGroupId = tenantParam;
          if (urlParams.get('app') === 'mostrador' || pathname.startsWith('/vitrine') || pathname.startsWith('/mostrador')) {
            currentMode = 'mostrador';
          }
        }

        // 2. Résolution canonique sans race condition via Promise.allSettled sur associations/{id}
        if (extractedGroupId && !resolvedAssocData) {
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 3500));
          const check = await Promise.race([resolveCanonicalGroupFromFirestore(db, extractedGroupId), timeoutPromise]);
          if (check?.timeout || check?.networkError) {
            extractedGroupId = canonicalizeGroupId(extractedGroupId);
            hasError = null;
          } else if (check?.exists && check.canonicalId) {
            extractedGroupId = check.canonicalId;
            resolvedAssocData = check.data;
            hasError = null;
          } else {
            extractedGroupId = null;
            hasError = 'NOT_FOUND';
          }
        }

        const canonicalGroupId = extractedGroupId ? canonicalizeGroupId(extractedGroupId) : null;
        const groupParam = canonicalGroupId ? `?tenant=${encodeURIComponent(canonicalGroupId.toLowerCase())}` : '';
        const mostradorUrl = isLocal
          ? (canonicalGroupId ? `/?app=mostrador&tenant=${encodeURIComponent(canonicalGroupId)}` : '/?app=mostrador')
          : getVitrineUrl(canonicalGroupId, resolvedAssocData || {});
        const organizadorUrl = isLocal
          ? `/login?app=organizador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`
          : `https://organizador.o-girador.com/${groupParam}`;

        setTenantState({
          appMode: currentMode,
          groupId: canonicalGroupId,
          tenantId: canonicalGroupId ? canonicalGroupId.toLowerCase() : null,
          isLocalhost: isLocal,
          isTenantLoading: false,
          tenantError: hasError,
          error: hasError,
          notFound: hasError === 'NOT_FOUND',
          urls: { mostrador: mostradorUrl, organizador: organizadorUrl }
        });
      } catch (err) {
        console.error('useTenantResolver - Erreur critique inattendue :', err);
        setTenantState({
          appMode: 'organizador', groupId: null, tenantId: null, isLocalhost: isLocal,
          isTenantLoading: false, tenantError: null, error: null, notFound: false,
          urls: { mostrador: '', organizador: '/login?app=organizador' }
        });
      }
    };

    resolveTenant();
  }, []);

  return tenantState;
}
