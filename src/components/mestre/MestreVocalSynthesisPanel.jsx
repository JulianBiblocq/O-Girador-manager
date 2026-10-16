import React, { useMemo } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';
import VocalKeyboardBar from './vocal/VocalKeyboardBar';
import VocalCollectiveBanner from './vocal/VocalCollectiveBanner';
import { getEcosystemUrl } from '../../constants/ecosystemUrls';
import { launchCrossApp } from '../../utils/crossAppAuth';
import {
  getMemberVocalProfile,
  computeChoirOverlap,
  computeTessitureBreakdown,
} from '../../utils/vocalAmbitusUtils';

export default function MestreVocalSynthesisPanel({ members = [] }) {
  const { t } = useTranslation();

  const handleOpenVocalLab = () => {
    launchCrossApp(getEcosystemUrl('vocalLab'), { appLabel: "l'Atelier Vocal" });
  };

  const evaluatedMembers = useMemo(() => {
    return members
      .map((m) => ({ ...m, vocalData: getMemberVocalProfile(m) }))
      .filter((m) => Boolean(m.vocalData))
      .sort((a, b) => (b.vocalData.highestMidi || 0) - (a.vocalData.highestMidi || 0));
  }, [members]);

  const overlap = useMemo(() => computeChoirOverlap(evaluatedMembers), [evaluatedMembers]);
  const breakdown = useMemo(() => computeTessitureBreakdown(evaluatedMembers), [evaluatedMembers]);

  if (evaluatedMembers.length === 0) {
    return (
      <CordelCard variant="default" className="p-8 text-center flex flex-col items-center gap-3">
        <span className="text-3xl">🎤</span>
        <h4 className="font-black text-sm uppercase text-cordel-wood">
          {t('mestre.casting.noVocalProfilesYet')}
        </h4>
        <p className="text-xs text-cordel-master-dark/70 max-w-md">
          {t('mestre.casting.noVocalProfilesNotice')}
        </p>
        <button
          type="button"
          onClick={handleOpenVocalLab}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded bg-cordel-vert text-white border border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-vert/90 cursor-pointer"
        >
          <span>🎙️</span>
          <span>{t('mestre.casting.openVocalLab') || "Ouvrir l'Atelier Vocal"}</span>
        </button>
      </CordelCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* 0. En-tête et Passerelle directe Atelier Vocal */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-cordel-master-dark/15">
        <span className="text-[11px] font-black uppercase tracking-wider text-cordel-master-dark">
          {t('mestre.casting.vocalSynthesisTitle') || "Synthèse Vocale & Ambitus"}
        </span>
        <button
          type="button"
          onClick={handleOpenVocalLab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded bg-cordel-vert text-white border border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-vert/90 cursor-pointer"
        >
          <span>🎙️</span>
          <span>{t('mestre.casting.openVocalLab') || "Ouvrir l'Atelier Vocal"}</span>
        </button>
      </div>

      {/* 1. Synthèse Collective du Groupe */}
      <VocalCollectiveBanner overlap={overlap} breakdown={breakdown} />

      {/* 2. Tableau Individuel Confidentiel */}
      <CordelCard variant="default" className="flex flex-col gap-3 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-cordel-master-dark/20 text-[10px] uppercase font-black text-cordel-master-dark/70">
              <th className="py-2 px-2">{t('mestre.casting.thMember')}</th>
              <th className="py-2 px-2">{t('mestre.casting.thAmbitusPower')}</th>
              <th className="py-2 px-2 text-center">{t('mestre.casting.thComfortCenter')}</th>
              <th className="py-2 px-2 text-center">{t('mestre.casting.thStairsAccuracy')}</th>
              <th className="py-2 px-2 min-w-[220px]">{t('mestre.casting.thKeyboardPosition')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cordel-master-dark/10">
            {evaluatedMembers.map((m) => {
              const vd = m.vocalData;
              const isPuxador = vd.targetRole === 'Puxador';
              return (
                <tr key={m.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <XiloAvatar user={m} size={28} />
                      <div className="min-w-0">
                        <span className="font-extrabold text-cordel-master-dark block truncate">{m.prenom} {m.nom}</span>
                        {vd.targetRole && (
                          <span className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded-xs ${
                            isPuxador ? 'bg-orange-500 text-white' : 'bg-teal-700 text-white'
                          }`}>{isPuxador ? t('mestre.casting.badgePuxador') : t('mestre.casting.badgeCoro')}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-bold text-cordel-master-dark">{vd.lowestSolidNote} ➔ {vd.highestSolidNote}</div>
                    <span className="text-[9px] text-cordel-master-dark/60 font-semibold">
                      {t('mestre.casting.semitonesCount', { count: vd.rangeSemitones })} • {vd.tessiture}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 font-black text-cordel-wood border border-amber-300 dark:border-amber-700">{vd.comfortCenterNote}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-cordel-master-dark">
                    {vd.stairsAccuracyPct !== null ? `${vd.stairsAccuracyPct}%` : '—'}
                  </td>
                  <td className="py-2 px-2">
                    <VocalKeyboardBar
                      lowestMidi={vd.lowestMidi}
                      highestMidi={vd.highestMidi}
                      centerMidi={vd.centerMidi}
                      lowestNote={vd.lowestSolidNote}
                      highestNote={vd.highestSolidNote}
                      centerNote={vd.comfortCenterNote}
                      role={vd.targetRole}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CordelCard>
    </div>
  );
}
