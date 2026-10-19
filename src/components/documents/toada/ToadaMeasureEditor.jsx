import React, { useState, useMemo, useRef } from 'react';
import { parseToadaMeasures } from '../../../utils/toadaMeasureParser';
import { serializeToadaMeasures, downloadToadaTxtFile } from '../../../utils/toadaSerializer';
import ToadaVisualSectionBlock from './ToadaVisualSectionBlock';
import ToadaLegendModal from './ToadaLegendModal';

/**
 * Éditeur Toada hybride (< 140 lignes).
 * Permet de basculer entre le mode Boîtes de mesures et le mode Texte brut (.txt),
 * avec import/export de fichier .txt et modale de légende intégrée.
 */
export default function ToadaMeasureEditor({
  value = '',
  onChange,
  disabled = false,
  placeholder = '',
  title = 'toada'
}) {
  const [mode, setMode] = useState('boxes');
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const fileInputRef = useRef(null);

  const parsed = useMemo(() => parseToadaMeasures(value), [value]);
  const sections = useMemo(() => (
    parsed.sections.length > 0
      ? parsed.sections
      : [{ name: '', measures: [{ id: 1, rawContent: '', hasAnacrusis: false, isLinked: false }] }]
  ), [parsed]);

  const updateSections = (nextSections) => onChange(serializeToadaMeasures(nextSections));

  const handleUpdateMeasure = (sIdx, mIdx, patch) => {
    const next = sections.map((s, i) => i !== sIdx ? s : {
      ...s,
      measures: s.measures.map((m, j) => j !== mIdx ? m : { ...m, ...patch })
    });
    updateSections(next);
  };

  const handleAddMeasure = (sIdx, atIndex) => {
    const next = sections.map((s, i) => {
      if (i !== sIdx) return s;
      const measures = [...s.measures];
      measures.splice(atIndex, 0, { id: Date.now(), rawContent: '', hasAnacrusis: false, isLinked: false });
      return { ...s, measures };
    });
    updateSections(next);
  };

  const handleDeleteMeasure = (sIdx, mIdx) => {
    const next = sections.map((s, i) => i !== sIdx ? s : {
      ...s,
      measures: s.measures.filter((_, j) => j !== mIdx)
    }).filter((s) => s.measures.length > 0 || sections.length === 1);
    updateSections(next);
  };

  const handleAddSection = () => {
    updateSections([...sections, { name: '', measures: [{ id: Date.now(), rawContent: '', hasAnacrusis: false, isLinked: false }] }]);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => onChange(evt.target?.result || '');
    reader.readAsText(file);
    e.target.value = '';
  };

  let globalOffset = 0;

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <input ref={fileInputRef} type="file" accept=".txt" onChange={handleImportFile} className="hidden" />
      <ToadaLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      {/* Barre d'outils de l'éditeur */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMode('boxes')}
            className={`px-2 py-0.5 text-[9px] font-black uppercase rounded cursor-pointer ${
              mode === 'boxes' ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300'
            }`}>🎛️ Boîtes</button>
          <button type="button" onClick={() => setMode('text')}
            className={`px-2 py-0.5 text-[9px] font-black uppercase rounded cursor-pointer ${
              mode === 'text' ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300'
            }`}>📝 Brut .txt</button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}
            className="px-2 py-0.5 text-[9px] font-black uppercase bg-white hover:bg-stone-100 border border-stone-300 rounded cursor-pointer">📥 Importer .txt</button>
          <button type="button" onClick={() => downloadToadaTxtFile(title, value)} disabled={disabled || !value.trim()}
            className="px-2 py-0.5 text-[9px] font-black uppercase bg-white hover:bg-stone-100 border border-stone-300 rounded cursor-pointer">📤 Exporter .txt</button>
          <button type="button" onClick={() => setIsLegendOpen(true)}
            className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded cursor-pointer">ℹ️ Légende</button>
        </div>
      </div>

      {/* Rendu dynamique : Boîtes visuelles ou Zone de texte brut */}
      {mode === 'boxes' ? (
        <div className="flex flex-col gap-3">
          {sections.map((section, sIdx) => {
            const currentOffset = globalOffset;
            globalOffset += section.measures.length;
            return (
              <ToadaVisualSectionBlock key={sIdx} section={section} sectionIndex={sIdx} globalMeasureOffset={currentOffset}
                onChangeSectionName={(name) => updateSections(sections.map((s, i) => i === sIdx ? { ...s, name } : s))}
                onDeleteSection={sections.length > 1 ? () => updateSections(sections.filter((_, i) => i !== sIdx)) : null}
                onUpdateMeasure={(mIdx, patch) => handleUpdateMeasure(sIdx, mIdx, patch)}
                onAddMeasure={(atIdx) => handleAddMeasure(sIdx, atIdx)}
                onDeleteMeasure={(mIdx) => handleDeleteMeasure(sIdx, mIdx)} disabled={disabled} />
            );
          })}
          <button type="button" onClick={handleAddSection} disabled={disabled}
            className="py-1.5 text-[10px] font-black uppercase text-cordel-wood bg-white hover:bg-amber-50 border-2 border-dashed border-cordel-master-dark/30 rounded cursor-pointer">
            + Ajouter une nouvelle Section [Section]
          </button>
        </div>
      ) : (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          placeholder={placeholder || "+ *Soliste* [Dm7] Première mesure...\n\n/ Suite du chœur liée..."} rows={8}
          className="theme-input font-mono text-xs font-semibold p-2.5 bg-white leading-relaxed resize-y w-full rounded border border-encre-noire/30 shadow-inner" />
      )}
    </div>
  );
}
