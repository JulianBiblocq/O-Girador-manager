import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import MestrePedagogyNotepad from './MestrePedagogyNotepad';
import MestreToadasAnalytics from '../pedagogy/MestreToadasAnalytics';
import ProgramRehearsalModal from './ProgramRehearsalModal';
import useConfirm from '../../hooks/useConfirm';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { calculateToadaScore } from '../../utils/toadaProgressEngine';
import { normalizePupitreName } from '../../utils/secretariatMetrics';

export default function MestrePedagogyDashboard({ profileData }) {
  const { confirm } = useConfirm();
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [activeAnalyseTab, setActiveAnalyseTab] = useState('percussion');
  const [loadingData, setLoadingData] = useState(true);
  const [pinnedSuccessItem, setPinnedSuccessItem] = useState(null);
  const [itemToProgramDirect, setItemToProgramDirect] = useState(null);
  const [programDirectSuccess, setProgramDirectSuccess] = useState(null);

  // 1. Branchement sur le catalogue complet du Séquenceur officiel
  const { rhythms: sequencerRhythms, loading: loadingSequencer } = useSequencerFirestoreData(groupId);

  const [usersData, setUsersData] = useState([]);
  const [evaluationsMap, setEvaluationsMap] = useState({}); // { uid: { [itemId]: 'level' } }
  const [revisionsDemandeesMap, setRevisionsDemandeesMap] = useState({}); // { uid: { [itemId]: boolean } }
  const [assocInstruments, setAssocInstruments] = useState([]);
  
  // Documents du Varal et métadonnées
  const [songs, setSongs] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [rhythmMetaList, setRhythmMetaList] = useState([]);

  useEffect(() => {
    if (!groupId || !isAuthorized) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // 1. Récupérer les utilisateurs actifs du groupe (exclure uniquement archivés et inactifs)
        const qUsers = query(collection(db, 'users'), where('groupId', '==', groupId));
        const usersSnap = await getDocs(qUsers);
        const users = [];
        usersSnap.forEach(d => {
          const uData = d.data();
          const isActif = uData.statutActuel !== 'archived' && uData.statutActuel !== 'inactive' && uData.status !== 'archived' && uData.status !== 'inactive';
          if (isActif) {
            users.push({ id: d.id, ...uData });
          }
        });
        setUsersData(users);

        // 2. Récupérer toutes les évaluations de parcours et demandes de révision pour ces utilisateurs
        const evals = {};
        const revs = {};
        await Promise.all(users.map(async (u) => {
          try {
            const docRef = doc(db, 'users', u.id, 'parcours', groupId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const pData = snap.data();
              evals[u.id] = pData.evaluations || {};
              revs[u.id] = pData.revisionsDemandees || {};
            } else {
              evals[u.id] = {};
              revs[u.id] = {};
            }
          } catch (e) {
            evals[u.id] = {};
            revs[u.id] = {};
          }
        }));
        setEvaluationsMap(evals);
        setRevisionsDemandeesMap(revs);

        // 3. Récupérer la configuration des instruments de l'association
        try {
          const assocRef = doc(db, 'associations', groupId);
          const assocSnap = await getDoc(assocRef);
          if (assocSnap.exists()) {
            const aData = assocSnap.data();
            setAssocInstruments(aData.instrumentsDisponibles || aData.instrumentsActifs || []);
          }
        } catch (e) {
          console.error("Erreur récupération instruments association :", e);
        }

        // 4. Récupérer les documents du Varal (Chants & Fiches Culture)
        const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
        const docsSnap = await getDocs(qDocs);
        const fetchedSongs = [];
        const fetchedFiches = [];
        docsSnap.forEach(d => {
          const data = d.data();
          if (data.type === 'song') fetchedSongs.push({ id: d.id, ...data });
          if (data.type === 'fiche_pedagogique' || data.type === 'culture_fiche') fetchedFiches.push({ id: d.id, ...data });
        });
        setSongs(fetchedSongs);
        setFiches(fetchedFiches);

        // 5. Récupérer les métadonnées de rythmes personnalisées par le Mestre
        const qMeta = collection(db, 'associations', groupId, 'rhythmMetadata');
        const metaSnap = await getDocs(qMeta);
        const fetchedMeta = [];
        metaSnap.forEach(d => {
          fetchedMeta.push({ id: d.id, titre: d.data().titre || d.data().title || d.id, ...d.data() });
        });
        setRhythmMetaList(fetchedMeta);

      } catch (err) {
        console.error("Erreur lors de la récupération des données pédagogiques :", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [groupId, isAuthorized]);

  // Construction unifiée et saine du catalogue de rythmes (Percussion et Danse)
  const unifiedRhythms = useMemo(() => {
    const map = new Map();

    // 1. Morceaux issus du Séquenceur officiel
    (sequencerRhythms || []).forEach(r => {
      const cleanTitle = r.title || r.titre || r.name || r.id;
      map.set(r.id, {
        id: r.id,
        titre: cleanTitle,
        jsonUrl: r.jsonUrl || null,
        source: 'sequencer'
      });
    });

    // 2. Métadonnées personnalisées du Mestre
    (rhythmMetaList || []).forEach(m => {
      const existing = map.get(m.id);
      map.set(m.id, {
        id: m.id,
        titre: m.titre || m.title || existing?.titre || m.id,
        jsonUrl: m.jsonUrl || existing?.jsonUrl || null,
        source: 'metadata',
        ...m
      });
    });

    // 3. Détection des clés existantes dans les évaluations (Dépollution stricte)
    Object.values(evaluationsMap).forEach(userEvals => {
      Object.keys(userEvals).forEach(key => {
        // Exclure formellement les chants, fiches, clés administratives et le préfixe danse_
        if (
          !songs.find(s => s.id === key) &&
          !fiches.find(f => f.id === key) &&
          key !== 'entretien_global' &&
          !key.endsWith('_chant') &&
          !key.startsWith('danse_')
        ) {
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              titre: key.replace(/_/g, ' '),
              source: 'evaluations'
            });
          }
        }
      });
    });

    const list = Array.from(map.values());
    list.sort((a, b) => a.titre.localeCompare(b.titre));
    return list;
  }, [sequencerRhythms, rhythmMetaList, evaluationsMap, songs, fiches]);

  // Détection des membres Danse (pratiqueDanse ou instrument danse ou voeu danse)
  const isDanseMember = (u) => {
    if (!u) return false;
    if (u.pratiqueDanse === true) return true;
    const inst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase().trim();
    if (inst.includes('danse')) return true;
    if (Array.isArray(u.voeuxInstruments) && u.voeuxInstruments.some(w => typeof w === 'string' && w.toLowerCase().includes('danse'))) return true;
    return false;
  };

  // Détection des membres Percussionnistes (exclut uniquement les danseurs 100% sans percussion)
  const isPercuMember = (u) => {
    if (!u) return false;
    if (u.pratiquePercussion === false) return false;
    if (u.pratiqueDanse === true && !u.instrument && !u.instrumentPrincipal && !u.pupitre && (!Array.isArray(u.voeuxInstruments) || u.voeuxInstruments.length === 0)) {
      return false;
    }
    const inst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase().trim();
    if (inst === 'danse' && u.pratiquePercussion !== true) return false;
    return true;
  };

  // Répartition des utilisateurs par pupitre
  const percuUsers = useMemo(() => usersData.filter(isPercuMember), [usersData]);
  const danseUsers = useMemo(() => usersData.filter(isDanseMember), [usersData]);

  // Construction robuste des pupitres de percussion de l'association
  const pupitres = useMemo(() => {
    const set = new Set();
    // 1. Instruments configurés de l'association
    (assocInstruments || []).forEach(inst => {
      const clean = (inst || '').trim();
      if (clean && clean.toLowerCase() !== 'danse') set.add(clean);
    });

    // 2. Pupitres déclarés par les membres
    percuUsers.forEach(u => {
      const declared = normalizePupitreName(u.instrumentPrincipal || u.instrument || u.pupitre);
      if (declared && declared !== 'Non défini' && declared.toLowerCase() !== 'danse') {
        set.add(declared);
      }
    });

    // 3. Fallback standard de Nação
    if (set.size === 0) {
      ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro"].forEach(i => set.add(i));
    }

    return Array.from(set);
  }, [assocInstruments, percuUsers]);

  // Fonction utilitaire pour trouver les percussionnistes affectés à un pupitre
  const getPupitreUsers = (pupitreName) => {
    const target = pupitreName.toLowerCase().trim();
    const matches = percuUsers.filter(u => {
      const uInst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase().trim();
      const uSec = (u.instrumentSecondaire || '').toLowerCase().trim();
      const uVoeu = (u.voeuPrincipal || '').toLowerCase().trim();
      const wishes = Array.isArray(u.voeuxInstruments) ? u.voeuxInstruments.map(w => String(w).toLowerCase().trim()) : [];
      return uInst.includes(target) || target.includes(uInst) ||
             uSec.includes(target) ||
             uVoeu.includes(target) ||
             wishes.some(w => w.includes(target));
    });

    // Si aucun membre n'a encore d'affectation spécifique pour ce pupitre, et que la majorité est sans affectation
    const hasAnyPupitreAssigned = percuUsers.some(u => Boolean((u.instrument || u.instrumentPrincipal || u.pupitre || '').trim()));
    if (!hasAnyPupitreAssigned && percuUsers.length > 0) {
      return percuUsers;
    }

    return matches;
  };

  // Calcul réactif des demandes de révision par item (chant, rythme, danse)
  const revisionsCountMap = useMemo(() => {
    const counts = {};
    Object.values(revisionsDemandeesMap).forEach(userRevs => {
      if (!userRevs) return;
      Object.entries(userRevs).forEach(([itemId, isRequested]) => {
        if (isRequested === true) {
          counts[itemId] = (counts[itemId] || 0) + 1;
        }
      });
    });
    return counts;
  }, [revisionsDemandeesMap]);

  // Calcul du taux de maîtrise pour un item et un ensemble d'utilisateurs
  const getStatsForItem = (rhythmId, filteredUsers, isDanse = false) => {
    let total = 0;
    let okCount = 0; // 'alaise', 'referent' ou 'oui'

    filteredUsers.forEach(u => {
      let e = null;
      if (isDanse) {
        // Pour la danse : chercher en priorité la clé préfixée 'danse_', avec repli sur le rhythmId brut
        e = evaluationsMap[u.id]?.[`danse_${rhythmId}`] || evaluationsMap[u.id]?.[rhythmId];
      } else {
        e = evaluationsMap[u.id]?.[rhythmId];
      }

      if (e) {
        total++;
        if (e === 'alaise' || e === 'referent' || e === 'oui') okCount++;
      }
    });

    if (total === 0) {
      return { pct: 0, total: 0, okCount: 0, color: 'text-neutral-400', bg: 'bg-neutral-100', text: 'Aucune donnée' };
    }

    const pct = Math.round((okCount / total) * 100);
    let color = 'text-[#8b2a1a]';
    let bg = 'bg-[#8b2a1a]/10';
    if (pct >= 75) {
      color = 'text-[#2d6a4f]';
      bg = 'bg-[#2d6a4f]/20';
    } else if (pct >= 50) {
      color = 'text-[#c05621]';
      bg = 'bg-[#c05621]/20';
    }

    return { pct, total, okCount, color, bg, text: `${pct}% (${okCount}/${total})` };
  };

  // Calcul des Points Chauds pour le bandeau d'alerte en Zone 1 (Priorisation des demandes d'élèves)
  const hotPoints = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. Percussions par pupitre
    pupitres.forEach(pupitre => {
      const pUsers = getPupitreUsers(pupitre);
      if (pUsers.length === 0) return;
      unifiedRhythms.forEach(r => {
        const stats = getStatsForItem(r.id, pUsers, false);
        const reqCount = revisionsCountMap[r.id] || 0;
        if ((stats.total > 0 && stats.pct < 60) || reqCount > 0) {
          const itemKey = `percu_${pupitre}_${r.id}`;
          if (!seenKeys.has(itemKey)) {
            seenKeys.add(itemKey);
            const urgencyScore = (reqCount * 30) + (100 - (stats.total > 0 ? stats.pct : 0));
            list.push({
              id: itemKey,
              titre: r.titre,
              discipline: `🥁 Percussion [${pupitre}]`,
              pupitre: pupitre,
              pct: stats.pct,
              requestCount: reqCount,
              urgencyScore: urgencyScore,
              detail: reqCount > 0 
                ? `🙋 ${reqCount} demande${reqCount > 1 ? 's' : ''} d'élèves • ${stats.total > 0 ? `${stats.okCount}/${stats.total} à l'aise (${stats.pct}%)` : 'Non évalué'}`
                : `${stats.okCount}/${stats.total} à l'aise (${stats.pct}%)`,
              rawItem: r,
              type: 'percussion',
              itemId: r.id
            });
          }
        }
      });
    });

    // 2. Danse
    if (danseUsers.length > 0) {
      unifiedRhythms.forEach(r => {
        const stats = getStatsForItem(r.id, danseUsers, true);
        const reqCount = revisionsCountMap[`danse_${r.id}`] || 0;
        if ((stats.total > 0 && stats.pct < 60) || reqCount > 0) {
          const urgencyScore = (reqCount * 30) + (100 - (stats.total > 0 ? stats.pct : 0));
          list.push({
            id: `danse_${r.id}`,
            titre: r.titre,
            discipline: '💃 Danse',
            pupitre: 'Danse',
            pct: stats.pct,
            requestCount: reqCount,
            urgencyScore: urgencyScore,
            detail: reqCount > 0 
              ? `🙋 ${reqCount} demande${reqCount > 1 ? 's' : ''} de danseurs • ${stats.total > 0 ? `${stats.okCount}/${stats.total} à l'aise (${stats.pct}%)` : 'Non évalué'}`
              : `${stats.okCount}/${stats.total} à l'aise (${stats.pct}%)`,
            rawItem: r,
            type: 'danse',
            itemId: `danse_${r.id}`
          });
        }
      });
    }

    // 3. Toadas
    const activeSongs = (songs || []).filter(s => !s.isArchived);
    activeSongs.forEach(song => {
      let totalScore = 0;
      let evaluatedCount = 0;
      usersData.forEach(u => {
        const toadaSessions = (u.quizHistory || []).filter(e => e.toadaId === song.id);
        if (toadaSessions.length > 0) {
          const res = calculateToadaScore(song.id, u.quizHistory || []);
          totalScore += res.score;
          evaluatedCount++;
        } else {
          const manual = evaluationsMap[u.id]?.[song.id];
          if (manual) {
            evaluatedCount++;
            if (manual === 'referent') totalScore += 100;
            else if (manual === 'alaise' || manual === 'oui') totalScore += 75;
            else if (manual === 'pratique') totalScore += 50;
            else if (manual === 'decouverte') totalScore += 25;
          }
        }
      });

      const avg = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;
      const reqCount = revisionsCountMap[song.id] || 0;

      if ((evaluatedCount > 0 && avg < 60) || reqCount > 0) {
        const urgencyScore = (reqCount * 30) + (100 - avg);
        list.push({
          id: `song_${song.id}`,
          titre: song.titre,
          discipline: '📜 Chant & Toada',
          pupitre: 'Chœur & Pupitres',
          pct: avg,
          requestCount: reqCount,
          urgencyScore: urgencyScore,
          detail: reqCount > 0
            ? `🙋 ${reqCount} demande${reqCount > 1 ? 's' : ''} d'élèves • ${avg}% maîtrise (${evaluatedCount} avis/quiz)`
            : `${avg}% (${evaluatedCount} avis/quiz)`,
          rawItem: song,
          type: 'song',
          itemId: song.id
        });
      }
    });

    // Tri par urgence : les demandes d'élèves en tête, puis les scores les plus bas
    list.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return list.slice(0, 3);
  }, [pupitres, percuUsers, danseUsers, unifiedRhythms, songs, usersData, evaluationsMap, revisionsCountMap]);

  // Épinglage instantané d'une faiblesse dans le bloc-notes Firestore (avec mention des demandes)
  const handlePinNote = async (itemTitre, categoryInfo, requestCount = 0) => {
    try {
      const mentionDemandes = requestCount > 0 
        ? ` (${requestCount} demande${requestCount > 1 ? 's' : ''} d'élèves)` 
        : '';
      const newNote = {
        id: `note_${Date.now()}`,
        titre: `🛠️ À travailler${categoryInfo ? ` [${categoryInfo}]` : ''} : ${itemTitre}${mentionDemandes}`,
        contenu: `Point de répétition prioritaire : ${itemTitre}.${requestCount > 0 ? `\n🙋 Signalé par ${requestCount} élève${requestCount > 1 ? 's' : ''} en demande de révision.` : ''}`,
        createdBy: profileData?.displayName || 'Mestre',
        createdAt: new Date().toISOString()
      };
      const noteRef = doc(db, 'associations', groupId, 'blocNotes', newNote.id);
      await setDoc(noteRef, newNote);
      setPinnedSuccessItem(`${itemTitre}${mentionDemandes}`);
      setTimeout(() => setPinnedSuccessItem(null), 3000);
    } catch (e) {
      console.error("Erreur lors de l'épinglage dans le bloc-notes :", e);
    }
  };

  // Remise à zéro annuelle
  const handleResetAllEvaluations = async () => {
    const isOk = await confirm({
      title: "Remise à zéro annuelle",
      message: "⚠️ Êtes-vous sûr de vouloir remettre à zéro TOUTES les évaluations de tous les membres ?\nCette action est irréversible et recommandée uniquement pour démarrer une nouvelle saison (remise à zéro des compteurs).",
      confirmText: "Oui, réinitialiser les compteurs",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    
    setLoadingData(true);
    try {
      const batchEvals = usersData.map(async (u) => {
        const docRef = doc(db, 'users', u.id, 'parcours', groupId);
        await setDoc(docRef, { evaluations: {} }, { merge: true });
      });
      await Promise.all(batchEvals);
      
      const emptyEvals = {};
      usersData.forEach(u => emptyEvals[u.id] = {});
      setEvaluationsMap(emptyEvals);
      
      alert("Toutes les évaluations ont été remises à zéro avec succès.");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la remise à zéro.");
    } finally {
      setLoadingData(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center text-xs font-black uppercase text-cordel-rouge">
        Accès réservé au Mestre et à l'équipe pédagogique.
      </div>
    );
  }

  const isLoading = loadingData || loadingSequencer;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-left select-none p-4 md:p-8 force-light-theme relative">
      
      {/* ========================================================================= */}
      {/* EN-TÊTE DU COCKPIT                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase">
            📊 Cockpit Pédagogique
          </h1>
          <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 mt-1">
            Tableau de bord opérationnel de répétition : thermomètre des pupitres, points chauds et bloc-notes persistant.
          </p>
        </div>
        {pinnedSuccessItem && (
          <div className="animate-fadeIn bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-[4px_6px_3px_5px] border border-encre-noire shadow-xs flex items-center gap-1.5">
            <span>✓</span>
            <span>Épinglé : {pinnedSuccessItem}</span>
          </div>
        )}
        {programDirectSuccess && (
          <div className="animate-fadeIn bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-[4px_6px_3px_5px] border border-encre-noire shadow-xs flex items-center gap-1.5">
            <span>⚡</span>
            <span>{programDirectSuccess}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ZONE 1 : BANDEAU SYNTHÈSE DES POINTS CHAUDS (< 60%)                       */}
      {/* ========================================================================= */}
      <section aria-label="Points chauds de répétition">
        <CordelCard variant="default" className="p-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
              <span>⚠️</span>
              <span>Points chauds pour la répétition (Priorités &lt; 60%)</span>
            </h2>
            <span className="text-[10px] text-encre-noire/60 font-semibold">
              Top 3 des difficultés détectées dans le répertoire
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-4 text-xs font-bold text-cordel-master-dark/50 animate-pulse">
              Analyse des points chauds...
            </div>
          ) : hotPoints.length === 0 ? (
            <div className="p-3 bg-[var(--color-cordel-vert,#2d6a4f)]/10 border border-[var(--color-cordel-vert,#2d6a4f)]/30 rounded text-center text-xs font-black text-[var(--color-cordel-vert,#2d6a4f)]">
              ✨ Aucun point critique sous 60%. Tous les rythmes et chants évalués sont au vert !
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {hotPoints.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded bg-[var(--color-cordel-rouge,#8b2a1a)]/5 border-l-4 border-l-[var(--color-cordel-rouge,#8b2a1a)] border border-encre-noire/15 flex flex-col justify-between gap-2 shadow-xs"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)]">
                        Priorité #{idx + 1}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--color-cordel-rouge,#8b2a1a)]/15 text-[var(--color-cordel-rouge,#8b2a1a)]">
                        {item.pct}%
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xs text-encre-noire leading-tight">
                      {item.titre}
                    </h3>
                    <span className="text-[10px] font-bold text-encre-noire/70">
                      {item.discipline}
                    </span>
                    <span className="text-[9px] text-encre-noire/50">
                      {item.detail}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-encre-noire/15">
                    <button
                      type="button"
                      onClick={() => setItemToProgramDirect(item)}
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[var(--color-cordel-vert,#2d6a4f)] text-white border border-[#1b4332] rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Programmer directement dans le fil conducteur de la prochaine répétition"
                    >
                      <span>⚡</span>
                      <span>Programmer en répétition</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePinNote(item.titre, item.discipline, item.requestCount || 0)}
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white text-encre-noire border border-encre-noire/30 rounded hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Épingler directement dans le bloc-notes de répétition"
                    >
                      <span>📌</span>
                      <span>Épingler</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CordelCard>
      </section>

      {/* ========================================================================= */}
      {/* ZONE 2 : SÉLECTEUR DE DISCIPLINE & MATRICES                               */}
      {/* ========================================================================= */}
      <section aria-label="Matrices d'aisance par discipline" className="flex flex-col gap-4">
        
        {/* Barre de navigation des 3 matrices */}
        <div className="flex border-b-2 border-dashed border-cordel-master-dark/30 gap-2 overflow-x-auto select-none pt-2">
          <button
            type="button"
            onClick={() => setActiveAnalyseTab('percussion')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeAnalyseTab === 'percussion' 
                ? 'text-cordel-wood border-b-4 border-cordel-wood bg-cordel-wood/5' 
                : 'text-cordel-master-dark/60 hover:text-cordel-master-dark hover:bg-encre-noire/5'
            }`}
          >
            <span>🥁</span>
            <span>Percussion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalyseTab('danse')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeAnalyseTab === 'danse' 
                ? 'text-cordel-wood border-b-4 border-cordel-wood bg-cordel-wood/5' 
                : 'text-cordel-master-dark/60 hover:text-cordel-master-dark hover:bg-encre-noire/5'
            }`}
          >
            <span>💃</span>
            <span>Danse</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalyseTab('toadas')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeAnalyseTab === 'toadas' 
                ? 'text-cordel-wood border-b-4 border-cordel-wood bg-cordel-wood/5' 
                : 'text-cordel-master-dark/60 hover:text-cordel-master-dark hover:bg-encre-noire/5'
            }`}
          >
            <span>📜</span>
            <span>Chants &amp; Toadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalyseTab('admin')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
              activeAnalyseTab === 'admin' 
                ? 'text-cordel-rouge border-b-4 border-cordel-rouge bg-cordel-rouge/5' 
                : 'text-cordel-master-dark/40 hover:text-cordel-rouge'
            }`}
            title="Administration annuelle"
          >
            <span>⚙️</span>
            <span>Saison</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center p-12 opacity-50 animate-pulse font-black uppercase text-xs">
            Calcul des matrices pédagogiques en cours...
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">

            {/* VUE 1 : PERCUSSION PAR PUPITRE */}
            {activeAnalyseTab === 'percussion' && (
              <div className="flex flex-col gap-5">
                {pupitres.length === 0 ? (
                  <CordelCard className="p-6 text-center text-xs font-bold text-cordel-master-dark/60">
                    Aucun membre avec un pupitre de percussion assigné.
                  </CordelCard>
                ) : (
                  pupitres.map(pupitre => {
                    const pupitreUsers = getPupitreUsers(pupitre);
                    return (
                      <CordelCard key={pupitre} variant="default" className="p-5 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
                        <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
                          <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire flex items-center gap-2">
                            <span>🪘</span>
                            <span>Pupitre : {pupitre}</span>
                          </h3>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-encre-noire/10 text-encre-noire">
                            {pupitreUsers.length} adhérent{pupitreUsers.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {unifiedRhythms.map(rhythm => {
                            const stats = getStatsForItem(rhythm.id, pupitreUsers, false);
                            const revCount = revisionsCountMap[rhythm.id] || 0;
                            return (
                              <div 
                                key={rhythm.id} 
                                className="flex justify-between items-center p-2.5 bg-white border border-dashed border-encre-noire/20 rounded hover:border-encre-noire/50 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                  <span className="text-xs font-bold text-encre-noire truncate" title={rhythm.titre}>
                                    {rhythm.titre}
                                  </span>
                                  {revCount > 0 && (
                                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30 flex items-center gap-0.5">
                                      <span>🙋</span>
                                      <span>{revCount} demande{revCount > 1 ? 's' : ''}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${stats.bg} ${stats.color}`}>
                                    {stats.text}
                                  </span>
                                  {(revCount > 0 || (stats.total > 0 && stats.pct < 75)) && (
                                    <button
                                      type="button"
                                      onClick={() => handlePinNote(rhythm.titre, pupitre, revCount)}
                                      className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#fdfaf2] border border-encre-noire/20 rounded hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                                      title="Épingler au bloc-notes"
                                    >
                                      📌
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CordelCard>
                    );
                  })
                )}
              </div>
            )}

            {/* VUE 2 : DANSE (RACCORDEMENT DE LA CLÉ DANSE_ ET DEMANDES DE RÉVISION) */}
            {activeAnalyseTab === 'danse' && (
              <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
                <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire flex items-center gap-2">
                    <span>💃</span>
                    <span>Équipe Danse</span>
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-encre-noire/10 text-encre-noire">
                    {danseUsers.length} danseuse{danseUsers.length > 1 ? 's' : ''}/danseur{danseUsers.length > 1 ? 's' : ''}
                  </span>
                </div>

                {danseUsers.length === 0 ? (
                  <p className="text-xs font-bold text-cordel-master-dark/60 italic py-4 text-center">
                    Aucun profil Danse enregistré dans les adhérents actifs.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {unifiedRhythms.map(rhythm => {
                      const stats = getStatsForItem(rhythm.id, danseUsers, true);
                      const revCount = revisionsCountMap[`danse_${rhythm.id}`] || 0;
                      return (
                        <div 
                          key={rhythm.id} 
                          className="flex justify-between items-center p-2.5 bg-white border border-dashed border-encre-noire/20 rounded hover:border-encre-noire/50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            <span className="text-xs font-bold text-encre-noire truncate" title={rhythm.titre}>
                              {rhythm.titre}
                            </span>
                            {revCount > 0 && (
                              <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30 flex items-center gap-0.5">
                                <span>🙋</span>
                                <span>{revCount} demande{revCount > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${stats.bg} ${stats.color}`}>
                              {stats.text}
                            </span>
                            {(revCount > 0 || (stats.total > 0 && stats.pct < 75)) && (
                              <button
                                type="button"
                                onClick={() => handlePinNote(rhythm.titre, 'Danse', revCount)}
                                className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#fdfaf2] border border-encre-noire/20 rounded hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                                title="Épingler au bloc-notes"
                              >
                                📌
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CordelCard>
            )}

            {/* VUE 3 : CHANTS & TOADAS (AVEC CALCUL HYBRIDE ET ALERTES) */}
            {activeAnalyseTab === 'toadas' && (
              <MestreToadasAnalytics 
                profileData={profileData} 
                allSongs={songs} 
                usersData={usersData}
                evaluationsMap={evaluationsMap}
                revisionsCountMap={revisionsCountMap}
                onPinNote={handlePinNote}
              />
            )}

            {/* VUE 4 : ADMINISTRATION SAISON */}
            {activeAnalyseTab === 'admin' && (
              <CordelCard variant="default" className="p-8 border-cordel-rouge/30 bg-cordel-rouge/5">
                <h3 className="text-lg font-black uppercase tracking-wider text-cordel-rouge mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Remise à zéro annuelle</span>
                </h3>
                <p className="text-xs md:text-sm font-bold text-encre-noire/80 mb-6 leading-relaxed">
                  Pour préparer la nouvelle saison, vous pouvez remettre à zéro l'ensemble des évaluations de tous les membres (Rythmes, Chants, Danse...). Les membres conserveront leurs badges d'ancienneté et leurs comptes, mais devront repasser les tests et auto-évaluations pour remplir à nouveau leur parcours.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllEvaluations}
                  className="px-6 py-3 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black uppercase tracking-widest rounded shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  🔄 Réinitialiser les compteurs
                </button>
              </CordelCard>
            )}

          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* ZONE 3 : BLOC-NOTES PERSISTANT & PROGRAMMATION VERS L'AGENDA               */}
      {/* ========================================================================= */}
      <section aria-label="Bloc-notes persistant et ordre du jour de répétition" className="w-full mt-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
              <span>📓</span>
              <span>Ordre du jour &amp; Bloc-notes de répétition</span>
            </h2>
            <span className="text-[10px] text-encre-noire/60 font-semibold">
              Persisté dans Firestore • Passerelle directe vers l'Agenda
            </span>
          </div>

          <MestrePedagogyNotepad groupId={groupId} />
        </div>
      </section>

      {/* Modale d'action rapide : programmer directement un point chaud en répétition */}
      {itemToProgramDirect && (
        <ProgramRehearsalModal
          isOpen={Boolean(itemToProgramDirect)}
          onClose={() => setItemToProgramDirect(null)}
          groupId={groupId}
          item={itemToProgramDirect}
          onSuccess={(setlistItem, ev) => {
            const evName = ev ? (ev.titre || ev.title || 'la répétition') : 'la répétition';
            setProgramDirectSuccess(`« ${setlistItem.titre} » ajouté au fil conducteur de ${evName} !`);
            setTimeout(() => setProgramDirectSuccess(null), 4000);
          }}
        />
      )}

    </div>
  );
}
