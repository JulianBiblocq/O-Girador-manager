import { doc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateCompteRenduPDF } from './pdfGenerator.js';
import { triggerEventStatusAutomation } from './automationEngine.js';

/**
 * Utilitaires pour la publication et l'auto-validation des comptes-rendus de réunion.
 * Centralise la création dans le Varal (collection 'documents'), la génération de PDF
 * et le déclenchement de la notification Push FCM 'on_report_published'.
 */

/**
 * Formate une date en JJ/MM/AAAA.
 * @param {string|Date} dateStr 
 * @returns {string} Date au format JJ/MM/AAAA
 */
export const formatReportDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Publie définitivement un compte-rendu de réunion au Varal et déclenche la notification FCM.
 * 
 * @param {Object} params Paramètres de publication
 * @param {Object} params.event Données de la réunion (events/{id})
 * @param {Array} params.points Liste des points de l'ordre du jour avec leurs notes
 * @param {Object} [params.approvals] Approbations des membres présents
 * @param {boolean} [params.isAutomatic=false] Indique si la publication provient de l'auto-validation à J+7
 * @param {Object|string} [params.associationSettings] Paramètres d'association pour le PDF
 * @returns {Promise<{ success: boolean, docId: string }>} Résultat de la publication
 */
export async function publishReportDefinitive({
  event,
  points = [],
  approvals = {},
  isAutomatic = false,
  associationSettings = null
}) {
  if (!event || !event.id) {
    throw new Error("L'événement est requis pour la publication du compte-rendu.");
  }

  // 1. Compiler le contenu en Markdown
  const pointsToPublish = (points && points.length > 0) ? points : (event.pointsOrdreDuJour || []);
  const compiledMarkdown = pointsToPublish.length > 0 
    ? pointsToPublish.map(p => `### 📌 ${p.titre}\n\n${p.notesCR ? p.notesCR.trim() : "*Aucune note rédigée.*"}`).join('\n\n---\n\n')
    : "*Aucun point consigné dans ce compte-rendu.*";

  // 2. Récupérer les noms des membres émargés et invités
  const inscriptions = Array.isArray(event.inscriptions) ? event.inscriptions : [];
  const presents = inscriptions.filter(ins => ins.status === 'present');
  const presentsNames = presents.map(ins => ins.userName || 'Membre anonyme');
  const invites = Math.max(0, parseInt(event.invitesOuPublicCount, 10) || 0);
  const totalParticipants = presentsNames.length + invites;

  const isCA = (event.audience === 'ca' || event.portee === 'ca');
  const audienceLabel = isCA ? "Réunion de CA / Bureau" : "Réunion Publique / Assemblée";
  const presentsSummary = invites > 0
    ? `${presentsNames.length} adhérent(s) + ${invites} invité(s)`
    : `${presentsNames.length} présent(s)`;

  // 3. Titre et sous-titre standard
  const docTitle = `CR du ${formatReportDate(event.date)}`;
  const docSousTitre = `${audienceLabel} • ${presentsSummary}`;
  const eventYear = event.date ? new Date(event.date).getFullYear() : new Date().getFullYear();

  // 4. Créer ou mettre à jour le document unique dans le Varal
  let docRefId = event.compteRenduVaralId || null;
  if (!docRefId) {
    try {
      const existingQuery = query(
        collection(db, 'documents'),
        where('groupId', '==', event.groupId),
        where('eventId', '==', event.id)
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        docRefId = existingSnap.docs[0].id;
      }
    } catch (findErr) {
      console.warn("publishReportDefinitive - Recherche document existant :", findErr);
    }
  }

  const docPayload = {
    titre: docTitle,
    sousTitre: docSousTitre,
    categoryId: 'Administratif',
    categorie: 'ComptesRendus',
    sousCategorie: isCA ? 'Comptes Rendus CA' : 'Comptes Rendus Publics',
    annee: eventYear,
    type: 'report',
    texte: compiledMarkdown,
    points: pointsToPublish,
    dateAjout: new Date().toISOString(),
    groupId: event.groupId,
    eventId: event.id,
    audience: isCA ? 'ca' : 'publique',
    portee: isCA ? 'ca' : 'publique',
    allowedTags: isCA ? ['CA', 'Bureau', 'C.A', 'C.A.', 'Conseil d\'Administration'] : [],
    presents: presentsNames,
    invitesOuPublicCount: invites,
    totalParticipants: totalParticipants,
    order: 9999,
    fileUrl: '' // Document dynamique Cordel
  };

  if (docRefId) {
    await updateDoc(doc(db, 'documents', docRefId), docPayload);
  } else {
    const newDocRef = await addDoc(collection(db, 'documents'), docPayload);
    docRefId = newDocRef.id;
  }

  // 5. Mettre à jour le statut et l'audience de l'événement
  const eventRef = doc(db, 'events', event.id);
  const eventUpdates = {
    compteRenduStatus: 'publie',
    compteRenduVaralId: docRefId,
    audience: isCA ? 'ca' : 'publique',
    portee: isCA ? 'ca' : 'publique',
    pointsOrdreDuJour: pointsToPublish
  };

  if (isAutomatic) {
    eventUpdates.compteRenduAutoValidated = true;
    eventUpdates.compteRenduAutoValidatedAt = new Date().toISOString();
  }

  await updateDoc(eventRef, eventUpdates);

  // 6. Déclenchement de l'automatisation de publication au Varal (on_report_published)
  try {
    const targetGroupId = event.groupId;
    if (targetGroupId) {
      const updatedEventObj = {
        ...event,
        ...eventUpdates,
        id: event.id
      };
      await triggerEventStatusAutomation(targetGroupId, updatedEventObj, 'on_report_published');
    }
  } catch (triggerErr) {
    console.error("publishReportDefinitive - Erreur déclenchement notification publication :", triggerErr);
  }

  // 7. Générer et sauvegarder le PDF officiel (exclusivement en validation manuelle utilisateur)
  if (!isAutomatic) {
    try {
      const enrichedEvent = {
        ...event,
        audience: isCA ? 'ca' : 'publique',
        invitesOuPublicCount: invites
      };
      const pdfDoc = generateCompteRenduPDF(enrichedEvent, pointsToPublish, presentsNames, associationSettings || event.associationSettings || "O Girador");
      pdfDoc.save(`Compte_Rendu_${isCA ? 'CA_' : 'Public_'}${event.titre ? event.titre.replace(/[^a-zA-Z0-9]/g, '_') : 'Reunion'}.pdf`);
    } catch (pdfErr) {
      console.error("publishReportDefinitive - Erreur génération PDF automatique :", pdfErr);
    }
  }

  return { success: true, docId: docRefId };
}

/**
 * Vérifie et exécute si nécessaire l'auto-validation à J+7 (Fallback frontend).
 * Sécurité démocratique : aucun refus présent ne doit être actif.
 * 
 * @param {Object} event Événement réunion
 * @param {Object|string} [associationSettings]
 * @returns {Promise<boolean>} true si le compte-rendu a été auto-validé, false sinon
 */
export async function checkAndExecuteAutoValidation(event, associationSettings = null) {
  if (!event || !event.id) return false;
  if (event.compteRenduStatus !== 'attente_relecture') return false;
  if (!event.autoValidateAfter7Days || !event.compteRenduAutoValidateAt) return false;

  const now = new Date();
  const autoDate = new Date(event.compteRenduAutoValidateAt);
  if (isNaN(autoDate.getTime()) || now < autoDate) {
    return false;
  }

  // Sécurité démocratique : si au moins un membre présent a demandé une modification, suspendre l'auto-validation
  const approvals = event.compteRenduApprovals || {};
  const hasRejection = Object.values(approvals).some(v => v && v.approved === false);
  if (hasRejection) {
    return false;
  }

  try {
    await publishReportDefinitive({
      event,
      points: event.pointsOrdreDuJour || [],
      approvals,
      isAutomatic: true,
      associationSettings
    });
    return true;
  } catch (err) {
    console.error("checkAndExecuteAutoValidation - Erreur lors de l'auto-validation fallback :", err);
    return false;
  }
}
