import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from '../LanguageContext';

/**
 * Composant : StudioPhotoQrPrintModal
 * 
 * Modale de visualisation, d'exportation PNG et d'impression A4 du QR-Code
 * lié au dossier de dépôt de photos ou à l'album finalisé d'un événement.
 * Conçu aux couleurs et motifs du Cordel pour un affichage prêt à l'emploi lors des prestations.
 * 
 * @param {string} qrUrl URL du dossier de dépôt ou de l'album photos
 * @param {string} eventTitle Titre de l'événement associé
 * @param {string} [eventDate] Date de l'événement (format ISO ou texte)
 * @param {string} [eventLocation] Lieu de l'événement
 * @param {'depot'|'album'} [mode='depot'] Mode d'affichage ('depot' ou 'album')
 * @param {Function} onClose Callback de fermeture de la modale
 */
export default function StudioPhotoQrPrintModal({
  qrUrl,
  eventTitle,
  eventDate,
  eventLocation,
  mode = 'depot',
  onClose
}) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Gestion de la touche Échap pour fermer la modale
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

  // Formatage lisible de la date
  const formattedDate = React.useMemo(() => {
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
  }, [eventDate]);

  // Copie de l'URL dans le presse-papier
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie presse-papier :", err);
    }
  };

  // Téléchargement direct du QR Code en image PNG
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const safeTitle = (eventTitle || 'Evenement').replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `QRCode_${mode}_${safeTitle}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Erreur lors de l'export PNG du QR Code :", err);
    }
  };

  // Impression formatée de la fiche A4 prête pour le stand ou la scène
  const handlePrint = () => {
    window.print();
  };

  const isDepot = mode === 'depot';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-encre-noire/75 backdrop-blur-xs select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Styles d'impression dédiés pour une feuille A4 Cordel parfaite */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #120e0c !important;
          }
          nav, header, aside, footer, button, .no-print {
            display: none !important;
          }
          .print-a4-sheet {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 40px !important;
            border: 6px double #120e0c !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-after: always;
          }
        }
      `}</style>

      {/* Carte Modale Principale */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-[6px_14px_8px_12px] bg-[#f4ecd8] text-encre-noire border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] overflow-hidden"
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-2 border-dashed border-cordel-master-dark/25 bg-amber-100/60 no-print">
          <div className="flex items-center gap-2">
            <span className="text-base">{isDepot ? '📸' : '🖼️'}</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
              {isDepot ? "Fiche QR-Code : Récolte Photos & Vidéos" : "Fiche QR-Code : Album Photos Officiel"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded border border-encre-noire/40 hover:border-encre-noire bg-cordel-bg text-encre-noire font-black text-xs flex items-center justify-center cursor-pointer transition-all"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Corps : Aperçu de l'affiche A4 Cordel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center gap-4 text-center">
          <div className="print-a4-sheet w-full border-2 border-dashed border-cordel-master-dark/30 bg-[#fdfaf2] p-5 sm:p-6 rounded-[4px_10px_6px_8px] flex flex-col items-center gap-3.5">
            
            {/* Liseré Cordel et Titre */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#8b2a1a]">
                {isDepot ? "✨ Partagez vos clichés de la Roda ! ✨" : "✨ Album Photos Officiel de la Roda ✨"}
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-encre-noire max-w-sm leading-snug">
                {eventTitle || "Événement O Girador"}
              </h2>
              {formattedDate && (
                <span className="text-xs font-bold text-encre-noire/80 capitalize">
                  📅 {formattedDate} {eventLocation ? `• 📍 ${eventLocation}` : ''}
                </span>
              )}
            </div>

            {/* QR-Code interactif généré sur Canvas (pour export PNG direct) */}
            <div className="p-3.5 bg-white border-2 border-encre-noire rounded-lg shadow-[3px_3px_0px_0px_#181716] my-1 flex items-center justify-center">
              <QRCodeCanvas
                ref={canvasRef}
                value={qrUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#120e0c"
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Consignes pour le public et les musiciens */}
            <div className="flex flex-col items-center gap-1.5 max-w-sm">
              <p className="text-xs font-black text-encre-noire leading-snug">
                {isDepot ? (
                  "Scannez ce QR-Code avec l'appareil photo de votre smartphone pour déposer vos photos et vidéos dans notre espace partagé."
                ) : (
                  "Scannez ce QR-Code avec votre smartphone pour visionner l'album photo complet de la prestation."
                )}
              </p>
              <p className="text-[10px] text-encre-noire/60 font-mono break-all line-clamp-2">
                🔗 {qrUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Pied d'actions : Télécharger PNG, Imprimer A4, Tester et Copier */}
        <div className="p-3 sm:p-4 border-t-2 border-dashed border-cordel-master-dark/25 bg-amber-100/60 flex flex-wrap items-center justify-center gap-2 no-print">
          {/* Bouton Télécharger PNG */}
          <button
            type="button"
            onClick={handleDownloadPng}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-cordel-bg hover:bg-amber-200 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Télécharger l'image du QR Code en haute définition (PNG)"
          >
            <span>💾</span>
            <span>Exporter PNG</span>
          </button>

          {/* Bouton Imprimer Fiche A4 */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-950 bg-[#2d6a4f] text-white hover:bg-emerald-800 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Lancer l'impression formatée A4 prête pour affichage sur place"
          >
            <span>🖨️</span>
            <span>Imprimer Fiche A4</span>
          </button>

          {/* Bouton Copier le lien */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-white hover:bg-amber-100 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
          </button>

          {/* Bouton Ouvrir le lien */}
          <button
            type="button"
            onClick={() => window.open(qrUrl, '_blank', 'noopener,noreferrer')}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-cordel-bg hover:bg-amber-100 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Tester le lien dans un nouvel onglet"
          >
            <span>🔗</span>
            <span>Tester le lien ↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
