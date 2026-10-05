import React, { useEffect, useCallback } from 'react';
import { useTranslation } from '../LanguageContext';
import { SEQUENCIADOR_ROLES } from '../../utils/trainingLauncher';

/**
 * Micro-modale de sélection de secours du pupitre adhérent.
 * S'affiche lorsqu'aucun instrument principal n'est renseigné dans le profil,
 * permettant à l'utilisateur de choisir son pupitre avant de lancer le Séquenceur en mode « Tocar Junto ».
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modale
 * @param {Function} props.onClose - Callback de fermeture/annulation
 * @param {Function} props.onSelectRole - Callback appelé avec l'identifiant du rôle ('caixa', 'marcante', etc.)
 */
export default function RoleSelectorModal({ isOpen, onClose, onSelectRole }) {
  const { t } = useTranslation();

  // Fermeture par la touche Échap
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
      >
        {/* En-tête Cordel */}
        <div className="w-full flex justify-between items-start gap-3 p-4 bg-stone-100/90 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3
              id="role-modal-title"
              className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider break-words block"
            >
              🥁 {t('pedagogy.modalSelectRoleTitle')}
            </h3>
            <p className="text-[11px] text-stone-600 mt-1 leading-snug">
              {t('pedagogy.modalSelectRoleSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1 rounded-lg text-stone-500 hover:text-encre-noire hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('pedagogy.btnCancel')}
          >
            <span className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-xs flex items-center justify-center border border-white hover:bg-red-700 transition-colors shadow-2xs pointer-events-none">
              ✕
            </span>
          </button>
        </div>

        {/* Corps : Grille des 7 pupitres traditionnels */}
        <div className="p-4 bg-cordel-bg-light flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEQUENCIADOR_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  onSelectRole && onSelectRole(role.id);
                  onClose && onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded bg-white hover:bg-amber-50 active:bg-amber-100 border-2 border-encre-noire/25 hover:border-encre-noire text-encre-noire transition-all cursor-pointer shadow-2xs group text-left"
              >
                <div className="w-9 h-9 rounded bg-stone-100 border border-encre-noire/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  <img
                    src={role.icon}
                    alt={role.label}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      // Repli sur favicon si svg indisponible
                      e.currentTarget.src = '/favicon.svg';
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black uppercase tracking-wide group-hover:text-cordel-wood transition-colors">
                    {role.label}
                  </span>
                  <span className="text-[9px] text-stone-500 font-bold">
                    {role.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pied de modale : Bouton Annuler */}
        <div className="p-3 bg-stone-100/90 border-t border-dashed border-cordel-master-dark/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold rounded bg-white hover:bg-stone-50 active:bg-stone-100 border border-encre-noire/25 text-stone-700 transition-all cursor-pointer shadow-2xs select-none"
          >
            {t('pedagogy.btnCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
