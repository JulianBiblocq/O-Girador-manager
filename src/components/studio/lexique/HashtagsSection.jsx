import React, { useState } from 'react';
import { normalizeHashtag } from '../../../config/studioSocialConfig';

/**
 * Section Hashtags par défaut :
 * Permet d'administrer les hashtags officiels pré-remplis pour les publications sociales de l'association.
 *
 * @param {Object} props
 * @param {Array<string>} props.hashtags Liste des hashtags ['#maracatu', ...]
 * @param {Function} props.onSaveHashtags Callback de mise à jour des hashtags
 * @param {boolean} [props.disabled=false] État de désactivation
 */
export default function HashtagsSection({
  hashtags = [],
  onSaveHashtags,
  disabled = false
}) {
  const [newTagInput, setNewTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ajoute un nouveau hashtag
  const handleAddHashtag = (e) => {
    e.preventDefault();
    const cleanTag = normalizeHashtag(newTagInput);

    if (!cleanTag || cleanTag === '#') {
      setErrorMessage("Veuillez saisir un hashtag valide (ex: #maracatu).");
      return;
    }

    // Éviter les doublons insensibles à la casse
    if (hashtags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
      setErrorMessage(`Le hashtag "${cleanTag}" existe déjà dans la liste.`);
      return;
    }

    const updated = [...hashtags, cleanTag];
    onSaveHashtags(updated);
    setNewTagInput('');
    setErrorMessage('');
  };

  // Supprime un hashtag
  const handleRemoveHashtag = (tagToRemove) => {
    const updated = hashtags.filter((t) => t !== tagToRemove);
    onSaveHashtags(updated);
  };

  return (
    <div className="bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-lg p-4 shadow-sm text-left">
      {/* En-tête de section */}
      <div className="pb-3 border-b border-dashed border-cordel-master-dark/25">
        <h3 className="text-base font-black text-cordel-wood uppercase flex items-center gap-2">
          <span>🏷️</span> Hashtags par défaut
        </h3>
        <p className="text-xs text-cordel-master-dark/75 mt-0.5">
          Hashtags officiels automatiquement intégrés et suggérés lors de la rédaction des publications.
        </p>
      </div>

      {/* Formulaire d'ajout rapide de hashtag */}
      <form onSubmit={handleAddHashtag} className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => {
              setNewTagInput(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Ajouter un hashtag (ex: #culturapopular)..."
            disabled={disabled}
            className="w-full text-xs px-3 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)] font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !newTagInput.trim()}
          className="px-3 py-1.5 rounded text-xs font-bold text-white bg-[var(--color-cordel-vert)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 flex items-center gap-1"
        >
          <span>➕</span> Ajouter
        </button>
      </form>

      {errorMessage && (
        <p className="text-[11px] font-bold text-[var(--color-cordel-rouge)] mt-2">
          ⚠️ {errorMessage}
        </p>
      )}

      {/* Liste des pastilles de hashtags */}
      <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15">
        <div className="text-[11px] font-bold uppercase text-cordel-wood mb-2">
          Hashtags actifs ({hashtags.length}) :
        </div>

        {hashtags.length === 0 ? (
          <div className="py-4 text-xs italic text-cordel-master-dark/60">
            Aucun hashtag configuré. Utilisez le champ ci-dessus pour en ajouter.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-50 dark:bg-neutral-800 border border-amber-900/30 text-amber-950 dark:text-amber-200 shadow-2xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveHashtag(tag)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--color-cordel-rouge)] hover:text-white transition-colors cursor-pointer text-[10px] text-neutral-500"
                  title={`Supprimer ${tag}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
