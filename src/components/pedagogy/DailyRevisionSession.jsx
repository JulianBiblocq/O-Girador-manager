import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AutoEvalQuizContainer from '../student/AutoEvalQuizContainer';
import { getDailyRevisionSession } from '../../utils/spacedRepetitionEngine';
import { generateQuizFromSheet, generateQuizFromSong } from '../../utils/quizGenerator';
import { generateTranslationQuiz } from '../../utils/translationQuizEngine';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SeloAxeStamp from '../SeloAxeStamp';

export default function DailyRevisionSession({ profileData, allSongs = [], allSheets = [], onExit }) {
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      if (!profileData?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // 1. Récupérer l'historique Spaced Repetition de l'utilisateur
        const groupId = profileData?.groupId || 'default';
        const srRef = doc(db, 'users', profileData.uid, 'spaced_repetition', groupId);
        const srSnap = await getDoc(srRef);
        const srData = srSnap.exists() ? srSnap.data() : {};

        // 2. Générer TOUTES les questions possibles (virtuellement)
        // Note: Pour optimiser à grande échelle, on pourrait le faire par petits lots, 
        // mais pour l'instant on génère tout le catalogue pour pouvoir filtrer.
        const allPossible = [];
        
        // Traductions
        allPossible.push(...generateTranslationQuiz({ count: 100, direction: 'MIXED' }));
        
        // Fiches (Culture / Atelier)
        for (const sheet of allSheets) {
          allPossible.push(...generateQuizFromSheet(sheet, allSheets, allSongs, { difficulty: 'medium' }));
        }
        
        // Chants
        for (const song of allSongs) {
          allPossible.push(...generateQuizFromSong(song, allSongs, allSheets, { askRythme: true, askNacao: true, askLexique: true, difficulty: 'medium' }));
        }

        // 3. Filtrer et trier grâce au moteur de répétition espacée
        const todaysSession = getDailyRevisionSession(allPossible, srData, 15);
        
        setSessionQuestions(todaysSession);
      } catch (err) {
        console.error("Erreur lors de la préparation de la session de révision :", err);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [profileData, allSongs, allSheets]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-cordel-master-dark font-cactus text-xl animate-pulse">Préparation de ta session...</p>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <CordelCard className="p-8 flex flex-col items-center text-center gap-6 bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30">
          <div className="absolute top-4 right-4 rotate-12 opacity-80">
            <SeloAxeStamp type="orixa" color="#c05621" size="lg" />
          </div>
          
          <h2 className="text-3xl font-black uppercase font-cactus text-cordel-wood tracking-widest mt-4">
            Révision du Jour
          </h2>
          
          <p className="text-cordel-master-dark opacity-90 leading-relaxed">
            Notre système a analysé tes précédentes réponses. Aujourd'hui, tu as <strong>{sessionQuestions.length} questions</strong> en attente de révision pour renforcer ta mémoire à long terme.
          </p>

          <div className="flex gap-4 mt-4">
            <CordelButton variant="primary" onClick={() => setIsStarted(true)}>
              🚀 Démarrer la session ({sessionQuestions.length})
            </CordelButton>
            {onExit && (
              <CordelButton variant="outline" onClick={onExit}>
                Plus tard
              </CordelButton>
            )}
          </div>
        </CordelCard>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <AutoEvalQuizContainer
        profileData={profileData}
        allSongs={allSongs}
        allSheets={allSheets}
        initialTheme="daily_revision"
        preGeneratedQuestions={sessionQuestions}
        onExit={onExit}
      />
    </div>
  );
}
