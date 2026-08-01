import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Mise à jour automatique de la date de dernier contact dans la collection contacts_diffusion
 * dès qu'un document ou email (Devis, Contrat, Facture, Relance) est expédié.
 */
export async function updateContactLastDate(groupId, contactIdOrEmail) {
  if (!groupId || !contactIdOrEmail) return;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Case 1: ID direct du contact
    if (contactIdOrEmail.length > 15 && !contactIdOrEmail.includes('@')) {
      const contactRef = doc(db, 'associations', groupId, 'contacts_diffusion', contactIdOrEmail);
      await updateDoc(contactRef, {
        date_dernier_contact: todayStr,
        updatedAt: serverTimestamp()
      });
      console.log(`updateContactLastDate - Mis à jour par ID : ${contactIdOrEmail}`);
      return;
    }

    // Case 2: Recherche par E-mail du contact
    if (contactIdOrEmail.includes('@')) {
      const contactsRef = collection(db, 'associations', groupId, 'contacts_diffusion');
      const q = query(contactsRef, where('email', '==', contactIdOrEmail.trim()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        snap.forEach(async (docSnap) => {
          await updateDoc(docSnap.ref, {
            date_dernier_contact: todayStr,
            updatedAt: serverTimestamp()
          });
        });
        console.log(`updateContactLastDate - Mis à jour par Email : ${contactIdOrEmail}`);
      }
    }
  } catch (err) {
    console.warn("updateContactLastDate - Note : La mise à jour de la date de contact a échoué silencieusement :", err);
  }
}
