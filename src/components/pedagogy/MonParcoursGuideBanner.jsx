import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';

const STORAGE_KEY = 'pole_guide_hidden_mon_parcours';

/**
 * Bannière d'aide standardisée Cordel pour 'Mon Parcours'
 * Inspirée de la structure InfoPoleBanner avec persistance localStorage
 * et bouton discret de réouverture 💡.
 */
export default function MonParcoursGuideBanner() {
  const { t } = useTranslation();
  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const handleHide = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage :", e);
    }
    setIsHidden(true);
  };

  const handleShow = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Impossible de réinitialiser la préférence dans localStorage :", e);
    }
    setIsHidden(false);
  };

  // État masqué : rappel discret via l'icône ampoule 💡
  if (isHidden) {
    return (
      <div className="w-full flex justify-end -mt-1 mb-2">
        <button
          type="button"
          onClick={handleShow}
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
          title={`💡 ${t('monParcoursGuideButton') || "Aide : Où apprendre et réviser ?"}`}
          aria-label="Afficher l'aide Où apprendre et réviser ?"
        >
          <span className="text-xs">💡</span>
          <span>{t('monParcoursGuideButton') || "Aide : Où apprendre et réviser ?"}</span>
        </button>
      </div>
    );
  }

  // État affiché : format standard InfoPoleBanner
  return (
    <div className="w-full p-4 sm:p-5 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] shadow-[2.5px_2.5px_0px_0px_#181716] transition-all animate-fade-in relative overflow-hidden select-none text-left">
      {/* En-tête Cordel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/30 border border-encre-noire/30 text-amber-900 text-sm shrink-0">
            💡
          </span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
            {t('monParcoursGuideTitle') || "Où apprendre et réviser ?"}
          </h3>
        </div>

        {/* Bouton de confirmation / masquage en Vert Validation officiel Cordel */}
        <button
          type="button"
          onClick={handleHide}
          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-900 bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
          title="Masquer ce guide (réouvrable à tout moment via le bouton 💡)"
        >
          <span>✓</span>
          <span>Compris / Masquer</span>
        </button>
      </div>

      {/* Texte descriptif */}
      <p className="text-xs text-encre-noire/90 font-medium leading-relaxed">
        {t('monParcoursGuideDesc') || "Avant de tester tes acquis ici, retrouve tous les détails (fiches complètes, audios, explications) dans les Varals (cordes à linge) situés tout en bas de la page d'accueil !"}
      </p>
    </div>
  );
}
