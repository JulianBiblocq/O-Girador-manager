import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { downloadInvoicePDF } from '../../utils/invoicePdfGenerator';

/**
 * Modale d'envoi d'email transactionnel via l'API Brevo v3 (avec pièce jointe Devis PDF en Base64).
 * Enregistre et affiche rigoureusement tout code et message de retour de l'API Brevo.
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
  const configuredSenderEmail = associationSettings.email || associationSettings.publicContactEmail || '';

  const [senderEmail, setSenderEmail] = useState(configuredSenderEmail);
  const [senderName, setSenderName] = useState(assocName);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState(configuredApiKey);

  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Initialisation pré-remplie du formulaire d'envoi d'email
  useEffect(() => {
    if (gig && invoicePayload && isOpen) {
      const clientEmail = gig.contactEmail || invoicePayload.client?.email || '';
      const clientNom = gig.organizer || invoicePayload.client?.nom || 'Client';
      const eventDateStr = gig.date || invoicePayload.dateEmission || '';
      const devisNum = invoicePayload.numero || 'DEV-000';
      const montantStr = (invoicePayload.montantTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });

      setSenderEmail(configuredSenderEmail);
      setSenderName(assocName);
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
      setShowErrorDetails(false);
    }
  }, [gig, invoicePayload, isOpen, configuredApiKey, configuredSenderEmail, assocName]);

  if (!isOpen || !gig || !invoicePayload) return null;

  // Envoi effectif de l'email via l'API Brevo v3
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', title: "E-mail manquant", text: "Veuillez renseigner l'adresse e-mail du destinataire." });
      return;
    }

    if (!senderEmail || !senderEmail.trim()) {
      setStatusMessage({ type: 'error', title: "Expéditeur manquant", text: "Veuillez renseigner une adresse e-mail expéditeur (validée dans votre compte Brevo)." });
      return;
    }

    const apiKeyToUse = brevoApiKey?.trim() || configuredApiKey?.trim();
    if (!apiKeyToUse) {
      setStatusMessage({ type: 'error', title: "Clé API absente", text: "Veuillez saisir votre clé API Brevo (v3) pour effectuer l'envoi." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      // Préparation du payload de l'API REST Brevo (v3/smtp/email)
      const payload = {
        sender: {
          name: senderName.trim() || assocName,
          email: senderEmail.trim()
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

      console.log("GigSendEmailModal - Envoi vers API Brevo (https://api.brevo.com/v3/smtp/email)...", {
        sender: payload.sender,
        to: payload.to,
        subject: payload.subject
      });

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': apiKeyToUse
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      console.log("GigSendEmailModal - Réponse Brevo API : Code HTTP =", res.status, "Données =", resData);

      // Condition stricte : Succès uniquement si HTTP 201 (ou 200) et présence d'un messageId
      if ((res.status === 201 || res.status === 200 || res.ok) && resData.messageId) {
        setStatusMessage({
          type: 'success',
          title: '✓ E-mail envoyé avec succès !',
          text: `Le devis a été transmis à ${recipientEmail}. (Identifiant Brevo: ${resData.messageId})`
        });
        setTimeout(() => {
          if (onSendSuccess) onSendSuccess();
          onClose();
        }, 2200);
      } else {
        // En cas d'erreur de Brevo, capturer l'erreur exacte sans masquage
        const errorMsg = resData.message || resData.code || `Code HTTP ${res.status}`;
        console.error("GigSendEmailModal - ÉCHEC BREVO :", res.status, resData);

        let userHelpMsg = `Erreur renvoyée par Brevo (HTTP ${res.status}) : ${errorMsg}`;

        if (res.status === 401 || resData.code === 'unauthorized') {
          userHelpMsg = `Clé API Brevo non autorisée (${errorMsg}). Vérifiez la clé API v3 dans la configuration.`;
        } else if (res.status === 400 && (errorMsg.toLowerCase().includes('sender') || errorMsg.toLowerCase().includes('email'))) {
          userHelpMsg = `Adresse expéditeur refusée par Brevo (${errorMsg}). L'adresse expéditeur "${senderEmail}" doit impérativement être validée dans votre compte Brevo (Rubrique Expéditeurs & IP).`;
        }

        setStatusMessage({
          type: 'error',
          title: `❌ Échec d'envoi Brevo (Code ${res.status})`,
          text: userHelpMsg,
          rawError: JSON.stringify(resData, null, 2)
        });
      }
    } catch (err) {
      console.error("GigSendEmailModal - Exception d'envoi :", err);
      setStatusMessage({
        type: 'error',
        title: "❌ Erreur Réseau",
        text: `Impossible de contacter l'API Brevo : ${err.message || 'Erreur réseau.'}`
      });
    } finally {
      setSending(false);
    }
  };

  // Option de secours : Téléchargement du PDF en local
  const handleDownloadBackup = async () => {
    await downloadInvoicePDF(invoicePayload, associationSettings);
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
                Envoi du Devis par E-mail (API Brevo v3)
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

        {/* Message d'état et erreurs explicites de Brevo */}
        {statusMessage && (
          <div className={`p-3 rounded border text-xs font-bold flex flex-col gap-1 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900' 
              : 'bg-red-50 border-red-400 text-red-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold">{statusMessage.title}</span>
              {statusMessage.rawError && (
                <button
                  type="button"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-[9px] underline cursor-pointer text-red-800 font-bold"
                >
                  {showErrorDetails ? 'Masquer détails bruts' : '🔍 Voir rapport brut'}
                </button>
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed">{statusMessage.text}</p>

            {/* Rapport d'erreur JSON brut pour diagnostic */}
            {statusMessage.rawError && showErrorDetails && (
              <pre className="p-2 mt-2 bg-stone-900 text-green-400 font-mono text-[10px] rounded overflow-x-auto max-h-40">
                {statusMessage.rawError}
              </pre>
            )}
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
          {/* Expéditeur Brevo (Nom & Email vérifié) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-2.5 rounded border border-stone-200">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-cordel-wood">
                E-mail Expéditeur (Vérifié Brevo) *
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                disabled={sending}
                placeholder="contact@votre-association.fr"
                className="text-xs font-mono font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
              />
              <p className="text-[8px] text-stone-500 font-medium">
                Doit être validé dans votre compte Brevo (Rubrique Expéditeurs & IP).
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold uppercase text-cordel-wood">
                Nom d'affichage Expéditeur
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={sending}
                placeholder="Nom de votre association"
                className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

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
              rows={5}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              disabled={sending}
              className="text-xs p-3 border border-stone-300 rounded bg-white font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Clé API Brevo si non configurée */}
          <div className="flex flex-col gap-1 p-2 bg-amber-50 border border-amber-300 rounded">
            <label className="text-[9px] font-extrabold uppercase text-amber-900 flex items-center justify-between">
              <span>🔑 Clé API Brevo v3</span>
              <span className="text-[8px] font-normal italic">Si vide, utilise la clé de la configuration</span>
            </label>
            <input
              type="password"
              value={brevoApiKey}
              onChange={(e) => setBrevoApiKey(e.target.value)}
              disabled={sending}
              placeholder="xkeysib-..."
              className="text-xs font-mono px-2.5 py-1 border border-amber-300 rounded bg-white"
            />
          </div>

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
