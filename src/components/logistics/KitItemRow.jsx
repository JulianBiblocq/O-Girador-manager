import React from 'react';

/**
 * Ligne d'un article de mallette ou trousse collective régie avec ajustement de stock et statut.
 *
 * @param {Object} props
 */
export default function KitItemRow({ item, onUpdateItem, onRemoveItem, onSignalOrder }) {
  return (
    <div className="p-2 rounded bg-white border border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
      <div className="flex-1 min-w-0">
        <span className="font-bold text-xs text-neutral-900 block truncate">{item.nom}</span>
        <span className="text-[10px] text-neutral-500">
          Cible : <strong>{item.quantiteCible}</strong> • Réserve local : <strong>{item.stockReserveLocal || 0}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {/* Compteur rapide */}
        <div className="flex items-center border border-neutral-300 rounded bg-neutral-50">
          <button
            type="button"
            onClick={() => onUpdateItem(item.id, { quantiteActuelle: Math.max(0, Number(item.quantiteActuelle) - 1) })}
            className="px-1.5 py-0.5 text-xs font-bold hover:bg-neutral-200"
          >
            -
          </button>
          <span className="px-2 font-black text-xs min-w-[24px] text-center">{item.quantiteActuelle}</span>
          <button
            type="button"
            onClick={() => onUpdateItem(item.id, { quantiteActuelle: Number(item.quantiteActuelle) + 1 })}
            className="px-1.5 py-0.5 text-xs font-bold hover:bg-neutral-200"
          >
            +
          </button>
        </div>

        {/* Sélecteur de statut */}
        <button
          type="button"
          onClick={() => onUpdateItem(item.id, { statut: 'ok' })}
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            item.statut === 'ok' ? 'bg-emerald-200 text-emerald-900 border border-emerald-500' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => onUpdateItem(item.id, { statut: 'a_completer' })}
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            item.statut === 'a_completer' ? 'bg-amber-200 text-amber-900 border border-amber-500' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          À compléter
        </button>
        <button
          type="button"
          onClick={() => onUpdateItem(item.id, { statut: 'a_racheter' })}
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            item.statut === 'a_racheter' ? 'bg-red-200 text-red-900 border border-red-500' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          À racheter
        </button>

        {/* Action rapide commande */}
        {item.statut === 'a_racheter' && (
          <button
            type="button"
            onClick={() => onSignalOrder(item.nom)}
            className="px-1.5 py-0.5 rounded bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[10px] font-bold hover:opacity-90"
            title="Signaler pour commande groupée"
          >
            🛒 Commande
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 px-1 font-bold text-xs"
          title="Supprimer cet article"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
