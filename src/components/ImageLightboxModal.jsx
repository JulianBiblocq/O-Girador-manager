import React, { useEffect } from 'react';
import CordelCard from './CordelCard';

/**
 * ImageLightboxModal Component
 * Full-screen modal for displaying enlarged member avatars/photos.
 * Features:
 * - Darkened semi-transparent backdrop
 * - Centered responsive enlarged image
 * - Close button (X), backdrop click-to-close, and Escape key listener
 */
export default function ImageLightboxModal({ isOpen, photoURL, name, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !photoURL) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-fadeIn cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo agrandie de ${name || 'Membre'}`}
    >
      {/* Top right close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-cordel-wood text-white hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center font-black text-lg border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] cursor-pointer z-50 transition-transform hover:scale-110 active:scale-95 select-none"
        title="Fermer (Échap)"
      >
        ✕
      </button>

      {/* Centered Modal Container */}
      <div 
        className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <CordelCard 
          variant="default" 
          useExtremeBorder={true} 
          className="p-3 sm:p-4 flex flex-col items-center overflow-hidden max-h-[85vh] bg-cordel-bg-light"
        >
          <img
            src={photoURL}
            alt={name || "Photo agrandie"}
            className="max-h-[72vh] max-w-[85vw] object-contain rounded-sm border-2 border-encre-noire/30 shadow-md"
          />
          {name && (
            <div className="mt-3 text-center">
              <span className="font-cactus font-black text-lg uppercase tracking-wider text-cordel-wood block">
                {name}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-cordel-master-dark/60 block mt-0.5">
                🔍 Vue agrandie
              </span>
            </div>
          )}
        </CordelCard>
      </div>
    </div>
  );
}
