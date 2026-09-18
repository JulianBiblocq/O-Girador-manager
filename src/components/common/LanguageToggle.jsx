import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de bascule de langue global (FR / BR).
 * Permet d'inverser la langue courante (Français / Portugais)
 * avec retour visuel immédiat et surbrillance aux couleurs du thème Cordel.
 * 
 * @param {Object} props
 * @param {string} [props.className] - Classes Tailwind additionnelles
 * @param {boolean} [props.stopPropagation=true] - Empêche la propagation du clic (ex: pour rester dans un tiroir)
 */
export default function LanguageToggle({ className = "", stopPropagation = true }) {
  const { locale, toggleLanguage } = useTranslation();

  const handleClick = (e) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    toggleLanguage();
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className={`theme-btn px-2.5 py-1 text-[11px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center gap-1 min-w-[42px] min-h-7 select-none transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${className}`}
      title={locale === 'fr' ? "Mudar para Português (Brasil)" : "Changer en Français"}
      aria-label={locale === 'fr' ? "Passer en Portugais Brésilien" : "Passer en Français"}
    >
      <span className={locale === 'fr' ? 'font-black text-cordel-wood' : 'opacity-40'}>FR</span>
      <span className="opacity-25">/</span>
      <span className={locale === 'pt' ? 'font-black text-cordel-wood' : 'opacity-40'}>BR</span>
    </button>
  );
}
