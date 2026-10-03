import React from 'react';
import useModalEscape from '../../hooks/useModalEscape';

/**
 * Conteneur de modale standardisé Cordel conforme à la règle d'or 3 étages :
 * - Conteneur global : max-h-[90dvh] flex flex-col w-full overflow-hidden
 * - En-tête : shrink-0
 * - Corps défilant : flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6
 * - Pied de page : shrink-0 border-t p-4 bg-[var(--theme-bg)] flex justify-end gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Indique si la modale est affichée
 * @param {Function} props.onClose Callback de fermeture (clic backdrop ou Échap)
 * @param {React.ReactNode} props.header Contenu de l'en-tête (Titre + Fermer ✖)
 * @param {React.ReactNode} props.children Contenu du corps (Formulaires, champs, listes)
 * @param {React.ReactNode} [props.footer] Contenu du pied de page (Boutons d'action)
 * @param {string} [props.maxWidth="max-w-lg"] Largeur maximale (ex: max-w-md, max-w-2xl, max-w-3xl)
 * @param {string} [props.className] Classes supplémentaires sur le conteneur principal
 * @param {string} [props.bodyClassName] Classes supplémentaires sur la zone de défilement
 */
export default function CordelModalWrapper({
  isOpen = true,
  onClose,
  header,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = '',
  bodyClassName = ''
}) {
  useModalEscape(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose(e);
        }
      }}
    >
      <div
        className={`relative ${maxWidth} max-h-[90dvh] flex flex-col w-full overflow-hidden rounded-[8px_12px_10px_9px] border-2 border-encre-noire bg-cordel-bg text-encre-noire shadow-[4px_4px_0px_0px_#181716] mt-2 sm:mt-0 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Étage 1 : En-tête fixe */}
        {header && (
          <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 bg-cordel-bg-light flex items-start justify-between gap-3">
            {header}
          </div>
        )}

        {/* Étage 2 : Corps défilable */}
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Étage 3 : Pied de page fixe */}
        {footer && (
          <div className="shrink-0 border-t-2 border-dashed border-cordel-master-dark/20 p-4 bg-[var(--theme-bg)] flex justify-end items-center gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
