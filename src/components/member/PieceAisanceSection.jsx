import React from 'react';
import { resolvePieceTrainings } from '../../utils/repertoireMatcher';
import { toggleStageCompletion } from '../../services/aisanceService';
import { launchTrainingStage } from '../../utils/trainingLauncher';

/**
 * Bloc d'Aisance et Entraînements pour la fiche morceau d'un élève.
 * Respecte strictement la règle « Zéro bloc vide » (retourne null si aucun entraînement).
 *
 * @param {Object} props
 * @param {Object} props.piece - Objet morceau du répertoire
 * @param {Array<Object>} props.trainings - Liste des entraînements du groupe
 * @param {Object} props.aisanceMap - Paliers validés par l'utilisateur { [trainingId]: number[] }
 * @param {string} props.userId - Identifiant de l'élève connecté
 * @param {string} props.groupId - Identifiant du groupe/association
 * @param {string} [props.sequenceurUrl] - URL personnalisée du Séquenceur
 */
export default function PieceAisanceSection({
  piece,
  trainings = [],
  aisanceMap = {},
  userId,
  groupId,
  sequenceurUrl
}) {
  // Résolution dynamique des entraînements associés (par presetId ou raccordement manuel, exclusions incluses)
  const pieceTrainings = resolvePieceTrainings(
    piece,
    trainings
  );

  // Règle Zéro bloc vide : aucun rendu s'il n'y a pas d'entraînement configuré
  if (!pieceTrainings || pieceTrainings.length === 0) {
    return null;
  }

  // Basculement de l'état de validation d'un palier
  const handleTogglePalier = async (trainingId, stageIndex) => {
    if (!userId || !trainingId) return;
    const currentCompleted = aisanceMap[trainingId] || [];
    try {
      await toggleStageCompletion(userId, trainingId, stageIndex, currentCompleted, groupId);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du palier d'aisance :", err);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-2.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>⚡</span>
          <span>Entraînement au tempo</span>
        </span>
        <span className="text-[9px] font-bold text-stone-600 bg-amber-100/70 border border-amber-300/80 px-1.5 py-0.5 rounded">
          {pieceTrainings.length} entraînement{pieceTrainings.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {pieceTrainings.map((t) => {
          const completedStages = aisanceMap[t.id] || [];
          const stages = Array.isArray(t.stages) ? t.stages : [];

          return (
            <div
              key={t.id}
              className="p-2.5 rounded bg-white/90 border border-encre-noire/15 shadow-2xs flex flex-col gap-2"
            >
              {/* En-tête de l'exercice */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black text-encre-noire uppercase">
                  {t.title}
                </span>
                <span className="text-[9.5px] font-bold text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
                  {t.startBpm} ➔ {t.targetBpm} BPM
                </span>
              </div>

              {/* Description ou mesures ciblées si présentes */}
              {t.description && (
                <p className="text-[9.5px] text-stone-600 italic">
                  {t.description}
                </p>
              )}

              {/* Paliers interactifs */}
              {stages.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {stages.map((stage) => {
                    const isDone = completedStages.includes(stage.index);

                    return (
                      <div
                        key={stage.index}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9.5px] border transition-all ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`stage-${t.id}-${stage.index}`}
                          checked={isDone}
                          onChange={() => handleTogglePalier(t.id, stage.index)}
                          className="accent-emerald-700 cursor-pointer w-3.5 h-3.5"
                          title={isDone ? 'Marquer comme non validé' : 'Valider ce palier d\'aisance'}
                        />
                        <label
                          htmlFor={`stage-${t.id}-${stage.index}`}
                          className="cursor-pointer select-none font-extrabold"
                        >
                          P{stage.index + 1}
                        </label>
                        <span className="text-[8.5px] opacity-75">
                          ({stage.targetBpm} BPM)
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            launchTrainingStage(t.presetId, t.id, stage.index, {
                              baseUrl: sequenceurUrl
                            })
                          }
                          className="ml-1 px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 shadow-2xs select-none"
                          title={`Pratiquer le palier ${stage.index + 1} sur sequenciador`}
                        >
                          <span>⚡</span>
                          <span>Pratiquer</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
