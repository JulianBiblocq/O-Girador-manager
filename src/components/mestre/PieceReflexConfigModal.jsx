import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SignalReflexCard from './reflex/SignalReflexCard';
import { calculatePauseTimes } from '../../utils/reflexGameUtils';
import { cleanFirestorePayload } from '../../utils/firestoreUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Inspecteur d'Arbitrage Mestre pour les signaux d'un morceau (< 135 lignes).
 * Permet de basculer chaque signal entre 🎯 Défi interactif (pause au temps 1 + 4 grilles PatternVisualizer)
 * et 👁️ Simple repère (mode: 'cueOnly'), et de régénérer ou verrouiller les leurres dans piece.signalOverrides.
 */
export default function PieceReflexConfigModal({
  isOpen,
  onClose,
  piece,
  presetData = null,
  groupId = '',
  onSaveOverrides = null
}) {
  const { t } = useTranslation();
  const [localOverrides, setLocalOverrides] = useState(null);
  const [saving, setSaving] = useState(false);

  const overrides = useMemo(
    () => (localOverrides !== null ? localOverrides : (piece?.signalOverrides && typeof piece.signalOverrides === 'object' ? { ...piece.signalOverrides } : {})),
    [localOverrides, piece]
  );

  const effectivePreset = useMemo(
    () => presetData || piece?.preset?.parsedData || piece?.preset || null,
    [presetData, piece]
  );

  // Calcul des points de pause sans filtrage pupitre pour lister tous les signaux du morceau
  const signalsList = useMemo(() => {
    if (!piece) return [];
    return calculatePauseTimes({ ...piece, signalOverrides: overrides }, effectivePreset, null);
  }, [piece, overrides, effectivePreset]);

  if (!isOpen || !piece) return null;

  const handleUpdateSignalOverride = (signalId, nextOverride) => {
    setLocalOverrides({
      ...overrides,
      [signalId]: nextOverride
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = cleanFirestorePayload(overrides || {});
      if (groupId && piece.id) {
        const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
        await updateDoc(pieceRef, {
          signalOverrides: cleaned,
          updatedAt: new Date().toISOString()
        });
      }
      if (onSaveOverrides) {
        onSaveOverrides(cleaned);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error('[PieceReflexConfigModal] Erreur sauvegarde signalOverrides :', err);
    } finally {
      setSaving(false);
    }
  };

  const interactiveCount = signalsList.filter((s) => s.isInteractive).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <CordelCard className="w-full max-w-3xl bg-[#fdfaf2] border-2 border-encre-noire shadow-[6px_6px_0px_0px_#181716] p-4 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto text-left">
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood block">
              🎯 {t('pedagogy.reflex.mestreReflexConfigTitle')}
            </span>
            <h3 className="text-lg sm:text-xl font-heading uppercase text-encre-noire">
              {piece.titre}
            </h3>
            <p className="text-xs font-bold text-cordel-master-dark/75 mt-0.5">
              {interactiveCount} / {signalsList.length} signaux actifs au Défi Réflexe « Temps 1 »
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-black uppercase border-2 border-encre-noire rounded bg-white hover:bg-stone-100 cursor-pointer"
          >
            ✕ {t('common.close')}
          </button>
        </div>

        {signalsList.length === 0 ? (
          <div className="p-6 text-center bg-amber-50 border border-dashed border-amber-400 rounded-lg text-xs font-bold text-amber-950">
            {t('pedagogy.reflex.noTimedSignals')}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {signalsList.map((sig) => (
              <SignalReflexCard
                key={sig.signalId}
                signal={sig}
                presetData={effectivePreset}
                override={overrides[sig.signalId] || {}}
                onChangeOverride={(nextOv) => handleUpdateSignalOverride(sig.signalId, nextOv)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-dashed border-cordel-master-dark/20">
          <CordelButton variant="secondary" onClick={onClose} className="px-4 py-2 text-xs font-black uppercase">
            {t('common.cancel')}
          </CordelButton>
          <CordelButton
            variant="primary"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 text-xs font-black uppercase bg-[var(--color-cordel-vert)] text-white"
          >
            {saving ? t('common.saving') : `💾 ${t('common.save')}`}
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
