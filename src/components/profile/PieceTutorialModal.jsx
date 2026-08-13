import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { getEmbedVideoUrl } from './AtelierCouture';
import { XiloClose } from '../XiloIcons';

/**
 * PieceTutorialModal Component
 * Displays the full multimedia booklet formater when a member opens a costume element tutorial.
 */
export default function PieceTutorialModal({ piece, workshop, onClose }) {
  if (!piece) return null;

  const title = workshop?.titre || piece.name || "Tutoriel Couture";
  const description = workshop?.description || "";
  const cost = workshop?.cost;
  const materiel = workshop?.materiel || "";
  const content = workshop?.content || piece.tutorialNotes || "Aucune instruction spécifique enregistrée pour cette pièce.";
  const embedVideo = getEmbedVideoUrl(workshop?.videoUrl);
  const images = workshop?.images || [];
  const pdfFiles = workshop?.pdfFiles || [];

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex justify-between items-start bg-cordel-bg">
          <div>
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider mb-1 inline-block">
              🧵 Fiche Livret Atelier Couture
            </span>
            <h3 className="font-cactus font-black text-lg text-encre-noire tracking-wide flex items-center gap-2 flex-wrap">
              {title}
              {cost > 0 && (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] font-black uppercase">
                  Coût : {cost} €
                </span>
              )}
            </h3>
            {description && (
              <p className="text-xs text-cordel-master-dark font-medium italic opacity-90 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer p-1"
            title="Fermer (Échap)"
          >
            <XiloClose size={20} />
          </button>
        </div>

        {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Piece Badge & Notes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-cordel-wood">Élément de costume :</span>
              <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2 py-0.5 font-bold">
                {piece.name}
              </span>
              {piece.isMandatory !== false ? (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-2 py-0.5">
                  ★ Obligatoire
                </span>
              ) : (
                <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">
                  Optionnel
                </span>
              )}
            </div>

            {(piece.description || piece.tutorialNotes) && (
              <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-300/40 text-amber-900 dark:text-amber-200 font-bold">
                💡 <strong>Remarque / Matériaux spécifiques :</strong> {piece.description || piece.tutorialNotes}
              </div>
            )}
          </div>

          {/* Section A: Matériel Nécessaire */}
          {materiel && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded border border-dashed border-amber-600/30 flex flex-col gap-1 text-xs">
              <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                🧵 Matériel Nécessaire
              </h4>
              <div className="whitespace-pre-wrap font-medium opacity-90 pl-1">
                {materiel}
              </div>
            </div>
          )}

          {/* Section B: Étapes de Fabrication */}
          {content && (
            <div className="flex flex-col gap-1 text-xs">
              <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                📜 Étapes de Fabrication pas à pas
              </h4>
              <div className="bg-white/60 dark:bg-black/30 p-4 rounded border border-dashed border-cordel-master-dark/20 whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </div>
          )}

          {/* Section C: Lecteur Vidéo */}
          {embedVideo && (
            <div className="flex flex-col gap-2">
              <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                🎬 Vidéo de démonstration pas à pas
              </h4>
              <div className="relative aspect-video w-full rounded border-2 border-encre-noire overflow-hidden bg-black shadow-md">
                <iframe
                  src={embedVideo}
                  title="Vidéo tutoriel"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Section D: Galerie de Schémas & Photos */}
          {images.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                🖼️ Photos & Schémas de Montage ({images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group border border-cordel-master-dark/20 rounded overflow-hidden bg-white shadow-xs block"
                  >
                    <img src={img.url} alt={img.name || 'Patron'} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-encre-noire/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">
                      🔍 Voir l'image
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Section E: PDF Files */}
          {pdfFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                📄 Documents Joints (PDF)
              </h4>
              <div className="flex flex-wrap gap-2">
                {pdfFiles.map((pdf, idx) => (
                  <a
                    key={idx}
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-cordel-wood text-white hover:bg-cordel-wood/90 px-3 py-1.5 rounded font-bold text-xs border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]"
                  >
                    <span>📄 {pdf.name}</span>
                    <span className="text-[8px] uppercase bg-white/20 px-1 py-0.5 rounded">Ouvrir ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer (Fixe en bas) */}
        <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/15 flex justify-end bg-cordel-bg">
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={onClose}
            className="py-1.5 px-4 text-xs font-black uppercase tracking-wider"
          >
            Fermer la fiche
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
