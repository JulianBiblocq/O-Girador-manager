import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import { XiloCaixa } from '../../XiloIcons';

export default function AccessoriesKitsBlock({ formData, handleChange, saving, t }) {
  const [newKitPupitre, setNewKitPupitre] = useState('');
  const [newKitAccessories, setNewKitAccessories] = useState('');

  const kits = formData.logisticsKits || [];

  // Calcul des pupitres / instruments disponibles (identique à InstrumentsCatalogBlock)
  const { instrumentsDisponibles = [], linkedInstruments = [] } = formData;
  const rawPupitres = [
    'Mestre',
    ...linkedInstruments.map(g => {
      const instrumentsArray = g.instruments || (Array.isArray(g) ? g : [g.inst1, g.inst2]);
      return g.name ? g.name.trim() : instrumentsArray.join(' + ');
    }).filter(Boolean),
    ...instrumentsDisponibles.filter(inst => {
      const isInLinked = linkedInstruments.some(g => {
        const instrumentsArray = g.instruments || (Array.isArray(g) ? g : [g.inst1, g.inst2]);
        return instrumentsArray.includes(inst);
      });
      return !isInLinked;
    })
  ];

  const seen = new Set();
  const allPupitres = rawPupitres.filter(p => {
    const lower = p.toLowerCase().trim();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  const handleAddKit = () => {
    if (!newKitPupitre.trim() || !newKitAccessories.trim()) return;
    
    // Split accessories by comma and clean up
    const accessoriesArray = newKitAccessories
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (accessoriesArray.length === 0) return;

    const newKit = {
      pupitre: newKitPupitre.trim(),
      accessories: accessoriesArray
    };

    const newKits = [...kits, newKit];
    handleChange('logisticsKits', newKits);
    
    setNewKitPupitre('');
    setNewKitAccessories('');
  };

  const handleRemoveKit = (indexToRemove) => {
    const newKits = kits.filter((_, idx) => idx !== indexToRemove);
    handleChange('logisticsKits', newKits);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-cordel-bg text-left select-none">
      <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase flex items-center mb-1">
        <XiloCaixa size={16} className="inline mr-2" /> Kits d'Accessoires (Logistique)
      </h3>
      <p className="text-[10px] text-cordel-master-dark opacity-80 mb-4 leading-relaxed font-semibold">
        Associez des listes d'accessoires (ex: Housses, Sangles, Baguettes) à un type d'instrument (Pupitre). Ces accessoires apparaîtront dynamiquement sous forme de checklist dans le profil des membres jouant cet instrument.
      </p>

      <div className="flex flex-col gap-3">
        {kits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kits.map((kit, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-white/50 border border-dashed border-cordel-master-dark/30 rounded">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-cordel-wood">{kit.pupitre}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKit(index)}
                    disabled={saving}
                    className="text-[10px] text-red-600 hover:text-red-800 font-bold ml-2 cursor-pointer disabled:opacity-50"
                  >
                    🗑️ Retirer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {kit.accessories.map((acc, accIdx) => (
                    <span key={accIdx} className="bg-cordel-bg-light px-2 py-0.5 rounded text-[9px] font-bold text-encre-noire border border-encre-noire/20 shadow-sm">
                      {acc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-cordel-bg-light/50 rounded border border-dashed border-cordel-master-dark/20 text-xs text-cordel-master-dark opacity-70 italic font-bold">
            Aucun kit d'accessoires configuré.
          </div>
        )}

        <div className="mt-2 pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Pupitre / Instrument Principal
            </label>
            <select
              value={newKitPupitre}
              onChange={(e) => setNewKitPupitre(e.target.value)}
              className="theme-input text-xs py-1.5 px-2 bg-white/80 cursor-pointer"
              disabled={saving}
            >
              <option value="">-- Choisir un instrument --</option>
              {allPupitres.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2] w-full flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Accessoires du kit (Séparés par des virgules)
            </label>
            <input
              type="text"
              value={newKitAccessories}
              onChange={(e) => setNewKitAccessories(e.target.value)}
              placeholder="Ex: Housse de transport, Sangle, Baguettes"
              className="theme-input text-xs py-1.5 px-2 bg-white/80"
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKit();
                }
              }}
            />
          </div>
          <CordelButton
            type="button"
            variant="default"
            disabled={saving || !newKitPupitre.trim() || !newKitAccessories.trim()}
            onClick={handleAddKit}
            className="text-[10px] font-black uppercase py-1.5 px-4 h-[30px]"
          >
            + Ajouter Kit
          </CordelButton>
        </div>
      </div>
    </CordelCard>
  );
}
