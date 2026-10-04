import React from 'react';
import PollCard from '../PollCard';

/**
 * ThreadPollSection.jsx
 * Affichage rétrocompatible du sondage historique attaché à la racine d'un sujet (thread.poll).
 * Les nouveaux sondages multi-discussions sont quant à eux rendus chronologiquement
 * dans le flux des messages via PollCard dans ThreadMessageList.
 */
export default function ThreadPollSection({
  thread,
  userId,
  user,
  allUsers = [],
  isAuthorOrAdmin = false,
  onVote,
  onOpenEdit,
  votingPollId = null,
  t
}) {
  const effectiveUserId = userId || user?.uid;

  if (!thread?.poll) return null;

  const rootPoll = {
    ...thread.poll,
    id: thread.poll.id || 'root_poll',
    auteurId: thread.poll.auteurId || thread.auteurId,
    auteurNom: thread.poll.auteurNom || thread.auteurNom,
    dateCreation: thread.poll.dateCreation || thread.dateCreation
  };

  return (
    <PollCard
      poll={rootPoll}
      userId={effectiveUserId}
      allUsers={allUsers}
      isAuthorOrAdmin={isAuthorOrAdmin}
      onVote={onVote}
      onOpenEdit={onOpenEdit}
      voting={votingPollId === rootPoll.id}
      t={t}
    />
  );
}
