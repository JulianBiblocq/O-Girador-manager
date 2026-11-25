import React from 'react';
import XiloAvatar from '../../XiloAvatar';

/**
 * Puce d'un bénévole inscrit sur un créneau (`member` | `guest` | `external`).
 * Respecte strictement la confidentialité :
 * - Simple membre sur un `external` : affiche uniquement `Prénom Nom (Externe)`.
 * - Admin / Référent : accès à la fiche logistique complète et au retrait du créneau.
 */
export default function VolunteerInscritBadge({
  inscrit,
  shift,
  allUsers = [],
  currentUserUid = null,
  canManage = false,
  onInspectExternal,
  onRemoveInscrit,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  if (inscrit.type === 'external') {
    const fullName = `${inscrit.prenom || ''} ${inscrit.nom || ''}`.trim() || 'Bénévole';
    const extLabel = t('agenda.volunteerExternalBadge') || 'Externe';

    if (!canManage) {
      return (
        <div className="inline-flex items-center gap-1 bg-[var(--cordel-bg)] border border-[var(--theme-border)]/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">
          <span>{fullName} ({extLabel})</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 px-1.5 py-0.5 rounded text-[10px] font-semibold">
        <span>{fullName}</span>
        <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25 opacity-85">
          {extLabel}
        </span>
        {onInspectExternal && (
          <button
            type="button"
            onClick={() => onInspectExternal(inscrit)}
            className="text-[9.5px] font-bold text-[var(--cordel-wood)] underline cursor-pointer ml-0.5"
            title={t('agenda.volunteerExternalDetailsTitle') || 'Coordonnées & infos logistiques'}
          >
            📋
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemoveInscrit(shift, inscrit)}
          className="ml-0.5 text-[var(--color-cordel-rouge)] font-black cursor-pointer"
          title={t('agenda.volunteerRemoveBtn') || 'Retirer'}
        >
          ×
        </button>
      </div>
    );
  }

  const isGuest = inscrit.type === 'guest';
  const member = !isGuest ? allUsers.find((u) => u.id === inscrit.uid || u.uid === inscrit.uid) : null;
  const shortName = `${inscrit.prenom || member?.prenom || ''} ${(inscrit.nom || member?.nom) ? `${(inscrit.nom || member?.nom).charAt(0)}.` : ''}`.trim() || 'Bénévole';
  const canSeePhone = isGuest && (canManage || currentUserUid === inscrit.parrainUid);
  const canRemove = canManage || (isGuest && currentUserUid === inscrit.parrainUid);

  return (
    <div className="inline-flex items-center gap-1 bg-[var(--cordel-bg)] border border-[var(--theme-border)]/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">
      {!isGuest && <XiloAvatar src={member?.photoURL || ''} name={shortName} size={16} />}
      <span>{isGuest ? `🤝 ${shortName} (${t('agenda.volunteerGuestOf') || 'proche de'} ${inscrit.parrainNom || 'membre'})` : shortName}</span>
      {canSeePhone && inscrit.telephone && (
        <a href={`tel:${inscrit.telephone.replace(/\s+/g, '')}`} className="text-[9px] font-bold text-[var(--color-cordel-vert)] underline ml-0.5">
          📞 {inscrit.telephone}
        </a>
      )}
      {canRemove && (
        <button
          type="button" onClick={() => onRemoveInscrit(shift, inscrit)}
          className="ml-0.5 text-[var(--color-cordel-rouge)] font-black cursor-pointer"
          title={t('agenda.volunteerRemoveBtn') || 'Retirer'}
        >×</button>
      )}
    </div>
  );
}
