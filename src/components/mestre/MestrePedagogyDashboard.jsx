import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import MestrePedagogyNotepad from './MestrePedagogyNotepad';
import MestreToadasAnalytics from '../pedagogy/MestreToadasAnalytics';
import useConfirm from '../../hooks/useConfirm';

export default function MestrePedagogyDashboard({ profileData }) {
  const { confirm } = useConfirm();
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [activeAnalyseTab, setActiveAnalyseTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);
  const [evaluationsMap, setEvaluationsMap] = useState({}); // { uid: { docId: 'level' } }
  
  // Data models
  const [rhythms, setRhythms] = useState([]);
  const [songs, setSongs] = useState([]);
  const [fiches, setFiches] = useState([]);

  useEffect(() => {
    if (!groupId || !isAuthorized) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer Users
        const qUsers = query(collection(db, 'users'), where('groupId', '==', groupId));
        const usersSnap = await getDocs(qUsers);
        const users = [];
        usersSnap.forEach(d => {
          if (d.data().status === 'active') { // Only active members
            users.push({ id: d.id, ...d.data() });
          }
        });
        setUsersData(users);

        // 2. Récupérer all Evaluations for these users
        const evals = {};
        await Promise.all(users.map(async (u) => {
          try {
            const docRef = doc(db, 'users', u.id, 'parcours', groupId);
            const { getDoc } = await import('firebase/firestore');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              evals[u.id] = snap.data().evaluations || {};
            } else {
              evals[u.id] = {};
            }
          } catch (e) {
            evals[u.id] = {};
          }
        }));
        setEvaluationsMap(evals);

        // 3. Récupérer Documents (Songs & Fiches)
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

        // 4. Récupérer Rhythms from Metadata & Evals
        const qMeta = collection(db, 'associations', groupId, 'rhythmMetadata');
        const metaSnap = await getDocs(qMeta);
        const fetchedRhythms = [];
        metaSnap.forEach(d => {
          fetchedRhythms.push({ id: d.id, titre: d.id, ...d.data() });
        });
        
        const rhythmIds = new Set(fetchedRhythms.map(r => r.id));
        Object.values(evals).forEach(userEvals => {
          Object.keys(userEvals).forEach(key => {
            if (!fetchedSongs.find(s => s.id === key) && !fetchedFiches.find(f => f.id === key)) {
              if (key !== 'entretien_global' && !key.endsWith('_chant')) {
                rhythmIds.add(key);
              }
            }
          });
        });
        
        const completeRhythms = Array.from(rhythmIds).map(id => {
          const existing = fetchedRhythms.find(r => r.id === id);
          return existing || { id, titre: id.replace(/_/g, ' ') };
        });
        
        setRhythms(completeRhythms);

      } catch (err) {
        console.error("Error fetching pedagogy data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, isAuthorized]);

  const comfortLevels = {
    'decouverte': 1,
    'pratique': 2,
    'alaise': 3,
    'referent': 4
  };

  const getStatsForItem = (itemId, filteredUsers) => {
    let total = 0;
    let okCount = 0; // à l'aise or référent
    
    filteredUsers.forEach(u => {
      const e = evaluationsMap[u.id]?.[itemId];
      if (e) {
        total++;
        if (e === 'alaise' || e === 'referent' || e === 'oui') okCount++;
      }
    });

    if (total === 0) return { pct: 0, total, okCount, color: 'text-neutral-400', bg: 'bg-neutral-100', text: 'Aucune donnée' };
    
    const pct = Math.round((okCount / total) * 100);
    let color = 'text-[#8b2a1a]';
    let bg = 'bg-[#8b2a1a]/10';
    if (pct >= 75) { color = 'text-[#2d6a4f]'; bg = 'bg-[#2d6a4f]/20'; }
    else if (pct >= 50) { color = 'text-[#c05621]'; bg = 'bg-[#c05621]/20'; }

    return { pct, total, okCount, color, bg, text: `${pct}% (${okCount}/${total})` };
  };

  const handlePinNote = async (itemTitre, categoryInfo) => {
    try {
      const newNote = {
        id: `note_${Date.now()}`,
        titre: `🛠️ À travailler${categoryInfo ? ` [${categoryInfo}]` : ''}`,
        contenu: `Point de difficulté détecté sur : ${itemTitre}`,
        createdBy: profileData?.displayName || 'Mestre',
        createdAt: new Date().toISOString()
      };
      const noteRef = doc(db, 'associations', groupId, 'blocNotes', newNote.id);
      await setDoc(noteRef, newNote);
    } catch (e) {
      console.error("Erreur lors de l'épinglage", e);
    }
  };

  const handleResetAllEvaluations = async () => {
    const isOk = await confirm({
      title: "Remise à zéro annuelle",
      message: "⚠️ Êtes-vous sûr de vouloir remettre à zéro TOUTES les évaluations de tous les membres ?\nCette action est irréversible et recommandée uniquement pour démarrer une nouvelle saison (remise à zéro des compteurs).",
      confirmText: "Oui, réinitialiser les compteurs",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    
    setLoading(true);
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
      setLoading(false);
    }
  };

  if (!isAuthorized) return <div className="p-8 text-center">Accès refusé.</div>;

  const percuUsers = usersData.filter(u => !u.instrument?.toLowerCase().includes('danse'));
  const danseUsers = usersData.filter(u => u.instrument?.toLowerCase().includes('danse'));
  const pupitres = [...new Set(percuUsers.map(u => u.instrument || 'Non défini'))];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-left select-none p-4 md:p-8 force-light-theme relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase">
            📊 Suivi & Analyse
          </h1>
          <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 max-w-2xl mt-2">
            Analyse globale des résultats (QCM) et de la Santé de la Troupe.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-6">
              {/* Accordion Bloc-Notes (replié par défaut) */}
              <details className="group border-2 border-cordel-wood/30 rounded bg-[#fdfaf2] overflow-hidden w-full mb-2">
                 <summary className="flex items-center justify-between p-3 cursor-pointer bg-white hover:bg-cordel-wood/5 transition-colors" style={{ listStyle: 'none' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📓</span>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood">
                          Axes de travail & Notes de révision
                        </h3>
                        <span className="text-[10px] text-encre-noire/70 font-medium">
                          Cliquer pour déplier/replier vos notes et objectifs
                        </span>
                      </div>
                    </div>
                    <span className="text-cordel-wood font-black text-xs transform group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                 </summary>
                 <div className="p-4 border-t-2 border-dashed border-cordel-wood/20 bg-[#fdfaf2]">
                   <MestrePedagogyNotepad groupId={groupId} />
                 </div>
                 <style dangerouslySetInnerHTML={{__html: `summary::-webkit-details-marker { display: none; }`}} />
              </details>

              {/* Sous-Onglets Analyse */}
              <div className="flex border-b-2 border-dashed border-cordel-master-dark/30 mb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveAnalyseTab('analytics')}
                  className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeAnalyseTab === 'analytics' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
                >
                  📊 Analyse QCM
                </button>
                <button
                  onClick={() => setActiveAnalyseTab('percussion')}
                  className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeAnalyseTab === 'percussion' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
                >
                  🥁 Santé Percussion
                </button>
                <button
                  onClick={() => setActiveAnalyseTab('danse')}
                  className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeAnalyseTab === 'danse' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
                >
                  💃 Danse
                </button>
                <button
                  onClick={() => setActiveAnalyseTab('admin')}
                  className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeAnalyseTab === 'admin' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
                >
                  ⚙️ Administration
                </button>
              </div>

              {loading ? (
                <div className="text-center p-12 opacity-50 animate-pulse font-black uppercase text-xs">
                  Analyse des parcours en cours...
                </div>
              ) : (
                <div className="flex flex-col gap-6 w-full">
                  {/* Main Content: Analytics */}
                  {activeAnalyseTab === 'analytics' && (
                    <MestreToadasAnalytics profileData={profileData} allSongs={songs} />
                  )}
              
              {activeAnalyseTab === 'percussion' && (
                <div className="flex flex-col gap-6">
                  {pupitres.map(pupitre => {
                    const pupitreUsers = percuUsers.filter(u => (u.instrument || 'Non défini') === pupitre);
                    return (
                      <CordelCard key={pupitre} variant="default" className="p-5 flex flex-col gap-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
                          🪘 Pupitre : {pupitre} ({pupitreUsers.length} membres)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {rhythms.map(rhythm => {
                            const stats = getStatsForItem(rhythm.id, pupitreUsers);
                            if (stats.total === 0) return null; // Ne pas afficher si personne ne s'est évalué
                            return (
                              <div key={rhythm.id} className="flex justify-between items-center p-3 bg-[#fdfaf2] border border-dashed border-encre-noire/15 rounded">
                                <span className="text-xs font-bold text-encre-noire flex-1">{rhythm.titre}</span>
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black px-2 py-1 rounded ${stats.bg} ${stats.color}`}>
                                    {stats.text}
                                  </span>
                                  {stats.pct < 75 && (
                                    <button
                                      onClick={() => handlePinNote(rhythm.titre, pupitre)}
                                      className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-encre-noire/20 rounded hover:bg-neutral-100 hover:scale-105 transition-transform"
                                      title="Épingler dans le Bloc-notes"
                                    >
                                      📌 Épingler
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CordelCard>
                    );
                  })}
                </div>
              )}

              {activeAnalyseTab === 'danse' && (
                <CordelCard variant="default" className="p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
                    💃 Équipe Danse ({danseUsers.length} membres)
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {rhythms.map(rhythm => {
                      const stats = getStatsForItem(rhythm.id, danseUsers);
                      if (stats.total === 0) return null;
                      return (
                        <div key={rhythm.id} className="flex justify-between items-center p-3 bg-[#fdfaf2] border border-dashed border-encre-noire/15 rounded">
                          <span className="text-xs font-bold text-encre-noire flex-1">{rhythm.titre}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black px-2 py-1 rounded ${stats.bg} ${stats.color}`}>
                              {stats.text}
                            </span>
                            {stats.pct < 75 && (
                              <button
                                onClick={() => handlePinNote(rhythm.titre, 'Danse')}
                                className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-encre-noire/20 rounded hover:bg-neutral-100 hover:scale-105 transition-transform"
                              >
                                📌 Épingler
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CordelCard>
              )}
              
              {activeAnalyseTab === 'admin' && (
                <CordelCard variant="default" className="p-8 border-cordel-rouge/30 bg-cordel-rouge/5">
                  <h3 className="text-lg font-black uppercase tracking-wider text-cordel-rouge mb-4">
                    ⚠️ Remise à zéro annuelle
                  </h3>
                  <p className="text-sm font-bold text-encre-noire/80 mb-6">
                    Pour préparer la nouvelle saison, vous pouvez remettre à zéro l'ensemble des évaluations de tous les membres (Rythmes, Chants, QCM...). Les membres conserveront leurs badges d'ancienneté, mais devront repasser les tests et QCM pour remplir à nouveau leur parcours.
                  </p>
                  <button
                    onClick={handleResetAllEvaluations}
                    className="px-6 py-3 bg-cordel-rouge text-white font-black uppercase tracking-widest rounded shadow hover:scale-[1.02] transition-transform"
                  >
                    🔄 Réinitialiser les compteurs
                  </button>
                </CordelCard>
              )}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
