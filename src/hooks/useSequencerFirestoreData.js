import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import LZString from 'lz-string';
import { canonicalizeGroupId } from '../utils/tenantUtils';

/**
 * Vérifie si un morceau ou une séquence est un artefact issu de tests automatisés (E2E)
 * pour éviter de polluer les catalogues et classeurs artistiques.
 *
 * @param {Object} item - Ressource musicale
 * @returns {boolean}
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
    combined.includes('test élève')
  );
}

/**
 * Hook unifié pour récupérer l'ensemble des morceaux, motifs (patterns),
 * sections et préréglages (presets) du Séquenceur O Girador, qu'ils proviennent
 * de Firestore (collections patterns, sections, presets) ou de Firebase Storage
 * (documents/${groupId}/sequencer), sans exclure les créations privées de l'association.
 *
 * @param {string} groupId - Identifiant de l'association
 * @returns {{ rhythms: Array, loading: boolean, error: any, refresh: Function }}
 */
export function useSequencerFirestoreData(groupId) {
  const [rhythms, setRhythms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Référence pour nettoyer les abonnements temps réel Firestore
  const unsubsRef = useRef([]);

  const cleanupListeners = useCallback(() => {
    unsubsRef.current.forEach((unsub) => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {
        // Tolérance aux désabonnements déjà effectués
      }
    });
    unsubsRef.current = [];
  }, []);

  const fetchData = useCallback(async () => {
    if (!groupId) {
      setRhythms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    cleanupListeners();

    try {
      const canonicalGroup = canonicalizeGroupId(groupId) || (typeof groupId === 'string' ? groupId.trim().toLowerCase() : '');
      // Construction des variantes de groupId pour robustesse multi-casse
      const groupVariants = Array.from(
        new Set([
          groupId,
          canonicalGroup,
          typeof groupId === 'string' ? groupId.toLowerCase() : null,
          typeof canonicalGroup === 'string' ? canonicalGroup.toLowerCase() : null
        ])
      ).filter(Boolean);

      // 1. Résolution exhaustive des identifiants membres de l'association
      const memberIdsSet = new Set();

      // Utilisateur actuellement connecté (Mestre ou animateur en session)
      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        memberIdsSet.add(currentUid);
      }

      // Adhérents enregistrés dans la collection users pour ce groupe
      if (canonicalGroup) {
        try {
          const qUsers = query(collection(db, 'users'), where('groupId', '==', canonicalGroup));
          const usersSnap = await getDocs(qUsers);
          usersSnap.docs.forEach((d) => memberIdsSet.add(d.id));
        } catch (userErr) {
          console.warn("useSequencerFirestoreData - Impossible de lister les utilisateurs par groupId :", userErr);
        }
      }

      // Garantie pour l'association Samambaia (Mestre historique)
      if (canonicalGroup.toLowerCase() === 'samambaia') {
        memberIdsSet.add('iA0SweEHyOPzAPGIDVZdeKAV2mk1');
      }

      // Ajout du groupId canonique lui-même pour les motifs créés sous l'identifiant de groupe
      if (canonicalGroup) {
        memberIdsSet.add(canonicalGroup);
      }

      const memberIds = Array.from(memberIdsSet);

      // Découpage par lots de 10 pour respecter la limite de l'opérateur 'in' de Firestore
      const chunks = [];
      for (let i = 0; i < memberIds.length; i += 10) {
        chunks.push(memberIds.slice(i, i + 10));
      }

      // Dictionnaires de stockage des éléments en temps réel
      const itemsMap = new Map(); // id -> item

      const mergeAndSet = () => {
        const allItems = Array.from(itemsMap.values());
        // Filtrage des artéfacts de test
        const cleanItems = allItems.filter((item) => !isTestOrE2ESequence(item));

        // Tri alphabétique sur le titre d'affichage
        cleanItems.sort((a, b) => {
          const titleA = (a.displayTitle || a.titre || a.name || '').toLowerCase();
          const titleB = (b.displayTitle || b.titre || b.name || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });

        setRhythms(cleanItems);
        setLoading(false);
      };

      // Traitement et décompression d'un document Firestore
      const processDoc = (doc, collectionName) => {
        const data = doc.data() || {};
        let parsedData = data;

        // Décompression du champ data (LZString UTF-16 ou Base64 ou JSON natif)
        if (data.data) {
          try {
            if (typeof data.data === 'object') {
              parsedData = data.data;
            } else if (typeof data.data === 'string') {
              const str = data.data.trim();
              if (str.startsWith('{') || str.startsWith('[')) {
                parsedData = JSON.parse(str);
              } else {
                let decompressed = LZString.decompressFromUTF16(str);
                if (!decompressed) {
                  decompressed = LZString.decompressFromBase64(str);
                }
                if (!decompressed) {
                  decompressed = LZString.decompress(str);
                }
                if (decompressed) {
                  parsedData = JSON.parse(decompressed);
                }
              }
            }
          } catch (e) {
            console.warn("useSequencerFirestoreData - Erreur de décompression pour", doc.id, e);
          }
        }

        const rawTitle = data.name || parsedData?.name || data.title || parsedData?.title || 'Sans titre';
        const folder = data.folder || parsedData?.folder || null;

        let displayTitle = rawTitle;
        if (folder) {
          displayTitle = `[${folder}] ${rawTitle}`;
        } else if (collectionName === 'sections') {
          displayTitle = `[Séquence] ${rawTitle}`;
        } else if (collectionName === 'presets') {
          displayTitle = `[Preset] ${rawTitle}`;
        }

        return {
          id: doc.id,
          _collection: collectionName,
          source: 'firestore',
          isJson: true,
          isAudio: !!data.audioUrl,
          titre: rawTitle,
          displayTitle: displayTitle,
          folder: folder,
          jsonUrl: doc.id,
          audioUrl: data.audioUrl || null,
          ...data,
          parsedData
        };
      };

      // 2. Écoute des Patterns (Motifs individuels et dossiers privés comme 'samba')
      const patternsRef = collection(db, 'patterns');

      // 2.a Patterns par groupId direct
      if (canonicalGroup) {
        try {
          const qPatternsGroup = query(patternsRef, where('groupId', '==', canonicalGroup));
          const unsubPGroup = onSnapshot(qPatternsGroup, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'patterns')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Patterns group :", err));
          unsubsRef.current.push(unsubPGroup);
        } catch (_) {}

        // 2.b Patterns par mestreId (normalisé sur groupId canonique)
        try {
          const qPatternsMestre = query(patternsRef, where('mestreId', '==', canonicalGroup));
          const unsubPMestre = onSnapshot(qPatternsMestre, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'patterns')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Patterns mestreId :", err));
          unsubsRef.current.push(unsubPMestre);
        } catch (_) {}
      }

      // 2.c Patterns par lots de memberIds (ownerId & mestreId)
      chunks.forEach((chunk) => {
        try {
          const qOwner = query(patternsRef, where('ownerId', 'in', chunk));
          const unsubOwner = onSnapshot(qOwner, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'patterns')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Patterns owner chunk :", err));
          unsubsRef.current.push(unsubOwner);
        } catch (_) {}

        try {
          const qMestreChunk = query(patternsRef, where('mestreId', 'in', chunk));
          const unsubMestre = onSnapshot(qMestreChunk, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'patterns')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Patterns mestre chunk :", err));
          unsubsRef.current.push(unsubMestre);
        } catch (_) {}
      });

      // 2.d Patterns publics du catalogue général
      try {
        const qPublicPatterns = query(patternsRef, where('visibility', '==', 'public'));
        const unsubPublicP = onSnapshot(qPublicPatterns, (snap) => {
          snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'patterns')));
          mergeAndSet();
        }, (err) => console.warn("useSequencerFirestoreData - Patterns public :", err));
        unsubsRef.current.push(unsubPublicP);
      } catch (_) {}

      // 3. Écoute des Sections (Séquences & Arrangements)
      const sectionsRef = collection(db, 'sections');

      if (canonicalGroup) {
        try {
          const qSectionsGroup = query(sectionsRef, where('groupId', '==', canonicalGroup));
          const unsubSGroup = onSnapshot(qSectionsGroup, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'sections')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Sections group :", err));
          unsubsRef.current.push(unsubSGroup);
        } catch (_) {}
      }

      chunks.forEach((chunk) => {
        try {
          const qSecOwner = query(sectionsRef, where('ownerId', 'in', chunk));
          const unsubSecOwner = onSnapshot(qSecOwner, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'sections')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Sections owner chunk :", err));
          unsubsRef.current.push(unsubSecOwner);
        } catch (_) {}
      });

      // 4. Écoute des Presets (Arrangements de batterie & boîtes à rythme)
      const presetsRef = collection(db, 'presets');

      if (canonicalGroup) {
        try {
          const qPresetsGroup = query(presetsRef, where('groupId', '==', canonicalGroup));
          const unsubPresGroup = onSnapshot(qPresetsGroup, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'presets')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Presets group :", err));
          unsubsRef.current.push(unsubPresGroup);
        } catch (_) {}
      }

      chunks.forEach((chunk) => {
        try {
          const qPresOwner = query(presetsRef, where('ownerId', 'in', chunk));
          const unsubPresOwner = onSnapshot(qPresOwner, (snap) => {
            snap.docs.forEach((doc) => itemsMap.set(doc.id, processDoc(doc, 'presets')));
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Presets owner chunk :", err));
          unsubsRef.current.push(unsubPresOwner);
        } catch (_) {}
      });

      // 5. Écoute des Audio Masters
      const audioMastersRef = collection(db, 'audio_masters');
      if (canonicalGroup) {
        try {
          const qAMTenant = query(audioMastersRef, where('tenantId', '==', canonicalGroup));
          const unsubAM = onSnapshot(qAMTenant, (snap) => {
            snap.docs.forEach((doc) => {
              const d = doc.data() || {};
              itemsMap.set(doc.id, {
                id: doc.id,
                _collection: 'audio_masters',
                source: 'firestore',
                isJson: false,
                isAudio: true,
                titre: d.nom || 'Master Audio',
                displayTitle: `[Audio] ${d.nom || 'Master Audio'}`,
                audioUrl: d.audioUrl || null,
                bpm: d.bpm,
                ...d
              });
            });
            mergeAndSet();
          }, (err) => console.warn("useSequencerFirestoreData - Audio Masters :", err));
          unsubsRef.current.push(unsubAM);
        } catch (_) {}
      }

      // 6. Récupération des fichiers physiques Firebase Storage (documents/${groupId}/sequencer)
      const loadStorageFiles = async () => {
        const candidatePaths = [
          `documents/${groupId}/sequencer`,
          canonicalGroup !== groupId ? `documents/${canonicalGroup}/sequencer` : null
        ].filter(Boolean);

        for (const storagePath of candidatePaths) {
          try {
            const folderRef = ref(storage, storagePath);
            const res = await listAll(folderRef);
            for (const itemRef of res.items) {
              try {
                const url = await getDownloadURL(itemRef);
                const rawName = itemRef.name;
                const cleanName = rawName.replace(/^\d+_/, '').replace(/\.(json|mp3|wav|ogg|m4a|aac)$/i, '');
                const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(rawName);
                const isJson = /\.json$/i.test(rawName);

                // Ajout si non déjà présent dans le map
                if (!itemsMap.has(rawName)) {
                  itemsMap.set(rawName, {
                    id: rawName,
                    _collection: 'storage',
                    source: 'storage',
                    isJson,
                    isAudio,
                    titre: cleanName,
                    displayTitle: cleanName,
                    jsonUrl: url,
                    fileName: rawName,
                    audioUrl: isAudio ? url : null
                  });
                }
              } catch (_) {}
            }
          } catch (_) {
            // Dossier Storage inexistant ou vide pour cette association
          }
        }
        mergeAndSet();
      };

      loadStorageFiles();

    } catch (err) {
      console.error("useSequencerFirestoreData - Erreur d'initialisation :", err);
      setError(err);
      setLoading(false);
    }
  }, [groupId, cleanupListeners]);

  useEffect(() => {
    fetchData();
    return () => cleanupListeners();
  }, [fetchData, cleanupListeners]);

  return { rhythms, loading, error, refresh: fetchData };
}
