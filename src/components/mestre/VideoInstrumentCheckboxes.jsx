import React from 'react';

/**
 * Sélecteur multi-instruments par cases à cocher / puces Cordel pour une vidéo du répertoire.
 * Permet d'associer un ou plusieurs pupitres à une vidéo (ex: toutes les alfaias, ou l'accompagnement).
 *
 * @param {Array<string>} selectedInstruments - Liste des instruments actuellement cochés
 * @param {Array<string>} instrumentsList - Liste des instruments configurés dans l'association
 * @param {Function} onChange - Callback recevant le nouveau tableau d'instruments
 */
export default function VideoInstrumentCheckboxes({
  selectedInstruments = [],
  instrumentsList = [],
  onChange
}) {
  const currentList = Array.isArray(selectedInstruments) ? selectedInstruments : [];

  const handleToggle = (inst) => {
    if (currentList.includes(inst)) {
      onChange(currentList.filter((i) => i !== inst));
    } else {
      onChange([...currentList, inst]);
    }
  };

  const handleSelectAll = () => {
    onChange([...instrumentsList]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-encre-noire/15">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-cordel-master-dark/80">
            Instruments concernés :
          </span>
          {currentList.length === 0 ? (
            <span className="text-[8.5px] italic text-stone-500 font-medium">
              (Tous les pupitres / vue globale)
            </span>
          ) : (
            <span className="text-[8.5px] font-bold text-[var(--color-cordel-vert,#2d6a4f)]">
              ({currentList.length} sélectionné{currentList.length > 1 ? 's' : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer transition-colors"
            title="Associer à tous les instruments"
          >
            Tout cocher
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 cursor-pointer transition-colors"
            title="Décocher tous les instruments (vue globale)"
          >
            Décocher tout
          </button>
        </div>
      </div>

      {/* Puces cliquables Cordel pour chaque instrument */}
      <div className="flex items-center gap-1 flex-wrap">
        {instrumentsList.map((inst) => {
          const isChecked = currentList.includes(inst);
          return (
            <button
              key={inst}
              type="button"
              onClick={() => handleToggle(inst)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716] scale-102'
                  : 'bg-[#fdfaf2] hover:bg-white text-stone-700 border-encre-noire/25 shadow-2xs'
              }`}
            >
              <span className="text-[8px]">{isChecked ? '✓' : '○'}</span>
              <span>{inst}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
