import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

/**
 * Étape 4 du Wizard : Invitation du Bureau & Collège 👥
 * Saisie des adresses e-mails des membres du bureau/CA et copie du lien d'invitation rapide.
 */
export default function WizardStepTeamInvite({ wizardData, updateWizardData, groupId }) {
  const [emailText, setEmailText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Traitement et mise à jour de la liste des e-mails du bureau
  const handleEmailTextChange = (text) => {
    setEmailText(text);
    const parsedEmails = text
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    updateWizardData('invitedBureauEmails', parsedEmails);
  };

  // URL d'invitation directe vers l'espace du groupe
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${currentOrigin}/login?groupe=${groupId || 'samambaia'}`;

  // Copie de l'URL d'invitation
  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(err => console.error("Erreur de copie d'URL :", err));
  };

  const invitedList = Array.isArray(wizardData.invitedBureauEmails) ? wizardData.invitedBureauEmails : [];

  return (
    <div className="flex flex-col gap-5 text-left animate-fade-in">
      <div className="border-b border-dashed border-stone-300 pb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>👥</span>
          <span>Étape 4 : Invitation du Bureau & Membres du CA</span>
        </h3>
        <p className="text-xs text-stone-500 font-bold mt-1 leading-relaxed">
          Invitez immédiatement vos collègues du bureau (Président·e, Trésorier·e, Secrétaire) pour administrer ensemble le groupe.
        </p>
      </div>

      {/* 1. Zone de saisie des e-mails */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Adresses e-mails des membres à inviter ({invitedList.length})</span>
          <span className="text-[10px] text-stone-400 font-normal">Séparez par des retours à la ligne ou virgules</span>
        </label>
        <textarea
          rows={4}
          value={emailText}
          onChange={(e) => handleEmailTextChange(e.target.value)}
          placeholder={`president@mon-asso.fr\ntresorier@mon-asso.fr\nsecretaire@mon-asso.fr`}
          className="text-xs p-3 border-2 border-stone-300 rounded-lg bg-white font-mono text-stone-900 leading-relaxed outline-none focus:border-[var(--color-cordel-vert,#2d6a4f)] shadow-xs resize-none"
        />
      </div>

      {/* Aperçu des e-mails détectés */}
      {invitedList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {invitedList.map((email, idx) => (
            <span key={idx} className="text-[10px] font-mono font-bold bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)] px-2 py-1 rounded border border-emerald-300 flex items-center gap-1">
              <span>✉️</span>
              <span>{email}</span>
            </span>
          ))}
        </div>
      )}

      {/* 2. Lien d'invitation directe à partager */}
      <CordelCard variant="default" className="p-3.5 bg-stone-50 border border-stone-300 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
            Lien d'invitation directe à transmettre au bureau
          </label>
          <span className="text-[10px] text-stone-500 font-mono">Accessible 24h/7d</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-white text-stone-700 flex-1 select-all outline-none"
          />
          <button
            type="button"
            onClick={handleCopyInviteUrl}
            className={`px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider rounded transition-all cursor-pointer shadow-xs ${
              copiedLink
                ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white'
                : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300'
            }`}
          >
            {copiedLink ? '✓ Copié !' : '📋 Copier'}
          </button>
        </div>
      </CordelCard>
    </div>
  );
}
