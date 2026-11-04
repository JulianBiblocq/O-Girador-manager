import React, { useState, useMemo, useEffect } from 'react';
import { computeAssociationUsageStats, syncUsageStatsToOrquestrador } from '../../../utils/usageStatsUtils';
import { dispatchBulkInAppAndPushNotification } from '../../../utils/inAppNotificationService';
import TerracottaMegaphoneIcon from '../../TerracottaMegaphoneIcon';

/**
 * Grille compacte de statistiques d'usage numérique de l'association (Bureau & CA) :
 * - Ligne 1 (grid-cols-2) : 1. Couverture Push + 2. Fréquentation App
 * - Ligne 2 (grid-cols-1 sm:grid-cols-2) : 3. Lectures Mégaphone (SVG Terracotta) + 4. Consultations Varal
 */
export default function UsageStatsBanner({
  groupId, rawUsers = [], rawAnnouncements = [], rawDocuments = [], canSyncOrquestrador = false
}) {
  const [showUnreachable, setShowUnreachable] = useState(false);
  const [showZeroViews, setShowZeroViews] = useState(false);
  const [remindingInApp, setRemindingInApp] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState('');

  const stats = useMemo(
    () => computeAssociationUsageStats({ rawUsers, rawAnnouncements, rawDocuments }),
    [rawUsers, rawAnnouncements, rawDocuments]
  );

  useEffect(() => {
    syncUsageStatsToOrquestrador(groupId, stats, canSyncOrquestrador);
  }, [groupId, stats, canSyncOrquestrador]);

  const handleRemindInApp = async () => {
    if (remindingInApp || stats.unreachableMembers.length === 0) return;
    setRemindingInApp(true);
    try {
      await dispatchBulkInAppAndPushNotification({
        recipientIds: stats.unreachableMembers.map((m) => m.id),
        groupId, type: 'push_reminder',
        titre: '🔔 Active tes alertes en 1 clic !',
        message: 'Ne manque aucune convocation ou annonce du groupe : clique ici pour activer les notifications sur ton appareil.',
        targetUrl: '/app?setup-push=1', sendPush: false
      });
      setReminderFeedback(`✅ Relance envoyée à ${stats.unreachableMembers.length} membre(s).`);
    } catch {
      setReminderFeedback('❌ Erreur lors de la relance interne.');
    } finally {
      setRemindingInApp(false);
    }
  };

  const handleCopyReminderMessage = async () => {
    const emails = stats.unreachableMembers.map((m) => m.email).filter(Boolean).join(', ');
    const text = `🔔 Bonjour ! Pour recevoir en temps réel les convocations, sondages et messages du groupe sur Organizador, active tes alertes en 1 clic ici :\n👉 https://organizador.o-girador.com/app?setup-push=1${emails ? `\n\nDestinataires (${stats.unreachableMembers.length}) : ${emails}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setReminderFeedback('📋 Message WhatsApp + e-mails copiés !');
    } catch {
      setReminderFeedback('❌ Impossible de copier automatiquement.');
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 bg-[var(--cordel-bg,#f4ecd8)]/80 border border-[var(--theme-border-color,#181716)]/20 rounded-[var(--theme-border-radius,6px)] flex flex-col justify-between gap-1.5">
          <div>
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase opacity-65 block">1. Couverture Push</span>
            <div className="text-sm sm:text-base font-black text-[var(--color-cordel-vert,#2d6a4f)] mt-0.5">
              🔔 {stats.pushReachableCount}/{stats.totalActiveMembers} <span className="text-[11px]">({stats.pushReachablePercent}%)</span>
            </div>
            <p className="text-[9px] opacity-70 font-semibold">membres actifs joignables</p>
          </div>
          {stats.unreachableMembers.length > 0 && (
            <div className="pt-1 border-t border-dashed border-[var(--theme-border-color,#181716)]/15 space-y-1 no-print">
              <button type="button" onClick={() => setShowUnreachable((v) => !v)} className="text-[9px] font-black text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer">
                {showUnreachable ? '▾ Masquer' : `▸ ${stats.unreachableMembers.length} non-joignables`}
              </button>
              {showUnreachable && (
                <ul className="max-h-20 overflow-y-auto text-[9px] font-semibold space-y-0.5 pr-1">
                  {stats.unreachableMembers.map((m) => <li key={m.id} className="truncate">🔕 {m.label}</li>)}
                </ul>
              )}
              <div className="flex flex-col gap-1 pt-0.5">
                <button type="button" onClick={handleRemindInApp} disabled={remindingInApp} className="w-full py-1 px-1.5 text-[8.5px] font-black uppercase bg-[var(--color-cordel-ocre,#c05621)] text-white rounded border border-[var(--theme-border-color,#181716)] cursor-pointer disabled:opacity-60 truncate">
                  {remindingInApp ? '⏳ Envoi...' : "🔔 Relancer l'appli"}
                </button>
                <button type="button" onClick={handleCopyReminderMessage} className="w-full py-1 px-1.5 text-[8.5px] font-black uppercase bg-[var(--cordel-paper,#fffdf8)] rounded border border-[var(--theme-border-color,#181716)] cursor-pointer truncate">
                  📋 Copier WhatsApp
                </button>
                {reminderFeedback && <p className="text-[8px] font-bold text-[var(--color-cordel-vert,#2d6a4f)]">{reminderFeedback}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="p-2.5 bg-[var(--cordel-bg,#f4ecd8)]/80 border border-[var(--theme-border-color,#181716)]/20 rounded-[var(--theme-border-radius,6px)] flex flex-col justify-between gap-1.5">
          <div>
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase opacity-65 block">2. Fréquentation App</span>
            <div className="grid grid-cols-3 gap-1 mt-1 text-center">
              <div><span className="text-sm sm:text-base font-black text-[var(--color-cordel-vert,#2d6a4f)]">{stats.activeMembers7d}</span><span className="text-[8px] font-bold opacity-70 block">7j</span></div>
              <div><span className="text-sm sm:text-base font-black text-[var(--color-cordel-rouge,#8b2a1a)]">{stats.activeMembers30d}</span><span className="text-[8px] font-bold opacity-70 block">30j</span></div>
              <div><span className="text-sm sm:text-base font-black opacity-60">{stats.inactiveOver30d}</span><span className="text-[8px] font-bold opacity-70 block">&gt;30j</span></div>
            </div>
          </div>
          <p className="text-[8.5px] opacity-60 italic">Dernière connexion des actifs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-2.5 bg-[var(--cordel-bg,#f4ecd8)]/80 border border-[var(--theme-border-color,#181716)]/20 rounded-[var(--theme-border-radius,6px)] flex flex-col justify-between gap-1.5">
          <div>
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase opacity-65 block">3. Lectures Mégaphone</span>
            <div className="text-sm sm:text-base font-black text-[var(--color-cordel-ocre,#c05621)] mt-0.5 flex items-center gap-1.5">
              <TerracottaMegaphoneIcon size={15} />
              <span>{stats.avgMegaphoneReadRate}%</span>
              <span className="text-[10px] font-bold opacity-70">de lecture moy.</span>
            </div>
            <p className="text-[9px] opacity-70 font-semibold">Sur {stats.recentAnnouncementsCount} annonce(s) récente(s)</p>
          </div>
          {stats.recentAnnouncementsStats.length > 0 && (
            <div className="pt-1 border-t border-dashed border-[var(--theme-border-color,#181716)]/15 space-y-0.5 max-h-16 overflow-y-auto">
              {stats.recentAnnouncementsStats.slice(0, 3).map((a) => (
                <div key={a.id} className="flex justify-between text-[9px] font-semibold gap-1"><span className="truncate">{a.titre}</span><span className="font-black shrink-0">{a.readCount}/{a.targetCount}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2.5 bg-[var(--cordel-bg,#f4ecd8)]/80 border border-[var(--theme-border-color,#181716)]/20 rounded-[var(--theme-border-radius,6px)] flex flex-col justify-between gap-1.5">
          <div>
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase opacity-65 block">4. Consultations Varal</span>
            <div className="text-sm sm:text-base font-black text-[var(--color-cordel-rouge,#8b2a1a)] mt-0.5">
              🧺 {stats.varalTotalViews} vue{stats.varalTotalViews > 1 ? 's' : ''} <span className="text-[10px] font-bold opacity-70">({stats.varalTotalDocs} docs)</span>
            </div>
            {stats.top5VaralDocs.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[9px] font-semibold">
                {stats.top5VaralDocs.slice(0, 3).map((d, i) => <li key={d.id} className="flex justify-between gap-1"><span className="truncate">{i + 1}. {d.titre}</span><span className="font-black shrink-0">👁️ {d.views}</span></li>)}
              </ul>
            )}
          </div>
          {stats.zeroViewVaralDocs.length > 0 && (
            <div className="pt-1 border-t border-dashed border-[var(--theme-border-color,#181716)]/15 no-print">
              <button type="button" onClick={() => setShowZeroViews((v) => !v)} className="text-[9px] font-black text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer">{showZeroViews ? '▾ Masquer 0 vue' : `▸ ${stats.zeroViewVaralDocs.length} doc(s) à 0 vue`}</button>
              {showZeroViews && <ul className="mt-1 max-h-20 overflow-y-auto text-[9px] font-semibold space-y-0.5 pr-1">{stats.zeroViewVaralDocs.map((d) => <li key={d.id} className="truncate">📄 {d.titre}</li>)}</ul>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
