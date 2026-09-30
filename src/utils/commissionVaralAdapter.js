import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where 
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateCommissionMarkdown } from '../components/event-details/commissions/commissionUtils.js';

export { generateCommissionMarkdown };

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', actif: true },
  { id: 'Culture', nom: 'Culture', actif: true },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', actif: true },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', actif: true },
  { id: 'ComptesRendus', nom: 'Documents administratifs', actif: true }
];

/**
 * Convertit les données d'une commission en un document Varal normalisé (Livret Cordel).
 * Conforme à la spécification de la passerelle Commissions ➔ Varal.
 */
export function convertCommissionToVaralDoc(event, commission, referentsNames = []) {
  if (!event || !commission) throw new Error('Événement et commission requis pour la conversion');

  const refs = Array.isArray(referentsNames) ? referentsNames.filter(Boolean) : (referentsNames ? [String(referentsNames)] : []);
  const auteur = refs.length > 0 ? refs.join(' & ') : 'Référents de la commission';
  const nowIso = new Date().toISOString();
  const eventId = event.id || commission.eventId || 'evenement';
  const eventTitle = event.titre || event.title || 'Événement associatif';

  const jalons = (commission.jalons || []).map((j) => {
    const check = j.status === 'fait' ? '[x]' : '[ ]';
    const st = j.status === 'fait' ? '✅ Fait' : j.status === 'en_cours' ? '⏳ En cours' : '🎯 À faire';
    return `- ${check} **${j.titre}** [${st}]${j.deadline ? ` (Butoir : ${j.deadline})` : ''}`;
  }).join('\n') || '_Aucun jalon défini pour le moment._';

  const creneaux = (commission.creneauxBenevoles || []).map((c) => {
    const left = Math.max(0, (c.places || 1) - (c.inscritsIds || []).length);
    const h = c.horaireDebut && c.horaireFin ? ` (${c.horaireDebut} - ${c.horaireFin})` : '';
    return `- **${c.titre || c.poste || 'Créneau'}**${h} : ${left} place(s) disponible(s) sur ${c.places || 1}`;
  }).join('\n') || '_Aucun poste bénévole spécifique renseigné._';

  const besoins = (commission.besoinsMateriel || []).map((b) => {
    const st = b.statut === 'ok' ? '✅ Prêt' : b.statut === 'reserve' ? '⏳ Réservé' : '⚠️ À trouver';
    return `- **${b.quantite ? `${b.quantite}x ` : ''}${b.article}** [${st}]`;
  }).join('\n') || '_Aucun besoin matériel listé._';

  const contacts = refs.length > 0 ? refs.map((r) => `- 👤 ${r}`).join('\n') : '_Référents non assignés pour le moment._';

  const md = [
    `# ${commission.icone || '📌'} Commission : ${commission.titre}`, '',
    `**🎪 Événement :** ${eventTitle}`,
    `**✍️ Auteur(s) :** ${auteur}`,
    commission.budget?.alloue ? `**💰 Enveloppe allouée :** ${commission.budget.alloue} €` : '',
    '', '## 🎯 Mission & Description', commission.description?.trim() || '_Aucune description ou mission détaillée renseignée._',
    '', '## 🗓️ Jalons clés', jalons,
    '', '## 🤝 Postes bénévoles', creneaux,
    '', '## 📦 Besoins matériels', besoins,
    '', '## 📞 Contacts des référents', contacts,
    '', '---', `*Livret officiel de commission édité le ${new Date().toLocaleDateString('fr-FR')} • Varal O Girador*`
  ].filter((l) => l !== '').join('\n');

  const ropeId = `projet_${eventId}`;
  const eventDate = event.dateDebut || event.date || event.dateFin || null;
  const eventDateFin = event.dateFin || eventDate;
  const isEventClosed = Boolean(event.isClosed || event.cloture || event.archive || event.statut === 'archive' || event.statut === 'cloture' || event.status === 'archived');
  const eventStatut = event.statut || (event.cloture ? 'cloture' : (event.archive ? 'archive' : 'actif'));

  return {
    categorie: ropeId, categoryId: ropeId,
    titre: `${commission.icone || '📌'} ${commission.titre}`,
    auteur, type: 'cordel_commission', typeDoc: 'cordel_commission',
    commissionSourceId: commission.id, eventId, eventTitle, projetTitre: eventTitle,
    eventDate, eventDateFin, isEventClosed, eventStatut,
    dateModification: nowIso, dateMiseAJour: nowIso,
    contenu: md, texte: md, order: 50
  };
}

/**
 * Détermine si une corde de projet est active selon les règles du cycle de vie Cordel :
 * 1. Zéro bloc vide : si 0 document publié, la corde est masquée.
 * 2. Clôture / archivage : si l'événement est clos ou archivé, la corde est masquée du carrousel principal.
 * 3. Péremption temporelle : si l'événement s'est terminé il y a plus de 30 jours, la corde s'efface naturellement.
 */
export function isProjectRopeActive({ category, docs = [], event = null, now = new Date() }) {
  if (!category?.id?.startsWith('projet_')) return true;
  if (!docs || docs.length === 0) return false;

  const isClosed = Boolean(
    event?.isClosed || event?.cloture || event?.archive ||
    event?.statut === 'archive' || event?.statut === 'cloture' || event?.status === 'archived' ||
    docs.some((d) => d.isEventClosed || d.eventStatut === 'cloture' || d.eventStatut === 'archive')
  );
  if (isClosed) return false;

  const dateStr = event?.dateFin || event?.dateDebut || event?.date || docs[0]?.eventDateFin || docs[0]?.eventDate;
  if (dateStr) {
    const cleanDate = typeof dateStr === 'string' && !dateStr.includes('T') ? `${dateStr}T23:59:59` : dateStr;
    const targetDate = new Date(cleanDate);
    if (!isNaN(targetDate.getTime())) {
      const diffDays = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) return false;
    }
  }

  return true;
}

/**
 * Vérifie et initialise si besoin la corde d'événement dans le document de réglages de l'association.
 */
export async function ensureProjectVaralRope(groupId, event) {
  if (!groupId || !event?.id) return null;
  const ropeId = `projet_${event.id}`;
  const ropeNom = `🎪 Projet : ${event.titre || event.title || 'Événement'}`;

  try {
    const assocRef = doc(db, 'associations', groupId);
    const snap = await getDoc(assocRef);
    let cats = snap.exists() && Array.isArray(snap.data()?.varalCategories) ? snap.data().varalCategories : DEFAULT_VARAL_CATEGORIES;
    const idx = cats.findIndex((c) => c.id === ropeId);

    if (idx === -1) {
      await updateDoc(assocRef, { varalCategories: [...cats, { id: ropeId, nom: ropeNom, icone: '🎪', actif: true, isProjectRope: true, order: 95 }] });
    } else if (cats[idx].nom !== ropeNom) {
      const updated = [...cats];
      updated[idx] = { ...updated[idx], nom: ropeNom };
      await updateDoc(assocRef, { varalCategories: updated });
    }
  } catch (err) {
    console.warn("ensureProjectVaralRope :", err);
  }
  return ropeId;
}

/**
 * Publie ou met à jour le livret Cordel d'une commission dans la collection documents du Varal.
 * Opération idempotente : réutilise le document existant sans doublon.
 */
export async function syncCommissionToVaral({ event, commission, referentsNames = [], usersMap = {}, groupId }) {
  if (!event?.id || !commission?.id) throw new Error('Paramètres manquants pour la synchronisation Varal');
  const effGroupId = groupId || event.groupId;
  let refs = Array.isArray(referentsNames) && referentsNames.length > 0 ? [...referentsNames] : [];

  if (refs.length === 0 && Array.isArray(commission.referentsIds) && commission.referentsIds.length > 0) {
    for (const rid of commission.referentsIds) {
      const u = usersMap[rid];
      if (u) refs.push(u.displayName || u.nom || u.prenom || 'Référent');
      else {
        try {
          const usnap = await getDoc(doc(db, 'users', rid));
          if (usnap.exists()) refs.push(usnap.data().displayName || usnap.data().nom || usnap.data().prenom || 'Référent');
        } catch {}
      }
    }
  }

  if (effGroupId) await ensureProjectVaralRope(effGroupId, event);

  const docPayload = convertCommissionToVaralDoc(event, commission, refs);
  if (effGroupId) docPayload.groupId = effGroupId;

  const docsCol = collection(db, 'documents');
  const snap = await getDocs(query(docsCol, where('commissionSourceId', '==', commission.id)));
  const existing = snap.docs.find((d) => !effGroupId || d.data().groupId === effGroupId) || snap.docs[0];
  const nowIso = new Date().toISOString();
  let targetDocId;

  if (existing) {
    targetDocId = existing.id;
    await updateDoc(doc(db, 'documents', targetDocId), docPayload);
  } else {
    docPayload.dateAjout = nowIso;
    const refDoc = await addDoc(docsCol, docPayload);
    targetDocId = refDoc.id;
  }

  try {
    await updateDoc(doc(db, 'events', event.id, 'commissions', commission.id), {
      derniereSynchroVaral: nowIso, varalDerniereSynchro: nowIso, varalDocId: targetDocId
    });
  } catch (err) {
    console.warn("syncCommissionToVaral :", err);
  }

  return { success: true, docId: targetDocId, isNew: !existing, derniereSynchroVaral: nowIso };
}
