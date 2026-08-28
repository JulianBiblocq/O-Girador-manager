import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, functions } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

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
  if (!isOpen) return null;

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

  // Déclenchement de l'envoi du contrat via la Cloud Function Firebase
  const handleSubmitSend = async (e) => {
    e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', text: "Veuillez renseigner une adresse e-mail valide pour le destinataire." });
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
      onKeyDown={(e) => e.key === 'Escape' && !sending && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg bg-[#fdfaf2] border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/30 flex items-center justify-between bg-[#fdfaf2]">
          <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>📝 Envoyer un contrat (Brevo)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="text-xs font-black p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmitSend} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  E-mail Destinataire <span className="text-red-700">*</span>
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
                  Nom Organisateur / Structure
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={sending}
                  placeholder="Mairie de Maracatu / Festival X"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Événement & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  Nom de l'Événement
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={sending}
                  placeholder="Prestation Carnaval 2026"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  Date de la Prestation
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={sending}
                  placeholder="Samedi 15 Août 2026"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Montant Cachet & Lien Contrat PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  Montant du Cachet (€)
                </label>
                <input
                  type="text"
                  value={cachet}
                  onChange={(e) => setCachet(e.target.value)}
                  disabled={sending}
                  placeholder="1200 € Net"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                  Lien du Contrat PDF (Optionnel)
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
                <span>Template ID Brevo (Optionnel)</span>
                <span className="text-[9px] text-stone-500 font-normal">Laissez vide pour utiliser le modèle Cordel par défaut</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={sending}
                placeholder="Ex: 12 (ID du template transactionnel Brevo)"
                className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
              />
            </div>

            {/* Note Particulière / Message d'accompagnement */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-encre-noire/80">
                Message d'accompagnement / Notes
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                disabled={sending}
                placeholder="Merci de nous retourner un exemplaire signé avant le 1er Août..."
                className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-3 bg-[#fdfaf2]">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={sending}
              className="text-xs px-4 py-2"
            >
              Annuler
            </CordelButton>

            <CordelButton
              type="submit"
              variant="vert"
              disabled={sending}
              className="text-xs px-5 py-2 font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <span>{sending ? "⏳ Envoi en cours..." : "📤 Valider & Envoyer via Brevo"}</span>
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
