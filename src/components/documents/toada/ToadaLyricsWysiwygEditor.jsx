import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function markdownToInitialHtml(input = '') {
  if (!input || typeof input !== 'string') return '<p></p>';

  // Si la chaîne contient déjà du HTML TipTap, nettoyer uniquement les *...* résiduels et les <p><br></p> parasites
  if (/<(p|div|br|strong|b|em|i|h[1-6])\b/i.test(input)) {
    return input
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/(?:<p>\s*<br\s*\/?>\s*<\/p>\s*)+/gi, '');
  }

  // Conversion du gras Markdown (*...*), y compris lorsqu'il s'étend sur plusieurs lignes
  const withBold = input.replace(/\*([^*]+)\*/g, (_, inner) =>
    inner
      .split(/\r?\n/)
      .map((part) => (part.trim() ? `<strong>${part}</strong>` : ''))
      .join('\n')
  );

  const lines = withBold
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '<p></p>';
  return lines.map((line) => `<p>${line}</p>`).join('');
}

export default function ToadaLyricsWysiwygEditor({
  value = '',
  onChange,
  placeholder: _placeholder = 'Saisissez les paroles...',
  minHeight = '280px',
  disabled = false
}) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: markdownToInitialHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `prose max-w-none text-xs font-sans leading-snug p-2.5 focus:outline-hidden [&_p]:my-0.5 min-h-[${minHeight}]`
      }
    },
    onUpdate: ({ editor: ed }) => {
      isUpdatingRef.current = true;
      if (onChange) onChange(ed.getHTML());
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    }
  });

  useEffect(() => {
    if (!editor || isUpdatingRef.current) return;
    const currentHtml = editor.getHTML();
    const targetHtml = markdownToInitialHtml(value);
    if (value && currentHtml !== targetHtml && currentHtml !== value) {
      editor.commands.setContent(targetHtml);
    }
    // Synchroniser immédiatement l'état parent en HTML propre si l'entrée contenait des *...* ou du texte brut
    if (value && onChange && (/\*[^*]+\*/.test(value) || !/<p[\s>]/i.test(value))) {
      const normalizedHtml = editor.getHTML();
      if (normalizedHtml && normalizedHtml !== value) {
        onChange(normalizedHtml);
      }
    }
  }, [value, editor, onChange]);

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded border border-stone-300 bg-white shadow-2xs overflow-hidden focus-within:border-cordel-wood text-left">
      <div className="flex items-center gap-1 p-1 bg-stone-100 border-b border-stone-200 select-none">
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer transition-all ${
            editor.isActive('bold') ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
          }`}
          title="Mettre en gras (Ctrl+B) - Soliste / Puxador"
        >
          <span className="font-black">B</span> Gras (Puxador)
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${
            editor.isActive('italic') ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
          }`}
          title="Mettre en italique (Ctrl+I)"
        >
          <span className="italic font-serif">I</span> Italique
        </button>

        <div className="h-4 w-px bg-stone-300 mx-1" />

        <button
          type="button"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1 rounded text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-xs"
          title="Annuler (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1 rounded text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-xs"
          title="Rétablir (Ctrl+Y)"
        >
          ↷
        </button>

        <span className="ml-auto text-[9px] text-stone-400 italic pr-1">
          Gras = Puxador • Normal = Coro
        </span>
      </div>

      <div style={{ minHeight }} className="overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
