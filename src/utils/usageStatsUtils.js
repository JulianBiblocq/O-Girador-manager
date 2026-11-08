import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isMemberArchived } from './memberUtils';
import { resolveTargetRecipientIds } from './announcementUtils';
import { getTimestampMs } from './readReceiptUtils';
import { getMemberPushDiagnosticBadge } from './pushDiagnosticsUtils';

/**
 * Calcule les 4 indicateurs d'usage et d'engagement de l'association :
 * 1. Couverture Notifications Push (membres actifs joignables + liste des non-joignables avec diagnostic)
 * 2. Fréquentation de l'application (actifs 7j, 30j, inactifs > 30j via `lastActive`)
 * 3. Lectures du Mégaphone (taux de lecture moyen des 5 dernières annonces)
 * 4. Consultations du Varal (Top 5 des documents les plus consultés + documents à 0 vue)
 */
export function computeAssociationUsageStats({ rawUsers = [], rawAnnouncements = [], rawDocuments = [] }) {
  const activeMembers = (Array.isArray(rawUsers) ? rawUsers : []).filter(
    (u) => !isMemberArchived(u) && !u.isDependent
  );
  const totalActiveMembers = activeMembers.length;

  const reachableMembers = [];
  const unreachableMembers = [];
  activeMembers.forEach((m) => {
    const label = `${m.prenom || ''} ${m.nom || ''}`.trim() || m.email || 'Membre';
    const diagnosticBadge = getMemberPushDiagnosticBadge(m);
    if (Array.isArray(m.fcmTokens) && m.fcmTokens.length > 0) {
      reachableMembers.push({ id: m.id, label, diagnosticBadge });
    } else {
      unreachableMembers.push({
        id: m.id, label, email: m.email || '', diagnosticBadge,
        pushDiagnostics: m.pushDiagnostics || null, pushOptInContract: m.pushOptInContract
      });
    }
  });

  const nowMs = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  let activeMembers7d = 0;
  let activeMembers30d = 0;
  let inactiveOver30d = 0;

  activeMembers.forEach((m) => {
    const lastActiveMs = getTimestampMs(m.lastActive || m.derniereConnexion || m.updatedAt);
    if (lastActiveMs && nowMs - lastActiveMs <= ms7d) {
      activeMembers7d += 1;
      activeMembers30d += 1;
    } else if (lastActiveMs && nowMs - lastActiveMs <= ms30d) {
      activeMembers30d += 1;
    } else {
      inactiveOver30d += 1;
    }
  });

  const sortedAnnouncements = [...(Array.isArray(rawAnnouncements) ? rawAnnouncements : [])]
    .sort((a, b) => getTimestampMs(b.dateCreation) - getTimestampMs(a.dateCreation))
    .slice(0, 5);

  let sumReadRates = 0;
  const recentAnnouncementsStats = sortedAnnouncements.map((ann) => {
    const targetIds = resolveTargetRecipientIds({ announcement: ann, allMembers: activeMembers, authorId: ann.auteurId });
    const targetSet = targetIds.length > 0 ? new Set(targetIds) : null;
    const targetCount = Math.max(1, targetIds.length || totalActiveMembers || 1);
    const lecturesObj = ann.lectures && typeof ann.lectures === 'object' ? ann.lectures : {};
    const validReaders = Object.keys(lecturesObj).filter(
      (uid) => uid !== ann.auteurId && (!targetSet || targetSet.has(uid))
    );
    const readCount = Math.min(validReaders.length, targetCount);
    const rate = Math.min(100, Math.round((readCount / targetCount) * 100));
    sumReadRates += rate;
    return { id: ann.id, titre: ann.titre || 'Annonce', readCount, targetCount, rate };
  });
  const avgMegaphoneReadRate = sortedAnnouncements.length > 0 ? Math.round(sumReadRates / sortedAnnouncements.length) : 0;

  const validDocs = (Array.isArray(rawDocuments) ? rawDocuments : []).filter(
    (d) => d && d.id && !d.isWorkshopVirtualDoc && !d.isVirtualEventMedia
  );
  let varalTotalViews = 0;
  const docsWithViews = validDocs.map((d) => {
    const lecturesCount = d.lectures && typeof d.lectures === 'object' ? Object.keys(d.lectures).length : 0;
    const views = Math.max(Number(d.viewCount) || 0, lecturesCount);
    varalTotalViews += views;
    return {
      id: d.id,
      titre: d.titre || d.nom || d.title || 'Document sans titre',
      categorie: d.categorie || d.type || 'Varal',
      views,
      uniqueReaders: lecturesCount
    };
  });

  const top5VaralDocs = [...docsWithViews].filter((d) => d.views > 0).sort((a, b) => b.views - a.views).slice(0, 5);
  const zeroViewVaralDocs = docsWithViews.filter((d) => d.views === 0);

  return {
    totalActiveMembers,
    pushReachableCount: reachableMembers.length,
    pushReachablePercent: totalActiveMembers > 0 ? Math.round((reachableMembers.length / totalActiveMembers) * 100) : 0,
    unreachableMembers, activeMembers7d, activeMembers30d, inactiveOver30d,
    avgMegaphoneReadRate, recentAnnouncementsCount: sortedAnnouncements.length,
    recentAnnouncementsStats, varalTotalDocs: validDocs.length, varalTotalViews,
    top5VaralDocs, zeroViewVaralDocs
  };
}

/**
 * Synchronise l'objet résumé `usageStats` sur `associations/{groupId}` pour Orquestrador (1 écriture max / 24h).
 */
export function syncUsageStatsToOrquestrador(groupId, stats, canWrite = false) {
  if (!groupId || !stats || !canWrite) return;
  const throttleKey = `orquestrador_usage_sync_${String(groupId).trim().toLowerCase()}`;
  const now = Date.now();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastSync = Number(window.localStorage.getItem(throttleKey) || 0);
      if (lastSync && now - lastSync < 24 * 60 * 60 * 1000) return;
      window.localStorage.setItem(throttleKey, String(now));
    }
  } catch { /* Ignorer */ }

  updateDoc(doc(db, 'associations', groupId), {
    usageStats: {
      pushReachableCount: stats.pushReachableCount,
      activeMembers7d: stats.activeMembers7d,
      activeMembers30d: stats.activeMembers30d,
      totalActiveMembers: stats.totalActiveMembers,
      avgMegaphoneReadRate: stats.avgMegaphoneReadRate,
      varalTotalViews: stats.varalTotalViews,
      varalZeroViewDocsCount: stats.zeroViewVaralDocs.length,
      updatedAt: new Date().toISOString()
    }
  }).catch(() => {});
}
