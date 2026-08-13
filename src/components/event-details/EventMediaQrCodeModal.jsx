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
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs select-none outline-none animate-fade-in"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-center"
      >
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg">
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] uppercase tracking-widest font-black">
            📸 Dépôt Médias Événement
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-cordel-master-dark hover:text-red-700 font-extrabold text-sm p-1 cursor-pointer select-none"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-3">
          <h3 className="text-sm sm:text-base font-black text-cordel-wood uppercase tracking-wide leading-snug">
            {eventTitle ? `Partagez vos souvenirs de "${eventTitle}"` : "Dépôt de photos et vidéos"}
          </h3>

          {/* QR Code Dynamique */}
          <div className="p-4 bg-white border-2 border-encre-noire rounded-xl shadow-[3px_4px_0px_0px_#181716] my-1 flex items-center justify-center">
            {QRCodeSVG ? (
              <QRCodeSVG 
                value={qrUrl} 
                size={240}
                bgColor="#FFFFFF"
                fgColor="#181716"
                level="H"
                includeMargin={true}
              />
            ) : (
              <img 
                src={`https://api.qrserver.com/v1/créer-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code Dépôt Médias"
                className="w-56 h-56 object-contain"
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-xs font-extrabold text-encre-noire leading-relaxed">
              Scannez ce code avec votre téléphone pour envoyer directement vos fichiers dans le dossier de cet événement.
            </p>
          </div>
        </div>

        {/* 3. Footer (Fixe en bas) */}
        <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-wrap gap-2 justify-center bg-cordel-bg">
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

          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={onClose}
            className="text-xs py-1.5 px-3 font-bold"
          >
            Fermer
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
