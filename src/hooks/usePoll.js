import { useCallback, useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé usePoll
 * Gère le cycle de vie des sondages dans le Porte-Voix :
 * création, soumission atomique des votes et édition sécurisée via runTransaction Firestore.
 */
export default function usePoll(threadId, userId) {
  const [votingPollId, setVotingPollId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  /**
   * Vote atomique sur une option de sondage
   */
  const handleVote = useCallback(async ({ pollId, optionId, allowMultipleChoices }) => {
    if (!threadId || !userId || !pollId || !optionId) return false;
    setVotingPollId(pollId);

    try {
      const threadRef = doc(db, 'forum', threadId);

      await runTransaction(db, async (transaction) => {
        const threadSnap = await transaction.get(threadRef);
        if (!threadSnap.exists()) {
          throw new Error("Discussion introuvable.");
        }

        const data = threadSnap.data();
        let foundInReplies = false;

        // 1. Recherche dans le tableau des réponses (architecture multi-sondages)
        const reponses = Array.isArray(data.reponses) ? [...data.reponses] : [];
        const pollIndex = reponses.findIndex(r => r && (r.id === pollId || (r.type === 'poll' && r.question === pollId)));

        if (pollIndex !== -1) {
          foundInReplies = true;
          const targetPoll = { ...reponses[pollIndex] };

          if (targetPoll.isClosed) {
            throw new Error("Ce sondage est clôturé.");
          }

          const isMultiple = Boolean(allowMultipleChoices !== undefined ? allowMultipleChoices : targetPoll.allowMultipleChoices || targetPoll.allowMultiple);
          const currentOptions = Array.isArray(targetPoll.options) ? targetPoll.options : [];

          const updatedOptions = currentOptions.map(opt => {
            const currentVotes = Array.isArray(opt.votes) ? [...opt.votes] : [];
            const hasVotedThisOpt = currentVotes.includes(userId);

            if (isMultiple) {
              if (opt.id === optionId) {
                return {
                  ...opt,
                  votes: hasVotedThisOpt ? currentVotes.filter(uid => uid !== userId) : [...currentVotes, userId]
                };
              }
              return opt;
            } else {
              const cleanedVotes = currentVotes.filter(uid => uid !== userId);
              if (opt.id === optionId) {
                return {
                  ...opt,
                  votes: hasVotedThisOpt ? cleanedVotes : [...cleanedVotes, userId]
                };
              }
              return { ...opt, votes: cleanedVotes };
            }
          });

          targetPoll.options = updatedOptions;
          reponses[pollIndex] = targetPoll;
          transaction.update(threadRef, { reponses });
        }

        // 2. Repli rétrocompatible sur le sondage racine thread.poll
        if (!foundInReplies && data.poll) {
          const rootPoll = { ...data.poll };
          if (rootPoll.isClosed) {
            throw new Error("Ce sondage est clôturé.");
          }

          const isMultiple = Boolean(allowMultipleChoices !== undefined ? allowMultipleChoices : rootPoll.allowMultipleChoices || rootPoll.allowMultiple);
          const currentOptions = Array.isArray(rootPoll.options) ? rootPoll.options : [];

          const updatedOptions = currentOptions.map(opt => {
            const currentVotes = Array.isArray(opt.votes) ? [...opt.votes] : [];
            const hasVotedThisOpt = currentVotes.includes(userId);

            if (isMultiple) {
              if (opt.id === optionId) {
                return {
                  ...opt,
                  votes: hasVotedThisOpt ? currentVotes.filter(uid => uid !== userId) : [...currentVotes, userId]
                };
              }
              return opt;
            } else {
              const cleanedVotes = currentVotes.filter(uid => uid !== userId);
              if (opt.id === optionId) {
                return {
                  ...opt,
                  votes: hasVotedThisOpt ? cleanedVotes : [...cleanedVotes, userId]
                };
              }
              return { ...opt, votes: cleanedVotes };
            }
          });

          rootPoll.options = updatedOptions;
          transaction.update(threadRef, { poll: rootPoll });
        }
      });

      return true;
    } catch (err) {
      console.error("usePoll - Erreur lors de l'enregistrement du vote :", err);
      alert(err.message || "Erreur lors du vote.");
      return false;
    } finally {
      setVotingPollId(null);
    }
  }, [threadId, userId]);

  /**
   * Édition d'un sondage existant avec préservation des votes via transaction
   */
  const handleEditPoll = useCallback(async ({ pollId, question, options, isClosed, allowMultipleChoices }) => {
    if (!threadId || !pollId) return false;
    setSavingEdit(true);

    try {
      const threadRef = doc(db, 'forum', threadId);

      await runTransaction(db, async (transaction) => {
        const threadSnap = await transaction.get(threadRef);
        if (!threadSnap.exists()) {
          throw new Error("Discussion introuvable.");
        }

        const data = threadSnap.data();
        let foundInReplies = false;

        const reponses = Array.isArray(data.reponses) ? [...data.reponses] : [];
        const pollIndex = reponses.findIndex(r => r && (r.id === pollId || (r.type === 'poll' && r.question === pollId)));

        if (pollIndex !== -1) {
          foundInReplies = true;
          const targetPoll = { ...reponses[pollIndex] };

          targetPoll.question = question.trim();
          targetPoll.options = options;
          targetPoll.isClosed = Boolean(isClosed);
          targetPoll.allowMultipleChoices = Boolean(allowMultipleChoices);
          targetPoll.allowMultiple = Boolean(allowMultipleChoices);
          targetPoll.dateDerniereModification = new Date().toISOString();

          reponses[pollIndex] = targetPoll;
          transaction.update(threadRef, { reponses });
        }

        // Repli rétrocompatible sur thread.poll
        if (!foundInReplies && data.poll) {
          const rootPoll = { ...data.poll };
          rootPoll.question = question.trim();
          rootPoll.options = options;
          rootPoll.isClosed = Boolean(isClosed);
          rootPoll.allowMultipleChoices = Boolean(allowMultipleChoices);
          rootPoll.allowMultiple = Boolean(allowMultipleChoices);
          rootPoll.dateDerniereModification = new Date().toISOString();

          transaction.update(threadRef, { poll: rootPoll });
        }
      });

      return true;
    } catch (err) {
      console.error("usePoll - Erreur lors de l'édition du sondage :", err);
      alert(err.message || "Erreur lors de la modification du sondage.");
      return false;
    } finally {
      setSavingEdit(false);
    }
  }, [threadId]);

  /**
   * Création d'un nouveau sondage dans le fil des messages de la discussion
   */
  const handleCreatePoll = useCallback(async ({ question, options, allowMultipleChoices, user, profileData }) => {
    if (!threadId || !question?.trim()) return false;
    const validOpts = (options || []).filter(o => typeof o === 'string' && o.trim() !== '');
    if (validOpts.length < 2) {
      alert("Veuillez saisir au moins 2 choix de réponse.");
      return false;
    }

    setCreatingPoll(true);
    try {
      const threadRef = doc(db, 'forum', threadId);

      const pollMessage = {
        id: `poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'poll',
        auteurId: user?.uid || userId,
        auteurNom: `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Membre',
        dateCreation: new Date().toISOString(),
        question: question.trim(),
        options: validOpts.map((label, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text: label.trim(),
          label: label.trim(),
          votes: []
        })),
        isClosed: false,
        allowMultipleChoices: Boolean(allowMultipleChoices),
        allowMultiple: Boolean(allowMultipleChoices)
      };

      await runTransaction(db, async (transaction) => {
        const threadSnap = await transaction.get(threadRef);
        if (!threadSnap.exists()) {
          throw new Error("Discussion introuvable.");
        }

        const data = threadSnap.data();
        const reponses = Array.isArray(data.reponses) ? [...data.reponses] : [];
        reponses.push(pollMessage);

        transaction.update(threadRef, {
          reponses,
          nbReponses: reponses.length,
          derniereReponse: new Date().toISOString()
        });
      });

      return true;
    } catch (err) {
      console.error("usePoll - Erreur création nouveau sondage :", err);
      alert(err.message || "Erreur lors de la création du sondage.");
      return false;
    } finally {
      setCreatingPoll(false);
    }
  }, [threadId, userId]);

  return {
    handleVote,
    handleEditPoll,
    handleCreatePoll,
    votingPollId,
    savingEdit,
    creatingPoll
  };
}
