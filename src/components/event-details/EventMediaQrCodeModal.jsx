import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CordelButton from '../CordelButton';

/**
 * Composant EventMediaQrCodeModal
 * Génère et affiche un grand QR Code dynamique à partir de l'URL de dépôt de médias
 * ou de l'album de l'événement (Framaspace, Drive, Google Form).
 * Permet également la copie du lien, le téléchargement direct en image PNG
 * et l'impression d'une fiche A4 Cordel isolée pour le stand ou la scène.
 * 
 * @param {Object} props Propriétés du composant
 * @param {string} props.qrUrl URL de destination du QR Code
 * @param {string} props.eventTitle Titre de l'événement
 * @param {string} [props.eventDate] Date de l'événement
 * @param {string} [props.eventLocation] Lieu de l'événement
 * @param {Function} props.onClose Callback de fermeture de la modale
 */
export default function EventMediaQrCodeModal({
  qrUrl,
  eventTitle,
  eventDate,
  eventLocation,
  onClose
}) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  // Gestion de la fermeture via Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!qrUrl) return null;

  // Copie de l'URL dans le presse-papier
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("EventMediaQrCodeModal - Erreur lors de la copie du lien :", err);
    }
  };

  // Téléchargement immédiat de l'image QR Code au format PNG
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const safeTitle = (eventTitle || 'Evenement').replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `QRCode_Medias_${safeTitle}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("EventMediaQrCodeModal - Erreur export PNG :", err);
    }
  };

  // Impression sécurisée de la fiche A4 avec isolation CSS
  const handlePrint = () => {
    document.body.classList.add('printing-qr');
    const cleanup = () => {
      document.body.classList.remove('printing-qr');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Filet de sécurité en cas de non-déclenchement de l'événement afterprint
    setTimeout(cleanup, 2000);
  };

  // Formatage lisible de la date pour l'affiche
  const formattedDate = (() => {
    if (!eventDate) return '';
    try {
      const d = new Date(eventDate);
      if (isNaN(d.getTime())) return eventDate;
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return eventDate;
    }
  })();

  return (
    <div 
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-encre-noire/75 backdrop-blur-xs select-none outline-none animate-fade-in"
      onClick={onClose}
    >
      {/* Isolation CSS stricte pour l'impression A4 */}
      <style>{`
        @media print {
          body.printing-qr {
            background: #ffffff !important;
            color: #120e0c !important;
          }
          body.printing-qr * {
            visibility: hidden !important;
          }
          body.printing-qr .print-qr-target,
          body.printing-qr .print-qr-target * {
            visibility: visible !important;
          }
          body.printing-qr .print-qr-target {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 40px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            border: 6px double #120e0c !important;
            box-shadow: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          body.printing-qr .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-lg bg-cordel-bg shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-center"
      >
        {/* 1. En-tête fixe */}
        <div className="flex-shrink-0 p-3.5 sm:p-4 border-b-2 border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-cordel-bg no-print">
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] uppercase tracking-widest font-black flex items-center gap-1">
            <span>📸</span>
            <span>Dépôt Médias Événement</span>
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

        {/* 2. Corps de la fiche défilable (Cible de l'impression A4) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-3">
          <div className="print-qr-target w-full flex flex-col items-center gap-3 bg-white/50 p-4 rounded-lg border border-encre-noire/15">
            <h3 className="text-sm sm:text-base font-black text-cordel-wood uppercase tracking-wide leading-snug">
              {eventTitle ? `Partagez vos souvenirs de "${eventTitle}"` : "Dépôt de photos et vidéos"}
            </h3>

            {formattedDate && (
              <span className="text-xs font-bold text-encre-noire/80 capitalize">
                📅 {formattedDate} {eventLocation ? `• 📍 ${eventLocation}` : ''}
              </span>
            )}

            {/* QR Code dynamique haute résolution via Canvas */}
            <div className="p-4 bg-white border-2 border-encre-noire rounded-xl shadow-[3px_4px_0px_0px_#181716] my-1 flex items-center justify-center">
              <QRCodeCanvas 
                ref={canvasRef}
                value={qrUrl} 
                size={220}
                bgColor="#FFFFFF"
                fgColor="#181716"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex flex-col items-center gap-1 px-2">
              <p className="text-xs font-extrabold text-encre-noire leading-relaxed">
                Scannez ce code avec votre smartphone pour déposer vos clichés et vidéos directement dans notre album partagé.
              </p>
              <p className="text-[10px] text-encre-noire/60 font-mono break-all line-clamp-2">
                🔗 {qrUrl}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Pied d'actions complet */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-wrap gap-2 justify-center bg-cordel-bg no-print">
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
            variant="default"
            onClick={handleDownloadPng}
            className="text-xs py-1.5 px-3 font-bold"
          >
            ⬇️ Télécharger PNG
          </CordelButton>

          <CordelButton
            type="button"
            variant="default"
            onClick={handlePrint}
            className="text-xs py-1.5 px-3 font-bold"
          >
            🖨️ Imprimer fiche A4
          </CordelButton>

          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={() => window.open(qrUrl, '_blank', 'noopener,noreferrer')}
            className="text-xs py-1.5 px-3 font-bold"
          >
            🔗 Ouvrir ↗
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
