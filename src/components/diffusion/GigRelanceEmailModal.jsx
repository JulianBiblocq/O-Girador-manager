import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { updateContactLastDate } from '../../utils/updateContactLastDate';
import { sendAssociationEmail } from '../../utils/emailService';

/**
 * Modale d'envoi d'e-mail de Relance rapide pour le Pôle Diffusion et l'Agenda.
 * Utilise le service centralisé sendAssociationEmail pour le routage.
 */
export default function GigRelanceEmailModal({
  isOpen,
  onClose,
  gig,
  associationSettings = {},
  onSuccess
}) {
  const assocName = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const configuredApiKey = associationSettings.publicTheme?.brevoApiKey || associationSettings.brevoApiKey || '';
  const configuredSenderEmail = associationSettings.email || associationSettings.emailOfficiel || '';

  const [senderEmail, setSenderEmail] = useState(configuredSenderEmail);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState(configuredApiKey);

  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (gig && isOpen) {
      const clientEmail = gig.contactEmail || '';
      const clientNom = gig.organizer || 'Organisateur';
      const eventNameStr = gig.eventName || 'Prestation artistique';
      const dateStr = gig.date || '';

      setSenderEmail(configuredSenderEmail);
      setRecipientEmail(clientEmail);
      setSubject(`[Relance] - Prestation ${eventNameStr}`);
      setMessageBody(
        `Bonjour ${clientNom},\n\n` +
        `Nous faisons suite à nos derniers échanges concernant la prestation artistique "${eventNameStr}"` +
        (dateStr ? ` prévue le ${dateStr}.` : '.') + `\n\n` +
        `Avez-vous eu l'occasion de consulter nos propositions ? Nous restons à votre entière disposition pour échanger sur le format ou répondre à vos questions.\n\n` +
        `Cordialement,\n` +
        `L'équipe ${assocName}`
      );
      setBrevoApiKey(configuredApiKey);
      setStatusMessage(null);
    }
  }, [gig, isOpen, configuredApiKey, configuredSenderEmail, assocName]);

  if (!isOpen || !gig) return null;

  const handleSendRelance = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', title: 'E-mail manquant', text: "Veuillez renseigner l'adresse du destinataire." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      const emailParams = {
        senderEmail: senderEmail.trim(),
        senderName: assocName,
        to: [{ email: recipientEmail.trim(), name: gig.organizer || recipientEmail.trim() }],
        subject: subject.trim(),
        htmlContent: messageBody.replace(/\n/g, '<br/>')
      };

      const result = await sendAssociationEmail(emailParams, associationSettings);

      if (result.success) {
        // 1. Mise à jour de la date_dernier_contact dans contacts_diffusion
        await updateContactLastDate(gig.groupId || associationSettings.groupId, gig.contactId || recipientEmail);

        // 2. Ajout de l'entrée dans l'historique du dossier gig
        const todayFormatted = new Date().toLocaleDateString('fr-FR');
        const historyEntry = `🔔 Relance expédiée par e-mail le ${todayFormatted} à ${recipientEmail}`;

        const targetGroupId = gig.groupId || associationSettings.groupId || 'default';
        const gigRef = doc(db, 'associations', targetGroupId, 'gigs', gig.id);
        await updateDoc(gigRef, {
          exchangeHistory: arrayUnion({
            type: 'relance',
            date: new Date().toISOString(),
            description: historyEntry
          }),
          lastContactDate: new Date().toISOString().split('T')[0],
          updatedAt: serverTimestamp()
        });

        setStatusMessage({
          type: 'success',
          title: '✓ Relance envoyée !',
          text: `La relance a été transmise à ${recipientEmail}.`
        });

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error("GigRelanceEmailModal - Exception relance :", err);
      setStatusMessage({
        type: 'error',
        title: "❌ Erreur d'envoi",
        text: `Impossible d'envoyer la relance : ${err.message || 'Erreur réseau.'}`
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !sending && onClose()}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
              Envoyer une Relance (Brevo)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSendRelance} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {statusMessage && (
              <div className={`p-3 rounded border text-xs font-bold ${
                statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-red-50 border-red-400 text-red-900'
              }`}>
                <span className="font-extrabold">{statusMessage.title}</span>
                <p className="text-[11px] font-normal leading-relaxed">{statusMessage.text}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-stone-600">Expéditeur (Vérifié Brevo) *</label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                disabled={sending}
                className="text-xs font-mono font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-stone-600">Destinataire *</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={sending}
                className="text-xs font-mono font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-stone-600">Objet *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-stone-600">Message d'accompagnement</label>
              <textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={sending}
                className="text-xs p-2.5 border border-stone-300 rounded bg-white font-sans leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-2 bg-stone-50">
            <CordelButton type="button" variant="default" onClick={onClose} disabled={sending} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" disabled={sending} className="text-xs font-extrabold">
              {sending ? 'Envoi...' : '🔔 Transmettre la relance'}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
