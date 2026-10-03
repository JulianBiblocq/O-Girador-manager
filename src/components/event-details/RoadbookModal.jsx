import React from 'react';
import RoadbookInteractiveContent from './RoadbookInteractiveContent';
import RoadbookPrintView from './RoadbookPrintView';
import { useEventCommissions } from '../../hooks/useEventCommissions';
import { useTranslation } from '../LanguageContext';
import useModalEscape from '../../hooks/useModalEscape';

/**
 * Modale de consultation de la Feuille de Route (Roadbook) du jour J.
 * Affichage sobre et contrasté (thème Cordel), optimisé smartphone et imprimable en A4.
 */
export default function RoadbookModal({
  isOpen,
  onClose,
  event = {},
  allUsers = [],
  presentsByInstrument = {},
  onNavigateToStageLayout,
  t
}) {
  const { t: contextT } = useTranslation();

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose);

  const tr = (key) => {
    const val = typeof t === 'function' ? t(key) : null;
    return (val && val !== key) ? val : contextT(key);
  };
  const hasCommissions = Boolean(event?.hasCommissions);
  const { commissions = [] } = useEventCommissions(hasCommissions && isOpen ? event.id : null);

  if (!isOpen) return null;

  const isStageLayoutPublished = Boolean(
    event.isStageLayoutPublished || event.stageLayout?.isPublished
  );

  const handlePrint = () => {
    window.print();
  };

  // Navigation vers le plan de scène — la fermeture de la modale
  // est gérée par le callback parent (EventDetails.onNavigateToStageLayout)
  const handleGoToStage = () => {
    if (onNavigateToStageLayout) {
      onNavigateToStageLayout();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadbook-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm select-none"
    >
      {/* Conteneur principal écran avec fond crème opaque Cordel */}
      <div className="print:hidden relative w-full max-w-3xl max-h-[90dvh] flex flex-col bg-[#f4ecd8] dark:bg-[#1a1a1a] text-encre-noire rounded-xl border-2 border-encre-noire shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-0">
        {/* Barre d'outils / En-tête */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-4 py-3 border-b-2 border-encre-noire bg-[#e7d5c1] dark:bg-[#252525]">
          <div className="flex-1 min-w-0 pr-2 flex items-start gap-2">
            <span className="text-xl">📄</span>
            <div>
              <h2 id="roadbook-modal-title" className="font-bold text-base sm:text-lg text-encre-noire m-0 leading-tight">
                {tr('agenda.roadbookTitle') || 'Feuille de Route'}
              </h2>
              <span className="text-xs text-[var(--color-cordel-marron)] truncate block max-w-[200px] sm:max-w-md">
                {event.titre || 'Événement'}
              </span>
            </div>
          </div>

          {/* Actions : Imprimer, Plan de scène, Fermer */}
          <div className="flex items-center gap-2">
            {isStageLayoutPublished && (
              <button
                type="button"
                onClick={handleGoToStage}
                className="px-2.5 py-1.5 text-xs font-bold bg-[var(--color-cordel-vert)] text-white rounded hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                title="Consulter le plan de scène publié"
              >
                <span>📐</span>
                <span className="hidden sm:inline">{tr('agenda.stagePlan') || 'Plan de scène'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 text-xs font-bold bg-[var(--color-cordel-ocre)] text-white rounded hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
              title="Imprimer ou générer le PDF A4"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">{tr('agenda.printRoadbook') || 'Imprimer / PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-1 rounded-lg text-neutral-600 hover:text-black hover:bg-black/10 active:bg-black/15 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
              title={tr('agenda.closeRoadbook') || 'Fermer'}
              aria-label={tr('agenda.closeRoadbook') || 'Fermer'}
            >
              <span className="text-xl font-black leading-none pointer-events-none">✕</span>
            </button>
          </div>
        </div>

        {/* Corps défilable de la modale interactive */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <RoadbookInteractiveContent
            event={event}
            allUsers={allUsers}
            presentsByInstrument={presentsByInstrument}
            commissions={commissions}
          />
        </div>

        {/* Pied de page modale */}
        <div className="shrink-0 px-4 py-2.5 border-t-2 border-encre-noire bg-[#e7d5c1] dark:bg-[#252525] flex justify-between items-center text-xs text-cordel-wood dark:text-amber-400 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <span className="truncate font-semibold">
            📅 {event.date || 'Date à définir'} • {event.lieu || 'Lieu à définir'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white/90 dark:bg-stone-700 hover:bg-white text-encre-noire border border-encre-noire/30 rounded font-bold text-xs cursor-pointer shadow-xs shrink-0"
          >
            {tr('agenda.closeRoadbook') || 'Fermer'}
          </button>
        </div>
      </div>

      {/* Rendu imprimable A4 (masqué à l'écran, visible uniquement pour window.print()) */}
      <div className="hidden print:block w-full">
        <RoadbookPrintView
          event={event}
          allUsers={allUsers}
          presentsByInstrument={presentsByInstrument}
          commissions={commissions}
        />
      </div>
    </div>
  );
}
