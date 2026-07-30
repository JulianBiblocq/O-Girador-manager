import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Composant EventMediaQrCodeModal
 * Génère et affiche un grand QR Code dynamique à partir de l'URL de dépôt de médias externes (Framaspace, Drive...) propre à l'événement.
 * 
 * @param {string} qrUrl URL du dossier de dépôt de médias
 * @param {string} eventTitle Titre de l'événement
 * @param {Function} onClose Fonction de fermeture de la modale
 */
export default function EventMediaQrCodeModal({ qrUrl, eventTitle, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!qrUrl) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("EventMediaQrCodeModal - Erreur copie :", err);
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
          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-cordel-master-dark hover:text-red-700 font-extrabold text-sm p-1 cursor-pointer select-none"
            title="Fermer"
          >
            ✖
          </button>

          {/* En-tête de la Modale */}
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] uppercase tracking-widest font-black">
              📸 Dépôt Médias Événement
            </span>
            <h3 className="text-sm sm:text-base font-black text-cordel-wood uppercase tracking-wide leading-snug mt-1">
              {eventTitle ? `Partagez vos souvenirs de "${eventTitle}"` : "Dépôt de photos et vidéos"}
            </h3>
          </div>

          {/* QR Code Dynamique généré avec qrcode.react */}
          <div className="p-4 bg-white border-2 border-encre-noire rounded-xl shadow-[3px_4px_0px_0px_#181716] my-1 flex items-center justify-center">
            {QRCodeSVG ? (
              <QRCodeSVG 
                value={qrUrl} 
                size={260}
                bgColor="#FFFFFF"
                fgColor="#181716"
                level="H"
                includeMargin={true}
              />
            ) : (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code Dépôt Médias"
                className="w-64 h-64 object-contain"
              />
            )}
          </div>

          {/* Texte d'aide explicatif sous le QR Code */}
          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-xs font-extrabold text-encre-noire leading-relaxed">
              Scannez ce code avec votre téléphone pour envoyer directement vos fichiers dans le dossier de cet événement.
            </p>
          </div>

          {/* Actions : Copier le lien & Ouvrir */}
          <div className="flex flex-wrap gap-2 w-full justify-center mt-2">
            <CordelButton
              type="button"
              variant="default"
              onClick={handleCopy}
              className="text-xs py-1.5 px-3 font-bold"
            >
              {copied ? "✅ Lien copié !" : "📋 Copier le lien"}
            </CordelButton>

            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={() => window.open(qrUrl, '_blank', 'noopener,noreferrer')}
              className="text-xs py-1.5 px-3 font-bold"
            >
              🔗 Ouvrir le dossier ↗
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
