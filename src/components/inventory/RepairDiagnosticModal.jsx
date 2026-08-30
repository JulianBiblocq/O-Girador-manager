import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

export default function RepairDiagnosticModal({
  instrument,
  inventoryParts,
  instrumentModels = [],
  onClose,
  t
}) {
  const [replacingPartId, setReplacingPartId] = useState(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [saving, setSaving] = useState(false);

  // Les pièces actuellement montées sur l'instrument
  const currentParts = inventoryParts.filter(p => (instrument.nomenclature || []).includes(p.id));

  // Ouvre le mode remplacement pour une pièce
  const handleStartReplace = (partId) => {
    setReplacingPartId(partId);
    setSelectedReplacementId('');
  };

  // Annule le mode remplacement
  const handleCancelReplace = () => {
    setReplacingPartId(null);
    setSelectedReplacementId('');
  };

  // Exécute le remplacement
  const handleConfirmReplace = async (oldPart) => {
    if (!selectedReplacementId) return;
    setSaving(true);
    try {
      // 1. Mettre à jour l'ancienne pièce (Défectueuse / Au rebut)
      await updateDoc(doc(db, 'inventory_parts', oldPart.id), {
        status: 'Au rebut',
        etat: 'À réparer',
        instrumentAssocie_id: null
      });

      // 2. Mettre à jour la nouvelle pièce (Assemblé)
      await updateDoc(doc(db, 'inventory_parts', selectedReplacementId), {
        status: 'Assemblé',
        instrumentAssocie_id: instrument.id
      });

      // 3. Mettre à jour l'instrument (Nomenclature)
      const newNomenclature = (instrument.nomenclature || [])
        .filter(id => id !== oldPart.id)
        .concat(selectedReplacementId);

      await updateDoc(doc(db, 'inventory', instrument.id), {
        nomenclature: newNomenclature
      });

      handleCancelReplace();
    } catch (err) {
      console.error("Erreur lors du remplacement :", err);
      alert("Une erreur est survenue lors de l'échange de pièces.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl bg-cordel-bg p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
        >
          <XiloClose size={12} />
        </button>

        <h3 className="font-extrabold text-sm text-cordel-wood uppercase tracking-wider mb-2 flex items-center gap-2 border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
          🩺 Diagnostic & Réparation : {instrument.nom}
        </h3>
        
        <p className="text-xs opacity-80 mb-4 mt-2">
          Cet instrument est en réparation. Inspectez sa nomenclature ci-dessous et signalez les pièces défectueuses. Vous pouvez piocher dans le stock de pièces détachées pour effectuer un remplacement direct.
        </p>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {currentParts.length === 0 ? (
            <div className="p-4 text-center bg-white/40 border border-dashed border-encre-noire/20 rounded">
              <span className="text-[10px] font-bold italic opacity-60">Cet instrument n'a aucune pièce structurelle enregistrée dans sa nomenclature.</span>
            </div>
          ) : (
            currentParts.map(part => {
              const isReplacing = replacingPartId === part.id;
              // Pièces compatibles en stock
              const compatibleStock = inventoryParts.filter(
                p => p.status === 'En stock' && p.typePiece === part.typePiece
              );

              return (
                <div key={part.id} className="p-3 border border-encre-noire/20 bg-white/70 rounded shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-encre-noire">{part.nom}</span>
                      <span className="px-1.5 py-0.5 bg-cordel-bg-light border border-encre-noire/30 rounded text-[9px] font-black uppercase text-cordel-master-dark">
                        {part.typePiece}
                      </span>
                      {part.modelId && (
                        <span className="px-1.5 py-0.5 bg-blue-100 border border-blue-300 rounded text-[9px] font-black uppercase text-blue-700">
                          {instrumentModels.find(m => m.id === part.modelId)?.nom || 'Modèle inconnu'}
                        </span>
                      )}
                    </div>
                    {!isReplacing && (
                      <button
                        onClick={() => handleStartReplace(part.id)}
                        disabled={saving}
                        className="text-[9px] font-black uppercase tracking-wider bg-cordel-rouge/10 text-cordel-rouge px-3 py-1 border border-cordel-rouge/30 rounded hover:bg-cordel-rouge/20 transition-colors cursor-pointer"
                      >
                        ⚠️ Remplacer
                      </button>
                    )}
                  </div>

                  {isReplacing && (
                    <div className="mt-2 p-3 bg-cordel-bg border-l-4 border-cordel-wood rounded shadow-inner flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase text-cordel-wood">Pièce de rechange :</span>
                      
                      {compatibleStock.length === 0 ? (
                        <div className="text-[10px] italic text-cordel-rouge">
                          Aucune pièce de type "{part.typePiece}" disponible en stock.
                        </div>
                      ) : (
                        <select
                          value={selectedReplacementId}
                          onChange={(e) => setSelectedReplacementId(e.target.value)}
                          className="theme-input text-xs font-bold py-1.5 w-full bg-white"
                        >
                          <option value="">-- Sélectionner une pièce en stock --</option>
                          {compatibleStock.map(sp => {
                            const modelName = sp.modelId ? (instrumentModels.find(m => m.id === sp.modelId)?.nom || 'Inconnu') : '';
                            return (
                              <option key={sp.id} value={sp.id}>
                                {sp.nom} (État : {sp.etat}) {modelName ? ` - [${modelName}]` : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}

                      <div className="flex justify-end gap-2 mt-1">
                        <CordelButton variant="default" onClick={handleCancelReplace} disabled={saving} className="px-3 py-1 text-[10px]">
                          Annuler
                        </CordelButton>
                        {compatibleStock.length > 0 && (
                          <CordelButton 
                            variant="ocre" 
                            onClick={() => handleConfirmReplace(part)} 
                            disabled={saving || !selectedReplacementId} 
                            className="px-3 py-1 text-[10px] font-bold"
                          >
                            {saving ? "..." : "Confirmer l'échange"}
                          </CordelButton>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </CordelCard>
    </div>
  );
}
