/**
 * Utilitaires purs pour le calcul et la normalisation des paliers d'entraînement.
 * Indépendant de Firebase pour une exécution ultra-rapide et testable sans dépendance runtime.
 */

/**
 * Calcule et normalise la liste des paliers d'un entraînement.
 * Supporte les structures d'objets avec tableau de stages prédéfinis ou calculs dynamiques de BPM.
 *
 * @param {Object} training - Objet entraînement issu de Firestore
 * @returns {Array<{ index: number, startBpm: number, targetBpm: number, label: string }>}
 */
export function computeTrainingStages(training) {
  if (!training) return [];

  // Cas 1 : Paliers explicitement déclarés sous forme de tableau (stages ou paliers)
  const rawStages = Array.isArray(training.stages)
    ? training.stages
    : Array.isArray(training.paliers)
      ? training.paliers
      : null;

  if (rawStages && rawStages.length > 0) {
    return rawStages.map((st, idx) => {
      if (typeof st === 'number') {
        const prevTarget = idx > 0 ? (rawStages[idx - 1]?.targetBpm || rawStages[idx - 1] || 60) : (training.startBpm || 60);
        return {
          index: idx,
          startBpm: Number(prevTarget),
          targetBpm: Number(st),
          label: `Palier ${idx + 1} : ${prevTarget} ➔ ${st} BPM`
        };
      }
      const start = Number(st.startBpm ?? (idx === 0 ? (training.startBpm || 60) : (rawStages[idx - 1]?.targetBpm || 60)));
      const target = Number(st.targetBpm ?? st.bpm ?? (start + 10));
      return {
        index: idx,
        startBpm: start,
        targetBpm: target,
        label: st.label || `Palier ${idx + 1} : ${start} ➔ ${target} BPM`
      };
    });
  }

  // Cas 2 : Génération dynamique si startBpm et targetBpm sont spécifiés
  if (training.startBpm != null && training.targetBpm != null) {
    const startBpm = Number(training.startBpm);
    const targetBpm = Number(training.targetBpm);
    const stepBpm = Number(training.stepBpm || training.bpmStep || 10);

    if (startBpm < targetBpm && stepBpm > 0) {
      const computed = [];
      let current = startBpm;
      let idx = 0;
      while (current < targetBpm) {
        const next = Math.min(current + stepBpm, targetBpm);
        computed.push({
          index: idx,
          startBpm: current,
          targetBpm: next,
          label: `Palier ${idx + 1} : ${current} ➔ ${next} BPM`
        });
        current = next;
        idx++;
      }
      return computed;
    }
  }

  // Repli par défaut : 3 paliers progressifs standards
  return [
    { index: 0, startBpm: 70, targetBpm: 90, label: 'Palier 1 : 70 ➔ 90 BPM' },
    { index: 1, startBpm: 90, targetBpm: 110, label: 'Palier 2 : 90 ➔ 110 BPM' },
    { index: 2, startBpm: 110, targetBpm: 130, label: 'Palier 3 : 110 ➔ 130 BPM' }
  ];
}
