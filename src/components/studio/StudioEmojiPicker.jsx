import React, { useState } from 'react';
import { EMOJI_CATEGORIES } from '../../config/studioSocialConfig';

export { EMOJI_CATEGORIES };

/**
 * Composant StudioEmojiPicker
 * Sélecteur compact d'émoticônes par catégories avec onglets miniaturisés.
 *
 * @param {Object} props
 * @param {Function} props.onSelectEmoji Callback lors du choix d'un emoji
 * @param {boolean} [props.disabled=false] État de désactivation
 */
export default function StudioEmojiPicker({ onSelectEmoji, disabled = false }) {
  const [activeCategory, setActiveCategory] = useState('nature');

  const currentCategory = EMOJI_CATEGORIES.find((cat) => cat.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Barre des onglets de catégories miniaturisés */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                isActive
                  ? 'bg-cordel-wood text-white border-encre-noire shadow-xs scale-102'
                  : 'bg-white/80 hover:bg-white text-cordel-master-dark border-encre-noire/20'
              } disabled:opacity-40`}
              title={cat.label}
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Rangée d'émoticônes de la catégorie active */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-0.5">
        {currentCategory.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectEmoji(emoji)}
            className="p-1 text-sm sm:text-base hover:scale-125 active:scale-95 transition-transform cursor-pointer rounded hover:bg-white/80 shrink-0 select-none disabled:opacity-40"
            title={`Insérer ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
