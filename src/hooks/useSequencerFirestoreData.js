import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, or } from 'firebase/firestore';
import { db } from '../firebase';
import LZString from 'lz-string';
import { canonicalizeGroupId } from '../utils/tenantUtils';

/**
 * Vérifie si un morceau ou une séquence est un artefact issu de tests automatisés (E2E)
 * pour éviter de polluer les catalogues et tableaux de bord de répétition.
 */
export function isTestOrE2ESequence(item) {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase();
  const title = String(item.title || item.titre || item.name || '').toLowerCase();
  const combined = `${id} ${title}`;
  return (
    combined.includes('e2e test') ||
    combined.includes('e2e_test') ||
    combined.includes('teste2e') ||
    combined.includes('test eleve') ||
    combined.includes('test élève') ||
    id.startsWith('fs_pattern_') ||
    id.startsWith('fs_section_') ||
    title.startsWith('fs_pattern_') ||
    title.startsWith('fs_section_')
  );
}

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
        const canonicalGroup = canonicalizeGroupId(groupId);
        // 1. Récupérer tous les membres de l'association pour pouvoir requêter les presets par ownerId
        const qUsers = query(collection(db, 'users'), where('groupId', '==', canonicalGroup));
        const usersSnap = await getDocs(qUsers);
        const memberIds = Array.from(new Set(usersSnap.docs.map(doc => doc.id)));
        
        // Mestre Samambaia UID garanti pour résoudre le catalogue
        if (canonicalGroup.toLowerCase() === 'samambaia' && !memberIds.includes('iA0SweEHyOPzAPGIDVZdeKAV2mk1')) {
          memberIds.push('iA0SweEHyOPzAPGIDVZdeKAV2mk1');
        }

        // S'il n'y a pas de membres, on ajoute au moins le groupId au cas où il soit propriétaire
        if (!memberIds.includes(canonicalGroup)) {
          memberIds.push(canonicalGroup);
        }

        // On sépare en chunks de 10 pour la limitation des requêtes 'in' sur Firestore
        const chunks = [];
        for (let i = 0; i < memberIds.length; i += 10) {
          chunks.push(memberIds.slice(i, i + 10));
        }

        let currentPatterns = [];
        let currentSections = [];
        let currentOwnerPresets = [];
        let currentGroupPresets = [];
        let currentPresets = [];
        let currentAudioMasters = [];

        const combinePresets = () => {
          const map = new Map();
          currentOwnerPresets.forEach(p => map.set(p.id, p));
          currentGroupPresets.forEach(p => map.set(p.id, p));
          currentPresets = Array.from(map.values());
          mergeAndSet();
        };

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

          // Exclusion automatique des séquences et motifs de test E2E
          const cleanMerged = merged.filter(item => !isTestOrE2ESequence(item));

          setRhythms(cleanMerged);
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

        // --- ECOUTE DES PATTERNS (mestreId == groupId ou ownerId in memberIds ou groupId direct) ---
        const patternsRef = collection(db, 'patterns');
        const qPatterns = query(patternsRef, or(where('mestreId', '==', groupId), where('visibility', '==', 'mestre_group')));
        unsubPatterns = onSnapshot(qPatterns, (snapshot) => {
          // Filtrage côté client pour garantir qu'on ne prend que ceux du groupe
          const filtered = snapshot.docs.filter(doc => {
            const d = doc.data();
            const matchesGroup = d.groupId && String(d.groupId).toLowerCase() === groupId.toLowerCase();
            const matchesMestre = d.mestreId === groupId || 
              (groupId.toLowerCase() === 'samambaia' && (d.mestreId === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' || d.mestreId === 'Samambaia' || d.mestreId === 'samambaia'));
            return matchesGroup || matchesMestre || memberIds.includes(d.ownerId);
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
            const matchesGroup = d.groupId && String(d.groupId).toLowerCase() === groupId.toLowerCase();
            const matchesMestre = d.mestreId === groupId || 
              (groupId.toLowerCase() === 'samambaia' && (d.mestreId === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' || d.mestreId === 'Samambaia' || d.mestreId === 'samambaia'));
            return matchesGroup || matchesMestre || memberIds.includes(d.ownerId);
          });
          currentSections = filtered.map(doc => processData(doc, 'sections'));
          mergeAndSet();
        }, (err) => {
          console.error("Erreur récupération sections :", err);
          mergeAndSet();
        });

        // --- ECOUTE DES PRESETS ---
        const presetsRef = collection(db, 'presets');

        // 1. Ecoute par groupId (avec variantes dédoublonnées)
        const qPresetsGroup = query(presetsRef, where('groupId', 'in', groupVariants));
        const unsubPresetsGroup = onSnapshot(qPresetsGroup, (snapshot) => {
          currentGroupPresets = snapshot.docs.map(doc => processData(doc, 'presets'));
          combinePresets();
        }, (err) => {
          console.error("Erreur récupération presets group :", err);
        });
        unsubPresetsList.push(unsubPresetsGroup);

        // 2. Ecoute par chunks de memberIds (ownerId)
        chunks.forEach((chunk, index) => {
          const qPresetChunk = query(presetsRef, where('ownerId', 'in', chunk));
          const unsub = onSnapshot(qPresetChunk, (snapshot) => {
            const chunkDocs = snapshot.docs
              .filter(doc => doc.data().visibility === 'mestre_group' || doc.data().visibility === 'public' || !doc.data().visibility)
              .map(doc => processData(doc, 'presets'));
            
            currentOwnerPresets = [
              ...currentOwnerPresets.filter(p => !chunk.includes(p.ownerId)),
              ...chunkDocs
            ];
            combinePresets();
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
        if (groupId && groupId !== 'tenant_local' && groupId !== 'default') {
          try {
            const { ref, listAll, getDownloadURL } = await import('firebase/storage');
            const { storage } = await import('../firebase');
            try {
              const folderRef = ref(storage, `exports_danse/${groupId}`);
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
                    // Ignorer les éléments individuels en erreur
                  }
                }
              }
              mergeAndSet();
            } catch (_) {
              // Dossier exports_danse vide ou inexistant pour cette association : ignorer
            }
          } catch (_) {
            // Module storage non disponible
          }
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
