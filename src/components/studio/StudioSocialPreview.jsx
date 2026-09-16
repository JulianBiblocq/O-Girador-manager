import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import InstagramPreviewCard from './preview/InstagramPreviewCard';
import FacebookPreviewGrid from './preview/FacebookPreviewGrid';

/**
 * Composant de prévisualisation interactif du Studio Social avec 3 vues :
 * 1. Carrousel Instagram
 * 2. Mosaïque Facebook
 * 3. Affiche Cordel Canvas xilogravura
 */
export default function StudioSocialPreview({
  mediaList = [],
  branding = null,
  selectedEvent = null,
  publicationText = '',
  canvasRef,
  canvasError,
  imageCopied,
  sendingValidation,
  isUploading = false,
  onDownload,
  onCopyImage,
  onShare,
  onSendForValidation
}) {
  const [activeTab, setActiveTab] = useState('instagram'); // 'instagram' | 'facebook' | 'canvas'

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 w-full flex flex-col gap-3 items-center">
      {/* Onglets de commutation du type d'aperçu */}
      <div className="flex items-center justify-between w-full border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
        <span className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
          📱 Aperçu Réseaux Sociaux
        </span>
        <div className="flex gap-1 bg-cordel-bg p-0.5 rounded border border-encre-noire/30 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('instagram')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'instagram' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            📷 Insta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facebook')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'facebook' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            📘 Facebook
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'canvas' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            🎨 Affiche Cordel
          </button>
        </div>
      </div>

      {/* Rendu dynamique selon l'onglet actif */}
      <div className="w-full flex justify-center min-h-[360px] items-center">
        {activeTab === 'instagram' && (
          <InstagramPreviewCard
            mediaList={mediaList}
            branding={branding}
            selectedEvent={selectedEvent}
            publicationText={publicationText}
          />
        )}

        {activeTab === 'facebook' && (
          <FacebookPreviewGrid
            mediaList={mediaList}
            branding={branding}
            publicationText={publicationText}
          />
        )}

        {/* Le Canvas reste toujours présent dans le DOM (pour permettre l'export/copie/partage) */}
        <div className={`flex-col items-center gap-2 w-full max-w-[380px] ${activeTab === 'canvas' ? 'flex' : 'hidden'}`}>
          <div className="relative aspect-square w-full border-4 border-encre-noire rounded-lg overflow-hidden bg-white shadow-lg">
            <canvas
              ref={canvasRef}
              width={1080}
              height={1080}
              className="w-full h-full object-cover bg-neutral-100"
            />
            {!selectedEvent && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 backdrop-blur-xs select-none">
                <span className="text-xs font-black uppercase tracking-wider text-center p-4 bg-white/90 rounded border border-encre-noire shadow-md">
                  Veuillez sélectionner un événement pour générer l'affiche Cordel
                </span>
              </div>
            )}
          </div>
          {canvasError && (
            <div className="p-2 bg-red-100 border border-red-400 text-red-800 text-[10px] rounded leading-tight font-semibold">
              ⚠️ Restriction CORS : utilisez le clic droit sur l'image pour la sauvegarder.
            </div>
          )}
        </div>
      </div>

      {/* Panneau d'action d'export et de validation vers le Forum */}
      <div className="flex flex-col gap-2 w-full max-w-[380px] pt-2 border-t-2 border-dashed border-cordel-master-dark/20">
        <div className="grid grid-cols-3 gap-2 w-full">
          <CordelButton
            onClick={onDownload}
            variant="default"
            useExtremeBorder={true}
            className="text-[11px] py-2 font-bold uppercase tracking-wider px-1 text-center"
            title="Télécharger l'affiche Cordel au format JPEG"
          >
            💾 Télécharger
          </CordelButton>

          <CordelButton
            onClick={onCopyImage}
            variant={imageCopied ? "vert" : "default"}
            useExtremeBorder={true}
            className="text-[11px] py-2 font-bold uppercase tracking-wider px-1 text-center"
            title="Copier le visuel PNG dans le presse-papier"
          >
            {imageCopied ? "✓ Copiée !" : "🖼️ Copier"}
          </CordelButton>
          
          <CordelButton
            onClick={onShare}
            variant="ocre"
            useExtremeBorder={true}
            className="text-[11px] py-2 font-bold uppercase tracking-wider px-1 text-center"
          >
            🔗 Partager
          </CordelButton>
        </div>

        <CordelButton
          onClick={onSendForValidation}
          variant={selectedEvent?.statutPublication === 'approuve' ? "vert" : "jaune"}
          useExtremeBorder={true}
          disabled={sendingValidation || isUploading || (mediaList.length === 0 && !publicationText)}
          className="w-full text-xs py-2.5 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#181716]"
        >
          {sendingValidation ? (
            "⏳ Envoi au Forum en cours..."
          ) : isUploading ? (
            "⏳ Téléversement des photos..."
          ) : selectedEvent?.statutPublication === 'approuve' ? (
            "✅ Déjà approuvé (Renvoyer révision)"
          ) : selectedEvent?.statutPublication === 'en_attente' ? (
            "⏳ En attente (Renvoyer au Forum)"
          ) : (
            "💬 Soumettre pour validation (Forum)"
          )}
        </CordelButton>
      </div>
    </CordelCard>
  );
}
