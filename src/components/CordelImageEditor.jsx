import React, { useState, useEffect } from 'react';
import { defaultCordelOptions, processCordelEffectBase64 } from '../utils/cordelEffect';

export default function CordelImageEditor({ imageSrc, lang = 'fr', onComplete, onCancel }) {
  const [options, setOptions] = useState(defaultCordelOptions);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      if (!imageSrc) return;
      try {
        // Generate preview at size 256 for sharp rendering
        const preview = await processCordelEffectBase64(imageSrc, options, 256);
        if (active) setPreviewBase64(preview);
      } catch (err) {
        console.error("Xylogravure - Erreur de preview :", err);
      }
    }, 50);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [imageSrc, options]);

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const finalImg = await processCordelEffectBase64(imageSrc, options, 256);
      onComplete(finalImg);
    } catch (err) {
      console.error("Xylogravure - Erreur de traitement final :", err);
      setIsProcessing(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-[var(--cordel-bg)] cordel-border-sm text-[var(--cordel-text)] font-sans text-xs max-w-sm w-full mx-auto">
      <div className="flex flex-col items-center gap-0.5 mb-1 text-center">
        <span className="font-cactus font-bold uppercase tracking-wider text-[10px]">
          {lang === 'fr' ? 'Éditeur Xylogravure' : 'Editor Xilogravura'}
        </span>
        <span className="text-[9px] font-semibold text-cordel-master-dark opacity-75">
          {lang === 'fr' ? '💡 Veillez à cadrer une photo nette où votre visage est bien reconnaissable.' : '💡 Certifique-se de usar uma foto clara onde seu rosto seja bem reconhecível.'}
        </span>
      </div>
      
      <div className="relative aspect-square w-full bg-black/10 cordel-border-sm overflow-hidden flex items-center justify-center">
        {previewBase64 ? (
          <img src={previewBase64} alt="preview" className="w-full h-full object-cover select-none" />
        ) : (
          <div className="w-6 h-6 border-2 border-[var(--cordel-text)] border-t-transparent rounded-full animate-spin" />
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
            <span className="text-[10px] font-cactus font-bold uppercase tracking-wider">
              {lang === 'fr' ? 'Traitement...' : 'Processando...'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-2 font-bold">
        {/* Sliders d'Intensité, Zoom, Detail, Shadow */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px]">
            <label>🎨 {lang === 'fr' ? "Intensité de l'effet" : 'Intensidade do efeito'}: {options.intensity !== undefined ? options.intensity : 80}%</label>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={options.intensity !== undefined ? options.intensity : 80} 
            onChange={e => handleOptionChange('intensity', parseInt(e.target.value))} 
            className="w-full accent-[var(--cordel-text)] cursor-pointer" 
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px]">
            <label>🔍 {lang === 'fr' ? 'Zoom' : 'Zoom'}: {options.zoom}%</label>
          </div>
          <input 
            type="range" 
            min="50" 
            max="180" 
            value={options.zoom} 
            onChange={e => handleOptionChange('zoom', parseInt(e.target.value))} 
            className="w-full accent-[var(--cordel-text)] cursor-pointer" 
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px]">
            <label>✍️ {lang === 'fr' ? 'Lignes (Détail)' : 'Linhas'}: {options.detail}%</label>
          </div>
          <input 
            type="range" 
            min="10" 
            max="150" 
            value={options.detail} 
            onChange={e => handleOptionChange('detail', parseInt(e.target.value))} 
            className="w-full accent-[var(--cordel-text)] cursor-pointer" 
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px]">
            <label>🌑 {lang === 'fr' ? 'Encre (Contraste)' : 'Tinta'}: {options.shadow}</label>
          </div>
          <input 
            type="range" 
            min="50" 
            max="220" 
            value={options.shadow} 
            onChange={e => handleOptionChange('shadow', parseInt(e.target.value))} 
            className="w-full accent-[var(--cordel-text)] cursor-pointer" 
          />
        </div>

        {/* Position */}
        <div className="flex gap-2 items-center text-[10px] mt-1">
          <div className="flex items-center flex-1 gap-1">
            <span>↔️</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={options.posX} 
              onChange={e => handleOptionChange('posX', parseInt(e.target.value))} 
              className="w-full accent-[var(--cordel-text)] cursor-pointer m-0" 
            />
          </div>
          <div className="flex items-center flex-1 gap-1">
            <span>↕️</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={options.posY} 
              onChange={e => handleOptionChange('posY', parseInt(e.target.value))} 
              className="w-full accent-[var(--cordel-text)] cursor-pointer m-0" 
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex justify-between mt-1 text-[10px]">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={options.isMirror} 
              onChange={e => handleOptionChange('isMirror', e.target.checked)} 
              className="cursor-pointer accent-[var(--cordel-text)]" 
            />
            <span>🪞 {lang === 'fr' ? 'Miroir' : 'Espelho'}</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={options.isFrame} 
              onChange={e => handleOptionChange('isFrame', e.target.checked)} 
              className="cursor-pointer accent-[var(--cordel-text)]" 
            />
            <span>🖼️ {lang === 'fr' ? 'Cadre' : 'Moldura'}</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleApply}
          disabled={isProcessing}
          className={`flex-1 py-1.5 bg-black text-white cordel-border-sm text-[10px] font-bold uppercase tracking-wider font-cactus ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'}`}
        >
          {lang === 'fr' ? 'Valider' : 'Aplicar'}
        </button>
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className={`flex-1 py-1.5 bg-gray-300 text-black cordel-border-sm text-[10px] font-bold uppercase tracking-wider font-cactus ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}`}
        >
          {lang === 'fr' ? 'Annuler' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
}
