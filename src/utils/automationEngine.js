import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveCategory, isUserCategoryMatchingEvent } from './categoryUtils';

/**
 * Helper: Vérifie si un membre est éligible pour recevoir la relance d'une règle spécifique
 * en croisant ses informations avec le publicCible de la règle et les niveaux requis de l'événement.
 */
function isUserEligibleForRule(uData, rulePublicCible, event, customCategories, eventInscriptions = []) {
  if (uData.statutActuel === 'archived') return false;

  // 1. Filtrage "inscrits"
  if (rulePublicCible === 'inscrits') {
    const isRegistered = eventInscriptions.some(ins => ins.userId === uData.id);
    if (!isRegistered) return false;
  }

  // 2. Filtrage "percussion" ou "danse"
  if (rulePublicCible === 'percussion') {
    const hasInstrument = (uData.instrumentsPrincipaux && uData.instrumentsPrincipaux.length > 0) || 
                          (uData.niveauxParInstrument && Object.keys(uData.niveauxParInstrument).length > 0);
    if (!hasInstrument) return false;
  }
  
  if (rulePublicCible === 'danse') {
    if (!uData.niveauDanse || uData.niveauDanse === 'aucun') return false;
  }

  // 3. Filtrage selon les niveaux exigés par l'événement (pour "tous", "concernes", "percussion", "danse")
  if (rulePublicCible === 'tous' || rulePublicCible === 'concernes' || rulePublicCible === 'percussion' || rulePublicCible === 'danse') {
    const eventRequiredPublic = resolveCategory(event.niveauRequis || event.publicCible, customCategories);
    const danseNiveauRequis = resolveCategory(event.niveauDanseRequis || event.danseNiveauRequis, customCategories);
    const isDanceEvent = event.includesDance || ['stage', 'prestation', 'atelier', 'repetition'].includes(event.type);

    let isMusicLevelRestricted = true;
    if (uData.niveauxParInstrument && Object.keys(uData.niveauxParInstrument).length > 0) {
      const hasMatchingInst = Object.values(uData.niveauxParInstrument).some(niv => {
        const resolvedNiv = resolveCategory(niv, customCategories);
        return isUserCategoryMatchingEvent(resolvedNiv, eventRequiredPublic, customCategories);
      });
      isMusicLevelRestricted = !hasMatchingInst;
    } else {
      const userMusicLevel = resolveCategory(uData.niveauMusique || uData.niveau, customCategories);
      isMusicLevelRestricted = !isUserCategoryMatchingEvent(userMusicLevel, eventRequiredPublic, customCategories);
    }

    const userDanceLevel = resolveCategory(uData.niveauDanse, customCategories);
    const isDanceLevelRestricted = isDanceEvent && danseNiveauRequis && danseNiveauRequis !== 'tous' && danseNiveauRequis !== 'aucun' && (userDanceLevel !== danseNiveauRequis);

    // Si on est restreint à la fois en musique et en danse, on n'est pas éligible.
    if (isMusicLevelRestricted && isDanceLevelRestricted) return false;
  }

  return true;
}

/**
 * Utilitaires pour le Moteur d'Automatisations & Relances
 * Calcule les dates cibles selon le point de référence (eventDate ou registrationDeadline)
 * et pousse les notifications de relance vers les membres en attente de réponse.
 * 
 * @param {string} groupId ID de l'association
 * @param {boolean} isSimulation Si true, simule l'exécution sans écrire dans notifications_queue
 * @returns {Promise<Object>} Résumé de l'exécution { totalEvents, totalRules, triggeredCount, details }
 */
export async function runAutomationEngine(groupId, isSimulation = false) {
  if (!groupId) {
    throw new Error("groupId manquant pour le moteur d'automatisation.");
  }

  const details = [];
  let triggeredCount = 0;

  try {
    // 1. Chargement des règles actives pour l'association
    const rulesRef = collection(db, 'associations', groupId, 'automation_rules');
    const rulesQuery = query(rulesRef, where('isActive', '==', true));
    const rulesSnapshot = await getDocs(rulesQuery);

    const activeRules = [];
    rulesSnapshot.forEach((docSnap) => {
      activeRules.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (activeRules.length === 0) {
      return {
        totalEvents: 0,
        totalRules: 0,
        triggeredCount: 0,
        details: ["Aucune règle d'automatisation active configurée."]
      };
    }

    // 2. Chargement des événements à venir
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, where('groupId', '==', groupId));
    const eventsSnapshot = await getDocs(eventsQuery);

    const eventsList = [];
    const now = new Date();
    // On fixe la date d'aujourd'hui sans heure (00:00:00)
    const todayStr = now.toISOString().split('T')[0];

    eventsSnapshot.forEach((docSnap) => {
      const evData = docSnap.data();
      const evDate = new Date(evData.date);
      // Ignorer les événements passés depuis plus de 2 jours
      if (!isNaN(evDate.getTime()) && evDate >= new Date(now.getTime() - 48 * 3600 * 1000)) {
        eventsList.push({
          id: docSnap.id,
          ...evData
        });
      }
    });

    // 3. Chargement des catégories personnalisées de l'association
    const assocDoc = await getDoc(doc(db, 'associations', groupId));
    let customCategories = ['Débutant', 'Confirmé'];
    if (assocDoc.exists() && assocDoc.data().customCategories) {
      customCategories = assocDoc.data().customCategories;
    }

    // 4. Chargement des membres de l'association
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('groupId', '==', groupId));
    const usersSnapshot = await getDocs(usersQuery);

    const activeUsers = [];
    usersSnapshot.forEach((docSnap) => {
      const uData = docSnap.data();
      if (uData.statutActuel !== 'archived') {
        activeUsers.push({
          id: docSnap.id,
          ...uData
        });
      }
    });

    // 5. Exécution de l'analyse Règle par Règle / Événement par Événement
    for (const rule of activeRules) {
      const rulePublicCible = rule.publicCible || 'tous';

      for (const ev of eventsList) {
        // Vérification de la correspondance du type d'événement
        const matchesType = !rule.typeEvenementCible || 
                            rule.typeEvenementCible === 'tous' || 
                            rule.typeEvenementCible === ev.type;

        if (!matchesType) continue;

        // Calcul du Point de Référence dynamique (registrationDeadline vs eventDate)
        let referenceDateStr = '';
        if (rule.pointDeReference === 'registrationDeadline') {
          referenceDateStr = ev.dateLimiteInscription || ev.date;
        } else {
          referenceDateStr = ev.date;
        }

        if (!referenceDateStr) continue;

        const refDate = new Date(referenceDateStr);
        if (isNaN(refDate.getTime())) continue;

        // Date de déclenchement = Date de référence - (joursAvant jours)
        const triggerDate = new Date(refDate);
        triggerDate.setDate(triggerDate.getDate() - (parseInt(rule.joursAvant, 10) || 0));
        const triggerDateStr = triggerDate.toISOString().split('T')[0];

        // Est-ce que la date de déclenchement correspond à aujourd'hui ?
        if (triggerDateStr === todayStr) {
          // Identification des utilisateurs qui n'ont pas encore répondu à l'événement
          // ET qui sont éligibles pour cette règle
          const inscriptions = Array.isArray(ev.inscriptions) ? ev.inscriptions : [];
          const usersPending = activeUsers.filter((u) => {
            const userResp = inscriptions.find(ins => ins.userId === u.id);
            if (userResp && userResp.status !== 'pending') return false; // A déjà répondu

            // S'il n'a pas répondu (ou est en pending), on vérifie s'il est éligible pour recevoir la relance
            return isUserEligibleForRule(u, rulePublicCible, ev, customCategories, inscriptions);
          });

          if (usersPending.length > 0) {
            const eventName = ev.titre || ev.nom || 'Événement';
            const bodyMessage = (rule.messageNotification || '')
              .replace(/\{\{nomEvenement\}\}/g, eventName);

            details.push(
              `🔔 [Règle "${rule.titre}"] : ${usersPending.length} membre(s) relancé(s) pour "${eventName}" (${rule.joursAvant}j avant ${rule.pointDeReference === 'registrationDeadline' ? 'clôture' : 'événement'})`
            );

            // Génération des notifications
            for (const targetUser of usersPending) {
              triggeredCount++;
              if (!isSimulation) {
                await addDoc(collection(db, 'notifications_queue'), {
                  groupId: groupId,
                  recipientId: targetUser.id,
                  title: rule.titreNotification || 'Rappel Événement',
                  body: bodyMessage,
                  eventId: ev.id,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }

    if (details.length === 0) {
      details.push("Aucune relance à envoyer aujourd'hui selon les règles actives.");
    }

    return {
      totalEvents: eventsList.length,
      totalRules: activeRules.length,
      triggeredCount,
      details
    };

  } catch (error) {
    console.error("runAutomationEngine - Erreur d'exécution :", error);
    throw error;
  }
}

/**
 * Déclenche l'envoi des notifications suite à la modification du statut d'un événement,
 * en respectant les règles d'automatisation (ex: 'eventConfirmed', 'eventCancelled').
 * @param {string} groupId ID de l'association
 * @param {Object} event Objet de l'événement validé ou annulé
 * @param {string} triggerType Type de déclencheur ('eventConfirmed' ou 'eventCancelled')
 */
export async function triggerEventStatusAutomation(groupId, event, triggerType) {
  if (!groupId || !event || !event.id) return { triggeredCount: 0, details: [] };

  const details = [];
  let triggeredCount = 0;

  try {
    const rulesRef = collection(db, 'associations', groupId, 'automation_rules');
    const rulesQuery = query(rulesRef, where('isActive', '==', true));
    const rulesSnapshot = await getDocs(rulesQuery);

    const activeRules = [];
    rulesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Filtrage en JS pour éviter de nécessiter un index composite (isActive + pointDeReference)
      if (data.pointDeReference === triggerType) {
        activeRules.push({ id: docSnap.id, ...data });
      }
    });

    if (activeRules.length === 0) {
      return { triggeredCount: 0, details: [`Aucune règle d'automatisation '${triggerType}' active.`] };
    }

    const assocDoc = await getDoc(doc(db, 'associations', groupId));
    let customCategories = ['Débutant', 'Confirmé'];
    if (assocDoc.exists() && assocDoc.data().customCategories) {
      customCategories = assocDoc.data().customCategories;
    }

    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('groupId', '==', groupId));
    const usersSnapshot = await getDocs(usersQuery);

    for (const rule of activeRules) {
      const matchesType = !rule.typeEvenementCible || 
                          rule.typeEvenementCible === 'tous' || 
                          rule.typeEvenementCible === event.type;

      if (!matchesType) continue;
      
      const rulePublicCible = rule.publicCible || 'tous';
      const eventInscriptions = Array.isArray(event.inscriptions) ? event.inscriptions : [];

      const interestedUsersForRule = [];
      usersSnapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        if (uData.statutActuel === 'archived') return;
        
        // Pour le cas spécifique de la relecture de CR, on cible uniquement les "Présents", peu importe le publicCible
        if (triggerType === 'reportValidation') {
          const isPresent = eventInscriptions.some(ins => ins.userId === docSnap.id && ins.status === 'present');
          if (isPresent) interestedUsersForRule.push({ id: docSnap.id, ...uData });
        } else {
          // Pour les autres déclencheurs, on applique le filtrage fin
          if (isUserEligibleForRule(uData, rulePublicCible, event, customCategories, eventInscriptions)) {
            interestedUsersForRule.push({ id: docSnap.id, ...uData });
          }
        }
      });

      if (interestedUsersForRule.length === 0) continue;

      const eventName = event.titre || event.nom || 'Événement';
      const bodyMessage = (rule.messageNotification || '').replace(/\{\{nomEvenement\}\}/g, eventName);

      const defaultTitle = triggerType === 'eventCancelled' ? 'Événement Annulé !' : 
                           triggerType === 'reportValidation' ? 'Compte-rendu à valider !' : 
                           'Événement Confirmé !';
      const actionText = triggerType === 'eventCancelled' ? 'l\'annulation' : 
                         triggerType === 'reportValidation' ? 'la mise en relecture du CR' :
                         'la confirmation';

      details.push(`🔔 [Règle "${rule.titre}"] : ${interestedUsersForRule.length} membre(s) notifié(s) de ${actionText} pour "${eventName}"`);

      for (const targetUser of interestedUsersForRule) {
        triggeredCount++;
        await addDoc(collection(db, 'notifications_queue'), {
          groupId: groupId,
          recipientId: targetUser.id,
          title: rule.titreNotification || defaultTitle,
          body: bodyMessage,
          eventId: event.id,
          createdAt: new Date().toISOString()
        });
      }
    }

    return { triggeredCount, details };

  } catch (error) {
    console.error("triggerEventStatusAutomation - Erreur :", error);
    throw error;
  }
}

