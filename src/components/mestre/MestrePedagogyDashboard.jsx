import React, { useState, useMemo } from 'react';
import MestrePedagogyNotepad from './MestrePedagogyNotepad';
import MestreToadasAnalytics from '../pedagogy/MestreToadasAnalytics';
import MestreSeasonAdminTab from './MestreSeasonAdminTab';
import ProgramRehearsalModal from './ProgramRehearsalModal';
import MestreHotPointsBanner from './MestreHotPointsBanner';
import MestreChallengesCompactBar from './MestreChallengesCompactBar';
import PercussionRepertoireAnalytics from '../pedagogy/PercussionRepertoireAnalytics';
import DanseChoregraphieAnalytics from '../pedagogy/DanseChoregraphieAnalytics';
import EntrainementMacroAnalytics from '../pedagogy/EntrainementMacroAnalytics';
import useConfirm from '../../hooks/useConfirm';
import { useMestrePedagogyData } from '../../hooks/useMestrePedagogyData';
import { isDanseMember, isPercuMember, buildPupitresList, buildUnifiedRhythms, computeTopHotPoints } from '../../utils/mestreHotPointsUtils';
import { pinPedagogyNote, resetAllGroupEvaluations, detectE2EArtifacts, purgeE2ETestData } from '../../utils/mestrePedagogyActions';
import { useTranslation } from '../LanguageContext';

/**
 * Cockpit Pédagogique Mestre épuré (< 135 lignes).
 * Conserve en tête le ⚠️ Top 3 des Points Chauds et remplace le bloc massif de simulation (userAisanceMap)
 * par la barre synthétique d'une seule ligne MestreChallengesCompactBar.
 */
export default function MestrePedagogyDashboard({ profileData }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [activeAnalyseTab, setActiveAnalyseTab] = useState('percussion');
  const [pinnedSuccessItem, setPinnedSuccessItem] = useState(null);
  const [itemToProgramDirect, setItemToProgramDirect] = useState(null);
  const [programDirectSuccess, setProgramDirectSuccess] = useState(null);
  const [purgingE2E, setPurgingE2E] = useState(false);

  const {
    isLoading, setLoadingData, setRefreshTrigger, sequencerRhythms, dancadorSteps, dancadorChoreos,
    usersData, evaluationsMap, setEvaluationsMap, piecesProgressMap, revisionsDemandeesMap,
    assocInstruments, songs, fiches, rhythmMetaList, repertoire, userAisanceMap, resolvedTrainings, troupeChallengeMetrics
  } = useMestrePedagogyData({ groupId, isAuthorized });

  const percuUsers = useMemo(() => usersData.filter(isPercuMember), [usersData]);
  const danseUsers = useMemo(() => usersData.filter(isDanseMember), [usersData]);
  const pupitres = useMemo(() => buildPupitresList(assocInstruments, percuUsers), [assocInstruments, percuUsers]);
  const unifiedRhythms = useMemo(() => buildUnifiedRhythms({ sequencerRhythms, rhythmMetaList, evaluationsMap, songs, fiches }), [sequencerRhythms, rhythmMetaList, evaluationsMap, songs, fiches]);

  const revisionsCountMap = useMemo(() => {
    const counts = {};
    Object.values(revisionsDemandeesMap).forEach((userRevs) => {
      Object.entries(userRevs || {}).forEach(([itemId, isReq]) => { if (isReq === true) counts[itemId] = (counts[itemId] || 0) + 1; });
    });
    return counts;
  }, [revisionsDemandeesMap]);

  const hotPoints = useMemo(
    () => computeTopHotPoints({ pupitres, percuUsers, danseUsers, unifiedRhythms, songs, usersData, evaluationsMap, revisionsCountMap, t }),
    [pupitres, percuUsers, danseUsers, unifiedRhythms, songs, usersData, evaluationsMap, revisionsCountMap, t]
  );

  const detectedE2EItems = useMemo(() => detectE2EArtifacts({ sequencerRhythms, rhythmMetaList, evaluationsMap }), [sequencerRhythms, rhythmMetaList, evaluationsMap]);

  const handlePinNote = async (itemTitre, categoryInfo, requestCount = 0) => {
    try {
      const label = await pinPedagogyNote({ groupId, itemTitre, categoryInfo, requestCount, authorName: profileData?.displayName || 'Mestre' });
      if (label) { setPinnedSuccessItem(label); setTimeout(() => setPinnedSuccessItem(null), 3000); }
    } catch (e) { console.error('Erreur épinglage :', e); }
  };

  const handleResetAllEvaluations = async () => {
    const ok = await confirm({ title: 'Remise à zéro annuelle', message: '⚠️ Remettre à zéro toutes les évaluations des membres ?', confirmText: 'Oui, réinitialiser', cancelText: 'Annuler', variant: 'danger' });
    if (!ok) return;
    setLoadingData(true);
    try { setEvaluationsMap(await resetAllGroupEvaluations({ groupId, usersData })); } finally { setLoadingData(false); }
  };

  const handlePurgeE2ETests = async () => {
    const ok = await confirm({ title: 'Purger les données E2E ?', message: 'Supprimer définitivement les séquences et évaluations de test E2E ?', confirmText: 'Purger', cancelText: 'Annuler', variant: 'danger' });
    if (!ok) return;
    setPurgingE2E(true);
    try { await purgeE2ETestData({ groupId, usersData }); setRefreshTrigger((v) => v + 1); } finally { setPurgingE2E(false); }
  };

  if (!isAuthorized) return <div className="p-8 text-center text-xs font-black uppercase text-cordel-rouge">{t('mestre.pedagogy.accessRestrictedMestrePedagogy')}</div>;

  const tabs = [
    { id: 'percussion', icon: '🥁', label: t('mestre.pedagogy.disciplinePercussion') },
    { id: 'danse', icon: '💃', label: t('pedagogy.tabDanse') },
    { id: 'toadas', icon: '📜', label: t('mestre.pedagogy.disciplineChantsToadas') },
    { id: 'entrainement', icon: '⚡', label: `${t('mestre.pedagogy.disciplineTrainingsCount')}${resolvedTrainings.length})` }
  ];

  return (
    <div className="flex flex-col gap-5 w-full max-w-none text-left select-none py-4 force-light-theme relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading tracking-widest text-cordel-wood uppercase">📊 {t('pedagogy.dashboardTitle')}</h1>
          <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 mt-1">{t('pedagogy.hotPointsNotice')}</p>
        </div>
        {(pinnedSuccessItem || programDirectSuccess) && (
          <div className="bg-[var(--color-cordel-vert)] text-white text-[11px] font-black uppercase px-3 py-1.5 rounded border border-encre-noire">
            ✓ {pinnedSuccessItem ? `${t('mestre.pedagogy.pinnedColon')} ${pinnedSuccessItem}` : programDirectSuccess}
          </div>
        )}
      </div>

      {/* Zone 1 : ⚠️ Top 3 des Points Chauds */}
      <MestreHotPointsBanner hotPoints={hotPoints} isLoading={isLoading} onProgramDirect={setItemToProgramDirect} onPinNote={handlePinNote} />

      {/* Barre synthétique d'une seule ligne pour les 3 défis */}
      <MestreChallengesCompactBar metrics={troupeChallengeMetrics} pieces={repertoire} profileData={profileData} groupId={groupId} />

      {/* Zone 2 : Sélecteur de discipline & Matrices */}
      <section aria-label={t('mestre.pedagogy.fluencyMatricesAriaLabel')} className="flex flex-col gap-4">
        <div className="flex border-b-2 border-dashed border-cordel-master-dark/30 gap-2 overflow-x-auto select-none pt-1">
          {tabs.map((tb) => (
            <button key={tb.id} type="button" onClick={() => setActiveAnalyseTab(tb.id)} className={`px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeAnalyseTab === tb.id ? 'text-cordel-wood border-b-4 border-cordel-wood bg-cordel-wood/5' : 'text-cordel-master-dark/60 hover:text-cordel-master-dark'}`}>
              <span>{tb.icon}</span><span>{tb.label}</span>
            </button>
          ))}
          <button type="button" onClick={() => setActiveAnalyseTab('admin')} className={`px-4 py-2 text-xs font-extrabold uppercase tracking-widest whitespace-nowrap cursor-pointer flex items-center gap-1.5 ml-auto ${activeAnalyseTab === 'admin' ? 'text-cordel-rouge border-b-4 border-cordel-rouge' : 'text-cordel-master-dark/40'}`}>
            <span>⚙️</span><span>{t('mestre.pedagogy.seasonWord')}</span>
          </button>
        </div>

        {!isLoading && (
          <div className="flex flex-col gap-6 w-full">
            {activeAnalyseTab === 'percussion' && <PercussionRepertoireAnalytics repertoire={repertoire} percuUsers={percuUsers} evaluationsMap={evaluationsMap} userAisanceMap={userAisanceMap} resolvedTrainings={resolvedTrainings} revisionsCountMap={revisionsCountMap} onProgramDirect={(p) => setItemToProgramDirect({ titre: p.titre, discipline: '🥁 Percussion', id: p.id })} onPinNote={handlePinNote} />}
            {activeAnalyseTab === 'danse' && <DanseChoregraphieAnalytics danseUsers={danseUsers} repertoire={repertoire} steps={dancadorSteps} choreographies={dancadorChoreos} evaluationsMap={evaluationsMap} revisionsCountMap={revisionsCountMap} onProgramDirect={setItemToProgramDirect} onPinNote={handlePinNote} />}
            {activeAnalyseTab === 'toadas' && <MestreToadasAnalytics profileData={profileData} allSongs={songs} repertoire={repertoire} usersData={usersData} evaluationsMap={evaluationsMap} piecesProgressMap={piecesProgressMap} revisionsCountMap={revisionsCountMap} onPinNote={handlePinNote} />}
            {activeAnalyseTab === 'entrainement' && <EntrainementMacroAnalytics usersData={usersData} resolvedTrainings={resolvedTrainings} userAisanceMap={userAisanceMap} evaluationsMap={evaluationsMap} pupitres={pupitres} />}
            {activeAnalyseTab === 'admin' && <MestreSeasonAdminTab onResetAllEvaluations={handleResetAllEvaluations} onPurgeE2ETests={handlePurgeE2ETests} purgingE2E={purgingE2E} detectedE2ECount={detectedE2EItems.length} />}
          </div>
        )}
      </section>

      <MestrePedagogyNotepad groupId={groupId} />
      {itemToProgramDirect && <ProgramRehearsalModal isOpen onClose={() => setItemToProgramDirect(null)} groupId={groupId} item={itemToProgramDirect} onSuccess={(setlistItem) => { setProgramDirectSuccess(`« ${setlistItem.titre} » programmé !`); setTimeout(() => setProgramDirectSuccess(null), 4000); }} />}
    </div>
  );
}
