// Suivi synthétique de Danse branché exclusivement sur les données réelles
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';
import DanseItemRow from './DanseItemRow';
import { useTranslation } from '../LanguageContext';

export default function DanseChoregraphieAnalytics({
  danseUsers = [],
  repertoire = [],
  steps = [],
  choreographies = [],
  evaluationsMap = {},
  revisionsCountMap = {},
  onProgramDirect = null,
  onPinNote = null
}) {
  const { t } = useTranslation();
  // Consolidation stricte des seuls éléments réels de danse (Répertoire, Dançador, Pas)
  const realDanseItems = useMemo(() => {
    const items = [];

    // 1. Morceaux de la saison comportant un volet danse
    (repertoire || []).forEach((p) => {
      const hasDanceField = Boolean(
        p.hasDanse ||
        p.inclutDanse ||
        p.danse ||
        (p.discipline && p.discipline.toLowerCase().includes('danse')) ||
        (p.category && p.category.toLowerCase().includes('danse')) ||
        (p.niveauDanseRequis && p.niveauDanseRequis !== 'aucun' && p.niveauDanseRequis !== 'none')
      );
      const hasDanceEval = (danseUsers || []).some(
        (u) => Boolean(evaluationsMap[u.id]?.[`danse_${p.id}`] || evaluationsMap[u.id]?.[p.id])
      );

      if (hasDanceField || hasDanceEval) {
        items.push({
          id: p.id,
          evalKey: `danse_${p.id}`,
          titre: p.titre || 'Morceau avec Danse',
          subtitle: p.rythme ? `Rythme : ${p.rythme}` : 'Morceau de saison',
          tag: 'Morceau Répertoire',
          figures: Array.isArray(p.figuresDanse) ? p.figuresDanse : []
        });
      }
    });

    // 2. Chorégraphies publiées de Dançador
    (choreographies || []).forEach((c) => {
      items.push({
        id: c.id,
        evalKey: `danse_${c.id}`,
        titre: c.titre || c.nom || 'Chorégraphie',
        subtitle: c.description || 'Chorégraphie Dançador',
        tag: 'Dançador',
        figures: Array.isArray(c.steps) ? c.steps.map((s) => s.nom || s.name || s.id || 'Pas') : []
      });
    });

    // 3. Pas de danse individuels de Dançador
    (steps || []).forEach((s) => {
      items.push({
        id: s.id,
        evalKey: `danse_${s.id}`,
        titre: s.nom || s.name || 'Pas de danse',
        subtitle: s.famille ? `Famille : ${s.famille}` : 'Pas individuel',
        tag: 'Pas Dançador',
        figures: []
      });
    });

    return items;
  }, [repertoire, choreographies, steps, danseUsers, evaluationsMap]);

  // Calcul du score d'aisance réel de la troupe pour chaque élément
  const itemsWithScores = useMemo(() => {
    return realDanseItems.map((item) => {
      let total = 0;
      let evaluatedCount = 0;

      danseUsers.forEach((u) => {
        const uEvals = evaluationsMap[u.id] || {};
        const userEval = uEvals[item.evalKey] || uEvals[item.id];
        if (userEval) {
          evaluatedCount++;
          if (userEval === 'referent') total += 100;
          else if (userEval === 'alaise' || userEval === 'oui') total += 80;
          else if (userEval === 'pratique') total += 55;
          else if (userEval === 'decouverte') total += 30;
        }
      });

      const score = evaluatedCount > 0 ? Math.round(total / evaluatedCount) : null;
      return { ...item, score, evaluatedCount };
    });
  }, [realDanseItems, danseUsers, evaluationsMap]);

  // État vide sobre si aucun élément réel de danse n'est encore configuré
  if (itemsWithScores.length === 0) {
    return (
      <CordelCard variant="default" className="p-8 text-center bg-[#fdfaf2] border-2 border-dashed border-encre-noire/30 rounded-xl shadow-xs">
        <span className="text-3xl block mb-2">💃</span>
        <p className="text-sm font-black uppercase text-encre-noire mb-1">{t('pedagogy.emptyDanseTitle')}</p>
        <p className="text-xs font-bold text-encre-noire/70 max-w-md mx-auto">{t('pedagogy.emptyDanseDesc')}</p>
      </CordelCard>
    );
  }

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
      {/* En-tête */}
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire flex items-center gap-2">
            <span>💃</span>
            <span>{t('pedagogy.progress.choregraphiesElementsDeDanse')}{itemsWithScores.length})</span>
          </h3>
          <p className="text-[10.5px] font-bold text-encre-noire/70 mt-0.5">{t('pedagogy.progress.suiviDesPasEtMorceaux')}</p>
        </div>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-encre-noire/10 text-encre-noire">
          {danseUsers.length} {t('pedagogy.progress.adherent')}{danseUsers.length > 1 ? 's' : ''} Danse
        </span>
      </div>

      {/* Trombinoscope condensé */}
      {danseUsers.length > 0 && (
        <div className="p-2.5 bg-white/80 border border-dashed border-encre-noire/20 rounded flex flex-wrap gap-2 items-center">
          <span className="text-[9.5px] font-black uppercase text-cordel-wood tracking-wider mr-1">{t('pedagogy.progress.effectif')}</span>
          {danseUsers.map((u) => {
            const name = `${u.prenom || ''} ${u.nom || ''}`.trim() || 'Danseur';
            return (
              <div key={u.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#fdfaf2] border border-encre-noire/20 text-xs font-bold">
                <XiloAvatar src={u.photoURL} name={name} size={18} />
                <span className="text-encre-noire font-extrabold text-[11px]">{name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tableau des éléments réels de danse */}
      <div className="w-full overflow-x-auto bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30 rounded-xl p-2 shadow-xs">
        <table className="w-full text-left text-xs min-w-[550px]">
          <thead>
            <tr className="border-b-2 border-encre-noire/20">
              <th className="p-2 font-black uppercase tracking-widest text-cordel-wood">{t('pedagogy.progress.elementDeDanse')}</th>
              <th className="p-2 font-black uppercase tracking-widest text-center text-encre-noire/60">{t('pedagogy.progress.aisanceReelle')}</th>
              <th className="p-2 font-black uppercase tracking-widest text-right text-encre-noire/60">{t('pedagogy.progress.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithScores.map((item) => (
              <DanseItemRow
                key={item.id}
                item={item}
                revCount={revisionsCountMap[item.evalKey] || revisionsCountMap[item.id] || 0}
                onProgramDirect={onProgramDirect}
                onPinNote={onPinNote}
              />
            ))}
          </tbody>
        </table>
      </div>
    </CordelCard>
  );
}
