import React, { useState, useEffect, useRef } from 'react';
import CordelCard from '../CordelCard';
import GameQuestionCard from './GameQuestionCard';
import GameAnswerGrid from './GameAnswerGrid';
import GameArenaScores from './GameArenaScores';

const QUESTION_DURATION_MS = 10000;
const REVEAL_DURATION_MS = 4000;

/**
 * Vue principale de l'Arène de jeu en direct quand status === 'playing'.
 * Gère les timers locaux (10s question, 4s reveal) et les transitions orchestrées par l'hôte.
 */
export default function GameArenaView({
  roomData,
  currentUserId,
  isHost,
  onAdvanceReveal,
  onNextQuestion,
  onFinishGame,
  onSubmitAnswer,
  onLeave
}) {
  const roomId = roomData?.id;
  const questions = roomData?.questions || [];
  const currentQuestionIndex = roomData?.currentQuestionIndex || 0;
  const currentQuestion = questions[currentQuestionIndex] || null;
  const phase = roomData?.phase || 'question';
  const players = roomData?.players || {};
  const playerIds = Object.keys(players);
  const myAnswerData = players[currentUserId]?.currentAnswer || null;
  const mySelectedIndex = myAnswerData !== null ? myAnswerData.choiceIndex : null;

  // Calcul du temps restant
  const [now, setNow] = useState(Date.now());
  const transitionTriggeredRef = useRef(false);

  useEffect(() => {
    transitionTriggeredRef.current = false;
  }, [currentQuestionIndex, phase]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const startedAt = roomData?.questionStartedAt || now;
  const elapsed = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, QUESTION_DURATION_MS - elapsed);
  const remainingRatio = remainingMs / QUESTION_DURATION_MS;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  // Vérifier si tous les joueurs ont répondu
  const allAnswered = playerIds.length > 0 && playerIds.every(
    uid => players[uid]?.currentAnswer !== undefined && players[uid]?.currentAnswer !== null
  );

  // Transitions orchestrées par l'hôte
  useEffect(() => {
    if (!isHost || !roomId || transitionTriggeredRef.current) return;

    if (phase === 'question') {
      if (remainingMs <= 0 || allAnswered) {
        transitionTriggeredRef.current = true;
        onAdvanceReveal(roomId);
      }
    } else if (phase === 'reveal') {
      if (elapsed >= REVEAL_DURATION_MS) {
        transitionTriggeredRef.current = true;
        if (currentQuestionIndex < questions.length - 1) {
          onNextQuestion(roomId, currentQuestionIndex + 1, playerIds);
        } else {
          onFinishGame(roomId);
        }
      }
    }
  }, [
    isHost, roomId, phase, remainingMs, elapsed, allAnswered,
    currentQuestionIndex, questions.length, playerIds,
    onAdvanceReveal, onNextQuestion, onFinishGame
  ]);

  // Clic joueur sur une réponse
  const handleSelectChoice = (choiceIndex) => {
    if (phase !== 'question' || mySelectedIndex !== null || !currentQuestion) return;
    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    onSubmitAnswer(roomId, currentUserId, choiceIndex, isCorrect, remainingRatio);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-fade-in">
      <div className="relative w-full max-w-2xl z-10 max-h-[92vh] flex flex-col">
        <CordelCard variant="default" useExtremeBorder={true} className="p-4 sm:p-5 flex flex-col overflow-y-auto scrollbar-thin text-left">
          {/* Bandeau des participants et scores */}
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-cordel-master-dark/20">
            <GameArenaScores players={players} currentUserId={currentUserId} phase={phase} />
            <button
              type="button"
              onClick={onLeave}
              className="text-xs font-bold text-neutral-400 hover:text-red-700 px-2 py-1 rounded cursor-pointer transition-all"
              title="Quitter la partie"
            >
              ✕
            </button>
          </div>

          {/* Carte de la question */}
          <div className="mt-2">
            <GameQuestionCard
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length || 5}
              theme={roomData?.theme}
              remainingRatio={remainingRatio}
              remainingSeconds={remainingSeconds}
              phase={phase}
            />
          </div>

          {/* Grille des réponses */}
          {currentQuestion && (
            <GameAnswerGrid
              choices={currentQuestion.choices}
              correctIndex={currentQuestion.correctIndex}
              selectedIndex={mySelectedIndex}
              phase={phase}
              explanation={currentQuestion.explanation}
              onSelectChoice={handleSelectChoice}
            />
          )}
        </CordelCard>
      </div>
    </div>
  );
}
