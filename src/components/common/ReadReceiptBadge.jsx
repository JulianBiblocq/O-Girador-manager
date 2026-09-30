/**
 * ReadReceiptBadge.jsx
 * Composant d'accusé de lecture visuel avec style Cordel :
 * - Côté lecteur : double coche discrète façon xylogravure indiquant la validation de lecture.
 * - Côté auteur / bureau : compteur interactif « ✓✓ Lu par X membres » avec volet Cordel détaillé
 *   listant les lecteurs (horodatés « Lu le 20 mai à 14:32 ») et les non-lecteurs.
 */

import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { formatReadReceiptDate, getReadReceiptStats } from '../../services/readReceiptService';

export default function ReadReceiptBadge({
  lectures = {},
  currentUserId,
  authorId,
  isAuthorOrBureau = false,
  allMembers = [],
  title = "Accusé de lecture"
}) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('read'); // 'read' | 'unread'

  const isCurrentUserAuthor = currentUserId && authorId && currentUserId === authorId;
  const isReadByCurrentUser = currentUserId && lectures && Boolean(lectures[currentUserId]);

  const { readCount, readers, unreadMembers } = getReadReceiptStats(lectures, allMembers, authorId);

  // Si l'utilisateur n'est ni auteur ni membre du bureau, on n'affiche que la double coche discrète du lecteur
  if (!isCurrentUserAuthor && !isAuthorOrBureau) {
    if (!isReadByCurrentUser) {
      return (
        <span 
          className="inline-flex items-center text-[9px] font-bold text-neutral-400 select-none opacity-60"
          title="Message non lu"
        >
          ✓
        </span>
      );
    }
    return (
      <span 
        className="inline-flex items-center text-[10px] font-extrabold text-[var(--color-cordel-vert)] select-none tracking-tighter"
        title={formatReadReceiptDate(lectures[currentUserId]?.luLe) || "Lu par vous"}
      >
        ✓✓
      </span>
    );
  }

  // Côté auteur / organisateur / bureau : compteur cliquable et volet Cordel
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-[9px] font-bold text-cordel-wood hover:text-cordel-master-dark flex items-center gap-1 cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light px-1.5 py-0.5 rounded border border-dashed border-cordel-master-dark/25 transition-all select-none"
        title="Voir les accusés de lecture détaillés"
      >
        <span className={`font-black tracking-tighter ${readCount > 0 ? 'text-[var(--color-cordel-vert)]' : 'text-neutral-400'}`}>
          ✓✓
        </span>
        <span>
          {readCount === 0 
            ? "0 lecture" 
            : readCount === 1 
              ? "Lu par 1 membre" 
              : `Lu par ${readCount} membres`}
        </span>
      </button>

      {/* Modale / Volet Cordel listant les lecteurs et les non-lecteurs */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <CordelCard
            variant="default"
            useExtremeBorder={true}
            className="w-full max-w-md bg-cordel-bg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] p-4 flex flex-col gap-3 text-left animate-in fade-in zoom-in duration-150"
          >
            {/* En-tête */}
            <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-black text-encre-noire hover:text-cordel-wood px-1.5 py-0.5 rounded cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Onglets : Ont lu (X) vs Pas encore lu (Y) */}
            <div className="flex gap-1 border-b border-dashed border-cordel-master-dark/20 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('read')}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded transition-all cursor-pointer ${
                  activeTab === 'read'
                    ? 'bg-[var(--color-cordel-vert)] text-white shadow-xs'
                    : 'text-cordel-master-dark/70 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                ✓✓ Ont lu ({readers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded transition-all cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-[var(--theme-primary)] text-white shadow-xs'
                    : 'text-cordel-master-dark/70 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                ⏳ Pas encore lu ({unreadMembers.length})
              </button>
            </div>

            {/* Corps du volet */}
            <div className="max-h-64 overflow-y-auto pr-1 flex flex-col gap-1.5">
              {activeTab === 'read' ? (
                readers.length === 0 ? (
                  <div className="py-8 text-center text-xs opacity-60 font-semibold italic">
                    Aucun membre n'a encore pris connaissance de ce message.
                  </div>
                ) : (
                  readers.map((reader) => (
                    <div
                      key={reader.userId}
                      className="p-2 bg-cordel-bg-light rounded border border-dashed border-encre-noire/15 flex items-center justify-between gap-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <XiloAvatar src={reader.photoURL} name={reader.nom} size={26} />
                        <span className="text-xs font-bold text-encre-noire truncate">
                          {reader.nom}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-[var(--color-cordel-vert)] whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-600/25">
                        {formatReadReceiptDate(reader.luLe)}
                      </span>
                    </div>
                  ))
                )
              ) : (
                unreadMembers.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-[var(--color-cordel-vert)]">
                    🎉 Tous les membres ont lu ce message !
                  </div>
                ) : (
                  unreadMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="p-2 bg-cordel-bg-light/60 rounded border border-dashed border-encre-noire/15 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <XiloAvatar src={member.photoURL} name={member.nom} size={26} />
                        <span className="text-xs font-semibold text-encre-noire/80 truncate">
                          {member.nom}
                        </span>
                      </div>
                      <span className="text-[8.5px] font-bold text-[var(--color-cordel-ocre)] bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-600/25">
                        En attente de lecture
                      </span>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Pied de volet */}
            <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                type="button"
                variant="default"
                onClick={() => setShowModal(false)}
                className="text-xs px-3 py-1 font-bold"
              >
                Fermer
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
