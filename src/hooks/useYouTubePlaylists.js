import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenantContext } from '../context/TenantContext';

/**
 * Hook réactif pour charger les playlists YouTube configurées pour l'association.
 *
 * @param {string|null} customGroupId - Identifiant optionnel d'association (résolu par défaut via le TenantContext)
 * @returns {{ playlists: Array<{ id: string, label: string, playlistId: string }>, loading: boolean }}
 */
export function useYouTubePlaylists(customGroupId = null) {
  let contextGroupId = null;
  try {
    const tenantCtx = useTenantContext();
    contextGroupId = tenantCtx?.groupId || null;
  } catch (err) {
    // Hors TenantProvider
  }

  const effectiveGroupId = customGroupId || contextGroupId;
  const [playlists, setPlaylists] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveGroupId) {
      setPlaylists([]);
      setApiKey('');
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'associations', effectiveGroupId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const list = Array.isArray(data.youtubePlaylists) ? data.youtubePlaylists : [];
          setPlaylists(list);
          setApiKey(data.youtubeApiKey || '');
        } else {
          setPlaylists([]);
          setApiKey('');
        }
        setLoading(false);
      },
      (error) => {
        console.warn('useYouTubePlaylists - Erreur de lecture des playlists :', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveGroupId]);

  return { playlists, apiKey, loading };
}
