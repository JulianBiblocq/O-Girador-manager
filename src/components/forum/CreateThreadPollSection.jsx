/**
 * Sous-composant de configuration d'un sondage lors de la création d'un sujet
 * dans le Porte-Voix (CreateThreadForm.jsx).
 */

import React from 'react';

export default function CreateThreadPollSection({
  showPollForm = false,
  pollQuestion = '',
  setPollQuestion,
  pollOptions = ['', ''],
  onAddOption,
  onRemoveOption,
  onOptionChange,
  pollAllowMultiple = false,
  setPollAllowMultiple,
  saving = false
}) {
  if (!showPollForm) return null;

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="p-3.5 bg-[var(--cordel-paper,#fffdf8)] border-2 border-[var(--theme-border-color,#181716)]/25 rounded-[6px] flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)] border-b border-dashed border-[var(--theme-border-color,#181716)]/15 pb-1">
          📊 Paramètres du Sondage
        </span>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider">
            Question du sondage
          </label>
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ex : Quelle date préférez-vous pour le stage ?"
            disabled={saving}
            className="theme-input w-full text-xs font-bold"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] uppercase font-bold tracking-wider">
            Choix de réponses (Minimum 2)
          </label>
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={opt}
                onChange={(e) => onOptionChange(idx, e.target.value)}
                placeholder={`Choix ${idx + 1}...`}
                disabled={saving}
                className="theme-input text-xs flex-1 font-semibold py-1.5"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveOption(idx)}
                  disabled={saving}
                  className="text-[var(--color-cordel-rouge,#8b2a1a)] text-xs font-black px-2 py-1 rounded bg-red-50 border border-red-200 cursor-pointer"
                  title="Supprimer ce choix"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {pollOptions.length < 10 && (
            <button
              type="button"
              onClick={onAddOption}
              disabled={saving}
              className="text-[9px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline mt-1 self-start cursor-pointer"
            >
              ➕ Ajouter un choix
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none border-t border-dashed border-[var(--theme-border-color,#181716)]/15 pt-2 mt-1">
          <input
            type="checkbox"
            checked={pollAllowMultiple}
            onChange={(e) => setPollAllowMultiple(e.target.checked)}
            disabled={saving}
            className="w-3.5 h-3.5 border border-[var(--theme-border-color,#181716)] rounded accent-[var(--color-cordel-rouge,#8b2a1a)] cursor-pointer"
          />
          <span className="text-[10px] font-bold">
            Autoriser les choix multiples (les membres peuvent voter pour plusieurs réponses)
          </span>
        </label>
      </div>
    </div>
  );
}

