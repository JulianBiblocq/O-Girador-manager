import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import VolunteerApplicationsInbox from './VolunteerApplicationsInbox';
import VolunteerPublicCallConfigCard from '../../agenda/VolunteerPublicCallConfigCard';
import { normalizePublicVolunteerConfig } from '../../../utils/volunteerApplicationUtils';
import { buildPublicVolunteerCallUrl } from '../../../utils/publicVolunteerUtils';
import { isDemoMode } from '../../../demo/demoManager';

/**
 * Sous-vue 3 de l'onglet Bénévoles (« 📥 Candidatures & Appel public ») :
 * sas de validation toutes commissions + flexibles, ajout externe manuel, partage Lien & QR Code
 * et réglages de l'appel public réservés aux profils `canManageEvents` (`isAuthorized`).
 */
export default function VolunteerApplicationsPanel({
  event = {},
  canManageEvents = false,
  pendingApplications = [],
  acceptedApplications = [],
  hasAnyVolunteer = false,
  shiftsById = {},
  manageableShifts = [],
  actionLoadingId = null,
  onQuickValidate,
  onOpenAssign,
  onReject,
  onOpenManualModal,
  onOpenAcceptedSummary,
  onOpenDispatchModal,
  onExportCsv,
  onOpenShareModal,
  tr
}) {
  const [savingCfg, setSavingCfg] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const cfg = normalizePublicVolunteerConfig(event?.publicVolunteerConfig);

  const shareUrl = buildPublicVolunteerCallUrl({
    eventId: event?.id || '',
    groupId: event?.groupId || '',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    isDemo: isDemoMode()
  });

  const handleSavePublicConfig = async (nextCfg) => {
    if (!canManageEvents || !event?.id || savingCfg) return;
    setSavingCfg(true);
    try {
      await updateDoc(doc(db, 'events', event.id), {
        publicVolunteerConfig: normalizePublicVolunteerConfig(nextCfg),
        ...(nextCfg?.enabled ? { enableVolunteers: true } : {})
      });
    } catch (err) {
      console.error('Erreur mise à jour appel public bénévoles :', err);
    } finally {
      setSavingCfg(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-3.5 text-left">
      <VolunteerApplicationsInbox
        pendingApplications={pendingApplications} acceptedCount={acceptedApplications.length}
        hasAnyVolunteer={hasAnyVolunteer} shiftsById={shiftsById} manageableShifts={manageableShifts}
        actionLoadingId={actionLoadingId} onQuickValidate={onQuickValidate} onOpenAssign={onOpenAssign}
        onReject={onReject} onOpenManualModal={onOpenManualModal} onOpenAcceptedSummary={onOpenAcceptedSummary}
        onOpenDispatchModal={onOpenDispatchModal} onExportCsv={onExportCsv} tr={tr}
      />

      {/* Carte de partage Lien & QR Code de l'appel public */}
      <div className="p-3.5 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="font-black uppercase tracking-wider text-[11px] text-[var(--cordel-wood)]">
              🔗 {t('agenda.volunteerPublicShareCardTitle') || 'Lien & QR Code de la page publique Mostrador'}
            </strong>
            <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border border-[var(--theme-border)] text-white ${cfg.enabled ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`}>
              {cfg.enabled ? (t('agenda.volunteerPublicActiveBadge') || 'Ouvert') : (t('agenda.volunteerPublicClosedBadge') || 'Fermé')}
            </span>
          </div>
          <p className="text-[10.5px] font-mono opacity-75 truncate mt-1">{shareUrl}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button type="button" onClick={handleCopyLink} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[10px] font-black uppercase cursor-pointer">
            {copiedUrl ? `✓ ${t('agenda.volunteerShareCopied') || 'Lien copié !'}` : `📋 ${t('agenda.volunteerShareCopyBtn') || 'Copier le lien'}`}
          </button>
          <button type="button" onClick={onOpenShareModal} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase cursor-pointer">
            📱 {t('agenda.volunteerShareCallBtn') || 'QR Code & Affiche'}
          </button>
        </div>
      </div>

      {/* Réglages structurels de l'appel public réservés aux gestionnaires d'événements */}
      {canManageEvents && (
        <VolunteerPublicCallConfigCard
          event={event}
          config={event?.publicVolunteerConfig}
          onChange={handleSavePublicConfig}
          saving={savingCfg}
          tr={tr}
        />
      )}
    </div>
  );
}
