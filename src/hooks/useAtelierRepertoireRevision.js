/**
 * Hook personnalisé pour le mode « Réviser un Morceau du Répertoire » dans l'Atelier (< 140 lignes).
 * Charge les morceaux actifs du Répertoire et met en avant ceux programmés
 * lors de la prochaine répétition de l'Agenda.
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId } from '../utils/tenantUtils';
import useMestreSignals from './useMestreSignals';

export function useAtelierRepertoireRevision({ groupId, externalRepertoire = [] } = {}) {
  const [internalRepertoire, setInternalRepertoire] = useState([]);
  const [scheduledKeys, setScheduledKeys] = useState(new Set());
  const [nextRehearsalTitle, setNextRehearsalTitle] = useState('');
  const { signals: mestreSignals } = useMestreSignals(groupId);

  useEffect(() => {
    if (Array.isArray(externalRepertoire) && externalRepertoire.length > 0) return;
    const rawGroup = groupId || 'Samambaia';
    const targetGroup = canonicalizeGroupId(rawGroup) || rawGroup;
    if (!targetGroup) return;

    const colRef = collection(db, 'associations', targetGroup, 'repertoire');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setInternalRepertoire(list);
    }, () => {});

    return () => unsub();
  }, [groupId, externalRepertoire]);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;

    const fetchNextRehearsal = async () => {
      try {
        const q = query(collection(db, 'events'), where('groupId', '==', groupId));
        const snap = await getDocs(q);
        const nowIso = new Date().toISOString().slice(0, 10);
        const upcoming = [];

        snap.forEach((d) => {
          const ev = { id: d.id, ...d.data() };
          const dateStr = String(ev.date || ev.startDate || '');
          if (dateStr >= nowIso && !ev.isCancelled && !ev.isArchived) {
            upcoming.push(ev);
          }
        });

        upcoming.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        const rehearsal = upcoming.find((ev) => {
          const tStr = String(ev.type || '').toLowerCase();
          const titleStr = String(ev.titre || ev.title || '').toLowerCase();
          const hasSetlist = Array.isArray(ev.setlist) && ev.setlist.length > 0;
          return hasSetlist && (tStr.includes('repet') || tStr.includes('rehearsal') || titleStr.includes('répét') || titleStr.includes('ensaio'));
        }) || upcoming.find((ev) => Array.isArray(ev.setlist) && ev.setlist.length > 0);

        if (isMounted && rehearsal) {
          const keys = new Set();
          (rehearsal.setlist || []).forEach((item) => {
            if (item.id) keys.add(String(item.id));
            if (item.pieceId) keys.add(String(item.pieceId));
            if (item.repertoireId) keys.add(String(item.repertoireId));
            if (item.sequenceurId) keys.add(String(item.sequenceurId));
            if (item.titre) keys.add(String(item.titre).trim().toLowerCase());
          });
          setScheduledKeys(keys);
          setNextRehearsalTitle(rehearsal.titre || rehearsal.title || '');
        }
      } catch {
        // Ignorer silencieusement hors connexion
      }
    };

    fetchNextRehearsal();
    return () => { isMounted = false; };
  }, [groupId]);

  const pieces = useMemo(() => {
    const source = Array.isArray(externalRepertoire) && externalRepertoire.length > 0
      ? externalRepertoire
      : internalRepertoire;

    return source
      .filter((p) => p && !p.isArchived && !p.archived && p.statutSaison !== 'archive')
      .map((p) => {
        const normTitle = String(p.titre || p.title || '').trim().toLowerCase();
        const isScheduled =
          scheduledKeys.has(String(p.id)) ||
          (p.sequenceurId && scheduledKeys.has(String(p.sequenceurId))) ||
          (normTitle && scheduledKeys.has(normTitle));
        return { ...p, isScheduledNextRehearsal: Boolean(isScheduled) };
      })
      .sort((a, b) => {
        if (a.isScheduledNextRehearsal !== b.isScheduledNextRehearsal) {
          return a.isScheduledNextRehearsal ? -1 : 1;
        }
        return String(a.titre || '').localeCompare(String(b.titre || ''));
      });
  }, [externalRepertoire, internalRepertoire, scheduledKeys]);

  return {
    repertoirePieces: pieces,
    scheduledPieces: pieces.filter((p) => p.isScheduledNextRehearsal),
    nextRehearsalTitle,
    mestreSignals: mestreSignals || []
  };
}

