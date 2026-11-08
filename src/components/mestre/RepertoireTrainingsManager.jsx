import React, { useMemo } from 'react';
import { useTranslation } from '../LanguageContext';
import { resolvePieceTrainings } from '../../utils/resolvePieceTrainings';

/**
 * Sous-composant de gestion des entraînements rattachés à un morceau du Répertoire (<= 140 lignes).
 * Utilise resolvePieceTrainings pour afficher les entraînements actifs sans doublon,
 * les détacher via [✕] (excludedTrainingIds / trainingIds) ou en associer d'autres (Loopback partagé).
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
  const { t } = useTranslation();
  const cleanSeqId = currentSeqId ? String(currentSeqId).trim() : '';

  // Résolution unifiée et dédoublonnée des entraînements actuellement rattachés et non exclus
  const attachedTrainings = useMemo(() => {
    const resolved = resolvePieceTrainings(
      { sequenceurId: cleanSeqId, trainingIds: selectedTrainingIds, excludedTrainingIds },
      allTrainings
    );
    const manualSet = new Set((selectedTrainingIds || []).map((id) => String(id).trim()));
    return resolved.map((tr) => {
      const tid = String(tr.id).trim();
      const rawPreset = String(tr.rawTraining?.presetId || tr.rawTraining?.sequenceurId || '').trim();
      return {
        ...tr.rawTraining,
        ...tr,
        isAuto: Boolean(cleanSeqId && rawPreset && rawPreset === cleanSeqId),
        isManual: manualSet.has(tid)
      };
    });
  }, [allTrainings, cleanSeqId, selectedTrainingIds, excludedTrainingIds]);

  // Liste des entraînements disponibles pour association manuelle (non encore rattachés)
  const availableToAdd = useMemo(() => {
    if (!Array.isArray(allTrainings)) return [];
    const attachedIds = new Set(attachedTrainings.map((at) => String(at.id).trim()));
    return allTrainings.filter((tr) => tr && tr.id && !attachedIds.has(String(tr.id).trim()));
  }, [allTrainings, attachedTrainings]);

  // Détachement d'un entraînement [✕]
  const handleDetachTraining = (tr) => {
    if (disabled || !tr || !tr.id) return;
    const tid = String(tr.id).trim();
    if (tr.isManual) {
      onChangeTrainingIds(selectedTrainingIds.filter((id) => String(id).trim() !== tid));
    }
    if (tr.isAuto) {
      const currentExcluded = Array.isArray(excludedTrainingIds) ? excludedTrainingIds : [];
      if (!currentExcluded.includes(tid)) onChangeExcludedIds([...currentExcluded, tid]);
    }
  };

  // Rattachement d'un nouvel entraînement (Loopback partagé)
  const handleAttachTraining = (trainingId) => {
    if (disabled || !trainingId) return;
    const tid = String(trainingId).trim();
    if (Array.isArray(excludedTrainingIds) && excludedTrainingIds.includes(tid)) {
      onChangeExcludedIds(excludedTrainingIds.filter((id) => String(id).trim() !== tid));
    }
    if (!selectedTrainingIds.includes(tid)) {
      onChangeTrainingIds([...selectedTrainingIds, tid]);
    }
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-2 pt-2.5 border-t border-dashed border-cordel-master-dark/15">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-[9.5px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
          <span>⚡</span>
          <span>{t('mestre.sequenceur.trainingsLinkedHeading')}</span>
          {attachedTrainings.length > 0 && (
            <span className="text-[9px] font-black text-amber-950 px-1.5 py-0.2 rounded-full bg-amber-200 border border-amber-300">
              {attachedTrainings.length} {t('mestre.sequenceur.linkedSingular')}{attachedTrainings.length > 1 ? 's' : ''}
            </span>
          )}
        </label>
      </div>

      <p className="text-[9.5px] text-encre-noire/65 leading-tight">
        {t('mestre.sequenceur.trainingsAutoDetectedNotice')} <span className="font-bold text-red-700">[✕]</span> {t('mestre.sequenceur.trainingsDetachOrAssociateNotice')}
      </p>

      {attachedTrainings.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-cordel-bg-light/60 border border-encre-noire/20 rounded">
          {attachedTrainings.map((tr) => {
            const title = tr.title || tr.titre || tr.name || 'Entraînement';
            return (
              <span key={tr.id} className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold rounded-[4px_6px_3px_5px] bg-white text-encre-noire border border-amber-300 shadow-2xs hover:border-amber-400 transition-all">
                <span>⚡</span>
                <span className="truncate max-w-[200px]" title={title}>{title}</span>
                <span className="text-[9px] font-semibold text-stone-500">({tr.startBpm || 60} ➔ {tr.targetBpm || 100} BPM)</span>
                {tr.isAuto && !tr.isManual && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">{t('pedagogy.admin.auto')}</span>
                )}
                {tr.isManual && !tr.isAuto && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">{t('mestre.sequenceur.manualBadge')}</span>
                )}
                <button type="button" onClick={() => handleDetachTraining(tr)} disabled={disabled} className="text-stone-400 hover:text-red-700 font-black text-xs p-0.5 ml-0.5 cursor-pointer leading-none transition-colors" title={t('mestre.sequenceur.detachTrainingTitle') || 'Détacher cet entraînement du morceau'}>✕</button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-stone-500 italic p-2 bg-cordel-bg-light/40 border border-dashed border-encre-noire/15 rounded">
          {t('mestre.sequenceur.noTrainingsLinked')}
        </p>
      )}

      <div className="pt-1">
        <select
          value=""
          onChange={(e) => { if (e.target.value) handleAttachTraining(e.target.value); }}
          disabled={disabled || availableToAdd.length === 0}
          className="theme-input w-full text-xs font-semibold p-2 bg-white border border-encre-noire/30 rounded cursor-pointer focus:border-amber-600 focus:outline-none"
        >
          <option value="">
            {availableToAdd.length > 0
              ? (t('pedagogy.admin.associerUnAutreEntrainement') || '➕ Associer un autre entraînement existant...')
              : (t('pedagogy.admin.tousLesEntrainementsDu') || 'Tous les entraînements du groupe sont déjà rattachés')}
          </option>
          {availableToAdd.map((tr) => (
            <option key={tr.id} value={tr.id}>
              ⚡ {tr.title || tr.titre || tr.name || t('pedagogy.admin.entrainement')} ({tr.startBpm || 60} ➔ {tr.targetBpm || 100} {t('mestre.sequenceur.bpmCloseParen')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
