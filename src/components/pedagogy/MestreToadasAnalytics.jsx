import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { calculateToadaScore, getProgressColor } from '../../utils/toadaProgressEngine';
import { aggregateToadaVocalMetrics } from '../../utils/aisanceAutoSync';
import { useTranslation } from '../LanguageContext';

/**
 * Vue analytique Chants & Toadas côté Mestre avec agrégation vocale (< 135 lignes).
 * Agrège piecesProgress[pieceId].vocalStage pour Coro, Chanter en jouant/dansant et Puxadores.
 */
export default function MestreToadasAnalytics({
  profileData, allSongs = [], repertoire = [], usersData = [],
  evaluationsMap = {}, piecesProgressMap = null, revisionsCountMap = {}, onPinNote = null
}) {
  const { t } = useTranslation();
  const [localProgressMap, setLocalProgressMap] = useState({});

  useEffect(() => {
    if (piecesProgressMap || !profileData?.groupId || !usersData?.length) return;
    let isMounted = true;
    Promise.all(
      usersData.map(async (u) => {
        try {
          const snap = await getDoc(doc(db, 'users', u.id, 'parcours', profileData.groupId));
          return [u.id, snap.exists() ? snap.data().piecesProgress || {} : {}];
        } catch { return [u.id, {}]; }
      })
    ).then((entries) => { if (isMounted) setLocalProgressMap(Object.fromEntries(entries)); });
    return () => { isMounted = false; };
  }, [profileData?.groupId, usersData, piecesProgressMap]);

  const effectiveProgressMap = piecesProgressMap || localProgressMap;

  const analyticsData = useMemo(() => {
    return (allSongs || []).filter((s) => !s.isArchived).map((song) => {
      let totalScore = 0;
      let count = 0;
      (usersData || []).forEach((u) => {
        const sessions = (u.quizHistory || []).filter((e) => e.toadaId === song.id);
        if (sessions.length > 0) {
          totalScore += calculateToadaScore(song.id, u.quizHistory || []).score;
          count++;
        } else {
          const ev = evaluationsMap?.[u.id]?.[song.id] || effectiveProgressMap?.[u.id]?.[song.id]?.confort;
          if (ev) {
            count++;
            totalScore += ev === 'referent' ? 100 : ev === 'alaise' || ev === 'oui' ? 75 : ev === 'pratique' ? 50 : 25;
          }
        }
      });
      const globalScore = count > 0 ? Math.round(totalScore / count) : 0;
      const vocal = aggregateToadaVocalMetrics(song, usersData, effectiveProgressMap, repertoire);
      return { songId: song.id, titre: song.titre, globalScore, vocal };
    });
  }, [allSongs, usersData, evaluationsMap, effectiveProgressMap, repertoire]);

  const topToRevise = useMemo(
    () => [...analyticsData].sort((a, b) => ((revisionsCountMap[b.songId] || 0) * 30 + (100 - b.globalScore)) - ((revisionsCountMap[a.songId] || 0) * 30 + (100 - a.globalScore))).slice(0, 3),
    [analyticsData, revisionsCountMap]
  );

  return (
    <div className="flex flex-col gap-5 w-full py-2 select-none text-left">
      {topToRevise.length > 0 && (
        <CordelCard className="p-3.5 border-l-4 border-l-cordel-rouge bg-[#fdfaf2]">
          <h3 className="text-xs font-black uppercase tracking-widest text-cordel-rouge mb-2">{t('pedagogy.suggestedForNextRehearsal')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topToRevise.map((toada, i) => (
              <div key={toada.songId} className="bg-white p-2.5 rounded border border-encre-noire/15 flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[9px] font-black uppercase text-cordel-rouge">{t('pedagogy.progress.priorite')}{i + 1} • {toada.globalScore}%</span>
                  <span className="font-bold text-xs text-encre-noire">{toada.titre}</span>
                </div>
                {onPinNote && <button type="button" onClick={() => onPinNote(toada.titre, 'Chant & Toada', revisionsCountMap[toada.songId] || 0)} className="text-[9px] font-black uppercase px-2 py-1 bg-stone-50 border border-encre-noire/25 rounded cursor-pointer">{t('pedagogy.btnPinToNotepad')}</button>}
              </div>
            ))}
          </div>
        </CordelCard>
      )}
      <div className="w-full overflow-x-auto bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30 rounded-xl p-3">
        <table className="w-full text-left text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-encre-noire/20 text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              <th className="p-2">{t('pedagogy.progress.toada')}</th>
              <th className="p-2 text-center">{t('pedagogy.progress.global')}</th>
              <th className="p-2 text-center">🗣️ {t('pedagogy.vocal.colCoro')}</th>
              <th className="p-2 text-center">🥁🗣️ {t('pedagogy.vocal.colSimultane')}</th>
              <th className="p-2">👑🎙️ {t('pedagogy.vocal.colPuxadores')}</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.map((row) => (
              <tr key={row.songId} className="border-b border-encre-noire/10 hover:bg-white/60">
                <td className="p-2 font-bold text-encre-noire">{row.titre}</td>
                <td className="p-2 text-center font-black"><span className="px-2 py-0.5 rounded" style={{ backgroundColor: getProgressColor(row.globalScore) + '20', color: getProgressColor(row.globalScore) }}>{row.globalScore}%</span></td>
                <td className="p-2 text-center font-extrabold text-encre-noire">{row.vocal.coroCount}</td>
                <td className="p-2 text-center font-extrabold text-[var(--color-cordel-vert)]">{row.vocal.simultaneCount}</td>
                <td className="p-2 text-[11px] font-bold text-cordel-wood">{row.vocal.puxadores.length > 0 ? row.vocal.puxadores.join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
