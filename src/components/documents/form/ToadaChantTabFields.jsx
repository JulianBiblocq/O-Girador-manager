import React from 'react';
import ToadaLyricsWysiwygEditor from '../toada/ToadaLyricsWysiwygEditor';

export default function ToadaChantTabFields({
  category = 'Toadas',
  parolesOriginales = '',
  setParolesOriginales,
  parolesPhonetiques = '',
  setParolesPhonetiques,
  traduction = '',
  setTraduction,
  anecdote = '',
  setAnecdote,
  disabled = false
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {category === 'Culture' ? "Contenu Fiche" : "🇧🇷 Paroles (Portugais)"}
          </label>
          <ToadaLyricsWysiwygEditor
            value={parolesOriginales}
            onChange={setParolesOriginales}
            disabled={disabled}
            placeholder="Paroles originales de la Toada..."
            minHeight="300px"
          />
        </div>

        {category === 'Toadas' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              🗣️ Prononciation Phonétique
            </label>
            <ToadaLyricsWysiwygEditor
              value={parolesPhonetiques}
              onChange={setParolesPhonetiques}
              disabled={disabled}
              placeholder="Prononciation phonétique..."
              minHeight="300px"
            />
          </div>
        )}
      </div>

      {category === 'Toadas' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Traduction</label>
          <textarea
            value={traduction}
            onChange={(e) => setTraduction(e.target.value)}
            disabled={disabled}
            placeholder="Traduction française des paroles..."
            className="theme-input w-full text-xs min-h-[150px] resize-y p-2.5 font-sans leading-relaxed"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Lexique & Informations</label>
        <textarea
          value={anecdote}
          onChange={(e) => setAnecdote(e.target.value)}
          disabled={disabled}
          placeholder="Contexte culturel, lexique supplémentaire..."
          className="theme-input w-full text-xs min-h-[80px] resize-y p-2 font-sans"
        />
      </div>
    </div>
  );
}
