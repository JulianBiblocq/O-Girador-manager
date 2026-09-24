import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelButton from '../CordelButton';
import SignalReflexCard from './reflex/SignalReflexCard';
import { calculatePauseTimes } from '../../utils/reflexGameUtils';
import { cleanFirestorePayload } from '../../utils/firestoreUtils';

/**
 * Inspecteur Mestre & Arbitrage des Surcharges du Défi Réflexe « Temps 1 ».
 * Permet au Mestre de configurer le mode de chaque signal (interactif vs simple repère),
 * de prévisualiser les tablatures et d'enregistrer les surcharges dans signalOverrides.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modale
 * @param {Function} props.onClose - Fermeture
 * @param {Object} props.piece - Morceau concerné du Répertoire
 * @param {Object} props.presetData - Preset associé
 * @param {string} props.groupId - Identifiant du groupe
 * @param {Function} [props.onSaveSuccess] - Callback de succès
 */
export default function PieceReflexConfigModal({
  isOpen,
  onClose,
  piece,
  presetData,
  groupId,
  onSaveSuccess
}) {
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Synchronisation des surcharges existantes
  useEffect(() => {
    if (piece?.signalOverrides) {
      setOverrides({ ...piece.signalOverrides });
    } else {
      setOverrides({});
    }
  }, [piece]);

  // Points d'arrêts calculés
  const pausePoints = useMemo(() => {
    if (!piece) return [];
    return calculatePauseTimes(piece, presetData);
  }, [piece, presetData]);

  // Mise à jour d'un signal individuel
  const handleUpdateSignalOverride = (signalId, newOverride) => {
    setOverrides((prev) => ({
      ...prev,
      [signalId]: newOverride
    }));
  };

  // Sauvegarde des réglages dans associations/{groupId}/repertoire/{piece.id}
  const handleSave = async () => {
    if (!groupId || !piece?.id) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      const payload = {
        signalOverrides: overrides,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(pieceRef, cleanFirestorePayload(payload));

      if (typeof onSaveSuccess === 'function') {
        onSaveSuccess({
          ...piece,
          signalOverrides: overrides
        });
      }
      onClose();
    } catch (err) {
      console.error('[PieceReflexConfigModal] Erreur de sauvegarde des surcharges :', err);
      setErrorMsg("Impossible d'enregistrer les réglages. Veuillez vérifier votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl border-2 border-encre-noire overflow-hidden text-left">
        {/* En-tête Cordel */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider flex items-center gap-2">
                <span>Arbitrage Mestre — Défi Réflexe « Temps 1 »</span>
                <span className="text-[10px] font-bold text-encre-noire/60 lowercase">
                  — {piece.titre}
                </span>
              </h2>
              <p className="text-[10px] font-bold text-encre-noire/70">
                Configurez l'arrêt au temps 1 et verrouillez les pièges rythmiques pour vos élèves
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center hover:bg-red-700 cursor-pointer shadow-xs"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--color-cordel-rouge,#8b2a1a)] rounded text-xs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {pausePoints.length === 0 ? (
            <div className="p-8 text-center bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded-lg flex flex-col items-center gap-2">
              <span className="text-3xl">🖐️</span>
              <p className="text-sm font-black text-cordel-wood">
                Aucun signal du Mestre n'a été répertorié sur ce morceau.
              </p>
              <p className="text-xs text-encre-noire/70 max-w-md">
                Pour activer le Défi Réflexe « Temps 1 », configurez d'abord les signaux du Mestre avec leurs numéros de mesure en modifiant ce morceau ou en le reliant à un Preset complet du Séquenceur.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase text-cordel-master-dark">
                  Signaux &amp; Conventions ({pausePoints.length})
                </span>
                <span className="text-[10px] font-bold text-encre-noire/60">
                  {pausePoints.filter(p => {
                    const ov = overrides[p.signalId] || {};
                    return ov.isInteractive !== undefined ? ov.isInteractive : true;
                  }).length} interactif(s)
                </span>
              </div>

              {pausePoints.map((sig) => (
                <SignalReflexCard
                  key={sig.signalId}
                  signal={sig}
                  presetData={presetData}
                  override={overrides[sig.signalId] || {}}
                  onChangeOverride={(newOv) => handleUpdateSignalOverride(sig.signalId, newOv)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pied de modale avec validation */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-t-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-black uppercase text-encre-noire/70 hover:text-encre-noire transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <CordelButton
            type="button"
            variant="vert"
            disabled={saving || pausePoints.length === 0}
            onClick={handleSave}
            className="py-1.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="animate-spin inline-block">🔄</span>
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Enregistrer les Réglages Mestre</span>
              </>
            )}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
