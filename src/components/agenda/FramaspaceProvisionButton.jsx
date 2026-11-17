import React from 'react';

/**
 * Bouton « ⚡ Créer le dossier Framaspace » (provisionnement automatique 1 clic).
 * À n'afficher que si l'association a configuré Framaspace (`hasFramaspace`).
 *
 * @param {Object} props
 * @param {boolean} [props.compact=false] - Variante réduite (à côté du champ de lien)
 * @param {boolean} props.provisioning - Création en cours
 * @param {boolean} [props.saving=false] - Formulaire en cours d'enregistrement
 * @param {Function} props.onClick - Déclencheur du provisionnement
 */
export default function FramaspaceProvisionButton({ compact = false, provisioning, saving = false, onClick }) {
  const sizeClass = compact ? 'px-2 py-0.5 text-[8.5px] shadow-sm' : 'px-2.5 py-1 text-[9px] shadow-xs';
  const idleLabel = compact ? 'Créer sur Framaspace' : 'Créer le dossier Framaspace en 1 clic';
  const busyLabel = compact ? 'Création...' : 'Création en cours...';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={provisioning || saving}
      className={`${sizeClass} bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black uppercase rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50`}
      title="Créer automatiquement le dossier sur Framaspace et insérer le lien de dépôt public"
    >
      <span className={provisioning ? 'animate-spin' : ''}>{provisioning ? '⏳' : '⚡'}</span>
      <span>{provisioning ? busyLabel : idleLabel}</span>
    </button>
  );
}
