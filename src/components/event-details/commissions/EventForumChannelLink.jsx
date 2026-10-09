import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getOrCreateEventForumChannel, linkEventToForumChannel } from '../../../utils/eventForumService';

/**
 * Composant de liaison entre un Événement et son Salon officiel dans le Porte-Voix.
 * Permet d'afficher, de créer ou de réassigner le salon dédié.
 */
export default function EventForumChannelLink({
  event,
  groupId = null,
  canManage = false,
  onNavigateToView = null
}) {
  const eventId = event?.id;
  const eventTitle = event?.titre || event?.title || 'Événement';
  const effGroupId = groupId || event?.groupId;
  const currentChannelId = event?.forumChannelId;

  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Écoute temps réel des salons du groupe dans forum_channels
  useEffect(() => {
    if (!effGroupId) {
      setChannels([]);
      setLoadingChannels(false);
      return;
    }
    const q = query(collection(db, 'forum_channels'), where('groupId', '==', effGroupId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setChannels(items);
      setLoadingChannels(false);
    }, (err) => {
      console.warn("Erreur écoute forum_channels :", err);
      setLoadingChannels(false);
    });
    return () => unsubscribe();
  }, [effGroupId]);

  // Détection du salon actuellement rattaché
  const activeChannel = useMemo(() => {
    if (currentChannelId) {
      return channels.find((c) => c.id === currentChannelId) || null;
    }
    // Fallback par eventId
    return channels.find((c) => c.eventId === eventId) || null;
  }, [channels, currentChannelId, eventId]);

  // Création automatique du salon dédié
  const handleCreateDedicatedChannel = async () => {
    if (isProcessing || !eventId) return;
    try {
      setIsProcessing(true);
      await getOrCreateEventForumChannel({ eventId, eventTitle, groupId: effGroupId });
      setIsChanging(false);
    } catch (err) {
      console.error("Erreur création salon dédié :", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Association manuelle d'un salon existant
  const handleAssignChannel = async (targetId) => {
    if (isProcessing || !eventId || !targetId) return;
    try {
      setIsProcessing(true);
      await linkEventToForumChannel(eventId, targetId);
      setIsChanging(false);
    } catch (err) {
      console.error("Erreur association salon :", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ouverture du salon dans le Porte-Voix
  const handleOpenChannel = () => {
    if (!onNavigateToView || !activeChannel?.id) return;
    onNavigateToView('forum', { channelId: activeChannel.id });
  };

  return (
    <div className="w-full bg-cordel-bg border-2 border-encre-noire rounded-[8px_10px_7px_9px] p-3 shadow-[2px_2px_0px_0px_#181716] flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Côté gauche : Informations sur le salon associé */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xl shrink-0">💬</span>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-encre-noire uppercase tracking-wider text-[11px]">
              Salon Porte-Voix :
            </span>
            {activeChannel ? (
              <span className="px-2 py-0.5 rounded font-black text-xs border border-encre-noire bg-amber-100/90 text-amber-950 truncate max-w-[220px]">
                {activeChannel.name}
              </span>
            ) : (
              <span className="italic text-stone-600 text-[11px]">
                Aucun salon dédié rattaché
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-500">
            {activeChannel
              ? "Toutes les commissions débattent dans ce salon officiel."
              : "Créez ou associez un salon pour regrouper les débats des commissions."}
          </span>
        </div>
      </div>

      {/* Côté droit : Actions (Ouvrir / Créer / Réassigner) */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {activeChannel && onNavigateToView && (
          <button
            type="button"
            onClick={handleOpenChannel}
            className="px-2.5 py-1 font-black text-[11px] rounded border border-encre-noire bg-white hover:bg-stone-100 cursor-pointer shadow-xs active:translate-y-0.5 flex items-center gap-1"
            title="Consulter le salon sur le Porte-Voix"
          >
            <span>👁️</span>
            <span>Ouvrir le salon</span>
          </button>
        )}

        {canManage && (
          <>
            {!activeChannel && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCreateDedicatedChannel}
                className="px-3 py-1 font-black text-[11px] rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 cursor-pointer shadow-xs active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50"
              >
                <span>⚡</span>
                <span>Créer le salon dédié</span>
              </button>
            )}

            {isChanging ? (
              <div className="flex items-center gap-1">
                <select
                  disabled={loadingChannels || isProcessing}
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="px-2 py-1 text-[11px] font-bold rounded border border-encre-noire bg-white"
                >
                  <option value="">Sélectionner un salon...</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedChannelId || isProcessing}
                  onClick={() => handleAssignChannel(selectedChannelId)}
                  className="px-2 py-1 text-[11px] font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setIsChanging(false)}
                  className="px-2 py-1 text-[11px] font-black rounded border border-encre-noire bg-stone-200 hover:bg-stone-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsChanging(true)}
                className="px-2 py-1 font-bold text-[10px] rounded border border-encre-noire/40 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                title="Associer un autre salon existant"
              >
                ⚙️ {activeChannel ? 'Changer' : 'Associer existant'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
