import { useState, useEffect, useCallback } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export function useSequencerRhythms(groupId) {
  const [catalogRhythms, setCatalogRhythms] = useState([]);
  const [loadingRhythms, setLoadingRhythms] = useState(false);

  const fetchCatalogRhythms = useCallback(async () => {
    if (!groupId) {
      setCatalogRhythms([]);
      return;
    }
    setLoadingRhythms(true);
    try {
      const folderRef = ref(storage, `documents/${groupId}/sequencer`);
      const res = await listAll(folderRef);

      const fetchedRhythms = await Promise.all(
        res.items.map(async (itemRef) => {
          try {
            const jsonUrl = await getDownloadURL(itemRef);
            const rawName = itemRef.name;
            const cleanName = rawName.replace(/^\d+_/, '').replace(/\.json$/i, '');
            return {
              id: rawName,
              titre: cleanName,
              jsonUrl: jsonUrl,
              fileName: rawName
            };
          } catch (urlError) {
            console.error("useSequencerRhythms - Erreur getDownloadURL :", itemRef.name, urlError);
            return null;
          }
        })
      );

      const validRhythms = fetchedRhythms.filter(Boolean);
      validRhythms.sort((a, b) => a.titre.localeCompare(b.titre));
      setCatalogRhythms(validRhythms);
    } catch (error) {
      console.error("useSequencerRhythms - Erreur lors de la récupération du catalogue :", error);
      setCatalogRhythms([]);
    } finally {
      setLoadingRhythms(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchCatalogRhythms();
  }, [fetchCatalogRhythms]);

  return {
    catalogRhythms,
    loadingRhythms,
    fetchCatalogRhythms
  };
}
