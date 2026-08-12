import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { calculateToadaScore, getProgressColor } from '../../utils/toadaProgressEngine';

export default function MestreToadasAnalytics({ profileData, allSongs = [] }) {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [pupitresList, setPupitresList] = useState([]);
  const [topToRevise, setTopToRevise] = useState([]);

  useEffect(() => {
    const fetchAndAggregate = async () => {
      if (!profileData?.groupId) return;
      setLoading(true);
      try {
        const usersQ = query(collection(db, 'users'), where('groupId', '==', profileData.groupId));
        const usersSnap = await getDocs(usersQ);
        
        const usersList = [];
        usersSnap.forEach(d => {
          usersList.push({ id: d.id, ...d.data() });
        });

        // Pupitres uniques
        const pupitres = [...new Set(usersList.map(u => u.instrument).filter(Boolean))];
        setPupitresList(pupitres);

        const activeSongs = allSongs.filter(s => !s.isArchived);
        const matrix = [];
        
        activeSongs.forEach(song => {
          const rowData = {
            songId: song.id,
            titre: song.titre,
            pupitresScore: {},
            globalScore: 0
          };

          let totalSongScore = 0;
          let usersWithScoreForSong = 0;

          pupitres.forEach(pupitre => {
            const usersInPupitre = usersList.filter(u => u.instrument === pupitre);
            if (usersInPupitre.length === 0) {
              rowData.pupitresScore[pupitre] = null;
              return;
            }

            let pupitreScoreSum = 0;
            usersInPupitre.forEach(u => {
              const { score } = calculateToadaScore(song.id, u.quizHistory || []);
              pupitreScoreSum += score;
            });
            
            const pupitreAverage = Math.round(pupitreScoreSum / usersInPupitre.length);
            rowData.pupitresScore[pupitre] = pupitreAverage;
            
            totalSongScore += pupitreScoreSum;
            usersWithScoreForSong += usersInPupitre.length;
          });

          rowData.globalScore = usersWithScoreForSong > 0 ? Math.round(totalSongScore / usersWithScoreForSong) : 0;
          matrix.push(rowData);
        });

        setAnalyticsData(matrix);

        // Top 3 à réviser
        const sortedByLowest = [...matrix].sort((a, b) => a.globalScore - b.globalScore);
        setTopToRevise(sortedByLowest.slice(0, 3));

      } catch (e) {
        console.error("Erreur Analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAndAggregate();
  }, [profileData?.groupId, allSongs]);

  if (loading) return <div className="p-8 text-center text-xs font-bold animate-pulse">Calcul de la matrice Nação...</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 select-none">
      <div className="flex flex-col gap-2 border-b-2 border-dashed border-cordel-master-dark/30 pb-4">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>📊</span> Analyse du Répertoire (Toadas)
        </h2>
        <p className="text-xs text-cordel-master-dark opacity-80 leading-relaxed">
          Vue consolidée des scores d'auto-évaluation de vos élèves, triée par pupitre. 
          Les scores sont pondérés par la difficulté (Facile = max 33%, Moyen = max 66%, Expert = max 100%).
        </p>
      </div>

      {topToRevise.length > 0 && (
        <CordelCard variant="default" className="p-4 border-l-4 border-l-cordel-rouge">
          <h3 className="text-sm font-black uppercase tracking-widest text-cordel-rouge mb-2">
            ⚠️ Suggéré pour la prochaine répétition
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topToRevise.map((t, i) => (
              <div key={t.songId} className="bg-cordel-rouge/5 p-3 rounded border border-cordel-rouge/20">
                <span className="block text-[10px] font-black uppercase text-cordel-rouge/70 mb-1">Priorité #{i + 1}</span>
                <span className="font-bold text-sm text-encre-noire">{t.titre}</span>
                <span className="block text-[10px] text-encre-noire/50 mt-1">Score global : {t.globalScore}%</span>
              </div>
            ))}
          </div>
        </CordelCard>
      )}

      <div className="w-full overflow-x-auto bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30 rounded-xl p-4">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 border-b border-encre-noire/20 font-black uppercase tracking-widest text-cordel-wood">Toada</th>
              <th className="p-2 border-b border-encre-noire/20 font-black uppercase tracking-widest text-center text-encre-noire/50">Global</th>
              {pupitresList.map(p => (
                <th key={p} className="p-2 border-b border-encre-noire/20 font-bold uppercase text-center">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analyticsData.map(row => (
              <tr key={row.songId} className="hover:bg-neutral-100/50 transition-colors">
                <td className="p-2 border-b border-encre-noire/10 font-bold text-encre-noire">
                  {row.titre}
                </td>
                <td className="p-2 border-b border-encre-noire/10 text-center font-black">
                  <div className="inline-block px-2 py-1 rounded" style={{ backgroundColor: getProgressColor(row.globalScore) + '20', color: getProgressColor(row.globalScore) }}>
                    {row.globalScore}%
                  </div>
                </td>
                {pupitresList.map(p => {
                  const score = row.pupitresScore[p];
                  if (score === null) return <td key={p} className="p-2 border-b border-encre-noire/10 text-center text-encre-noire/20">-</td>;
                  
                  // Heatmap color
                  let bgColor = 'bg-[#fdfaf2]';
                  let textColor = 'text-encre-noire';
                  if (score > 75) { bgColor = 'bg-[#2d6a4f]'; textColor = 'text-white'; }
                  else if (score >= 50) { bgColor = 'bg-cordel-ocre'; textColor = 'text-white'; }
                  else { bgColor = 'bg-cordel-rouge'; textColor = 'text-white'; }
                  
                  return (
                    <td key={p} className="p-2 border-b border-encre-noire/10 text-center">
                      <div className={`inline-block px-2 py-1 rounded font-bold ${bgColor} ${textColor} text-[10px]`}>
                        {score}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
