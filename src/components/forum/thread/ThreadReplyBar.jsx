import React, { useState, useRef } from 'react';
import CordelButton from '../../CordelButton';
import RichTextEditor from '../../RichTextEditor';
import EmojiPickerPopover, { EmojiQuickRow } from '../EmojiPickerPopover';
import { MentionDropdown, getMentionQueryAtCursor, filterUsersByMentionQuery } from '../MentionAutocomplete';
import { getTagId } from '../../../utils/tagUtils';

/**
 * Composant de barre de réponse dockée en bas d'écran.
 * Propose deux modes ergonomiques :
 * - Mode compact : saisie ultra-rapide façon messagerie instantanée avec émojis directs et autocomplétion @
 * - Mode étendu : éditeur enrichi TipTap, sélection de groupe ciblé, tags de mention et ajout de sondage
 */
export default function ThreadReplyBar({
  isReadOnly = false,
  replyText = '',
  setReplyText,
  sending = false,
  onSubmit,
  selectedTarget = '',
  setSelectedTarget,
  availableTargets = [],
  profileData,
  lienDepotForum = '',
  allUsers = [],
  thread,
  user,
  isModeratorOrAdmin = false,
  onOpenAddPoll,
  t
}) {
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [isTargetingExpanded, setIsTargetingExpanded] = useState(false);
  const [isCompactEmojiOpen, setIsCompactEmojiOpen] = useState(false);
  const [compactMentionQuery, setCompactMentionQuery] = useState(null);
  const compactInputRef = useRef(null);

  if (isReadOnly) {
    return (
      <div className="p-3 text-center border-2 border-dashed border-cordel-wood/30 bg-cordel-bg rounded-md select-none mt-2">
        <span className="text-xs font-black text-cordel-wood">
          🔇 Ce salon est en lecture seule pour votre rôle.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 bg-cordel-bg z-10 pt-2 pb-1 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2 select-none"
    >
      {!isReplyExpanded ? (
        /* Barre compacte fixée avec ligne d'émoticônes */
        <div className="flex flex-col gap-1">
          {/* Petite ligne d'émoticônes fréquents en accès direct */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[8px] font-black uppercase text-cordel-wood opacity-75 shrink-0 select-none">
              Émojis :
            </span>
            <EmojiQuickRow
              onSelectEmoji={(emoji) => setReplyText(prev => (prev || '') + emoji)}
              onOpenFullPicker={() => setIsCompactEmojiOpen(prev => !prev)}
              className="flex-1"
            />
          </div>

          <div className="relative flex items-center gap-2 p-1.5 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_8px_6px_8px] shadow-[1.5px_1.5px_0px_0px_#181716]">
            {isCompactEmojiOpen && (
              <EmojiPickerPopover
                onSelectEmoji={(emoji) => {
                  setReplyText(prev => (prev || '') + emoji);
                  setIsCompactEmojiOpen(false);
                }}
                onClose={() => setIsCompactEmojiOpen(false)}
              />
            )}

            {/* Autocomplétion lors de la saisie d'un @ dans la barre compacte */}
            {compactMentionQuery && (
              <MentionDropdown
                suggestions={filterUsersByMentionQuery(allUsers, compactMentionQuery.query)}
                onSelectUser={(targetUser) => {
                  const fullName = `${targetUser.prenom || ''} ${targetUser.nom || ''}`.trim() || targetUser.email || 'Membre';
                  const mentionInsert = `@${fullName} `;
                  const nextText = replyText.slice(0, compactMentionQuery.start) + mentionInsert + replyText.slice(compactMentionQuery.end);
                  setReplyText(nextText);
                  setCompactMentionQuery(null);
                  if (compactInputRef.current) compactInputRef.current.focus();
                }}
                onClose={() => setCompactMentionQuery(null)}
                position="top"
              />
            )}

            <button
              type="button"
              onClick={() => setIsReplyExpanded(true)}
              className="w-7 h-7 flex items-center justify-center font-black text-xs text-cordel-wood hover:text-encre-noire bg-cordel-bg hover:bg-white rounded border border-cordel-master-dark/30 cursor-pointer shrink-0 transition-all"
              title="Options de réponse (Groupe cible, mentions, mise en forme)"
            >
              ➕
            </button>

            <button
              type="button"
              onClick={() => setIsCompactEmojiOpen(prev => !prev)}
              className={`w-7 h-7 flex items-center justify-center text-sm rounded border transition-all cursor-pointer shrink-0 ${
                isCompactEmojiOpen
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-cordel-bg hover:bg-white border-cordel-master-dark/30'
              }`}
              title="Choisir un émoticône"
            >
              😀
            </button>

            <input
              ref={compactInputRef}
              type="text"
              value={replyText}
              onChange={(e) => {
                const val = e.target.value;
                setReplyText(val);
                const cursor = e.target.selectionStart;
                const match = getMentionQueryAtCursor(val, cursor);
                setCompactMentionQuery(match);
              }}
              onFocus={() => setIsReplyExpanded(true)}
              placeholder={(t && t('forum.writeReplyPlaceholder')) || "Écrire une réponse... (cliquez pour déplier)"}
              disabled={sending}
              className="flex-1 bg-transparent text-xs font-semibold text-encre-noire placeholder:opacity-50 outline-none px-1"
            />
            <CordelButton
              type="submit"
              variant="ocre"
              disabled={sending || !replyText.trim()}
              className="text-xs px-3 py-1 uppercase font-bold tracking-wider shrink-0"
            >
              {sending ? "..." : "➤"}
            </CordelButton>
          </div>
        </div>
      ) : (
        /* Vue dépliée à la demande */
        <div className="flex flex-col gap-2 bg-cordel-bg-light p-3 border-2 border-encre-noire rounded-[6px_8px_6px_8px] shadow-[2px_2px_0px_0px_#181716]">
          <div className="flex justify-between items-center pb-1 border-b border-dashed border-cordel-master-dark/20">
            <span className="text-[9px] font-black uppercase tracking-wider text-cordel-wood">
              ✍️ {(t && t('forum.writeReplyPlaceholder')) || "Rédiger une réponse"}
            </span>
            <button
              type="button"
              onClick={() => setIsReplyExpanded(false)}
              className="text-[9px] font-black text-cordel-master-dark/60 hover:text-encre-noire hover:underline cursor-pointer"
              title="Revenir à la barre compacte"
            >
              Réduire ✕
            </button>
          </div>

          {/* Options de ciblage & mentions (dépliables) */}
          <div className="flex flex-col gap-2 pt-1 pb-2 border-b border-dashed border-cordel-master-dark/15 select-none">
            <button
              type="button"
              onClick={() => setIsTargetingExpanded(!isTargetingExpanded)}
              className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark hover:text-cordel-wood flex items-center gap-1.5 w-fit cursor-pointer transition-colors"
            >
              {isTargetingExpanded ? '▼ Masquer les options de ciblage & mentions' : '▶ Afficher les options de ciblage & mentions (Optionnel)'}
            </button>
            
            {isTargetingExpanded && (
              <div className="flex flex-col gap-2 p-2 bg-cordel-master-light/5 border border-cordel-master-dark/20 rounded">
                {/* Sélecteur de groupe cible */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    🗣️ {(t && t('forum.targetGroup')) || "Cibler un groupe (Optionnel)"}
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    disabled={sending}
                    className="theme-input w-full disabled:opacity-50 text-[10px] py-1 font-bold bg-cordel-bg"
                  >
                    <option value="">{(t && t('forum.targetAll')) || "-- Tout le monde --"}</option>
                    {availableTargets.map((target) => (
                      <option key={target} value={target}>
                        {target}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Étiquettes de mention rapide */}
                {availableTargets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 select-none mt-1">
                    <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">Mentionner :</span>
                    {availableTargets.map(tag => {
                      const tagLabel = typeof tag === 'string' ? tag : getTagId(tag);
                      return (
                        <button
                          key={tagLabel}
                          type="button"
                          onClick={() => setReplyText(prev => (prev || '') + `@${tagLabel} `)}
                          className="px-2 py-0.5 text-[9px] font-bold bg-cordel-bg border border-cordel-master-dark/20 rounded hover:border-encre-noire transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(24,23,22,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                        >
                          @{tagLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Éditeur enrichi TipTap */}
          <RichTextEditor
            value={replyText}
            onChange={setReplyText}
            disabled={sending}
            placeholder={t && t('forum.writeReplyPlaceholder')}
            groupId={profileData?.groupId}
            lienDepotForum={lienDepotForum}
            allUsers={allUsers}
            minHeight="85px"
            onAddPoll={(!thread?.poll && (user?.uid === thread?.auteurId || isModeratorOrAdmin)) ? onOpenAddPoll : null}
          />

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-cordel-master-dark/15">
            <button
              type="button"
              onClick={() => setIsReplyExpanded(false)}
              className="text-[10px] font-bold text-cordel-master-dark hover:underline cursor-pointer"
            >
              Mode compact
            </button>
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              disabled={sending || !replyText.trim()}
              className="text-xs px-5 py-2 uppercase font-bold tracking-widest"
            >
              {sending ? (t && t('forum.sendingMsg')) : ((t && t('common.send')) || "Envoyer")}
            </CordelButton>
          </div>
        </div>
      )}
    </form>
  );
}
