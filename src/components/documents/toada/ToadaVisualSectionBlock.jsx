import React from 'react';
import ToadaMeasureCard from './ToadaMeasureCard';

/**
 * Bloc conteneur d'une section musicale Toada (< 100 lignes).
 * Affiche l'en-tête de section avec nommage libre, la liste de ses boîtes de mesures
 * et les boutons d'ajout / suppression de section.
 */
export default function ToadaVisualSectionBlock({
  section,
  sectionIndex,
  globalMeasureOffset = 0,
  onChangeSectionName,
  onDeleteSection,
  onUpdateMeasure,
  onAddMeasure,
  onDeleteMeasure,
  disabled = false
}) {
  const { name = '', measures = [] } = section;

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-cordel-bg-light/60 border border-cordel-master-dark/20 rounded-[4px_6px_3px_5px] shadow-2xs">
      {/* En-tête de la section */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-1.5">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] font-black uppercase text-cordel-wood tracking-wider">
            § {sectionIndex + 1}
          </span>
          <div className="flex items-center gap-1 flex-1 max-w-[280px]">
            <span className="font-mono text-xs font-bold text-stone-500">[</span>
            <input
              type="text"
              value={name}
              onChange={(e) => onChangeSectionName(e.target.value)}
              disabled={disabled}
              placeholder="Intro, Refrain, Couplet 1..."
              className="theme-input font-bold text-xs py-0.5 px-1.5 w-full bg-white border border-stone-300 rounded"
            />
            <span className="font-mono text-xs font-bold text-stone-500">]</span>
          </div>
        </div>

        {/* Bouton de suppression de section */}
        {onDeleteSection && (
          <button
            type="button"
            onClick={onDeleteSection}
            disabled={disabled}
            className="px-2 py-0.5 text-[8.5px] uppercase font-bold text-white bg-[var(--color-cordel-rouge,#8b2a1a)] hover:bg-red-800 rounded cursor-pointer transition-colors"
            title="Supprimer toute la section"
          >
            🗑️ Section
          </button>
        )}
      </div>

      {/* Liste des boîtes de mesures de la section */}
      <div className="flex flex-col gap-2">
        {measures.map((m, mIdx) => {
          const globalNumber = globalMeasureOffset + mIdx + 1;
          return (
            <ToadaMeasureCard
              key={m.id || mIdx}
              measureIndex={globalNumber}
              text={m.rawContent || ''}
              hasAnacrusis={Boolean(m.hasAnacrusis)}
              isLinked={Boolean(m.isLinked)}
              onChangeText={(txt) => onUpdateMeasure(mIdx, { rawContent: txt })}
              onToggleAnacrusis={() => onUpdateMeasure(mIdx, { hasAnacrusis: !m.hasAnacrusis })}
              onToggleLinked={() => onUpdateMeasure(mIdx, { isLinked: !m.isLinked })}
              onAddMeasureAfter={() => onAddMeasure(mIdx + 1)}
              onDeleteMeasure={() => onDeleteMeasure(mIdx)}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Bouton d'ajout d'une mesure dans cette section */}
      <button
        type="button"
        onClick={() => onAddMeasure(measures.length)}
        disabled={disabled}
        className="w-full py-1 text-[9.5px] font-black uppercase text-stone-700 bg-white hover:bg-stone-50 border border-dashed border-cordel-master-dark/30 rounded cursor-pointer transition-colors"
      >
        + Ajouter une mesure à cette section
      </button>
    </div>
  );
}
