import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { calculateToadaScore, getProgressColor } from '../../utils/toadaProgressEngine';
import { normalizePupitreName } from '../../utils/secretariatMetrics';

export default function MestreToadasAnalytics({ 
  profileData, 
  allSongs = [], 
  usersData = null, 
  evaluationsMap = null,
  revisionsCountMap = {},
  onPinNote = null 
}) {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [pupitresList, setPupitresList] = useState([]);
  const [topToRevise, setTopToRevise] = useState([]);

  useEffect(() => {
    const fetchAndAggregate = async () => {
      if (!profileData?.groupId) return;
      setLoading(true);
      try {
        let usersList = usersData;
        let currentEvals = evaluationsMap;

        // Si non fournis par le parent, chargement de secours
        if (!usersList) {
          const usersQ = query(collection(db, 'users'), where('groupId', '==', profileData.groupId));
          const usersSnap = await getDocs(usersQ);
          usersList = [];
          usersSnap.forEach(d => {
            const uData = d.data();
            const isActif = uData.statutActuel !== 'archived' && uData.statutActuel !== 'inactive' && uData.status !== 'archived' && uData.status !== 'inactive';
            if (isActif) {
              usersList.push({ id: d.id, ...uData });
            }
          });
        }

        if (!currentEvals) {
          currentEvals = {};
          await Promise.all(usersList.map(async (u) => {
            try {
              const docRef = doc(db, 'users', u.id, 'parcours', profileData.groupId);
              const { getDoc } = await import('firebase/firestore');
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                currentEvals[u.id] = snap.data().evaluations || {};
              }
            } catch (e) {
              currentEvals[u.id] = {};
            }
          }));
        }

        // Pupitres uniques déduits des utilisateurs actifs (normalisés)
        const pupitres = [...new Set(
          usersList
            .map(u => normalizePupitreName(u.instrumentPrincipal || u.instrument || u.pupitre))
            .filter(p => Boolean(p) && p !== 'Non défini')
        )];
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
            const usersInPupitre = usersList.filter(u => {
              const declared = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase();
              return declared.includes(pupitre.toLowerCase());
            });

            if (usersInPupitre.length === 0) {
              rowData.pupitresScore[pupitre] = null;
              return;
            }

            let pupitreScoreSum = 0;
            let activePupitreCount = 0;

            usersInPupitre.forEach(u => {
              let score = 0;
              let hasEvaluated = false;

              // 1. Priorité aux résultats QCM réels pour ce chant
              const toadaSessions = (u.quizHistory || []).filter(entry => entry.toadaId === song.id);
              if (toadaSessions.length > 0) {
                const qcmResult = calculateToadaScore(song.id, u.quizHistory || []);
                score = qcmResult.score;
                hasEvaluated = true;
              } else {
                // 2. Repli sur le niveau d'aisance déclaré dans parcours.evaluations[song.id]
                const userEval = currentEvals?.[u.id]?.[song.id];
                if (userEval) {
                  hasEvaluated = true;
                  if (userEval === 'referent') score = 100;
                  else if (userEval === 'alaise' || userEval === 'oui') score = 75;
                  else if (userEval === 'pratique') score = 50;
                  else if (userEval === 'decouverte') score = 25;
                }
              }

              if (hasEvaluated) {
                pupitreScoreSum += score;
                activePupitreCount++;
              }
            });
            
            const pupitreAverage = activePupitreCount > 0 ? Math.round(pupitreScoreSum / activePupitreCount) : null;
            rowData.pupitresScore[pupitre] = pupitreAverage;
            
            if (pupitreAverage !== null) {
              totalSongScore += pupitreScoreSum;
              usersWithScoreForSong += activePupitreCount;
            }
          });

          rowData.globalScore = usersWithScoreForSong > 0 ? Math.round(totalSongScore / usersWithScoreForSong) : 0;
          matrix.push(rowData);
        });

        setAnalyticsData(matrix);

        // Top 3 des morceaux prioritaires pour la répétition (Priorité aux demandes d'élèves, puis score global le plus bas)
        const sortedByUrgency = [...matrix].sort((a, b) => {
          const countA = revisionsCountMap[a.songId] || 0;
          const countB = revisionsCountMap[b.songId] || 0;
          const urgencyA = (countA * 30) + (100 - a.globalScore);
          const urgencyB = (countB * 30) + (100 - b.globalScore);
          return urgencyB - urgencyA;
        });
        setTopToRevise(sortedByUrgency.slice(0, 3));

      } catch (e) {
        console.error("Erreur Analytics Toadas :", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAndAggregate();
  }, [profileData?.groupId, allSongs, usersData, evaluationsMap, revisionsCountMap]);

  if (loading) return <div className="p-8 text-center text-xs font-bold animate-pulse">Calcul de la matrice Nação...</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 select-none">
      <div className="flex flex-col gap-2 border-b-2 border-dashed border-cordel-master-dark/30 pb-4">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>📊</span> Analyse du Répertoire (Toadas)
        </h2>
        <p className="text-xs text-cordel-master-dark opacity-80 leading-relaxed">
          Vue consolidée des scores d'auto-évaluation et des demandes de révision de vos élèves, triée par pupitre. 
          Les scores sont pondérés par la difficulté (Facile = max 33%, Moyen = max 66%, Expert = max 100%).
        </p>
      </div>

      {topToRevise.length > 0 && (
        <CordelCard variant="default" className="p-4 border-l-4 border-l-cordel-rouge">
          <h3 className="text-sm font-black uppercase tracking-widest text-cordel-rouge mb-2">
            ⚠️ Suggéré pour la prochaine répétition
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topToRevise.map((t, i) => {
              const reqCount = revisionsCountMap[t.songId] || 0;
              return (
                <div key={t.songId} className="bg-cordel-rouge/5 p-3 rounded border border-cordel-rouge/20 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] font-black uppercase text-cordel-rouge/70 mb-1">Priorité #{i + 1}</span>
                    <span className="font-bold text-sm text-encre-noire">{t.titre}</span>
                    <span className="block text-[10px] text-encre-noire/50 mt-1">Score global : {t.globalScore}%</span>
                    {reqCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--color-cordel-ocre,#c05621)] mt-1 bg-[var(--color-cordel-ocre,#c05621)]/10 px-1.5 py-0.5 rounded border border-[var(--color-cordel-ocre,#c05621)]/20">
                        <span>🙋</span>
                        <span>{reqCount} demande{reqCount > 1 ? 's' : ''} d'élèves</span>
                      </span>
                    )}
                  </div>
                  {onPinNote && (t.globalScore < 75 || reqCount > 0) && (
                    <button
                      type="button"
                      onClick={() => onPinNote(t.titre, 'Chant & Toada', reqCount)}
                      className="mt-2 text-[9px] font-black uppercase px-2 py-1 bg-white border border-encre-noire/20 rounded hover:bg-neutral-100 hover:scale-105 transition-transform self-start cursor-pointer shadow-xs flex items-center gap-1"
                      title="Épingler dans le Bloc-notes de répétition"
                    >
                      <span>📌</span>
                      <span>Épingler</span>
                    </button>
                  )}
                </div>
              );
            })}
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
                  <div className="flex items-center gap-1.5">
                    <span>{row.titre}</span>
                    {revisionsCountMap[row.songId] > 0 && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30 inline-flex items-center gap-0.5">
                        <span>🙋</span>
                        <span>{revisionsCountMap[row.songId]} demande{revisionsCountMap[row.songId] > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>
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
