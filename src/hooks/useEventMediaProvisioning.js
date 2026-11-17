import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Hook : création automatique 1 clic du dossier Framaspace d'un événement
 * (disponible uniquement pour les associations qui ont configuré Framaspace).
 * Met à jour le formulaire avec les liens de dépôt et d'album générés.
 *
 * @param {Object} params
 * @param {Object} params.formData - Données du formulaire événement
 * @param {Function} [params.setFormData] - Setter du formulaire
 * @param {Function} [params.handleChange] - Gestionnaire de changement de repli
 * @param {string} [params.groupId] - Identifiant de l'association
 * @returns {{ provisioning: boolean, provisionMsg: Object|null, handleAutoProvisionFramaspace: Function }}
 */
export default function useEventMediaProvisioning({ formData, setFormData, handleChange, groupId }) {
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState(null);

  const handleAutoProvisionFramaspace = async () => {
    setProvisioning(true);
    setProvisionMsg(null);
    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
      const res = await provisionFn({
        eventId: formData.id || null,
        groupId: groupId || formData.groupId,
        eventData: formData
      });

      const generatedUrl = res.data?.dropUrl || res.data?.lienDepotMedias;
      const generatedAlbumUrl = res.data?.albumPhotosUrl;
      const generatedFolder = res.data?.framaspaceFolder || res.data?.folderSlug;
      if (!generatedUrl) throw new Error("L'adresse de dépôt n'a pas pu être récupérée.");

      if (setFormData) {
        setFormData(prev => ({
          ...prev,
          dropUrl: generatedUrl,
          lienDepotMedias: generatedUrl,
          ...(generatedAlbumUrl ? { albumPhotosUrl: generatedAlbumUrl } : {}),
          ...(generatedFolder ? { framaspaceFolder: generatedFolder } : {})
        }));
      } else if (handleChange) {
        handleChange({ target: { name: 'dropUrl', value: generatedUrl } });
      }
      setProvisionMsg({ type: 'success', text: "Dossier Framaspace créé avec succès pour cet événement !" });
    } catch (err) {
      console.error("Erreur création automatique Framaspace :", err);
      setProvisionMsg({
        type: 'error',
        text: err.message || "Impossible de créer le dossier automatiquement. Vérifiez la configuration Framaspace."
      });
    } finally {
      setProvisioning(false);
    }
  };

  return { provisioning, provisionMsg, handleAutoProvisionFramaspace };
}
