import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTranslation } from '../../LanguageContext';
import useModalEscape from '../../../hooks/useModalEscape';
import { isDemoMode } from '../../../demo/demoManager';
import { sendAssociationEmail } from '../../../utils/emailService';
import { generateExternalVolunteerMessage } from '../../../utils/volunteerMemoUtils';

/**
 * Modale Cordel d'envoi du « 📋 Mémo Jour J » et du « 🙏 Mot de remerciement » aux externes :
 * copie WhatsApp/SMS, lien wa.me, envoi transactionnel Brevo (avec replyTo officiel) et repli mailto:.
 */
export default function VolunteerExternalDispatchModal({
  isOpen = false, applications = [], initialAppId = null, event = {},
  shiftsById = {}, commissions = [], allUsers = [], onClose, tr
}) {
  const { language } = useTranslation();
  const [selectedAppId, setSelectedAppId] = useState('');
  const [mode, setMode] = useState('memo_jour_j');
  const [msgLocale, setMsgLocale] = useState(language || 'fr');
  const [assocSettings, setAssocSettings] = useState({});
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState('');
  useModalEscape(isOpen, onClose, sendingEmail);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedAppId(initialAppId || applications[0]?.id || '');
    setMsgLocale(language || 'fr');
    setFeedback('');
    if (event?.groupId) {
      getDoc(doc(db, 'associations', event.groupId))
        .then((snap) => { if (snap.exists()) setAssocSettings({ id: snap.id, groupId: snap.id, ...snap.data() }); })
        .catch(() => {});
    }
  }, [isOpen, initialAppId, applications, event?.groupId, language]);

  const activeApp = useMemo(() => applications.find((a) => a.id === selectedAppId) || applications[0] || null, [applications, selectedAppId]);
  const generated = useMemo(() => {
    if (!activeApp) return { subject: '', body: '', whatsappUrl: '', mailtoUrl: '' };
    return generateExternalVolunteerMessage({
      mode, locale: msgLocale, application: activeApp, event,
      associationName: assocSettings.nom || assocSettings.associationName || '', shiftsById, commissions, allUsers
    });
  }, [activeApp, mode, msgLocale, event, assocSettings, shiftsById, commissions, allUsers]);

  useEffect(() => { setSubject(generated.subject); setBody(generated.body); setFeedback(''); }, [generated]);

  if (!isOpen || !activeApp) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const liveMailto = `mailto:${encodeURIComponent(activeApp.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const liveWhatsapp = generated.whatsappUrl ? generated.whatsappUrl.replace(/\?text=.*$/, `?text=${encodeURIComponent(body)}`) : '';
  const replyTo = assocSettings.emailReplyTo || assocSettings.email || assocSettings.publicContactEmail || '';
  const hasBrevoReady = Boolean(!isDemoMode() && activeApp.email && replyTo);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  };

  const handleSendEmail = async () => {
    if (!activeApp.email) return;
    if (!hasBrevoReady) { window.location.href = liveMailto; return; }
    setSendingEmail(true); setFeedback('');
    try {
      await sendAssociationEmail({
        groupId: event.groupId, senderEmail: replyTo,
        to: [{ email: activeApp.email, name: `${activeApp.prenom || ''} ${activeApp.nom || ''}`.trim() }],
        subject, htmlContent: body.replace(/\n/g, '<br/>')
      }, assocSettings);
      setFeedback(`✓ ${t('agenda.volunteerEmailSentSuccess') || 'E-mail envoyé avec succès !'}`);
    } catch {
      setFeedback(t('agenda.volunteerEmailFallbackNotice') || 'Envoi direct indisponible : ouverture de votre messagerie pré-remplie.');
      window.location.href = liveMailto;
    } finally { setSendingEmail(false); }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs select-none overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget && !sendingEmail) onClose(); }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left my-auto">
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">✉️ {t('agenda.volunteerDispatchModalTitle') || 'Envoyer un Mémo Jour J ou Remerciement'}</h4>
          <button type="button" onClick={onClose} disabled={sendingEmail} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-2.5 text-xs max-h-[82vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {applications.length > 1 && (
              <select value={activeApp.id} onChange={(e) => setSelectedAppId(e.target.value)} className="theme-input py-1 px-2 text-xs font-bold flex-1 min-w-[160px]">
                {applications.map((a) => <option key={a.id} value={a.id}>{`${a.prenom || ''} ${a.nom || ''}`.trim()}</option>)}
              </select>
            )}
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMode('memo_jour_j')} className={`px-2.5 py-1 rounded border text-[10px] font-black cursor-pointer ${mode === 'memo_jour_j' ? 'bg-[var(--cordel-wood)] text-white border-[var(--theme-border)]' : 'bg-[var(--cordel-bg)] border-[var(--theme-border)]/30'}`}>📋 {t('agenda.volunteerDispatchModeMemo') || 'Mémo Jour J'}</button>
              <button type="button" onClick={() => setMode('thank_you')} className={`px-2.5 py-1 rounded border text-[10px] font-black cursor-pointer ${mode === 'thank_you' ? 'bg-[var(--color-cordel-vert)] text-white border-[var(--theme-border)]' : 'bg-[var(--cordel-bg)] border-[var(--theme-border)]/30'}`}>🙏 {t('agenda.volunteerDispatchModeThanks') || 'Mot de remerciement'}</button>
              <select value={msgLocale} onChange={(e) => setMsgLocale(e.target.value)} className="theme-input py-1 px-1.5 text-[10px] font-bold"><option value="fr">FR</option><option value="pt">PT</option></select>
            </div>
          </div>

          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="theme-input py-1 px-2.5 text-xs font-bold w-full" />
          <textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="theme-input p-2.5 text-xs w-full leading-relaxed resize-y" />
          {feedback && <p className="text-[11px] font-bold text-[var(--color-cordel-vert)]">{feedback}</p>}

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            <button type="button" onClick={handleCopy} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] text-[10.5px] font-black cursor-pointer">{copied ? `✓ ${t('agenda.volunteerCopiedMsg') || 'Message copié !'}` : `💬 ${t('agenda.volunteerCopyWhatsappBtn') || 'Copier pour WhatsApp / SMS'}`}</button>
            {liveWhatsapp && <a href={liveWhatsapp} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10.5px] font-black">📲 {t('agenda.volunteerOpenWhatsappBtn') || 'WhatsApp direct'} ↗</a>}
            {activeApp.email && (
              <>
                <button type="button" disabled={sendingEmail} onClick={handleSendEmail} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-wood)] text-white text-[10.5px] font-black cursor-pointer disabled:opacity-45">{sendingEmail ? '...' : `✉️ ${t('agenda.volunteerSendBrevoEmailBtn') || 'Envoyer par e-mail'}`}</button>
                <a href={liveMailto} className="px-2 py-1.5 rounded border border-[var(--theme-border)]/45 bg-[var(--cordel-bg)] text-[10px] font-bold underline">📨 {t('agenda.volunteerOpenMailtoBtn') || 'Ouvrir client mail (mailto:)'}</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
