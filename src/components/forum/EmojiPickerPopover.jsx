import React, { useState, useRef, useEffect } from 'react';

/**
 * Liste des émoticônes d'accès rapide (les plus fréquents dans les échanges et le contexte associatif/percussions).
 */
export const QUICK_EMOJIS = ['👍', '❤️', '👏', '😂', '🔥', '🎉', '🥁', '🎶', '✨', '🙏', '💪', '👋'];

/**
 * Catégories complètes d'émoticônes légers (Unicode natif sans aucune dépendance lourde).
 */
export const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Émotions',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '😎', '🤩', '🥳',
      '🤔', '🤫', '🤐', '😴', '😢', '😭', '😱', '😬', '🙄', '😮'
    ]
  },
  {
    id: 'hands',
    name: 'Gestes & Mains',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙏', '💪', '✌️', '🤝', '✋', '👊', '🤙',
      '👉', '👈', '☝️', '🖐️', '🤞', '🤟', '🫶', '🫡', '👋', '✍️'
    ]
  },
  {
    id: 'music',
    name: 'Musique & Rythme',
    icon: '🥁',
    emojis: [
      '🥁', '🪘', '🎶', '🎵', '🎸', '🔔', '🎺', '🪗', '🎤', '🎧',
      '🕺', '💃', '🎉', '🎊', '✨', '☀️', '🌴', '🪇', '🇧🇷', '🎈'
    ]
  },
  {
    id: 'symbols',
    name: 'Cœurs & Symboles',
    icon: '❤️',
    emojis: [
      '❤️', '💛', '💚', '🧡', '🤍', '🤎', '🖤', '💔', '💥', '🔥',
      '⭐', '🌟', '✨', '💯', '📌', '📍', '💬', '🚀', '⚠️', '⏳',
      '💡', '🎯', '📢', '✅', '❌'
    ]
  }
];

/**
 * Petite barre horizontale de sélection rapide d'émoticônes.
 * Permet d'insérer un émoji en 1 clic sans ouvrir de fenêtre supplémentaire.
 */
export function EmojiQuickRow({ onSelectEmoji, onOpenFullPicker = null, className = '' }) {
  return (
    <div className={`flex items-center gap-1 overflow-x-auto py-1 px-1 select-none scrollbar-none ${className}`}>
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelectEmoji(emoji)}
          className="text-base p-1 hover:scale-125 transition-transform cursor-pointer rounded hover:bg-black/5 active:scale-95 leading-none shrink-0"
          title={`Insérer ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {onOpenFullPicker && (
        <button
          type="button"
          onClick={onOpenFullPicker}
          className="text-xs px-1.5 py-0.5 font-black text-cordel-wood hover:text-encre-noire hover:underline cursor-pointer ml-1 shrink-0 whitespace-nowrap"
          title="Ouvrir toutes les catégories d'émoticônes"
        >
          ➕ Plus
        </button>
      )}
    </div>
  );
}

/**
 * Sélecteur d'émoticônes léger sous forme de popover avec catégories.
 * Conçu dans le style visuel Cordel, sans aucune bibliothèque tierce lourde.
 */
export default function EmojiPickerPopover({ onSelectEmoji, onClose, title = "Émoticônes" }) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);
  const popoverRef = useRef(null);

  // Fermeture au clic extérieur et touche Échap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const currentCategory = EMOJI_CATEGORIES.find((cat) => cat.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-cordel-bg border-2 border-encre-noire rounded-[8px_10px_7px_9px] shadow-[3px_3px_0px_0px_#181716] p-2 flex flex-col gap-2 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* En-tête du sélecteur */}
      <div className="flex justify-between items-center pb-1 border-b border-dashed border-cordel-master-dark/20">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
          😀 {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-encre-noire hover:text-red-700 cursor-pointer p-0.5 leading-none"
          title="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Onglets des catégories */}
      <div className="flex items-center gap-1 border-b border-cordel-master-dark/15 pb-1">
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 py-1 px-1.5 text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                isActive
                  ? 'bg-cordel-wood text-white border-encre-noire shadow-xs font-bold'
                  : 'bg-white/60 hover:bg-white text-encre-noire border-transparent'
              }`}
              title={cat.name}
            >
              <span>{cat.icon}</span>
            </button>
          );
        })}
      </div>

      {/* Grille des émoticônes de la catégorie active */}
      <div className="grid grid-cols-6 gap-1 p-1 max-h-36 overflow-y-auto bg-cordel-bg-light rounded border border-cordel-master-dark/20">
        {currentCategory.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="text-lg p-1 rounded hover:scale-125 transition-transform cursor-pointer hover:bg-white active:scale-95 flex items-center justify-center"
            title={`Insérer ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Raccourci clavier astuce (rappel bienveillant pour PC et Mac) */}
      <div className="pt-1 border-t border-dashed border-cordel-master-dark/15 text-[8.5px] font-semibold text-cordel-master-dark opacity-75 text-center leading-tight">
        💡 Raccourci clavier : <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-encre-noire/30">Win + .</kbd> (PC) ou <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-encre-noire/30">Cmd + Ctrl + Espace</kbd> (Mac)
      </div>
    </div>
  );
}
