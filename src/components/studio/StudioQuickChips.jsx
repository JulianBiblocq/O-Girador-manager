import React from 'react';
import {
  DEFAULT_STUDIO_LEXIQUE,
  DEFAULT_STUDIO_MENTIONS,
  normalizeMentionHandle
} from '../../config/studioSocialConfig';

export { DEFAULT_STUDIO_LEXIQUE, DEFAULT_STUDIO_MENTIONS };

/**
 * Composant StudioQuickChips
 * Pastilles d'insertion immédiate de termes de vocabulaire et de mentions au curseur,
 * avec lien direct vers le gestionnaire d'onglets de lexique.
 *
 * @param {Object} props
 * @param {Function} props.onInsertWord Callback déclenché avec le mot ou la mention à insérer
 * @param {Array<string|Object>} [props.lexique] Liste de mots personnalisable
 * @param {Array<string|Object>} [props.mentions] Liste de mentions personnalisable
 * @param {Function} [props.onNavigateToLexique] Callback d'ouverture de l'onglet studio-lexique
 * @param {boolean} [props.disabled=false] État de désactivation
 */
export default function StudioQuickChips({
  onInsertWord,
  lexique = DEFAULT_STUDIO_LEXIQUE,
  mentions = DEFAULT_STUDIO_MENTIONS,
  onNavigateToLexique,
  disabled = false
}) {
  const effectiveLexique = Array.isArray(lexique) && lexique.length > 0 ? lexique : DEFAULT_STUDIO_LEXIQUE;
  const effectiveMentions = Array.isArray(mentions) && mentions.length > 0 ? mentions : DEFAULT_STUDIO_MENTIONS;

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Section Lexique */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] font-black uppercase text-cordel-wood tracking-wider shrink-0 select-none">
            📖 Lexique :
          </span>
          {effectiveLexique.map((item, idx) => {
            const term = typeof item === 'string' ? item : item?.preferred || item?.recommande || '';
            if (!term) return null;
            return (
              <button
                key={`${term}-${idx}`}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInsertWord(term)}
                className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-900/30 text-amber-950 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-40 select-none"
                title={`Insérer "${term}" dans la publication`}
              >
                +{term}
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-4 bg-cordel-master-dark/20 mx-0.5 hidden sm:block" />

        {/* Section Mentions */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] font-black uppercase text-blue-900 tracking-wider shrink-0 select-none">
            @ Mentions :
          </span>
          {effectiveMentions.map((item, idx) => {
            const isObj = typeof item === 'object' && item !== null;
            const handle = normalizeMentionHandle(isObj ? item.handle : item);
            const label = isObj && item.label ? item.label : handle;
            if (!handle) return null;

            return (
              <button
                key={`${handle}-${idx}`}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInsertWord(handle)}
                className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-bold bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-900/30 text-blue-950 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-40 select-none"
                title={`Insérer la mention "${handle}"`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Raccourci vers le gestionnaire d'onglets du lexique */}
      {onNavigateToLexique && (
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onNavigateToLexique}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-800/30 transition-all cursor-pointer shadow-2xs select-none hover:scale-105"
          title="Gérer le vocabulaire, les mentions et hashtags dans l'onglet Lexique"
        >
          <span>⚙️</span> Lexique
        </button>
      )}
    </div>
  );
}
