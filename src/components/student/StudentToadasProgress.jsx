import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import AutoEvalQuizContainer from './AutoEvalQuizContainer';
import { calculateToadaScore, calculateGlobalNacaoScore, getProgressColor } from '../../utils/toadaProgressEngine';

export default function StudentToadasProgress({ profileData, allSongs = [], allSheets = [] }) {
  const [quizHistory, setQuizHistory] = useState([]);
  const [activeToadaId, setActiveToadaId] = useState(null); // Pour lancer un quiz ciblé

  useEffect(() => {
    if (!profileData?.uid) return;
    const userRef = doc(db, 'users', profileData.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().quizHistory) {
        setQuizHistory(docSnap.data().quizHistory);
      }
    });
    return () => unsub();
  }, [profileData?.uid]);

  // Si on a sélectionné un chant pour révision ciblée
  if (activeToadaId) {
    return (
      <AutoEvalQuizContainer 
        profileData={profileData} 
        allSongs={allSongs} 
        allSheets={allSheets} 
        initialTheme="toadas"
        targetedToadaId={activeToadaId}
        onExit={() => setActiveToadaId(null)}
      />
    );
  }

  // Filtrer les chansons actives (non archivées)
  const activeSongs = allSongs.filter(s => !s.isArchived);
  
  // Calcul global
  const globalScore = calculateGlobalNacaoScore(activeSongs, quizHistory);
  const globalColor = getProgressColor(globalScore);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-4 select-none">
      
      {/* HEADER & JAUGE GLOBALE */}
      <CordelCard className="p-6 md:p-8 flex flex-col gap-6 text-center border-2 border-dashed border-cordel-wood/30">
        <h2 className="text-2xl md:text-3xl font-cactus uppercase text-cordel-wood tracking-widest">
          Maîtrise de la Nação
        </h2>
        <p className="text-xs text-cordel-master-dark opacity-80 mb-2">
          Progression globale basée sur vos auto-évaluations ciblées par Toada.
        </p>
        <div className="bg-cordel-ocre/10 border-l-4 border-cordel-ocre p-3 text-left rounded-r max-w-2xl mx-auto">
          <p className="text-xs font-bold text-cordel-master-dark flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Où écouter et lire les toadas ?</strong><br/>
              Avant de tester tes connaissances, retrouve tous les chants (audios, paroles, traductions) dans le <strong>Varal des Toadas</strong>, situé tout en bas de la page d'accueil !
            </span>
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black uppercase text-encre-noire/50">Novice</span>
            <span className="text-xl font-black" style={{ color: globalColor }}>{globalScore}%</span>
            <span className="text-[10px] font-black uppercase text-encre-noire/50">Mestre</span>
          </div>
          <div className="h-4 w-full bg-encre-noire/5 rounded-full overflow-hidden border border-encre-noire/10">
            <div 
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${globalScore}%`, backgroundColor: globalColor }}
            />
          </div>
        </div>
      </CordelCard>

      {/* GRILLE DES TOADAS */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-cordel-wood border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
          Détail du Répertoire ({activeSongs.length} Chants)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activeSongs.map(song => {
            const { score, level, badge } = calculateToadaScore(song.id, quizHistory);
            const color = getProgressColor(score);
            
            return (
              <div key={song.id} className="bg-white p-4 rounded-xl border-2 border-encre-noire/10 flex flex-col justify-between gap-4 hover:border-cordel-wood/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-black text-sm text-encre-noire leading-tight">
                    {song.titre}
                  </h4>
                  <span className="text-xl" title={level}>{badge}</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span style={{ color }}>{level}</span>
                    <span className="text-encre-noire/50">{score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-encre-noire/5 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
                  </div>
                </div>

                <CordelButton 
                  variant="secondary" 
                  onClick={() => setActiveToadaId(song.id)}
                  className="w-full text-[10px] py-1.5 mt-2 font-black uppercase"
                >
                  🎯 Réviser ce chant
                </CordelButton>
              </div>
            );
          })}
        </div>
        
        {activeSongs.length === 0 && (
          <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
            <p className="text-sm font-bold">Aucune Toada trouvée dans le répertoire actif.</p>
          </div>
        )}
      </div>

    </div>
  );
}
