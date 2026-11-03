import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import XiloAvatar from '../XiloAvatar';
import { isMemberArchived } from '../../utils/memberUtils';
import PollPupitreDispatchPanel from './PollPupitreDispatchPanel';

export default function EventPollSection({
  event,
  user,
  profileData,
  onNavigateToEventId,
  allUsers: propAllUsers,
  pupitresList = [],
  linkedInstruments = []
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

  const effectiveTargetPupitres = useMemo(() => {
    if (Array.isArray(event?.pollTargetPupitres) && event.pollTargetPupitres.length > 0) {
      return event.pollTargetPupitres;
    }
    const fromSibling = pollEvents.find((ev) => Array.isArray(ev.pollTargetPupitres) && ev.pollTargetPupitres.length > 0);
    if (fromSibling) return fromSibling.pollTargetPupitres;
    return pupitresList;
  }, [event?.pollTargetPupitres, pollEvents, pupitresList]);

  // Calcul d'éligibilité basé sur le type de restriction du sondage
  const checkEligibility = () => {
    const resType = event.pollRestrictionType;
    const target = event.pollTarget;

    if (!resType || resType === 'aucun') {
      return { eligible: true, message: null };
    }

    if (resType === 'tag') {
      const userTags = profileData?.tags || [];
      const hasTag = userTags.includes(target);
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

  // Enregistrement ou bascule d'un vote pour une option spécifique
  const handleVote = async (optionEventId, currentVotesObj, choice) => {
    if (!user?.uid || !eligible || isProcessing) return;

    const newVotes = { ...(currentVotesObj || {}) };
    if (newVotes[user.uid] === choice) {
      delete newVotes[user.uid];
    } else {
      newVotes[user.uid] = choice;
    }

    try {
      const eventRef = doc(db, 'events', optionEventId);
      await updateDoc(eventRef, { votes: newVotes });
    } catch (err) {
      console.error("EventPollSection - Erreur update votes :", err);
      alert("Erreur lors de l'enregistrement de votre vote.");
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
      const batch = writeBatch(db);
      const votes = winningOptionEvent.votes || {};
      const dispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'dispo');

      const existingInscriptions = winningOptionEvent.inscriptions || [];
      const updatedInscriptions = [...existingInscriptions];

      dispoUserIds.forEach((uid) => {
        const existingIdx = updatedInscriptions.findIndex((i) => i.userId === uid);
        if (existingIdx >= 0) {
          updatedInscriptions[existingIdx] = {
            ...updatedInscriptions[existingIdx],
            status: 'present'
          };
        } else {
          updatedInscriptions.push({
            userId: uid,
            status: 'present',
            timestamp: new Date().toISOString()
          });
        }
      });

      const winningRef = doc(db, 'events', winningOptionEvent.id);
      batch.update(winningRef, {
        status: 'confirme',
        isPoll: false,
        inscriptions: updatedInscriptions,
        requiresValidation: false
      });

      const targetGroupId = event?.groupId;
      if (winningOptionEvent.pollGroupId && targetGroupId) {
        const pollQuery = query(
          collection(db, 'events'),
          where('pollGroupId', '==', winningOptionEvent.pollGroupId),
          where('groupId', '==', targetGroupId)
        );
        const snapshot = await getDocs(pollQuery);
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== winningOptionEvent.id) {
            batch.delete(docSnap.ref);
          }
        });
      }

      await batch.commit();
      alert(`La date du ${dateFormatted} a été validée avec succès ! L'agenda a été nettoyé.`);
    } catch (err) {
      console.error("EventPollSection - Erreur confirmation option :", err);
      alert("Erreur lors de la validation du créneau.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Validation groupée par pupitre (mode pupitre_dispatch) via writeBatch atomique
  const handleConfirmPupitreDispatch = async (allocation, matrix, targetPupitres) => {
    if (!isSuperAdminOrMestre || isProcessing) return;

    const baseTitre = String(event?.titre || 'Atelier').split(' — ')[0].trim();
    const summaryLines = [];
    pollEvents.forEach((ev) => {
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
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      pollEvents.forEach((slotEv) => {
        const assignedPupitres = (targetPupitres || []).filter((p) => allocation[p] === slotEv.id);
        const slotRef = doc(db, 'events', slotEv.id);

        if (assignedPupitres.length > 0) {
          const updatedInscriptions = [...(slotEv.inscriptions || [])];
          assignedPupitres.forEach((p) => {
            const members = matrix?.[slotEv.id]?.[p]?.availableMembers || [];
            members.forEach((m) => {
              const idx = updatedInscriptions.findIndex((i) => i.userId === m.uid);
              const entry = {
                userId: m.uid,
                userName: m.name,
                status: 'present',
                instrumentChoisi: m.instrumentChoisi || p,
                timestamp: nowIso
              };
              if (idx >= 0) {
                updatedInscriptions[idx] = { ...updatedInscriptions[idx], ...entry };
              } else {
                updatedInscriptions.push(entry);
              }
            });
          });

          batch.update(slotRef, {
            titre: `${baseTitre} — ${assignedPupitres.join(' & ')}`,
            status: 'confirme',
            isPoll: false,
            requiresValidation: false,
            pollAssignedPupitres: assignedPupitres,
            inscriptions: updatedInscriptions
          });
        } else {
          batch.delete(slotRef);
        }
      });

      await batch.commit();
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

        {event.pollRestrictionType && event.pollRestrictionType !== 'aucun' && (
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-2 py-0.5">
            {event.pollRestrictionType === 'tag' ? `🏷️ Étiquette : ${event.pollTarget}` : `🥁 Pupitre : ${event.pollTarget}`}
          </span>
        )}
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

      {/* Liste des créneaux du sondage pour voter */}
      <div className="flex flex-col gap-2.5 mt-1">
        {loading ? (
          <p className="text-[10px] italic text-center opacity-60">Chargement des créneaux...</p>
        ) : (
          pollEvents.map((optionEv) => {
            const isCurrentPageOption = optionEv.id === event.id;
            const votes = optionEv.votes || {};
            const userVote = votes[user?.uid];

            const dispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'dispo');
            const indispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'indispo');

            return (
              <div
                key={optionEv.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isCurrentPageOption
                    ? 'bg-white dark:bg-black/30 border-amber-600 shadow-[2px_2px_0px_0px_#d97706]'
                    : 'bg-white/60 dark:bg-black/10 border-encre-noire/20 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full border-2 border-encre-noire flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isCurrentPageOption ? 'bg-amber-500 text-white' : 'bg-cordel-bg text-encre-noire'
                  }`}>
                    {optionEv.optionIndex || '?'}
                  </span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-encre-noire">
                        📅 {formatDate(optionEv.date)}
                      </span>
                      {isCurrentPageOption && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                          Fiche ouverte
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-cordel-master-dark">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-700 font-extrabold">✅ {dispoUserIds.length} dispo</span>
                        {dispoUserIds.length > 0 && (
                          <div className="flex -space-x-1 ml-1">
                            {dispoUserIds.slice(0, 4).map((uid) => (
                              <XiloAvatar key={uid} src={allUsersMap[uid]?.photoURL} name={allUsersMap[uid]?.name} size={14} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-75">
                        <span className="text-red-700">❌ {indispoUserIds.length} indispo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {!isCurrentPageOption && onNavigateToEventId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToEventId(optionEv.id)}
                      className="text-[9px] font-black uppercase px-2.5 py-1 border border-encre-noire/30 bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:shadow-none cursor-pointer"
                    >
                      👁️ Voir fiche
                    </button>
                  )}

                  {eligible && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleVote(optionEv.id, votes, 'dispo')}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                          userVote === 'dispo'
                            ? 'bg-emerald-600 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                            : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        ✅ {userVote === 'dispo' ? 'Dispo !' : 'Dispo'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(optionEv.id, votes, 'indispo')}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                          userVote === 'indispo'
                            ? 'bg-red-600 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                            : 'bg-white text-red-800 border-red-300 hover:bg-red-50'
                        }`}
                      >
                        ❌ {userVote === 'indispo' ? 'Indispo !' : 'Indispo'}
                      </button>
                    </div>
                  )}

                  {isSuperAdminOrMestre && !isPupitreDispatch && (
                    <CordelButton
                      variant="vert"
                      onClick={() => handleConfirmWinningOption(optionEv)}
                      disabled={isProcessing}
                      className="text-[9px] font-black uppercase py-1 px-2.5 ml-1"
                      title="Valider définitivement cette date et supprimer les autres créneaux"
                    >
                      🌟 Retenir cette date
                    </CordelButton>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tableau de synthèse Mestre & Matrice croisée (Dates x Pupitres) en mode répartition */}
      {!loading && isPupitreDispatch && (
        <PollPupitreDispatchPanel
          pollEvents={pollEvents}
          allUsers={effectiveUsers}
          targetPupitres={effectiveTargetPupitres}
          pupitresList={pupitresList}
          linkedInstruments={linkedInstruments}
          isSuperAdminOrMestre={isSuperAdminOrMestre}
          isProcessing={isProcessing}
          formatDate={formatDate}
          onConfirmDispatch={handleConfirmPupitreDispatch}
        />
      )}
    </CordelCard>
  );
}
