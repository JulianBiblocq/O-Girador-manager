import { useState, useMemo, useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useEventCommissions } from './useEventCommissions';
import {
  consolidateVolunteerShifts,
  computeVolunteerCoverage,
  isVolunteerShiftFull,
  isMemberArtisticPresent,
  normalizeShiftInscrit
} from '../utils/volunteerShiftUtils';

/**
 * Hook de gestion consolidée et transactionnelle des créneaux bénévoles.
 * Source unique de vérité des inscriptions : `events/{eventId}.covoiturage.benevolatInscrits`
 * (compatible à 100 % avec `firestore.rules` pour tout adhérent actif sans droit admin).
 */
export function useVolunteerShifts({ event, user, profileData, allUsers = [], isAuthorized = false }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingShiftId, setLoadingShiftId] = useState(null);
  const shouldListen = Boolean(event?.id && event?.hasCommissions);
  const { commissions } = useEventCommissions(shouldListen ? event.id : null, event);

  const usersMap = useMemo(() => {
    const map = {};
    (allUsers || []).forEach((u) => { if (u?.id) map[u.id] = u; if (u?.uid) map[u.uid] = u; });
    if (user?.uid && profileData) map[user.uid] = { ...map[user.uid], ...profileData, id: user.uid, uid: user.uid };
    return map;
  }, [allUsers, user, profileData]);

  const consolidatedShifts = useMemo(() => consolidateVolunteerShifts(event, commissions, usersMap), [event, commissions, usersMap]);
  const coverage = useMemo(() => computeVolunteerCoverage(consolidatedShifts), [consolidatedShifts]);
  const isArtisticPresent = useMemo(() => isMemberArtisticPresent(event, user?.uid), [event, user?.uid]);

  const canManageShift = useCallback((shift) => {
    if (isAuthorized) return true;
    if (!user?.uid || !shift?.commissionId) return false;
    const comm = commissions.find((c) => c.id === shift.commissionId);
    return Boolean(comm?.referentsIds?.includes(user.uid));
  }, [isAuthorized, user?.uid, commissions]);

  const filteredShifts = useMemo(() => {
    if (activeFilter === 'all') return consolidatedShifts;
    if (activeFilter === 'general') return consolidatedShifts.filter((s) => !s.commissionId);
    return consolidatedShifts.filter((s) => s.commissionId === activeFilter);
  }, [consolidatedShifts, activeFilter]);

  const mutateShiftInscrits = useCallback(async (shift, updater) => {
    if (!event?.id || !shift?.id) return false;
    setLoadingShiftId(shift.id);
    try {
      const eventRef = doc(db, 'events', event.id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(eventRef);
        if (!snap.exists()) throw new Error('EVENT_NOT_FOUND');
        const rawCovoit = snap.data().covoiturage || { voitures: [], recherchePlace: [] };
        const currentMap = rawCovoit.benevolatInscrits || {};
        const baseList = Array.isArray(currentMap[shift.id])
          ? currentMap[shift.id].map((it, i) => normalizeShiftInscrit(it, i, usersMap)).filter(Boolean)
          : (shift.inscrits || []);
        const nextList = updater(baseList);
        tx.update(eventRef, {
          covoiturage: {
            ...rawCovoit,
            voitures: Array.isArray(rawCovoit.voitures) ? rawCovoit.voitures : [],
            recherchePlace: Array.isArray(rawCovoit.recherchePlace) ? rawCovoit.recherchePlace : [],
            benevolatInscrits: { ...currentMap, [shift.id]: nextList }
          }
        });
      });
      return true;
    } catch (err) {
      if (err?.message !== 'SHIFT_FULL') console.error('Erreur mise à jour créneau bénévole :', err);
      return false;
    } finally {
      setLoadingShiftId(null);
    }
  }, [event?.id, usersMap]);

  const toggleSelfShift = useCallback(async (shift) => {
    if (!user?.uid) return false;
    const me = usersMap[user.uid] || profileData || {};
    const prenom = String(me.prenom || user.displayName || '').trim(), nom = String(me.nom || '').trim();
    const manager = canManageShift(shift);
    return mutateShiftInscrits(shift, (list) => {
      if (list.some((i) => i.type === 'member' && i.uid === user.uid)) {
        return list.filter((i) => !(i.type === 'member' && i.uid === user.uid));
      }
      if (!manager && isVolunteerShiftFull({ ...shift, inscrits: list })) throw new Error('SHIFT_FULL');
      return [...list, { id: user.uid, type: 'member', uid: user.uid, prenom, nom }];
    });
  }, [user, usersMap, profileData, canManageShift, mutateShiftInscrits]);

  const addGuestToShift = useCallback(async (shift, { prenom, nom, telephone }) => {
    if (!user?.uid) return false;
    const me = usersMap[user.uid] || profileData || {};
    const parrainNom = String(me.prenom || user.displayName || 'Membre').trim();
    const manager = canManageShift(shift);
    return mutateShiftInscrits(shift, (list) => {
      if (!manager && isVolunteerShiftFull({ ...shift, inscrits: list })) throw new Error('SHIFT_FULL');
      return [...list, {
        id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'guest',
        prenom: prenom.trim(), nom: nom.trim(), telephone: telephone.trim(), parrainUid: user.uid, parrainNom
      }];
    });
  }, [user, usersMap, profileData, canManageShift, mutateShiftInscrits]);

  const addMemberByManager = useCallback(async (shift, targetUid) => {
    if (!targetUid || !canManageShift(shift)) return false;
    const u = usersMap[targetUid] || {};
    return mutateShiftInscrits(shift, (list) => (
      list.some((i) => i.type === 'member' && i.uid === targetUid)
        ? list
        : [...list, { id: targetUid, type: 'member', uid: targetUid, prenom: String(u.prenom || '').trim(), nom: String(u.nom || u.displayName || '').trim() }]
    ));
  }, [canManageShift, usersMap, mutateShiftInscrits]);

  const removeInscrit = useCallback(async (shift, inscrit) => {
    if (!inscrit) return false;
    const allowed = canManageShift(shift) || (inscrit.type === 'member' && inscrit.uid === user?.uid) || (inscrit.type === 'guest' && inscrit.parrainUid === user?.uid);
    return allowed ? mutateShiftInscrits(shift, (list) => list.filter((i) => i.id !== inscrit.id)) : false;
  }, [canManageShift, user?.uid, mutateShiftInscrits]);

  return {
    commissions, consolidatedShifts, filteredShifts, coverage, isArtisticPresent,
    activeFilter, setActiveFilter, loadingShiftId, canManageShift,
    toggleSelfShift, addGuestToShift, addMemberByManager, removeInscrit
  };
}
