import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { updateContactLastDate } from '../../utils/updateContactLastDate';
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
  const assocName = associationSettings.emailSenderName || associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const configuredApiKey = associationSettings.emailProviderApiKey || associationSettings.publicTheme?.brevoApiKey || associationSettings.brevoApiKey || '';
  const configuredSenderEmail = associationSettings.emailReplyTo || associationSettings.email || associationSettings.publicContactEmail || '';

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
        // Mise à jour automatique de la date du dernier contact dans le CRM
        if (gig) {
          updateContactLastDate(gig.groupId || associationSettings.groupId, gig.contactId || recipientEmail);
        }

        setStatusMessage({
          type: 'success',
          title: '✓ E-mail envoyé avec succès !',
          text: `Le document a été transmis à ${recipientEmail}. (Identifiant Brevo: ${resData.messageId})`
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
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !sending && onClose()}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
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
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSendEmail} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      {showErrorDetails ? 'Masquer détails' : 'Voir réponse brute API'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-normal leading-relaxed">{statusMessage.message}</p>
                {statusMessage.rawError && showErrorDetails && (
                  <pre className="text-[9px] font-mono bg-black/10 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap mt-1">
                    {statusMessage.rawError}
                  </pre>
                )}
              </div>
            )}

            {/* Expéditeur & Destinataire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded border border-stone-200 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase text-stone-600">E-mail Destinataire (Client) *</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={sending}
                  placeholder="client@domaine.com"
                  className="px-2.5 py-1 border border-stone-300 rounded font-bold bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase text-stone-600">Nom Destinataire</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={sending}
                  placeholder="Ex: M. Dupont"
                  className="px-2.5 py-1 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase text-stone-600">Nom Expéditeur</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={sending}
                  className="px-2.5 py-1 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase text-stone-600">E-mail Expéditeur (Brevo)</label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  disabled={sending}
                  className="px-2.5 py-1 border border-stone-300 rounded font-mono bg-white"
                />
              </div>
            </div>

            {/* Sujet de l'Email */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="text-[9px] font-extrabold uppercase text-stone-700">Objet du Message *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                className="px-2.5 py-1.5 border border-stone-300 rounded font-bold bg-white text-stone-900"
              />
            </div>

            {/* Corps du Message */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="text-[9px] font-extrabold uppercase text-stone-700">Contenu du Message *</label>
              <textarea
                rows={6}
                required
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={sending}
                className="p-2.5 border border-stone-300 rounded bg-white leading-relaxed resize-none font-sans text-xs"
              />
            </div>

            {/* Indication Pièce Jointe PDF */}
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📎</span>
                <span className="font-bold text-emerald-900 text-[11px]">
                  Pièce jointe attachée : <span className="font-mono">{pdfFilename || `Devis_${invoicePayload.numero}.pdf`}</span>
                </span>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                PDF Généré
              </span>
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
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-wrap items-center justify-between gap-2 bg-stone-50">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              📥 Télécharger le PDF (Secours)
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
      </div>
    </div>
  );
}
