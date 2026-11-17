import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { hasFramaspaceSetup } from '../utils/cloudProviderUtils';

// Cache court (60 s) : évite les relectures tout en reflétant vite un nouvel enregistrement Framaspace
const CACHE_TTL_MS = 60000;
const configCache = new Map();

const readCache = (groupId) => {
  const entry = configCache.get(groupId);
  return entry && Date.now() - entry.at < CACHE_TTL_MS ? entry.value : null;
};

const EMPTY_CONFIG = { cloudRootUrl: '', hasFramaspace: false };

/**
 * Hook : configuration Cloud publique d'une association (document `associations/{groupId}`).
 * - `cloudRootUrl` : dossier Cloud racine (sert à reconnaître une instance Nextcloud / Framaspace).
 * - `hasFramaspace` : vrai si Framaspace est configuré (`hasFramaspaceApi` ou URL Framaspace) ;
 *   permet d'afficher le provisionnement automatique uniquement aux associations équipées.
 * @param {string} groupId - Identifiant de l'association
 * @returns {{ cloudRootUrl: string, hasFramaspace: boolean }}
 */
export default function useAssociationCloudConfig(groupId) {
  const cleanGroupId = typeof groupId === 'string' ? groupId.trim() : '';
  const [config, setConfig] = useState(readCache(cleanGroupId) || EMPTY_CONFIG);

  useEffect(() => {
    if (!cleanGroupId) return undefined;
    const cached = readCache(cleanGroupId);
    if (cached) {
      setConfig(cached);
      return undefined;
    }

    let isMounted = true;
    getDoc(doc(db, 'associations', cleanGroupId))
      .then((snap) => {
        const data = snap.exists() ? snap.data() : {};
        const resolved = {
          cloudRootUrl: data.cloudRootUrl || data.cloudStorageUrl || '',
          hasFramaspace: hasFramaspaceSetup(data)
        };
        configCache.set(cleanGroupId, { value: resolved, at: Date.now() });
        if (isMounted) setConfig(resolved);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [cleanGroupId]);

  return config;
}
