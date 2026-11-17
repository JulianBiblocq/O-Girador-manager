import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import useAssociationCloudConfig from './useAssociationCloudConfig';
import { syncPhotosPrestationsDoc, saveProvisionedEventLinks } from '../utils/studioVaralSyncUtils';

/**
 * Hook : provisionnement automatique Framaspace des événements du Pôle Studio
 * (création des dossiers WebDAV et des liens OCS, puis synchronisation du Varal Photos).
 * Option bonus : `hasFramaspace` est faux pour les associations sur Google Drive,
 * Dropbox ou sans Cloud, et le bouton de re-synchronisation reste alors masqué.
 *
 * @param {Object} params
 * @param {string} params.groupId - Identifiant de l'association
 * @param {boolean} params.canWrite - Droit d'édition des événements
 * @param {Function} params.setProvisioningMap - Setter de l'état de provisionnement par événement
 * @param {Function} params.setRowStates - Setter des champs de saisie locale par événement
 * @returns {{ handleProvisionFramaspace: Function, hasFramaspace: boolean }}
 */
export default function useStudioFramaspaceProvision({ groupId, canWrite, setProvisioningMap, setRowStates }) {
  const { hasFramaspace } = useAssociationCloudConfig(groupId);

  const setStatus = (eventId, status) => setProvisioningMap((prev) => ({ ...prev, [eventId]: status }));

  const handleProvisionFramaspace = async (ev) => {
    if (!groupId || !canWrite || !ev?.id) return;
    setStatus(ev.id, { loading: true, error: null, success: false });

    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
      const res = await provisionFn({ eventId: ev.id, groupId });
      const data = res?.data;
      if (!data || !data.success) throw new Error(data?.error || "Échec du provisionnement Framaspace.");

      setStatus(ev.id, { loading: false, error: null, success: true });

      const newLienDepot = data.lienDepotMedias || ev.lienDepotMedias || '';
      const newAlbumUrl = data.albumPhotosUrl || ev.albumPhotosUrl || '';

      // Mise à jour immédiate de l'affichage local si nouveaux liens reçus
      if (newLienDepot || newAlbumUrl) {
        setRowStates((prev) => ({
          ...prev,
          [ev.id]: {
            ...prev[ev.id],
            lienDepotMedias: newLienDepot,
            albumPhotosUrl: newAlbumUrl,
            savedDepot: Boolean(newLienDepot),
            savedAlbum: Boolean(newAlbumUrl)
          }
        }));
      }

      // Relier et synchroniser automatiquement le livret Varal (PhotosPrestations)
      try {
        await saveProvisionedEventLinks(ev.id, {
          lienDepotMedias: newLienDepot, albumPhotosUrl: newAlbumUrl, folderSlug: data.folderSlug
        });
        await syncPhotosPrestationsDoc({
          groupId, ev, finalUrl: newAlbumUrl || newLienDepot, hasAlbum: Boolean(newAlbumUrl)
        });
      } catch (syncErr) {
        console.warn("Provisionnement Studio - Avertissement synchronisation Firestore :", syncErr);
      }

      // Réinitialisation du statut de succès après 3,5 secondes
      setTimeout(() => setStatus(ev.id, { loading: false, error: null, success: false }), 3500);
    } catch (err) {
      console.error("Erreur lors du provisionnement Framaspace :", err);
      setStatus(ev.id, { loading: false, error: err?.message || "Erreur de connexion avec Framaspace.", success: false });
    } finally {
      // Sécurité anti-spinner infini : le loading ne reste jamais bloqué
      setProvisioningMap((prev) => (
        prev[ev.id]?.loading ? { ...prev, [ev.id]: { ...prev[ev.id], loading: false } } : prev
      ));
    }
  };

  return { handleProvisionFramaspace, hasFramaspace };
}
