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
export function useSequencerFirestoreData(rawGroupId) {
  const groupId = rawGroupId || 'Samambaia';
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
    const targetGroupId = groupId || 'Samambaia';
    setLoading(true);
    setError(null);
    cleanupListeners();

    try {
      const canonicalGroup = canonicalizeGroupId(groupId) || (typeof groupId === 'string' ? groupId.trim().toLowerCase() : 'samambaia');
      // Construction des variantes de groupId pour robustesse multi-casse
      const groupVariants = Array.from(
        new Set([
          groupId,
          canonicalGroup,
          typeof targetGroupId === 'string' ? targetGroupId.toLowerCase() : null,
          typeof canonicalGroup === 'string' ? canonicalGroup.toLowerCase() : null,
          'Samambaia',
          'samambaia'
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

      // Garantie pour l'association Samambaia (Mestre historique & Bastien)
      if (canonicalGroup.toLowerCase() === 'samambaia') {
        memberIdsSet.add('iA0SweEHyOPzAPGIDVZdeKAV2mk1');
        memberIdsSet.add('pFAmvjJWGtaWV0a6i9JcReuiyTJ2');
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

        // Décompression du champ data (Base64 prioritaire comme le Séquenceur, puis UTF-16 ou JSON natif)
        if (data.data) {
          try {
            if (typeof data.data === 'object') {
              parsedData = data.data;
            } else if (typeof data.data === 'string') {
              const str = data.data.trim();
              if (str.startsWith('{') || str.startsWith('[')) {
                parsedData = JSON.parse(str);
              } else {
                let decompressed = LZString.decompressFromBase64(str);
                if (!decompressed) {
                  decompressed = LZString.decompressFromUTF16(str);
                }
                if (!decompressed) {
                  decompressed = LZString.decompress(str);
                }
                if (decompressed) {
                  try {
                    parsedData = JSON.parse(decompressed);
                  } catch (_) {}
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

        // Extraction résiliente de l'URL audio (niveau racine, dans parsedData ou dans metadata)
        const audioUrl =
          data.audioUrl ||
          parsedData?.audioUrl ||
          parsedData?.metadata?.audioUrl ||
          null;

        // Extraction résiliente des signes du Mestre
        const sinaisDoMestre =
          (Array.isArray(data.sinaisDoMestre) && data.sinaisDoMestre.length > 0)
            ? data.sinaisDoMestre
            : (Array.isArray(parsedData?.sinaisDoMestre) && parsedData.sinaisDoMestre.length > 0)
              ? parsedData.sinaisDoMestre
              : (Array.isArray(parsedData?.metadata?.sinaisDoMestre) && parsedData.metadata.sinaisDoMestre.length > 0)
                ? parsedData.metadata.sinaisDoMestre
                : [];

        // Extraction résiliente du BPM
        const bpm =
          data.bpm ||
          parsedData?.bpm ||
          parsedData?.metadata?.bpm ||
          null;

        // Extraction résiliente de l'URL vidéo (formats videoUrl et youtubeUrl au niveau racine ou métadonnées)
        const videoUrl =
          data.videoUrl ||
          data.youtubeUrl ||
          parsedData?.videoUrl ||
          parsedData?.youtubeUrl ||
          parsedData?.metadata?.videoUrl ||
          parsedData?.metadata?.youtubeUrl ||
          null;

        return {
          ...data,
          id: doc.id,
          _collection: collectionName,
          source: 'firestore',
          isJson: true,
          isAudio: Boolean(audioUrl),
          titre: rawTitle,
          name: rawTitle,
          displayTitle: displayTitle,
          folder: folder,
          jsonUrl: doc.id,
          audioUrl: audioUrl,
          sinaisDoMestre: sinaisDoMestre,
          bpm: bpm,
          videoUrl: videoUrl,
          youtubeUrl: videoUrl,
          parsedData
        };
      };

      // 2. Écoute directe et temps réel des collections Séquenceur
      // Note : les règles Firestore autorisent la lecture publique sur presets, sections, patterns et audio_masters.
      // Une écoute directe de la collection est donc exhaustive, sans risque de rater de morceaux par filtre restrictif.
      const listenCollection = (colName) => {
        const colRef = collection(db, colName);

        try {
          const unsub = onSnapshot(
            colRef,
            (snap) => {
              snap.docs.forEach((d) => {
                const item = processDoc(d, colName);
                if (item) {
                  itemsMap.set(d.id, item);
                }
              });
              mergeAndSet();
            },
            (err) => {
              console.warn(`useSequencerFirestoreData - Écoute directe ${colName} (repli ciblé) :`, err);
              // Repli ciblé si l'écoute globale est restreinte
              listenCollectionTargeted(colName, colRef);
            }
          );
          unsubsRef.current.push(unsub);
        } catch (_) {
          listenCollectionTargeted(colName, colRef);
        }
      };

      // Stratégie de repli par requêtes ciblées si l'écoute globale est refusée
      const listenCollectionTargeted = (colName, colRef) => {
        if (groupVariants.length > 0) {
          try {
            const qGroup = query(colRef, where('groupId', 'in', groupVariants.slice(0, 10)));
            const unsubGroup = onSnapshot(
              qGroup,
              (snap) => {
                snap.docs.forEach((d) => itemsMap.set(d.id, processDoc(d, colName)));
                mergeAndSet();
              },
              (err) => console.warn(`useSequencerFirestoreData - ${colName} groupVariants :`, err)
            );
            unsubsRef.current.push(unsubGroup);
          } catch (_) {}
        }

        chunks.forEach((chunk) => {
          try {
            const qOwner = query(colRef, where('ownerId', 'in', chunk));
            const unsubOwner = onSnapshot(
              qOwner,
              (snap) => {
                snap.docs.forEach((d) => itemsMap.set(d.id, processDoc(d, colName)));
                mergeAndSet();
              },
              (err) => console.warn(`useSequencerFirestoreData - ${colName} owner chunk :`, err)
            );
            unsubsRef.current.push(unsubOwner);
          } catch (_) {}
        });

        try {
          const qPublic = query(colRef, where('visibility', '==', 'public'));
          const unsubPublic = onSnapshot(
            qPublic,
            (snap) => {
              snap.docs.forEach((d) => itemsMap.set(d.id, processDoc(d, colName)));
              mergeAndSet();
            },
            (err) => console.warn(`useSequencerFirestoreData - ${colName} public :`, err)
          );
          unsubsRef.current.push(unsubPublic);
        } catch (_) {}
      };

      // Déclenchement exhaustif pour les ressources du Séquenceur
      listenCollection('presets');
      listenCollection('sections');
      listenCollection('patterns');
      listenCollection('audio_masters');

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
