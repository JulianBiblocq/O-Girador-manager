import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Composant EventPublicQrCodeModal
 * Affiche une modale contenant le QR Code public généré à partir de l'URL Google Form de l'association.
 * Permet au public lors des événements de scanner le QR Code avec un smartphone pour envoyer des photos.
 * 
 * @param {string} qrUrl URL du Google Form de récolte des photos du public
 * @param {string} eventTitle Titre de l'événement (optionnel)
 * @param {Function} onClose Fonction de fermeture de la modale
 */
export default function EventPublicQrCodeModal({ qrUrl, eventTitle, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!qrUrl) return null;

  // Encodage de l'URL pour la génération du QR Code via une API d'image vectorielle haute résolution
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(qrUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erreur de copie :", err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <CordelCard 
          variant="default" 
          useExtremeBorder={true} 
          className="p-6 text-center flex flex-col items-center gap-4 bg-cordel-bg shadow-[6px_8px_24px_rgba(24,23,22,0.3)] relative"
        >
          {/* Bouton de fermeture en haut à droite */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-cordel-master-dark hover:text-red-700 font-extrabold text-sm p-1 cursor-pointer select-none"
            title="Fermer"
          >
            ✖
          </button>

          {/* En-tête & Instruction principale au-dessus du QR Code */}
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] uppercase tracking-widest font-black">
              📷 Récolte de Médias du Public
            </span>
            <h3 className="text-sm sm:text-base font-black text-cordel-wood uppercase tracking-wide leading-snug mt-1">
              Scannez-moi pour nous envoyer vos photos et vidéos !
            </h3>
            {eventTitle && (
              <span className="text-[11px] font-bold text-cordel-master-dark opacity-80">
                {eventTitle}
              </span>
            )}
          </div>

          {/* Image du grand QR Code très lisible */}
          <div className="p-3 bg-white border-2 border-encre-noire rounded-xl shadow-[3px_4px_0px_0px_#181716] my-1">
            <img 
              src={qrImageUrl} 
              alt="QR Code Public Récolte Photos et Vidéos" 
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded" 
            />
          </div>

          {/* Instruction claire */}
          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-xs font-extrabold text-encre-noire leading-relaxed">
              📲 Scannez-moi avec votre smartphone pour nous envoyer vos photos !
            </p>
            <p className="text-[10px] font-semibold text-cordel-master-dark opacity-75">
              Faites flasher ce code QR aux spectateurs lors des prestations pour alimenter notre album souvenir.
            </p>
          </div>

          {/* Barre d'actions */}
          <div className="flex flex-wrap gap-2 justify-center w-full pt-2 border-t border-dashed border-cordel-master-dark/20 mt-1">
            <CordelButton
              variant="default"
              useExtremeBorder={true}
              onClick={handleCopy}
              className="text-xs py-2 px-3 font-bold uppercase tracking-wider"
            >
              {copied ? "✓ Lien copié !" : "📋 Copier le lien"}
            </CordelButton>

            <a 
              href={qrUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs py-2 px-3 font-bold uppercase tracking-wider bg-cordel-master-light text-encre-noire border border-encre-noire rounded hover:bg-amber-200 transition-colors"
            >
              🔗 Tester le lien
            </a>

            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={onClose}
              className="text-xs py-2 px-4 font-black uppercase tracking-wider"
            >
              Fermer
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
