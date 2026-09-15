import React, { useState } from 'react';
import { applyUnicodeTransformation, insertTextAtCursor } from '../../utils/unicodeUtils';
import StudioEmojiPicker from './StudioEmojiPicker';
import StudioQuickChips from './StudioQuickChips';
import StudioWritingGuide from './StudioWritingGuide';

/**
 * Barre d'outils typographique, palette d'émoticônes catégorisée,
 * chips de vocabulaire rapide et guide rédactionnel pour le Studio Social.
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLTextAreaElement>} props.textareaRef Référence du champ textarea
 * @param {string} props.text Texte actuel
 * @param {Function} props.onChange Callback de modification du texte
 * @param {boolean} [props.disabled=false] Indique si la barre d'outils est désactivée
 * @param {Array<string|Object>} [props.lexique] Liste personnalisée de termes du lexique
 * @param {Array<string|Object>} [props.mentions] Liste personnalisée de mentions
 * @param {Array<Object>} [props.equivalences] Liste personnalisée d'équivalences culturelles
 * @param {Function} [props.onNavigateToLexique] Callback de navigation vers l'onglet studio-lexique
 */
export default function StudioTextToolbar({
  textareaRef,
  text = '',
  onChange,
  disabled = false,
  lexique,
  mentions,
  equivalences,
  onNavigateToLexique
}) {
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
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newStart, newEnd);
        }
      }, 0);
    }
  };

  /**
   * Insère une émoticône à l'emplacement exact du curseur sans perdre le focus
   */
  const handleInsertEmoji = (emoji) => {
    const textarea = textareaRef?.current;
    const start = textarea ? textarea.selectionStart : text.length;
    const end = textarea ? textarea.selectionEnd : text.length;

    const { newText, newCursorPos } = insertTextAtCursor(text, start, end, emoji);
    onChange(newText);

    setTimeout(() => {
      if (textareaRef?.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  /**
   * Insère un mot-clé ou une mention au curseur avec un espacement adapté
   */
  const handleInsertWord = (word) => {
    const textarea = textareaRef?.current;
    const start = textarea ? textarea.selectionStart : text.length;
    const end = textarea ? textarea.selectionEnd : text.length;

    // Ajouter un espace avant et après si nécessaire pour que le mot s'insère naturellement
    const beforeChar = start > 0 ? text[start - 1] : '';
    const afterChar = end < text.length ? text[end] : '';
    const prefix = beforeChar && beforeChar !== ' ' && beforeChar !== '\n' ? ' ' : '';
    const suffix = afterChar && afterChar !== ' ' && afterChar !== '\n' ? ' ' : ' ';
    const textToInsert = `${prefix}${word}${suffix}`;

    const { newText, newCursorPos } = insertTextAtCursor(text, start, end, textToInsert);
    onChange(newText);

    setTimeout(() => {
      if (textareaRef?.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-cordel-bg-light border border-b-0 border-encre-noire/30 rounded-t select-none text-xs">
      {/* 1. Rangée supérieure : Outils typographiques, sélecteur d'émoticônes et rétroaction */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Outils Gras / Italique */}
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
          </div>

          <div className="w-[1px] h-6 bg-cordel-master-dark/20 hidden sm:block" />

          {/* Palette d'émoticônes catégorisée (4 catégories compactes) */}
          <StudioEmojiPicker
            onSelectEmoji={handleInsertEmoji}
            disabled={disabled}
          />
        </div>

        {/* Message d'aide / rétroaction discrète */}
        {feedbackMessage && (
          <span className="text-[10px] font-bold text-cordel-wood animate-fade-in pr-1">
            ℹ️ {feedbackMessage}
          </span>
        )}
      </div>

      {/* 2. Rangée intermédiaire : Chips de mots-clés et mentions rapides */}
      <StudioQuickChips
        onInsertWord={handleInsertWord}
        lexique={lexique}
        mentions={mentions}
        onNavigateToLexique={onNavigateToLexique}
        disabled={disabled}
      />

      {/* 3. Accordéon rétractable : Guide de rédaction et équivalences culturelles */}
      <StudioWritingGuide
        onInsertTerm={handleInsertWord}
        equivalences={equivalences}
      />
    </div>
  );
}
