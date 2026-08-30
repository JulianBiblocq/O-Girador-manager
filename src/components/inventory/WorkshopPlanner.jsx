import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export default function WorkshopPlanner({ inventoryParts, instrumentModels }) {
  const { t } = useTranslation();
  const [selectedModelId, setSelectedModelId] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(1);
  
  // Custom multipliers if a model part needs more than 1 per instrument (e.g. 2 cerclages)
  const [partMultipliers, setPartMultipliers] = useState({});

  const selectedModel = useMemo(() => {
    return instrumentModels.find(m => m.id === selectedModelId);
  }, [selectedModelId, instrumentModels]);

  const handleMultiplierChange = (partId, value) => {
    const val = parseInt(value, 10);
    setPartMultipliers(prev => ({
      ...prev,
      [partId]: isNaN(val) || val < 1 ? 1 : val
    }));
  };

  const analysis = useMemo(() => {
    if (!selectedModel || !selectedModel.parts) return null;

    const result = [];
    const globalMissingMats = new Set();
    const globalMissingTools = new Set();

    selectedModel.parts.forEach(part => {
      // Required quantity for this part
      const multiplier = partMultipliers[part.id] || 1;
      const requiredQty = multiplier * targetQuantity;

      // Check stock
      // We look for parts in inventory that match this modelId and partId, and are 'En stock'
      const inStockParts = inventoryParts.filter(
        ip => ip.modelId === selectedModel.id && ip.partId === part.id && ip.status === 'En stock'
      );
      const stockQty = inStockParts.length;

      const missingQty = Math.max(0, requiredQty - stockQty);

      if (missingQty > 0) {
        (part.materiels || []).forEach(m => globalMissingMats.add(m));
        (part.outils || []).forEach(o => globalMissingTools.add(o));
      }

      result.push({
        part,
        multiplier,
        requiredQty,
        stockQty,
        missingQty,
        inStockParts
      });
    });

    return {
      partDetails: result,
      missingMaterials: Array.from(globalMissingMats),
      missingTools: Array.from(globalMissingTools),
      totalMissingParts: result.reduce((acc, curr) => acc + curr.missingQty, 0)
    };
  }, [selectedModel, targetQuantity, partMultipliers, inventoryParts]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Configuration */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-[#faf8f5]">
        <h2 className="font-cactus font-black text-2xl text-cordel-wood mb-4 border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
          🛠️ Planificateur d'Atelier
        </h2>
        
        <p className="text-sm text-black/80 mb-6 font-medium leading-relaxed max-w-3xl">
          Sélectionnez un modèle d'instrument à fabriquer et la quantité souhaitée.
          Le système analysera votre stock de pièces détachées et générera automatiquement
          la liste du matériel et des outils à emporter pour fabriquer les pièces manquantes.
        </p>

        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Modèle d'instrument cible
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                setSelectedModelId(e.target.value);
                setPartMultipliers({});
              }}
              className="theme-input font-bold py-2 bg-white"
            >
              <option value="">-- Choisir un modèle --</option>
              {instrumentModels.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-32">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Quantité à créer
            </label>
            <input
              type="number"
              min="1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="theme-input font-bold py-2 bg-white text-center"
            />
          </div>
        </div>
      </CordelCard>

      {/* Analyse Result */}
      {analysis && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Tableau des pièces */}
          <div className="flex-1">
            <CordelCard variant="default" className="p-0 overflow-hidden shadow-[4px_4px_0px_0px_rgba(24,23,22,0.15)] border-2 border-encre-noire">
              <div className="bg-cordel-bg-light p-3 border-b-2 border-encre-noire">
                <h3 className="font-cactus font-black text-xl text-black">
                  Analyse des Pièces ({selectedModel.nom})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse bg-white min-w-[600px]">
                  <thead className="bg-stone-100 text-[10px] uppercase tracking-wider text-cordel-master-dark border-b border-encre-noire/20">
                    <tr>
                      <th className="p-3 font-black">Pièce du modèle</th>
                      <th className="p-3 font-black text-center" title="Quantité nécessaire par instrument">Qté / Inst.</th>
                      <th className="p-3 font-black text-center bg-blue-50">Total Requis</th>
                      <th className="p-3 font-black text-center bg-green-50">En Stock</th>
                      <th className="p-3 font-black text-center bg-red-50">À Fabriquer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-encre-noire/20 font-medium">
                    {analysis.partDetails.map((row) => (
                      <tr key={row.part.id} className="hover:bg-black/5 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-encre-noire">{row.part.nom}</div>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.multiplier}
                            onChange={(e) => handleMultiplierChange(row.part.id, e.target.value)}
                            className="w-12 text-center border-b border-encre-noire/30 bg-transparent text-xs font-bold mx-auto focus:outline-none focus:border-cordel-wood"
                          />
                        </td>
                        <td className="p-3 text-center bg-blue-50/50 font-black text-blue-900">
                          {row.requiredQty}
                        </td>
                        <td className="p-3 text-center bg-green-50/50">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                            row.stockQty >= row.requiredQty ? 'bg-green-200 text-green-900' : 'text-green-700'
                          }`}>
                            {row.stockQty}
                          </span>
                        </td>
                        <td className="p-3 text-center bg-red-50/50">
                          {row.missingQty > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-red-200 text-red-900 font-black text-xs">
                              {row.missingQty} manquante(s)
                            </span>
                          ) : (
                            <span className="text-stone-400 text-xs italic">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CordelCard>
          </div>

          {/* Liste de courses */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <CordelCard variant="default" className="p-4 bg-cordel-wood text-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_rgba(24,23,22,1)]">
              <h3 className="font-cactus font-black text-2xl mb-4 text-center border-b-2 border-dashed border-[#fdfaf2]/30 pb-2">
                Liste de Courses
              </h3>
              
              {analysis.totalMissingParts === 0 ? (
                <div className="text-center py-6 text-[#fdfaf2]/80 font-bold italic text-sm">
                  🎉 Vous avez déjà toutes les pièces en stock pour assembler {targetQuantity} instrument(s) ! Pas d'atelier de fabrication nécessaire.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-widest font-black text-cordel-ocre mb-2 flex items-center gap-2">
                      <span>🧵</span> Matériel requis
                    </h4>
                    {analysis.missingMaterials.length > 0 ? (
                      <ul className="list-disc pl-4 text-sm font-semibold space-y-1">
                        {analysis.missingMaterials.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    ) : (
                      <span className="text-xs italic opacity-70">Aucun matériel listé.</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[11px] uppercase tracking-widest font-black text-cordel-ocre mb-2 flex items-center gap-2">
                      <span>🔨</span> Outils nécessaires
                    </h4>
                    {analysis.missingTools.length > 0 ? (
                      <ul className="list-disc pl-4 text-sm font-semibold space-y-1">
                        {analysis.missingTools.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    ) : (
                      <span className="text-xs italic opacity-70">Aucun outil listé.</span>
                    )}
                  </div>
                </div>
              )}
            </CordelCard>
          </div>

        </div>
      )}
    </div>
  );
}
