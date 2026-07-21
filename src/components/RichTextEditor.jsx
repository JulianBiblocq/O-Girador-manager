import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Rédigez votre message...', 
  groupId = '', 
  disabled = false,
  minHeight = '120px'
}) {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
        heading: false,
        horizontalRule: false
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
    }
  });

  // Sync value prop when changed externally (e.g. form resets)
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

  // Handle Link Button
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

  // Handle Image Upload to Firebase Storage
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide.");
      return;
    }

    setUploadingImage(true);
    try {
      const pathFolder = groupId ? `forum_images/${groupId}` : 'forum_images/global';
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;
      const storageRef = ref(storage, `${pathFolder}/${fileName}`);
      
      const snap = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snap.ref);

      editor.chain().focus().setImage({ src: downloadURL, alt: 'Image forum' }).run();
    } catch (err) {
      console.error("RichTextEditor - Error uploading image to Firebase Storage:", err);
      alert("Erreur lors du téléversement de l'image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

        <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>

        {/* Align Left */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Aligner à gauche"
        >
          ⬅️
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Centrer"
        >
          ↔️
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-cordel-wood text-white border-encre-noire'
              : 'bg-white text-encre-noire border-encre-noire/20 hover:bg-neutral-100'
          }`}
          title="Aligner à droite"
        >
          ➡️
        </button>

        <div className="h-4 w-[1px] bg-encre-noire/20 mx-1"></div>

        {/* Photo Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="px-2.5 py-1 text-xs font-bold rounded border bg-amber-50 hover:bg-amber-100 border-amber-600/40 text-amber-900 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          title="Insérer une image"
        >
          {uploadingImage ? '⏳' : '📷'} <span className="hidden sm:inline text-[10px] font-black uppercase">Photo</span>
        </button>
      </div>

      {/* Editor Content Box */}
      <div className="p-3 bg-white/70 dark:bg-black/10 text-xs font-medium focus-within:ring-1 focus-within:ring-cordel-wood">
        <EditorContent 
          editor={editor} 
          style={{ minHeight }} 
          className="outline-none text-encre-noire dark:text-cordel-bg-light"
        />
      </div>
    </div>
  );
}
