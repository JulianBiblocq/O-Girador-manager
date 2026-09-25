import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

/**
 * Recadre une image au format carré 1:1 strict selon l'algorithme "object-fit: cover".
 * Garantit que 100 % de la surface du canvas est occupée par des pixels de la photo,
 * sans aucune marge ni bande blanche latérale ou verticale.
 *
 * @param {string} dataUrl - Chaîne Base64 de l'image source
 * @param {number} targetSize - Dimension cible du carré en pixels (ex: 512)
 * @returns {Promise<string>} Chaîne data URL JPEG recadrée plein cadre
 */
export function cropImageToSquareCover(dataUrl, targetSize = 512) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const size = Math.min(width, height);
        const sx = (width - size) / 2;
        const sy = (height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fond papier Cordel de sécurité (jamais de blanc)
        ctx.fillStyle = '#f4ecd8';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Dessin plein cadre centré (ratio carré 1:1 strict)
        ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);

        resolve(canvas.toDataURL('image/jpeg', 0.90));
      } catch (err) {
        console.warn("AvatarUpload - Erreur de recadrage canvas cover :", err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Hook personnalisé pour la gestion de l'avatar et de la photo de profil :
 * - Compression et normalisation automatique des images (JPEG, < 1 Mo, max 1024x1024)
 * - Recadrage systématique en carré plein cadre (Algorithme Cover 1:1 strict sans marges)
 * - Téléversement sécurisé vers Firebase Storage avec type MIME explicite
 * - Synchronisation directe du document utilisateur dans Firestore
 */
export function useAvatarUpload() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Compresse un fichier image sélectionné, le recadre en carré plein cadre centré
   * et le convertit en data URL Base64 pour l'éditeur.
   *
   * @param {File} file - Fichier image brut issu d'un input file
   * @returns {Promise<string>} Chaîne data URL (JPEG carré optimisé)
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
        finalFile = await imageCompression(file, compressionOptions);
      } catch (compErr) {
        console.warn("AvatarUpload - Échec de compression automatique, utilisation du fichier d'origine :", compErr);
      }

      // Lecture du fichier compressé en data URL
      const rawDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(finalFile);
      });

      // Recadrage automatique plein cadre (Algorithme Cover 1:1) à 512x512
      return await cropImageToSquareCover(rawDataUrl, 512);
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
   * en appliquant une validation de couverture carrée intégrale préalable.
   *
   * @param {string} userId - Identifiant unique de l'utilisateur Firebase
   * @param {string} base64DataUrl - Données de l'image finale au format Base64
   * @returns {Promise<string>} URL publique de téléchargement de l'avatar
   */
  const uploadAvatar = useCallback(async (userId, base64DataUrl) => {
    if (!userId || !base64DataUrl) {
      throw new Error("Identifiant utilisateur ou données image manquantes");
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Recadrage de sécurité plein cadre centré (512x512) avant envoi
      const finalSquareBase64 = await cropImageToSquareCover(base64DataUrl, 512);

      // Conversion de la chaîne Base64 en Blob binaire
      const parts = finalSquareBase64.split(',');
      const byteString = atob(parts[1] || parts[0]);
      const mimeMatch = finalSquareBase64.match(/^data:([^;]+);/);
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
    cropImageToSquareCover,
    isCompressing,
    isUploading,
    uploadError
  };
}
