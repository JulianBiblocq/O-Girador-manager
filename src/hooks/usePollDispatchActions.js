import {
  confirmSinglePupitrePollSlot,
  executeBatchPupitreDispatch,
  executeSingleWinningPollOption
} from '../utils/pollFunnelValidationUtils';
import {
  notifyInterestedMembersOnPupitreSlotValidated,
  notifyInterestedMembersOnBatchDispatch,
  notifyInterestedMembersOnSingleWinner
} from '../utils/pollNotificationUtils';

/**
 * Hook personnalisé gérant les actions de validation de sondage et les notifications
 * automatiques In-App + Push FCM aux membres intéressés (< 140 lignes).
 */
export default function usePollDispatchActions({
  db, event, pollEvents = [], openPollEvents = [], allUsersMap = {},
  isSuperAdminOrMestre = false, isProcessing = false, setIsProcessing, confirm, formatDate
}) {
  const groupId = event?.groupId || pollEvents[0]?.groupId;

  // Validation définitive du créneau gagnant unique (mode single_winner)
  const handleConfirmWinningOption = async (winningOptionEvent = event) => {
    if (!isSuperAdminOrMestre || isProcessing) return;
    const dateFormatted = formatDate(winningOptionEvent.date);
    const isOk = await confirm({
      title: '🌟 Valider définitivement cette date ?',
      message: `Voulez-vous valider la date du ${dateFormatted} ?\n\n• Cet événement deviendra une vraie réunion officielle dans l'agenda.\n• Les membres ayant voté "Disponible" seront inscrits automatiquement dans la liste des présents (RSVP).\n• Les autres créneaux de ce sondage seront supprimés de la base de données.`,
      confirmText: 'Oui, valider cette date', cancelText: 'Annuler', variant: 'vert'
    });
    if (!isOk) return;

    setIsProcessing(true);
    try {
      await executeSingleWinningPollOption({ db, winningOptionEvent, allUsersMap, groupId });
      await notifyInterestedMembersOnSingleWinner({ groupId, winningOptionEvent, formattedDate: dateFormatted });
      alert(`La date du ${dateFormatted} a été validée avec succès ! L'agenda a été nettoyé.`);
    } catch (err) {
      console.error('usePollDispatchActions - Erreur confirmation option :', err);
      alert('Erreur lors de la validation du créneau.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validation unitaire d'un seul créneau pour un pupitre ("En entonnoir")
  const handleConfirmSinglePupitreSlot = async (pupitre, targetEventId, allowLatecomers, matrix) => {
    if (!isSuperAdminOrMestre || isProcessing) return;
    const targetEv = openPollEvents.find((ev) => ev.id === targetEventId);
    if (!targetEv) return;

    const dateLabel = formatDate(targetEv.date);
    const cell = matrix?.[targetEventId]?.[pupitre] || {};
    const count = cell.count || 0;
    const isOk = await confirm({
      title: `📌 Valider le créneau ${pupitre} ?`,
      message: `Voulez-vous fixer l'atelier ${pupitre} sur le créneau du ${dateLabel} (${count} disponible(s)) ?\n\n• Ce créneau deviendra l'atelier officiel pour ${pupitre}.\n• Les autres pupitres continueront de voter sur les créneaux restants du sondage.${allowLatecomers ? `\n• Les inscriptions resteront ouvertes aux retardataires du pupitre ${pupitre} jusqu'au jour de l'atelier.` : ''}`,
      confirmText: `Oui, valider ${pupitre}`, cancelText: 'Annuler', variant: 'vert'
    });
    if (!isOk) return;

    setIsProcessing(true);
    try {
      const { finalTitre } = await confirmSinglePupitrePollSlot({
        db, pupitre, targetEventId, allowLatecomers, matrix, pollOptions: pollEvents, event
      });
      await notifyInterestedMembersOnPupitreSlotValidated({
        groupId, targetEventId,
        validatedEventTitle: finalTitre || `${event?.titre || 'Atelier'} — ${pupitre}`,
        formattedDate: dateLabel, pupitreLabel: pupitre,
        availableMembers: cell.availableMembers || [],
        unansweredMembers: cell.unansweredMembers || [],
        allowLatecomers
      });
      alert(`Créneau validé pour ${pupitre} (${dateLabel}) !`);
    } catch (err) {
      console.error('usePollDispatchActions - Erreur validation unitaire pupitre :', err);
      alert('Erreur lors de la validation du créneau pour ce pupitre.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validation groupée par pupitre (mode pupitre_dispatch) via writeBatch atomique
  const handleConfirmPupitreDispatch = async (allocation, matrix, targetPupitres, allowLatecomers = true) => {
    if (!isSuperAdminOrMestre || isProcessing) return;

    const baseTitre = String(event?.titre || 'Atelier').split(' — ')[0].trim();
    const summaryLines = [];
    openPollEvents.forEach((ev) => {
      const assigned = (targetPupitres || []).filter((p) => allocation[p] === ev.id);
      if (assigned.length > 0) {
        const count = assigned.reduce((s, p) => s + (matrix?.[ev.id]?.[p]?.count || 0), 0);
        summaryLines.push(`• ${formatDate(ev.date)} ➔ ${assigned.join(' & ')} (${count} présent(s))`);
      }
    });

    const isOk = await confirm({
      title: '✅ Valider la répartition par pupitre ?',
      message: `Voulez-vous confirmer simultanément les ateliers suivants ?\n\n${summaryLines.join('\n')}\n\n• Chaque créneau retenu sera renommé et confirmé avec les membres disponibles du pupitre attribué.\n• Les créneaux sans pupitre attribué seront supprimés.`,
      confirmText: 'Oui, valider la répartition', cancelText: 'Annuler', variant: 'vert'
    });
    if (!isOk) return;

    setIsProcessing(true);
    try {
      await executeBatchPupitreDispatch({
        db, pollEvents: openPollEvents, allocation, matrix, targetPupitres, allowLatecomers, baseTitre
      });
      await notifyInterestedMembersOnBatchDispatch({
        groupId, pollEvents: openPollEvents, allocation, matrix, targetPupitres, allowLatecomers, baseTitre, formatDate
      });
      alert('La répartition des ateliers par pupitre a été validée avec succès !');
    } catch (err) {
      console.error('usePollDispatchActions - Erreur validation répartition pupitres :', err);
      alert('Erreur lors de la validation de la répartition.');
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleConfirmWinningOption, handleConfirmSinglePupitreSlot, handleConfirmPupitreDispatch };
}
