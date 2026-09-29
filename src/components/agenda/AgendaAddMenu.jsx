import React, { useState, useRef, useEffect } from 'react';
import CordelButton from '../CordelButton';
import { XiloCalendar } from '../XiloIcons';

/**
 * Composant : AgendaAddMenu
 * 
 * Menu déroulant contextuel Cordel fusionnant l'ajout d'événement :
 * 1. 📅 Événement ponctuel (Prestation, répétition, stage, atelier, réunion)
 * 2. ⚡ Série de répétitions (Planification groupée pour la saison)
 * 
 * @param {Function} onAddSingle - Callback d'ouverture du formulaire d'événement standard
 * @param {Function} onAddBatch - Callback d'ouverture de la modale de répétitions en série
 * @param {Function} t - Fonction de traduction i18n
 */
export default function AgendaAddMenu({ onAddSingle, onAddBatch, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fermeture automatique au clic à l'extérieur (souris et tactile)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectSingle = () => {
    setIsOpen(false);
    if (onAddSingle) onAddSingle();
  };

  const handleSelectBatch = () => {
    setIsOpen(false);
    if (onAddBatch) onAddBatch();
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bouton déclencheur Cordel [+ Ajouter ▾] */}
      <CordelButton
        variant="default"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-xs px-3 py-1.5 uppercase tracking-widest font-black flex items-center gap-1.5"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{t('widgetAgenda.addBtn') || "+ Ajouter"}</span>
        <span className={`text-[10px] transition-transform duration-200 select-none ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </CordelButton>

      {/* Popover / Menu contextuel Cordel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-64 sm:w-72 bg-[#f4ecd8] dark:bg-[#201d1a] border-2 border-encre-noire rounded-[8px_5px_9px_6px] shadow-[3px_3px_0px_0px_#181716] z-50 overflow-hidden flex flex-col animate-fadeIn select-none"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Option 1 : Événement ponctuel */}
          <button
            type="button"
            onClick={handleSelectSingle}
            className="w-full p-2.5 sm:p-3 text-left hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors flex items-start gap-2.5 cursor-pointer group"
            role="menuitem"
          >
            <span className="p-1 rounded bg-amber-200/70 dark:bg-amber-900/50 border border-encre-noire/30 text-base shrink-0 group-hover:scale-110 transition-transform">
              📅
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-xs uppercase tracking-wide text-encre-noire dark:text-[#f4ecd8]">
                {t('widgetAgenda.addSingleEvent') || "Événement ponctuel"}
              </span>
              <span className="text-[10px] text-cordel-master-dark/80 dark:text-[#f4ecd8]/70 font-medium leading-tight mt-0.5">
                {t('widgetAgenda.addSingleEventDesc') || "Prestation, répétition, stage, atelier ou réunion"}
              </span>
            </div>
          </button>

          {/* Séparateur pointillé Cordel */}
          <div className="border-t border-dashed border-encre-noire/25" />

          {/* Option 2 : Série de répétitions */}
          <button
            type="button"
            onClick={handleSelectBatch}
            className="w-full p-2.5 sm:p-3 text-left hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors flex items-start gap-2.5 cursor-pointer group"
            role="menuitem"
          >
            <span className="p-1 rounded bg-amber-300 dark:bg-amber-800/60 border border-encre-noire/30 text-base shrink-0 group-hover:scale-110 transition-transform">
              ⚡
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-xs uppercase tracking-wide text-encre-noire dark:text-[#f4ecd8] flex items-center gap-1.5">
                <span>{t('widgetAgenda.addBatchRehearsals') || "Série de répétitions"}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-300/80 text-amber-950 font-black border border-amber-900/30">
                  Saison
                </span>
              </span>
              <span className="text-[10px] text-cordel-master-dark/80 dark:text-[#f4ecd8]/70 font-medium leading-tight mt-0.5">
                {t('widgetAgenda.addBatchRehearsalsDesc') || "Planifier les dates récurrentes pour la saison"}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
