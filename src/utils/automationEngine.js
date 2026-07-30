import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

    // 3. Chargement des membres de l'association
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

    // 4. Exécution de l'analyse Règle par Règle / Événement par Événement
    for (const rule of activeRules) {
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
          const inscriptions = Array.isArray(ev.inscriptions) ? ev.inscriptions : [];
          const usersPending = activeUsers.filter((u) => {
            const userResp = inscriptions.find(ins => ins.userId === u.id);
            if (!userResp) return true; // Aucune réponse saisie
            return userResp.status === 'pending' || !userResp.status;
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
