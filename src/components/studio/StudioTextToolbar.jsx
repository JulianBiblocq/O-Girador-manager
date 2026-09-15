import React, { useState } from 'react';
import { applyUnicodeTransformation, insertTextAtCursor } from '../../utils/unicodeUtils';

/**
 * Barre d'outils typographique et palette d'émoticônes pour le Studio Social.
 *
 * Permet d'enrichir la légende avec des caractères gras et italiques Unicode
 * (compatibles avec toutes les plateformes comme Instagram, Facebook, WhatsApp)
 * et d'insérer rapidement les émoticônes courantes de l'association.
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLTextAreaElement>} props.textareaRef Référence du champ textarea
 * @param {string} props.text Texte actuel
 * @param {Function} props.onChange Callback de modification du texte
 * @param {boolean} [props.disabled=false] Indique si la barre d'outils est désactivée
 */
export default function StudioTextToolbar({ textareaRef, text = '', onChange, disabled = false }) {
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const showFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage('');
    }, 2000);
  };

  /**
   * Applique la transformation typographique Unicode sélectionnée (gras ou italique)
   */
  const handleFormat = (formatType) => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      showFeedback("Sélectionnez d'abord du texte pour appliquer le style");
      textarea.focus();
      return;
    }

    const { newText, newStart, newEnd, applied } = applyUnicodeTransformation(text, start, end, formatType);

    if (applied) {
      onChange(newText);
      // Repositionner la sélection sur la tranche transformée après mise à jour du rendu
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newStart, newEnd);
        }
      }, 0);
    }
  };

  /**
   * Insère une émoticône à l'emplacement exact du curseur
   */
  const handleInsertEmoji = (emoji) => {
    const textarea = textareaRef?.current;
    const start = textarea ? textarea.selectionStart : text.length;
    const end = textarea ? textarea.selectionEnd : text.length;

    const { newText, newCursorPos } = insertTextAtCursor(text, start, end, emoji);
    onChange(newText);

    // Repositionner le curseur juste après l'émoticône insérée
    setTimeout(() => {
      if (textareaRef?.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const emojiList = [
    { emoji: '📅', label: 'Date' },
    { emoji: '📍', label: 'Lieu' },
    { emoji: '🥁', label: 'Percussion / Musique' },
    { emoji: '⏰', label: 'Horaires' },
    { emoji: '🎟️', label: 'Billetterie / Entrée' },
    { emoji: '✨', label: 'Étoiles / Éclat' }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-cordel-bg-light border border-b-0 border-encre-noire/30 rounded-t select-none text-xs">
      {/* Outils de mise en forme typographique */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('bold')}
          className="px-2 py-1 bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-encre-noire/30 rounded font-serif font-black text-sm tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-40"
          title="Mettre en gras (Unicode Mathematical Bold)"
        >
          𝐁
        </button>

        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('italic')}
          className="px-2 py-1 bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-encre-noire/30 rounded font-serif italic font-bold text-sm tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-40"
          title="Mettre en italique (Unicode Mathematical Italic)"
        >
          𝐼
        </button>

        <div className="w-[1px] h-5 bg-cordel-master-dark/20 mx-1" />

        {/* Palette d'émoticônes rapides */}
        <div className="flex items-center gap-1">
          {emojiList.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertEmoji(emoji)}
              className="p-1 text-sm hover:scale-115 active:scale-95 transition-transform cursor-pointer rounded hover:bg-white/60 disabled:opacity-40"
              title={`Insérer ${emoji} (${label})`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message d'aide / rétroaction discrète */}
      {feedbackMessage && (
        <span className="text-[10px] font-bold text-cordel-wood animate-fade-in pr-1">
          ℹ️ {feedbackMessage}
        </span>
      )}
    </div>
  );
}
