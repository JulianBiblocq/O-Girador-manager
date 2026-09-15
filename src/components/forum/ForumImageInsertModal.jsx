import React, { useState, useRef, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import CordelButton from '../CordelButton';

/**
 * Modale d'insertion directe d'image pour le Forum.
 * Téléversement automatique et transparent vers l'instance Framaspace (Nextcloud)
 * via Cloud Function, avec compression côté client et insertion TipTap.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modale
 * @param {Function} props.onClose - Annulation / Fermeture
 * @param {Function} props.onInsertImage - Callback qui reçoit l'URL directe d'affichage validée
 * @param {string} [props.groupId=''] - Identifiant de l'association pour cibler Framaspace
 */
export default function ForumImageInsertModal({ 
  isOpen, 
  onClose, 
  onInsertImage, 
  groupId = '' 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Vérification proactive si l'association a configuré son espace cloud
  useEffect(() => {
    if (!isOpen || !groupId) return;
    let isMounted = true;

    const checkAssociationCloud = async () => {
      try {
        const assocRef = doc(db, 'associations', groupId);
        const snap = await getDoc(assocRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          // Si aucune URL cloud n'est enregistrée
          if (!data.cloudRootUrl && !data.framaspaceUrl) {
            setIsConfigMissing(true);
          } else {
            setIsConfigMissing(false);
          }
        }
      } catch (err) {
        // En cas d'erreur de lecture réseau, on ne bloque pas prématurément
      }
    };

    checkAssociationCloud();
    return () => { isMounted = false; };
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  // Gestion du choix d'un fichier image local
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg("Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF, WebP...).");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg("L'image est trop volumineuse (maximum 25 Mo avant compression).");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Réinitialisation et fermeture propre
  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setFilePreview(null);
    setErrorMsg('');
    setIsUploading(false);
    onClose();
  };

  /**
   * Compresse l'image côté client (max 1280px, qualité 0.8)
   * Utilise browser-image-compression avec repli Canvas de secours.
   */
  const compressImage = async (file) => {
    const compressionOptions = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1280,
      initialQuality: 0.8,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    };

    try {
      const compressed = await imageCompression(file, compressionOptions);
      return compressed;
    } catch (err) {
      console.warn("Échec compression via worker, bascule sur canvas :", err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 1280;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const newFile = new File([blob], file.name, { type: blob.type });
                  resolve(newFile);
                } else {
                  resolve(file);
                }
              },
              mime,
              0.8
            );
          };
          img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
      });
    }
  };

  /**
   * Convertit un Blob/File en chaîne Base64 pour l'envoi via Cloud Function.
   */
  const fileToBase64 = (fileOrBlob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrBlob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Téléversement transparent du fichier vers Framaspace via Cloud Function
  const handleUploadAndInsert = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Veuillez sélectionner un fichier image sur votre appareil.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');

      // 1. Compression à la volée côté navigateur (max 1280px, qualité 0.8)
      const compressedFile = await compressImage(selectedFile);

      // 2. Conversion en Base64
      const fileBase64 = await fileToBase64(compressedFile);

      // 3. Appel de la Cloud Function uploadForumImageToFramaspace
      const uploadForumImageFn = httpsCallable(functions, 'uploadForumImageToFramaspace');
      const response = await uploadForumImageFn({
        fileBase64,
        fileName: selectedFile.name || 'image.jpg',
        mimeType: compressedFile.type || selectedFile.type || 'image/jpeg',
        groupId: groupId || undefined
      });

      const data = response.data;
      if (data?.success && data?.directUrl) {
        // Insertion automatique dans l'éditeur TipTap
        if (onInsertImage) {
          onInsertImage(data.directUrl);
        }
        // Fermeture automatique de la modale
        handleClose();
      } else {
        throw new Error(data?.error || "Réponse inattendue du serveur Framaspace.");
      }
    } catch (err) {
      console.error("Erreur lors du téléversement de l'image vers Framaspace :", err);
      const isPreconditionErr = err.message?.includes("failed-precondition") || err.code === "failed-precondition";
      if (isPreconditionErr) {
        setIsConfigMissing(true);
      }
      const friendlyMsg = isPreconditionErr
        ? "L'espace de stockage externe (Drive) n'est pas encore configuré pour votre association."
        : err.message?.includes("unauthenticated")
        ? "Vous devez être connecté pour insérer une image."
        : `Échec du téléversement : ${err.message || 'Erreur réseau'}.`;
      setErrorMsg(friendlyMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none outline-none"
    >
      <div className="max-w-md w-full max-h-[90vh] flex flex-col bg-cordel-bg text-left relative rounded-lg border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden">
        {/* 1. Header (Fixe en haut) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
              <span>🖼️ Insérer une photo dans le forum</span>
            </h3>
            <p className="text-[11px] text-cordel-master-dark/80 font-medium">
              Choisissez une image sur votre appareil pour l'insérer directement.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer disabled:opacity-50 shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* 2. Body (Sélection, avertissements et prévisualisation) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Alerte explicative pour les associations n'ayant pas encore configuré leur Drive */}
          {isConfigMissing && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-600/40 rounded-[4px_6px_3px_5px] flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">☁️</span>
                <div className="flex flex-col gap-1 text-left">
                  <h4 className="text-xs font-black uppercase tracking-wide text-amber-900 dark:text-amber-200">
                    Espace Cloud (Drive) non configuré
                  </h4>
                  <p className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300">
                    Pour préserver les ressources et stocker les photos des discussions sans limite, votre association doit connecter son drive externe (Framaspace, Nextcloud...).
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-amber-600/30 flex flex-col gap-1 text-[10.5px] text-stone-700 dark:text-stone-300">
                <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Comment l'activer ?
                </span>
                <p className="leading-snug">
                  Un responsable de votre association doit renseigner les accès dans :<br/>
                  <span className="font-black text-amber-950 dark:text-amber-100">
                    Paramètres de l'association ➔ Onglet Communication ➔ Intégration Framaspace / Drive
                  </span>.
                </p>
              </div>
            </div>
          )}

          {/* Sélecteur de fichier */}
          <div className="flex flex-col gap-2 p-3 bg-white border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <label htmlFor="forumImageFileInput" className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
              Image depuis votre appareil
            </label>
            
            <input
              ref={fileInputRef}
              id="forumImageFileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-2 file:border-encre-noire file:text-xs file:font-bold file:uppercase file:bg-cordel-bg file:text-encre-noire hover:file:bg-amber-100 cursor-pointer"
            />

            {/* Note informative de stockage Cloud */}
            <p className="text-[10px] text-stone-500 font-medium">
              💡 Vos photos sont automatiquement hébergées sur le drive externe de votre association pour un affichage rapide et illimité.
            </p>

            {/* Aperçu du fichier sélectionné */}
            {filePreview && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded">
                <img 
                  src={filePreview} 
                  alt="Aperçu" 
                  className="w-14 h-14 object-cover rounded border border-encre-noire/30 shadow-xs shrink-0" 
                />
                <div className="flex flex-col text-[11px] font-medium text-stone-700 truncate min-w-0 flex-1">
                  <span className="font-bold truncate">{selectedFile?.name}</span>
                  <span className="text-stone-500">{(selectedFile?.size / 1024).toFixed(1)} Ko</span>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-stone-400 hover:text-red-600 p-1 font-bold cursor-pointer"
                    title="Changer d'image"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Feedback visuel explicite pendant le téléversement */}
          {isUploading && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 rounded text-amber-900 dark:text-amber-200 text-xs font-semibold animate-pulse">
              <span className="inline-block animate-spin text-sm">⏳</span>
              <span>Téléversement de l'image vers Framaspace...</span>
            </div>
          )}

          {errorMsg && !isConfigMissing && (
            <span className="text-[11px] font-bold text-red-600 block">
              ⚠️ {errorMsg}
            </span>
          )}
        </div>

        {/* 3. Footer (Boutons d'action) */}
        <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/15 flex justify-end gap-2 bg-cordel-bg">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>

          <CordelButton
            type="button"
            onClick={handleUploadAndInsert}
            variant="vert"
            useExtremeBorder={true}
            disabled={isUploading || !selectedFile || isConfigMissing}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                <span>Téléversement...</span>
              </>
            ) : (
              <span>Téléverser & Insérer</span>
            )}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
