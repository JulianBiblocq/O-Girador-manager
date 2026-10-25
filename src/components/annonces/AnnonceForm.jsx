import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloMegaphone, XiloClose } from '../XiloIcons';
import AnnonceTargetSelector from './AnnonceTargetSelector';
import AnnonceCtaFields from './AnnonceCtaFields';

/**
 * Formulaire de publication d'une pancarte / annonce.
 */
export default function AnnonceForm({
  onSubmit,
  onCancel,
  saving = false,
  tagsDisponibles = [],
  allMembers = [],
  t
}) {
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [cibles, setCibles] = useState(['Tous']);
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [publishOnApp, setPublishOnApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sendPushNotification, setSendPushNotification] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titre.trim() || !message.trim() || saving) return;

    onSubmit({
      titre: titre.trim(),
      message: message.trim(),
      actionText: actionText.trim(),
      actionLink: actionLink.trim(),
      cibles,
      targetUserIds,
      publishOnApp,
      sendViaEmail,
      sendPushNotification
    });
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative text-left">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
      >
        <XiloClose size={10} />
      </button>

      <h4 className="panel-title text-sm font-bold text-cordel-wood mb-4">
        {t('widgetAnnonces.publishTitle')}
      </h4>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Titre */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('widgetAnnonces.annTitleLabel')}
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            disabled={saving}
            placeholder={t('widgetAnnonces.annTitlePlaceholder')}
            className="theme-input text-xs font-bold py-1.5"
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('widgetAnnonces.annMsgLabel')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={saving}
            rows="3"
            placeholder={t('widgetAnnonces.annMsgPlaceholder')}
            className="theme-input text-xs font-semibold py-1.5 resize-none w-full"
          />
        </div>

        {/* Call to Action optionnel */}
        <AnnonceCtaFields
          actionText={actionText}
          setActionText={setActionText}
          actionLink={actionLink}
          setActionLink={setActionLink}
          disabled={saving}
        />

        {/* Cibles (globales, pupitres, nominatives) */}
        <AnnonceTargetSelector
          cibles={cibles}
          setCibles={setCibles}
          targetUserIds={targetUserIds}
          setTargetUserIds={setTargetUserIds}
          tagsDisponibles={tagsDisponibles}
          allMembers={allMembers}
          disabled={saving}
          t={t}
        />

        {/* Canaux de diffusion */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed border-cordel-master-dark/15 text-left">
          <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('widgetAnnonces.channelsLabel')}
          </label>
          <div className="flex flex-col gap-1.5 pl-1 select-none">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={publishOnApp}
                onChange={(e) => setPublishOnApp(e.target.checked)}
                disabled={saving}
                className="accent-cordel-wood scale-105"
              />
              <span>{t('widgetAnnonces.channelApp')}</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={sendViaEmail}
                onChange={(e) => setSendViaEmail(e.target.checked)}
                disabled={saving}
                className="accent-cordel-wood scale-105"
              />
              <span>{t('widgetAnnonces.channelEmail')}</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={sendPushNotification}
                onChange={(e) => setSendPushNotification(e.target.checked)}
                disabled={saving}
                className="accent-cordel-wood scale-105"
              />
              <span className="inline-flex items-center gap-1.5">
                <XiloMegaphone size={12} /> Envoyer une notification aux membres
              </span>
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
          <CordelButton
            type="button"
            variant="default"
            disabled={saving}
            onClick={onCancel}
            className="text-xs px-3 py-1.5"
          >
            {t('common.cancel')}
          </CordelButton>
          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            disabled={saving || !titre.trim() || !message.trim()}
            className="text-xs px-4 py-1.5 font-bold"
          >
            {saving ? '...' : t('widgetAnnonces.publishBtn')}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
