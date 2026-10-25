import React, { useRef } from 'react';
import { useTranslation } from '../../LanguageContext';

export default function ToadaScanDropZone({
  imagePreview,
  onFileSelected,
  onClearImage,
  disabled = false
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFileSelected(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleInputChange} className="hidden" />

      {imagePreview ? (
        <div className="relative rounded border-2 border-stone-300 bg-stone-50 overflow-hidden flex flex-col items-center p-2">
          <img src={imagePreview} alt="Aperçu manuscrit" className="max-h-48 object-contain rounded shadow-xs" />
          <button
            type="button"
            onClick={onClearImage}
            disabled={disabled}
            className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 hover:bg-black text-white text-[10px] font-bold cursor-pointer transition-colors"
          >
            ✕ {t('common.delete') || "Changer"}
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className="border-2 border-dashed border-cordel-master-dark/30 hover:border-cordel-wood bg-stone-50/60 hover:bg-stone-50 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[130px]"
        >
          <span className="text-2xl mb-1">📄</span>
          <p className="text-xs font-bold text-stone-700">
            {t('toada.scanDropzonePlaceholder') || "Glissez une photo ici, collez (Ctrl+V) ou cliquez"}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Formats JPEG, PNG, WebP acceptés</p>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
            disabled={disabled}
            className="mt-2.5 px-2.5 py-1 rounded bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-[10px] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📷</span> {t('toada.scanDropzoneTakePic') || "Prendre une photo"}
          </button>
        </div>
      )}
    </div>
  );
}
