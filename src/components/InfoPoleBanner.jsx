import React from 'react';
import { usePoleGuide } from '../hooks/usePoleGuide';

/**
 * Composant : InfoPoleBanner
 * 
 * Bannière d'aide contextuelle dépliable aux couleurs et motifs de la charte Cordel.
 * Guide les membres du bureau et de la mestria au sommet de chaque pôle/onglet.
 * 
 * @param {string} currentPole - Identifiant du pôle actif
 * @param {string} currentTab - Identifiant de l'onglet actif
 * @param {boolean} [forceShow] - Optionnel : force l'affichage sans tenir compte de l'état masqué
 * @param {Function} [onClose] - Optionnel : callback de fermeture
 */
export default function InfoPoleBanner({ currentPole, currentTab, forceShow = false, onClose }) {
  const { guide, isHidden, hideBanner } = usePoleGuide(currentTab, currentPole);

  // Si aucun guide n'est défini pour cet onglet/pôle, ne rien afficher
  if (!guide) return null;

  // Si le guide est masqué par l'utilisateur (et pas forcé), ne rien afficher
  if (isHidden && !forceShow) return null;

  const handleHide = () => {
    hideBanner();
    if (onClose) onClose();
  };

  const bannerTitle = guide.titre || guide.title;
  const bannerSteps = guide.etapes || guide.steps || [];

  return (
    <div className="w-full mb-4 p-4 sm:p-5 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] shadow-[2.5px_2.5px_0px_0px_#181716] transition-all animate-fade-in relative overflow-hidden select-none">
      
      {/* Bandeau d'en-tête décoratif Cordel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/30 border border-encre-noire/30 text-amber-900 text-sm shrink-0">
            💡
          </span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
            {bannerTitle}
          </h3>
        </div>

        {/* Bouton de confirmation / masquage en Vert Validation officiel Cordel */}
        <button
          type="button"
          onClick={handleHide}
          className="self-end sm:self-auto px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-900 bg-[#2d6a4f] text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
          title="Masquer ce guide pour cet onglet (réouvrable via le bouton 💡 Aide du pôle)"
        >
          <span>✓</span>
          <span>Compris / Masquer</span>
        </button>
      </div>

      {/* Texte de description explicative */}
      <p className="text-xs text-encre-noire/90 font-medium leading-relaxed mb-3">
        {guide.description}
      </p>

      {/* Liste numérotée des étapes logiques à suivre */}
      {Array.isArray(bannerSteps) && bannerSteps.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
          <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
            Étapes logiques à suivre :
          </span>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {bannerSteps.map((step, idx) => (
              <li 
                key={idx}
                className="flex items-start gap-2 bg-cordel-bg/60 p-2 rounded border border-encre-noire/15"
              >
                <span className="w-4 h-4 rounded-full bg-cordel-wood text-white text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-medium leading-snug text-encre-noire/90">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * Bouton d'icône / déclencheur : InfoPoleHelpButton
 * 
 * S'intègre dans la barre d'onglets pour permettre à l'utilisateur
 * de réouvrir la bannière d'aide si elle a été masquée.
 * 
 * @param {string} currentPole - Identifiant du pôle actif
 * @param {string} currentTab - Identifiant de l'onglet actif
 */
export function InfoPoleHelpButton({ currentPole, currentTab }) {
  const { guide, isHidden, toggleBanner } = usePoleGuide(currentTab, currentPole);

  // Si aucun guide n'est disponible pour cet onglet, ne pas afficher le bouton
  if (!guide) return null;

  return (
    <button
      type="button"
      onClick={toggleBanner}
      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
        isHidden
          ? 'bg-amber-100/90 text-amber-900 border-amber-900/60 hover:bg-amber-200 shadow-[1.5px_1.5px_0px_0px_#181716]'
          : 'bg-amber-300 text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
      }`}
      title={isHidden ? "Afficher l'aide contextuelle de cet onglet" : "Masquer l'aide contextuelle"}
    >
      <span className="text-xs">💡</span>
      <span>Aide du pôle</span>
    </button>
  );
}
