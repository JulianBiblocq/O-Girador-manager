import React, { useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { parseNotebookFromTxt, serializeNotebookToTxt } from '../../../utils/toadaNotebookParser';
import ToadaNotebookRow from './ToadaNotebookRow';
import ToadaInlineFormattingBar from './ToadaInlineFormattingBar';

/**
 * Éditeur fluide "Cahier Ligné" pour les Toadas (< 140 lignes).
 * Remplace les boîtes lourdes par une grille fine alignée ligne par ligne (Portugais | Phonétique).
 */
export default function ToadaLinedNotebookEditor({
  value = '',
  onChange,
  phoneticValue = '',
  onChangePhonetic,
  disabled = false
}) {
  const { t } = useTranslation();

  const rows = useMemo(() => {
    return parseNotebookFromTxt(value, phoneticValue);
  }, [value, phoneticValue]);

  const commitRows = (nextRows) => {
    const { rawTxtCode, parolesPhonetiques } = serializeNotebookToTxt(nextRows);
    if (onChange) onChange(rawTxtCode);
    if (onChangePhonetic) onChangePhonetic(parolesPhonetiques);
  };

  const handleUpdateRow = (index, patch) => {
    const next = rows.map((r, i) => (i !== index ? r : { ...r, ...patch }));
    commitRows(next);
  };

  const handleAddRowAfter = (index) => {
    const next = [...rows];
    next.splice(index + 1, 0, {
      id: Date.now() + Math.random(),
      origText: '',
      phonText: '',
      isLinked: false,
      hasAnaSolo: false,
      hasAnaCoro: false
    });
    commitRows(next);
  };

  const handleDeleteRow = (index) => {
    if (rows.length <= 1) {
      commitRows([{ id: Date.now(), origText: '', phonText: '', isLinked: false, hasAnaSolo: false, hasAnaCoro: false }]);
      return;
    }
    const next = rows.filter((_, i) => i !== index);
    commitRows(next);
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left bg-white/70 p-2 rounded-[4px_6px_3px_5px] border border-encre-noire/25 shadow-inner">
      {/* 1. Barre d'outils et raccourcis Puxador */}
      <ToadaInlineFormattingBar
        onBold={() => {}}
        onUnderline={() => {}}
        totalMeasures={rows.length}
        disabled={disabled}
      />

      {/* 2. En-tête des colonnes du Cahier */}
      <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-wider text-cordel-wood border-b-2 border-cordel-master-dark/30 pb-1 px-1.5 select-none">
        <span className="col-span-1 text-center">N°</span>
        <span className="col-span-5">{t('toada.colPortuguese') || "🇧🇷 Paroles (Portugais)"}</span>
        <span className="col-span-4">{t('toada.colPhonetic') || "🗣️ Prononciation Phonétique"}</span>
        <span className="col-span-2">{t('toada.colOptions') || "🎛️ Structure"}</span>
      </div>

      {/* 3. Lignes de mesures alignées style Cahier Cordel */}
      <div className="flex flex-col divide-y divide-dotted divide-cordel-master-dark/15 max-h-[500px] overflow-y-auto cordel-scrollbar pr-1">
        {rows.map((row, idx) => (
          <ToadaNotebookRow
            key={row.id || idx}
            index={idx}
            row={row}
            isFirst={idx === 0}
            disabled={disabled}
            onUpdateRow={(patch) => handleUpdateRow(idx, patch)}
            onAddRowAfter={() => handleAddRowAfter(idx)}
            onDeleteRow={() => handleDeleteRow(idx)}
          />
        ))}
      </div>

      {/* 4. Bouton compact d'ajout de mesure */}
      <button
        type="button"
        onClick={() => handleAddRowAfter(rows.length - 1)}
        disabled={disabled}
        className="w-full py-1.5 text-[9.5px] font-black uppercase text-cordel-wood bg-white hover:bg-amber-50/70 border border-dashed border-cordel-master-dark/40 rounded-[4px_6px_3px_5px] cursor-pointer transition-colors shadow-2xs mt-1"
      >
        + {t('toada.addMeasureBtn') || "Ajouter une mesure (ou pressez Entrée)"}
      </button>
    </div>
  );
}
