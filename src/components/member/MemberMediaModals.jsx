import React from 'react';
import TablatureModal from '../mestre/TablatureModal';
import SongCard from '../SongCard';
import CultureCard from '../CultureCard';

/**
 * Modales de consultation multimédia pour le Répertoire Adhérent.
 * Isole les fenêtres modales de Tablature, Toada et Fiche Culture (Règle Anti-Monolithe).
 */
export default function MemberMediaModals({
  activeTablaturePiece,
  onCloseTablature,
  activeToadaToView,
  onCloseToada,
  activeCultureDocToView,
  onCloseCulture,
  groupId,
  profileData
}) {
  return (
    <>
      {/* Modale de consultation de la tablature */}
      <TablatureModal
        isOpen={Boolean(activeTablaturePiece)}
        onClose={onCloseTablature}
        piece={activeTablaturePiece}
      />

      {/* Modale de consultation d'une Toada (paroles) */}
      {activeToadaToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-[580px] max-h-[92vh] flex flex-col min-h-0 bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
            <div className="w-full flex justify-between items-center px-4 py-2.5 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
              <span className="text-xs font-black uppercase text-cordel-wood tracking-wider">
                🗣️ Chant &amp; Paroles {activeToadaToView.titre ? `— ${activeToadaToView.titre}` : ''}
              </span>
              <button
                type="button"
                onClick={onCloseToada}
                className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="w-full flex-1 min-h-0 overflow-y-auto p-4 bg-cordel-bg-light flex flex-col items-center">
              <SongCard song={activeToadaToView} defaultRevisionMode={false} groupId={groupId} profileData={profileData} />
            </div>
          </div>
        </div>
      )}

      {/* Modale de consultation d'une Fiche Culture */}
      {activeCultureDocToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-[620px] max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={onCloseCulture}
              className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-md cursor-pointer"
            >
              ✕
            </button>
            <CultureCard culture={activeCultureDocToView} />
          </div>
        </div>
      )}
    </>
  );
}
