import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, or } from 'firebase/firestore';
import { db } from '../firebase';
import LZString from 'lz-string';

/**
 * Hook pour récupérer les morceaux (presets, patterns et sections) du Séquenceur
 * stockés dans Firestore, appartenant à l'association (groupId), 
 * peu importe quel membre du groupe les a créés.
 */
export function useSequencerFirestoreData(groupId) {
  const [rhythms, setRhythms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setRhythms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubPatterns = () => {};
    let unsubSections = () => {};
    let unsubPresetsList = [];

    const fetchData = async () => {
      try {
        // 1. Récupérer tous les membres de l'association pour pouvoir requêter les presets par ownerId
        const qUsers = query(collection(db, 'users'), where('groupId', '==', groupId));
        const usersSnap = await getDocs(qUsers);
        const memberIds = usersSnap.docs.map(doc => doc.id);
        
        // S'il n'y a pas de membres, on ajoute au moins le groupId au cas où il soit propriétaire
        if (!memberIds.includes(groupId)) {
          memberIds.push(groupId);
        }

        // On sépare en chunks de 10 pour la limitation des requêtes 'in' sur Firestore
        const chunks = [];
        for (let i = 0; i < memberIds.length; i += 10) {
          chunks.push(memberIds.slice(i, i + 10));
        }

        let currentPatterns = [];
        let currentSections = [];
        let currentPresets = [];
        let currentAudioMasters = [];

        const mergeAndSet = () => {
          const allItems = [...currentPatterns, ...currentSections, ...currentPresets, ...currentAudioMasters];
          const uniqueItemsMap = new Map();
          allItems.forEach(item => uniqueItemsMap.set(item.id, item));
          const merged = Array.from(uniqueItemsMap.values());
          
          merged.sort((a, b) => {
            const titleA = (a.title || a.titre || a.name || '').toLowerCase();
            const titleB = (b.title || b.titre || b.name || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });

          setRhythms(merged);
          setLoading(false);
        };

        const processData = (doc, collectionName) => {
          const data = doc.data();
          let parsedData = data;
          
          // Si le contenu est compressé avec LZString (comme dans presets, patterns et sections récents)
          if (data.data) {
            try {
              if (data.data.startsWith('{')) {
                parsedData = JSON.parse(data.data);
              } else {
                const decompressed = LZString.decompressFromBase64(data.data);
                if (decompressed) {
                  parsedData = JSON.parse(decompressed);
                }
              }
            } catch (e) {
              console.error("Erreur de décompression pour", doc.id, e);
            }
          }

          return {
            id: doc.id,
            _collection: collectionName,
            isJson: true, // Pour la compatibilité avec l'ancien système de fichiers
            isAudio: !!data.audioUrl,
            titre: data.name || parsedData.name || data.title || 'Sans titre',
            jsonUrl: doc.id, // Utilisé comme identifiant de repli par certains vieux composants
            audioUrl: data.audioUrl || null,
            ...data,
            parsedData // Le contenu JSON décompressé pour l'Atelier / BlindTest
          };
        };

        // --- ECOUTE DES PATTERNS (mestreId == groupId ou ownerId in memberIds) ---
        const patternsRef = collection(db, 'patterns');
        // Pour patterns/sections, il y a le champ mestreId souvent égal au groupId
        const qPatterns = query(patternsRef, or(where('mestreId', '==', groupId), where('visibility', '==', 'mestre_group')));
        unsubPatterns = onSnapshot(qPatterns, (snapshot) => {
          // Filtrage côté client pour garantir qu'on ne prend que ceux du groupe
          const filtered = snapshot.docs.filter(doc => {
            const d = doc.data();
            return d.mestreId === groupId || memberIds.includes(d.ownerId);
          });
          currentPatterns = filtered.map(doc => processData(doc, 'patterns'));
          mergeAndSet();
        }, (err) => {
          console.error("Erreur récupération patterns :", err);
          mergeAndSet();
        });

        // --- ECOUTE DES SECTIONS ---
        const sectionsRef = collection(db, 'sections');
        const qSections = query(sectionsRef, or(where('mestreId', '==', groupId), where('visibility', '==', 'mestre_group')));
        unsubSections = onSnapshot(qSections, (snapshot) => {
          const filtered = snapshot.docs.filter(doc => {
            const d = doc.data();
            return d.mestreId === groupId || memberIds.includes(d.ownerId);
          });
          currentSections = filtered.map(doc => processData(doc, 'sections'));
          mergeAndSet();
        }, (err) => {
          console.error("Erreur récupération sections :", err);
          mergeAndSet();
        });

        // --- ECOUTE DES PRESETS ---
        // Les presets n'ont pas de mestreId, on utilise chunk sur ownerId
        const presetsRef = collection(db, 'presets');
        chunks.forEach((chunk, index) => {
          const qPresetChunk = query(presetsRef, where('ownerId', 'in', chunk));
          const unsub = onSnapshot(qPresetChunk, (snapshot) => {
            // On filtre pour ne garder que ceux qui sont mestre_group (ou public pour ce groupe si besoin)
            const chunkDocs = snapshot.docs
              .filter(doc => doc.data().visibility === 'mestre_group' || doc.data().visibility === 'public')
              .map(doc => processData(doc, 'presets'));
            
            // Mise à jour de ce chunk spécifique
            currentPresets = [
              ...currentPresets.filter(p => !chunk.includes(p.ownerId)),
              ...chunkDocs
            ];
            mergeAndSet();
          }, (err) => {
             console.error(`Erreur récupération presets chunk ${index} :`, err);
          });
          unsubPresetsList.push(unsub);
        });

        // --- ECOUTE DES AUDIO MASTERS ---
        const audioMastersRef = collection(db, 'audio_masters');
        chunks.forEach((chunk, index) => {
          const qAM = query(audioMastersRef, where('mestreId', 'in', chunk));
          const unsub = onSnapshot(qAM, (snapshot) => {
             const chunkDocs = snapshot.docs.map(doc => {
               const data = doc.data();
               return {
                 id: doc.id,
                 _collection: 'audio_masters',
                 isJson: false,
                 isAudio: true,
                 titre: data.nom || 'Master Audio',
                 audioUrl: data.audioUrl || null,
                 bpm: data.bpm,
                 ...data
               };
             });
             const newIds = chunkDocs.map(d => d.id);
             currentAudioMasters = [
               ...currentAudioMasters.filter(a => !newIds.includes(a.id)),
               ...chunkDocs
             ];
             mergeAndSet();
          });
          unsubPresetsList.push(unsub);
        });

        const qAMTenant = query(audioMastersRef, where('tenantId', '==', groupId));
        const unsubTenant = onSnapshot(qAMTenant, (snapshot) => {
           const tenantDocs = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
               id: doc.id,
               _collection: 'audio_masters',
               isJson: false,
               isAudio: true,
               titre: data.nom || 'Master Audio',
               audioUrl: data.audioUrl || null,
               bpm: data.bpm,
               ...data
             };
           });
           const newIds = tenantDocs.map(d => d.id);
           currentAudioMasters = [
             ...currentAudioMasters.filter(a => !newIds.includes(a.id)),
             ...tenantDocs
           ];
           mergeAndSet();
        });
        unsubPresetsList.push(unsubTenant);

        // --- DIRECT STORAGE FALLBACK (exports_danse) ---
        try {
          const { ref, listAll, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('../firebase');
          const paths = [`exports_danse/tenant_local`, `exports_danse/${groupId}`];
          for (const path of paths) {
            try {
              const folderRef = ref(storage, path);
              const res = await listAll(folderRef);
              for (const item of res.items) {
                const baseName = item.name.split('.')[0];
                if (!currentAudioMasters.some(a => a.id.includes(baseName))) {
                  try {
                    const url = await getDownloadURL(item);
                    currentAudioMasters.push({
                      id: item.name,
                      _collection: 'storage',
                      isJson: false,
                      isAudio: true,
                      titre: item.name.replace(/\.[^/.]+$/, ''),
                      audioUrl: url
                    });
                  } catch (itemErr) {
                    console.warn('Skipping item due to error:', item.name, itemErr);
                  }
                }
              }
              mergeAndSet();
            } catch (e) {
               // Ignore folder not found
            }
          }
        } catch (e) {
          console.warn("Storage direct fetch failed", e);
        }

      } catch (err) {
        console.error("useSequencerFirestoreData - Erreur d'initialisation :", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubPatterns();
      unsubSections();
      unsubPresetsList.forEach(unsub => unsub());
    };
  }, [groupId]);

  return { rhythms, loading, error };
}
