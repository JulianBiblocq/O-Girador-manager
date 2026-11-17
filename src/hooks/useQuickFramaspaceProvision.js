import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import useAssociationCloudConfig from './useAssociationCloudConfig';

/**
 * Hook : provisionnement rapide du dossier Framaspace d'un événement depuis sa fiche.
 * Option bonus : `hasFramaspace` est faux pour les associations sur Google Drive,
 * Dropbox ou sans Cloud, et les boutons associés doivent alors rester masqués.
 *
 * @param {Object} params
 * @param {Object} params.event - Événement affiché
 * @param {Object} [params.activeEvent] - Version courante (en cours d'édition) de l'événement
 * @param {Function} [params.setToastMessage] - Affichage d'un message de succès
 * @param {Function} [params.onProvisioned] - Callback après création réussie
 * @returns {{ provisioningFramaspace: boolean, handleQuickProvisionFramaspace: Function, hasFramaspace: boolean }}
 */
export default function useQuickFramaspaceProvision({ event, activeEvent, setToastMessage, onProvisioned }) {
  const [provisioningFramaspace, setProvisioningFramaspace] = useState(false);
  const { hasFramaspace } = useAssociationCloudConfig(event?.groupId);

  const handleQuickProvisionFramaspace = async () => {
    if (!event?.groupId || !event?.id) return;
    setProvisioningFramaspace(true);
    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
      const res = await provisionFn({
        eventId: event.id,
        groupId: event.groupId,
        eventData: activeEvent || event
      });
      const data = res?.data;
      if (data?.success && (data.dropUrl || data.lienDepotMedias)) {
        if (setToastMessage) {
          setToastMessage("Dossier Framaspace & QR Code créés avec succès !");
          setTimeout(() => setToastMessage(null), 3500);
        }
        if (onProvisioned) onProvisioned();
      }
    } catch (err) {
      console.error("EventDetails - Erreur provisionnement Framaspace :", err);
      alert("Erreur lors de la création du dossier Framaspace : " + (err.message || err));
    } finally {
      setProvisioningFramaspace(false);
    }
  };

  return { provisioningFramaspace, handleQuickProvisionFramaspace, hasFramaspace };
}
