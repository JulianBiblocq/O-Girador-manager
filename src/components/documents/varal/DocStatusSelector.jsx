import React, { useState } from 'react';

/**
 * Sélecteur modulaire du statut d'un document sur le Varal.
 * Propose 3 options exclusives conformément à la charte sémantique Cordel :
 * 1. Afficher sur le Varal (Visible - Vert validation)
 * 2. Ne pas afficher / Masquer (Brouillon - Ocre ambré)
 * 3. Archiver (Archive - Terre cuite / Bois)
 *
 * @param {Object} props
 * @param {Object} props.docItem Document ciblé
 * @param {Function} props.onStatusChange Fonction asynchrone (status: 'visible'|'hidden'|'archived') => Promise<void>
 * @param {boolean} [props.isAuthorized=true] Droits d'administration requis
 * @param {string} [props.className=''] Classes CSS personnalisées
 */
export default function DocStatusSelector({
  docItem,
  onStatusChange,
  isAuthorized = true,
  className = ''
}) {
  const [loadingStatus, setLoadingStatus] = useState(null);

  if (!isAuthorized || !docItem) return null;

  const isArchived = Boolean(docItem.isArchived);
  const isHidden = Boolean(docItem.isHidden) && !isArchived;
  const isVisible = !docItem.isHidden && !isArchived;

  const currentStatus = isArchived ? 'archived' : isHidden ? 'hidden' : 'visible';

  const handleSelect = async (newStatus) => {
    if (newStatus === currentStatus || loadingStatus) return;
    setLoadingStatus(newStatus);
    try {
      if (onStatusChange) {
        await onStatusChange(newStatus);
      }
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 p-2 sm:p-2.5 bg-[#fdfaf2] dark:bg-[#1a1816] border-2 border-dashed border-encre-noire/25 rounded-md shadow-xs select-none ${className}`}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark opacity-75 flex items-center gap-1">
          <span>⚙️</span>
          <span>Statut sur le Varal :</span>
        </span>
        {loadingStatus && (
          <span className="text-[9px] font-bold text-[var(--color-cordel-ocre,#c05621)] animate-pulse">
            Mise à jour en cours...
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Option 1 : Afficher sur le Varal */}
        <button
          type="button"
          disabled={Boolean(loadingStatus)}
          onClick={() => handleSelect('visible')}
          className={`py-1.5 px-2 rounded-[4px_6px_3px_5px] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isVisible
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] scale-[1.02]'
              : 'bg-white/80 dark:bg-neutral-800/80 text-cordel-master-dark dark:text-neutral-200 border border-encre-noire/20 hover:border-encre-noire/50 hover:bg-white active:scale-95'
          }`}
          title="Visible pour tous les élèves et membres sur le Varal"
        >
          <span>👁️</span>
          <span className="truncate">Afficher</span>
        </button>

        {/* Option 2 : Ne pas afficher (Masquer) */}
        <button
          type="button"
          disabled={Boolean(loadingStatus)}
          onClick={() => handleSelect('hidden')}
          className={`py-1.5 px-2 rounded-[4px_6px_3px_5px] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isHidden
              ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] scale-[1.02]'
              : 'bg-white/80 dark:bg-neutral-800/80 text-cordel-master-dark dark:text-neutral-200 border border-encre-noire/20 hover:border-encre-noire/50 hover:bg-white active:scale-95'
          }`}
          title="Masqué aux membres (Brouillon / En cours de préparation par les encadrants)"
        >
          <span>🙈</span>
          <span className="truncate">Masquer</span>
        </button>

        {/* Option 3 : Archiver */}
        <button
          type="button"
          disabled={Boolean(loadingStatus)}
          onClick={() => handleSelect('archived')}
          className={`py-1.5 px-2 rounded-[4px_6px_3px_5px] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isArchived
              ? 'bg-[var(--color-cordel-wood,#8b2a1a)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] scale-[1.02]'
              : 'bg-white/80 dark:bg-neutral-800/80 text-cordel-master-dark dark:text-neutral-200 border border-encre-noire/20 hover:border-encre-noire/50 hover:bg-white active:scale-95'
          }`}
          title="Archivé (anciennes saisons ou répertoire passé)"
        >
          <span>📦</span>
          <span className="truncate">Archiver</span>
        </button>
      </div>
    </div>
  );
}
