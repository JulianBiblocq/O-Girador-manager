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
  const qrImageUrl = `https://api.qrserver.com/v1/créer-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(qrUrl)}`;

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
            📷 Récolte de Médias du Public
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
            Scannez-moi pour nous envoyer vos photos et vidéos !
          </h3>
          {eventTitle && (
            <span className="text-[11px] font-bold text-cordel-master-dark opacity-80">
              {eventTitle}
            </span>
          )}

          {/* Image du QR Code */}
          <div className="p-3 bg-white border-2 border-encre-noire rounded-xl shadow-[3px_4px_0px_0px_#181716] my-1">
            <img 
              src={qrImageUrl} 
              alt="QR Code Public Récolte Photos et Vidéos" 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded" 
            />
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-xs font-extrabold text-encre-noire leading-relaxed">
              📲 Scannez-moi avec votre smartphone pour nous envoyer vos photos !
            </p>
            <p className="text-[10px] font-semibold text-cordel-master-dark opacity-75">
              Faites flasher ce code QR aux spectateurs lors des prestations pour alimenter notre album souvenir.
            </p>
          </div>
        </div>

        {/* 3. Footer (Fixe en bas) */}
        <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-wrap gap-2 justify-center bg-cordel-bg">
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
      </div>
    </div>
  );
}
