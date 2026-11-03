import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import { shareToGeneralGroupChat } from '../../utils/shareTargetDispatchUtils';

/**
 * Modale d'aiguillage des contenus entrants via la Web Share Target API (Organizador).
 */
export default function ShareTargetModal({
  sharedPayload,
  user,
  profileData,
  groupId,
  canPublishAnnonce = false,
  onClose,
  onNavigateToView
}) {
  const { t } = useTranslation();
  const initialCaption = [sharedPayload?.title, sharedPayload?.text].filter(Boolean).join(' — ');
  const [caption, setCaption] = useState(initialCaption);
  const [sending, setSending] = useState(false);

  if (!sharedPayload) return null;

  const handleSendToGroupChat = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await shareToGeneralGroupChat({ sharedPayload, caption, user, profileData, groupId });
      await onClose();
      if (onNavigateToView) onNavigateToView('forum', { tab: 'groups', conversationId: res.conversationId });
    } catch (err) {
      console.error('ShareTargetModal - Erreur envoi groupe :', err);
      alert(err?.message || "Erreur lors de l'envoi dans la discussion.");
    } finally {
      setSending(false);
    }
  };

  const handleOpenVaral = async () => {
    const varalPayload = {
      title: sharedPayload.title || caption.slice(0, 60) || '',
      externalUrl: sharedPayload.url || '',
      file: sharedPayload.file || null
    };
    if (typeof window !== 'undefined') {
      window.__ogPendingVaralShare = varalPayload;
      window.dispatchEvent(new CustomEvent('open-shared-varal', { detail: varalPayload }));
    }
    await onClose();
    if (onNavigateToView) onNavigateToView('varal');
  };

  const handleOpenMegaphone = async () => {
    const msgParts = [caption.trim(), sharedPayload.url].filter(Boolean);
    const annoncePayload = {
      titre: sharedPayload.title || caption.slice(0, 60) || 'Information',
      message: msgParts.join('\n') || 'Contenu partagé',
      actionLink: sharedPayload.url || '',
      actionText: sharedPayload.url ? (t('shareTarget.openLinkBtn') || 'Ouvrir le lien') : ''
    };
    if (typeof window !== 'undefined') {
      window.__ogPendingAnnonceShare = annoncePayload;
      window.dispatchEvent(new CustomEvent('open-shared-annonce', { detail: annoncePayload }));
    }
    await onClose();
    if (onNavigateToView) onNavigateToView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md p-5 relative text-left bg-cordel-bg">
        <button type="button" onClick={onClose} disabled={sending} className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:brightness-95 text-encre-noire rounded cursor-pointer" aria-label={t('common.close') || 'Fermer'}>
          <XiloClose size={11} />
        </button>

        <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood mb-1">
          📲 {t('shareTarget.title') || 'Partager dans Organizador'}
        </h3>
        <p className="text-[11px] font-semibold text-cordel-master-dark/75 mb-3">
          {t('shareTarget.subtitle') || 'Choisis où publier ce contenu reçu depuis ton appareil :'}
        </p>

        {(sharedPayload.previewUrl || sharedPayload.file || sharedPayload.url) && (
          <div className="mb-3 p-2.5 rounded border border-cordel-master-dark/25 bg-cordel-bg-light flex flex-col gap-2">
            {sharedPayload.previewUrl && (
              <img src={sharedPayload.previewUrl} alt="Aperçu" className="max-h-40 w-auto mx-auto rounded border border-encre-noire object-contain" />
            )}
            {sharedPayload.file && !sharedPayload.previewUrl && (
              <div className="text-xs font-bold text-encre-noire flex items-center gap-1.5 truncate">
                <span>{sharedPayload.isPdf ? '📄' : '📎'}</span>
                <span className="truncate">{sharedPayload.file.name}</span>
              </div>
            )}
            {sharedPayload.url && (
              <div className="text-[11px] font-bold text-cordel-wood break-all flex items-center gap-1.5">
                <span>{sharedPayload.isYouTube ? '▶️ YouTube :' : '🔗'}</span>
                <span className="underline">{sharedPayload.url}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('shareTarget.captionLabel') || 'Message ou légende (modifiable)'}
          </label>
          <textarea rows="2" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={sending} placeholder={t('shareTarget.captionPlaceholder') || 'Ajoute un mot pour le groupe...'} className="theme-input text-xs font-semibold py-1.5 w-full resize-none" />
        </div>

        <div className="flex flex-col gap-2">
          <CordelButton type="button" variant="vert" useExtremeBorder={true} disabled={sending} onClick={handleSendToGroupChat} className="w-full py-2.5 text-xs font-black uppercase tracking-wider">
            {sending ? '⏳...' : (t('shareTarget.sendToGroupBtn') || '💬 Envoyer dans Tout le groupe')}
          </CordelButton>
          <CordelButton type="button" variant="default" disabled={sending} onClick={handleOpenVaral} className="w-full py-2 text-xs font-bold uppercase tracking-wider">
            {t('shareTarget.hangOnVaralBtn') || '🪢 Accrocher sur le Varal'}
          </CordelButton>
          {canPublishAnnonce && (
            <CordelButton type="button" variant="ocre" disabled={sending} onClick={handleOpenMegaphone} className="w-full py-2 text-xs font-bold uppercase tracking-wider">
              {t('shareTarget.publishMegaphoneBtn') || '📢 Publier dans le Mégaphone'}
            </CordelButton>
          )}
        </div>
      </CordelCard>
    </div>
  );
}
