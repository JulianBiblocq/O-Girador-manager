import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

/**
 * Hook personnalisé pour la gestion de l'avatar et de la photo de profil :
 * - Compression et normalisation automatique des images (JPEG, < 1 Mo, max 1024x1024)
 * - Prise en charge des formats mobiles (HEIC/HEIF) et photos haute résolution
 * - Téléversement sécurisé vers Firebase Storage avec type MIME explicite
 * - Synchronisation directe du document utilisateur dans Firestore
 */
export function useAvatarUpload() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Compresse un fichier image sélectionné et le convertit en data URL Base64
   * pour un affichage immédiat et fluide dans l'éditeur.
   *
   * @param {File} file - Fichier image brut issu d'un input file
   * @returns {Promise<string>} Chaîne data URL (JPEG optimisé)
   */
  const compressAndPrepareFile = useCallback(async (file) => {
    if (!file) return null;
    setIsCompressing(true);
    setUploadError(null);

    try {
      // Options de compression adaptées aux photos mobiles et web
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85
      };

      let finalFile = file;
      try {
        // Tentative de compression avec conversion automatique en JPEG
        finalFile = await imageCompression(file, compressionOptions);
      } catch (compErr) {
        console.warn("AvatarUpload - Échec de compression automatique, utilisation du fichier d'origine :", compErr);
      }

      // Lecture du fichier compressé en data URL pour l'éditeur
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(finalFile);
      });
    } catch (err) {
      console.error("AvatarUpload - Erreur de lecture du fichier :", err);
      setUploadError("Impossible de traiter cette image. Essayez un autre format.");
      throw err;
    } finally {
      setIsCompressing(false);
    }
  }, []);

  /**
   * Téléverse l'image finale traitée par l'éditeur vers Firebase Storage
   * et met à jour le champ photoURL de l'utilisateur dans Firestore.
   *
   * @param {string} userId - Identifiant unique de l'utilisateur Firebase
   * @param {string} base64DataUrl - Données de l'image finale au format Base64 (data:image/jpeg;base64,...)
   * @returns {Promise<string>} URL publique de téléchargement de l'avatar
   */
  const uploadAvatar = useCallback(async (userId, base64DataUrl) => {
    if (!userId || !base64DataUrl) {
      throw new Error("Identifiant utilisateur ou données image manquantes");
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Conversion de la chaîne Base64 en Blob binaire
      const parts = base64DataUrl.split(',');
      const byteString = atob(parts[1] || parts[0]);
      const mimeMatch = base64DataUrl.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });

      // Téléversement dans le dossier dédié de l'utilisateur
      const filename = `profile_pic_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${userId}/${filename}`);
      
      const metadata = {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000'
      };

      const snapshot = await uploadBytes(storageRef, blob, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Mise à jour immédiate du profil Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      return downloadURL;
    } catch (err) {
      console.error("AvatarUpload - Erreur lors de l'enregistrement de l'avatar :", err);
      setUploadError("Erreur lors de l'enregistrement de la photo de profil.");
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    compressAndPrepareFile,
    uploadAvatar,
    isCompressing,
    isUploading,
    uploadError
  };
}
