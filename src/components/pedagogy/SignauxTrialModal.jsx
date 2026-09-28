// Modale d'essai du quiz de Reconnaissance des Signes du Mestre
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React from 'react';
import CordelCard from '../CordelCard';
import QcmSignaux from './QcmSignaux';

export default function SignauxTrialModal({ isOpen, onClose, groupId = null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <CordelCard
        variant="default"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-[#fdfaf2] border-2 border-encre-noire shadow-2xl flex flex-col gap-4 select-none relative animate-fadeIn"
      >
        {/* En-tête */}
        <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖐️</span>
            <h3 className="text-base font-black uppercase tracking-wider text-cordel-wood">
              Essai du Défi : Reconnaissance des Signes
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black uppercase px-2 py-1 bg-white border border-encre-noire rounded hover:bg-neutral-100 cursor-pointer"
          >
            ✕ Fermer
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
