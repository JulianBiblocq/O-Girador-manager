import React from 'react';

/**
 * EventRepertoireItemCard - Carte individuelle pour un morceau du programme
 * Affiche le titre, les badges de disciplines, l'action de retrait et la saisie de note d'intention.
 */
export default function EventRepertoireItemCard({
  item,
  badges = [],
  disabled = false,
  onRemove,
  onNoteChange
}) {
  const itemId = item.pieceId || item.id;

  return (
    <div className="p-2.5 rounded border border-encre-noire/20 bg-white shadow-2xs flex flex-col gap-1.5 text-xs">
      {/* Ligne 1 : Titre, Badges disciplines et Bouton Retirer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap truncate">
          <span className="font-extrabold text-encre-noire text-sm truncate">
            {item.titre}
          </span>
          <div className="flex items-center gap-1">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${b.cls}`}
              >
                <span>{b.emoji}</span>
                <span className="hidden sm:inline">{b.label}</span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(itemId)}
          disabled={disabled}
          className="text-[10px] text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline font-black cursor-pointer shrink-0"
          title="Retirer ce morceau du programme"
        >
          ✕ Retirer
        </button>
      </div>

      {/* Ligne 2 : Saisie de la note d'intention personnalisée */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark/70">
          🎯 Note d'intention / Focus de travail
        </label>
        <input
          type="text"
          value={item.notes || ''}
          onChange={(e) => onNoteChange(itemId, e.target.value)}
          disabled={disabled}
          placeholder="Ex : Bien travailler le chant cette semaine, break à 95 BPM..."
          className="theme-input text-xs py-1 px-2 bg-[#fdfaf2] border-dashed border-encre-noire/25 focus:bg-white"
        />
      </div>
    </div>
  );
}
