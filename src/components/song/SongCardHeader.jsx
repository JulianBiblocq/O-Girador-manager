import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * En-tête de la fiche de chant SongCard :
 * Titre, badges rythme & nation, bouton d'impression et bouton de demande de révision 1-clic.
 */
export default function SongCardHeader({
  song,
  isPrintVersion = false,
  isRevealedMode = true,
  effectiveIsRequested = false,
  onToggleRevision = null,
  onOpenPrintModal = null
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-dashed border-cordel-master-dark/20 pb-3 gap-2 w-full text-left">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl select-none">🎵</span>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-cordel-wood">
            {song?.titre || t('pedagogy.progress.toadaSansTitre') || "Toada sans titre"}
          </h2>
          {song?.rythme && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 text-[9px] font-black uppercase">
              {song.rythme}
            </span>
          )}
          {song?.nacao && (
            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300 text-[9px] font-bold">
              {song.nacao}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 print:hidden self-end sm:self-center">
        {/* Bouton de demande de révision 1-clic */}
        {onToggleRevision && (
          <button
            type="button"
            onClick={onToggleRevision}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer shadow-2xs flex items-center gap-1 select-none ${
              effectiveIsRequested
                ? 'bg-amber-100 border-amber-900 text-amber-950 font-black'
                : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
            title="Demander à réviser ce chant au prochain atelier"
          >
            <span>{effectiveIsRequested ? '★' : '☆'}</span>
            <span>{effectiveIsRequested ? "À réviser" : "Réviser"}</span>
          </button>
        )}

        {/* Bouton d'impression Cordel */}
        {!isPrintVersion && onOpenPrintModal && (
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs flex items-center gap-1 select-none"
            title="Imprimer le livret de chant"
          >
            <span>🖨️</span>
            <span>{t('common.print') || "Imprimer"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
