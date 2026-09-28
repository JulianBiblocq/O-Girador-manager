// Encart compact des résultats aux défis de la troupe avec déclencheur de modales
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import BlindTestTrialModal from './BlindTestTrialModal';
import SignauxTrialModal from './SignauxTrialModal';
import ReflexGameModal from './ReflexGameModal';

export default function DefisSummaryCard({
  metrics = {
    blindTest: { pct: 84, count: 0 },
    reflex: { pct: 78, count: 0 },
    signals: { pct: 88, count: 0 }
  },
  pieces = [],
  profileData = {},
  groupId = null
}) {
  const [activeModal, setActiveModal] = useState(null); // 'blind_test' | 'reflex' | 'signaux'

  // Sélection du premier morceau éligible pour le défi réflexe
  const eligibleReflexPiece = pieces.find((p) => p.audioUrl || p.activeAudioUrl) || pieces[0] || null;

  const getBadgeStyle = (pct) => {
    if (pct >= 75) return 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40';
    if (pct >= 50) return 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40';
    return 'bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] border-[var(--color-cordel-rouge)]/40';
  };

  return (
    <>
      <CordelCard
        variant="default"
        className="p-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716] flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2 border-b border-dashed border-cordel-master-dark/20">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🎯</span>
            <span>Résultats aux Défis de la Troupe</span>
          </h2>
          <span className="text-[10px] text-encre-noire/60 font-semibold">
            Scores moyens des adhérents • Accès formateur immédiat
          </span>
        </div>

        {/* Rangée compacte des 3 indicateurs clés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* 1. Blind Test */}
          <div className="flex items-center justify-between p-3 bg-white border border-encre-noire/20 rounded shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎧</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-encre-noire">Blind Test</span>
                <span className="text-[10px] text-encre-noire/60 font-bold">
                  {metrics.blindTest.count > 0 ? `${metrics.blindTest.count} quiz passés` : 'Historique troupe'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded border ${getBadgeStyle(metrics.blindTest.pct)}`}>
                {metrics.blindTest.pct}%
              </span>
              <button
                type="button"
                onClick={() => setActiveModal('blind_test')}
                className="text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-white text-cordel-wood border border-cordel-wood/40 rounded hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Tester le Blind Test en direct"
              >
                🎮 Essayer
              </button>
            </div>
          </div>

          {/* 2. Précision Rythmique / Temps 1 */}
          <div className="flex items-center justify-between p-3 bg-white border border-encre-noire/20 rounded shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-encre-noire">Précision / Temps 1</span>
                <span className="text-[10px] text-encre-noire/60 font-bold">
                  {metrics.reflex.count > 0 ? `${metrics.reflex.count} tests validés` : 'Arrêts au signal'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded border ${getBadgeStyle(metrics.reflex.pct)}`}>
                {metrics.reflex.pct}%
              </span>
              <button
                type="button"
                onClick={() => setActiveModal('reflex')}
                className="text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-white text-cordel-wood border border-cordel-wood/40 rounded hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Tester le Défi Réflexe Temps 1"
              >
                🎮 Essayer
              </button>
            </div>
          </div>

          {/* 3. Reconnaissance des Signes */}
          <div className="flex items-center justify-between p-3 bg-white border border-encre-noire/20 rounded shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🖐️</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-encre-noire">Signes du Mestre</span>
                <span className="text-[10px] text-encre-noire/60 font-bold">
                  {metrics.signals.count > 0 ? `${metrics.signals.count} évaluations` : 'Reconnaissance'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded border ${getBadgeStyle(metrics.signals.pct)}`}>
                {metrics.signals.pct}%
              </span>
              <button
                type="button"
                onClick={() => setActiveModal('signaux')}
                className="text-[9.5px] font-black uppercase tracking-wider px-2 py-1 bg-white text-cordel-wood border border-cordel-wood/40 rounded hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Tester le quiz des Signaux"
              >
                🎮 Essayer
              </button>
            </div>
          </div>

        </div>
      </CordelCard>

      {/* Modale d'essai 1 : Blind Test */}
      {activeModal === 'blind_test' && (
        <BlindTestTrialModal
          isOpen={activeModal === 'blind_test'}
          onClose={() => setActiveModal(null)}
          pieces={pieces}
        />
      )}

      {/* Modale d'essai 2 : Défi Réflexe Temps 1 */}
      {activeModal === 'reflex' && eligibleReflexPiece && (
        <ReflexGameModal
          isOpen={activeModal === 'reflex'}
          onClose={() => setActiveModal(null)}
          piece={eligibleReflexPiece}
          presetData={eligibleReflexPiece.preset?.parsedData || null}
          profileData={profileData}
          groupId={groupId}
        />
      )}

      {/* Modale d'essai 3 : Signes du Mestre */}
      {activeModal === 'signaux' && (
        <SignauxTrialModal
          isOpen={activeModal === 'signaux'}
          onClose={() => setActiveModal(null)}
          groupId={groupId}
        />
      )}
    </>
  );
}
