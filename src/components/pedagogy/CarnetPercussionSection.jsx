// Section Percussion du Carnet d'Aisance alignée sur les Morceaux de saison
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import { launchCrossApp } from '../../utils/crossAppAuth';
import { useTranslation } from '../LanguageContext';

export default function CarnetPercussionSection({
  repertoire = [],
  evaluations = {},
  handleSetEvaluation,
  revisionsDemandees = {},
  handleToggleRevisionDemandee = null,
  sequenceurUrl,
  comfortLevels
}) {
  const { t } = useTranslation();
  const effectiveComfortLevels = useMemo(() => comfortLevels || [
    { level: 'decouverte', label: `🌱 ${t('pedagogy.comfortDiscovery')}` },
    { level: 'pratique', label: `🌿 ${t('pedagogy.comfortPractice')}` },
    { level: 'alaise', label: `🌳 ${t('pedagogy.comfortComfortable')}` },
    { level: 'referent', label: `👑 ${t('pedagogy.comfortReferent')}` }
  ], [comfortLevels, t]);

  // 1. Filtrage sur les morceaux officiels de la saison (ou actifs)
  const seasonPieces = useMemo(() => {
    const saisons = (repertoire || []).filter((p) => p.statutSaison === 'saison');
    if (saisons.length > 0) return saisons;
    const active = (repertoire || []).filter((p) => p.statutSaison !== 'archive' && !p.isArchived);
    return active.length > 0 ? active : repertoire || [];
  }, [repertoire]);

  // Construction de l'URL vers le Séquenceur avec calage BPM
  const buildSequencerUrl = (piece, bpm) => {
    const baseUrl = sequenceurUrl || 'https://sequenceur.app';
    const targetId = piece.sequenceurId || piece.presetId || piece.id;
    let url = baseUrl;

    if (piece.sequenceurType === 'sections') {
      url = baseUrl.includes('?') ? `${baseUrl}&sectionId=${targetId}` : `${baseUrl}?sectionId=${targetId}`;
    } else if (targetId) {
      url = baseUrl.includes('?') ? `${baseUrl}&loadPreset=${targetId}` : `${baseUrl}?loadPreset=${targetId}`;
    }

    if (bpm) {
      url += `&bpm=${bpm}`;
    }
    return url;
  };

  if (seasonPieces.length === 0) {
    return (
      <div className="text-center p-8 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded-lg">
        <span className="text-3xl block mb-2">🥁</span>
        <p className="text-sm font-bold text-encre-noire/70">{t('pedagogy.carnet.aucunMorceauOfficielDeSaison')}</p>
        <p className="text-xs text-encre-noire/50 mt-1">{t('pedagogy.carnet.lesMorceauxConfiguresDansLe')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {seasonPieces.map((piece) => {
        // Rétrocompatibilité : lecture de l'évaluation sur l'ID morceau ou le preset lié
        const currentLevel =
          evaluations[piece.id] ||
          (piece.sequenceurId && evaluations[piece.sequenceurId]) ||
          (piece.presetId && evaluations[piece.presetId]) ||
          null;

        const isRevRequested = Boolean(
          revisionsDemandees[piece.id] ||
          (piece.sequenceurId && revisionsDemandees[piece.sequenceurId])
        );

        const rhythmLabel = piece.rythme || piece.nacao || 'Maracatu de Baque Virado';

        return (
          <CordelCard key={piece.id} className="p-5 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
            {/* En-tête du morceau */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dashed border-cordel-master-dark/20 pb-2.5 gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire">
                    {piece.titre}
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/20">
                    {rhythmLabel}
                  </span>
                  {handleToggleRevisionDemandee && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleRevisionDemandee(piece.id);
                      }}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                        isRevRequested
                          ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-[#1b4332] shadow-xs'
                          : 'bg-white text-cordel-master-dark border-encre-noire/30 hover:bg-neutral-100'
                      }`}
                      title={isRevRequested ? 'Demande de révision active pour ce morceau' : 'Signaler au Mestre le besoin de réviser ce morceau'}
                    >
                      <span>🙋</span>
                      <span>{isRevRequested ? t('pedagogy.revisionRequestedNotice') : t('pedagogy.requestRevisionBtn')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 jauges de confort */}
              <div className="flex flex-wrap gap-1 justify-end max-w-full sm:max-w-[60%]">
                {effectiveComfortLevels.map((lvl) => {
                  const isSelected = currentLevel === lvl.level;
                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSetEvaluation(piece.id, lvl.level);
                      }}
                      className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded border border-encre-noire/30 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716] scale-105'
                          : 'bg-white text-encre-noire hover:bg-neutral-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rangée d'entraînement : calage tempo 80, 100, 120 BPM */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark mr-1 flex items-center gap-1">
                <span>⏱️</span>
                <span>{t('pedagogy.carnet.calageTempoDansLeSequenceur')}</span>
              </span>

              {[80, 100, 120].map((bpm) => (
                <button
                  key={bpm}
                  type="button"
                  onClick={() => launchCrossApp(buildSequencerUrl(piece, bpm), { appLabel: 'le Séquenceur' })}
                  className="text-[9px] font-bold bg-[var(--theme-bg)] border border-encre-noire/50 px-2.5 py-1 rounded hover:bg-[#ebdcc0] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                  title={`Ouvrir « ${piece.titre} » dans le séquenceur calé à ${bpm} BPM`}
                >
                  <span>⚡</span>
                  <span>{bpm} BPM</span>
                </button>
              ))}
            </div>
          </CordelCard>
        );
      })}
    </div>
  );
}
