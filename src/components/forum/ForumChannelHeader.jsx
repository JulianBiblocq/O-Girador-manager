import React from 'react';
import CordelButton from '../CordelButton';

/**
 * En-tête de navigation du forum (Sélection du salon, recherche textuelle et création de sujet).
 *
 * @param {Object} props Propriétés du composant
 * @param {Array} props.channels Liste des salons disponibles
 * @param {string} props.activeChannelId Salon actuellement sélectionné
 * @param {Function} props.onSelectChannel Setter du salon sélectionné
 * @param {string} props.searchQuery Recherche textuelle
 * @param {Function} props.setSearchQuery Setter de recherche textuelle
 * @param {boolean} props.hasWriteAccess Indique si le membre a les droits d'écriture dans le salon actif
 * @param {Function} props.onOpenNewThread Callback d'ouverture de la modale de nouveau sujet
 * @param {Function} props.t Fonction de traduction
 */
export default function ForumChannelHeader({
  channels,
  activeChannelId,
  onSelectChannel,
  searchQuery,
  setSearchQuery,
  hasWriteAccess,
  onOpenNewThread,
  t
}) {
  const activeChannel = channels.find(c => c.id === activeChannelId) || { name: 'Général', isReadOnly: false };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-cordel-bg border-2 border-encre-noire rounded-[6px] shadow-[2px_2px_0px_0px_#181716] select-none text-left">
      {/* Salons et recherche */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher dans les sujets..."
          className="p-1.5 px-3 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:ring-2 focus:ring-cordel-master-dark focus:outline-none min-w-[200px]"
        />

        {/* Navigation Onglets Salons */}
        <div className="flex items-center gap-1 bg-white/50 p-1 border border-encre-noire/20 rounded-[4px] overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => onSelectChannel('all')}
            className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
              activeChannelId === 'all'
                ? 'bg-cordel-wood text-white shadow-xs'
                : 'text-encre-noire/70 hover:text-encre-noire hover:bg-black/5'
            }`}
          >
            Tous les salons
          </button>
          {channels.map((chan) => (
            <button
              key={chan.id}
              type="button"
              onClick={() => onSelectChannel(chan.id)}
              className={`px-2.5 py-1 text-[10.5px] font-black uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
                activeChannelId === chan.id
                  ? 'bg-cordel-wood text-white shadow-xs'
                  : 'text-encre-noire/70 hover:text-encre-noire hover:bg-black/5'
              }`}
            >
              💬 {chan.name}
            </button>
          ))}
        </div>
      </div>

      {/* Action : Créer un nouveau sujet */}
      <div className="flex items-center gap-2 justify-end">
        {hasWriteAccess ? (
          <CordelButton variant="vert" onClick={onOpenNewThread} className="px-3.5 py-1.5 text-xs font-black">
            ✍️ Nouveau Sujet
          </CordelButton>
        ) : (
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-300">
            🔒 Salon en lecture seule
          </span>
        )}
      </div>
    </div>
  );
}
