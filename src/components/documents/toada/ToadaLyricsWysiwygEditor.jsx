import React, { useEffect, useRef } from 'react';
import { Mark } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const UnderlineMark = Mark.create({
  name: 'underline',
  parseHTML: () => [{ tag: 'u' }],
  renderHTML: () => ['u', 0]
});

function markdownToInitialHtml(input = '') {
  if (!input || typeof input !== 'string') return '<p></p>';

  if (/<(p|div|br|strong|b|em|i|u|h[1-6])\b/i.test(input)) {
    return input
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/(?:<p>\s*<br\s*\/?>\s*<\/p>\s*)+/gi, '');
  }

  const withTutti = input.replace(/\*\*\*([^*]+)\*\*\*/g, (_, inner) =>
    inner
      .split(/\r?\n/)
      .map((part) => (part.trim() ? `<strong><em>${part}</em></strong>` : ''))
      .join('\n')
  );

  const withBold = withTutti.replace(/\*([^*]+)\*/g, (_, inner) =>
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
    extensions: [StarterKit, UnderlineMark],
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
    if (value && onChange && (/\*[^*]+\*/.test(value) || !/<p[\s>]/i.test(value))) {
      const normalizedHtml = editor.getHTML();
      if (normalizedHtml && normalizedHtml !== value) {
        onChange(normalizedHtml);
      }
    }
  }, [value, editor, onChange]);

  if (!editor) return null;

  const isTuttiActive = editor.isActive('bold') && editor.isActive('italic');
  const isPuxOnlyActive = editor.isActive('bold') && !editor.isActive('italic');

  const handleTogglePuxador = () => {
    if (isPuxOnlyActive) editor.chain().focus().unsetBold().run();
    else editor.chain().focus().setBold().unsetItalic().run();
  };

  const handleToggleEnsemble = () => {
    if (isTuttiActive) editor.chain().focus().unsetBold().unsetItalic().run();
    else editor.chain().focus().setBold().setItalic().run();
  };

  return (
    <div className="flex flex-col rounded border border-stone-300 bg-white shadow-2xs overflow-hidden focus-within:border-cordel-wood text-left">
      <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 border-b border-stone-200 select-none">
        <button type="button" disabled={disabled} onClick={handleTogglePuxador}
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer transition-all ${
            isPuxOnlyActive ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
          }`} title="Mettre en gras (Ctrl+B) - Soliste / Puxador">
          <span className="font-black">B</span> Gras (Puxador)
        </button>

        <button type="button" disabled={disabled} onClick={handleToggleEnsemble}
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${
            isTuttiActive ? 'bg-purple-800 text-white shadow-2xs' : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
          }`} title="Gras + Italique (***...***) - Chanté simultanément par le Puxador et le Coro">
          👥 Ensemble (Pux + Coro)
        </button>

        <button type="button" disabled={disabled} onClick={() => editor.chain().focus().toggleMark('underline').run()}
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${
            editor.isActive('underline') ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
          }`} title="Souligner un début de syllabe (<u>)">
          <span className="underline">U</span> Syllabe
        </button>

        <div className="h-4 w-px bg-stone-300 mx-1" />

        <button type="button" disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}
          className="p-1 rounded text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-xs" title="Annuler (Ctrl+Z)">↶</button>
        <button type="button" disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}
          className="p-1 rounded text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-xs" title="Rétablir (Ctrl+Y)">↷</button>

        <span className="ml-auto text-[9px] text-stone-500 italic pr-1">
          Gras = Puxador • Normal = Coro • Gras+Italique = Pux + Coro simultanés
        </span>
      </div>

      <div style={{ minHeight }} className="overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
