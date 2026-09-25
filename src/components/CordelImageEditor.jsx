import React, { useState, useEffect, useRef } from 'react';
import { defaultCordelOptions, processCordelEffectBase64 } from '../utils/cordelEffect';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useAvatarUpload } from '../hooks/useAvatarUpload';

/**
 * Éditeur d'effet xylogravure respectant la charte esthétique Cordel.
 * Stylisé sous forme de cadre Cordel asymétrique avec boutons sémantiques.
 * Permet également de remplacer ou charger une nouvelle photo directement.
 */
export default function CordelImageEditor({ imageSrc, lang = 'fr', onComplete, onCancel }) {
  const [currentImage, setCurrentImage] = useState(imageSrc || null);
  const [options, setOptions] = useState(defaultCordelOptions);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const fileInputRef = useRef(null);
  const { compressAndPrepareFile, isCompressing } = useAvatarUpload();

  // Synchronisation si la prop imageSrc change
  useEffect(() => {
    if (imageSrc) {
      setCurrentImage(imageSrc);
    }
  }, [imageSrc]);

  // Génération de la prévisualisation réactive à chaque ajustement d'effet
  useEffect(() => {
    let active = true;
    if (!currentImage) {
      setPreviewBase64(null);
      return;
    }

    setPreviewError(false);
    const timeout = setTimeout(async () => {
      try {
        // Prévisualisation en 256px pour un rendu fluide et précis
        const preview = await processCordelEffectBase64(currentImage, options, 256);
        if (active) {
          setPreviewBase64(preview);
          setPreviewError(false);
        }
      } catch (err) {
        console.error("Xylogravure - Erreur de prévisualisation :", err);
        if (active) setPreviewError(true);
      }
    }, 50);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [currentImage, options]);

  // Validation et application finale de la gravure
  const handleApply = async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    try {
      const finalImg = await processCordelEffectBase64(currentImage, options, 256);
      onComplete(finalImg);
    } catch (err) {
      console.error("Xylogravure - Erreur de traitement final :", err);
      // En cas d'erreur de traitement canvas, renvoyer l'image originale optimisée
      if (currentImage.startsWith('data:image')) {
        onComplete(currentImage);
      } else {
        setIsProcessing(false);
        alert(lang === 'fr' ? "Erreur lors du traitement de l'image." : "Erro ao processar a imagem.");
      }
    }
  };

  // Mise à jour unitaire d'un paramètre d'effet
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Gestion du remplacement de fichier image depuis l'éditeur
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const preparedBase64 = await compressAndPrepareFile(file);
      if (preparedBase64) {
        setCurrentImage(preparedBase64);
      }
    } catch (err) {
      console.error("Xylogravure - Erreur chargement nouveau fichier :", err);
    } finally {
      // Réinitialiser la valeur pour permettre la sélection du même fichier
      if (e.target) e.target.value = '';
    }
  };

  return (
    <CordelCard 
      variant="default" 
      useExtremeBorder={true} 
      className="p-4 sm:p-5 flex flex-col gap-3.5 text-left relative bg-cordel-bg w-full shadow-[5px_5px_0px_0px_#181716] select-none"
    >
      {/* Input de sélection de fichier masqué */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* En-tête Cordel */}
      <div className="flex flex-col items-center gap-1 text-center border-b border-dashed border-cordel-master-dark/20 pb-2.5">
        <h3 className="font-heading font-black text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🪵</span> {lang === 'fr' ? 'Éditeur Xylogravure' : 'Editor Xilogravura'}
        </h3>
        <p className="text-[10px] font-semibold text-cordel-master-dark/80 italic">
          {lang === 'fr' ? '💡 Cadrez une photo nette où votre visage est bien reconnaissable.' : '💡 Certifique-se de usar uma foto clara onde seu rosto seja bem reconhecível.'}
        </p>
      </div>
      
      {/* Cadre de prévisualisation stylisé type gravure trombinoscope (Plein cadre sans marge) */}
      <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-[var(--color-cordel-papier,#f4ecd8)] border-2 border-dashed border-cordel-wood/60 rounded-[var(--theme-border-radius)] p-0 overflow-hidden shadow-[2px_2px_0px_0px_rgba(24,23,22,0.25)]">
        <div 
          className="relative w-full h-full overflow-hidden flex items-center justify-center cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          title={lang === 'fr' ? 'Cliquer pour changer de photo' : 'Clique para trocar a foto'}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <div className="w-7 h-7 border-2 border-[var(--color-cordel-ocre)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-cordel-master-dark">
                {lang === 'fr' ? 'Optimisation de la photo...' : 'Otimizando foto...'}
              </span>
            </div>
          ) : previewBase64 ? (
            <img 
              src={previewBase64} 
              alt="Prévisualisation xylographique" 
              className="w-full h-full object-cover object-center block select-none" 
            />
          ) : currentImage ? (
            <div className="w-7 h-7 border-2 border-cordel-wood border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
              <span className="text-3xl">📷</span>
              <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                {lang === 'fr' ? 'Choisir une photo' : 'Escolher foto'}
              </span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold">
                {lang === 'fr' ? 'Cliquez pour sélectionner un fichier' : 'Clique para selecionar'}
              </span>
            </div>
          )}

          {/* Calque de survol pour indiquer le changement d'image */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[11px] font-black uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
              📷 {lang === 'fr' ? 'Changer la photo' : 'Trocar foto'}
            </span>
          </div>

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

      {/* Bouton secondaire pour changer de photo sur mobile */}
      <div className="flex justify-center -mt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-bold text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-1"
        >
          🔄 {lang === 'fr' ? 'Choisir une autre photo de votre appareil' : 'Escolher outra foto'}
        </button>
      </div>

      {previewError && (
        <div className="text-[10px] text-red-700 bg-red-50 border border-dashed border-red-300 p-2 rounded text-center font-bold">
          ⚠️ {lang === 'fr' ? "Impossible de traiter cette image. Cliquez sur le bouton ci-dessus pour en choisir une autre." : "Não foi possível carregar a imagem. Escolha outra."}
        </div>
      )}

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
            onChange={e => handleOptionChange('zoom', Math.max(100, parseInt(e.target.value) || 100))} 
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
          disabled={isProcessing || !currentImage}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-wider font-heading ${isProcessing || !currentImage ? 'opacity-50 cursor-not-allowed' : ''}`}
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

