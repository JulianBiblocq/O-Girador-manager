import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';

/**
 * Tableau de bord compact des résultats du membre aux défis Roda Quiz
 * Données lues en temps réel depuis 'users/{userId}/parcours/{groupId}.gameStats'
 * Conforme à la règle anti-monolithe (< 200 lignes) et à la charte Cordel
 */
export default function RodaQuizStatsBanner({ profileData }) {
  const { t } = useTranslation();
  const userId = profileData?.uid || profileData?.id;
  const groupId = profileData?.groupId;

  const [stats, setStats] = useState({ played: 0, wins: 0, podiums: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !groupId) {
      setLoading(false);
      return;
    }

    const parcoursRef = doc(db, 'users', userId, 'parcours', groupId || 'default');
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
      console.warn('[RodaQuizStatsBanner] Erreur de lecture des stats :', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, groupId]);

  const played = stats.played;
  const wins = stats.wins;
  const podiumPct = played > 0 ? Math.round((stats.podiums / played) * 100) : 0;

  return (
    <div className="w-full p-3 px-4 bg-[#fdfaf2] border-2 border-encre-noire rounded-[8px_12px_6px_10px] shadow-[2px_3px_0px_0px_#181716] flex flex-col md:flex-row md:items-center justify-between gap-3 text-encre-noire select-none">
      {/* Titre sobre Cordel */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xl">🏆</span>
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
          {t('pedagogyQuiz.rodaQuizStatsTitle') || t('pedagogy.progress.resultatsRodaQuizDefis')}
        </h3>
      </div>

      {/* Contenu : 3 compteurs horizontaux ou message bienveillant d'état vide */}
      {loading ? (
        <span className="text-xs font-bold text-cordel-master-dark/60 italic animate-pulse">{t('pedagogy.progress.chargementDeTesResultats')}</span>
      ) : played === 0 ? (
        <p className="text-xs font-bold text-cordel-master-dark/80 italic">
          {t('pedagogyQuiz.rodaQuizNoGamesYet') || t('pedagogy.progress.aucunePartieDisputeePourL')}
        </p>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Parties jouées */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-encre-noire/40 rounded-[5px_7px_5px_6px] shadow-2xs">
            <span className="text-xs">🎮</span>
            <span className="text-xs font-bold text-cordel-master-dark/80">
              {t('pedagogyQuiz.rodaQuizGamesPlayed') || t('pedagogy.progress.partiesJouees')} :
            </span>
            <span className="text-xs font-black text-encre-noire">{played}</span>
          </div>

          {/* Victoires */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-encre-noire/40 rounded-[5px_7px_5px_6px] shadow-2xs">
            <span className="text-xs">🥇</span>
            <span className="text-xs font-bold text-cordel-master-dark/80">
              {t('pedagogyQuiz.rodaQuizWins') || t('pedagogy.progress.victoires')} :
            </span>
            <span className="text-xs font-black text-[var(--color-cordel-vert)]">{wins}</span>
          </div>

          {/* Présence sur le podium */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-encre-noire/40 rounded-[5px_7px_5px_6px] shadow-2xs">
            <span className="text-xs">⚡</span>
            <span className="text-xs font-bold text-cordel-master-dark/80">
              {t('pedagogyQuiz.rodaQuizPodiumPresence') || t('pedagogy.progress.presenceSurLePodium')} :
            </span>
            <span className="text-xs font-black text-[var(--color-cordel-ocre)]">{podiumPct} %</span>
          </div>
        </div>
      )}
    </div>
  );
}
