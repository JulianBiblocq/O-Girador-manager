import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Barre de recherche, filtres et actions pour l'inventaire du matériel.
 *
 * @param {Object} props Propriétés du composant
 * @param {string} props.searchQuery Recherche textuelle
 * @param {Function} props.setSearchQuery Setter recherche
 * @param {string} props.filter Filtre de catégorie ('all' | 'association' | 'personal' | 'repair')
 * @param {Function} props.setFilter Setter filtre
 * @param {string} props.viewMode Mode d'affichage ('table' | 'cards')
 * @param {Function} props.setViewMode Setter mode d'affichage
 * @param {Function} props.onOpenAdd Callback d'ouverture du formulaire d'ajout
 * @param {Function} props.t Fonction de traduction
 */
export default function InventoryFilterBar({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  viewMode,
  setViewMode,
  onOpenAdd,
  t
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-cordel-bg border-2 border-encre-noire rounded-[6px] shadow-[2px_2px_0px_0px_#181716] select-none">
      {/* Recherche textuelle & Onglets de filtrage */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher un matériel..."
          className="p-1.5 px-3 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none focus:ring-2 focus:ring-cordel-master-dark min-w-[200px]"
        />

        <div className="flex items-center gap-1 bg-white/50 p-1 border border-encre-noire/20 rounded-[4px]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-cordel-wood text-white shadow-xs'
                : 'text-encre-noire/70 hover:text-encre-noire hover:bg-black/5'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFilter('association')}
            className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer ${
              filter === 'association'
                ? 'bg-cordel-wood text-white shadow-xs'
                : 'text-encre-noire/70 hover:text-encre-noire hover:bg-black/5'
            }`}
          >
            Association
          </button>
          <button
            type="button"
            onClick={() => setFilter('personal')}
            className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer ${
              filter === 'personal'
                ? 'bg-cordel-wood text-white shadow-xs'
                : 'text-encre-noire/70 hover:text-encre-noire hover:bg-black/5'
            }`}
          >
            Personnels
          </button>
          <button
            type="button"
            onClick={() => setFilter('repair')}
            className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer ${
              filter === 'repair'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-red-700/80 hover:text-red-900 hover:bg-red-50'
            }`}
          >
            🛠️ À réparer
          </button>
        </div>
      </div>

      {/* Mode d'affichage & Bouton d'ajout */}
      <div className="flex items-center gap-2 justify-end">
        <div className="flex items-center gap-1 bg-white border border-encre-noire rounded-[4px] p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 text-xs font-bold rounded ${viewMode === 'table' ? 'bg-cordel-bg border border-encre-noire' : 'text-neutral-500'}`}
            title="Vue Tableau"
          >
            📊 Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2 py-1 text-xs font-bold rounded ${viewMode === 'cards' ? 'bg-cordel-bg border border-encre-noire' : 'text-neutral-500'}`}
            title="Vue Cartes"
          >
            🎴 Cartes
          </button>
        </div>

        <CordelButton variant="vert" onClick={onOpenAdd} className="px-3 py-1.5 text-xs font-black">
          ➕ Ajouter un instrument
        </CordelButton>
      </div>
    </div>
  );
}
