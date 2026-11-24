import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import VoiceDictationButton from '../common/VoiceDictationButton';

/**
 * Modales secondaires de `PrivateChatView` : visionneuse photo plein écran et édition d'un message (< 140 lignes).
 */
export default function PrivateChatModals({
  lightboxUrl,
  onCloseLightbox,
  editingMessage,
  editText,
  setEditText,
  isSubmittingEdit,
  onSaveEdit,
  onCancelEdit,
  t
}) {
  return (
    <>
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={onCloseLightbox}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxUrl}
              alt={t?.('forum.sharedPhotoAlt') || 'Photo en grand format'}
              className="max-w-full max-h-[82vh] object-contain rounded border-2 border-white shadow-2xl"
            />
            <div className="flex items-center gap-3 mt-3">
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded border border-white/40"
                onClick={(e) => e.stopPropagation()}
              >
                {t?.('forum.openOriginalPhoto') || "Ouvrir l'original"} ↗
              </a>
              <button
                type="button"
                onClick={onCloseLightbox}
                className="text-xs font-bold text-white bg-[var(--color-cordel-rouge)] hover:brightness-110 px-3 py-1.5 rounded border border-white/40 cursor-pointer"
              >
                ✕ {t?.('common.close') || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase">
                  ✏️ {t?.('forum.editMyMessageTitle') || 'Modifier mon message'}
                </h3>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                  aria-label={t?.('common.close') || 'Fermer'}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={onSaveEdit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                      {t?.('forum.editMessageNewTextLabel') || 'Nouveau texte'} *
                    </label>
                    <VoiceDictationButton
                      size="sm"
                      onTranscript={(spokenText) => {
                        setEditText((prev) => {
                          const trimmed = (prev || '').trim();
                          return trimmed ? `${trimmed} ${spokenText}` : spokenText;
                        });
                      }}
                      disabled={isSubmittingEdit}
                      title={t?.('forum.chatPlusVoiceTitle') || 'Dicter votre message à la voix'}
                    />
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    disabled={isSubmittingEdit}
                    placeholder={t?.('forum.messagePlaceholder') || 'Votre message...'}
                    rows={4}
                    className="theme-input text-xs font-medium p-2.5 bg-cordel-bg-light resize-none w-full"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={onCancelEdit}
                    disabled={isSubmittingEdit}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    {t?.('common.cancel') || 'Annuler'}
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={isSubmittingEdit || !editText.trim()}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {isSubmittingEdit ? (t?.('common.saving') || 'Enregistrement...') : (t?.('common.save') || 'Enregistrer')}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}
    </>
  );
}
