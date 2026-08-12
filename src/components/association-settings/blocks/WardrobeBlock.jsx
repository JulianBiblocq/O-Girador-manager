import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

export default function WardrobeBlock({ formData, handleChange, saving }) {
  const { dressCodes = [] } = formData;
  const [newDressCodeName, setNewDressCodeName] = useState('');
  const [newDressCodeIncluded, setNewDressCodeIncluded] = useState('');

  const handleAddDressCode = () => {
    if (!newDressCodeName.trim()) return;
    const currentList = dressCodes || [];
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: newDressCodeName.trim(),
      included: newDressCodeIncluded.trim()
    };
    handleChange('dressCodes', [...currentList, newItem]);
    setNewDressCodeName('');
    setNewDressCodeIncluded('');
  };

  const handleRemoveDressCode = (id) => {
    const currentList = dressCodes || [];
    const updated = currentList.filter(item => item.id !== id);
    handleChange('dressCodes', updated);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        👔 Vestiaire : Tenues types (Marque Blanche)
      </h3>
      
      <div className="flex flex-col gap-4 text-left">
        <span className="text-[10px] italic opacity-85">
          Définissez les tenues officielles de votre association. Les adhérents pourront se référer à ces codes vestimentaires.
        </span>

        <div className="flex flex-col gap-2.5">
          {dressCodes.length === 0 ? (
            <span className="italic opacity-60 text-xs text-center py-2">
              Aucune tenue type configurée pour le moment.
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {dressCodes.map((dc) => (
                <div key={dc.id} className="flex justify-between items-center bg-white/40 dark:bg-black/25 p-2.5 rounded border border-dashed border-cordel-master-dark/15 text-xs font-bold">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-cordel-wood font-extrabold uppercase text-[10px]">{dc.name}</span>
                    <span className="text-[10px] opacity-75 font-semibold">Pièces : {dc.included || "Aucune spécifiée"}</span>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleRemoveDressCode(dc.id)}
                    className="text-red-600 hover:text-red-800 font-bold ml-3 cursor-pointer text-sm"
                    title="Supprimer cette tenue"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1">
          <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[9px]">
            ➕ Ajouter une nouvelle tenue type
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Nom de la tenue
              </label>
              <input
                type="text"
                disabled={saving}
                value={newDressCodeName}
                onChange={(e) => setNewDressCodeName(e.target.value)}
                placeholder="ex: Costume Blanc"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Pièces incluses
              </label>
              <input
                type="text"
                disabled={saving}
                value={newDressCodeIncluded}
                onChange={(e) => setNewDressCodeIncluded(e.target.value)}
                placeholder="ex: Pantalon, Chemise, Ceinture"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>

          <div className="flex justify-end mt-1">
            <button
              type="button"
              disabled={saving || !newDressCodeName.trim()}
              onClick={handleAddDressCode}
              className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer disabled:opacity-50"
            >
              Ajouter la tenue
            </button>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
