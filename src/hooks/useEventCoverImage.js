import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * Hook autonome de gestion de l'image de couverture / affiche d'un événement
 * (téléversement Storage, récupération des photos du Varal et bascule de mode).
 */
export function useEventCoverImage({ groupId, setEditForm, translate, externalVaralPhotos }) {
  const [internalImageMode, setInternalImageMode] = useState('upload');
  const [internalUploadingImage, setInternalUploadingImage] = useState(false);
  const [internalVaralPhotos, setInternalVaralPhotos] = useState([]);

  useEffect(() => {
    // Si le composant parent fournit déjà la liste des photos du Varal, éviter une double souscription
    if (Array.isArray(externalVaralPhotos) || !groupId) return;

    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const photos = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const candidateUrl =
            data.fileUrl || data.url || data.imageUrl || data.photoUrl || data.visuelAnimeUrl || '';
          const isExplicitImage = data.type === 'image' || data.typeDoc === 'image';
          const hasImageExt = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(candidateUrl);
          const isStorageImage =
            candidateUrl.includes('firebasestorage.googleapis.com') &&
            !candidateUrl.includes('.pdf') &&
            !candidateUrl.includes('.mp3') &&
            !candidateUrl.includes('.wav') &&
            !candidateUrl.includes('.mp4');

          if (candidateUrl && (isExplicitImage || hasImageExt || isStorageImage)) {
            photos.push({
              id: docSnap.id,
              titre: data.titre || data.nom || 'Photo Varal',
              fileUrl: candidateUrl,
              categorie: data.categorie || data.categoryId || 'Varal',
              dateAjout: data.dateAjout || data.date || ''
            });
          }
        });
        photos.sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0));
        setInternalVaralPhotos(photos);
      },
      (err) => {
        console.error('useEventCoverImage - Erreur snapshot documents :', err);
      }
    );

    return () => unsubscribe();
  }, [groupId, externalVaralPhotos]);

  const internalHandleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !setEditForm) return;
    setInternalUploadingImage(true);
    try {
      const targetGroup = groupId || 'default';
      const storagePath = `documents/${targetGroup}/events/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setEditForm((prev) => ({
        ...prev,
        imageUrl: downloadURL,
        coverImage: downloadURL
      }));
      alert(translate ? translate('widgetAgenda.uploadSuccess', 'Image téléversée !') : 'Image téléversée !');
    } catch (error) {
      console.error('useEventCoverImage - Erreur upload image :', error);
      alert(
        translate
          ? translate('widgetAgenda.uploadError', "Erreur lors du téléversement de l'image.")
          : "Erreur lors du téléversement de l'image."
      );
    } finally {
      setInternalUploadingImage(false);
    }
  };

  return {
    internalImageMode,
    setInternalImageMode,
    internalUploadingImage,
    internalHandleImageUpload,
    internalVaralPhotos
  };
}

