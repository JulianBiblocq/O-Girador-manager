import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { XiloCompass } from '../XiloIcons';

// New Sub-components
import MonCarnetAisance from './MonCarnetAisance';
import AtelierEntrainement from './AtelierEntrainement';

export default function MonParcours({ profileData, sequenceurUrl, enabledModules = {} }) {
  const groupId = profileData?.groupId;
  const userId = profileData?.uid;

  // New State: Two Main Views
  const [mainView, setMainView] = useState('CARNET'); // 'CARNET' or 'ATELIER'
  
  // Data States
  const [rhythms, setRhythms] = useState([]);
  const [rhythmsMetadata, setRhythmsMetadata] = useState({});
  const [rhythmsJsonData, setRhythmsJsonData] = useState({});
  
  const [songs, setSongs] = useState([]);
  const [educationalSheets, setEducationalSheets] = useState([]);
  
  const [evaluations, setEvaluations] = useState({}); // { [docId]: 'level' }
  const [saving, setSaving] = useState(false);
  
  const [qcmGlobalConfig, setQcmGlobalConfig] = useState({});

  useEffect(() => {
    if (!groupId || !userId) return;

    // 1. Récupérer Evaluations
    const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
    const unsubEval = onSnapshot(parcoursRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvaluations(docSnap.data().evaluations || {});
      }
    });

    // 2. Récupérer Rhythm Fallbacks (Mestre Metadata) & Global QCM Config
    const fetchMetadata = async () => {
      const q = collection(db, 'associations', groupId, 'rhythmMetadata');
      const snap = await getDocs(q);
      const meta = {};
      snap.forEach(d => { meta[d.id] = d.data(); });
      setRhythmsMetadata(meta);

      const assocRef = doc(db, 'associations', groupId);
      const assocSnap = await getDoc(assocRef);
      if (assocSnap.exists() && assocSnap.data().qcmGlobalConfig) {
        setQcmGlobalConfig(assocSnap.data().qcmGlobalConfig);
      }
    };

    // 3. Récupérer Rhythms from Storage
    const fetchRhythms = async () => {
      try {
        const folderRef = ref(storage, `documents/${groupId}/sequencer`);
        const res = await listAll(folderRef);
        const fetchedRhythms = await Promise.all(
          res.items.map(async (itemRef) => {
            const fileUrl = await getDownloadURL(itemRef);
            const rawName = itemRef.name;
            const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(rawName);
            const isJson = /\.json$/i.test(rawName);
            const cleanName = rawName.replace(/^\d+_/, '').replace(/\.(json|mp3|wav|ogg|m4a|aac)$/i, '');
            return { id: rawName, titre: cleanName, url: fileUrl, fileName: rawName, isAudio, isJson };
          })
        );
        fetchedRhythms.sort((a, b) => a.titre.localeCompare(b.titre));
        setRhythms(fetchedRhythms);
        
        // Récupérer JSON content for parsing
        fetchedRhythms.filter(r => r.isJson).forEach(async (r) => {
          try {
            const resp = await fetch(r.url);
            const data = await resp.json();
            setRhythmsJsonData(prev => ({ ...prev, [r.id]: data }));
          } catch (e) {
            console.error("Error fetching json for", r.titre, e);
          }
        });
      } catch (error) {
        console.error("Error fetching rhythms:", error);
      }
    };

    // 4. Récupérer Songs from Varal
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'documents'), where('groupId', '==', groupId), where('type', '==', 'song'));
        const snap = await getDocs(q);
        const fetchedSongs = [];
        snap.forEach(d => {
          const data = d.data();
          if (!data.isArchived) {
            fetchedSongs.push({ id: d.id, ...data });
          }
        });
        setSongs(fetchedSongs);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    // 5. Récupérer Fiches Pédagogiques
    const fetchFiches = async () => {
      try {
        const q = query(collection(db, 'documents'), where('groupId', '==', groupId), where('type', 'in', ['fiche_pedagogique', 'culture_fiche']));
        const snap = await getDocs(q);
        const fetchedFiches = [];
        snap.forEach(d => fetchedFiches.push({ id: d.id, ...d.data() }));
        setEducationalSheets(fetchedFiches);
      } catch (error) {
        console.error("Error fetching fiches:", error);
      }
    };

    fetchMetadata();
    fetchRhythms();
    fetchSongs();
    fetchFiches();

    return () => unsubEval();
  }, [groupId, userId]);

  const handleSetEvaluation = async (itemId, level) => {
    setSaving(true);
    try {
      const newEvals = { ...evaluations, [itemId]: level };
      const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
      await setDoc(parcoursRef, { evaluations: newEvals }, { merge: true });
    } catch (error) {
      console.error("Error saving evaluation:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-5xl mx-auto p-4 md:p-8 force-light-theme">
      {/* En-tête */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <h1 className="text-3xl md:text-4xl font-cactus tracking-widest text-cordel-wood uppercase flex items-center gap-3">
          <XiloCompass size={36} /> Mon Parcours
        </h1>
        <p className="text-xs md:text-sm text-cordel-master-dark opacity-80 text-center max-w-2xl">
          Déclare ton niveau d'aisance ou entraîne-toi avec les mini-jeux. Ton évolution est sauvegardée automatiquement.
        </p>
        <div className="bg-cordel-ocre/10 border-l-4 border-cordel-ocre p-3 mt-2 text-left rounded-r max-w-2xl w-full">
          <p className="text-xs font-bold text-cordel-master-dark flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Où apprendre et réviser ?</strong><br/>
              Avant de tester tes acquis ici, retrouve tous les détails (fiches complètes, audios, explications) dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !
            </span>
          </p>
        </div>
      </div>

      {/* Switch Vues Principales */}
      <div className="flex justify-center gap-4 border-b-2 border-dashed border-cordel-master-dark/30 pb-6 mb-4">
        <button
          onClick={() => setMainView('CARNET')}
          className={`px-6 py-3 text-sm md:text-base font-black uppercase tracking-widest rounded-lg transition-all border-2 ${
            mainView === 'CARNET'
              ? 'border-cordel-wood bg-cordel-wood text-[#fdfaf2] shadow-[4px_4px_0px_0px_#181716] scale-105' 
              : 'border-encre-noire/20 text-encre-noire/60 bg-white hover:border-encre-noire/50 hover:text-encre-noire'
          }`}
        >
          <span className="mr-2 block text-xl mb-1 text-center">📖</span>
          Carnet d'Aisance
        </button>

        <button
          onClick={() => setMainView('ATELIER')}
          className={`px-6 py-3 text-sm md:text-base font-black uppercase tracking-widest rounded-lg transition-all border-2 ${
            mainView === 'ATELIER'
              ? 'border-[#8b2a1a] bg-[#8b2a1a] text-[#fdfaf2] shadow-[4px_4px_0px_0px_#181716] scale-105' 
              : 'border-encre-noire/20 text-encre-noire/60 bg-white hover:border-encre-noire/50 hover:text-encre-noire'
          }`}
        >
          <span className="mr-2 block text-xl mb-1 text-center">🎯</span>
          Atelier d'Entraînement
        </button>
      </div>

      {/* Vues */}
      <div className="mt-4">
        {mainView === 'CARNET' ? (
          <MonCarnetAisance 
            evaluations={evaluations}
            handleSetEvaluation={handleSetEvaluation}
            rhythms={rhythms}
            rhythmsJsonData={rhythmsJsonData}
            rhythmsMetadata={rhythmsMetadata}
            songs={songs}
            educationalSheets={educationalSheets}
            sequenceurUrl={sequenceurUrl}
            enabledModules={enabledModules}
          />
        ) : (
          <AtelierEntrainement 
            profileData={profileData}
            songs={songs}
            educationalSheets={educationalSheets}
            rhythms={rhythms}
            rhythmsJsonData={rhythmsJsonData}
            sequenceurUrl={sequenceurUrl}
            qcmGlobalConfig={qcmGlobalConfig}
          />
        )}
      </div>

    </div>
  );
}
