// Modale d'essai du quiz de Reconnaissance des Signes du Mestre
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React from 'react';
import CordelCard from '../CordelCard';
import QcmSignaux from './QcmSignaux';
import { useTranslation } from '../LanguageContext';

export default function SignauxTrialModal({ isOpen, onClose, groupId = null }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <CordelCard
        variant="default"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-[#fdfaf2] border-2 border-encre-noire shadow-2xl flex flex-col gap-4 select-none relative animate-fadeIn mt-2 sm:mt-0"
      >
        {/* En-tête */}
        <div className="flex justify-between items-start gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
          <div className="flex-1 min-w-0 pr-2 flex items-start gap-2">
            <span className="text-xl">🖐️</span>
            <h3 className="text-base font-black uppercase tracking-wider text-cordel-wood">{t('pedagogy.reflex.essaiDuDefiReconnaissanceDes')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-[var(--color-cordel-wood,#8b2a1a)] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Intégration du composant QcmSignaux */}
        <div className="w-full">
          <QcmSignaux onExit={onClose} groupId={groupId} />
        </div>
      </CordelCard>
    </div>
  );
}
