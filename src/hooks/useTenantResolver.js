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
      if (h === 'samambaia-maracatu.fr' || h === 'www.samambaia-maracatu.fr' || h.includes('samambaia')) {
        initGroup = 'Samambaia'; initTenantId = 'samambaia';
        initialMode = (p.startsWith('/app') || p.startsWith('/login') || p.startsWith('/events') || p.startsWith('/agenda')) ? 'organizador' : 'mostrador';
      } else if (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || h.includes('mostrador')) {
        initialMode = 'mostrador';
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

      // 0. Sécurisation inconditionnelle absolue pour Samambaia sur son domaine dédié
      if (hostname === 'samambaia-maracatu.fr' || hostname === 'www.samambaia-maracatu.fr' || hostname.includes('samambaia')) {
        const p = window.location.pathname || '';
        const isApp = p.startsWith('/app') || p.startsWith('/login') || p.startsWith('/events') || p.startsWith('/agenda');
        const sMode = (urlParams.get('app') === 'mostrador' || p.startsWith('/vitrine') || !isApp) ? 'mostrador' : 'organizador';

        setTenantState({
          appMode: sMode, groupId: 'Samambaia', tenantId: 'samambaia', isLocalhost: isLocal,
          isTenantLoading: false, tenantError: null, error: null, notFound: false,
          urls: {
            mostrador: 'https://samambaia-maracatu.fr',
            organizador: isLocal ? '/login?app=organizador&tenant=Samambaia' : 'https://samambaia.organizador.o-girador.com'
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
        extractedGroupId = tenantParam || import.meta.env.VITE_DEFAULT_TENANT || null;
      } 
      // 2. Production
      else {
        if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
          currentMode = 'orchestrador'; extractedGroupId = tenantParam || null;
        } else if (hostname.includes('o-girador.com') || hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
          if (hostname.includes('mostrador')) currentMode = 'mostrador';
          else if (hostname.includes('organizador') || hostname.includes('manager')) currentMode = 'organizador';
          else if (hostname.includes('sequenciador')) currentMode = 'sequenciador';
          else if (hostname.includes('dancador')) currentMode = 'dancador';

          const parts = hostname.split('.');
          if (parts.length > 2 && !['mostrador', 'organizador', 'manager', 'sequenciador', 'dancador', 'www', 'o-girador-organizador'].includes(parts[0])) {
            extractedGroupId = parts[0];
          }
          if (tenantParam) extractedGroupId = tenantParam;
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
              const snapshot = await getDocs(q);
              if (!snapshot.empty) extractedGroupId = snapshot.docs[0].id;
              else hasError = 'NOT_FOUND';
            } catch (error) {
              console.error("Erreur résolution domaine personnalisé :", error);
              hasError = 'ERROR';
            }
          }
        }
      }

      // 4. Validation directe Firestore si paramètre explicite
      if (tenantParam && extractedGroupId) {
        try {
          const canonicalId = canonicalizeGroupId(extractedGroupId);
          let assocSnap = await getDoc(doc(db, 'associations', canonicalId));
          if (!assocSnap.exists() && canonicalId.toLowerCase() !== canonicalId) {
            const lowerSnap = await getDoc(doc(db, 'associations', canonicalId.toLowerCase()));
            if (lowerSnap.exists()) assocSnap = lowerSnap;
          }
          if (assocSnap.exists()) {
            extractedGroupId = assocSnap.id; hasError = null;
          } else if (canonicalId.toLowerCase() === 'samambaia') {
            extractedGroupId = 'Samambaia'; hasError = null;
          } else {
            hasError = 'NOT_FOUND';
          }
        } catch (error) {
          console.error("useTenantResolver - Erreur Firestore :", error);
        }
      }

      // Construction des URLs
      const canonicalGroupId = canonicalizeGroupId(extractedGroupId);
      let mostradorUrl = '', organizadorUrl = '';

      if (isLocal) {
        mostradorUrl = `/?app=mostrador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`;
        organizadorUrl = `/login?app=organizador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`;
      } else {
        const groupPrefix = canonicalGroupId ? `${canonicalGroupId.toLowerCase()}.` : '';
        mostradorUrl = canonicalGroupId ? `https://mostrador.o-girador.com/?tenant=${encodeURIComponent(canonicalGroupId.toLowerCase())}` : 'https://mostrador.o-girador.com';
        organizadorUrl = `https://${groupPrefix}organizador.o-girador.com`;
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
    };

    resolveTenant();
  }, []);

  return tenantState;
}
