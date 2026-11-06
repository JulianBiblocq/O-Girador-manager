import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { isMemberArchived } from '../../utils/memberUtils';
import PollPupitreDispatchPanel from './PollPupitreDispatchPanel';
import EventPollOptionCard from './EventPollOptionCard';
import { submitPollVote } from '../../utils/pollVoteUtils';
import {
  confirmSinglePupitrePollSlot,
  executeBatchPupitreDispatch,
  executeSingleWinningPollOption
} from '../../utils/pollFunnelValidationUtils';
import { checkAndNotifyFullPupitreParticipation } from '../../utils/pollPupitreAlertUtils';
import {
  canUserParticipateInReunion,
  resolveReunionPrivacyConfig,
  getTargetGroupDisplayName
} from '../../utils/reunionPrivacyUtils';
import ReunionPrivacyBadge from '../agenda/ReunionPrivacyBadge';

export default function EventPollSection({
  event,
  user,
  profileData,
  onNavigateToEventId,
  allUsers: propAllUsers,
  pupitresList = [],
  linkedInstruments = [],
  effectiveUserTags = [],
  tagsDisponibles = []
}) {
  const { confirm } = useConfirm();
  const [pollEvents, setPollEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fallbackUsers, setFallbackUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérification stricte des autorisations pour Super-Admin et Mestre
  const isSuperAdminOrMestre =
    profileData?.role === 'mestre' ||
    profileData?.role === 'super-admin' ||
    profileData?.isSystemAdmin === true;

  // Synchronisation en temps réel de tous les créneaux partageant le même pollGroupId
  useEffect(() => {
    if (!event?.groupId || !event?.pollGroupId) return;
    setLoading(true);

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('groupId', '==', event.groupId),
      where('pollGroupId', '==', event.pollGroupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (a.optionIndex || 0) - (b.optionIndex || 0));
      setPollEvents(list);
      setLoading(false);
    }, (err) => {
      console.error("EventPollSection - Erreur query snapshot :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [event?.groupId, event?.pollGroupId]);

  // Écouteur de repli uniquement si la prop allUsers n'est pas fournie par le parent
  useEffect(() => {
    if (Array.isArray(propAllUsers) || !event?.groupId) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', event.groupId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((uDoc) => {
        list.push({ id: uDoc.id, ...uDoc.data() });
      });
      setFallbackUsers(list);
    }, (err) => {
      console.warn("EventPollSection - Erreur lecture utilisateurs de repli :", err);
    });

    return () => unsubscribe();
  }, [propAllUsers, event?.groupId]);

  // Liste consolidée des membres actifs (sans membres archivés)
  const effectiveUsers = useMemo(() => {
    const source = Array.isArray(propAllUsers) ? propAllUsers : fallbackUsers;
    return source.filter((u) => u && !isMemberArchived(u));
  }, [propAllUsers, fallbackUsers]);

  // Dictionnaire indexé pour affichage rapide des noms et avatars
  const allUsersMap = useMemo(() => {
    const map = {};
    effectiveUsers.forEach((u) => {
      const uid = u.id || u.uid;
      if (!uid) return;
      map[uid] = {
        ...u,
        id: uid,
        name: `${u.prenom || ''} ${u.nom || ''}`.trim() || u.displayName || 'Membre',
        photoURL: u.photoURL || ''
      };
    });
    return map;
  }, [effectiveUsers]);

  const isPupitreDispatch =
    event?.pollMode === 'pupitre_dispatch' ||
    pollEvents.some((ev) => ev.pollMode === 'pupitre_dispatch');

  // Créneaux encore ouverts au sondage (exclut les créneaux déjà validés en entonnoir)
  const openPollEvents = useMemo(() => {
    const open = pollEvents.filter((ev) => ev.status === 'sondage' || ev.isPoll === true);
    return open.length > 0 ? open : pollEvents;
  }, [pollEvents]);

  // Historique consolidé des créneaux déjà validés en entonnoir
  const validatedHistory = useMemo(() => {
    const map = new Map();
    const sources = [event, ...pollEvents];
    sources.forEach((src) => {
      if (Array.isArray(src?.pollValidatedHistory)) {
        src.pollValidatedHistory.forEach((item) => {
          if (item?.pupitre) map.set(item.pupitre, item);
        });
      }
      if (src?.status === 'confirme' && Array.isArray(src?.pollAssignedPupitres)) {
        src.pollAssignedPupitres.forEach((p) => {
          if (!map.has(p)) {
            map.set(p, {
              pupitre: p,
              eventId: src.id,
              date: src.dateDebut || src.date,
              titre: src.titre
            });
          }
        });
      }
    });
    return Array.from(map.values());
  }, [event, pollEvents]);

  const effectiveTargetPupitres = useMemo(() => {
    const validatedPupitresSet = new Set(validatedHistory.map((h) => h.pupitre));
    let baseList = pupitresList;
    if (Array.isArray(event?.pollTargetPupitres) && event.pollTargetPupitres.length > 0) {
      baseList = event.pollTargetPupitres;
    } else {
      const fromSibling = openPollEvents.find((ev) => Array.isArray(ev.pollTargetPupitres) && ev.pollTargetPupitres.length > 0);
      if (fromSibling) baseList = fromSibling.pollTargetPupitres;
    }
    return baseList.filter((p) => !validatedPupitresSet.has(p));
  }, [event?.pollTargetPupitres, openPollEvents, pupitresList, validatedHistory]);

  // Calcul d'éligibilité basé sur le groupe convoqué (réunion) ou le type de restriction du sondage
  const checkEligibility = () => {
    if (event?.type === 'reunion') {
      const canVote = canUserParticipateInReunion(event, profileData, effectiveUserTags);
      if (!canVote) {
        const cfg = resolveReunionPrivacyConfig(event);
        const groupLabel = getTargetGroupDisplayName(cfg.targetGroup, tagsDisponibles, true);
        return {
          eligible: false,
          message: `🔒 Ce sondage de dates est réservé aux membres du groupe : ${groupLabel}.`
        };
      }
    }

    const resType = event.pollRestrictionType;
    const target = event.pollTarget;

    if (!resType || resType === 'aucun') {
      return { eligible: true, message: null };
    }

    if (resType === 'tag') {
      const userTags = Array.from(new Set([...(profileData?.tags || []), ...(effectiveUserTags || [])]));
      const targetLower = String(target || '').toLowerCase();
      const hasTag = userTags.some((t) => String(typeof t === 'object' ? (t.id || t.nomM || t.nom || '') : t).toLowerCase() === targetLower);
      return {
        eligible: hasTag,
        message: hasTag ? null : `🔒 Sondage réservé aux membres de l'étiquette "${target}"`
      };
    }

    if (resType === 'instrument') {
      const userFavInst = profileData?.instrumentPrincipal || profileData?.instrumentFavori || profileData?.instrument || '';
      const userInstList = profileData?.instrumentsJoues || profileData?.instruments || [];
      const playsInst = userFavInst === target || userInstList.includes(target);
      return {
        eligible: playsInst,
        message: playsInst ? null : `🔒 Sondage réservé aux joueurs du pupitre "${target}"`
      };
    }

    return { eligible: true, message: null };
  };

  const { eligible, message: restrictionMessage } = checkEligibility();

  // Enregistrement ou bascule d'un vote pour une option spécifique + détection 100 % pupitre
  const handleVote = async (optionEvent, choice) => {
    if (!user?.uid || !eligible || isProcessing || !optionEvent?.id) return;

    try {
      const result = await submitPollVote({
        optionEvent,
        user,
        profileData,
        choice
      });
      if (result?.nextVote === 'dispo' || result?.nextVote === 'indispo') {
        await checkAndNotifyFullPupitreParticipation({
          db,
          pollOptions: openPollEvents,
          event,
          voterUid: user.uid,
          updatedOptionId: optionEvent.id,
          updatedVotesForOption: result.updatedVotes,
          effectiveAllUsers: effectiveUsers,
          pupitresList: effectiveTargetPupitres,
          linkedInstruments,
          formatDate
        });
      }
    } catch (err) {
      console.error("EventPollSection - Erreur update votes :", err);
      alert(`Erreur lors de l'enregistrement de votre réponse (${err?.code || err?.message || 'inconnu'}).`);
    }
  };

  // Validation définitive du créneau gagnant unique (mode single_winner)
  const handleConfirmWinningOption = async (winningOptionEvent = event) => {
    if (!isSuperAdminOrMestre || isProcessing) return;

    const dateFormatted = formatDate(winningOptionEvent.date);
    const isOk = await confirm({
      title: "🌟 Valider définitivement cette date ?",
      message: `Voulez-vous valider la date du ${dateFormatted} ?\n\n• Cet événement deviendra une vraie réunion officielle dans l'agenda.\n• Les membres ayant voté "Disponible" seront inscrits automatiquement dans la liste des présents (RSVP).\n• Les autres créneaux de ce sondage seront supprimés de la base de données.`,
      confirmText: "Oui, valider cette date",
      cancelText: "Annuler",
      variant: "vert"
    });

    if (!isOk) return;

    setIsProcessing(true);
    try {
      await executeSingleWinningPollOption({
        db,
        winningOptionEvent,
        allUsersMap,
        groupId: event?.groupId
      });
      alert(`La date du ${dateFormatted} a été validée avec succès ! L'agenda a été nettoyé.`);
    } catch (err) {
      console.error("EventPollSection - Erreur confirmation option :", err);
      alert("Erreur lors de la validation du créneau.");
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
    const count = matrix?.[targetEventId]?.[pupitre]?.count || 0;
    const isOk = await confirm({
      title: `📌 Valider le créneau ${pupitre} ?`,
      message: `Voulez-vous fixer l'atelier ${pupitre} sur le créneau du ${dateLabel} (${count} disponible(s)) ?\n\n• Ce créneau deviendra l'atelier officiel pour ${pupitre}.\n• Les autres pupitres continueront de voter sur les créneaux restants du sondage.${allowLatecomers ? `\n• Les inscriptions resteront ouvertes aux retardataires du pupitre ${pupitre} jusqu'au jour de l'atelier.` : ''}`,
      confirmText: `Oui, valider ${pupitre}`,
      cancelText: "Annuler",
      variant: "vert"
    });
    if (!isOk) return;

    setIsProcessing(true);
    try {
      await confirmSinglePupitrePollSlot({
        db,
        pupitre,
        targetEventId,
        allowLatecomers,
        matrix,
        pollOptions: pollEvents,
        event
      });
      alert(`Créneau validé pour ${pupitre} (${dateLabel}) !`);
    } catch (err) {
      console.error("EventPollSection - Erreur validation unitaire pupitre :", err);
      alert("Erreur lors de la validation du créneau pour ce pupitre.");
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
      title: "✅ Valider la répartition par pupitre ?",
      message: `Voulez-vous confirmer simultanément les ateliers suivants ?\n\n${summaryLines.join('\n')}\n\n• Chaque créneau retenu sera renommé et confirmé avec les membres disponibles du pupitre attribué.\n• Les créneaux sans pupitre attribué seront supprimés.`,
      confirmText: "Oui, valider la répartition",
      cancelText: "Annuler",
      variant: "vert"
    });

    if (!isOk) return;

    setIsProcessing(true);
    try {
      await executeBatchPupitreDispatch({
        db,
        pollEvents: openPollEvents,
        allocation,
        matrix,
        targetPupitres,
        allowLatecomers,
        baseTitre
      });
      alert("La répartition des ateliers par pupitre a été validée avec succès !");
    } catch (err) {
      console.error("EventPollSection - Erreur validation répartition pupitres :", err);
      alert("Erreur lors de la validation de la répartition.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date non spécifiée';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${formatted} à ${hours}h${minutes}`;
  };

  if (!event?.isPoll && event?.status !== 'sondage') return null;

  return (
    <CordelCard
      variant="ocre"
      useExtremeBorder={true}
      className="p-4 mb-4 bg-amber-50/80 dark:bg-amber-950/30 border-dashed border-amber-600/40 select-none flex flex-col gap-3"
    >
      {/* En-tête du sondage */}
      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-dashed border-amber-600/30">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pulse">{isPupitreDispatch ? '🥁' : '📊'}</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {isPupitreDispatch
                ? 'Sondage de répartition par pupitre (Ateliers)'
                : 'Sondage de dates pour cette réunion'}
            </h3>
            <p className="text-[10px] font-semibold opacity-80 text-encre-noire">
              Créneau actuellement affiché : <strong className="text-cordel-wood font-extrabold">Option {event.optionIndex || 1} sur {event.totalOptions || pollEvents.length || 1}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {event?.type === 'reunion' && (
            <ReunionPrivacyBadge event={event} tagsDisponibles={tagsDisponibles} />
          )}
          {event.pollRestrictionType && event.pollRestrictionType !== 'aucun' && event?.type !== 'reunion' && (
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-2 py-0.5">
              {event.pollRestrictionType === 'tag' ? `🏷️ Étiquette : ${event.pollTarget}` : `🥁 Pupitre : ${event.pollTarget}`}
            </span>
          )}
        </div>
      </div>

      {/* Message de restriction si l'utilisateur n'est pas éligible */}
      {restrictionMessage && (
        <div className="p-2.5 bg-amber-200/50 dark:bg-amber-900/40 border border-amber-500/30 rounded text-center text-xs font-bold text-amber-900 dark:text-amber-200">
          {restrictionMessage}
        </div>
      )}

      {/* Pavé d'action prioritaire (uniquement en mode Date unique) */}
      {isSuperAdminOrMestre && !isPupitreDispatch && (
        <div className="p-3.5 bg-emerald-100/90 dark:bg-emerald-950/50 border-2 border-emerald-700/60 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#181716] my-1 select-none">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span>🌟</span> Clôture & Validation Officielle
            </span>
            <span className="text-[11px] font-semibold text-emerald-900/80 dark:text-emerald-300/80">
              Validez la date de cette fiche ({formatDate(event.date)}) pour clore le sondage et nettoyer l'agenda.
            </span>
          </div>
          <CordelButton
            variant="vert"
            useExtremeBorder={true}
            onClick={() => handleConfirmWinningOption(event)}
            disabled={isProcessing}
            className="text-xs font-black uppercase py-2.5 px-4 whitespace-nowrap w-full sm:w-auto shadow-md"
            title="Valider définitivement cette date et nettoyer les autres créneaux de la base de données"
          >
            {isProcessing ? "Validation en cours..." : "🌟 Valider définitivement cette date"}
          </CordelButton>
        </div>
      )}

      {/* Encart d'historique des créneaux déjà fixés en entonnoir */}
      {validatedHistory.length > 0 && (
        <div className="p-2.5 bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-600/50 rounded flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-[var(--color-cordel-vert,#2d6a4f)]">
            ✅ Déjà fixé :
          </span>
          {validatedHistory.map((item) => (
            <button
              key={item.pupitre}
              type="button"
              onClick={() => item.eventId && onNavigateToEventId && onNavigateToEventId(item.eventId)}
              className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white border border-emerald-600/40 text-encre-noire hover:bg-emerald-50 cursor-pointer"
            >
              {item.pupitre} ➔ {formatDate(item.date)}
            </button>
          ))}
        </div>
      )}

      {/* Liste des créneaux du sondage pour voter */}
      <div className="flex flex-col gap-2.5 mt-1">
        {loading ? (
          <p className="text-[10px] italic text-center opacity-60">Chargement des créneaux...</p>
        ) : (
          openPollEvents.map((optionEv) => (
            <EventPollOptionCard
              key={optionEv.id}
              optionEv={optionEv}
              currentEventId={event.id}
              userUid={user?.uid}
              allUsersMap={allUsersMap}
              eligible={eligible}
              isSuperAdminOrMestre={isSuperAdminOrMestre}
              isPupitreDispatch={isPupitreDispatch}
              isProcessing={isProcessing}
              formatDate={formatDate}
              onNavigateToEventId={onNavigateToEventId}
              onVote={handleVote}
              onConfirmWinningOption={handleConfirmWinningOption}
            />
          ))
        )}
      </div>

      {/* Tableau de synthèse Mestre & Matrice croisée (Dates x Pupitres) en mode répartition */}
      {!loading && isPupitreDispatch && (
        <PollPupitreDispatchPanel
          pollEvents={openPollEvents}
          allUsers={effectiveUsers}
          targetPupitres={effectiveTargetPupitres}
          pupitresList={pupitresList}
          linkedInstruments={linkedInstruments}
          isSuperAdminOrMestre={isSuperAdminOrMestre}
          isProcessing={isProcessing}
          formatDate={formatDate}
          onConfirmSinglePupitre={handleConfirmSinglePupitreSlot}
          onConfirmDispatch={handleConfirmPupitreDispatch}
        />
      )}
    </CordelCard>
  );
}
