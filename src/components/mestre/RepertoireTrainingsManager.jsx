import React, { useMemo } from 'react';

/**
 * Sous-composant de gestion des entraînements rattachés à un morceau du Répertoire.
 * Permet d'afficher les entraînements actifs (issus de la détection automatique du sequenciador
 * ou rattachés manuellement), de les détacher via [✕] (en alimentant excludedTrainingIds pour les auto,
 * ou en retirant de trainingIds pour les manuels), et d'en associer d'autres parmi le catalogue du groupe.
 *
 * @param {Object} props
 * @param {Array<Object>} props.allTrainings - Liste exhaustive des entraînements du groupe (/trainings)
 * @param {string} [props.currentSeqId] - Identifiant du preset séquenceur du morceau (pour la liaison auto)
 * @param {Array<string>} props.selectedTrainingIds - Identifiants des entraînements rattachés manuellement
 * @param {Function} props.onChangeTrainingIds - Callback de mise à jour des entraînements manuels
 * @param {Array<string>} props.excludedTrainingIds - Identifiants des entraînements exclus / masqués
 * @param {Function} props.onChangeExcludedIds - Callback de mise à jour des entraînements exclus
 * @param {boolean} [props.disabled=false] - Désactive les interactions si le formulaire est en cours de soumission
 */
export default function RepertoireTrainingsManager({
  allTrainings = [],
  currentSeqId = '',
  selectedTrainingIds = [],
  onChangeTrainingIds,
  excludedTrainingIds = [],
  onChangeExcludedIds,
  disabled = false
}) {
  const cleanSeqId = currentSeqId ? String(currentSeqId).trim() : '';

  // 1. Identification des entraînements liés automatiquement par preset sequenciador
  const autoTrainings = useMemo(() => {
    if (!cleanSeqId || !Array.isArray(allTrainings)) return [];
    return allTrainings.filter((t) => {
      if (!t || !t.id) return false;
      const tPreset = String(t.presetId || t.sequenceurId || '').trim();
      return tPreset && tPreset === cleanSeqId;
    });
  }, [allTrainings, cleanSeqId]);

  // 2. Identification des entraînements liés manuellement
  const manualTrainings = useMemo(() => {
    if (!Array.isArray(allTrainings) || !Array.isArray(selectedTrainingIds)) return [];
    const manualSet = new Set(selectedTrainingIds.map((id) => String(id).trim()));
    return allTrainings.filter((t) => t && t.id && manualSet.has(String(t.id).trim()));
  }, [allTrainings, selectedTrainingIds]);

  // 3. Calcul unifié et dédoublonné de tous les entraînements actuellement rattachés et non exclus
  const attachedTrainings = useMemo(() => {
    const excludedSet = new Set((excludedTrainingIds || []).map((id) => String(id).trim()));
    const map = new Map();

    // Entraînements auto-détectés
    for (const t of autoTrainings) {
      const tid = String(t.id).trim();
      if (!excludedSet.has(tid)) {
        map.set(tid, {
          ...t,
          isAuto: true,
          isManual: selectedTrainingIds.includes(tid)
        });
      }
    }

    // Entraînements rattachés manuellement
    for (const t of manualTrainings) {
      const tid = String(t.id).trim();
      if (!excludedSet.has(tid)) {
        const existing = map.get(tid);
        if (existing) {
          existing.isManual = true;
        } else {
          map.set(tid, {
            ...t,
            isAuto: false,
            isManual: true
          });
        }
      }
    }

    return Array.from(map.values());
  }, [autoTrainings, manualTrainings, excludedTrainingIds, selectedTrainingIds]);

  // 4. Liste des entraînements disponibles pour association manuelle (non encore rattachés)
  const availableToAdd = useMemo(() => {
    if (!Array.isArray(allTrainings)) return [];
    const attachedIds = new Set(attachedTrainings.map((at) => String(at.id).trim()));
    return allTrainings.filter((t) => t && t.id && !attachedIds.has(String(t.id).trim()));
  }, [allTrainings, attachedTrainings]);

  // Détachement d'un entraînement [✕]
  const handleDetachTraining = (t) => {
    if (disabled || !t || !t.id) return;
    const tid = String(t.id).trim();

    // Si manuel : le retirer de selectedTrainingIds
    if (t.isManual) {
      onChangeTrainingIds(selectedTrainingIds.filter((id) => String(id).trim() !== tid));
    }

    // Si auto sequenciador : l'ajouter dans excludedTrainingIds pour masquer sa détection
    if (t.isAuto) {
      const currentExcluded = Array.isArray(excludedTrainingIds) ? excludedTrainingIds : [];
      if (!currentExcluded.includes(tid)) {
        onChangeExcludedIds([...currentExcluded, tid]);
      }
    }
  };

  // Rattachement d'un nouvel entraînement
  const handleAttachTraining = (trainingId) => {
    if (disabled || !trainingId) return;
    const tid = String(trainingId).trim();

    // 1. Si l'entraînement était précédemment exclu, le réactiver en le retirant d'excludedTrainingIds
    if (Array.isArray(excludedTrainingIds) && excludedTrainingIds.includes(tid)) {
      onChangeExcludedIds(excludedTrainingIds.filter((id) => String(id).trim() !== tid));
    }

    // 2. L'ajouter aux sélections manuelles
    if (!selectedTrainingIds.includes(tid)) {
      onChangeTrainingIds([...selectedTrainingIds, tid]);
    }
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-2 pt-2.5 border-t border-dashed border-cordel-master-dark/15">
      {/* En-tête : Titre et compteur d'entraînements rattachés */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-[9.5px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
          <span>⚡</span>
          <span>Entraînements rattachés au morceau</span>
          {attachedTrainings.length > 0 && (
            <span className="text-[9px] font-black text-amber-950 px-1.5 py-0.2 rounded-full bg-amber-200 border border-amber-300">
              {attachedTrainings.length} rattaché{attachedTrainings.length > 1 ? 's' : ''}
            </span>
          )}
        </label>
      </div>

      <p className="text-[9.5px] text-encre-noire/65 leading-tight">
        Les entraînements du preset sequenciador sont détectés automatiquement. Cliquez sur <span className="font-bold text-red-700">[✕]</span> pour détacher un entraînement ou utilisez le sélecteur pour en associer d'autres.
      </p>

      {/* Liste des entraînements actuellement rattachés sous forme de pastilles Cordel */}
      {attachedTrainings.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-cordel-bg-light/60 border border-encre-noire/20 rounded">
          {attachedTrainings.map((t) => {
            const title = t.title || t.titre || t.name || 'Entraînement';
            const tempoText = `${t.startBpm || 60} ➔ ${t.targetBpm || 100} BPM`;

            return (
              <span
                key={t.id}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold rounded-[4px_6px_3px_5px] bg-white text-encre-noire border border-amber-300 shadow-2xs hover:border-amber-400 transition-all"
              >
                <span>⚡</span>
                <span className="truncate max-w-[200px]" title={title}>
                  {title}
                </span>
                <span className="text-[9px] font-semibold text-stone-500">
                  ({tempoText})
                </span>

                {/* Badge d'origine (auto sequenciador vs manuel) */}
                {t.isAuto && !t.isManual && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    auto
                  </span>
                )}
                {t.isManual && !t.isAuto && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    manuel
                  </span>
                )}

                {/* Bouton de suppression / détachement */}
                <button
                  type="button"
                  onClick={() => handleDetachTraining(t)}
                  disabled={disabled}
                  className="text-stone-400 hover:text-red-700 font-black text-xs p-0.5 ml-0.5 cursor-pointer leading-none transition-colors"
                  title="Détacher cet entraînement du morceau"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-stone-500 italic p-2 bg-cordel-bg-light/40 border border-dashed border-encre-noire/15 rounded">
          Aucun entraînement rattaché à ce morceau pour le moment.
        </p>
      )}

      {/* Menu déroulant pour associer un autre entraînement existant */}
      <div className="pt-1">
        <select
          value=""
          onChange={(e) => {
            const addedId = e.target.value;
            if (addedId) {
              handleAttachTraining(addedId);
            }
          }}
          disabled={disabled || availableToAdd.length === 0}
          className="theme-input w-full text-xs font-semibold p-2 bg-white border border-encre-noire/30 rounded cursor-pointer focus:border-amber-600 focus:outline-none"
        >
          <option value="">
            {availableToAdd.length > 0
              ? '➕ Associer un autre entraînement existant...'
              : 'Tous les entraînements du groupe sont déjà rattachés'}
          </option>
          {availableToAdd.map((tr) => (
            <option key={tr.id} value={tr.id}>
              ⚡ {tr.title || tr.titre || tr.name || 'Entraînement'} ({tr.startBpm || 60} ➔ {tr.targetBpm || 100} BPM)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
