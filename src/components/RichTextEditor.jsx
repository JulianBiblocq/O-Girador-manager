import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import ForumImageInsertModal from './forum/ForumImageInsertModal';
import EmojiPickerPopover, { EmojiQuickRow } from './forum/EmojiPickerPopover';

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Rédigez votre message...', 
  groupId = '',
  lienDepotForum = '',
  consignesDepotForum = '',
  disabled = false,
  minHeight = '120px',
  showLists = true,
  showImage = true,
  showAlign = true,
  showEmojis = true,
  onAddPoll = null
}) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [, forceUpdate] = useState({});

  // Insertion d'un émoticône à l'emplacement du curseur dans l'éditeur
  const handleInsertEmoji = (emoji) => {
    if (editor && emoji) {
      editor.chain().focus().insertContent(emoji).run();
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: showLists ? {} : false,
        orderedList: showLists ? {} : false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-700 underline font-bold hover:text-blue-900',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      TextAlign.configure({
        types: ['paragraph']
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded border-2 border-encre-noire/20 my-2 shadow-sm'
        }
      })
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    onSelectionUpdate: () => {
      forceUpdate({});
    },
    onTransaction: () => {
      forceUpdate({});
    }
  });

  // Synchroniser value prop when changed externally (e.g. form resets)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (value === '' || value === '<p></p>') {
        editor.commands.setContent('');
      } else {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  // Gérer Link Button
  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien :', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col w-full border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] overflow-hidden bg-cordel-bg-light text-left transition-all">
      {/* Minimalist Toolbar: Bold, Italic, Link, Align (Left, Center, Right), Image Upload */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-cordel-master-light/10 border-b border-encre-noire/20 select-none">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs font-black rounded border transition-all cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Gras"
        >
          <b>B</b>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs font-black italic rounded border transition-all cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Italique"
        >
          <i>I</i>
        </button>

        <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>

        {/* Link */}
        <button
          type="button"
          onClick={handleSetLink}
          className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
            editor.isActive('link')
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Lien hypertexte"
        >
          🔗
        </button>

        {showLists && (
          <>
            <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
                editor.isActive('bulletList')
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
              }`}
              title="Liste à puces"
            >
              • List
            </button>

            {/* Ordered List */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
                editor.isActive('orderedList')
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
              }`}
              title="Liste numérotée"
            >
              1. List
            </button>
          </>
        )}

        {showAlign && (
          <>
            <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>

            {/* Align Left */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                editor.isActive({ textAlign: 'left' })
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
              }`}
              title="Aligner à gauche"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
            </button>

            {/* Align Center */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                editor.isActive({ textAlign: 'center' })
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
              }`}
              title="Centrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>
            </button>

            {/* Align Right */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                editor.isActive({ textAlign: 'right' })
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
              }`}
              title="Aligner à droite"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>
            </button>
          </>
        )}

        {(showImage || onAddPoll) && (
          <>
            <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>
            
            {showImage && (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold rounded border bg-amber-50 hover:bg-amber-100 border-amber-600/40 text-amber-900 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Insérer une image dans la discussion"
              >
                📷 <span className="hidden sm:inline text-[10px] font-black uppercase">Photo</span>
              </button>
            )}

            {onAddPoll && (
              <button
                type="button"
                onClick={onAddPoll}
                className="px-2.5 py-1 text-xs font-bold rounded border bg-blue-50 hover:bg-blue-100 border-blue-600/40 text-blue-900 transition-all cursor-pointer flex items-center gap-1 shadow-sm ml-1"
                title="Ajouter un sondage"
              >
                📊 <span className="hidden sm:inline text-[10px] font-black uppercase">Sondage</span>
              </button>
            )}
          </>
        )}

        {showEmojis && (
          <>
            <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                  isEmojiPickerOpen
                    ? 'bg-cordel-wood text-white border-encre-noire'
                    : 'bg-white hover:bg-neutral-100 border-encre-noire/20 text-encre-noire'
                }`}
                title="Insérer un émoticône"
              >
                <span>😀</span>
                <span className="hidden sm:inline text-[10px] font-bold">Émojis</span>
              </button>

              {isEmojiPickerOpen && (
                <EmojiPickerPopover
                  onSelectEmoji={(emoji) => {
                    handleInsertEmoji(emoji);
                    setIsEmojiPickerOpen(false);
                  }}
                  onClose={() => setIsEmojiPickerOpen(false)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Ligne d'accès direct aux émoticônes fréquents */}
      {showEmojis && (
        <div className="flex items-center px-2 py-0.5 bg-cordel-master-light/5 border-b border-dashed border-encre-noire/15 text-xs">
          <span className="text-[8px] font-black uppercase text-cordel-wood opacity-75 shrink-0 select-none mr-1.5">
            Émojis :
          </span>
          <EmojiQuickRow
            onSelectEmoji={handleInsertEmoji}
            onOpenFullPicker={() => setIsEmojiPickerOpen(true)}
            className="flex-1"
          />
        </div>
      )}

      {/* Editor Content Box */}
      <div className="p-3 bg-white/70 dark:bg-black/10 text-xs font-medium focus-within:ring-1 focus-within:ring-cordel-wood">
        <EditorContent 
          editor={editor} 
          style={{ minHeight }} 
          className="outline-none text-encre-noire dark:text-cordel-bg-light"
        />
      </div>

      {/* Modale d'insertion d'image (Upload Firebase Storage ou Lien Externe) */}
      <ForumImageInsertModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        lienDepotForum={lienDepotForum}
        consignesDepotForum={consignesDepotForum}
        groupId={groupId}
        onInsertImage={(url) => {
          if (editor && url) {
            editor.chain().focus().setImage({ src: url, alt: 'Image forum' }).run();
          }
        }}
      />
    </div>
  );
}
