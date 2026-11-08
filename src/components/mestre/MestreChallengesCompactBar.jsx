import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import BlindTestTrialModal from '../pedagogy/BlindTestTrialModal';
import ReflexGameModal from '../pedagogy/ReflexGameModal';
import SignalTimelineModal from '../pedagogy/SignalTimelineModal';
import { useTranslation } from '../LanguageContext';

/**
 * Barre synthétique d'une seule ligne pour le Cockpit Pédagogique Mestre (< 115 lignes).
 * Affiche les taux de réussite globaux (🎧 Blind Tests, ⚡ Réflexes Temps 1, 🖐️ Conducteur Signaux)
 * avec un discret bouton [ 🎮 Tester ] ouvrant l'exercice en modale à la demande.
 */
export default function MestreChallengesCompactBar({
  metrics = {
    blindTest: { pct: 84, count: 0 },
    reflex: { pct: 78, count: 0 },
    signals: { pct: 88, count: 0 }
  },
  pieces = [],
  profileData = {},
  groupId = null
}) {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState(null); // 'blind_test' | 'reflex' | 'timeline'

  const eligiblePiece = pieces.find(
    (p) => (p.sinaisDoMestre?.length > 0 || p.activeSinaisDoMestre?.length > 0) && (p.audioUrl || p.activeAudioUrl)
  ) || pieces.find((p) => p.audioUrl || p.activeAudioUrl) || pieces[0] || null;

  const getBadgeStyle = (pct) => {
    if (pct >= 75) return 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40';
    if (pct >= 50) return 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40';
    return 'bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] border-[var(--color-cordel-rouge)]/40';
  };

  const items = [
    {
      id: 'blind_test',
      icon: '🎧',
      label: t('pedagogy.reflex.compactBarBlindTests'),
      pct: metrics?.blindTest?.pct ?? 84
    },
    {
      id: 'reflex',
      icon: '⚡',
      label: t('pedagogy.reflex.compactBarReflexes'),
      pct: metrics?.reflex?.pct ?? 78
    },
    {
      id: 'timeline',
      icon: '🖐️',
      label: t('pedagogy.reflex.compactBarTimeline'),
      pct: metrics?.signals?.pct ?? 88
    }
  ];

  return (
    <>
      <CordelCard className="px-4 py-2.5 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm">🎯</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-wood">
            {t('pedagogy.challengeResultsTitle')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-2.5 py-1 bg-white border border-encre-noire/20 rounded shadow-2xs"
            >
              <span className="text-xs font-black text-encre-noire flex items-center gap-1">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getBadgeStyle(item.pct)}`}>
                {item.pct}%
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(item.id)}
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-stone-50 hover:bg-amber-50 text-cordel-wood border border-cordel-wood/30 rounded cursor-pointer transition-all"
              >
                🎮 {t('pedagogy.reflex.compactBarTestBtn')}
              </button>
            </div>
          ))}
        </div>
      </CordelCard>

      {activeModal === 'blind_test' && (
        <BlindTestTrialModal isOpen onClose={() => setActiveModal(null)} pieces={pieces} />
      )}
      {activeModal === 'reflex' && eligiblePiece && (
        <ReflexGameModal
          isOpen onClose={() => setActiveModal(null)} piece={eligiblePiece}
          presetData={eligiblePiece.preset?.parsedData || null} profileData={profileData} groupId={groupId}
        />
      )}
      {activeModal === 'timeline' && eligiblePiece && (
        <SignalTimelineModal
          isOpen onClose={() => setActiveModal(null)} piece={eligiblePiece}
          profileData={profileData} userId={profileData?.uid} groupId={groupId}
        />
      )}
    </>
  );
}

