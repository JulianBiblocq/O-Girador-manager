import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { downloadInvoicePDF } from '../../utils/invoicePdfGenerator';

/**
 * Modale d'envoi d'email transactionnel via l'API Brevo v3 (avec pièce jointe Devis PDF en Base64).
 */
export default function GigSendEmailModal({
  isOpen,
  onClose,
  gig,
  invoicePayload,
  associationSettings = {},
  pdfBase64,
  pdfFilename,
  onSendSuccess
}) {
  const assocName = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const configuredApiKey = associationSettings.publicTheme?.brevoApiKey || associationSettings.brevoApiKey || '';

  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState(configuredApiKey);

  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Initialisation pré-remplie du formulaire d'envoi d'email
  useEffect(() => {
    if (gig && invoicePayload && isOpen) {
      const clientEmail = gig.contactEmail || invoicePayload.client?.email || '';
      const clientNom = gig.organizer || invoicePayload.client?.nom || 'Client';
      const eventDateStr = gig.date || invoicePayload.dateEmission || '';
      const devisNum = invoicePayload.numero || 'DEV-000';
      const montantStr = (invoicePayload.montantTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });

      setRecipientEmail(clientEmail);
      setRecipientName(clientNom);
      setSubject(`[Devis ${devisNum}] - Prestation ${gig.eventName || ''}`);
      setMessageBody(
        `Bonjour ${clientNom},\n\n` +
        `Veuillez trouver ci-joint notre devis N° ${devisNum} d'un montant de ${montantStr} € concernant la prestation "${gig.eventName || ''}"` +
        (eventDateStr ? ` prévue le ${eventDateStr}.` : '.') + `\n\n` +
        `Nous restons à votre entière disposition pour tout renseignement complémentaire ou pour échanger sur la logistique.\n\n` +
        `Cordialement,\n` +
        `L'équipe ${assocName}`
      );
      setBrevoApiKey(configuredApiKey);
      setStatusMessage(null);
    }
  }, [gig, invoicePayload, isOpen, configuredApiKey, assocName]);

  if (!isOpen || !gig || !invoicePayload) return null;

  // Envoi effectif de l'email via l'API Brevo v3
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', text: "Veuillez renseigner l'adresse e-mail du destinataire." });
      return;
    }

    const apiKeyToUse = brevoApiKey?.trim() || configuredApiKey?.trim();
    if (!apiKeyToUse) {
      setStatusMessage({ type: 'error', text: "Veuillez saisir votre clé API Brevo (v3) pour effectuer l'envoi." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      // Préparation du payload de l'API REST Brevo (v3/smtp/email)
      const payload = {
        sender: {
          name: assocName,
          email: associationSettings.email || associationSettings.publicContactEmail || 'contact@ogirador.fr'
        },
        to: [
          {
            email: recipientEmail.trim(),
            name: recipientName.trim() || recipientEmail.trim()
          }
        ],
        subject: subject.trim(),
        htmlContent: messageBody.replace(/\n/g, '<br/>'),
        attachment: [
          {
            name: pdfFilename || `Devis_${invoicePayload.numero || 'DEV'}.pdf`,
            content: pdfBase64
          }
        ]
      };

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': apiKeyToUse
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `✓ Devis envoyé avec succès à ${recipientEmail} !`
        });
        setTimeout(() => {
          if (onSendSuccess) onSendSuccess();
          onClose();
        }, 2000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error("GigSendEmailModal - Erreur API Brevo :", errJson);
        setStatusMessage({
          type: 'error',
          text: errJson.message || `Erreur Brevo (HTTP ${res.status}). Vérifiez votre clé API.`
        });
      }
    } catch (err) {
      console.error("GigSendEmailModal - Erreur d'envoi :", err);
      setStatusMessage({
        type: 'error',
        text: "Impossible de contacter l'API Brevo. Vérifiez votre connexion."
      });
    } finally {
      setSending(false);
    }
  };

  // Option de secours : Téléchargement du PDF en local
  const handleDownloadBackup = () => {
    downloadInvoicePDF(invoicePayload, associationSettings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-2xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto text-left relative"
      >
        {/* Entête Modale */}
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✉️</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
                Envoi du Devis par E-mail (Brevo API)
              </h3>
              <p className="text-[10px] text-stone-500 font-bold">
                Devis N° {invoicePayload.numero} — {gig.eventName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message d'état */}
        {statusMessage && (
          <div className={`p-3 rounded border text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900' 
              : 'bg-red-50 border-red-400 text-red-900'
          }`}>
            <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Pièce jointe attachée */}
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <div className="flex flex-col">
              <span className="font-extrabold text-emerald-950">{pdfFilename || `Devis_${invoicePayload.numero}.pdf`}</span>
              <span className="text-[9px] font-semibold text-emerald-800">Pièce jointe PDF générée automatiquement</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer shadow-xs"
            title="Télécharger une copie locale"
          >
            📥 Copie Locale
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="flex flex-col gap-3.5">
          {/* Email et Nom Destinataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-stone-700">
                E-mail Destinataire (Client) *
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={sending}
                placeholder="client@organisateur.fr"
                className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-stone-700">
                Nom du Destinataire / Organisateur
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                disabled={sending}
                placeholder="Ex: Mairie de Lille"
                className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          {/* Objet du mail */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold uppercase text-stone-700">
              Objet du Message *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>

          {/* Corps du message */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold uppercase text-stone-700">
              Contenu du Message E-mail
            </label>
            <textarea
              rows={6}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              disabled={sending}
              className="text-xs p-3 border border-stone-300 rounded bg-white font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Clé API Brevo si non configurée */}
          {!configuredApiKey && (
            <div className="flex flex-col gap-1 p-2.5 bg-amber-50 border border-amber-300 rounded">
              <label className="text-[10px] font-extrabold uppercase text-amber-900 flex items-center justify-between">
                <span>🔑 Clé API Brevo v3 (Non renseignée dans la config)</span>
                <span className="text-[9px] font-normal italic">Saisissez votre clé API pour envoyer</span>
              </label>
              <input
                type="password"
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                placeholder="xkeysib-..."
                className="text-xs font-mono px-2.5 py-1 border border-amber-300 rounded bg-white"
              />
            </div>
          )}

          {/* Boutons d'Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dashed">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              📥 Télécharger le PDF (Secours sans e-mail)
            </button>

            <div className="flex items-center gap-2">
              <CordelButton type="button" variant="default" onClick={onClose} disabled={sending} className="text-xs">
                Annuler
              </CordelButton>
              <CordelButton
                type="submit"
                variant="vert"
                disabled={sending}
                className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>{sending ? '⏳ Envoi en cours...' : '📤 Valider & Envoyer par E-mail'}</span>
              </CordelButton>
            </div>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
