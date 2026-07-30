import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import XiloAvatar from '../XiloAvatar';

export default function EventPollSection({ event, user, profileData, onNavigateToEventId }) {
  const { confirm } = useConfirm();
  const [pollEvents, setPollEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsersMap, setAllUsersMap] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérification stricte des autorisations pour Super-Admin et Mestre
  const isSuperAdminOrMestre = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.isSystemAdmin === true;

  const isAdmin = isSuperAdminOrMestre || profileData?.role === 'secretaire';

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
      // Tri par index d'option ou date
      list.sort((a, b) => (a.optionIndex || 0) - (b.optionIndex || 0));
      setPollEvents(list);
      setLoading(false);
    }, (err) => {
      console.error("EventPollSection - Erreur query snapshot :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [event?.groupId, event?.pollGroupId]);

  // Carte en temps réel des utilisateurs pour noms et avatars
  useEffect(() => {
    if (!event?.groupId) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', event.groupId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.forEach((uDoc) => {
        const uData = uDoc.data();
        map[uDoc.id] = {
          id: uDoc.id,
          name: `${uData.prenom || ''} ${uData.nom || ''}`.trim() || 'Membre',
          photoURL: uData.photoURL || ''
        };
      });
      setAllUsersMap(map);
    });

    return () => unsubscribe();
  }, [event?.groupId]);

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
      const userFavInst = profileData?.instrumentFavori || profileData?.instrument || '';
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
      delete newVotes[user.uid]; // Annuler le vote
    } else {
      newVotes[user.uid] = choice; // Enregistrer 'dispo' ou 'indispo'
    }

    try {
      const eventRef = doc(db, 'events', optionEventId);
      await updateDoc(eventRef, { votes: newVotes });
    } catch (err) {
      console.error("EventPollSection - Erreur update votes :", err);
      alert("Erreur lors de l'enregistrement de votre vote.");
    }
  };

  // Validation définitive du créneau gagnant via une transaction Firestore Batch
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

      // 1. Récupération des votes "Disponible" et transfert automatique vers les inscriptions (RSVP)
      const votes = winningOptionEvent.votes || {};
      const dispoUserIds = Object.keys(votes).filter(uid => votes[uid] === 'dispo');

      const existingInscriptions = winningOptionEvent.inscriptions || [];
      const updatedInscriptions = [...existingInscriptions];

      dispoUserIds.forEach((uid) => {
        const existingIdx = updatedInscriptions.findIndex(i => i.userId === uid);
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

      // 2. Mise à jour de l'événement validé : retrait du statut sondage et conversion en réunion officielle
      const winningRef = doc(db, 'events', winningOptionEvent.id);
      batch.update(winningRef, {
        status: 'confirme',
        isPoll: false,
        inscriptions: updatedInscriptions,
        requiresValidation: false
      });

      // 3. Recherche et suppression de tous les autres créneaux du même pollGroupId
      if (winningOptionEvent.pollGroupId) {
        const pollQuery = query(
          collection(db, 'events'),
          where('pollGroupId', '==', winningOptionEvent.pollGroupId)
        );
        const snapshot = await getDocs(pollQuery);
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== winningOptionEvent.id) {
            batch.delete(docSnap.ref);
          }
        });
      }

      // 4. Exécution atomique de la transaction Firestore Batch
      await batch.commit();

      alert(`La date du ${dateFormatted} a été validée avec succès ! L'agenda a été nettoyé.`);
    } catch (err) {
      console.error("EventPollSection - Erreur confirmation option :", err);
      alert("Erreur lors de la validation du créneau.");
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

  if (!event?.pollGroupId && !event?.isPoll && event?.status !== 'sondage') return null;

  return (
    <CordelCard 
      variant="ocre" 
      useExtremeBorder={true} 
      className="p-4 mb-4 bg-amber-50/80 dark:bg-amber-950/30 border-dashed border-amber-600/40 select-none flex flex-col gap-3"
    >
      {/* Header title & restriction badge */}
      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-dashed border-amber-600/30">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pulse">📊</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Sondage de dates pour cette réunion
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

      {/* Pavé d'action prioritaire : Grand bouton de validation définitive pour Super-Admin / Mestre */}
      {isSuperAdminOrMestre && (
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

      {/* Liste des créneaux du sondage */}
      <div className="flex flex-col gap-2.5 mt-1">
        {loading ? (
          <p className="text-[10px] italic text-center opacity-60">Chargement des créneaux...</p>
        ) : (
          pollEvents.map((optionEv) => {
            const isCurrentPageOption = optionEv.id === event.id;
            const votes = optionEv.votes || {};
            const userVote = votes[user?.uid];
            
            const dispoUserIds = Object.keys(votes).filter(uid => votes[uid] === 'dispo');
            const indispoUserIds = Object.keys(votes).filter(uid => votes[uid] === 'indispo');

            return (
              <div 
                key={optionEv.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isCurrentPageOption 
                    ? 'bg-white dark:bg-black/30 border-amber-600 shadow-[2px_2px_0px_0px_#d97706]' 
                    : 'bg-white/60 dark:bg-black/10 border-encre-noire/20 hover:bg-white'
                }`}
              >
                {/* Informations du créneau */}
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

                    {/* Liste des votants et avatars */}
                    <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-cordel-master-dark">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-700 font-extrabold">✅ {dispoUserIds.length} dispo</span>
                        {dispoUserIds.length > 0 && (
                          <div className="flex -space-x-1 ml-1">
                            {dispoUserIds.slice(0, 4).map(uid => (
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

                {/* Actions: Navigation, Vote & Validation */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* Bouton de navigation vers la fiche d'une option */}
                  {!isCurrentPageOption && onNavigateToEventId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToEventId(optionEv.id)}
                      className="text-[9px] font-black uppercase px-2.5 py-1 border border-encre-noire/30 bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:shadow-none cursor-pointer"
                    >
                      👁️ Voir fiche
                    </button>
                  )}

                  {/* Boutons de vote */}
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

                  {/* Bouton de confirmation pour une option du tableau */}
                  {isSuperAdminOrMestre && (
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
    </CordelCard>
  );
}
