import React, { useMemo } from 'react';
import CordelCard from '../../CordelCard';
import CadavreStepPicker from './CadavreStepPicker';
import CadavreCouncilView from './CadavreCouncilView';
import CadavreSentenceView from './CadavreSentenceView';
import {
  getPieceActiveInstruments, generatePatternChoices, generateSignalChoices,
  getPieceCultureBonus, getActiveSeasonPieces, getCircularActivePlayer, evaluateCadavreCouncilRound
} from '../../../utils/cadavreExquisGenerator';

/**
 * Arène principale du mode coopératif Cadavre Exquis Polyrythmique (< 130 lignes).
 * Gère le décalage circulaire des rôles et l'aiguillage entre le relais, le conseil et la sentence.
 */
export default function CadavreExquisArena({
  roomData = {}, currentUserId, repertoireList = [], varalList = [],
  onSubmitChainStep, onSubmitCouncilVote, onEvaluateRoundResult, onAdvanceToNextRound, onFinishGame
}) {
  const {
    id: roomId, playerOrder = [], players = {}, currentRoundIndex = 0,
    totalRounds = 1, roundPhase = 'step_piece', chain = {},
    councilVotes = {}, teamScore = 0, roundEvaluation, stepChoices = [],
    roundTruth = {}, hostUid
  } = roomData;

  const isHost = currentUserId === hostUid;
  const effectivePlayerOrder = useMemo(
    () => (playerOrder.length > 0 ? playerOrder : Object.keys(players)),
    [playerOrder, players]
  );

  // Calcul du maillon k avec décalage circulaire : playerOrder[(roundIndex + k) % N]
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

  const activePlayerUid = getCircularActivePlayer(effectivePlayerOrder, currentRoundIndex, stepOffset);
  const activePlayerName = players[activePlayerUid]?.name || 'Camarade';

  // Sélection d'un maillon de la chaîne
  const handleSelectChoice = (choice) => {
    if (roundPhase === 'step_piece') {
      const instruments = getPieceActiveInstruments(choice);
      onSubmitChainStep(roomId, 'piece', choice, 'step_instrument', instruments);
    } else if (roundPhase === 'step_instrument') {
      const patternGen = generatePatternChoices(chain.piece, choice, repertoireList);
      onSubmitChainStep(roomId, 'instrument', choice, 'step_pattern', patternGen.choices, { patternCorrectIndex: patternGen.correctIndex });
    } else if (roundPhase === 'step_pattern') {
      const isCorrect = choice.choiceIndex === (roundTruth.patternCorrectIndex ?? 0);
      const signalGen = generateSignalChoices(chain.piece, repertoireList);
      onSubmitChainStep(roomId, 'patternChoice', { ...choice, isCorrect }, 'step_signal', signalGen.choices, { signalCorrectIndex: signalGen.correctIndex });
    } else if (roundPhase === 'step_signal') {
      const isCorrect = choice.choiceIndex === (roundTruth.signalCorrectIndex ?? 0);
      const bonus = getPieceCultureBonus(chain.piece, varalList);
      if (bonus) {
        onSubmitChainStep(roomId, 'signalChoice', { ...choice, isCorrect }, 'step_bonus', bonus.choices, { bonusCorrectIndex: bonus.correctIndex });
      } else {
        onSubmitChainStep(roomId, 'signalChoice', { ...choice, isCorrect }, 'council', null);
      }
    } else if (roundPhase === 'step_bonus') {
      const isCorrect = choice.choiceIndex === (roundTruth.bonusCorrectIndex ?? 0);
      onSubmitChainStep(roomId, 'bonusChoice', { ...choice, isCorrect }, 'council', null);
    }
  };

  // Évaluation collective à l'issue du Conseil de Batterie
  const handleEvaluateRound = () => {
    const evalResult = evaluateCadavreCouncilRound(chain, councilVotes);
    onEvaluateRoundResult(roomId, evalResult.pointsEarned, evalResult);
  };

  const handleNextRound = () => {
    const activePieces = getActiveSeasonPieces(repertoireList);
    const pool = activePieces.length > 0 ? activePieces : repertoireList;
    onAdvanceToNextRound(roomId, currentRoundIndex + 1, totalRounds, pool.slice(0, 4));
  };

  return (
    <div className="flex flex-col gap-2">
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <div>
              <span className="text-[10px] font-mono font-bold text-cordel-wood uppercase block">
                Manche {currentRoundIndex + 1} / {Math.max(1, totalRounds || effectivePlayerOrder.length)}
              </span>
              <h3 className="text-xs font-black uppercase text-encre-noire">Cadavre Exquis — La Chaîne du Mestre</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-cordel-master-dark uppercase block">Axé Collectif</span>
            <span className="text-sm font-black font-mono text-cordel-vert">{teamScore} pts</span>
          </div>
        </div>
      </CordelCard>

      {roundPhase.startsWith('step_') && (
        <CadavreStepPicker
          roundPhase={roundPhase} stepChoices={stepChoices}
          activePlayerUid={activePlayerUid} activePlayerName={activePlayerName}
          currentUserId={currentUserId} onSelectChoice={handleSelectChoice}
          piece={chain.piece} instrument={chain.instrument}
        />
      )}

      {roundPhase === 'council' && (
        <CadavreCouncilView
          chain={chain} councilVotes={councilVotes} players={players}
          currentUserId={currentUserId} isHost={isHost}
          onVote={(isValid, suspected) => onSubmitCouncilVote(roomId, currentUserId, isValid, suspected)}
          onEvaluateRound={handleEvaluateRound}
        />
      )}

      {roundPhase === 'sentence' && (
        <CadavreSentenceView
          roundEvaluation={roundEvaluation} chain={chain}
          currentRoundIndex={currentRoundIndex} totalRounds={Math.max(1, totalRounds || effectivePlayerOrder.length)}
          isHost={isHost} onNextRound={handleNextRound} onFinishGame={() => onFinishGame(roomId)}
        />
      )}
    </div>
  );
}
