import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../LanguageContext';
import VoiceDictationButton from '../common/VoiceDictationButton';
import CordelPlusIcon from '../common/CordelPlusIcon';
import useDismissOnOutsideOrEscape from '../../hooks/useDismissOnOutsideOrEscape';

// Classes communes des lignes du menu flottant
const ITEM_CLASS = 'flex items-center gap-2.5 p-1.5 rounded transition-colors text-left w-full text-xs font-bold text-encre-noire';

// La dictée vocale n'est proposée que si le navigateur dispose de la Web Speech API
const isVoiceSupported = () =>
  typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Bouton carré « + » unique (PC et smartphone) à gauche du champ de saisie de la messagerie.
 * Ouvre un menu flottant Cordel : 1. Photo ou fichier, 2. Émoji, 3. Dictée vocale.
 * Fermeture au clic extérieur ou à la touche Échap.
 *
 * @param {Object} props
 * @param {boolean} props.canAttach - Faux si le groupId est inconnu ou si l'envoi est impossible
 * @param {boolean} props.isUploading - Envoi de pièce jointe en cours
 * @param {boolean} [props.busy=false] - Envoi de message en cours
 * @param {Function} props.onPickAttachment - Ouvre le sélecteur de photo ou fichier
 * @param {Function} props.onOpenEmoji - Ouvre le sélecteur d'émojis
 * @param {Function} props.onVoiceTranscript - Reçoit le texte dicté
 */
export default function ChatComposerPlusMenu({ canAttach, isUploading, busy = false, onPickAttachment, onOpenEmoji, onVoiceTranscript }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  useDismissOnOutsideOrEscape(rootRef, isOpen, closeMenu);

  const plusTitle = t('forum.chatPlusTitle');
  const photoDisabled = !canAttach || isUploading || busy;

  return (
    <div className="relative shrink-0 mb-0.5" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-9 h-[38px] flex items-center justify-center rounded border-2 border-encre-noire bg-cordel-wood transition-all cursor-pointer select-none ${
          isOpen ? 'text-white shadow-none scale-95' : 'text-cordel-bg-light hover:opacity-90 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px]'
        }`}
        title={plusTitle}
        aria-label={plusTitle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {isUploading ? <span className="animate-spin text-xs">⏳</span> : <CordelPlusIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />}
      </button>

      {isOpen && (
        <div role="menu" className="absolute bottom-12 left-0 z-40 bg-cordel-bg-light border-2 border-encre-noire p-2 rounded-[6px_8px_6px_8px] shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-1.5 min-w-[210px] animate-fade-in text-left">
          <div className="text-[8px] font-black uppercase tracking-wider text-cordel-wood border-b border-dashed border-encre-noire/20 pb-1 mb-0.5 select-none">
            {t('forum.chatPlusMenuHeading')}
          </div>

          {/* 1. Photo ou fichier (mis en valeur) */}
          <button
            type="button"
            role="menuitem"
            disabled={photoDisabled}
            onClick={() => { setIsOpen(false); onPickAttachment(); }}
            className={`${ITEM_CLASS} bg-[var(--color-cordel-vert,#2d6a4f)]/15 border border-[var(--color-cordel-vert,#2d6a4f)] hover:bg-[var(--color-cordel-vert,#2d6a4f)]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-base shrink-0">📷</span>
            <span className="truncate">{t('forum.chatPlusPhotoFile')}</span>
          </button>

          {/* 2. Émoji */}
          <button
            type="button"
            role="menuitem"
            onClick={() => { setIsOpen(false); onOpenEmoji(); }}
            className={`${ITEM_CLASS} hover:bg-neutral-200/60 cursor-pointer`}
          >
            <span className="text-base shrink-0">😀</span>
            <span className="truncate">{t('forum.chatPlusEmoji')}</span>
          </button>

          {/* 3. Dictée vocale (si supportée) */}
          {isVoiceSupported() && (
            <div className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-200/60 transition-colors">
              <span className="text-xs font-bold text-encre-noire flex items-center gap-2.5">
                <span className="text-base shrink-0">🎙️</span>
                <span>{t('forum.chatPlusVoice')}</span>
              </span>
              <VoiceDictationButton
                size="sm"
                onTranscript={(spokenText) => { onVoiceTranscript(spokenText); setIsOpen(false); }}
                disabled={busy || isUploading}
                title={t('forum.chatPlusVoiceTitle')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
