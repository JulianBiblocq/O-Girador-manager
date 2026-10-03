import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Volet contextuel (Bottom Sheet / Modal popover) pour choisir le signal
 * d'une mesure spécifique parmi les 4 options précalculées (1 vrai + 3 leurres).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité du volet
 * @param {Function} props.onClose - Fermeture du volet
 * @param {Object|null} props.slot - Données de l'emplacement cible
 * @param {Object|null} props.currentAssignedSignal - Signal actuellement affecté à la case
 * @param {Function} props.onSelectSignal - Callback de sélection d'un signal
 * @param {Function} props.onRemoveSignal - Callback de suppression du signal de la case
 */
export default function ConductorSignalPickerSheet({
  isOpen,
  onClose,
  slot,
  currentAssignedSignal = null,
  onSelectSignal,
  onRemoveSignal
}) {
  const { t } = useTranslation();
  if (!isOpen || !slot) return null;

  const options = slot.options || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-cordel-bg p-4 rounded-t-2xl sm:rounded-xl shadow-2xl border-2 border-encre-noire text-left flex flex-col gap-3 animate-fadeIn">
        {/* En-tête du volet */}
        <div className="flex justify-between items-start gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
          <div className="flex-1 min-w-0 pr-2 flex items-start gap-2">
            <span className="text-xl">🖐️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider">
                {t('pedagogy.reflex.signalALaMesure')} {slot.mesure}
              </h3>
              <p className="text-[10px] font-bold text-encre-noire/70">{t('pedagogy.reflex.quelGesteOuAppelLe')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-white hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            aria-label={t('pedagogy.reflex.fermerBouton', 'Fermer')}
            title={t('pedagogy.reflex.fermerBouton')}
          >
              <span className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white hover:bg-red-700 transition-colors shadow-2xs pointer-events-none">
                ✕
              </span>
          </button>
        </div>

        {/* Grille des 4 choix contextuels */}
        <div className="grid grid-cols-2 gap-2.5 py-1">
          {options.map((opt, idx) => {
            const isSelected = currentAssignedSignal?.id === opt.id || currentAssignedSignal?.name === opt.name;

            return (
              <button
                key={opt.id || idx}
                type="button"
                onClick={() => {
                  onSelectSignal(opt);
                  onClose();
                }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100/90 border-[var(--color-cordel-ocre,#c05621)] shadow-[2px_2px_0px_0px_#c05621] scale-102 font-black'
                    : 'bg-[#fdfaf2] border-encre-noire/30 hover:border-encre-noire hover:shadow-[2px_2px_0px_0px_#181716] active:scale-98'
                }`}
              >
                <div className="w-12 h-12 rounded bg-stone-900/10 flex items-center justify-center overflow-hidden border border-encre-noire/20">
                  {opt.imageUrl ? (
                    <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">✋</span>
                  )}
                </div>

                <span className="text-xs font-black text-encre-noire leading-tight line-clamp-2">
                  {opt.name}
                </span>

                {isSelected && (
                  <span className="text-[9px] font-black text-[var(--color-cordel-vert,#2d6a4f)]">{t('pedagogy.reflex.actuellementPose')}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action de retrait si la case était occupée */}
        {currentAssignedSignal && (
          <div className="pt-2 border-t border-dashed border-cordel-master-dark/15 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onRemoveSignal();
                onClose();
              }}
              className="text-[10px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>✕</span>
              <span>{t('pedagogy.reflex.retirerLeSignalDeLa')} {slot.mesure}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
