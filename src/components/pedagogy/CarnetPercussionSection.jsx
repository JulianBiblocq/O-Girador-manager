import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import { launchCrossApp } from '../../utils/crossAppAuth';
import { useTranslation } from '../LanguageContext';
import { getInstrumentLabel } from '../../constants/nomenclature';

/**
 * Section Percussion du Carnet d'Aisance (< 135 lignes).
 * Respecte la nomenclature de la Bateria et la règle anti-monolithe.
 */
export default function CarnetPercussionSection({
  repertoire = [],
  evaluations = {},
  handleSetEvaluation,
  revisionsDemandees = {},
  handleToggleRevisionDemandee = null,
  sequenceurUrl,
  comfortLevels,
  groupNomenclature = null
}) {
  const { t } = useTranslation();
  const effectiveComfortLevels = useMemo(() => comfortLevels || [
    { level: 'decouverte', label: `🌱 ${t('pedagogy.comfortDiscovery')}` },
    { level: 'pratique', label: `🌿 ${t('pedagogy.comfortPractice')}` },
    { level: 'alaise', label: `🌳 ${t('pedagogy.comfortComfortable')}` },
    { level: 'referent', label: `👑 ${t('pedagogy.comfortReferent')}` }
  ], [comfortLevels, t]);

  const seasonPieces = useMemo(() => {
    const saisons = (repertoire || []).filter((p) => p.statutSaison === 'saison');
    if (saisons.length > 0) return saisons;
    const active = (repertoire || []).filter((p) => p.statutSaison !== 'archive' && !p.isArchived);
    return active.length > 0 ? active : repertoire || [];
  }, [repertoire]);

  const buildSequencerUrl = (piece, bpm) => {
    const baseUrl = sequenceurUrl || 'https://sequenceur.app';
    const targetId = piece.sequenceurId || piece.presetId || piece.id;
    const sep = baseUrl.includes('?') ? '&' : '?';
    const param = piece.sequenceurType === 'sections' ? 'sectionId' : 'loadPreset';
    return `${baseUrl}${sep}${param}=${targetId}${bpm ? `&bpm=${bpm}` : ''}`;
  };

  if (seasonPieces.length === 0) {
    return (
      <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
        <span className="text-3xl block mb-2">🥁</span>
        <p className="text-sm font-bold text-encre-noire/70">{t('pedagogy.carnet.aucunMorceauOfficielDeSaison')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {seasonPieces.map((piece) => {
        const currentLevel = evaluations[piece.id] || evaluations[piece.sequenceurId] || null;
        const isRevRequested = Boolean(revisionsDemandees[piece.id] || revisionsDemandees[piece.sequenceurId]);
        const rhythmLabel = piece.rythme ? getInstrumentLabel(piece.rythme, groupNomenclature) : 'Maracatu de Baque Virado';

        return (
          <CordelCard key={piece.id} className="p-4 flex flex-col gap-3 bg-[#fdfaf2] border-2 border-encre-noire shadow-2xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dashed border-cordel-master-dark/20 pb-2 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire">{piece.titre}</h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/20">{rhythmLabel}</span>
                {handleToggleRevisionDemandee && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleRevisionDemandee(piece.id);
                    }}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      isRevRequested ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>🙋</span> {isRevRequested ? t('pedagogy.revisionRequestedNotice') : t('pedagogy.requestRevisionBtn')}
                  </button>
                )}
              </div>

              {/* 4 jauges de confort */}
              <div className="flex flex-wrap gap-1">
                {effectiveComfortLevels.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => handleSetEvaluation(piece.id, lvl.level)}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border cursor-pointer ${
                      currentLevel === lvl.level ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rangée tempo */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[9px] font-black uppercase text-cordel-master-dark">⏱️ Calage :</span>
              {[80, 100, 120].map((bpm) => (
                <button
                  key={bpm}
                  type="button"
                  onClick={() => launchCrossApp(buildSequencerUrl(piece, bpm), { appLabel: 'le Séquenceur' })}
                  className="text-[9px] font-bold bg-white border border-stone-300 px-2 py-0.5 rounded hover:bg-stone-50 cursor-pointer"
                >
                  ⚡ {bpm} BPM
                </button>
              ))}
            </div>
          </CordelCard>
        );
      })}
    </div>
  );
}
