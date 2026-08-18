import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

const INSTRUMENT_ICONS = {
  Alfaia: 'icones/alfaia.svg',
  Caixa: 'icones/caixa.svg',
  Agbê: 'icones/agbe.svg',
  Gonguê: 'icones/gongue.svg',
  Mineiro: 'icones/mineiro.svg',
  Apito: 'icones/apito.svg',
  Timbal: 'icones/timbal.svg',
  Autre: 'favicon.svg'
};

/**
 * Composant de présentation sous forme de carte individuelle pour un élément d'inventaire.
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.item Élément d'inventaire
 * @param {Object} props.usersMap Carte associant l'ID membre à son Nom Complet
 * @param {Function} props.onEdit Callback de modification
 * @param {Function} props.onDelete Callback de suppression
 * @param {Function} props.onToggleBorrow Status toggle (En stock / Emprunté)
 * @param {string} props.kitCompletionText Texte formaté du statut du kit
 * @param {Function} props.t Fonction de traduction
 */
export default function InventoryItemCard({ item, usersMap, onEdit, onDelete, onToggleBorrow, kitCompletionText, t }) {
  const iconPath = INSTRUMENT_ICONS[item.type] || 'favicon.svg';

  const getEtatBadgeClass = (etat) => {
    switch (etat) {
      case 'Neuf': return 'bg-[#2d6a4f]/15 text-[#2d6a4f] border-[#2d6a4f]/30 font-black';
      case 'Bon': return 'bg-[#2d6a4f]/10 text-[#2d6a4f] border-[#2d6a4f]/20 font-bold';
      case 'Moyen': return 'bg-[#c05621]/15 text-[#c05621] border-[#c05621]/30 font-bold';
      case 'À réparer': return 'bg-[#8b2a1a]/15 text-[#8b2a1a] border-[#8b2a1a]/30 font-black';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const isBorrowed = item.status === 'Emprunté';
  const borrowerName = item.borrowedBy ? usersMap[item.borrowedBy] || 'Emprunteur inconnu' : '';

  return (
    <CordelCard className="p-3.5 flex flex-col justify-between gap-3 text-left relative group">
      {/* En-tête de carte : Icône, Titre et Badges */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[6px] bg-cordel-bg border-2 border-encre-noire flex items-center justify-center p-1.5 shrink-0 shadow-xs">
          <img src={iconPath} alt={item.type} className="w-full h-full object-contain dark:invert" />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-sm text-encre-noire truncate leading-tight">
              {item.nom}
            </h4>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getEtatBadgeClass(item.etat)}`}>
              {item.etat}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-cordel-wood">
            <span className="bg-cordel-bg-light px-2 py-0.5 rounded border border-cordel-master-dark/15">
              🏷️ {item.type}
            </span>
            <span className="bg-cordel-bg-light px-2 py-0.5 rounded border border-cordel-master-dark/15">
              📦 {item.proprietaire}
            </span>
            {item.localisationPhysique && (
              <span className="bg-cordel-bg-light px-2 py-0.5 rounded border border-cordel-master-dark/15">
                📍 {item.localisationPhysique}
              </span>
            )}
            {kitCompletionText && kitCompletionText !== "-" && (
              <span className="bg-cordel-bg-light px-2 py-0.5 rounded border border-cordel-master-dark/15">
                🎒 Kit: {kitCompletionText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statut d'emprunt */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 text-xs flex items-center justify-between gap-2">
        {isBorrowed ? (
          <span className="text-[#c05621] bg-[#c05621]/10 px-2 py-1 rounded border border-[#c05621]/30 font-extrabold text-[10.5px]">
            🤝 Emprunté par : <strong>{borrowerName}</strong>
          </span>
        ) : (
          <span className="text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-1 rounded border border-[#2d6a4f]/30 font-bold text-[10.5px]">
            ✅ En stock
          </span>
        )}

        {/* Action Rapide Modifier/Supprimer */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1 px-2 text-xs font-bold bg-cordel-bg hover:bg-neutral-200 border border-encre-noire rounded cursor-pointer"
            title="Éditer"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1 px-2 text-xs font-bold bg-[#8b2a1a]/10 hover:bg-[#8b2a1a] text-[#8b2a1a] hover:text-white border border-[#8b2a1a]/40 rounded cursor-pointer transition-colors"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </CordelCard>
  );
}
