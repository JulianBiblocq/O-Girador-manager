import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { DEMO_GROUP_ID } from '../data/demoData';
import { canonicalizeGroupId } from '../utils/tenantUtils';

export default function useTenantResolver() {
  const [tenantState, setTenantState] = useState(() => {
    let initialMode = 'organizador';
    if (typeof window !== 'undefined') {
      const h = window.location.hostname || '';
      const p = window.location.pathname || '';
      const s = new URLSearchParams(window.location.search || '');
      if (s.get('app') === 'mostrador' || p.startsWith('/vitrine') || p.startsWith('/mostrador') || h.includes('mostrador') || h.includes('samambaia-maracatu.fr')) {
        initialMode = 'mostrador';
      }
    }
    return {
      appMode: initialMode,
      groupId: null,
      isLocalhost: false,
      isTenantLoading: true,
      tenantError: null,
      urls: { mostrador: '', organizador: '' }
    };
  });

  useEffect(() => {
    const resolveTenant = async () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

      // En Mode Démo, résoudre instantanément pour l'association Maracatu Na Chuva
      if (isDemoMode()) {
        const isMostrador = urlParams.get('app') === 'mostrador' ||
          window.location.pathname.includes('/vitrine') ||
          window.location.pathname.includes('/mostrador');

        setTenantState({
          appMode: isMostrador ? 'mostrador' : 'organizador',
          groupId: DEMO_GROUP_ID,
          isLocalhost: isLocal,
          isTenantLoading: false,
          tenantError: null,
          urls: { 
            mostrador: '/demo?app=mostrador', 
            organizador: '/demo?app=organizador' 
          }
        });
        return;
      }
      
      let currentMode = 'organizador';
      let extractedGroupId = null;
      let hasError = null;

      // Détection prioritaire absolue des Query Parameters (?tenant=... ou ?groupe=...)
      const tenantParam = urlParams.get('tenant') || urlParams.get('groupe') || urlParams.get('groupId') || urlParams.get('assoc');

      // 1. Détermination du mode et groupId via environnement local
      if (isLocal) {
        const isPathVitrine = window.location.pathname.startsWith('/vitrine') || window.location.pathname.startsWith('/mostrador');
        if (urlParams.get('app') === 'mostrador' || isPathVitrine) {
          currentMode = 'mostrador';
        } else {
          currentMode = urlParams.get('app') || import.meta.env.VITE_DEFAULT_APP || 'organizador';
        }
        extractedGroupId = tenantParam || import.meta.env.VITE_DEFAULT_TENANT || null;
      } 
      // 2. Environnement de production / En ligne
      else {
        // Est-ce le domaine racine absolu ?
        if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
          currentMode = 'orchestrador';
          extractedGroupId = tenantParam || null;
        } else if (hostname.includes('o-girador.com') || hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
          // Sous-domaine standard de notre écosystème
          if (hostname.includes('mostrador')) {
            currentMode = 'mostrador';
          } else if (hostname.includes('organizador') || hostname.includes('manager')) {
            currentMode = 'organizador';
          } else if (hostname.includes('sequenciador')) {
            currentMode = 'sequenciador';
          } else if (hostname.includes('dancador')) {
            currentMode = 'dancador';
          }

          const parts = hostname.split('.');
          // Si le premier sous-domaine n'est pas le nom de l'app, c'est le groupe
          if (parts.length > 2 && !['mostrador', 'organizador', 'manager', 'sequenciador', 'dancador', 'www', 'o-girador-organizador'].includes(parts[0])) {
            extractedGroupId = parts[0];
          }

          // Tolérance Deep Linking : paramètre URL explicite prioritaire absolu
          if (tenantParam) {
            extractedGroupId = tenantParam;
          }
          if (urlParams.get('app') === 'mostrador' || window.location.pathname.startsWith('/vitrine') || window.location.pathname.startsWith('/mostrador')) {
            currentMode = 'mostrador';
          }
        } else {
          // 3. Domaine personnalisé externe (ex: www.samambaia-maracatu.fr) -> Vitrine publique
          currentMode = 'mostrador';

          if (tenantParam) {
            extractedGroupId = tenantParam;
          } else if (hostname.includes('samambaia-maracatu.fr') || hostname.includes('samambaia')) {
            extractedGroupId = 'Samambaia';
            hasError = null;
          } else {
            try {
              const associationsRef = collection(db, 'associations');
              const possibleHostnames = [hostname];
              if (hostname.startsWith('www.')) possibleHostnames.push(hostname.replace(/^www\./, ''));
              else possibleHostnames.push(`www.${hostname}`);

              const q = query(associationsRef, where('customDomains', 'array-contains-any', possibleHostnames));
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                extractedGroupId = snapshot.docs[0].id;
              } else {
                hasError = 'NOT_FOUND';
              }
            } catch (error) {
              console.error("Erreur résolution domaine personnalisé :", error);
              hasError = 'ERROR';
            }
          }
        }
      }

      // 4. Validation directe dans Firestore si un tenant a été explicitement transmis
      if (tenantParam && extractedGroupId) {
        try {
          const canonicalId = canonicalizeGroupId(extractedGroupId);
          const assocDocRef = doc(db, 'associations', canonicalId);
          let assocSnap = await getDoc(assocDocRef);
          if (!assocSnap.exists() && canonicalId.toLowerCase() !== canonicalId) {
            const lowerSnap = await getDoc(doc(db, 'associations', canonicalId.toLowerCase()));
            if (lowerSnap.exists()) {
              assocSnap = lowerSnap;
            }
          }
          if (assocSnap.exists()) {
            extractedGroupId = assocSnap.id;
            hasError = null;
          } else if (canonicalId.toLowerCase() === 'samambaia') {
            extractedGroupId = 'Samambaia';
            hasError = null;
          } else {
            console.warn(`useTenantResolver - Association '${canonicalId}' introuvable dans Firestore.`);
            hasError = 'NOT_FOUND';
          }
        } catch (error) {
          console.error("useTenantResolver - Erreur lors de la vérification Firestore :", error);
        }
      }

      // Construction des URLs de navigation croisée
      let mostradorUrl = '';
      let organizadorUrl = '';

      const canonicalGroupId = canonicalizeGroupId(extractedGroupId);

      if (isLocal) {
        mostradorUrl = `/?app=mostrador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`;
        organizadorUrl = `/login?app=organizador${canonicalGroupId ? `&tenant=${encodeURIComponent(canonicalGroupId)}` : ''}`;
      } else {
        const groupPrefix = canonicalGroupId ? `${canonicalGroupId.toLowerCase()}.` : '';
        mostradorUrl = canonicalGroupId 
          ? `https://mostrador.o-girador.com/?tenant=${encodeURIComponent(canonicalGroupId.toLowerCase())}` 
          : 'https://mostrador.o-girador.com';
        organizadorUrl = `https://${groupPrefix}organizador.o-girador.com`;
      }

      setTenantState({
        appMode: currentMode,
        groupId: canonicalGroupId,
        isLocalhost: isLocal,
        isTenantLoading: false,
        tenantError: hasError,
        urls: {
          mostrador: mostradorUrl,
          organizador: organizadorUrl
        }
      });
    };

    resolveTenant();
  }, []);

  return tenantState;
}
