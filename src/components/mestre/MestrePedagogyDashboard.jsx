import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import MestrePedagogyNotepad from './MestrePedagogyNotepad';
import MestreToadasAnalytics from '../pedagogy/MestreToadasAnalytics';

export default function MestrePedagogyDashboard({ profileData }) {
  const groupId = profileData?.groupId;
  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

  const [activeTab, setActiveTab] = useState('analytics');
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
        // 1. Fetch Users
        const qUsers = query(collection(db, 'users'), where('groupId', '==', groupId));
        const usersSnap = await getDocs(qUsers);
        const users = [];
        usersSnap.forEach(d => {
          if (d.data().status === 'active') { // Only active members
            users.push({ id: d.id, ...d.data() });
          }
        });
        setUsersData(users);

        // 2. Fetch all Evaluations for these users
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

        // 3. Fetch Documents (Songs & Fiches)
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

        // 4. Fetch Rhythms from Metadata & Evals
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
    if (!window.confirm("⚠️ Êtes-vous sûr de vouloir remettre à zéro TOUTES les évaluations de tous les membres ?\nCette action est irréversible et recommandée uniquement pour démarrer une nouvelle saison (remise à zéro des compteurs).")) return;
    
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
            📊 Analyse & Suivi
          </h1>
          <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 max-w-2xl mt-2">
            Analyse globale des résultats (QCM) et de la Santé de la Troupe.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Onglets */}
          <div className="flex border-b-2 border-dashed border-cordel-master-dark/30 mb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeTab === 'analytics' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
            >
              📊 Analyse QCM
            </button>
            <button
              onClick={() => setActiveTab('percussion')}
              className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeTab === 'percussion' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
            >
              🥁 Santé Percussion
            </button>
            <button
              onClick={() => setActiveTab('danse')}
              className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeTab === 'danse' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
            >
              💃 Danse
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeTab === 'culture' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
            >
              📚 Ateliers & Culture
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap ${activeTab === 'admin' ? 'text-cordel-wood border-b-4 border-cordel-wood' : 'text-cordel-master-dark/50'}`}
            >
              ⚙️ Administration
            </button>
          </div>

          {loading ? (
            <div className="text-center p-12 opacity-50 animate-pulse font-black uppercase text-xs">
              Analyse des parcours en cours...
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {activeTab === 'analytics' && (
                <MestreToadasAnalytics profileData={profileData} allSongs={songs} />
              )}
              
              {activeTab === 'percussion' && (
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

              {activeTab === 'danse' && (
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

              {activeTab === 'culture' && (
                <div className="flex flex-col gap-6">
                  <CordelCard variant="default" className="p-5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 mb-4">
                      🎤 Chants & Toadas
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {songs.map(song => {
                        const stats = getStatsForItem(song.id, usersData);
                        if (stats.total === 0) return null;
                        return (
                          <div key={song.id} className="flex justify-between items-center p-3 bg-[#fdfaf2] border border-dashed border-encre-noire/15 rounded">
                            <span className="text-xs font-bold text-encre-noire flex-1">{song.titre}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${stats.bg} ${stats.color}`}>
                                {stats.text}
                              </span>
                              {stats.pct < 75 && (
                                <button
                                  onClick={() => handlePinNote(song.titre, 'Chant')}
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

                  <CordelCard variant="default" className="p-5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 mb-4">
                      📚 Fiches Interactives (Ateliers & Culture)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {fiches.map(fiche => {
                        const stats = getStatsForItem(fiche.id, usersData);
                        if (stats.total === 0) return null;
                        return (
                          <div key={fiche.id} className="flex justify-between items-center p-3 bg-[#fdfaf2] border border-dashed border-encre-noire/15 rounded">
                            <span className="text-xs font-bold text-encre-noire flex-1">{fiche.titre}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${stats.bg} ${stats.color}`}>
                                {stats.text}
                              </span>
                              {stats.pct < 75 && (
                                <button
                                  onClick={() => handlePinNote(fiche.titre, 'Culture')}
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
                </div>
              )}
              
              {activeTab === 'admin' && (
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

        {/* Sidebar Bloc-Notes */}
        <div className="w-full xl:w-1/3 xl:sticky xl:top-4">
          <MestrePedagogyNotepad groupId={groupId} />
        </div>
      </div>
    </div>
  );
}
