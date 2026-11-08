import { computeTrainingStages } from './aisanceStagesUtils.js';

/**
 * Résout et dédoublonne les entraînements associés à un morceau (<= 60 lignes).
 * Combine t.presetId === piece.sequenceurId et piece.trainingIds?.includes(t.id),
 * exclut piece.excludedTrainingIds et dédoublonne strictement par t.id.
 */
export function resolvePieceTrainings(sequenceurIdOrPiece, trainingsList = [], trainingIds = [], excludedTrainingIds = []) {
  if (!Array.isArray(trainingsList) || trainingsList.length === 0) return [];
  const isObj = Boolean(sequenceurIdOrPiece && typeof sequenceurIdOrPiece === 'object');
  const piece = isObj ? sequenceurIdOrPiece : { sequenceurId: sequenceurIdOrPiece, trainingIds, excludedTrainingIds };
  const cleanSeqId = String(piece.sequenceurId || piece.presetId || piece.preset?.id || '').trim();
  const cleanTrainingIds = Array.isArray(piece.trainingIds) ? piece.trainingIds.map((id) => String(id).trim()).filter(Boolean) : [];
  const excludedSet = new Set(Array.isArray(piece.excludedTrainingIds) ? piece.excludedTrainingIds.map((id) => String(id).trim()).filter(Boolean) : []);

  if (!cleanSeqId && cleanTrainingIds.length === 0) return [];

  const list = trainingsList.filter((t) => {
    if (!t || !t.id) return false;
    const tid = String(t.id).trim();
    if (excludedSet.has(tid)) return false;
    const tPresetId = String(t.presetId || t.sequenceurId || '').trim();
    const matchesPreset = Boolean(cleanSeqId && (t.presetId === piece.sequenceurId || (tPresetId && tPresetId === cleanSeqId)));
    const matchesManual = Boolean(piece.trainingIds?.includes(t.id) || cleanTrainingIds.includes(tid));
    return matchesPreset || matchesManual;
  });

  // Dédoublonnage strict par identifiant t.id
  const uniqueList = Array.from(new Map(list.map((t) => [String(t.id).trim(), t])).values());

  return uniqueList.map((t) => {
    const stages = computeTrainingStages(t);
    const startBpm = Number(t.startBpm ?? (stages.length > 0 ? stages[0].startBpm : 60));
    const targetBpm = Number(t.targetBpm ?? (stages.length > 0 ? stages[stages.length - 1].targetBpm : 100));
    return {
      id: t.id,
      title: t.title || t.titre || t.name || 'Entraînement',
      description: t.description || '',
      startBpm,
      targetBpm,
      stagesCount: stages.length,
      stages,
      presetId: t.presetId || cleanSeqId,
      rawTraining: t
    };
  });
}

