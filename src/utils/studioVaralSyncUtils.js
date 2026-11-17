import { collection, query, where, doc, updateDoc, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Synchronise le livret « Photos prestations » du Varal avec le lien Cloud d'un événement :
 * met à jour le document existant ou en crée un nouveau (type dossier externe).
 *
 * @param {Object} params
 * @param {string} params.groupId - Identifiant de l'association
 * @param {Object} params.ev - Événement concerné
 * @param {string} params.finalUrl - Lien final (album prioritaire, sinon dépôt)
 * @param {boolean} params.hasAlbum - Vrai si un album finalisé existe
 */
export async function syncPhotosPrestationsDoc({ groupId, ev, finalUrl, hasAlbum }) {
  if (!finalUrl) return;
  const docsRef = collection(db, 'documents');
  const existingSnap = await getDocs(query(
    docsRef,
    where('groupId', '==', groupId),
    where('eventId', '==', ev.id),
    where('categoryId', '==', 'PhotosPrestations')
  ));

  const titre = hasAlbum ? `[Album] ${ev.titre || 'Événement'}` : `[Collecte Photos] ${ev.titre || 'Événement'}`;
  const dateAjout = ev.dateDebut || ev.date || new Date().toISOString();

  if (!existingSnap.empty) {
    await updateDoc(doc(db, 'documents', existingSnap.docs[0].id), {
      titre, fileUrl: finalUrl, dateAjout, isDropOnly: !hasAlbum, hasAlbum
    });
    return;
  }

  const dateLabel = new Date(ev.dateDebut || ev.date || Date.now()).toLocaleDateString('fr-FR');
  await addDoc(docsRef, {
    groupId,
    eventId: ev.id,
    titre,
    fileUrl: finalUrl,
    categorie: 'PhotosPrestations',
    categoryId: 'PhotosPrestations',
    type: 'dossier_externe',
    dateAjout,
    description: hasAlbum
      ? `Album photos officiel de l'événement "${ev.titre || ''}" du ${dateLabel}.`
      : `Dossier partagé pour déposer et collecter des médias liés à l'événement "${ev.titre || ''}".`,
    isDropOnly: !hasAlbum,
    hasAlbum
  });
}

/**
 * Enregistre sur l'événement les liens Framaspace générés et le rend visible sur le Varal.
 * @param {string} eventId - Identifiant de l'événement
 * @param {Object} fields - { lienDepotMedias, albumPhotosUrl, folderSlug }
 */
export async function saveProvisionedEventLinks(eventId, { lienDepotMedias, albumPhotosUrl, folderSlug }) {
  await updateDoc(doc(db, 'events', eventId), {
    ...(lienDepotMedias ? { lienDepotMedias } : {}),
    ...(albumPhotosUrl ? { albumPhotosUrl } : {}),
    publierSurVaral: true,
    activerRecolteMedias: true,
    ...(folderSlug ? { framaspaceFolder: folderSlug } : {}),
    framaspaceProvisionedAt: new Date().toISOString()
  });
}
