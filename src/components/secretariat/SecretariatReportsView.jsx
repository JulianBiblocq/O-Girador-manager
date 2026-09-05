import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { XiloScroll } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import {
  computeTerritorialStats,
  computeVolunteeringAndActivity,
  computeAudienceAndDiffusion,
  normalizePupitreName
} from '../../utils/secretariatMetrics';
import ReportTerritoryCard from './reports/ReportTerritoryCard';
import ReportVolunteerCard from './reports/ReportVolunteerCard';
import ReportAudienceCard from './reports/ReportAudienceCard';
import AgSlideshowModal from './reports/AgSlideshowModal';

/**
 * Composant : SecretariatReportsView
 * 
 * Vue de synthèse consolidée et bilan de saison pour l'Assemblée Générale et les subventions.
 * Agrège à la demande (lecture ponctuelle getDocs) les données des différents pôles :
 * - Pôle Secrétariat / Adhérents (effectifs, cotisations, répartition par pupitre, ancrage communal)
 * - Pôle Activités / Événements (sorties, répétitions, volume de présences, bénévolat Cerfa)
 * - Pôles Ateliers (projets couture, pièces de lutherie, instruments)
 * - Pôle Diffusion / Vitrine (trafic vitrine, demandes de prestations et concrétisation)
 * - Pôle Trésorerie (recettes, dépenses, résultat net de saison)
 * 
 * @param {string} groupId Identifiant du groupe/association
 * @param {Function} [onBack] Callback optionnel de retour
 */
export default function SecretariatReportsView({ groupId, onBack }) {
  const { t } = useTranslation();

  // =========================================================================
  // 1. CALCUL ET GESTION DE LA PÉRIODE D'ANALYSE (SAISON ASSOCIATIVE)
  // =========================================================================
  const now = new Date();
  const currentYear = now.getFullYear();
  // La saison associative démarre au 1er septembre (mois 8 en JS)
  const currentSeasonStartYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;

  const defaultStartDate = `${currentSeasonStartYear}-09-01`;
  const defaultEndDate = `${currentSeasonStartYear + 1}-08-31`;

  const [periodPreset, setPeriodPreset] = useState('current_season');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // État d'ouverture du Diaporama / Livret d'AG
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // État de chargement et de synchronisation des données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Données brutes agrégées depuis Firestore
  const [rawUsers, setRawUsers] = useState([]);
  const [rawEvents, setRawEvents] = useState([]);
  const [rawCouture, setRawCouture] = useState([]);
  const [rawParts, setRawParts] = useState([]);
  const [rawInventory, setRawInventory] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [rawGigs, setRawGigs] = useState([]);
  const [assocInfo, setAssocInfo] = useState(null);

  // Sélecteur de préréglages de dates
  const handleSelectPreset = (preset) => {
    setPeriodPreset(preset);
    if (preset === 'current_season') {
      setStartDate(`${currentSeasonStartYear}-09-01`);
      setEndDate(`${currentSeasonStartYear + 1}-08-31`);
    } else if (preset === 'previous_season') {
      setStartDate(`${currentSeasonStartYear - 1}-09-01`);
      setEndDate(`${currentSeasonStartYear}-08-31`);
    } else if (preset === 'calendar_year') {
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
    }
  };

  // =========================================================================
  // 2. CHARGEMENT OPTIMISÉ À LA DEMANDE (getDocs ponctuel, 0 onSnapshot)
  // =========================================================================
  const loadReportsData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    try {
      // Exécution en parallèle de toutes les requêtes ponctuelles
      const [
        usersSnap,
        eventsSnap,
        coutureSnap,
        partsSnap,
        inventorySnap,
        txSnap,
        assocSnap,
        gigsSnap
      ] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'events'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'coutureProjects'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'inventory_parts'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'inventory'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'transactions'), where('groupId', '==', groupId))),
        getDoc(doc(db, 'associations', groupId)),
        getDocs(query(collection(db, 'gigs_pipeline'), where('groupId', '==', groupId))).catch(() => ({ forEach: () => {} }))
      ]);

      const usersList = [];
      usersSnap.forEach(d => usersList.push({ id: d.id, ...d.data() }));

      const eventsList = [];
      eventsSnap.forEach(d => eventsList.push({ id: d.id, ...d.data() }));

      const coutureList = [];
      coutureSnap.forEach(d => coutureList.push({ id: d.id, ...d.data() }));

      const partsList = [];
      partsSnap.forEach(d => partsList.push({ id: d.id, ...d.data() }));

      const inventoryList = [];
      inventorySnap.forEach(d => inventoryList.push({ id: d.id, ...d.data() }));

      const txList = [];
      txSnap.forEach(d => txList.push({ id: d.id, ...d.data() }));

      const gigsList = [];
      if (gigsSnap && typeof gigsSnap.forEach === 'function') {
        gigsSnap.forEach(d => gigsList.push({ id: d.id, ...d.data() }));
      }

      setRawUsers(usersList);
      setRawEvents(eventsList);
      setRawCouture(coutureList);
      setRawParts(partsList);
      setRawInventory(inventoryList);
      setRawTransactions(txList);
      setRawGigs(gigsList);
      setAssocInfo(assocSnap.exists() ? assocSnap.data() : null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("SecretariatReportsView - Erreur de chargement des données :", err);
      setError("Impossible de charger les données pour le rapport.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // =========================================================================
  // 3. UTILITAIRES ET FILTRAGE EN MÉMOIRE (Tolérance Timestamps & ISO)
  // =========================================================================
  const parseDateStr = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString().split('T')[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    if (typeof dateVal === 'string') {
      return dateVal.substring(0, 10);
    }
    return null;
  };

  const isWithinRange = useCallback((dateVal) => {
    const s = parseDateStr(dateVal);
    if (!s) return false;
    if (startDate && s < startDate) return false;
    if (endDate && s > endDate) return false;
    return true;
  }, [startDate, endDate]);

  // =========================================================================
  // 4. CALCUL DES INDICATEURS CONSOLIDÉS PAR BLOC THÉMATIQUE
  // =========================================================================
  const indicators = useMemo(() => {
    // --- BLOC 1 : VIE ASSOCIATIVE & ADHÉSIONS ---
    const totalMembers = rawUsers.length;
    const activeMembers = rawUsers.filter(u => !u.statutActuel || u.statutActuel === 'active').length;
    
    let cotisationsUpToDate = 0;
    let cotisationsPending = 0;

    const pupitresCount = {};

    rawUsers.forEach(u => {
      const isPaid = u.paymentStatus === 'paid' || u.cotisationPaid === true;
      if (isPaid) cotisationsUpToDate++;
      else cotisationsPending++;

      // Pupitre ou section principale (priorité à instrumentPrincipal puis instrument avec normalisation)
      const rawPupitre = u.instrumentPrincipal || u.instrument || u.pupitre || u.section || 'Non défini';
      const cleanPupitre = normalizePupitreName(rawPupitre);
      pupitresCount[cleanPupitre] = (pupitresCount[cleanPupitre] || 0) + 1;
    });

    const sortedPupitres = Object.entries(pupitresCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percent: totalMembers ? Math.round((count / totalMembers) * 100) : 0 }));

    // --- BLOC 2 : RAYONNEMENT SCÉNIQUE & PRATIQUE COLLECTIVE ---
    const filteredEvents = rawEvents.filter(e => isWithinRange(e.date));

    const eventsByType = {
      prestation: 0,
      repetition: 0,
      stage: 0,
      atelier: 0,
      reunion: 0,
      autre: 0
    };

    let totalPresencesAll = 0;
    let totalPresencesPrestations = 0;
    let prestationCountWithPresence = 0;

    filteredEvents.forEach(e => {
      const type = e.type || 'autre';
      if (eventsByType[type] !== undefined) {
        eventsByType[type]++;
      } else {
        eventsByType.autre++;
      }

      const presents = (e.inscriptions || []).filter(i => i.status === 'present').length + ((e.invitesExternes || []).length);
      totalPresencesAll += presents;

      if (type === 'prestation') {
        totalPresencesPrestations += presents;
        prestationCountWithPresence++;
      }
    });

    const totalEvents = filteredEvents.length;
    const avgPresencePrestation = prestationCountWithPresence > 0 
      ? (totalPresencesPrestations / prestationCountWithPresence).toFixed(1)
      : '0';

    // --- BLOC 3 : CHANTIERS, ATELIERS & PATRIMOINE ---
    // Projets couture (créés ou clôturés sur la période ou état général)
    const totalCouture = rawCouture.length;
    const coutureFinished = rawCouture.filter(p => p.status === 'termine' || p.status === 'completed' || p.status === 'clos').length;
    const coutureInProgress = totalCouture - coutureFinished;

    // Pièces et matériel de lutherie
    const totalParts = rawParts.length;
    const totalInstruments = rawInventory.length;
    const instrumentsInService = rawInventory.filter(i => !i.status || i.status === 'En service' || i.status === 'En stock').length;
    const instrumentsMaintenance = rawInventory.filter(i => i.status === 'Maintenance' || i.status === 'HS' || i.status === 'En réparation').length;

    // --- BLOC 4 : BILAN FINANCIER CONDENSÉ ---
    const filteredTx = rawTransactions.filter(tx => isWithinRange(tx.date));

    let recettesGlobales = 0;
    let depensesGlobales = 0;

    // 1. Transactions enregistrées au journal
    filteredTx.forEach(tx => {
      const amt = Number(tx.montant) || 0;
      if (tx.type === 'recette') recettesGlobales += amt;
      else if (tx.type === 'depense') depensesGlobales += amt;
    });

    // 2. Flux directs des événements de la période
    filteredEvents.forEach(e => {
      const rec = Number(e.montantRecette) || 0;
      const dep = Number(e.montantDepense) || 0;
      recettesGlobales += rec;
      depensesGlobales += dep;
    });

    const soldeNet = recettesGlobales - depensesGlobales;

    // --- NOUVEAUX CALCULS MODULAIRES SECRETARIATMETRICS ---
    const assocAddress = assocInfo?.adresseSiegeSocial || assocInfo?.adresse || '';
    const territorialStats = computeTerritorialStats(rawUsers, assocAddress);
    const volunteeringStats = computeVolunteeringAndActivity(filteredEvents, activeMembers, assocInfo || {});
    const audienceStats = computeAudienceAndDiffusion(rawGigs, assocInfo?.vitrineViews || 0, isWithinRange);

    return {
      totalMembers,
      activeMembers,
      cotisationsUpToDate,
      cotisationsPending,
      sortedPupitres,
      totalEvents,
      eventsByType,
      totalPresencesAll,
      avgPresencePrestation,
      totalCouture,
      coutureFinished,
      coutureInProgress,
      totalParts,
      totalInstruments,
      instrumentsInService,
      instrumentsMaintenance,
      recettesGlobales,
      depensesGlobales,
      soldeNet,
      territorialStats,
      volunteeringStats,
      audienceStats
    };
  }, [rawUsers, rawEvents, rawCouture, rawParts, rawInventory, rawTransactions, rawGigs, assocInfo, isWithinRange]);

  // =========================================================================
  // 5. EXPORT CSV COMPLET (UTF-8 BOM + Séparateur point-virgule Excel)
  // =========================================================================
  const handleExportCSV = () => {
    const lines = [];

    // En-tête du document
    lines.push(`RAPPORT CONSOLIDÉ - BILAN D'ASSEMBLÉE GÉNÉRALE`);
    lines.push(`Association;${assocInfo?.nom || 'O Girador'}`);
    lines.push(`Période de référence;Du ${startDate} au ${endDate}`);
    lines.push(`Date d'édition;${new Date().toLocaleDateString('fr-FR')}`);
    lines.push('');

    // Section 1 : Vie associative & Territoire
    lines.push(`1. VIE ASSOCIATIVE, EFFECTIFS & ANCRAGE TERRITORIAL (CERFA)`);
    lines.push(`Indicateur;Valeur`);
    lines.push(`Total membres enregistrés;${indicators.totalMembers}`);
    lines.push(`Membres actifs;${indicators.activeMembers}`);
    lines.push(`Cotisations à jour;${indicators.cotisationsUpToDate}`);
    lines.push(`Cotisations en attente ou partielles;${indicators.cotisationsPending}`);
    lines.push(`Commune de rattachement du siège;${indicators.territorialStats.siegeVille || 'Non renseignée'}${indicators.territorialStats.siegeCP ? ` (${indicators.territorialStats.siegeCP})` : ''}`);
    lines.push(`Adhérents de la commune du siège;${indicators.territorialStats.communeMembersCount} (${indicators.territorialStats.communeMembersPercent}%)`);
    lines.push(`Adhérents des communes extérieures;${indicators.territorialStats.externalMembersCount} (${indicators.territorialStats.externalMembersPercent}%)`);
    lines.push(`Profils audités avec adresse;${indicators.territorialStats.totalAudited} / ${indicators.territorialStats.totalActiveMembers}`);
    lines.push('');
    lines.push(`RÉPARTITION PAR PUPITRE`);
    lines.push(`Pupitre / Section;Effectif;Pourcentage`);
    indicators.sortedPupitres.forEach(p => {
      lines.push(`${p.name};${p.count};${p.percent}%`);
    });
    lines.push('');

    // Section 2 : Activités, Rayonnement & Bénévolat Cerfa
    lines.push(`2. RAYONNEMENT SCÉNIQUE, PRATIQUE COLLECTIVE & BÉNÉVOLAT (CERFA 12156)`);
    lines.push(`Indicateur;Valeur`);
    lines.push(`Prestations publiques / Concerts;${indicators.eventsByType.prestation}`);
    lines.push(`Répétitions régulières;${indicators.eventsByType.repetition}`);
    lines.push(`Stages & Ateliers;${indicators.eventsByType.stage + indicators.eventsByType.atelier}`);
    lines.push(`Réunions & Assemblées;${indicators.eventsByType.reunion}`);
    lines.push(`TOTAL ÉVÉNEMENTS RÉALISÉS;${indicators.totalEvents}`);
    lines.push(`Mobilisations cumulées (Présences réelles);${indicators.totalPresencesAll}`);
    lines.push(`Moyenne de musiciens / sortie;${indicators.avgPresencePrestation}`);
    lines.push(`Heures de jeu en public (scène);${indicators.volunteeringStats.totalPublicPlayingHours} h`);
    lines.push(`Heures-participants activité collective;${indicators.volunteeringStats.totalCollectiveVolunteerHours} h`);
    lines.push(`Forfaits annuels statutaires bureau & atelier;${indicators.volunteeringStats.forfaitHeuresAdmin + indicators.volunteeringStats.forfaitHeuresArtisanat} h`);
    lines.push(`TOTAL HEURES DE BÉNÉVOLAT VALORISÉES (CERFA);${indicators.volunteeringStats.totalCerfaVolunteerHours} h`);
    lines.push('');

    // Section 3 : Ateliers & Patrimoine
    lines.push(`3. CHANTIERS, ATELIERS & PATRIMOINE`);
    lines.push(`Indicateur;Valeur`);
    lines.push(`Projets costumes terminés;${indicators.coutureFinished}`);
    lines.push(`Projets costumes en cours;${indicators.coutureInProgress}`);
    lines.push(`Pièces de lutherie suivies;${indicators.totalParts}`);
    lines.push(`Instruments opérationnels en service;${indicators.instrumentsInService}`);
    lines.push(`Instruments en maintenance / réparation;${indicators.instrumentsMaintenance}`);
    lines.push('');

    // Section 4 : Finances
    lines.push(`4. BILAN FINANCIER CONDENSÉ`);
    lines.push(`Poste;Montant (€)`);
    lines.push(`Recettes globales consolidées;${indicators.recettesGlobales.toFixed(2)} €`);
    lines.push(`Dépenses globales consolidées;${indicators.depensesGlobales.toFixed(2)} €`);
    lines.push(`RÉSULTAT NET D'EXERCICE;${indicators.soldeNet.toFixed(2)} €`);
    lines.push('');

    // Section 5 : Vitrine publique & Audience
    lines.push(`5. RAYONNEMENT NUMÉRIQUE & VITRINE PUBLIQUE`);
    lines.push(`Indicateur;Valeur`);
    lines.push(`Consultations uniques de la vitrine;${indicators.audienceStats.vitrineViews}`);
    lines.push(`Demandes de prestations reçues via le site;${indicators.audienceStats.vitrineRequestsTotal}`);
    lines.push(`Dossiers de prestation concrétisés;${indicators.audienceStats.vitrineRequestsConverted}`);
    lines.push(`Taux de concrétisation des demandes web;${indicators.audienceStats.conversionRate}%`);

    // Assemblage du fichier avec BOM UTF-8 (\uFEFF)
    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bilan_AG_${assocInfo?.nom || 'Association'}_${startDate}_au_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // 6. IMPRESSION FORMATÉE (window.print avec styles print Cordel)
  // =========================================================================
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left select-none relative animate-fade-in">
      {/* Styles d'impression dédiés pour le livret d'Assemblée Générale */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #181716 !important;
          }
          .no-print, header, nav, aside, footer, button, .banner-hide-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-card {
            border: 1px solid #181716 !important;
            box-shadow: none !important;
            break-inside: avoid;
            background: #ffffff !important;
          }
          .print-header {
            border-bottom: 2px solid #181716 !important;
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* En-tête spécial d'impression (visible uniquement sur la sortie papier / PDF) */}
      <div className="print-only print-header">
        <h1 className="text-xl font-black uppercase tracking-wider text-encre-noire mb-1">
          {assocInfo?.nom || 'Association O Girador'} — Rapport d'Activité & Bilan de Saison
        </h1>
        <p className="text-xs text-encre-noire/80">
          Période de référence : du <strong>{startDate}</strong> au <strong>{endDate}</strong> | Édité le {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Barre supérieure d'en-tête et actions rapides (écran) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-cordel-master-dark/30 pb-3 no-print">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              ⬅️ {t('common.back') || "Retour"}
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-cordel-wood flex items-center gap-2">
              <XiloScroll size={20} />
              {t('secretariatReports.title') || "Rapports & Bilan d'Assemblée Générale"}
            </h2>
            <p className="text-[11px] text-encre-noire/70 font-medium">
              {t('secretariatReports.subtitle') || "Consolidation des indicateurs de la saison pour l'AG et les dossiers de subvention"}
            </p>
          </div>
        </div>

        {/* Boutons d'export et d'action */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" data-tour="reports-export-actions">
          <button
            type="button"
            onClick={loadReportsData}
            disabled={loading}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-amber-100 text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Recharger les indicateurs de tous les pôles"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>{t('secretariatReports.refresh') || "Actualiser"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-cordel-card-bg hover:bg-amber-200 text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Exporter la synthèse au format tableur CSV"
          >
            <span>📥</span>
            <span>{t('secretariatReports.exportCsv') || "Exporter CSV"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSlideshowOpen(true)}
            disabled={loading}
            className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[#2d6a4f] text-white hover:bg-emerald-800 border-2 border-emerald-950 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Lancer la projection grand écran et le livret imprimable d'Assemblée Générale"
          >
            <span>📽️</span>
            <span>{t('secretariatReports.launchSlideshow', "Lancer la Projection AG")}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-cordel-bg text-encre-noire hover:bg-amber-100 border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5"
            title="Ouvrir le menu d'impression rapide de la synthèse à l'écran"
          >
            <span>📄</span>
            <span>{t('secretariatReports.printAg') || "Imprimer la synthèse"}</span>
          </button>
        </div>
      </div>

      {/* Barre de sélection de la période */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3 no-print" data-tour="reports-period-selector">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Préréglages rapides */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/70 shrink-0">
              {t('secretariatReports.periodSelectorTitle') || "Période"} :
            </span>
            <button
              type="button"
              onClick={() => handleSelectPreset('current_season')}
              className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
                periodPreset === 'current_season'
                  ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                  : 'bg-cordel-bg text-encre-noire border-encre-noire/40 hover:border-encre-noire'
              }`}
            >
              🌱 {t('secretariatReports.currentSeason') || "Saison en cours"} ({currentSeasonStartYear}-{currentSeasonStartYear + 1})
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('previous_season')}
              className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
                periodPreset === 'previous_season'
                  ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                  : 'bg-cordel-bg text-encre-noire border-encre-noire/40 hover:border-encre-noire'
              }`}
            >
              🌾 {t('secretariatReports.previousSeason') || "Saison N-1"} ({currentSeasonStartYear - 1}-{currentSeasonStartYear})
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('calendar_year')}
              className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[3px_5px_4px_4px] border transition-all cursor-pointer ${
                periodPreset === 'calendar_year'
                  ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-none'
                  : 'bg-cordel-bg text-encre-noire border-encre-noire/40 hover:border-encre-noire'
              }`}
            >
              📅 {t('secretariatReports.calendarYear') || "Année civile"} ({currentYear})
            </button>
          </div>

          {/* Sélecteurs de dates personnalisées */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[9px] font-bold uppercase text-encre-noire/70">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="theme-input px-2 py-1 text-xs font-bold rounded border border-encre-noire"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[9px] font-bold uppercase text-encre-noire/70">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="theme-input px-2 py-1 text-xs font-bold rounded border border-encre-noire"
              />
            </div>
          </div>
        </div>

        {lastRefreshed && (
          <div className="text-[9px] font-medium text-encre-noire/50 flex justify-between items-center border-t border-dashed border-cordel-master-dark/15 pt-1.5">
            <span>
              ℹ️ Analyse active du <strong>{startDate}</strong> au <strong>{endDate}</strong>
            </span>
            <span>
              {t('secretariatReports.lastUpdated') || "Données actualisées à"} : {lastRefreshed.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        )}
      </CordelCard>

      {/* État de chargement */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-cordel-card-bg border-2 border-dashed border-encre-noire/30 rounded-[6px_10px_7px_8px] no-print">
          <div className="text-3xl animate-spin">⏳</div>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {t('secretariatReports.loading') || "Agrégation des données des pôles en cours..."}
          </span>
        </div>
      )}

      {/* Message d'erreur éventuel */}
      {error && !loading && (
        <div className="p-4 bg-red-100 text-red-900 border-2 border-red-800 rounded font-bold text-xs no-print">
          ⚠️ {error}
        </div>
      )}

      {/* GRILLE PRINCIPALE DES 4 BLOCS CORDEL */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="reports-blocks-grid">
          
          {/* ========================================================================= */}
          {/* BLOC 1 : VIE ASSOCIATIVE & EFFECTIFS                                      */}
          {/* ========================================================================= */}
          <div className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card">
            <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
                  <span>👥</span>
                  <span>{t('secretariatReports.block1Title') || "1. Vie Associative & Adhésions"}</span>
                </h3>
                <p className="text-[10px] text-encre-noire/70 font-medium">
                  {t('secretariatReports.block1Desc') || "Effectifs, adhésions à jour et répartition des musiciens par pupitre."}
                </p>
              </div>
            </div>

            {/* Cartes métriques adhérents */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Enregistrés</span>
                <span className="text-lg font-black text-cordel-wood">{indicators.totalMembers}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Actifs</span>
                <span className="text-lg font-black text-emerald-800">{indicators.activeMembers}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">À jour</span>
                <span className="text-lg font-black text-[#2d6a4f]">{indicators.cotisationsUpToDate}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">En attente</span>
                <span className="text-lg font-black text-[#c05621]">{indicators.cotisationsPending}</span>
              </div>
            </div>

            {/* Répartition par pupitre */}
            <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/70">
                {t('secretariatReports.pupitresBreakdown') || "Répartition par pupitre"} :
              </span>
              <div className="flex flex-col gap-2">
                {indicators.sortedPupitres.map(pupitre => (
                  <div key={pupitre.name} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{pupitre.name}</span>
                      <span className="text-encre-noire/70">
                        {pupitre.count} membre{pupitre.count > 1 ? 's' : ''} ({pupitre.percent}%)
                      </span>
                    </div>
                    {/* Barre Cordel personnalisée */}
                    <div className="w-full h-2.5 bg-cordel-bg border border-encre-noire/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cordel-wood transition-all duration-500"
                        style={{ width: `${pupitre.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NOUVELLE SOUS-CARTE : ANCRAGE TERRITORIAL & COMMUNE (CERFA)               */}
          {/* ========================================================================= */}
          <ReportTerritoryCard territorialStats={indicators.territorialStats} />

          {/* ========================================================================= */}
          {/* BLOC 2 : RAYONNEMENT SCÉNIQUE & PRATIQUE COLLECTIVE                       */}
          {/* ========================================================================= */}
          <div className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card">
            <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
                  <span>🥁</span>
                  <span>{t('secretariatReports.block2Title') || "2. Rayonnement Scénique & Pratique Collective"}</span>
                </h3>
                <p className="text-[10px] text-encre-noire/70 font-medium">
                  {t('secretariatReports.block2Desc') || "Prestations, répétitions, stages et volume de mobilisations."}
                </p>
              </div>
            </div>

            {/* Cartes événements par type */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Prestations</span>
                <span className="text-lg font-black text-cordel-wood">{indicators.eventsByType.prestation}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Répétitions</span>
                <span className="text-lg font-black text-encre-noire">{indicators.eventsByType.repetition}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Stages / Ateliers</span>
                <span className="text-lg font-black text-encre-noire">{indicators.eventsByType.stage + indicators.eventsByType.atelier}</span>
              </div>
              <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
                <span className="text-[9px] font-black uppercase text-encre-noire/60">Réunions / AG</span>
                <span className="text-lg font-black text-encre-noire">{indicators.eventsByType.reunion}</span>
              </div>
            </div>

            {/* Ratios de présence et mobilisations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <div className="p-3 bg-cordel-bg/60 border border-encre-noire/15 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-encre-noire/70 block">
                    {t('secretariatReports.avgPresence') || "Moyenne musiciens / prestation"}
                  </span>
                  <span className="text-xs text-encre-noire/60">Effectif moyen déployé sur scène</span>
                </div>
                <span className="text-xl font-black text-emerald-800">
                  {indicators.avgPresencePrestation}
                </span>
              </div>

              <div className="p-3 bg-cordel-bg/60 border border-encre-noire/15 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-encre-noire/70 block">
                    {t('secretariatReports.totalMobilisations') || "Mobilisations cumulées"}
                  </span>
                  <span className="text-xs text-encre-noire/60">Total présences enregistrées</span>
                </div>
                <span className="text-xl font-black text-cordel-wood">
                  {indicators.totalPresencesAll}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NOUVELLE SOUS-CARTE : BÉNÉVOLAT & VIE DE TROUPE (CERFA 12156)             */}
          {/* ========================================================================= */}
          <ReportVolunteerCard volunteeringStats={indicators.volunteeringStats} />

          {/* ========================================================================= */}
          {/* NOUVELLE SOUS-CARTE : RAYONNEMENT & VITRINE PUBLIQUE                      */}
          {/* ========================================================================= */}
          <ReportAudienceCard audienceStats={indicators.audienceStats} />

          {/* ========================================================================= */}
          {/* BLOC 3 : CHANTIERS, ATELIERS & PATRIMOINE                                 */}
          {/* ========================================================================= */}
          <div className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card">
            <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
                  <span>🪡</span>
                  <span>{t('secretariatReports.block3Title') || "3. Chantiers, Ateliers & Patrimoine"}</span>
                </h3>
                <p className="text-[10px] text-encre-noire/70 font-medium">
                  {t('secretariatReports.block3Desc') || "Tenues confectionnées, pièces d'instruments et outillage."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Costumerie */}
              <div className="p-3 bg-cordel-bg/70 border border-encre-noire/20 rounded flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>👗</span> Costumerie & Confection
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-encre-noire/80">Costumes confectionnés :</span>
                  <span className="font-black text-[#2d6a4f]">{indicators.coutureFinished}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-encre-noire/80">Chantiers en cours :</span>
                  <span className="font-black text-[#c05621]">{indicators.coutureInProgress}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-dashed border-encre-noire/15 pt-1">
                  <span className="text-encre-noire/80 font-bold">Total projets suivis :</span>
                  <span className="font-black text-encre-noire">{indicators.totalCouture}</span>
                </div>
              </div>

              {/* Lutherie & Instruments */}
              <div className="p-3 bg-cordel-bg/70 border border-encre-noire/20 rounded flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>🎻</span> Lutherie & Matériel
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-encre-noire/80">Instruments en service :</span>
                  <span className="font-black text-[#2d6a4f]">{indicators.instrumentsInService}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-encre-noire/80">En maintenance / HS :</span>
                  <span className="font-black text-[#8b2a1a]">{indicators.instrumentsMaintenance}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-dashed border-encre-noire/15 pt-1">
                  <span className="text-encre-noire/80 font-bold">Pièces suivies en stock :</span>
                  <span className="font-black text-encre-noire">{indicators.totalParts}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLOC 4 : BILAN FINANCIER CONDENSÉ (PLEINE LARGEUR)                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-2 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card">
            <div className="border-b border-dashed border-cordel-master-dark/25 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
                  <span>🪙</span>
                  <span>{t('secretariatReports.block4Title') || "4. Bilan Financier Condensé"}</span>
                </h3>
                <p className="text-[10px] text-encre-noire/70 font-medium">
                  {t('secretariatReports.block4Desc') || "Synthèse des flux de recettes et dépenses sur la période."}
                </p>
              </div>
            </div>

            {/* Recettes vs Dépenses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/80 border-2 border-emerald-800/40 rounded flex flex-col">
                <span className="text-[10px] font-black uppercase text-emerald-900">
                  {t('secretariatReports.totalRecettes') || "Recettes consolidées"}
                </span>
                <span className="text-xl font-black text-[#2d6a4f] mt-1">
                  +{indicators.recettesGlobales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[9.5px] text-emerald-900/70 mt-1">Cotisations, billetterie, dons</span>
              </div>

              <div className="p-3 bg-red-50/80 border-2 border-red-800/40 rounded flex flex-col">
                <span className="text-[10px] font-black uppercase text-red-900">
                  {t('secretariatReports.totalDepenses') || "Dépenses consolidées"}
                </span>
                <span className="text-xl font-black text-[#8b2a1a] mt-1">
                  -{indicators.depensesGlobales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[9.5px] text-red-900/70 mt-1">Frais, déplacements, achats</span>
              </div>
            </div>

            {/* Solde net avec indicateur sémantique Cordel */}
            <div className={`p-3 rounded border-2 flex items-center justify-between ${
              indicators.soldeNet > 0
                ? 'bg-emerald-100 border-[#2d6a4f] text-[#2d6a4f]'
                : indicators.soldeNet < 0
                ? 'bg-red-100 border-[#8b2a1a] text-[#8b2a1a]'
                : 'bg-amber-100 border-[#c05621] text-[#c05621]'
            }`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {t('secretariatReports.soldeNet') || "Résultat net d'exercice"}
                </span>
                <span className="text-xs font-bold opacity-80">
                  {indicators.soldeNet > 0
                    ? `🟢 ${t('secretariatReports.surplus') || "Excédent de gestion"}`
                    : indicators.soldeNet < 0
                    ? `🔴 ${t('secretariatReports.deficit') || "Déficit d'exercice"}`
                    : `🟡 ${t('secretariatReports.equilibre') || "Budget équilibré"}`}
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black">
                {indicators.soldeNet > 0 ? '+' : ''}
                {indicators.soldeNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Modale autonome de Diaporama Grand Écran & Livret d'AG */}
      {isSlideshowOpen && (
        <AgSlideshowModal
          isOpen={isSlideshowOpen}
          onClose={() => setIsSlideshowOpen(false)}
          groupId={groupId}
          indicators={indicators}
          assocInfo={assocInfo}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
