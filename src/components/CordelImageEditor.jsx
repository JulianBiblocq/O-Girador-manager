import React, { useState, useEffect } from 'react';
import { defaultCordelOptions, processCordelEffectBase64 } from '../utils/cordelEffect';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

/**
 * Éditeur d'effet xylogravure respectant la charte esthétique Cordel.
 * Stylisé sous forme de cadre Cordel asymétrique avec boutons sémantiques.
 */
export default function CordelImageEditor({ imageSrc, lang = 'fr', onComplete, onCancel }) {
  const [options, setOptions] = useState(defaultCordelOptions);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Génération de la prévisualisation réactive à chaque ajustement
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      if (!imageSrc) return;
      try {
        // Prévisualisation en 256px pour un rendu fluide et précis
        const preview = await processCordelEffectBase64(imageSrc, options, 256);
        if (active) setPreviewBase64(preview);
      } catch (err) {
        console.error("Xylogravure - Erreur de prévisualisation :", err);
      }
    }, 50);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [imageSrc, options]);

  // Validation et application finale de la gravure
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

  // Mise à jour unitaire d'un paramètre d'effet
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <CordelCard 
      variant="default" 
      useExtremeBorder={true} 
      className="p-4 sm:p-5 flex flex-col gap-3.5 text-left relative bg-cordel-bg w-full shadow-[5px_5px_0px_0px_#181716] select-none"
    >
      {/* En-tête Cordel */}
      <div className="flex flex-col items-center gap-1 text-center border-b border-dashed border-cordel-master-dark/20 pb-2.5">
        <h3 className="font-heading font-black text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🪵</span> {lang === 'fr' ? 'Éditeur Xylogravure' : 'Editor Xilogravura'}
        </h3>
        <p className="text-[10px] font-semibold text-cordel-master-dark/80 italic">
          {lang === 'fr' ? '💡 Cadrez une photo nette où votre visage est bien reconnaissable.' : '💡 Certifique-se de usar uma foto clara onde seu rosto seja bem reconhecível.'}
        </p>
      </div>
      
      {/* Cadre de prévisualisation stylisé type gravure trombinoscope */}
      <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-cordel-master-dark/5 border-2 border-dashed border-cordel-wood/60 rounded-[var(--theme-border-radius)] p-1.5 shadow-[2px_2px_0px_0px_rgba(24,23,22,0.25)]">
        <div className="relative w-full h-full rounded overflow-hidden flex items-center justify-center bg-black/10">
          {previewBase64 ? (
            <img 
              src={previewBase64} 
              alt="Prévisualisation xylographique" 
              className="w-full h-full object-cover select-none" 
            />
          ) : (
            <div className="w-7 h-7 border-2 border-cordel-wood border-t-transparent rounded-full animate-spin" />
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 select-none">
              <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-[11px] font-heading font-bold uppercase tracking-wider">
                {lang === 'fr' ? 'Gravure en cours...' : 'Processando...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Paramètres de réglages xylographiques */}
      <div className="flex flex-col gap-2.5 font-bold">
        {/* Intensité */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[10px]">
            <label className="text-cordel-wood uppercase tracking-wider text-[9px] font-black">
              🎨 {lang === 'fr' ? "Intensité de l'effet" : 'Intensidade'}: <span className="text-cordel-master-dark font-mono font-bold">{options.intensity !== undefined ? options.intensity : 80}%</span>
            </label>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={options.intensity !== undefined ? options.intensity : 80} 
            onChange={e => handleOptionChange('intensity', parseInt(e.target.value))} 
            className="w-full accent-cordel-wood cursor-pointer" 
          />
        </div>

        {/* Zoom */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[10px]">
            <label className="text-cordel-wood uppercase tracking-wider text-[9px] font-black">
              🔍 {lang === 'fr' ? 'Zoom' : 'Zoom'}: <span className="text-cordel-master-dark font-mono font-bold">{Math.max(100, options.zoom || 100)}%</span>
            </label>
          </div>
          <input 
            type="range" 
            min="100" 
            max="250" 
            value={Math.max(100, options.zoom || 100)} 
            onChange={e => handleOptionChange('zoom', parseInt(e.target.value))} 
            className="w-full accent-cordel-wood cursor-pointer" 
          />
        </div>
        
        {/* Lignes & Détails */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[10px]">
            <label className="text-cordel-wood uppercase tracking-wider text-[9px] font-black">
              ✍️ {lang === 'fr' ? 'Lignes (Détail)' : 'Linhas'}: <span className="text-cordel-master-dark font-mono font-bold">{options.detail}%</span>
            </label>
          </div>
          <input 
            type="range" 
            min="10" 
            max="150" 
            value={options.detail} 
            onChange={e => handleOptionChange('detail', parseInt(e.target.value))} 
            className="w-full accent-cordel-wood cursor-pointer" 
          />
        </div>

        {/* Encre & Ombres */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[10px]">
            <label className="text-cordel-wood uppercase tracking-wider text-[9px] font-black">
              🌑 {lang === 'fr' ? 'Encre (Contraste)' : 'Tinta'}: <span className="text-cordel-master-dark font-mono font-bold">{options.shadow}</span>
            </label>
          </div>
          <input 
            type="range" 
            min="50" 
            max="220" 
            value={options.shadow} 
            onChange={e => handleOptionChange('shadow', parseInt(e.target.value))} 
            className="w-full accent-cordel-wood cursor-pointer" 
          />
        </div>

        {/* Ajustement de cadrage (position horizontale et verticale) */}
        <div className="flex gap-2 items-center text-[10px] mt-0.5">
          <div className="flex items-center flex-1 gap-1">
            <span className="text-[10px]" title="Déplacement horizontal">↔️</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={options.posX} 
              onChange={e => handleOptionChange('posX', parseInt(e.target.value))} 
              className="w-full accent-cordel-wood cursor-pointer m-0" 
            />
          </div>
          <div className="flex items-center flex-1 gap-1">
            <span className="text-[10px]" title="Déplacement vertical">↕️</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={options.posY} 
              onChange={e => handleOptionChange('posY', parseInt(e.target.value))} 
              className="w-full accent-cordel-wood cursor-pointer m-0" 
            />
          </div>
        </div>

        {/* Options Miroir et Cadre */}
        <div className="flex justify-between mt-1 text-[11px] pt-1.5 border-t border-dashed border-cordel-master-dark/15">
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-cordel-master-dark hover:text-cordel-wood transition-colors">
            <input 
              type="checkbox" 
              checked={options.isMirror} 
              onChange={e => handleOptionChange('isMirror', e.target.checked)} 
              className="cursor-pointer accent-cordel-wood" 
            />
            <span>🪞 {lang === 'fr' ? 'Miroir' : 'Espelho'}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-cordel-master-dark hover:text-cordel-wood transition-colors">
            <input 
              type="checkbox" 
              checked={options.isFrame} 
              onChange={e => handleOptionChange('isFrame', e.target.checked)} 
              className="cursor-pointer accent-cordel-wood" 
            />
            <span>🖼️ {lang === 'fr' ? 'Cadre bois' : 'Moldura'}</span>
          </label>
        </div>
      </div>

      {/* Actions de validation et d'annulation harmonisées avec la charte Cordel */}
      <div className="flex gap-2.5 mt-2">
        <CordelButton
          type="button"
          variant="vert"
          onClick={handleApply}
          disabled={isProcessing}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-wider font-heading ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {lang === 'fr' ? '✓ Valider' : '✓ Aplicar'}
        </CordelButton>
        <CordelButton
          type="button"
          variant="rouge"
          onClick={onCancel}
          disabled={isProcessing}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-wider font-heading ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {lang === 'fr' ? '✕ Annuler' : '✕ Cancelar'}
        </CordelButton>
      </div>
    </CordelCard>
  );
}
