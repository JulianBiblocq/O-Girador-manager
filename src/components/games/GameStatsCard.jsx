import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * Encart compact affichant les statistiques de défis multijoueurs (Roda Quiz)
 * Lues depuis 'users/{userId}/parcours/{groupId}.gameStats'
 *
 * @param {string} userId Identifiant de l'adhérent
 * @param {string} groupId Identifiant de l'association
 */
export default function GameStatsCard({ userId, groupId }) {
  const [stats, setStats] = useState({ played: 0, wins: 0, podiums: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !groupId) {
      setLoading(false);
      return;
    }

    const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
    const unsubscribe = onSnapshot(parcoursRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const gs = data?.gameStats || {};
        setStats({
          played: Number(gs.played) || 0,
          wins: Number(gs.wins) || 0,
          podiums: Number(gs.podiums) || 0
        });
      } else {
        setStats({ played: 0, wins: 0, podiums: 0 });
      }
    }, (err) => {
      console.warn('[GameStatsCard] Erreur de lecture des stats de jeu :', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, groupId]);

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-4 bg-cordel-bg-light border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Titre et description */}
        <div className="text-left">
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🏆</span>
            <span>Roda Quiz & Défis en direct</span>
          </h4>
          <p className="text-[10px] font-bold text-cordel-master-dark/75 mt-0.5">
            Vos performances lors des sessions multijoueurs de la troupe.
          </p>
        </div>

        {/* Compteurs statistiques */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Parties jouées */}
          <div className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-encre-noire/40 rounded-[6px_8px_6px_7px] shadow-2xs text-center min-w-[70px]">
            <span className="text-sm block">🎲</span>
            <span className="text-base font-black text-encre-noire leading-none block my-0.5">
              {loading ? '…' : stats.played}
            </span>
            <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
              Jouées
            </span>
          </div>

          {/* Victoires */}
          <div className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-encre-noire/40 rounded-[6px_8px_6px_7px] shadow-2xs text-center min-w-[70px]">
            <span className="text-sm block">🥇</span>
            <span className="text-base font-black text-[var(--color-cordel-vert)] leading-none block my-0.5">
              {loading ? '…' : stats.wins}
            </span>
            <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
              Victoires
            </span>
          </div>

          {/* Podiums */}
          <div className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-encre-noire/40 rounded-[6px_8px_6px_7px] shadow-2xs text-center min-w-[70px]">
            <span className="text-sm block">🎖️</span>
            <span className="text-base font-black text-[var(--color-cordel-ocre)] leading-none block my-0.5">
              {loading ? '…' : stats.podiums}
            </span>
            <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
              Podiums
            </span>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
