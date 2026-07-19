import React from 'react';

export default function EventBudgetEditor({
  budgetRecettes = [],
  onChangeRecettes,
  budgetDepenses = [],
  onChangeDepenses,
  disabled = false
}) {
  const addRecette = () => {
    const newItems = [...budgetRecettes, { id: Math.random().toString(36).substr(2, 9), intitule: '', montant: '' }];
    onChangeRecettes(newItems);
  };

  const removeRecette = (id) => {
    onChangeRecettes(budgetRecettes.filter(item => item.id !== id));
  };

  const updateRecette = (id, field, value) => {
    onChangeRecettes(budgetRecettes.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addDepense = () => {
    const newItems = [...budgetDepenses, { id: Math.random().toString(36).substr(2, 9), intitule: '', montant: '' }];
    onChangeDepenses(newItems);
  };

  const removeDepense = (id) => {
    onChangeDepenses(budgetDepenses.filter(item => item.id !== id));
  };

  const updateDepense = (id, field, value) => {
    onChangeDepenses(budgetDepenses.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const totalRecettes = budgetRecettes.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
  const totalDepenses = budgetDepenses.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
  const soldeNet = totalRecettes - totalDepenses;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recettes */}
        <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light/20 border border-dashed border-encre-noire/10 rounded">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-cordel-wood">📈 Recettes</span>
            <button
              type="button"
              onClick={addRecette}
              disabled={disabled}
              className="text-[9px] font-black uppercase bg-cordel-vert text-encre-noire border border-encre-noire px-2 py-0.5 rounded cursor-pointer hover:brightness-95 shadow-[1px_1px_0px_0px_#181716] disabled:opacity-50"
            >
              ➕ Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {budgetRecettes.length === 0 ? (
              <span className="text-[10px] italic opacity-60 text-center py-2">Aucune recette.</span>
            ) : (
              budgetRecettes.map((item, idx) => (
                <div key={item.id || idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.intitule}
                    placeholder="Ex : Prestation de rue"
                    onChange={(e) => updateRecette(item.id, 'intitule', e.target.value)}
                    disabled={disabled}
                    className="theme-input py-1 px-2 text-xs flex-1"
                  />
                  <input
                    type="number"
                    value={item.montant}
                    placeholder="Montant"
                    onChange={(e) => updateRecette(item.id, 'montant', e.target.value)}
                    disabled={disabled}
                    className="theme-input py-1 px-2 text-xs w-20 text-right"
                    min="0"
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={() => removeRecette(item.id)}
                    disabled={disabled}
                    className="text-[9px] font-black uppercase bg-cordel-rouge text-white border border-encre-noire p-1.5 rounded cursor-pointer hover:bg-red-800 shadow-[1px_1px_0px_0px_#181716] shrink-0 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dépenses */}
        <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light/20 border border-dashed border-encre-noire/10 rounded">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-cordel-wood">📉 Dépenses</span>
            <button
              type="button"
              onClick={addDepense}
              disabled={disabled}
              className="text-[9px] font-black uppercase bg-cordel-vert text-encre-noire border border-encre-noire px-2 py-0.5 rounded cursor-pointer hover:brightness-95 shadow-[1px_1px_0px_0px_#181716] disabled:opacity-50"
            >
              ➕ Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {budgetDepenses.length === 0 ? (
              <span className="text-[10px] italic opacity-60 text-center py-2">Aucune dépense.</span>
            ) : (
              budgetDepenses.map((item, idx) => (
                <div key={item.id || idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.intitule}
                    placeholder="Ex : Location de salle"
                    onChange={(e) => updateDepense(item.id, 'intitule', e.target.value)}
                    disabled={disabled}
                    className="theme-input py-1 px-2 text-xs flex-1"
                  />
                  <input
                    type="number"
                    value={item.montant}
                    placeholder="Montant"
                    onChange={(e) => updateDepense(item.id, 'montant', e.target.value)}
                    disabled={disabled}
                    className="theme-input py-1 px-2 text-xs w-20 text-right"
                    min="0"
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={() => removeDepense(item.id)}
                    disabled={disabled}
                    className="text-[9px] font-black uppercase bg-cordel-rouge text-white border border-encre-noire p-1.5 rounded cursor-pointer hover:bg-red-800 shadow-[1px_1px_0px_0px_#181716] shrink-0 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex flex-wrap gap-4 text-xs font-bold">
          <div>
            <span className="opacity-70">Total Recettes : </span>
            <span className="text-green-700 font-extrabold">{totalRecettes.toFixed(2)} €</span>
          </div>
          <div>
            <span className="opacity-70">Total Dépenses : </span>
            <span className="text-red-700 font-extrabold">{totalDepenses.toFixed(2)} €</span>
          </div>
        </div>
        <div className="text-xs font-bold self-end sm:self-auto">
          <span>Solde Net : </span>
          <span className={`font-black px-2 py-0.5 rounded border border-encre-noire/10 ${soldeNet >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-950/30' : 'bg-red-100 text-red-800 dark:bg-red-950/30'}`}>
            {soldeNet >= 0 ? '+' : ''}{soldeNet.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
}
