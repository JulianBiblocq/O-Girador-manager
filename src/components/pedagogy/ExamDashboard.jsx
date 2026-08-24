import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SeloAxeStamp from '../SeloAxeStamp';
import AutoEvalQuizContainer from '../student/AutoEvalQuizContainer';

const EXAMS_CONFIG = [
  {
    id: 'culture_level_1',
    title: "Examen Culture (Niveau 1)",
    description: "Validez vos connaissances générales sur la culture, l'histoire et les bases du maracatu.",
    theme: 'culture',
    difficulty: 'easy',
    passScore: 0.8, // 80%
    questionCount: 20
  },
  {
    id: 'percussion_expert',
    title: "Examen Percussion (Expert)",
    description: "Reconnaissance auditive avancée des rythmes et variations du séquenceur.",
    theme: 'percussion',
    difficulty: 'expert',
    passScore: 0.85,
    questionCount: 15
  },
  {
    id: 'grand_mestre',
    title: "Le Grand Examen du Mestre",
    description: "Le test ultime transversal (Chants, Traductions, Rythmes, Culture).",
    theme: 'MIX',
    difficulty: 'mestre',
    passScore: 0.9,
    questionCount: 30
  }
];

export default function ExamDashboard({ profileData, allSongs = [], allSheets = [], onExit }) {
  const [certifications, setCertifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState(null); // exam config object
  const [examResult, setExamResult] = useState(null); // { score, passed }

  useEffect(() => {
    const fetchCertifications = async () => {
      if (!profileData?.uid) {
        setLoading(false);
        return;
      }
      try {
        const groupId = profileData?.groupId || 'default';
        const certRef = doc(db, 'users', profileData.uid, 'certifications', groupId);
        const certSnap = await getDoc(certRef);
        if (certSnap.exists()) {
          setCertifications(certSnap.data());
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des certifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertifications();
  }, [profileData]);

  const handleExamExit = async (scoreObj) => {
    // Si l'utilisateur quitte en cours de route, scoreObj sera null ou incomplet
    if (scoreObj && activeExam) {
      const percentage = scoreObj.score / scoreObj.total;
      const passed = percentage >= activeExam.passScore;
      
      setExamResult({ 
        score: percentage, 
        passed, 
        examTitle: activeExam.title 
      });

      // Si réussi, on enregistre la certification
      if (passed && profileData?.uid) {
        try {
          const groupId = profileData?.groupId || 'default';
          const certRef = doc(db, 'users', profileData.uid, 'certifications', groupId);
          const currentData = { ...certifications };
          currentData[activeExam.id] = {
            passedAt: new Date().toISOString(),
            score: percentage,
            difficulty: activeExam.difficulty
          };
          
          await setDoc(certRef, currentData, { merge: true });
          setCertifications(currentData);
        } catch (err) {
          console.error("Erreur lors de l'enregistrement de la certification", err);
        }
      }
    }
    setActiveExam(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-cordel-master-dark font-cactus text-xl animate-pulse">Chargement de vos diplômes...</p>
      </div>
    );
  }

  // --- RENDU D'UN EXAMEN EN COURS ---
  if (activeExam) {
    return (
      <div className="w-full relative">
        <div className="bg-cordel-rouge text-[#fdfaf2] text-center font-bold p-2 uppercase tracking-widest font-cactus text-xl">
          MODE EXAMEN STRICT
        </div>
        <AutoEvalQuizContainer
          profileData={profileData}
          allSongs={allSongs}
          allSheets={allSheets}
          initialTheme={activeExam.theme}
          onExit={(scoreObj) => handleExamExit(scoreObj)}
          isExamMode={true}
          examConfig={activeExam}
        />
      </div>
    );
  }

  // --- RENDU DES RESULTATS D'EXAMEN ---
  if (examResult) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <CordelCard className="p-8 flex flex-col items-center text-center gap-6 bg-[#fdfaf2] border-2 border-dashed border-cordel-wood/30">
          <SeloAxeStamp 
            type={examResult.passed ? 'orixa' : 'outil'} 
            color={examResult.passed ? '#2d6a4f' : '#8b2a1a'} 
            size="lg" 
          />
          <h2 className={`text-3xl font-black uppercase font-cactus tracking-widest mt-4 ${examResult.passed ? 'text-cordel-vert' : 'text-cordel-rouge'}`}>
            {examResult.passed ? "Examen Réussi !" : "Examen Échoué"}
          </h2>
          <p className="text-cordel-master-dark text-lg font-bold">
            {examResult.examTitle}
          </p>
          <p className="text-cordel-master-dark opacity-90 leading-relaxed text-xl">
            Votre score : <strong>{Math.round(examResult.score * 100)}%</strong>
          </p>
          
          <p className="italic opacity-70">
            {examResult.passed 
              ? "Bravo ! Le badge a été ajouté à votre profil." 
              : "Ce n'est pas grave, continuez à réviser avec la Révision du Jour et retentez votre chance !"}
          </p>

          <div className="mt-4">
            <CordelButton variant="primary" onClick={() => setExamResult(null)}>
              Retour aux Examens
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  // --- RENDU DU DASHBOARD ---
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase font-cactus text-cordel-wood tracking-widest">
          Certifications & Examens
        </h2>
        <p className="text-sm opacity-80 mt-2">
          Passez les tests officiels pour valider vos connaissances et débloquer des badges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXAMS_CONFIG.map(exam => {
          const isPassed = certifications[exam.id];
          return (
            <CordelCard key={exam.id} className="flex flex-col relative overflow-hidden bg-white/50 border-cordel-wood/20">
              {isPassed && (
                <div className="absolute -top-6 -right-6 opacity-20 pointer-events-none">
                  <SeloAxeStamp type="orixa" color="#2d6a4f" size="xl" />
                </div>
              )}
              
              <div className="p-4 flex-grow flex flex-col gap-3">
                <h3 className="font-cactus text-xl text-cordel-wood font-bold uppercase leading-tight">
                  {exam.title}
                </h3>
                <p className="text-sm opacity-80 text-justify">
                  {exam.description}
                </p>
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-cordel-wood/10 rounded w-fit">
                    Score requis : {exam.passScore * 100}%
                  </span>
                  <span className="text-xs font-bold px-2 py-1 bg-cordel-wood/10 rounded w-fit">
                    {exam.questionCount} questions
                  </span>
                </div>
              </div>

              <div className="bg-cordel-wood/5 p-3 flex justify-between items-center border-t border-cordel-wood/10">
                {isPassed ? (
                  <div className="text-cordel-vert font-bold flex items-center gap-2 text-sm">
                    ✅ Acquis le {new Date(isPassed.passedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <CordelButton variant="secondary" onClick={() => setActiveExam(exam)} className="w-full">
                    Passer l'examen
                  </CordelButton>
                )}
              </div>
            </CordelCard>
          );
        })}
      </div>
    </div>
  );
}
