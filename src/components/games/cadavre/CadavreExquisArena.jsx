import React, { useMemo } from 'react';
import CordelCard from '../../CordelCard';
import CadavreStepPicker from './CadavreStepPicker';
import CadavreCouncilView from './CadavreCouncilView';
import CadavreSentenceView from './CadavreSentenceView';
import { 
  getPieceInstruments, generatePatternChoices, 
  generateSignalChoices, getPieceCultureBonus, getActiveSeasonPieces 
} from '../../../utils/cadavreExquisGenerator';

/**
 * Arène principale du mode coopératif Cadavre Exquis Polyrythmique.
 * Gère le décalage circulaire des rôles et l'aiguillage entre le relais, le conseil et la sentence.
 */
export default function CadavreExquisArena({
  roomData = {},
  currentUserId,
  repertoireList = [],
  varalList = [],
  onSubmitChainStep,
  onSubmitCouncilVote,
  onEvaluateRoundResult,
  onAdvanceToNextRound,
  onFinishGame
}) {
  const {
    id: roomId, playerOrder = [], players = {}, currentRoundIndex = 0,
    totalRounds = 1, roundPhase = 'step_piece', chain = {},
    councilVotes = {}, teamScore = 0, roundEvaluation, stepChoices = [],
    roundTruth = {}, hostUid
  } = roomData;

  const isHost = currentUserId === hostUid;
  const N = playerOrder.length || 1;

  // Calcul du joueur actif par étape avec décalage circulaire
  const stepOffset = useMemo(() => {
    switch (roundPhase) {
      case 'step_piece': return 0;
      case 'step_instrument': return 1;
      case 'step_pattern': return 2;
      case 'step_signal': return 3;
      case 'step_bonus': return 4;
      default: return 0;
    }
  }, [roundPhase]);

  const activePlayerUid = playerOrder[(currentRoundIndex + stepOffset) % N];
  const activePlayerName = players[activePlayerUid]?.name || 'Camarade';

  // Gestion de la sélection d'étape
  const handleSelectChoice = (choice) => {
    if (roundPhase === 'step_piece') {
      const instruments = getPieceInstruments(choice);
      onSubmitChainStep(roomId, 'piece', choice, 'step_instrument', instruments);
    } else if (roundPhase === 'step_instrument') {
      const patternGen = generatePatternChoices(chain.piece, choice, repertoireList);
      onSubmitChainStep(roomId, 'instrument', choice, 'step_pattern', patternGen.choices, {
        patternCorrectIndex: patternGen.correctIndex
      });
    } else if (roundPhase === 'step_pattern') {
      const isCorrect = choice.choiceIndex === (roundTruth.patternCorrectIndex ?? 0);
      const signalGen = generateSignalChoices(chain.piece, repertoireList);
      onSubmitChainStep(roomId, 'patternChoice', { ...choice, isCorrect }, 'step_signal', signalGen.choices, {
        signalCorrectIndex: signalGen.correctIndex
      });
    } else if (roundPhase === 'step_signal') {
      const isCorrect = choice.choiceIndex === (roundTruth.signalCorrectIndex ?? 0);
      const bonus = getPieceCultureBonus(chain.piece, varalList);
      if (bonus) {
        const bonusChoices = [bonus.correctChoice, ...bonus.distractors].sort(() => Math.random() - 0.5);
        const bonusCorrectIndex = bonusChoices.indexOf(bonus.correctChoice);
        onSubmitChainStep(roomId, 'signalChoice', { ...choice, isCorrect }, 'step_bonus', bonusChoices, {
          bonusCorrectIndex
        });
      } else {
        onSubmitChainStep(roomId, 'signalChoice', { ...choice, isCorrect }, 'council', null);
      }
    } else if (roundPhase === 'step_bonus') {
      const isCorrect = choice.choiceIndex === (roundTruth.bonusCorrectIndex ?? 0);
      onSubmitChainStep(roomId, 'bonusChoice', { ...choice, isCorrect }, 'council', null);
    }
  };

  // Évaluation de la manche par l'hôte à l'issue du conseil
  const handleEvaluateRound = () => {
    const patternOk = chain.patternChoice?.isCorrect !== false;
    const signalOk = chain.signalChoice?.isCorrect !== false;
    const bonusOk = chain.bonusChoice ? chain.bonusChoice?.isCorrect !== false : true;
    const isPerfect = patternOk && signalOk && bonusOk;

    if (isPerfect) {
      onEvaluateRoundResult(roomId, 1000, {
        isPerfect: true, isSavedByCouncil: false, pointsEarned: 1000,
        explanation: 'Arrangement sans faute ! La batterie résonne d\'un seul souffle.'
      });
      return;
    }

    const failedSteps = [];
    if (!patternOk) failedSteps.push('pattern');
    if (!signalOk) failedSteps.push('signal');
    if (!bonusOk) failedSteps.push('bonus');

    // Sauvetage solidaire : au moins un joueur a voté une faille sur un maillon défaillant
    const isSaved = Object.values(councilVotes || {}).some(
      v => !v.isValid && failedSteps.includes(v.suspectedStep)
    );

    if (isSaved) {
      onEvaluateRoundResult(roomId, 500, {
        isPerfect: false, isSavedByCouncil: true, pointsEarned: 500,
        explanation: `Une faute sur [${failedSteps.join(', ')}] a été repérée par le Conseil ! 500 points d'Axé sauvés.`
      });
    } else {
      onEvaluateRoundResult(roomId, 0, {
        isPerfect: false, isSavedByCouncil: false, pointsEarned: 0,
        explanation: `Une fausse note sur [${failedSteps.join(', ')}] n'a pas été démasquée par le Conseil. 0 point.`
      });
    }
  };

  const handleNextRound = () => {
    const activePieces = getActiveSeasonPieces(repertoireList);
    onAdvanceToNextRound(roomId, currentRoundIndex + 1, totalRounds, activePieces.slice(0, 4));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Barre de Progression & Jauge d'Axé Collective */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <div>
              <span className="text-[10px] font-mono font-bold text-cordel-wood uppercase block">
                Manche {currentRoundIndex + 1} / {totalRounds}
              </span>
              <h3 className="text-xs font-black uppercase text-encre-noire">Cadavre Exquis Polyrythmique</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-cordel-master-dark uppercase block">Axé Collectif</span>
            <span className="text-sm font-black font-mono text-cordel-vert">{teamScore} pts</span>
          </div>
        </div>
      </CordelCard>

      {/* Aiguillage selon la phase */}
      {roundPhase.startsWith('step_') && (
        <CadavreStepPicker
          roundPhase={roundPhase}
          stepChoices={stepChoices}
          activePlayerUid={activePlayerUid}
          activePlayerName={activePlayerName}
          currentUserId={currentUserId}
          onSelectChoice={handleSelectChoice}
          piece={chain.piece}
          instrument={chain.instrument}
        />
      )}

      {roundPhase === 'council' && (
        <CadavreCouncilView
          chain={chain}
          councilVotes={councilVotes}
          players={players}
          currentUserId={currentUserId}
          isHost={isHost}
          onVote={(isValid, suspected) => onSubmitCouncilVote(roomId, currentUserId, isValid, suspected)}
          onEvaluateRound={handleEvaluateRound}
        />
      )}

      {roundPhase === 'sentence' && (
        <CadavreSentenceView
          roundEvaluation={roundEvaluation}
          chain={chain}
          currentRoundIndex={currentRoundIndex}
          totalRounds={totalRounds}
          isHost={isHost}
          onNextRound={handleNextRound}
          onFinishGame={() => onFinishGame(roomId)}
        />
      )}
    </div>
  );
}
