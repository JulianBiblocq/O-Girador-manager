import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * CreatePollModal.jsx
 * Modale Cordel pour la création d'un nouveau sondage dans le Porte-Voix.
 * Permet de définir une question, entre 2 et 10 choix de réponse,
 * et d'activer l'option à choix multiples.
 */
export default function CreatePollModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions(prev => [...prev, '']);
    }
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleOptionChange = (idx, value) => {
    setOptions(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const validOpts = options.map(o => o.trim()).filter(Boolean);
    if (validOpts.length < 2) {
      alert("Veuillez renseigner au moins 2 choix de réponses.");
      return;
    }

    const success = await onSubmit({
      question: question.trim(),
      options: validOpts,
      allowMultipleChoices
    });

    if (success) {
      setQuestion('');
      setOptions(['', '']);
      setAllowMultipleChoices(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-md bg-cordel-bg p-4 sm:p-5 relative border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]"
      >
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20">
          <h3 className="font-extrabold text-sm sm:text-base text-encre-noire uppercase tracking-wider flex items-center gap-2">
            <span>📊</span>
            <span>Nouveau Sondage</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-stone-500 hover:text-cordel-rouge font-black text-sm p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          {/* Champ de la question */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              Question du sondage *
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex : Quelle date préférez-vous pour la répétition ?"
              disabled={loading}
              className="theme-input w-full text-xs font-bold"
              autoFocus
            />
          </div>

          {/* Liste des options */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              Choix de réponses (min. 2, max. 10)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  required={idx < 2}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Choix ${idx + 1}...`}
                  disabled={loading}
                  className="theme-input text-xs flex-1 font-semibold py-1.5"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    disabled={loading}
                    className="text-cordel-rouge hover:text-white text-xs font-black px-2 py-1 rounded bg-cordel-rouge/10 hover:bg-cordel-rouge border border-cordel-rouge/30 cursor-pointer transition-colors"
                    title="Supprimer ce choix"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                disabled={loading}
                className="text-[10px] font-black uppercase text-cordel-wood hover:underline mt-0.5 self-start cursor-pointer flex items-center gap-1"
              >
                <span>➕</span>
                <span>Ajouter un choix</span>
              </button>
            )}
          </div>

          {/* Case à cocher Choix multiples */}
          <label className="flex items-center gap-2 cursor-pointer select-none border-t border-dashed border-cordel-master-dark/15 pt-2 mt-1">
            <input
              type="checkbox"
              checked={allowMultipleChoices}
              onChange={(e) => setAllowMultipleChoices(e.target.checked)}
              disabled={loading}
              className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
            />
            <span className="text-[11px] font-bold text-encre-noire">
              Autoriser les choix multiples
            </span>
          </label>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              disabled={loading || !question.trim()}
              className="px-4 py-1.5 text-xs font-black uppercase"
            >
              {loading ? "Création..." : "Publier le sondage"}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
