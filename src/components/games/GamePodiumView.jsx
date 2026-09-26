import React, { useEffect, useRef, useMemo } from 'react';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { formatThemeTitle } from '../../utils/gameUtils';

const MEDALS = ['🥇', '🥈', '🥉', '🏅'];

function getCoopHarmonyLevel(ratio) {
  if (ratio >= 0.9) return { label: 'Batterie d\'Or', icon: '🥇', desc: 'Axé sublime, synchronisation légendaire !' };
  if (ratio >= 0.7) return { label: 'Batterie d\'Argent', icon: '🥈', desc: 'Grande cohésion, rythme assuré !' };
  if (ratio >= 0.5) return { label: 'Batterie de Bronze', icon: '🥉', desc: 'Bel élan collectif, à peaufiner !' };
  return { label: 'En Apprentissage', icon: '🥁', desc: 'Le souffle commun grandit à chaque répétition !' };
}

/**
 * Vue de Célébration Finale (Podium Roda Quiz ou Harmonie Collective Cadavre Exquis).
 * Persiste les statistiques dans 'users/{uid}/parcours/{groupId}.gameStats'.
 */
export default function GamePodiumView({
  roomData,
  currentUserId,
  isHost,
  profileData,
  onClose,
  onRestartLobby
}) {
  const hasSavedStatsRef = useRef(false);
  const groupId = profileData?.groupId || roomData?.groupId;
  const theme = roomData?.theme;
  const isCoop = theme === 'cadavre_exquis';

  const players = roomData?.players || {};
  const teamScore = Number(roomData?.teamScore) || 0;
  const totalRounds = Number(roomData?.totalRounds) || 1;
  const maxAxé = totalRounds * 1000;
  const coopRatio = maxAxé > 0 ? (teamScore / maxAxé) : 0;
  const harmony = getCoopHarmonyLevel(coopRatio);

  const rankedPlayers = useMemo(() => {
    return Object.entries(players)
      .map(([uid, p]) => ({ uid, ...p, score: Number(p.score) || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [players]);

  // Sauvegarde des statistiques dans Mon Parcours
  useEffect(() => {
    if (hasSavedStatsRef.current || !currentUserId || !groupId) return;
    hasSavedStatsRef.current = true;

    const parcoursRef = doc(db, 'users', currentUserId, 'parcours', groupId);

    if (isCoop) {
      const isCoopWin = coopRatio >= 0.7;
      setDoc(parcoursRef, {
        'gameStats.played': increment(1),
        ...(isCoopWin ? { 'gameStats.coopWins': increment(1) } : {})
      }, { merge: true }).catch(err => console.warn('[Podium] Erreur stats coop :', err));
    } else {
      if (rankedPlayers.length === 0) return;
      const myRankIndex = rankedPlayers.findIndex(p => p.uid === currentUserId);
      const maxScore = rankedPlayers[0]?.score || 0;
      const myScore = rankedPlayers.find(p => p.uid === currentUserId)?.score || 0;
      setDoc(parcoursRef, {
        'gameStats.played': increment(1),
        ...(myScore > 0 && myScore === maxScore ? { 'gameStats.wins': increment(1) } : {}),
        ...(myRankIndex >= 0 && myRankIndex < 3 ? { 'gameStats.podiums': increment(1) } : {})
      }, { merge: true }).catch(err => console.warn('[Podium] Erreur stats quiz :', err));
    }
  }, [currentUserId, groupId, isCoop, coopRatio, rankedPlayers]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-fade-in">
      <div className="relative w-full max-w-md z-10 max-h-[92vh] flex flex-col">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-center flex flex-col overflow-y-auto scrollbar-thin">
          {/* Célébration Collective Coopérative */}
          {isCoop ? (
            <div className="flex flex-col gap-3">
              <span className="text-4xl block animate-bounce">{harmony.icon}</span>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-cordel-wood">
                  {harmony.label}
                </h3>
                <p className="text-xs text-cordel-master-dark/75 font-semibold mt-0.5">
                  {harmony.desc}
                </p>
              </div>

              {/* Jauge d'Axé collective */}
              <div className="p-3 bg-cordel-vert/10 border-2 border-cordel-vert rounded-[6px_9px_7px_8px] text-center my-1">
                <span className="text-[10px] font-mono font-bold text-cordel-master-dark uppercase block">
                  Harmonie de la Troupe
                </span>
                <span className="text-xl font-black font-mono text-cordel-vert block mt-0.5">
                  {teamScore} / {maxAxé} pts d'Axé ({Math.round(coopRatio * 100)}%)
                </span>
                <div className="w-full bg-cordel-vert/20 h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-cordel-vert h-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round(coopRatio * 100))}%` }} />
                </div>
              </div>

              {/* Liste solidaire des camarades */}
              <div className="flex flex-wrap justify-center gap-2 my-1">
                {Object.entries(players).map(([uid, p]) => (
                  <div key={uid} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-cordel-master-dark/30 rounded-full shadow-xs">
                    <span className="text-xs">🥁</span>
                    <span className="text-xs font-bold text-encre-noire">{p.name || 'Camarade'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Podium Compétitif Roda Quiz */
            <div className="flex flex-col gap-2">
              <span className="text-4xl block mb-1">🏆</span>
              <h3 className="text-base font-black uppercase tracking-wider text-cordel-wood">
                Podium {formatThemeTitle(theme)}
              </h3>
              <div className="flex flex-col gap-2 my-2">
                {rankedPlayers.map((player, index) => (
                  <div
                    key={player.uid}
                    className={`p-2.5 rounded-[6px_9px_7px_8px] border-2 flex items-center justify-between ${
                      index === 0 ? 'border-amber-400 bg-amber-50' : player.uid === currentUserId ? 'border-cordel-wood bg-cordel-wood/10' : 'border-encre-noire/30 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MEDALS[index] || '🏅'}</span>
                      <span className="text-xs font-black text-encre-noire truncate max-w-[140px]">{player.name}</span>
                    </div>
                    <span className="font-mono text-xs font-black text-encre-noire">{player.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'actions */}
          <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20 flex gap-2 justify-between">
            <CordelButton variant="ocre" onClick={onClose} className="flex-1 py-1.5 text-xs font-bold uppercase">
              🚪 Quitter
            </CordelButton>
            {isHost && (
              <CordelButton variant="primary" onClick={onRestartLobby} className="flex-1 py-1.5 text-xs font-black uppercase !bg-[var(--color-cordel-vert)] !text-white">
                🔄 Revanche
              </CordelButton>
            )}
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
