import React from 'react';
import { getCachedAssoName } from '../../hooks/useDynamicManifest';

/**
 * Bandeau discret sur l'écran de connexion indiquant l'association active
 * (résolue depuis l'URL ou depuis `og_last_tenant_id` sur PWA installée),
 * accompagné d'un lien discret permettant de changer d'association.
 */
export default function LoginActiveTenantBadge({ groupId, associationName = '', onChangeGroup }) {
  if (!groupId) return null;
  const displayLabel = associationName || getCachedAssoName(groupId) || groupId;

  return (
    <div className="flex items-center justify-center gap-2 mb-4 px-3 py-1.5 rounded border border-dashed border-cordel-master-dark/30 bg-cordel-bg-light/70 text-[11px]">
      <span className="font-extrabold text-encre-noire truncate max-w-[200px]">
        🥁 {displayLabel}
      </span>
      {onChangeGroup && (
        <button
          type="button"
          onClick={onChangeGroup}
          className="text-[10px] font-bold text-cordel-wood hover:underline cursor-pointer shrink-0"
        >
          Changer d'association
        </button>
      )}
    </div>
  );
}
