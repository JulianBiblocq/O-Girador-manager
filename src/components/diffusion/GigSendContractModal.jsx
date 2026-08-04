import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { generateContractPDF, downloadContractPDF } from '../../utils/contractPdfGenerator';
import { updateContactLastDate } from '../../utils/updateContactLastDate';

/**
 * Modale d'envoi du Contrat de Prestation PDF par E-mail via l'API Brevo v3 (et Firebase Cloud Functions).
 * Incruste automatiquement les informations légales et la signature numérisée de l'association.
 */
export default function GigSendContractModal({
  isOpen,
  onClose,
  gig,
  associationSettings = {},
  onSendSuccess
}) {
  const assocName = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const configuredApiKey = associationSettings.publicTheme?.brevoApiKey || associationSettings.brevoApiKey || '';
  const configuredSenderEmail = associationSettings.email || associationSettings.emailOfficiel || associationSettings.publicContactEmail || '';

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

  // Initialisation du formulaire au chargement
  useEffect(() => {
    if (gig && isOpen) {
      const clientEmail = gig.contactEmail || gig.client?.email || '';
      const clientNom = gig.organizer || gig.client?.nom || 'Organisateur';
      const eventNameStr = gig.eventName || 'Prestation artistique';
      const dateStr = gig.date || '';

      setSenderEmail(configuredSenderEmail);
      setSenderName(assocName);
      setRecipientEmail(clientEmail);
      setRecipientName(clientNom);
      setSubject(`[Contrat de Prestation] - ${eventNameStr}`);
      setMessageBody(
        `Bonjour ${clientNom},\n\n` +
        `Veuillez trouver ci-joint notre contrat de prestation concernant "${eventNameStr}"` +
        (dateStr ? ` prévue le ${dateStr}.` : '.') + `\n\n` +
        `Nous vous invitons à le consulter, le parapher et à nous le retourner signé avec la mention "Lu et approuvé - Bon pour accord".\n\n` +
        `Nous restons à votre entière disposition pour tout échange logistique ou complémentaire.\n\n` +
        `Cordialement,\n` +
        `L'équipe ${assocName}`
      );
      setBrevoApiKey(configuredApiKey);
      setStatusMessage(null);
      setShowErrorDetails(false);
    }
  }, [gig, isOpen, configuredApiKey, configuredSenderEmail, assocName]);

  if (!isOpen || !gig) return null;

  // Envoi effectif du Contrat PDF par email via Brevo API v3
  const handleSendContract = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!recipientEmail || !recipientEmail.trim()) {
      setStatusMessage({ type: 'error', title: 'E-mail manquant', text: "Veuillez renseigner l'adresse e-mail du destinataire." });
      return;
    }

    if (!senderEmail || !senderEmail.trim()) {
      setStatusMessage({ type: 'error', title: 'Expéditeur manquant', text: "Veuillez renseigner une adresse e-mail expéditeur (validée dans votre compte Brevo)." });
      return;
    }

    const apiKeyToUse = brevoApiKey?.trim() || configuredApiKey?.trim();
    if (!apiKeyToUse) {
      setStatusMessage({ type: 'error', title: 'Clé API absente', text: "Veuillez saisir votre clé API Brevo (v3) pour effectuer l'envoi." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      // 1. Génération du Contrat PDF en mémoire et conversion en Base64 pure
      console.log("GigSendContractModal - Génération du Contrat PDF en mémoire...");
      const pdfDoc = await generateContractPDF(gig, associationSettings);
      const pdfBase64 = pdfDoc.output('base64');
      const filename = `Contrat_${(gig.eventName || 'prestation').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      // 2. Préparation du payload Brevo REST v3
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
            name: filename,
            content: pdfBase64
          }
        ]
      };

      console.log("GigSendContractModal - Transmission à l'API Brevo v3...", {
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
      console.log("GigSendContractModal - Réponse Brevo : Code HTTP =", res.status, "Données =", resData);

      // Validation stricte du succès HTTP (201 ou 200 avec messageId)
      if ((res.status === 201 || res.status === 200 || res.ok) && resData.messageId) {
        // Mise à jour automatique de la date de dernier contact CRM
        if (gig) {
          updateContactLastDate(gig.groupId || associationSettings.groupId, gig.contactId || recipientEmail);
        }

        setStatusMessage({
          type: 'success',
          title: '✓ Contrat envoyé avec succès !',
          text: `Le contrat de prestation a été expédié à ${recipientEmail}. (ID Brevo: ${resData.messageId})`
        });

        setTimeout(() => {
          if (onSendSuccess) onSendSuccess();
          onClose();
        }, 2200);
      } else {
        const errorMsg = resData.message || resData.code || `Code HTTP ${res.status}`;
        console.error("GigSendContractModal - ÉCHEC BREVO :", res.status, resData);

        let userHelpMsg = `Erreur renvoyée par Brevo (HTTP ${res.status}) : ${errorMsg}`;

        if (res.status === 401 || resData.code === 'unauthorized') {
          userHelpMsg = `Clé API Brevo non autorisée (${errorMsg}). Vérifiez votre clé API v3 dans la configuration.`;
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
      console.error("GigSendContractModal - Exception lors de l'envoi :", err);
      setStatusMessage({
        type: 'error',
        title: "❌ Erreur Réseau",
        text: `Impossible de contacter l'API Brevo : ${err.message || 'Erreur réseau.'}`
      });
    } finally {
      setSending(false);
    }
  };

  // Option de téléchargement local de secours
  const handleDownloadBackup = async () => {
    await downloadContractPDF(gig, associationSettings);
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
            <span className="text-xl">✍️</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
                Envoi du Contrat PDF par E-mail (Brevo)
              </h3>
              <p className="text-[10px] text-stone-500 font-bold">
                Prestation : {gig?.eventName} — {gig?.organizer}
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
        <form onSubmit={handleSendContract} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Message d'état et erreurs explicites */}
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

                {statusMessage.rawError && showErrorDetails && (
                  <pre className="p-2 mt-2 bg-stone-900 text-green-400 font-mono text-[10px] rounded overflow-x-auto max-h-40">
                    {statusMessage.rawError}
                  </pre>
                )}
              </div>
            )}

            {/* Pièce jointe Contrat PDF */}
            <div className="flex items-center justify-between bg-purple-50 border border-purple-300 p-2.5 rounded text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <div className="flex flex-col">
                  <span className="font-extrabold text-purple-950">
                    Contrat_{(gig?.eventName || 'prestation').replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                  </span>
                  <span className="text-[9px] font-semibold text-purple-800">
                    Contrat de prestation avec en-tête légal et signature numérisée
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-purple-800 hover:bg-purple-900 text-white rounded cursor-pointer shadow-xs"
                title="Télécharger une copie locale"
              >
                📥 Copie Locale
              </button>
            </div>

            {/* Expéditeur Brevo (Nom & Email) */}
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
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase text-cordel-wood">
                  Nom Expéditeur
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={sending}
                  className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>

            {/* Destinataire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-700">
                  E-mail Destinataire (Client / Organisateur) *
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
                  Nom du Destinataire
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

            {/* Objet */}
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

            {/* Message d'accompagnement */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-stone-700">
                Message d'accompagnement E-mail
              </label>
              <textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={sending}
                className="text-xs p-3 border border-stone-300 rounded bg-white font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Clé API Brevo */}
            <div className="flex flex-col gap-1 p-2 bg-amber-50 border border-amber-300 rounded">
              <label className="text-[9px] font-extrabold uppercase text-amber-900 flex items-center justify-between">
                <span>🔑 Clé API Brevo v3</span>
                <span className="text-[8px] font-normal italic">Clé API issue de la configuration</span>
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
              📥 Télécharger le Contrat PDF (Secours)
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
                <span>{sending ? '⏳ Envoi du contrat...' : '📧 Valider & Envoyer le Contrat par E-mail'}</span>
              </CordelButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
