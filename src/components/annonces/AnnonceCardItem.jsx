import React, { useRef, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloMegaphone, XiloClose } from '../XiloIcons';
import ReadReceiptBadge from '../common/ReadReceiptBadge';
import { useReadReceipt } from '../../hooks/useReadReceipt';
import { resolveTargetUserDisplayNames } from '../../utils/announcementUtils';

/**
 * Composant de carte d'annonce avec observateur d'accusé de lecture
 * et affichage Cordel des cibles nominatives et par étiquettes.
 */
export default function AnnonceCardItem({
  ann,
  user,
  profileData,
  canPublish,
  handleCtaClick,
  handleDelete,
  allMembers = [],
  t
}) {
  const cardRef = useRef(null);
  const dateObj = new Date(ann.dateCreation);
  const formattedDate = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const isCibleTous = ann.cibles && ann.cibles.includes('Tous');
  const isAlreadyRead = Boolean(user?.uid && ann.lectures?.[user.uid]);
  const currentUserName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Membre';

  useReadReceipt({
    targetRef: cardRef,
    collectionName: 'announcements',
    documentId: ann.id,
    authorId: ann.auteurId,
    currentUserId: user?.uid,
    currentUserName,
    isAlreadyRead,
    enabled: Boolean(ann.id && user?.uid),
    minVisibility: 0.7,
    minDurationMs: 1500
  });

  // Résolution des noms des membres ciblés nominativement pour l'infobulle
  const targetNames = useMemo(() => {
    return resolveTargetUserDisplayNames(ann.targetUserIds || [], allMembers);
  }, [ann.targetUserIds, allMembers]);

  const hasTargetUsers = Array.isArray(ann.targetUserIds) && ann.targetUserIds.length > 0;

  return (
    <div ref={cardRef}>
      <CordelCard
        variant={isCibleTous ? 'ocre' : 'default'}
        useExtremeBorder={true}
        className="py-3 px-4 relative overflow-hidden bg-cordel-bg text-left border-l-4 border-l-cordel-wood shadow-[2px_2px_0px_0px_#181716]"
      >
        <div className="flex justify-between items-start gap-4 pr-6">
          <div className="flex-1 min-w-0">
            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold text-cordel-master-dark/70 select-none">
              <span className="inline-flex items-center gap-0.5">
                <XiloMegaphone size={10} /> {t('widgetAnnonces.roleLabel')}
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span>Par {ann.auteurNom}</span>
            </div>

            {/* Titre */}
            <h4 className="font-extrabold text-sm text-encre-noire mt-1">
              {ann.titre}
            </h4>
          </div>

          {/* Badges de cibles */}
          <div className="flex flex-wrap gap-1 select-none items-center justify-end">
            {ann.cibles && ann.cibles.map((c) => (
              <span
                key={c}
                className={`theme-stamp-badge ${isCibleTous ? 'theme-stamp-badge-wood' : 'theme-stamp-badge-dark'} text-[6px] rotate-[-1deg] px-1 py-0`}
              >
                {c}
              </span>
            ))}

            {/* Badge nominatif avec noms au survol */}
            {hasTargetUsers && (
              <span
                className="theme-stamp-badge bg-amber-100/90 text-amber-900 border-amber-600 text-[6.5px] rotate-[1deg] px-1.5 py-0.5 cursor-help shadow-xs"
                title={`🎯 Ciblée pour : ${targetNames.join(', ')}`}
              >
                🎯 Ciblée pour {ann.targetUserIds.length} membre{ann.targetUserIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Corps du message */}
        <p className="text-xs font-semibold leading-relaxed mt-2 text-encre-noire/90 whitespace-pre-wrap">
          {ann.message}
        </p>

        {/* Bouton d'action / Call to action */}
        {ann.actionText && ann.actionLink && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/20 flex justify-start select-none">
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={() => handleCtaClick(ann.actionLink)}
              className="text-xs py-2 px-3.5 font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <span>🚀 {ann.actionText}</span>
              <span className="text-sm font-bold">→</span>
            </CordelButton>
          </div>
        )}

        {/* Pied de l'annonce : accusé de lecture */}
        <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-between select-none">
          <ReadReceiptBadge
            lectures={ann.lectures || {}}
            currentUserId={user?.uid}
            authorId={ann.auteurId}
            isAuthorOrBureau={canPublish || (ann.auteurId && user?.uid === ann.auteurId)}
            allMembers={allMembers}
            title={`Accusé de lecture - ${ann.titre}`}
          />
          <span className="text-[7.5px] font-black text-cordel-master-dark/50">
            {ann.auteurNom}
          </span>
        </div>

        {/* Bouton de suppression réservé aux gestionnaires ou à l'auteur */}
        {(canPublish || (ann.auteurId && user?.uid && ann.auteurId === user.uid)) && (
          <button
            type="button"
            onClick={() => handleDelete(ann.id, ann.titre)}
            className="absolute top-2 right-2 p-1 border border-dashed border-red-400 hover:border-red-600 text-red-500 hover:text-red-700 bg-transparent rounded cursor-pointer flex items-center justify-center shrink-0"
            title={t('widgetAnnonces.deleteTitle') || "Supprimer l'annonce"}
          >
            <XiloClose size={8} />
          </button>
        )}
      </CordelCard>
    </div>
  );
}
