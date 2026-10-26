import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { DEMO_GROUP_ID } from '../data/demoData';
import { canonicalizeGroupId } from '../utils/tenantUtils';

export default function useTenantResolver() {
  const [tenantState, setTenantState] = useState(() => {
    let initialMode = 'organizador', initGroup = null, initTenantId = null;
    if (typeof window !== 'undefined') {
      const h = window.location.hostname || '', p = window.location.pathname || '', s = new URLSearchParams(window.location.search || '');
      const pathTenant = p.split('/').filter(Boolean)[0];
      const reservedRoutes = ['api', 'login', 'setup', 'app', 'vitrine', 'mostrador', 'demo', 'agenda', 'events'];
      const isPathTenantValid = pathTenant && !reservedRoutes.includes(pathTenant.toLowerCase());

      const isDedicatedVitrine = h === 'samambaia-maracatu.fr' || h === 'www.samambaia-maracatu.fr';
      const isOrganizadorHost = h.includes('organizador') || h.includes('manager') || h === 'localhost' || h === '127.0.0.1';

      if (isDedicatedVitrine) {
        initGroup = 'Samambaia';
        initTenantId = 'samambaia';
        initialMode = (p.startsWith('/app') || p.startsWith('/login') || p.startsWith('/events') || p.startsWith('/agenda')) ? 'organizador' : 'mostrador';
      } else if (isOrganizadorHost) {
        initialMode = (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador')) ? 'mostrador' : 'organizador';
        const urlTenant = s.get('tenant') || s.get('groupe') || s.get('groupId') || s.get('assoc');
        if (urlTenant) {
          initTenantId = urlTenant.toLowerCase();
          initGroup = canonicalizeGroupId(urlTenant);
        } else if (h.includes('samambaia')) {
          initTenantId = 'samambaia';
          initGroup = 'Samambaia';
        }
      } else if (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || h.includes('mostrador')) {
        initialMode = 'mostrador';
        if (h.includes('mostrador') && isPathTenantValid) {
          initTenantId = pathTenant.toLowerCase();
          initGroup = canonicalizeGroupId(pathTenant);
        } else if (s.get('tenant') || s.get('groupe') || s.get('groupId')) {
          const legacy = (s.get('tenant') || s.get('groupe') || s.get('groupId')).trim();
          initTenantId = legacy.toLowerCase();
          initGroup = canonicalizeGroupId(legacy);
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
      const reservedRoutes = ['api', 'login', 'setup', 'app', 'vitrine', 'mostrador', 'demo', 'agenda', 'events'];
      const pathTenant = (window.location.pathname || '').split('/').filter(Boolean)[0];
      const isPathTenantValid = pathTenant && !reservedRoutes.includes(pathTenant.toLowerCase());

      try {
        // 0. Sécurisation inconditionnelle pour Samambaia sur son domaine vitrine dédié (samambaia-maracatu.fr)
        if (hostname === 'samambaia-maracatu.fr' || hostname === 'www.samambaia-maracatu.fr') {
          const p = window.location.pathname || '';
          const isApp = p.startsWith('/app') || p.startsWith('/login') || p.startsWith('/events') || p.startsWith('/agenda');
          const sMode = (urlParams.get('app') === 'mostrador' || p.startsWith('/vitrine') || !isApp) ? 'mostrador' : 'organizador';

          setTenantState({
            appMode: sMode, groupId: 'Samambaia', tenantId: 'samambaia', isLocalhost: isLocal,
            isTenantLoading: false, tenantError: null, error: null, notFound: false,
            urls: {
              mostrador: 'https://samambaia-maracatu.fr',
              organizador: isLocal ? '/login?app=organizador&tenant=Samambaia' : 'https://organizador.o-girador.com/?tenant=samambaia'
            }
          });
          return;
        }

        // Mode Démo Maracatu Na Chuva
        if (isDemoMode()) {
          const isMostrador = urlParams.get('app') === 'mostrador' || window.location.pathname.includes('/vitrine') || window.location.pathname.includes('/mostrador');
          setTenantState({
            appMode: isMostrador ? 'mostrador' : 'organizador', groupId: DEMO_GROUP_ID, tenantId: DEMO_GROUP_ID,
            isLocalhost: isLocal, isTenantLoading: false, tenantError: null, error: null, notFound: false,
            urls: { mostrador: '/demo?app=mostrador', organizador: '/demo?app=organizador' }
          });
          return;
        }
        
        let currentMode = 'organizador', extractedGroupId = null, hasError = null;
        const tenantParam = urlParams.get('tenant') || urlParams.get('groupe') || urlParams.get('groupId') || urlParams.get('assoc');

        // 1. Localhost
        if (isLocal) {
          const isPathVitrine = window.location.pathname.startsWith('/vitrine') || window.location.pathname.startsWith('/mostrador');
          currentMode = (urlParams.get('app') === 'mostrador' || isPathVitrine) ? 'mostrador' : (urlParams.get('app') || import.meta.env.VITE_DEFAULT_APP || 'organizador');
          if (currentMode === 'mostrador' && isPathTenantValid) {
            extractedGroupId = pathTenant.toLowerCase();
          } else {
            extractedGroupId = tenantParam || import.meta.env.VITE_DEFAULT_TENANT || null;
          }
        } 
        // 2. Production
        else {
          if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
            currentMode = 'orchestrador'; extractedGroupId = tenantParam || null;
          } else if (hostname.includes('o-girador.com') || hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
            if (hostname.includes('mostrador')) {
              currentMode = 'mostrador';
              if (isPathTenantValid) {
                extractedGroupId = pathTenant.toLowerCase();
              }
            }
            else if (hostname.includes('organizador') || hostname.includes('manager')) currentMode = 'organizador';
            else if (hostname.includes('sequenciador')) currentMode = 'sequenciador';
            else if (hostname.includes('dancador')) currentMode = 'dancador';

            const parts = hostname.split('.');
            if (parts.length > 2 && !['mostrador', 'organizador', 'manager', 'sequenciador', 'dancador', 'www', 'o-girador-organizador'].includes(parts[0])) {
              extractedGroupId = parts[0];
            }
            if (!extractedGroupId && tenantParam) {
              extractedGroupId = tenantParam;
            }
            if (urlParams.get('app') === 'mostrador' || window.location.pathname.startsWith('/vitrine') || window.location.pathname.startsWith('/mostrador')) {
              currentMode = 'mostrador';
            }
          } else {
            currentMode = 'mostrador';
            if (tenantParam) {
              extractedGroupId = tenantParam;
            } else {
              try {
                const possibleHostnames = [hostname, hostname.startsWith('www.') ? hostname.replace(/^www\./, '') : `www.${hostname}`];
                const q = query(collection(db, 'associations'), where('customDomains', 'array-contains-any', possibleHostnames));
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2500));
                const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
                if (snapshot && !snapshot.empty) extractedGroupId = snapshot.docs[0].id;
                else hasError = 'NOT_FOUND';
              } catch (error) {
                console.warn("Erreur ou timeout résolution domaine personnalisé :", error);
                hasError = 'ERROR';
              }
            }
          }
        }

        // 4. Validation directe Firestore de l'identifiant de groupe (chemin direct ou paramètre)
        if (extractedGroupId) {
          const canonicalId = canonicalizeGroupId(extractedGroupId);
          if (canonicalId && canonicalId.toLowerCase() === 'samambaia') {
            // Résolution statique instantanée pour Samambaia : zéro latence, zéro risque Firestore
            extractedGroupId = 'Samambaia';
            hasError = null;
          } else if (canonicalId && canonicalId.toLowerCase() === 'sambabulles') {
            // Résolution statique instantanée pour Samb'à Bulles : zéro latence, zéro risque Firestore
            extractedGroupId = 'sambabulles';
            hasError = null;
          } else {
            try {
              const docPromise = getDoc(doc(db, 'associations', canonicalId));
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2500));
              const assocSnap = await Promise.race([docPromise, timeoutPromise]);
              if (assocSnap && assocSnap.exists()) {
                extractedGroupId = assocSnap.id;
                hasError = null;
              } else {
                hasError = 'NOT_FOUND';
              }
            } catch (error) {
              console.warn("useTenantResolver - Résolution Firestore différée ou timeout :", error);
              extractedGroupId = canonicalId;
              hasError = null;
            }
          }
        }

        // Construction des URLs
        const canonicalGroupId = canonicalizeGroupId(extractedGroupId);
        let mostradorUrl = '', organizadorUrl = '';

        if (isLocal) {
          mostradorUrl = canonicalGroupId ? `/?app=mostrador&tenant=${encodeURIComponent(canonicalGroupId)}` : '/?app=mostrador';
          organizadorUrl = `/login?app=organizador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`;
        } else {
          const groupParam = canonicalGroupId ? `?tenant=${encodeURIComponent(canonicalGroupId.toLowerCase())}` : '';
          const isSam = canonicalGroupId && canonicalGroupId.toLowerCase() === 'samambaia';
          mostradorUrl = isSam
            ? 'https://samambaia-maracatu.fr'
            : (canonicalGroupId ? `https://mostrador.o-girador.com/${encodeURIComponent(canonicalGroupId.toLowerCase())}` : 'https://mostrador.o-girador.com');
          organizadorUrl = `https://organizador.o-girador.com/${groupParam}`;
        }

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
        console.error("useTenantResolver - Erreur critique inattendue lors de la résolution du tenant :", err);
        // Filet de secours anti-blocage absolu : repli immédiat sur Samambaia et libération du chargement
        setTenantState({
          appMode: 'organizador',
          groupId: 'Samambaia',
          tenantId: 'samambaia',
          isLocalhost: isLocal,
          isTenantLoading: false,
          tenantError: null,
          error: null,
          notFound: false,
          urls: { mostrador: '', organizador: '/login?app=organizador' }
        });
      }
    };

    resolveTenant();
  }, []);

  return tenantState;
}
