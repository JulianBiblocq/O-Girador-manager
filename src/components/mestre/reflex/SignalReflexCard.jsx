import React, { useState } from 'react';
import PatternVisualizer from '../../pedagogy/PatternVisualizer';
import {
  extractPupitrePattern,
  generateDistractors
} from '../../../utils/reflexGameUtils';

const PREVIEW_PUPITRES = [
  { key: 'caixa', label: 'Caixa' },
  { key: 'tarol', label: 'Tarol' },
  { key: 'gongue', label: 'Gonguê' },
  { key: 'alfaia', label: 'Alfaia' },
  { key: 'marcante', label: 'Marcante' },
  { key: 'agbe', label: 'Agbê' },
  { key: 'mineiro', label: 'Mineiro' },
  { key: 'timbal', label: 'Timbal' }
];

/**
 * Carte de configuration Mestre pour un signal du morceau.
 * Permet d'arbitrer entre Défi interactif ou Simple repère,
 * et de prévisualiser, renouveler ou verrouiller les 3 leurres rythmiques.
 *
 * @param {Object} props
 * @param {Object} props.signal - Données du signal avec pauseTime et targetMeasureIndex
 * @param {Object} props.presetData - Preset associé
 * @param {Object} props.override - Surcharge actuelle ({ isInteractive, distractors, locked })
 * @param {Function} props.onChangeOverride - Callback de modification
 */
export default function SignalReflexCard({
  signal,
  presetData,
  override = {},
  onChangeOverride
}) {
  const [previewPupitre, setPreviewPupitre] = useState('caixa');
  const [randomSeed, setRandomSeed] = useState(0);

  const isInteractive = override.isInteractive !== undefined
    ? Boolean(override.isInteractive)
    : override.mode ? override.mode !== 'repere' : true;

  const isLocked = Boolean(override.locked);

  // Motif correct attendu pour ce pupitre
  const correctPattern = extractPupitrePattern(presetData, previewPupitre, signal.targetMeasureIndex);

  // 3 leurres calculés ou verrouillés
  const currentDistractors = React.useMemo(() => {
    if (isLocked && Array.isArray(override.distractors) && override.distractors.length === 3) {
      return override.distractors;
    }
    return generateDistractors(
      correctPattern,
      presetData,
      previewPupitre,
      [],
      null,
      signal.targetMeasureIndex
    );
  }, [correctPattern, presetData, previewPupitre, signal.targetMeasureIndex, isLocked, override.distractors, randomSeed]);

  // Bascule du mode Défi interactif vs Simple repère
  const handleToggleMode = (newInteractive) => {
    onChangeOverride({
      ...override,
      isInteractive: newInteractive,
      mode: newInteractive ? 'quiz' : 'repere'
    });
  };

  // Renouvellement aléatoire des leurres
  const handleRegenerate = () => {
    const freshDistractors = generateDistractors(
      correctPattern,
      presetData,
      previewPupitre,
      [],
      null,
      signal.targetMeasureIndex
    );
    // Légère variation forcée pour renouveler visuellement
    setRandomSeed((s) => s + 1);
    onChangeOverride({
      ...override,
      distractors: freshDistractors,
      locked: true
    });
  };

  // Verrouillage / déverrouillage des leurres actuels
  const handleToggleLock = () => {
    if (isLocked) {
      onChangeOverride({
        ...override,
        locked: false,
        distractors: null
      });
    } else {
      onChangeOverride({
        ...override,
        locked: true,
        distractors: currentDistractors
      });
    }
  };

  return (
    <div className="p-4 bg-[#fdfaf2] border-2 border-encre-noire rounded-lg shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3 text-left">
      {/* En-tête : Titre du signal & Interrupteur de mode */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🖐️</span>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase text-encre-noire">
              Mesure {signal.mesure} : {signal.name}
            </h4>
            <p className="text-[10px] font-bold text-cordel-master-dark/70">
              Temps 1 ciblé : <strong>Mesure {signal.targetMeasure}</strong> (à ~{signal.pauseTime.toFixed(1)}s)
            </p>
          </div>
        </div>

        {/* Interrupteur interactif vs repère */}
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded border border-encre-noire/20 shrink-0">
          <button
            type="button"
            onClick={() => handleToggleMode(true)}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${
              isInteractive
                ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            🎯 Défi interactif
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode(false)}
            className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${
              !isInteractive
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            👁️ Simple repère
          </button>
        </div>
      </div>

      {/* Aperçu des tablatures pour le Mestre */}
      {isInteractive ? (
        <div className="flex flex-col gap-3 pt-1">
          {/* Sélecteur de pupitre pour l'aperçu */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-cordel-wood">
                Aperçu pour le pupitre :
              </span>
              <select
                value={previewPupitre}
                onChange={(e) => setPreviewPupitre(e.target.value)}
                className="theme-input text-xs font-bold py-0.5 px-2 bg-white border border-encre-noire/30 rounded"
              >
                {PREVIEW_PUPITRES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-2 py-1 text-[9px] font-black uppercase rounded bg-stone-100 hover:bg-stone-200 border border-encre-noire/30 text-stone-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Générer 3 nouvelles variations de leurres"
              >
                <span>🎲</span>
                <span>Renouveler</span>
              </button>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isLocked
                    ? 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                    : 'bg-white text-stone-700 border-encre-noire/30 hover:bg-stone-100'
                }`}
                title={isLocked ? "Leurres figés pour ce morceau" : "Verrouiller ces 3 leurres pour tous les élèves"}
              >
                <span>{isLocked ? '🔒 Figé' : '🔓 Dynamique'}</span>
              </button>
            </div>
          </div>

          {/* Grille des tablatures : Bonne réponse + 3 Leurres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Bonne réponse */}
            <div className="p-2.5 rounded bg-emerald-50/80 border-2 border-[var(--color-cordel-vert,#2d6a4f)] flex flex-col gap-1">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)] flex items-center gap-1">
                <span>✓</span>
                <span>Bonne Tablature (Temps 1 Mesure {signal.targetMeasure})</span>
              </span>
              <div className="pointer-events-none scale-90 -my-1">
                <PatternVisualizer patternArray={correctPattern} beatResolution={4} />
              </div>
            </div>

            {/* 3 Leurres */}
            {currentDistractors.map((dist, dIdx) => (
              <div key={dIdx} className="p-2.5 rounded bg-white border border-dashed border-encre-noire/30 flex flex-col gap-1">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-1">
                  <span>⚠️</span>
                  <span>
                    Leurre #{dIdx + 1}
                    {dIdx === 0 ? ' (Inattention)' : dIdx === 1 ? ' (Catalogue)' : ' (Variation)'}
                  </span>
                </span>
                <div className="pointer-events-none scale-90 -my-1">
                  <PatternVisualizer patternArray={dist} beatResolution={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/70 border border-dashed border-amber-300 rounded text-center">
          <p className="text-[11px] font-bold text-amber-900 italic">
            Ce signal s'affichera sous forme de repère visuel à la mesure {signal.mesure} sans interrompre le son.
          </p>
        </div>
      )}
    </div>
  );
}
