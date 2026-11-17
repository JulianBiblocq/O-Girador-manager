import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Hook : création automatique du dossier de dépôt général de l'association sur Framaspace
 * (option bonus, réservée aux associations qui ont configuré Framaspace).
 *
 * @param {Object} params
 * @param {string} params.groupId - Identifiant de l'association
 * @param {Function} params.handleChange - Mise à jour du formulaire (clé, valeur)
 * @param {Function} params.t - Fonction de traduction
 * @returns {{ cloudLoading: boolean, cloudMsg: Object|null, handleProvisionGeneralDrop: Function }}
 */
export default function useGeneralDropProvisioning({ groupId, handleChange, t }) {
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudMsg, setCloudMsg] = useState(null);

  const handleProvisionGeneralDrop = async () => {
    setCloudLoading(true);
    setCloudMsg(null);
    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceGeneralDropFolder');
      const res = await provisionFn({ groupId });
      if (!res.data?.defaultDropUrl) {
        throw new Error(t('settings.modules.mediaStorageAccordion.lienNonGenere') || "Lien non généré.");
      }
      handleChange('defaultDropUrl', res.data.defaultDropUrl);
      setCloudMsg({ type: 'success', text: "Dossier Framaspace configuré avec succès !" });
    } catch (err) {
      console.error("Erreur provision Framaspace :", err);
      setCloudMsg({ type: 'error', text: err.message || "Erreur de création automatique." });
    } finally {
      setCloudLoading(false);
    }
  };

  return { cloudLoading, cloudMsg, handleProvisionGeneralDrop };
}
