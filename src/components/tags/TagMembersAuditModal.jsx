import React, { useState, useMemo, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import XiloAvatar from '../XiloAvatar';
import EmptyState from '../EmptyState';
import useConfirm from '../../hooks/useConfirm';

/**
 * Modale d'audit et de vue inverse des membres porteurs d'un badge spécifique.
 * Permet de visualiser instantanément qui possède une étiquette et de la retirer au besoin.
 * Conforme à l'architecture multi-thèmes et aux règles graphiques Cordel.
 *
 * @param {Object} props
 * @param {Object} props.tag - Objet étiquette normalisé ({ id, nomM, nomF, inheritsFrom })
 * @param {Array<Object>} props.members - Liste des membres actifs du groupe
 * @param {string} props.groupId - Identifiant de l'association
 * @param {Function} props.onClose - Callback de fermeture de la modale
 */
export default function TagMembersAuditModal({ tag, members = [], groupId, onClose }) {
  const { confirm } = useConfirm();
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  // Affichage temporisé du toast de succès (vert validation Cordel)
  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Détermine si un élément de tag utilisateur correspond à l'étiquette cible
  const isTagMatch = useCallback((userTag, targetTag) => {
    if (!userTag || !targetTag) return false;
    const targetId = (targetTag.id || '').toLowerCase().trim();
    const targetNomM = (targetTag.nomM || '').toLowerCase().trim();
    const targetNomF = (targetTag.nomF || '').toLowerCase().trim();

    const uTagStr = typeof userTag === 'string'
      ? userTag.toLowerCase().trim()
      : (userTag.id || userTag.nomM || userTag.nom || '').toLowerCase().trim();

    return (targetId && uTagStr === targetId) ||
           (targetNomM && uTagStr === targetNomM) ||
           (targetNomF && uTagStr === targetNomF);
  }, []);

  // Filtrage réactif des membres portant ce badge
  const carrierMembers = useMemo(() => {
    if (!tag || !Array.isArray(members)) return [];
    return members.filter((m) => Array.isArray(m.tags) && m.tags.some((t) => isTagMatch(t, tag)));
  }, [members, tag, isTagMatch]);

  // Action de dissociation rapide de l'étiquette
  const handleRemoveTag = async (member) => {
    if (!groupId || !member?.id || !tag || removingMemberId) return;

    const memberDisplayName = member.surnom
      ? `${member.surnom} (${member.prenom || ''} ${member.nom || ''})`.trim()
      : `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Ce membre';

    const tagDisplayName = tag.nomM || tag.id;

    const confirmDelete = await confirm({
      title: "Retirer l'étiquette",
      message: `Voulez-vous vraiment retirer l'étiquette "${tagDisplayName}" à ${memberDisplayName} ?`,
      confirmText: "Oui, retirer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!confirmDelete) return;

    setRemovingMemberId(member.id);
    try {
      const currentTags = Array.isArray(member.tags) ? member.tags : [];
      const updatedTags = currentTags.filter((t) => !isTagMatch(t, tag));

      const memberDocRef = doc(db, 'users', member.id);
      await updateDoc(memberDocRef, { tags: updatedTags });

      showToast(`✓ Étiquette retirée pour ${member.prenom || member.surnom || 'le membre'}`);
    } catch (err) {
      console.error("TagMembersAuditModal - Erreur lors du retrait de l'étiquette :", err);
      alert("Impossible de retirer l'étiquette. Veuillez réessayer.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (!tag) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-cordel-bg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_10px_14px] overflow-hidden text-encre-noire"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast de validation Cordel flottant */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[var(--color-cordel-vert)] text-white font-extrabold text-xs px-4 py-2 rounded-[6px_10px_8px_12px] border-2 border-[var(--theme-ink)] shadow-[3px_3px_0px_0px_#181716] flex items-center gap-2 animate-bounce">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* En-tête de la modale */}
        <div className="p-4 border-b-2 border-encre-noire/20 bg-cordel-bg-light flex items-start justify-between gap-3 shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood bg-cordel-wood/10 px-2 py-0.5 rounded border border-cordel-wood/30">
                Audit d'attribution
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                carrierMembers.length > 0
                  ? 'bg-emerald-100 text-[var(--color-cordel-vert)] border-[#2d6a4f]/40'
                  : 'bg-cordel-master-dark/10 text-cordel-master-dark/60 border-cordel-master-dark/20'
              }`}>
                👥 {carrierMembers.length} {carrierMembers.length > 1 ? 'porteurs' : 'porteur'}
              </span>
            </div>

            {/* Rappel des variantes du badge */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="theme-stamp-badge theme-stamp-badge-wood text-xs px-2.5 py-1 font-black">
                👨 {tag.nomM}
              </span>
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-xs px-2.5 py-1 font-black">
                👩 {tag.nomF}
              </span>
              {tag.inheritsFrom && tag.inheritsFrom.length > 0 && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-400">
                  🔗 Inclut : {tag.inheritsFrom.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded border border-encre-noire bg-cordel-bg hover:bg-white text-encre-noire flex items-center justify-center font-black text-sm shadow-[1px_1px_0px_0px_#181716] cursor-pointer shrink-0 transition-transform active:scale-95"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {carrierMembers.length === 0 ? (
            <EmptyState
              title="Aucun membre porteur"
              description="Aucun membre ne possède actuellement cette étiquette dans l'association."
              icon="🏷️"
              variant="card"
              className="py-8"
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark/70 px-1">
                Membres possédant ce rôle ({carrierMembers.length}) :
              </div>

              {carrierMembers.map((member) => {
                const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Membre sans nom';
                const mainInstrument = member.instrumentPrincipal || member.pupitrePrincipal || member.role || 'Membre';
                const isRemoving = removingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-cordel-bg-light/70 border border-encre-noire/30 rounded-[6px_10px_8px_12px] shadow-[1px_1px_0px_0px_#181716] hover:bg-white/80 transition-colors"
                  >
                    {/* Avatar et identité */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <XiloAvatar
                        src={member.avatar || member.photoURL}
                        name={fullName}
                        size={38}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="text-xs font-black truncate text-encre-noire">
                          {fullName}
                          {member.surnom && (
                            <span className="ml-1 text-[10px] font-bold text-cordel-wood opacity-90 italic">
                              « {member.surnom} »
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-medium text-cordel-master-dark/75 flex items-center gap-1.5 flex-wrap">
                          <span>🥁 {mainInstrument}</span>
                          {member.statutActuel && (
                            <span className="text-[8.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-cordel-master-dark/10 border border-cordel-master-dark/20">
                              {member.statutActuel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bouton de retrait rapide */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(member)}
                      disabled={isRemoving}
                      className="p-1.5 px-2.5 border border-encre-noire bg-cordel-wood text-cordel-bg-light hover:brightness-110 active:scale-95 rounded shadow-[1px_1px_0px_0px_#181716] cursor-pointer disabled:opacity-50 transition-all shrink-0 flex items-center gap-1 text-[10px] font-black"
                      title={`Dissocier l'étiquette de ${fullName}`}
                    >
                      {isRemoving ? (
                        <span>⏳ Retrait...</span>
                      ) : (
                        <>
                          <span className="text-xs">✕</span>
                          <span className="hidden sm:inline">Retirer</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de la modale */}
        <div className="p-3 border-t-2 border-encre-noire/20 bg-cordel-bg-light flex justify-between items-center shrink-0">
          <span className="text-[10px] text-cordel-master-dark/60 font-medium italic">
            Les modifications sont immédiatement répercutées sur les permissions.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-encre-noire bg-cordel-bg hover:bg-white text-encre-noire rounded font-extrabold text-xs shadow-[1px_1px_0px_0px_#181716] cursor-pointer transition-transform active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
