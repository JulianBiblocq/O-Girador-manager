import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import PollDisplay from '../PollDisplay';

/**
 * Bloc autonome d'affichage du sondage interactif attaché à une discussion,
 * ainsi que la modale Cordel de création de sondage sur sujet existant.
 *
 * @param {Object} props
 * @param {Object} props.thread Document de la discussion
 * @param {string} props.userId Identifiant de l'utilisateur connecté
 * @param {Array} props.allUsers Liste de tous les utilisateurs (pour les avatars de votants)
 * @param {boolean} props.isAuthorOrAdmin Indique si l'utilisateur peut administrer le sondage
 * @param {boolean} props.isAddPollOpen Indique si la modale de création est ouverte
 * @param {Function} props.setIsAddPollOpen Setter d'ouverture de la modale
 * @param {Function} props.onCreatePoll Callback de création ({ question, options, allowMultiple })
 * @param {boolean} props.savingPoll Indique si la sauvegarde du sondage est en cours
 */
export default function ThreadPollSection({
  thread,
  userId,
  user,
  allUsers = [],
  isAuthorOrAdmin = false,
  isAddPollOpen = false,
  setIsAddPollOpen,
  onCloseAddPoll,
  onCreatePoll,
  savingPoll = false
}) {
  const effectiveUserId = userId || user?.uid;
  const handleClose = () => {
    if (setIsAddPollOpen) setIsAddPollOpen(false);
    if (onCloseAddPoll) onCloseAddPoll();
  };

  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [newPollAllowMultiple, setNewPollAllowMultiple] = useState(false);

  const handleAddOption = () => {
    if (newPollOptions.length < 10) {
      setNewPollOptions((prev) => [...prev, '']);
    }
  };

  const handleRemoveOption = (idx) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx, val) => {
    setNewPollOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPollQuestion.trim() || !onCreatePoll) return;

    const success = await onCreatePoll({
      question: newPollQuestion,
      options: newPollOptions,
      allowMultiple: newPollAllowMultiple
    });

    if (success) {
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setNewPollAllowMultiple(false);
    }
  };

  return (
    <>
      {/* Affichage du sondage interactif existant */}
      {thread?.poll && (
        <PollDisplay
          poll={thread.poll}
          threadId={thread.id}
          userId={effectiveUserId}
          allUsers={allUsers}
          isAuthorOrAdmin={isAuthorOrAdmin}
        />
      )}

      {/* Modale de création d'un nouveau sondage */}
      {isAddPollOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-5 relative select-none">
            <h3 className="font-extrabold text-sm text-encre-noire uppercase tracking-wider mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
              📊 Créer un Sondage pour ce sujet
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
              {/* Question */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Question du sondage *
                </label>
                <input
                  type="text"
                  required
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  placeholder="Ex : Quelle date préférez-vous pour le stage ?"
                  disabled={savingPoll}
                  className="theme-input w-full text-xs font-bold"
                  autoFocus
                />
              </div>

              {/* Options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Choix de réponses (Minimum 2)
                </label>
                {newPollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Choix ${idx + 1}...`}
                      disabled={savingPoll}
                      className="theme-input text-xs flex-1 font-semibold py-1.5"
                    />
                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={savingPoll}
                        className="text-[var(--theme-primary)] hover:text-white text-xs font-black px-2 py-1 rounded bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)] border border-[var(--theme-primary)]/30 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {newPollOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={savingPoll}
                    className="text-[9px] font-black uppercase text-cordel-wood hover:underline mt-0.5 self-start cursor-pointer"
                  >
                    ➕ Ajouter un choix
                  </button>
                )}
              </div>

              {/* Choix multiples */}
              <label className="flex items-center gap-2 cursor-pointer select-none border-t border-dashed border-cordel-master-dark/15 pt-2">
                <input
                  type="checkbox"
                  checked={newPollAllowMultiple}
                  onChange={(e) => setNewPollAllowMultiple(e.target.checked)}
                  disabled={savingPoll}
                  className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                />
                <span className="text-[10px] font-bold text-encre-noire">
                  Autoriser les choix multiples
                </span>
              </label>

              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={handleClose}
                  disabled={savingPoll}
                  className="px-3 py-1.5 text-xs font-bold"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="ocre"
                  disabled={savingPoll}
                  className="px-4 py-1.5 text-xs font-black uppercase"
                >
                  {savingPoll ? "Création..." : "Ajouter le sondage"}
                </CordelButton>
              </div>
            </form>
          </CordelCard>
        </div>
      )}
    </>
  );
}
