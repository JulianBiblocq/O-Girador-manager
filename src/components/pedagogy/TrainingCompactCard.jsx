import React from 'react';
import { launchTrainingStage } from '../../utils/trainingLauncher';

/**
 * Carte compacte d'entraînement Speed Trainer réutilisable.
 * Conçue selon la charte graphique Cordel (papier kraft, contrastes encre noire, vert validation).
 *
 * Utilisée dans :
 * 1. Le Répertoire (MestreRepertoireView) au sein du bloc repliable des défis.
 * 2. Le Fil Conducteur de Répétition (EventRevisionProgram) sous les notes du Mestre.
 *
 * @param {Object} props
 * @param {Object} [props.training] - Objet défi unique résolu
 * @param {Array<Object>} [props.trainings] - Liste de défis résolus
 * @param {string} [props.sequenceurUrl] - URL de base du Séquenceur
 * @param {'repertoire'|'rehearsal'} [props.mode='repertoire'] - Contexte d'affichage
 * @param {string} [props.className] - Classes CSS personnalisées
 */
export default function TrainingCompactCard({
  training,
  trainings,
  sequenceurUrl,
  mode = 'repertoire',
  className = ''
}) {
  const items = Array.isArray(trainings)
    ? trainings
    : (training ? [training] : []);

  if (items.length === 0) return null;

  // ---------------------------------------------------------------------------
  // MODE 1 : Répétition / Fil Conducteur (Encart compact sous les notes)
  // ---------------------------------------------------------------------------
  if (mode === 'rehearsal') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {items.map((t) => {
          const stages = Array.isArray(t.stages) ? t.stages : [];
          return (
            <div
              key={t.id}
              className="p-2.5 rounded bg-amber-50/85 border border-dashed border-amber-300 flex flex-col gap-2 shadow-2xs text-left"
            >
              {/* En-tête de recommandation de séance */}
              <div className="flex items-center justify-between gap-2 border-b border-dashed border-amber-300/60 pb-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Entraînement recommandé pour la séance</span>
                </span>
                <span className="text-[9px] font-black text-amber-900 uppercase px-1.5 py-0.2 rounded bg-amber-200/60 border border-amber-300">
                  Cible : {t.targetBpm} BPM
                </span>
              </div>

              {/* Titre du défi, plage de tempo et bouton de lancement direct */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-black text-encre-noire uppercase">
                    {t.title}
                  </span>
                  <span className="text-[10px] text-encre-noire/70 font-bold">
                    ({t.startBpm} ➔ {t.targetBpm} BPM)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => launchTrainingStage(t.presetId, t.id, 0, { baseUrl: sequenceurUrl })}
                  className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-xs select-none"
                  title="Ouvrir Séquenciad'Or sur cet entraînement"
                >
                  <span>⚡</span>
                  <span>Pratiquer</span>
                </button>
              </div>

              {/* Découpage des paliers cliquables */}
              {stages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {stages.map((stage) => (
                    <button
                      key={stage.index}
                      type="button"
                      onClick={() => launchTrainingStage(t.presetId, t.id, stage.index, { baseUrl: sequenceurUrl })}
                      className="px-2 py-0.5 text-[8.5px] font-bold rounded bg-white hover:bg-amber-100 border border-amber-200 text-encre-noire hover:border-amber-400 transition-all cursor-pointer shadow-2xs flex items-center gap-1 select-none"
                      title={`Lancer le palier ${stage.index + 1} (${stage.startBpm} ➔ ${stage.targetBpm} BPM)`}
                    >
                      <span className="text-amber-800 font-black">P{stage.index + 1}</span>
                      <span>{stage.startBpm} ➔ {stage.targetBpm} BPM</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODE 2 : Répertoire (Fiche Morceau / Volet déplié)
  // ---------------------------------------------------------------------------
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {items.map((t) => {
        const stages = Array.isArray(t.stages) ? t.stages : [];
        return (
          <div
            key={t.id}
            className="p-2.5 bg-white/95 border border-amber-200 rounded flex flex-col gap-2 shadow-2xs text-left"
          >
            {/* Titre et badges BPM / Paliers */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-black text-encre-noire uppercase">
                {t.title}
              </span>
              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                {t.startBpm} ➔ {t.targetBpm} BPM • {t.stagesCount || stages.length} palier{(t.stagesCount || stages.length) > 1 ? 's' : ''}
              </span>
            </div>

            {/* Description facultative */}
            {t.description && (
              <p className="text-[9px] text-encre-noire/70 italic">
                {t.description}
              </p>
            )}

            {/* Grille des paliers avec bouton [ ⚡ Pratiquer ] */}
            {stages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {stages.map((stage) => (
                  <div
                    key={stage.index}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#fdfaf2] border border-encre-noire/20 text-[9px]"
                  >
                    <span className="font-extrabold text-encre-noire">{stage.label}</span>
                    <button
                      type="button"
                      onClick={() => launchTrainingStage(t.presetId, t.id, stage.index, { baseUrl: sequenceurUrl })}
                      className="ml-1 px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 select-none"
                      title={`Lancer Séquenciad'Or sur le palier ${stage.index + 1}`}
                    >
                      <span>⚡</span>
                      <span>Pratiquer</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
