import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { projectWorkshopBooklets } from '../utils/workshopProjectionUtils';
import { useTranslation } from '../components/LanguageContext';
import useConfirm from './useConfirm';

/**
 * Catégories par défaut suspendues sur le Varal de documents.
 */
export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Costumerie', nom: 'Costumerie & Patrons', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Comptes-rendus', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

/**
 * Table de correspondance par défaut reliant chaque pôle métier à ses cordes natives du Varal.
 */
export const DEFAULT_POLE_ROPES = {
  pedagogie: ['Toadas', 'Culture', 'TutorielsVideo'],
  secretariat: ['Administratif', 'ComptesRendus'],
  studio: ['PhotosPrestations'],
  lutherie: ['TutosFabrication'],
  costumerie: ['Costumerie', 'TutosCostumes', 'PatronsCostumes']
};

/**
 * Détermine le type fonctionnel d'un document selon ses propriétés ou son extension.
 */
export const getDocType = (docItem) => {
  if (!docItem) return 'pdf';
  if (docItem.type) return docItem.type;
  const cat = (docItem.categorie || '').toLowerCase();
  if (cat.includes('toada')) return 'song';
  if (cat.includes('culture') || cat.includes('fiche')) return 'culture_fiche';

  const url = docItem.fileUrl || '';
  if (url.includes('drive.google.com/drive/folders') || url.includes('dropbox.com') || url.includes('onedrive')) return 'dossier_externe';
  if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) return 'audio';
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return 'video';
  if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp')) return 'image';
  if (url.startsWith('http') && !url.includes('.pdf')) return 'web';
  return 'pdf'; // repli par défaut
};

/**
 * Hook personnalisé gérant la synchronisation Firestore en temps réel,
 * le groupement des documents par catégorie Cordel, la projection des modèles d'atelier,
 * ainsi que les actions de réordonnancement par lot (writeBatch) et de suppression.
 */
export default function useVaralData({
  groupId,
  poleId = null,
  userTags = null,
  profileData = null,
  role = null,
  isSystemAdmin = false,
  canWrite = false
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState(DEFAULT_VARAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [eventsWithMedia, setEventsWithMedia] = useState([]);
  const [reunions, setReunions] = useState([]);
  const [instrumentModels, setInstrumentModels] = useState([]);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // 1. Écouteur Firestore pour tous les documents réels de l'association (sans troncature)
  useEffect(() => {
    if (!groupId) return;

    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = [];
      querySnapshot.forEach((docSnap) => {
        fetchedDocs.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Trier par ordre croissant, puis par date d'ajout descendante
      fetchedDocs.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0);
      });
      setDocuments(fetchedDocs);
      setLoading(false);
    }, (error) => {
      console.error("useVaralData - Erreur onSnapshot documents :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 2. Écouteur Firestore pour les modèles d'instruments de l'atelier lutherie
  useEffect(() => {
    if (!groupId) return;

    const modelsRef = collection(db, 'instrument_models');
    const qModels = query(modelsRef, where('groupId', '==', groupId));
    const unsubscribeModels = onSnapshot(qModels, (querySnapshot) => {
      const fetchedModels = [];
      querySnapshot.forEach((docSnap) => {
        fetchedModels.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setInstrumentModels(fetchedModels);
    }, (error) => {
      console.error("useVaralData - Erreur onSnapshot instrument_models :", error);
    });

    return () => unsubscribeModels();
  }, [groupId]);

  // 3. Écouteur Firestore pour les événements (médias et réunions)
  useEffect(() => {
    if (!groupId) return;

    const eventsRef = collection(db, 'events');
    const qEvents = query(eventsRef, where('groupId', '==', groupId));
    const unsubscribeEvents = onSnapshot(qEvents, (querySnapshot) => {
      const fetchedEvents = [];
      const fetchedReunions = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.lienDepotMedias || data.albumPhotosUrl) {
          fetchedEvents.push({ id: docSnap.id, ...data });
        }
        if (data.type === 'reunion' && data.date) {
          fetchedReunions.push({ id: docSnap.id, ...data });
        }
      });
      setEventsWithMedia(fetchedEvents);
      setReunions(fetchedReunions);
    }, (error) => {
      console.error("useVaralData - Erreur onSnapshot events :", error);
    });

    return () => unsubscribeEvents();
  }, [groupId]);

  // 4. Écouteur Firestore pour la configuration des catégories du Varal dans l'association
  useEffect(() => {
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.varalCategories)) {
          const rawCats = data.varalCategories;
          const mergedCats = DEFAULT_VARAL_CATEGORIES.map((defaultCat) => {
            const customCat = rawCats.find(c => c.id === defaultCat.id) || rawCats.find(c => c.nom === defaultCat.nom);
            if (customCat) {
              return { ...defaultCat, ...customCat, id: defaultCat.id }; // Préserver l'identifiant natif
            }
            return defaultCat;
          });
          setVaralCategories(mergedCats);
          return;
        }
      }
      setVaralCategories(DEFAULT_VARAL_CATEGORIES);
    }, (error) => {
      console.error("useVaralData - Erreur onSnapshot association :", error);
      setVaralCategories(DEFAULT_VARAL_CATEGORIES);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 5. Identification globale du tout dernier document ajouté sur l'ensemble du Varal
  const newestDocumentId = useMemo(() => {
    if (!documents || documents.length === 0) return null;

    let newestId = null;
    let newestTimestamp = -Infinity;

    documents.forEach((docItem) => {
      let ts = 0;
      if (docItem.dateAjout) {
        ts = new Date(docItem.dateAjout).getTime();
      } else if (docItem.createdAt) {
        ts = typeof docItem.createdAt.toMillis === 'function'
          ? docItem.createdAt.toMillis()
          : new Date(docItem.createdAt).getTime();
      }

      if (!isNaN(ts) && ts > newestTimestamp) {
        newestTimestamp = ts;
        newestId = docItem.id;
      }
    });

    return newestId || (documents[0] ? documents[0].id : null);
  }, [documents]);

  // 6. Groupement des documents par catégorie et projections dynamiques en mémoire
  const groupedDocs = useMemo(() => {
    const groups = {};
    const allDocs = [...documents];

    allDocs.forEach((docItem) => {
      // Recherche de la catégorie correspondante par priorité : categoryId d'abord, puis nom, puis id
      const catObj = (docItem.categoryId && varalCategories.find(c => c.id === docItem.categoryId))
        || (docItem.categorie && varalCategories.find(c => c.nom === docItem.categorie))
        || (docItem.categorie && varalCategories.find(c => c.id === docItem.categorie));
      let catId = catObj ? catObj.id : 'Autre';

      // Migration front-end automatique : Nettoyage du varal Administratif
      if (catId === 'Administratif') {
        const titre = (docItem.titre || '').toLowerCase();
        const isCoreAdmin = titre.includes('compo ca') || titre.includes('règlement') || titre.includes('reglement') || titre.includes('statut') || titre.includes('rib');

        if (!isCoreAdmin) {
          // Tous les autres documents (notamment les comptes-rendus) sont basculés sur ComptesRendus
          catId = 'ComptesRendus';
        }
      }

      if (!docItem.isHidden) {
        if (!groups[catId]) {
          groups[catId] = [];
        }
        groups[catId].push(docItem);
      }
    });

    // Injection des dépôts médias des événements dans le varal "PhotosPrestations"
    if (eventsWithMedia && eventsWithMedia.length > 0) {
      if (!groups['PhotosPrestations']) {
        groups['PhotosPrestations'] = [];
      }
      eventsWithMedia.forEach(ev => {
        // Éviter les doublons si un document Firestore réel existe déjà pour cet événement
        const alreadyExists = groups['PhotosPrestations'].some(d => d.eventId === ev.id);
        if (!alreadyExists) {
          const targetUrl = ev.albumPhotosUrl || ev.lienDepotMedias;
          if (targetUrl) {
            const eventDateFormatted = ev.dateDebut ? new Date(ev.dateDebut).toLocaleDateString('fr-FR') : '';
            groups['PhotosPrestations'].push({
              id: `event-media-${ev.id}`,
              titre: `[Album] ${ev.titre || 'Événement'}`,
              fileUrl: targetUrl,
              categorie: 'PhotosPrestations',
              categoryId: 'PhotosPrestations',
              type: 'dossier_externe',
              dateAjout: ev.dateDebut || ev.createdAt || '',
              description: ev.albumPhotosUrl
                ? `Album photos finalisé de l'événement${eventDateFormatted ? ` du ${eventDateFormatted}` : ''}.`
                : `Dossier partagé pour consulter et déposer des médias liés à l'événement${eventDateFormatted ? ` du ${eventDateFormatted}` : ''}.`,
              isVirtualEventMedia: true,
              eventId: ev.id,
            });
          }
        }
      });

      // Trier "PhotosPrestations" par date descendante
      groups['PhotosPrestations'].sort((a, b) => {
        const dateA = new Date(a.dateAjout || 0).getTime();
        const dateB = new Date(b.dateAjout || 0).getTime();
        return dateB - dateA;
      });
    }

    // Injection des réunions en tant que brouillons ou comptes-rendus dans le varal "ComptesRendus"
    if (reunions && reunions.length > 0) {
      if (!groups['ComptesRendus']) {
        groups['ComptesRendus'] = [];
      }
      reunions.forEach(reunion => {
        const eventDate = new Date(reunion.date);
        const now = new Date();
        const isPast = eventDate <= now;
        const isPublished = (reunion.compteRenduStatus === 'publie');

        let isHidden = false;
        if (isPast && !isPublished) {
          isHidden = true; // Masqué aux membres sans droits étendus
        }

        const pad = (n) => n.toString().padStart(2, '0');
        const formattedDate = `${pad(eventDate.getDate())}-${pad(eventDate.getMonth() + 1)}-${eventDate.getFullYear()}`;

        if (!isHidden || isAuthorized) {
          groups['ComptesRendus'].push({
            id: reunion.id,
            titre: `CR du ${formattedDate}`,
            type: 'reunion',
            typeDoc: 'reunion',
            date: reunion.date,
            isHidden: isHidden,
            isPast: isPast,
            isPublished: isPublished,
            isArchived: false,
            order: 0,
            reunionData: reunion
          });
        }
      });

      // Trier "ComptesRendus" par date décroissante
      groups['ComptesRendus'].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    // Projection dynamique en mémoire des modèles d'atelier et de leurs pièces dans "TutosFabrication"
    const workshopBooklets = projectWorkshopBooklets(instrumentModels);
    if (workshopBooklets && workshopBooklets.length > 0) {
      if (!groups['TutosFabrication']) {
        groups['TutosFabrication'] = [];
      }
      workshopBooklets.forEach((booklet) => {
        groups['TutosFabrication'].push(booklet);
      });
    }

    return groups;
  }, [documents, instrumentModels, varalCategories, eventsWithMedia, reunions, isAuthorized]);

  // 7. Résolution des étiquettes / badges effectifs de l'utilisateur
  const profileTags = profileData?.tags;
  const effectiveTags = useMemo(() => {
    if (Array.isArray(userTags) && userTags.length > 0) return userTags;
    if (Array.isArray(profileTags)) return profileTags;
    return [];
  }, [userTags, profileTags]);

  // 8. Filtrage des catégories visibles selon le pôle actif et les autorisations de badges
  const visibleCategories = useMemo(() => {
    return varalCategories.filter((category) => {
      // Filtrage par pôle métier
      if (poleId) {
        const catPole = category.poleId || Object.keys(DEFAULT_POLE_ROPES).find(p => DEFAULT_POLE_ROPES[p].includes(category.id));
        if (catPole !== poleId) return false;
      }

      // Filtrage par badge / allowedTags (Bypass administrateurs et mestres)
      if (isAuthorized) return true;
      if (!category.allowedTags || category.allowedTags.length === 0) return true;

      return effectiveTags.some(userTag => {
        const uTag = (typeof userTag === 'string' ? userTag : (userTag.id || userTag.nomM || userTag.nomF || '')).toLowerCase().trim();
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    });
  }, [varalCategories, poleId, isAuthorized, effectiveTags]);

  // 9. Vérification des droits de dépôt sur une catégorie donnée
  const canDepositOnCategory = (category) => {
    if (!category) return false;
    if (category.activerUploadPublic) return true;
    if (isAuthorized) return true;

    if (canWrite) {
      if (!category.allowedTags || category.allowedTags.length === 0) return true;
      return effectiveTags.some(uTag => {
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    }

    if (category.allowedTags && category.allowedTags.length > 0) {
      return effectiveTags.some(uTag => {
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    }

    return false;
  };

  // 10. Actions de réordonnancement par lot (writeBatch)
  const updateDocumentsOrder = async (newOrderedList) => {
    try {
      const batch = writeBatch(db);
      newOrderedList.forEach((docItem, idx) => {
        if (docItem.id && !docItem.isVirtualEventMedia && docItem.typeDoc !== 'reunion') {
          const docRef = doc(db, 'documents', docItem.id);
          batch.update(docRef, { order: idx });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("useVaralData - Erreur lors de la mise à jour de l'ordre par lot :", err);
    }
  };

  const handleMoveLeft = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx <= 0) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx - 1];
    newList[idx - 1] = temp;
    await updateDocumentsOrder(newList);
  };

  const handleMoveRight = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx === -1 || idx >= docList.length - 1) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx + 1];
    newList[idx + 1] = temp;
    await updateDocumentsOrder(newList);
  };

  // 11. Suppression de document avec confirmation et nettoyage Storage
  const handleDelete = async (docItem) => {
    const confirmMsg = t('documents.deleteConfirm') || "Voulez-vous vraiment supprimer ce document ?";
    const isOk = await confirm({
      title: t('documents.deleteTitle') || "Supprimer le document",
      message: confirmMsg,
      confirmText: t('common.yesDelete') || "Oui, supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });
    if (!isOk) return;

    try {
      if (docItem.fileUrl && docItem.fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, docItem.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("useVaralData - Erreur de suppression Storage :", storageError);
        }
      }

      const docRef = doc(db, 'documents', docItem.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("useVaralData - Erreur de suppression document :", error);
      alert(t('documents.deleteError') || "Erreur lors de la suppression du document.");
    }
  };

  // 12. Sauvegarde des réglages d'une catégorie (nom, upload public)
  const saveCategory = async (editingCategory) => {
    if (!editingCategory || !editingCategory.nom?.trim()) {
      alert("Le nom de la catégorie ne peut pas être vide !");
      return;
    }
    try {
      const assocRef = doc(db, 'associations', groupId);
      const updatedCategories = varalCategories.map(c => c.id === editingCategory.id ? { ...editingCategory, nom: editingCategory.nom.trim() } : c);
      await updateDoc(assocRef, { varalCategories: updatedCategories });
    } catch (err) {
      console.error("useVaralData - Erreur lors de la mise à jour de la catégorie :", err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  return {
    documents,
    varalCategories,
    loading,
    eventsWithMedia,
    reunions,
    instrumentModels,
    isAuthorized,
    newestDocumentId,
    groupedDocs,
    effectiveTags,
    visibleCategories,
    canDepositOnCategory,
    handleDelete,
    handleMoveLeft,
    handleMoveRight,
    updateDocumentsOrder,
    saveCategory,
    getDocType
  };
}
