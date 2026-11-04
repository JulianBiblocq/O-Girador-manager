import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchAssociationMembersOnce, getAssociationGroupVariants } from './useAssociationMembers';
import {
  getSeasonDateRange,
  getCurrentSeason,
  getPreviousSeason,
  getFiscalYearDateRange,
  DEFAULT_SEASON_START_MONTH,
  DEFAULT_FISCAL_START_MONTH
} from '../utils/seasonUtils';
import { computeAgReportIndicators } from '../utils/agReportsExportUtils';

/** Extrait la date YYYY-MM-DD d'une valeur Firestore Timestamp, Date ou chaîne ISO. */
function parseDateStr(dateVal) {
  if (!dateVal) return null;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString().split('T')[0];
  if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
  if (typeof dateVal === 'string') return dateVal.substring(0, 10);
  return null;
}

/**
 * Hook de chargement ponctuel (getDocs) et de calcul des indicateurs consolidés d'AG.
 */
export function useAgReportsData(groupId) {
  const now = useMemo(() => new Date(), []);

  const [rawUsers, setRawUsers] = useState([]);
  const [rawEvents, setRawEvents] = useState([]);
  const [rawCouture, setRawCouture] = useState([]);
  const [rawParts, setRawParts] = useState([]);
  const [rawInventory, setRawInventory] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [rawGigs, setRawGigs] = useState([]);
  const [rawAnnouncements, setRawAnnouncements] = useState([]);
  const [rawDocuments, setRawDocuments] = useState([]);
  const [assocInfo, setAssocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saisonDebutMois = assocInfo?.saisonDebutMois !== undefined ? Number(assocInfo.saisonDebutMois) : DEFAULT_SEASON_START_MONTH;
  const exerciceDebutMois = assocInfo?.exerciceDebutMois !== undefined ? Number(assocInfo.exerciceDebutMois) : DEFAULT_FISCAL_START_MONTH;

  const currentSeason = useMemo(() => getCurrentSeason(saisonDebutMois), [saisonDebutMois]);
  const previousSeason = useMemo(() => getPreviousSeason(currentSeason), [currentSeason]);
  const currentSeasonRange = useMemo(() => getSeasonDateRange(currentSeason, saisonDebutMois), [currentSeason, saisonDebutMois]);
  const previousSeasonRange = useMemo(() => getSeasonDateRange(previousSeason, saisonDebutMois), [previousSeason, saisonDebutMois]);
  const currentFiscalRange = useMemo(() => getFiscalYearDateRange(now, exerciceDebutMois, 0), [now, exerciceDebutMois]);
  const previousFiscalRange = useMemo(() => getFiscalYearDateRange(now, exerciceDebutMois, -1), [now, exerciceDebutMois]);

  const [periodPreset, setPeriodPreset] = useState('current_season');
  const [startDate, setStartDate] = useState(currentSeasonRange.startDate);
  const [endDate, setEndDate] = useState(currentSeasonRange.endDate);

  useEffect(() => {
    if (periodPreset === 'current_season') { setStartDate(currentSeasonRange.startDate); setEndDate(currentSeasonRange.endDate); }
    else if (periodPreset === 'previous_season') { setStartDate(previousSeasonRange.startDate); setEndDate(previousSeasonRange.endDate); }
    else if (periodPreset === 'current_fiscal') { setStartDate(currentFiscalRange.startDate); setEndDate(currentFiscalRange.endDate); }
    else if (periodPreset === 'previous_fiscal') { setStartDate(previousFiscalRange.startDate); setEndDate(previousFiscalRange.endDate); }
  }, [currentSeasonRange, previousSeasonRange, currentFiscalRange, previousFiscalRange, periodPreset]);

  const handleSelectPreset = (preset) => {
    setPeriodPreset(preset);
    if (preset === 'current_season') { setStartDate(currentSeasonRange.startDate); setEndDate(currentSeasonRange.endDate); }
    else if (preset === 'previous_season') { setStartDate(previousSeasonRange.startDate); setEndDate(previousSeasonRange.endDate); }
    else if (preset === 'current_fiscal') { setStartDate(currentFiscalRange.startDate); setEndDate(currentFiscalRange.endDate); }
    else if (preset === 'previous_fiscal') { setStartDate(previousFiscalRange.startDate); setEndDate(previousFiscalRange.endDate); }
  };

  const periodLabel = useMemo(() => {
    if (periodPreset === 'current_season') return `Saison d'activité ${currentSeason}`;
    if (periodPreset === 'previous_season') return `Saison d'activité N-1 (${previousSeason})`;
    if (periodPreset === 'current_fiscal') return `Exercice comptable ${currentFiscalRange.fiscalYearLabel}`;
    if (periodPreset === 'previous_fiscal') return `Exercice comptable N-1 (${previousFiscalRange.fiscalYearLabel})`;
    return `Période personnalisée (${startDate} au ${endDate})`;
  }, [periodPreset, currentSeason, previousSeason, currentFiscalRange, previousFiscalRange, startDate, endDate]);

  const loadReportsData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const groupVariants = getAssociationGroupVariants(groupId);
      const [usersList, eventsSnap, coutureSnap, partsSnap, inventorySnap, txSnap, assocSnap, gigsSnap, announcementsSnap, documentsSnap] = await Promise.all([
        fetchAssociationMembersOnce(groupId),
        getDocs(query(collection(db, 'events'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'coutureProjects'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'inventory_parts'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'inventory'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'transactions'), where('groupId', '==', groupId))),
        getDoc(doc(db, 'associations', groupId)),
        getDocs(query(collection(db, 'gigs_pipeline'), where('groupId', '==', groupId))).catch(() => ({ forEach: () => {} })),
        getDocs(query(collection(db, 'announcements'), where('groupId', 'in', groupVariants))).catch(() => ({ forEach: () => {} })),
        getDocs(query(collection(db, 'documents'), where('groupId', 'in', groupVariants))).catch(() => ({ forEach: () => {} }))
      ]);
      const toList = (snap) => { const arr = []; if (snap?.forEach) snap.forEach((d) => arr.push({ id: d.id, ...d.data() })); return arr; };
      setRawUsers(usersList);
      setRawEvents(toList(eventsSnap));
      setRawCouture(toList(coutureSnap));
      setRawParts(toList(partsSnap));
      setRawInventory(toList(inventorySnap));
      setRawTransactions(toList(txSnap));
      setRawGigs(toList(gigsSnap));
      setRawAnnouncements(toList(announcementsSnap));
      setRawDocuments(toList(documentsSnap));
      setAssocInfo(assocSnap.exists() ? assocSnap.data() : null);
    } catch (err) {
      console.error('SecretariatReportsView - Erreur de chargement des données :', err);
      setError('Impossible de charger les données pour le rapport.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadReportsData(); }, [loadReportsData]);

  const isWithinRange = useCallback((dateVal) => {
    const s = parseDateStr(dateVal);
    if (!s) return false;
    if (startDate && s < startDate) return false;
    if (endDate && s > endDate) return false;
    return true;
  }, [startDate, endDate]);

  const indicators = useMemo(
    () => computeAgReportIndicators({ rawUsers, rawEvents, rawCouture, rawParts, rawInventory, rawTransactions, rawGigs, assocInfo, isWithinRange }),
    [rawUsers, rawEvents, rawCouture, rawParts, rawInventory, rawTransactions, rawGigs, assocInfo, isWithinRange]
  );

  return {
    rawUsers, rawEvents, rawAnnouncements, rawDocuments, assocInfo, loading, error,
    periodPreset, startDate, endDate, setStartDate, setEndDate, setPeriodPreset, handleSelectPreset, periodLabel,
    currentSeason, previousSeason, currentSeasonRange, previousSeasonRange, currentFiscalRange, previousFiscalRange,
    loadReportsData, isWithinRange, indicators
  };
}

