import React, { useState, useEffect, useRef, useMemo } from 'react';
import CordelButton from '../CordelButton';
import TerracottaMegaphoneIcon from './TerracottaMegaphoneIcon';
import ReadReceiptBadge from '../common/ReadReceiptBadge';
import { useReadReceipt } from '../../hooks/useReadReceipt';
import { resolveTargetUserDisplayNames, resolveTargetRecipientIds } from '../../utils/announcementUtils';
import { isMemberCaOrBureau } from '../../utils/memberUtils';

/**
 * Ligne d'annonce du Mégaphone intégrée dans la CordelCard parente unifiée.
 * Repliée par défaut si déjà lue ; dépliée en place (avec fond bg-amber-500/10 si non lue).
 */
export default function AnnonceCardItem({
  ann, user, profileData, canPublish, handleCtaClick, handleDelete, allMembers = [], t
}) {
  const cardRef = useRef(null);
  const hasInitializedCollapseRef = useRef(false);

  const dateObj = new Date(ann.dateCreation);
  const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const isCibleTous = ann.cibles && ann.cibles.includes('Tous');
  const isAlreadyRead = Boolean(user?.uid && (ann.lectures?.[user.uid] || (Array.isArray(ann.luPar) && ann.luPar.includes(user.uid))));

  const [isCollapsed, setIsCollapsed] = useState(() => isAlreadyRead);

  useEffect(() => {
    if (!hasInitializedCollapseRef.current && user?.uid) {
      hasInitializedCollapseRef.current = true;
      setIsCollapsed(isAlreadyRead);
    }
  }, [user?.uid, isAlreadyRead]);

  const currentUserName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Membre';

  useReadReceipt({
    targetRef: cardRef, collectionName: 'announcements', documentId: ann.id,
    authorId: ann.auteurId, currentUserId: user?.uid, currentUserName, isAlreadyRead,
    enabled: Boolean(ann.id && user?.uid && !isCollapsed), minVisibility: 0.7, minDurationMs: 1500
  });

  const targetNames = useMemo(() => resolveTargetUserDisplayNames(ann.targetUserIds || [], allMembers), [ann.targetUserIds, allMembers]);

  const targetedMembers = useMemo(() => {
    if (!Array.isArray(allMembers) || allMembers.length === 0) return [];
    const recipientIds = resolveTargetRecipientIds({ announcement: ann, allMembers, authorId: ann.auteurId });
    if (recipientIds.length === 0) return [];
    const setIds = new Set(recipientIds);
    return allMembers.filter((m) => setIds.has(m.id || m.uid));
  }, [ann, allMembers]);

  const canSeeReadDetails = Boolean(canPublish || isMemberCaOrBureau(profileData) || (ann.auteurId && user?.uid === ann.auteurId));
  const canDelete = Boolean(canPublish || (ann.auteurId && user?.uid && ann.auteurId === user.uid));
  const hasTargetUsers = Array.isArray(ann.targetUserIds) && ann.targetUserIds.length > 0;

  // État replié : simple ligne compacte sans cadre interne
  if (isCollapsed) {
    return (
      <div
        ref={cardRef} onClick={() => setIsCollapsed(false)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCollapsed(false); } }}
        className="py-2.5 px-1.5 flex items-center justify-between gap-2 w-full select-none cursor-pointer hover:bg-cordel-bg/60 transition-colors text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <TerracottaMegaphoneIcon size={15} className="shrink-0" />
          <span className="font-extrabold text-xs text-encre-noire truncate">{ann.titre}</span>
          {formattedDate && <span className="text-[9.5px] font-bold text-cordel-master-dark/65 shrink-0">• {formattedDate}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ReadReceiptBadge
            lectures={ann.lectures || {}} luPar={ann.luPar || []} currentUserId={user?.uid}
            authorId={ann.auteurId} isAuthorOrBureau={canSeeReadDetails} allMembers={targetedMembers}
            title={`Accusé de lecture - ${ann.titre}`} compact={true}
          />
          <button
            type="button" onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
            className="px-1.5 py-0.5 text-[10px] font-black text-cordel-wood hover:text-encre-noire bg-white/80 hover:bg-white rounded border border-encre-noire/25 cursor-pointer transition-colors"
            title="Déplier l'annonce"
          >▾</button>
        </div>
      </div>
    );
  }

  // État déplié : déployé directement à sa place dans la CordelCard parente
  return (
    <div ref={cardRef} className={`py-3 px-2 sm:px-2.5 text-left transition-colors ${!isAlreadyRead ? 'bg-amber-500/10' : ''}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-cordel-master-dark/75 select-none">
            <TerracottaMegaphoneIcon size={13} className="shrink-0" />
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && ann.auteurNom && <span>•</span>}
            {ann.auteurNom && <span>Par {ann.auteurNom}</span>}
          </div>
          <h4 className="font-extrabold text-sm text-encre-noire mt-0.5 leading-snug">{ann.titre}</h4>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 select-none shrink-0">
          {ann.cibles && ann.cibles.map((c) => (
            <span key={c} className={`theme-stamp-badge ${isCibleTous ? 'theme-stamp-badge-wood' : 'theme-stamp-badge-dark'} text-[6.5px] rotate-[-1deg] px-1.5 py-0.5`}>{c}</span>
          ))}
          {hasTargetUsers && (
            <span className="theme-stamp-badge bg-amber-100/90 text-amber-900 border-amber-600 text-[6.5px] rotate-[1deg] px-1.5 py-0.5 cursor-help shadow-xs" title={`🎯 Ciblée pour : ${targetNames.join(', ')}`}>
              🎯 {ann.targetUserIds.length} mbr
            </span>
          )}
          <ReadReceiptBadge
            lectures={ann.lectures || {}} luPar={ann.luPar || []} currentUserId={user?.uid}
            authorId={ann.auteurId} isAuthorOrBureau={canSeeReadDetails} allMembers={targetedMembers}
            title={`Accusé de lecture - ${ann.titre}`} compact={true}
          />
          {canDelete && (
            <button
              type="button" onClick={(e) => { e.stopPropagation(); handleDelete(ann.id, ann.titre); }}
              className="px-1.5 py-0.5 text-[10px] border border-dashed border-red-500/60 hover:border-red-700 text-red-700 bg-white/60 hover:bg-red-50 rounded cursor-pointer flex items-center justify-center transition-colors"
              title={t('widgetAnnonces.deleteTitle') || "Supprimer définitivement l'annonce"}
            >🗑️</button>
          )}
          <button
            type="button" onClick={() => setIsCollapsed(true)}
            className="px-1.5 py-0.5 text-[10px] font-black text-cordel-wood hover:text-encre-noire bg-cordel-bg-light hover:bg-white rounded border border-encre-noire/30 cursor-pointer transition-colors"
            title="Replier l'annonce"
          >▴</button>
        </div>
      </div>

      <p className="text-xs font-semibold leading-relaxed mt-2 text-encre-noire/90 whitespace-pre-wrap">{ann.message}</p>

      {ann.actionText && ann.actionLink && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20 flex justify-start select-none">
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={(e) => {
              e.stopPropagation();
              handleCtaClick(ann.actionLink, e);
            }}
            className="text-xs py-1.5 px-3 font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
          >
            <span>🚀 {ann.actionText}</span>
            <span className="text-sm font-bold">→</span>
          </CordelButton>
        </div>
      )}
    </div>
  );
}
