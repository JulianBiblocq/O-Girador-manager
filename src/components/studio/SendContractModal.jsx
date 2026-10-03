import React, { useState, useEffect } from 'react';
import { useTranslation } from '../LanguageContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import CordelButton from '../CordelButton';
import useModalEscape from '../../hooks/useModalEscape';

/**
 * Composant Modale pour l'envoi d'un contrat ou devis transactionnel via Brevo.
 * Permet aux administrateurs de vérifier et saisir l'email de l'organisateur, le cachet, 
 * la date et de transmettre les variables dynamiques à l'API Brevo.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Contrôle de la visibilité de la modale
 * @param {Function} props.onClose - Callback de fermeture de la modale
 * @param {Object} props.event - Objet événement sélectionné (optionnel)
 * @param {string} props.groupId - Identifiant de l'association
 */
export default function SendContractModal({ isOpen, onClose, event, groupId }) {
  const { t } = useTranslation();
  // Initialisation des champs du formulaire avec les valeurs de l'événement s'il existe
  const [recipientEmail, setRecipientEmail] = useState(event?.contactEmail || event?.organisateurEmail || '');
  const [recipientName, setRecipientName] = useState(event?.organisateurNom || event?.organisateur || '');
  const [eventName, setEventName] = useState(event?.titre || event?.nom || '');
  const [eventDate, setEventDate] = useState(event?.date || '');
  const [cachet, setCachet] = useState(event?.cachet || event?.prix || '');
  const [contractPdfUrl, setContractPdfUrl] = useState(event?.contractPdfUrl || event?.devisUrl || '');
  const [customNotes, setCustomNotes] = useState('');
  const [templateId, setTemplateId] = useState('');

  // États de l'envoi
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Réinitialisation des états au changement d'événement
  useEffect(() => {
    if (event) {
      setRecipientEmail(event.contactEmail || event.organisateurEmail || '');
      setRecipientName(event.organisateurNom || event.organisateur || '');
      setEventName(event.titre || event.nom || '');
      setEventDate(event.date || '');
      setCachet(event.cachet || event.prix || '');
      setContractPdfUrl(event.contractPdfUrl || event.devisUrl || '');
    }
  }, [event]);

  // Écoute de la touche Échap pour la fermeture accessible
  useModalEscape(isOpen, onClose, sending);

  // Clause de garde placée impérativement après tous les hooks (Rules of Hooks)
  if (!isOpen) return null;

  // Déclenchement de l'envoi du contrat via la Cloud Function Firebase
  const handleSubmitSend = async (e) => {
    e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', text: t('studio.communication.veuillezRenseignerEmailDestinataire', { defaultValue: "Veuillez renseigner une adresse e-mail valide pour le destinataire." }) });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      const sendContractEmailFn = httpsCallable(functions, 'sendContractEmail');

      const response = await sendContractEmailFn({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        eventName: eventName.trim(),
        eventDate: eventDate.trim(),
        cachet: cachet.trim(),
        contractPdfUrl: contractPdfUrl.trim(),
        customNotes: customNotes.trim(),
        templateId: templateId.trim() || null,
        groupId: groupId
      });

      if (response.data && response.data.success) {
        setStatusMessage({
          type: 'success',
          text: response.data.message || `✓ Contrat envoyé avec succès à ${recipientEmail} !`
        });
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 2500);
      }
    } catch (err) {
      console.error("SendContractModal - Erreur d'envoi du contrat Brevo :", err);
      setStatusMessage({
        type: 'error',
        text: err.message || "Erreur lors de l'envoi de l'email transactionnel Brevo."
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden text-left mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/30 flex items-start justify-between gap-3 bg-[var(--theme-bg)]">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>{t('studio.communication.envoyerUnContratBrevo')}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation disabled:opacity-50"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmitSend} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {/* Message de notification d'état */}
            {statusMessage && (
              <div className={`p-3 rounded border-2 text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-900' 
                  : 'bg-red-50 border-red-700 text-red-900'
              }`}>
                <span>{statusMessage.type === 'success' ? '✅' : '🚨'}</span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Destinataire : Email & Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.eMailDestinataire')} <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={sending}
                  placeholder="organisateur@festival.com"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.nomOrganisateurStructure')}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={sending}
                  placeholder={t('studio.communication.mairieDeMaracatuFestivalX')}
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Événement & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.nomDeLEvenement')}
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={sending}
                  placeholder={t('studio.communication.prestationCarnaval2026')}
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.dateDeLaPrestation')}
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={sending}
                  placeholder={t('studio.communication.samedi15Aout2026')}
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Montant Cachet & Lien Contrat PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.montantDuCachet')}
                </label>
                <input
                  type="text"
                  value={cachet}
                  onChange={(e) => setCachet(e.target.value)}
                  disabled={sending}
                  placeholder={t('studio.communication.1200Net')}
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  {t('studio.communication.lienDuContratPdfOptionnel')}
                </label>
                <input
                  type="url"
                  value={contractPdfUrl}
                  onChange={(e) => setContractPdfUrl(e.target.value)}
                  disabled={sending}
                  placeholder="https://.../contrat-signe.pdf"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>
            </div>

            {/* Template ID Brevo (Optionnel) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
                <span>{t('studio.communication.templateIdBrevoOptionnel')}</span>
                <span className="text-[9px] text-stone-500 font-normal">{t('studio.communication.laissezVidePourUtiliserLe')}</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={sending}
                placeholder={t('studio.communication.ex12IdDuTemplate')}
                className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
              />
            </div>

            {/* Note Particulière / Message d'accompagnement */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                {t('studio.communication.messageDAccompagnementNotes')}
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                disabled={sending}
                placeholder={t('studio.communication.merciDeNousRetournerUn')}
                className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-3 bg-[var(--theme-bg)] pb-[max(env(safe-area-inset-bottom),1rem)]">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={sending}
              className="text-xs px-4 py-2 shrink-0"
            >
              {t('studio.communication.annuler')}
            </CordelButton>

            <CordelButton
              type="submit"
              variant="vert"
              disabled={sending}
              className="text-xs px-5 py-2 font-bold uppercase tracking-wider flex items-center gap-2 shrink-0"
            >
              <span>{sending ? t('studio.communication.envoiEnCours') : t('studio.communication.validerEnvoyerViaBrevo')}</span>
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
