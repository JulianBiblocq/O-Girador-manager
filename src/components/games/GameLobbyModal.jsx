import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import GamePlayerList from './GamePlayerList';
import GameLobbyFooter from './GameLobbyFooter';
import GameLobbyStatusOverlay from './GameLobbyStatusOverlay';
import GameArenaView from './GameArenaView';
import CadavreExquisArena from './cadavre/CadavreExquisArena';
import GamePodiumView from './GamePodiumView';
import { formatThemeTitle, formatThemeIcon } from '../../utils/gameUtils';

/**
 * Modale de la Salle d'Attente (Lobby), de l'Arène (Quiz ou Cadavre Exquis) et du Podium.
 */
export default function GameLobbyModal({
  roomId, profileData, onClose, onLaunchRoom, onAdvanceReveal, onNextQuestion,
  onFinishGame, onSubmitAnswer, onRestartLobby, repertoireList = [], varalList = [],
  onSubmitChainStep, onSubmitCouncilVote, onEvaluateRoundResult, onAdvanceToNextRound
}) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  const currentUserId = profileData?.uid || profileData?.id;
  const isHost = roomData?.hostUid === currentUserId;
  const isHostRef = useRef(isHost);
  const statusRef = useRef(roomData?.status);

  useEffect(() => {
    isHostRef.current = isHost;
    statusRef.current = roomData?.status;
  }, [isHost, roomData?.status]);

  useEffect(() => {
    if (!roomId) return;
    return onSnapshot(doc(db, 'game_rooms', roomId), (snap) => {
      setLoading(false);
      setRoomData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, () => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (isHostRef.current && statusRef.current === 'lobby' && roomId) {
        updateDoc(doc(db, 'game_rooms', roomId), { status: 'cancelled' }).catch(() => {});
      }
    };
  }, [roomId]);

  const handleCancelRoom = async () => {
    if (!roomId || actionInProgress) return;
    setActionInProgress(true);
    try { await updateDoc(doc(db, 'game_rooms', roomId), { status: 'cancelled' }); onClose(); }
    finally { setActionInProgress(false); }
  };

  const handleLaunchGame = async () => {
    if (!roomId || actionInProgress) return;
    setActionInProgress(true);
    try {
      if (onLaunchRoom) await onLaunchRoom(roomId, roomData?.theme || 'rythme');
      else await updateDoc(doc(db, 'game_rooms', roomId), { status: 'playing' });
    } finally { setActionInProgress(false); }
  };

  const handleLeaveTable = async () => {
    if (!roomId || !currentUserId || actionInProgress) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'game_rooms', roomId), { [`players.${currentUserId}`]: deleteField() });
      onClose();
    } finally { setActionInProgress(false); }
  };

  const players = roomData?.players || {};
  const playerCount = Object.keys(players).length;
  const maxPlayers = roomData?.maxPlayers || 4;
  const canLaunch = playerCount >= 2;
  const hostFirstName = roomData?.hostName?.split(' ')?.[0] || 'l\'hôte';
  const themeTitle = formatThemeTitle(roomData?.theme);
  const themeIcon = formatThemeIcon(roomData?.theme);

  if (roomData?.status === 'cancelled') {
    return <GameLobbyStatusOverlay status="cancelled" themeTitle={themeTitle} playerCount={playerCount} onClose={onClose} />;
  }

  // Vue 2 : Arène de jeu (Aiguillage Roda Quiz vs Cadavre Exquis)
  if (roomData?.status === 'playing') {
    if (roomData?.theme === 'cadavre_exquis') {
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs select-none animate-fade-in">
          <div className="relative w-full max-w-xl z-10 max-h-[95vh] overflow-y-auto">
            <CadavreExquisArena
              roomData={roomData}
              currentUserId={currentUserId}
              repertoireList={repertoireList}
              varalList={varalList}
              onSubmitChainStep={onSubmitChainStep}
              onSubmitCouncilVote={onSubmitCouncilVote}
              onEvaluateRoundResult={onEvaluateRoundResult}
              onAdvanceToNextRound={onAdvanceToNextRound}
              onFinishGame={onFinishGame}
            />
          </div>
        </div>
      );
    }

    return (
      <GameArenaView
        roomData={roomData} currentUserId={currentUserId} isHost={isHost}
        onAdvanceReveal={onAdvanceReveal} onNextQuestion={onNextQuestion}
        onFinishGame={onFinishGame} onSubmitAnswer={onSubmitAnswer} onLeave={onClose}
      />
    );
  }

  if (roomData?.status === 'finished') {
    return (
      <GamePodiumView
        roomData={roomData} currentUserId={currentUserId} isHost={isHost}
        profileData={profileData} onClose={onClose}
        onRestartLobby={() => onRestartLobby && onRestartLobby(roomId)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
      <div className="fixed inset-0" onClick={isHost ? undefined : onClose} />
      <div className="relative w-full max-w-lg z-10">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-left">
          <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-cordel-master-dark/25">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{themeIcon}</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-encre-noire">
                  {themeTitle} ({playerCount}/{maxPlayers} joueurs)
                </h3>
                <span className="text-[9.5px] font-bold text-[var(--color-cordel-vert)] uppercase">● Salon ouvert</span>
              </div>
            </div>
            <button
              type="button" onClick={onClose} disabled={actionInProgress}
              className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center text-xs font-black border border-encre-noire rounded hover:bg-neutral-200 cursor-pointer"
            >✕</button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-cordel-master-dark/60">Connexion au salon d'attente…</div>
          ) : (
            <GamePlayerList players={players} maxPlayers={maxPlayers} currentUserId={currentUserId} />
          )}

          {!isHost && (
            <div className="p-2.5 rounded bg-[var(--color-cordel-ocre)]/10 border border-[var(--color-cordel-ocre)]/40 text-center mb-4">
              <p className="text-[11px] font-extrabold text-[var(--color-cordel-ocre)]">
                ⏳ En attente du départ par {hostFirstName}…
              </p>
            </div>
          )}

          <GameLobbyFooter
            isHost={isHost} canLaunch={canLaunch} actionInProgress={actionInProgress}
            onCancel={handleCancelRoom} onLaunch={handleLaunchGame} onLeave={handleLeaveTable}
          />
        </CordelCard>
      </div>
    </div>
  );
}
