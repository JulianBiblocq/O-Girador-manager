import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId } from '../utils/tenantUtils';
import { isPastEvent } from '../utils/dateUtils';

/**
 * Service de gestion de l'archivage, de la réactivation et du nettoyage en cascade des membres.
 * 
 * Garantit :
 * 1. Le retrait complet des membres archivés sur les événements futurs (RSVP, covoiturage, plan de scène).
 * 2. La préservation stricte et absolue de l'historique sur les événements passés.
 * 3. La réattribution automatique des passagers en recherche de place si leur conducteur est archivé.
 */

/**
 * Nettoie en cascade la présence d'un ou plusieurs membres sur tous les événements à venir d'un groupe.
 *
 * @param {string} groupId Identifiant du groupe/tenant de l'association
 * @param {Array<string>} userIdsToRemove Liste des uids des membres et dépendants à retirer
 * @returns {Promise<{ modifiedEventsCount: number }>} Résumé des modifications
 */
export async function cleanMemberCascadeFromFutureEvents(groupId, userIdsToRemove = []) {
  if (!groupId || !Array.isArray(userIdsToRemove) || userIdsToRemove.length === 0) {
    return { modifiedEventsCount: 0 };
  }

  const canonicalGroup = canonicalizeGroupId(groupId);
  const groupVariants = Array.from(new Set([
    canonicalGroup,
    groupId,
    canonicalGroup?.toLowerCase(),
    groupId?.toLowerCase()
  ].filter(Boolean)));

  const eventsRef = collection(db, 'events');
  const q = groupVariants.length === 1
    ? query(eventsRef, where('groupId', '==', groupVariants[0]))
    : query(eventsRef, where('groupId', 'in', groupVariants));

  const querySnapshot = await getDocs(q);
  let modifiedEventsCount = 0;

  const targetIdsSet = new Set(userIdsToRemove);

  for (const eventDoc of querySnapshot.docs) {
    const eventData = eventDoc.data();

    // 🔒 RÈGLE D'OR : Ne JAMAIS modifier un événement passé (préservation intégrale de l'historique pour l'AG)
    if (isPastEvent(eventData)) {
      continue;
    }

    const rawInscriptions = Array.isArray(eventData.inscriptions) ? eventData.inscriptions : [];
    const rawCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
    const rawVoitures = Array.isArray(rawCovoit.voitures) ? rawCovoit.voitures : [];
    const rawRecherche = Array.isArray(rawCovoit.recherchePlace) ? rawCovoit.recherchePlace : [];
    const rawPlacements = eventData.stageLayout?.placements || {};

    // Détection de présence du membre archivé dans les différentes sections de l'événement
    const hasInscriptions = rawInscriptions.some(ins => targetIdsSet.has(ins.userId) || targetIdsSet.has(ins.uid));
    const hasDriver = rawVoitures.some(v => targetIdsSet.has(v.chauffeurId));
    const hasPassenger = rawVoitures.some(v => 
      (v.passengers || v.passagers || []).some(p => p && targetIdsSet.has(p.uid))
    );
    const hasRecherche = rawRecherche.some(r => r && targetIdsSet.has(r.uid));
    const hasPlacement = Object.keys(rawPlacements).some(uid => targetIdsSet.has(uid));

    // Si aucune trace de ce membre dans cet événement futur, passer sans écriture
    if (!hasInscriptions && !hasDriver && !hasPassenger && !hasRecherche && !hasPlacement) {
      continue;
    }

    let updatedInscriptions = [...rawInscriptions];
    let updatedVoitures = [...rawVoitures];
    let updatedRecherche = [...rawRecherche];

    // 🚗 1. Nettoyage Covoiturage & Protection contre les musiciens orphelins
    for (const uid of userIdsToRemove) {
      // Cas A : Le membre archivé était conducteur d'un véhicule
      const driverCar = updatedVoitures.find(v => v.chauffeurId === uid);
      if (driverCar) {
        const thirdPartyItems = (driverCar.passengers || driverCar.passagers || []).filter(
          p => p && !targetIdsSet.has(p.uid)
        );

        // Basculer automatiquement tous les passagers tiers dans la file recherchePlace
        thirdPartyItems.forEach(p => {
          const isPhysicalPassenger = p.isPassenger !== false;
          const hasBulkyInstruments = Boolean(
            p.isPassenger === false || Number(p.bulkyCount ?? p.alfayasCount) > 0
          );
          const existingIdx = updatedRecherche.findIndex(r => r.uid === p.uid);

          if (existingIdx >= 0) {
            updatedRecherche[existingIdx] = {
              ...updatedRecherche[existingIdx],
              cherchePassager: updatedRecherche[existingIdx].cherchePassager || isPhysicalPassenger,
              chercheInstrument: updatedRecherche[existingIdx].chercheInstrument || hasBulkyInstruments,
              doitRentrerDirect: updatedRecherche[existingIdx].doitRentrerDirect || Boolean(p.doitRentrerDirect)
            };
          } else {
            updatedRecherche.push({
              uid: p.uid,
              nom: p.nom || p.name || 'Membre',
              cherchePassager: isPhysicalPassenger,
              chercheInstrument: hasBulkyInstruments,
              doitRentrerDirect: Boolean(p.doitRentrerDirect),
              ...(p.isInvite ? { isInvite: true } : {})
            });
          }

          // Mise à jour de la modalité de transport dans l'inscription du passager orphelin
          if (!p.isInvite) {
            updatedInscriptions = updatedInscriptions.map(ins => {
              if (ins.userId === p.uid && ins.transport !== 'cherche_place' && ins.transport !== 'cherche') {
                return {
                  ...ins,
                  transport: 'cherche_place'
                };
              }
              return ins;
            });
          }
        });

        // Suppression de la voiture du membre archivé
        updatedVoitures = updatedVoitures.filter(v => v.chauffeurId !== uid);
      }

      // Cas B : Le membre archivé était passager dans une autre voiture
      updatedVoitures = updatedVoitures.map(v => {
        const passengers = v.passengers || v.passagers || [];
        const hasMember = passengers.some(p => p && p.uid === uid);
        if (!hasMember) return v;
        return {
          ...v,
          passengers: passengers.filter(p => p && p.uid !== uid)
        };
      });

      // Cas C : Le membre archivé était en file d'attente recherchePlace
      updatedRecherche = updatedRecherche.filter(r => r && r.uid !== uid);
    }

    // 📋 2. Retrait RSVP (inscriptions)
    updatedInscriptions = updatedInscriptions.filter(
      ins => !targetIdsSet.has(ins.userId) && !targetIdsSet.has(ins.uid)
    );

    // 📐 3. Nettoyage Plan de Scène (StageLayout placements)
    let updatedStageLayout = eventData.stageLayout ? { ...eventData.stageLayout } : null;
    if (updatedStageLayout && updatedStageLayout.placements) {
      const cleanPlacements = { ...updatedStageLayout.placements };
      let hasPlacementsModified = false;
      userIdsToRemove.forEach(uid => {
        if (cleanPlacements[uid]) {
          delete cleanPlacements[uid];
          hasPlacementsModified = true;
        }
      });
      if (hasPlacementsModified) {
        updatedStageLayout.placements = cleanPlacements;
      }
    }

    // 💾 4. Sauvegarde des modifications sur l'événement futur
    const updatePayload = {
      inscriptions: updatedInscriptions,
      covoiturage: {
        ...rawCovoit,
        voitures: updatedVoitures,
        recherchePlace: updatedRecherche
      }
    };
    if (updatedStageLayout) {
      updatePayload.stageLayout = updatedStageLayout;
    }

    const eventDocRef = doc(db, 'events', eventDoc.id);
    await updateDoc(eventDocRef, updatePayload);
    modifiedEventsCount++;
  }

  return { modifiedEventsCount };
}

/**
 * Archive un membre de l'association, archive ses éventuels enfants/dépendants rattachés,
 * et purge automatiquement ses participations sur l'ensemble des événements à venir.
 *
 * @param {string} targetUserId Identifiant du membre à archiver
 * @param {string} groupId Identifiant du groupe
 * @returns {Promise<{ success: boolean, modifiedEventsCount: number }>}
 */
export async function archiveMember(targetUserId, groupId) {
  if (!targetUserId) throw new Error("ID du membre requis pour l'archivage.");

  // Récupérer le profil du membre pour confirmer son groupId
  const userRef = doc(db, 'users', targetUserId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};
  const effectiveGroupId = groupId || userData.groupId;

  // Récupérer les éventuels profils rattachés (enfants/dépendants)
  const dependentsQuery = query(collection(db, 'users'), where('managedBy', '==', targetUserId));
  const dependentsSnap = await getDocs(dependentsQuery);
  const dependentIds = [];
  dependentsSnap.forEach(d => dependentIds.push(d.id));

  const allTargetIds = [targetUserId, ...dependentIds];

  // 1. Passage du membre au statut archivé
  await updateDoc(userRef, {
    statutActuel: 'archived',
    isArchived: true,
    archivedAt: serverTimestamp()
  });

  // 2. Archivage en cascade des dépendants rattachés s'ils existent
  for (const depId of dependentIds) {
    const depRef = doc(db, 'users', depId);
    await updateDoc(depRef, {
      statutActuel: 'archived',
      isArchived: true,
      archivedAt: serverTimestamp()
    });
  }

  // 3. Purge automatique sur tous les événements à venir du groupe
  const { modifiedEventsCount } = await cleanMemberCascadeFromFutureEvents(effectiveGroupId, allTargetIds);

  return { success: true, modifiedEventsCount };
}

/**
 * Désarchive un membre de l'association (et optionnellement ses dépendants),
 * lui restituant l'accès actif à l'application.
 *
 * @param {string} targetUserId Identifiant du membre à désarchiver
 * @param {boolean} [reactivateDependents=true] Désarchiver également les dépendants rattachés
 * @returns {Promise<{ success: boolean }>}
 */
export async function unarchiveMember(targetUserId, reactivateDependents = true) {
  if (!targetUserId) throw new Error("ID du membre requis pour le désarchivage.");

  const userRef = doc(db, 'users', targetUserId);
  await updateDoc(userRef, {
    statutActuel: 'active',
    isArchived: false,
    unarchivedAt: serverTimestamp()
  });

  if (reactivateDependents) {
    const dependentsQuery = query(collection(db, 'users'), where('managedBy', '==', targetUserId));
    const dependentsSnap = await getDocs(dependentsQuery);
    for (const d of dependentsSnap.docs) {
      await updateDoc(doc(db, 'users', d.id), {
        statutActuel: 'active',
        isArchived: false,
        unarchivedAt: serverTimestamp()
      });
    }
  }

  return { success: true };
}
