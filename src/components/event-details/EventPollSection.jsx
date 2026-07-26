import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

  const isAdmin = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'secretaire' || 
    profileData?.isSystemAdmin === true;

  // Real-time synchronization of all events in the same pollGroupId
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
      // Sort by optionIndex or date
      list.sort((a, b) => (a.optionIndex || 0) - (b.optionIndex || 0));
      setPollEvents(list);
      setLoading(false);
    }, (err) => {
      console.error("EventPollSection - Erreur query snapshot :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [event?.groupId, event?.pollGroupId]);

  // Real-time users map for names and avatars
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

  // Eligibility calculation based on restriction type and target
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

  // Vote handler for a specific option event
  const handleVote = async (optionEventId, currentVotesObj, choice) => {
    if (!user?.uid || !eligible || isProcessing) return;

    const newVotes = { ...(currentVotesObj || {}) };
    if (newVotes[user.uid] === choice) {
      delete newVotes[user.uid]; // Toggle off
    } else {
      newVotes[user.uid] = choice; // Set choice ('dispo' | 'indispo')
    }

    try {
      const eventRef = doc(db, 'events', optionEventId);
      await updateDoc(eventRef, { votes: newVotes });
    } catch (err) {
      console.error("EventPollSection - Erreur update votes :", err);
      alert("Erreur lors de l'enregistrement de votre vote.");
    }
  };

  // Validation handler to confirm winning date option and delete other temporary slots
  const handleConfirmWinningOption = async (winningOptionEvent) => {
    if (!isAdmin || isProcessing) return;

    const dateFormatted = formatDate(winningOptionEvent.date);
    const isOk = await confirm({
      title: "🌟 Valider définitivement ce créneau ?",
      message: `Êtes-vous sûr de vouloir valider la date du ${dateFormatted} ?\n\n• Cet événement deviendra officiel dans l'agenda.\n• Les membres ayant voté "Disponible" seront inscrits automatiquement.\n• Les autres créneaux de ce sondage seront supprimés.`,
      confirmText: "Oui, valider cette date",
      cancelText: "Annuler",
      variant: "ocre"
    });

    if (!isOk) return;

    setIsProcessing(true);
    try {
      const votes = winningOptionEvent.votes || {};
      const dispoUserIds = Object.keys(votes).filter(uid => votes[uid] === 'dispo');

      // 1. Build initial inscriptions array with dispo voters as present
      const existingInscriptions = winningOptionEvent.inscriptions || [];
      const updatedInscriptions = [...existingInscriptions];

      dispoUserIds.forEach((uid) => {
        if (!updatedInscriptions.some(i => i.userId === uid)) {
          updatedInscriptions.push({
            userId: uid,
            status: 'present',
            timestamp: new Date().toISOString()
          });
        }
      });

      // 2. Update winning option doc to status: 'confirme' and remove sondage fields
      const winningRef = doc(db, 'events', winningOptionEvent.id);
      await updateDoc(winningRef, {
        status: 'confirme',
        inscriptions: updatedInscriptions,
        requiresValidation: false
      });

      // 3. Delete all other temporary option events in the same pollGroupId
      const otherOptions = pollEvents.filter(e => e.id !== winningOptionEvent.id);
      for (const otherEv of otherOptions) {
        await deleteDoc(doc(db, 'events', otherEv.id));
      }

      alert(`La date du ${dateFormatted} a été validée avec succès !`);
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

  if (!event?.pollGroupId) return null;

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

      {/* Restriction Notice if non-eligible user */}
      {restrictionMessage && (
        <div className="p-2.5 bg-amber-200/50 dark:bg-amber-900/40 border border-amber-500/30 rounded text-center text-xs font-bold text-amber-900 dark:text-amber-200">
          {restrictionMessage}
        </div>
      )}

      {/* Options List */}
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
                {/* Option Info */}
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

                    {/* Voters list count & avatars */}
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

                {/* Actions: Navigation & Voting & Validation */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* View Navigation Button */}
                  {!isCurrentPageOption && onNavigateToEventId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToEventId(optionEv.id)}
                      className="text-[9px] font-black uppercase px-2.5 py-1 border border-encre-noire/30 bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:shadow-none cursor-pointer"
                    >
                      👁️ Voir fiche
                    </button>
                  )}

                  {/* Vote Buttons */}
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

                  {/* Admin Confirmation Button */}
                  {isAdmin && (
                    <CordelButton
                      variant="ocre"
                      onClick={() => handleConfirmWinningOption(optionEv)}
                      disabled={isProcessing}
                      className="text-[9px] font-black uppercase py-1 px-2.5 ml-1"
                      title="Valider définitivement ce créneau et supprimer les autres options"
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
