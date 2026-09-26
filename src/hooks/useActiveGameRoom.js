import { useState, useEffect, useCallback } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, getDoc,
  doc, deleteField, serverTimestamp, increment 
} from 'firebase/firestore';
import { db } from '../firebase';
import { isRoomExpired } from '../utils/gameUtils';
import { generateGameQuestions } from '../utils/gameQuizGenerator';
import { getActiveSeasonPieces } from '../utils/cadavreExquisGenerator';

/**
 * Hook pour détecter et orchestrer le salon et la partie multijoueur (Quiz & Cadavre Exquis).
 */
export function useActiveGameRoom(groupId, isEnabled = true) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Écoute Firestore des salons au statut 'lobby' pour le groupe
  useEffect(() => {
    if (!groupId || !isEnabled) {
      setActiveRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomsRef = collection(db, 'game_rooms');
    const q = query(roomsRef, where('groupId', '==', groupId.trim().toLowerCase()), where('status', '==', 'lobby'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let foundRoom = null;
      snapshot.forEach((docSnap) => {
        const candidate = { id: docSnap.id, ...docSnap.data() };
        if (!isRoomExpired(candidate, 10)) {
          if (!foundRoom || (candidate.createdAt?.toMillis?.() || 0) > (foundRoom.createdAt?.toMillis?.() || 0)) {
            foundRoom = candidate;
          }
        }
      });
      setActiveRoom(foundRoom);
      setLoading(false);
    }, (error) => {
      console.warn('[useActiveGameRoom] Erreur de lecture des salons :', error);
      setActiveRoom(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isEnabled]);

  // Création d'un salon d'attente (Lobby)
  const createRoom = useCallback(async (theme, hostProfile) => {
    if (!groupId || !hostProfile) throw new Error('Données manquantes.');
    const uid = hostProfile.uid || hostProfile.id;
    const displayName = hostProfile.prenom || hostProfile.displayName || hostProfile.nom || 'Hôte';
    const avatar = hostProfile.photoURL || hostProfile.avatar || '';

    const newRoom = {
      groupId: groupId.trim().toLowerCase(),
      theme: theme || 'rythme',
      status: 'lobby',
      hostUid: uid,
      hostName: displayName,
      hostAvatar: avatar,
      createdAt: serverTimestamp(),
      maxPlayers: 4,
      players: { [uid]: { name: displayName, avatar, isHost: true, ready: true, score: 0 } }
    };
    const docRef = await addDoc(collection(db, 'game_rooms'), newRoom);
    return docRef.id;
  }, [groupId]);

  const joinRoom = useCallback(async (roomId, userProfile) => {
    if (!roomId || !userProfile) return;
    const uid = userProfile.uid || userProfile.id;
    const displayName = userProfile.prenom || userProfile.displayName || userProfile.nom || 'Joueur';
    const avatar = userProfile.photoURL || userProfile.avatar || '';
    await updateDoc(doc(db, 'game_rooms', roomId), {
      [`players.${uid}`]: { name: displayName, avatar, isHost: false, ready: true, score: 0 }
    });
  }, []);

  const leaveRoom = useCallback(async (roomId, userId) => {
    if (!roomId || !userId) return;
    await updateDoc(doc(db, 'game_rooms', roomId), { [`players.${userId}`]: deleteField() });
  }, []);

  const cancelRoom = useCallback(async (roomId) => {
    if (!roomId) return;
    await updateDoc(doc(db, 'game_rooms', roomId), { status: 'cancelled' });
  }, []);

  // Lance la partie (Roda Quiz ou Cadavre Exquis)
  const launchRoom = useCallback(async (roomId, theme = 'rythme', contextData = {}) => {
    if (!roomId) return;
    const snap = await getDoc(doc(db, 'game_rooms', roomId));
    if (!snap.exists()) return;
    const players = snap.data()?.players || {};
    const playerOrder = Object.keys(players).sort();

    if (theme === 'cadavre_exquis') {
      const activePieces = getActiveSeasonPieces(contextData?.repertoire);
      await updateDoc(doc(db, 'game_rooms', roomId), {
        status: 'playing', theme: 'cadavre_exquis', totalRounds: playerOrder.length,
        currentRoundIndex: 0, roundPhase: 'step_piece', playerOrder,
        chain: { piece: null, instrument: null, patternChoice: null, signalChoice: null, bonusChoice: null },
        councilVotes: {}, teamScore: 0, roundEvaluation: null, stepChoices: activePieces.slice(0, 4)
      });
      return;
    }

    const questions = generateGameQuestions(theme, contextData);
    const reset = Object.fromEntries(Object.keys(players).flatMap(u => [[`players.${u}.score`, 0], [`players.${u}.currentAnswer`, null]]));
    await updateDoc(doc(db, 'game_rooms', roomId), {
      status: 'playing', currentQuestionIndex: 0, phase: 'question',
      questionStartedAt: Date.now(), questions, ...reset
    });
  }, []);

  const advanceToReveal = useCallback((rId) => rId && updateDoc(doc(db, 'game_rooms', rId), { phase: 'reveal' }), []);

  const advanceToNextQuestion = useCallback(async (roomId, nextIndex, playerIds = []) => {
    if (!roomId) return;
    const reset = Object.fromEntries(playerIds.map(u => [`players.${u}.currentAnswer`, null]));
    await updateDoc(doc(db, 'game_rooms', roomId), { currentQuestionIndex: nextIndex, phase: 'question', questionStartedAt: Date.now(), ...reset });
  }, []);

  const finishGame = useCallback((rId) => rId && updateDoc(doc(db, 'game_rooms', rId), { status: 'finished' }), []);

  const submitAnswer = useCallback(async (roomId, uid, choiceIndex, isCorrect, remainingTimeRatio) => {
    if (!roomId || !uid) return;
    const ratio = Math.max(0, Math.min(1, Number(remainingTimeRatio) || 0));
    const points = isCorrect ? Math.round(500 + 500 * ratio) : 0;
    await updateDoc(doc(db, 'game_rooms', roomId), {
      [`players.${uid}.score`]: increment(points),
      [`players.${uid}.currentAnswer`]: { choiceIndex, isCorrect, points, answeredAt: Date.now() }
    });
  }, []);

  // Actions Cadavre Exquis
  const submitChainStep = useCallback(async (roomId, stepKey, value, nextPhase, nextStepChoices = null, extraTruth = null) => {
    if (!roomId) return;
    const updates = { [`chain.${stepKey}`]: value, roundPhase: nextPhase, stepChoices: nextStepChoices };
    if (extraTruth) Object.assign(updates, { roundTruth: extraTruth });
    await updateDoc(doc(db, 'game_rooms', roomId), updates);
  }, []);

  const submitCouncilVote = useCallback(async (roomId, uid, isValid, suspectedStep = null) => {
    if (!roomId || !uid) return;
    await updateDoc(doc(db, 'game_rooms', roomId), {
      [`councilVotes.${uid}`]: { isValid, suspectedStep, votedAt: Date.now() }
    });
  }, []);

  const evaluateRoundResult = useCallback(async (roomId, pointsEarned, roundEvaluation) => {
    if (!roomId) return;
    await updateDoc(doc(db, 'game_rooms', roomId), {
      teamScore: increment(pointsEarned), roundEvaluation, roundPhase: 'sentence'
    });
  }, []);

  const advanceToNextRound = useCallback(async (roomId, nextRoundIndex, totalRounds, firstChoices = null) => {
    if (!roomId) return;
    if (nextRoundIndex >= totalRounds) {
      await updateDoc(doc(db, 'game_rooms', roomId), { status: 'finished' });
      return;
    }
    await updateDoc(doc(db, 'game_rooms', roomId), {
      currentRoundIndex: nextRoundIndex, roundPhase: 'step_piece',
      chain: { piece: null, instrument: null, patternChoice: null, signalChoice: null, bonusChoice: null },
      councilVotes: {}, roundEvaluation: null, stepChoices: firstChoices
    });
  }, []);

  const restartLobby = useCallback(async (roomId) => {
    if (!roomId) return;
    const snap = await getDoc(doc(db, 'game_rooms', roomId));
    const players = snap.exists() ? snap.data()?.players || {} : {};
    const reset = Object.fromEntries(Object.keys(players).flatMap(u => [[`players.${u}.score`, 0], [`players.${u}.currentAnswer`, null]]));
    await updateDoc(doc(db, 'game_rooms', roomId), {
      status: 'lobby', currentQuestionIndex: 0, phase: 'question', questions: [],
      createdAt: serverTimestamp(), ...reset
    });
  }, []);

  return {
    activeRoom, loading, createRoom, joinRoom, leaveRoom, cancelRoom, launchRoom,
    advanceToReveal, advanceToNextQuestion, finishGame, submitAnswer, restartLobby,
    submitChainStep, submitCouncilVote, evaluateRoundResult, advanceToNextRound
  };
}
