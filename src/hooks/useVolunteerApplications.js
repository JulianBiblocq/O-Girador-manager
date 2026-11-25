import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  normalizeVolunteerApplication,
  canAccessVolunteerApplications,
  resolveManageableShiftIds,
  filterApplicationsForViewer
} from '../utils/volunteerApplicationUtils';
import {
  acceptVolunteerApplicationTx,
  rejectVolunteerApplicationTx,
  createManualExternalVolunteerTx,
  removeExternalFromShiftTx
} from '../services/volunteerApplicationService';

/**
 * Hook temps réel et transactionnel du sas `volunteer_applications` d'un événement.
 * N'active `onSnapshot` que pour les gestionnaires globaux ou référents de commission,
 * sans `orderBy` serveur (tri mémoire `createdAt`) et avec garde multi-tenant strict.
 */
export function useVolunteerApplications({
  event,
  commissions = [],
  consolidatedShifts = [],
  user = null,
  profileData = null,
  isAuthorized = false
}) {
  const [rawApplications, setRawApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const eventId = String(event?.id || '').trim();
  const groupId = String(event?.groupId || '').trim();

  const canViewApplications = useMemo(
    () => canAccessVolunteerApplications({ isGlobalManager: isAuthorized, commissions, userUid: user?.uid }),
    [isAuthorized, commissions, user?.uid]
  );

  useEffect(() => {
    if (!groupId || !eventId) { setRawApplications([]); setLoading(false); return; }
    if (!canViewApplications) { setRawApplications([]); setLoading(false); return; }

    setLoading(true);
    const q = query(
      collection(db, 'volunteer_applications'),
      where('eventId', '==', eventId),
      where('groupId', '==', groupId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...normalizeVolunteerApplication(d.data(), { groupId, eventId }) }));
      setRawApplications(items);
      setLoading(false);
    }, (err) => {
      console.error('Erreur écoute volunteer_applications :', err);
      setLoading(false);
    });
    return () => unsub();
  }, [groupId, eventId, canViewApplications]);

  const viewerScope = useMemo(
    () => ({ isGlobalManager: isAuthorized, commissions, allShifts: consolidatedShifts, userUid: user?.uid }),
    [isAuthorized, commissions, consolidatedShifts, user?.uid]
  );

  const visibleApplications = useMemo(() => filterApplicationsForViewer(rawApplications, viewerScope), [rawApplications, viewerScope]);
  const pendingApplications = useMemo(() => visibleApplications.filter((a) => a.status === 'pending'), [visibleApplications]);
  const acceptedApplications = useMemo(() => visibleApplications.filter((a) => a.status === 'accepted'), [visibleApplications]);
  const applicationsById = useMemo(() => Object.fromEntries(visibleApplications.map((a) => [a.id, a])), [visibleApplications]);

  const manageableShifts = useMemo(() => {
    const ids = resolveManageableShiftIds(viewerScope);
    return consolidatedShifts.filter((s) => ids.has(s.id));
  }, [viewerScope, consolidatedShifts]);

  const validatorMeta = useMemo(() => ({
    validatedByUid: String(user?.uid || '').trim(),
    validatedByName: String(profileData?.prenom ? `${profileData.prenom} ${profileData.nom || ''}` : (user?.displayName || 'Gestionnaire')).trim()
  }), [user, profileData]);

  const runSafe = useCallback(async (key, fn) => {
    setActionLoadingId(key);
    try { return await fn(); }
    catch (err) { console.error('Erreur action candidature bénévole :', err); return false; }
    finally { setActionLoadingId(null); }
  }, []);

  const acceptApplication = useCallback(
    (app, shiftIds) => runSafe(app?.id || 'accept', () => acceptVolunteerApplicationTx({ groupId, eventId, app, shiftIds, validatorMeta })),
    [groupId, eventId, validatorMeta, runSafe]
  );
  const rejectApplication = useCallback(
    (app) => runSafe(app?.id || 'reject', () => rejectVolunteerApplicationTx({ groupId, eventId, app, validatorMeta })),
    [groupId, eventId, validatorMeta, runSafe]
  );
  const createManualExternalVolunteer = useCallback(
    (formPayload, shiftIds) => runSafe('manual', () => createManualExternalVolunteerTx({ groupId, eventId, formPayload, shiftIds, validatorMeta })),
    [groupId, eventId, validatorMeta, runSafe]
  );
  const removeExternalFromShift = useCallback(
    (shiftId, inscrit) => runSafe(inscrit?.applicationId || shiftId, () => removeExternalFromShiftTx({ groupId, eventId, shiftId, inscrit })),
    [groupId, eventId, runSafe]
  );

  return {
    canViewApplications, loading, actionLoadingId, visibleApplications, pendingApplications,
    acceptedApplications, applicationsById, manageableShifts,
    acceptApplication, rejectApplication, createManualExternalVolunteer, removeExternalFromShift
  };
}
