import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function useTenantResolver() {
  const [tenantState, setTenantState] = useState({
    appMode: 'organizador', // Default
    groupId: null,
    isLocalhost: false,
    isTenantLoading: true,
    tenantError: null,
    urls: { mostrador: '', organizador: '' }
  });

  useEffect(() => {
    const resolveTenant = async () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      
      let currentMode = 'organizador';
      let extractedGroupId = null;
      let hasError = null;

      // 1. Détermination du mode et groupId via environnement local
      if (isLocal) {
        // Paramètres URL (priorité haute) ou Variables d'environnement
        currentMode = urlParams.get('app') || import.meta.env.VITE_DEFAULT_APP || 'organizador';
        extractedGroupId = urlParams.get('tenant') || urlParams.get('groupe') || urlParams.get('assoc') || import.meta.env.VITE_DEFAULT_TENANT || null;
      } 
      // 2. Environnement de production / En ligne
      else {
        // Est-ce le domaine racine absolu ?
        if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com') {
          currentMode = 'orchestrador';
          extractedGroupId = null;
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
        } else {
          // 3. Domaine personnalisé externe (ex: www.samambaia-maracatu.fr)
          // On considère par défaut que c'est une vitrine publique (Mostrador) pour ce groupe
          currentMode = 'mostrador';
          try {
            const associationsRef = collection(db, 'associations');
            
            // Pour supporter "www.domaine.fr" ou "domaine.fr" indifféremment
            const possibleHostnames = [hostname];
            if (hostname.startsWith('www.')) {
              possibleHostnames.push(hostname.replace(/^www\./, ''));
            } else {
              possibleHostnames.push(`www.${hostname}`);
            }

            const q = query(associationsRef, where('customDomains', 'array-contains-any', possibleHostnames));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              extractedGroupId = doc.id;
            } else {
              // Domaine inconnu
              hasError = 'NOT_FOUND';
            }
          } catch (error) {
            console.error("Erreur lors de la résolution du domaine personnalisé :", error);
            hasError = 'ERROR';
          }
        }
      }

      // Construction des URLs de navigation croisée
      let mostradorUrl = '';
      let organizadorUrl = '';

      if (isLocal) {
        mostradorUrl = `/?app=mostrador${extractedGroupId ? `&tenant=${extractedGroupId}` : ''}`;
        organizadorUrl = `/login?app=organizador${extractedGroupId ? `&tenant=${extractedGroupId}` : ''}`;
      } else {
        const groupPrefix = extractedGroupId ? `${extractedGroupId}.` : '';
        mostradorUrl = `https://${groupPrefix}mostrador.o-girador.com`;
        organizadorUrl = `https://${groupPrefix}organizador.o-girador.com`;
      }

      setTenantState({
        appMode: currentMode,
        groupId: extractedGroupId,
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
