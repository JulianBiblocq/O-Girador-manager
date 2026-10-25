import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from '../../LanguageContext';
import { parseStructureTxt, exportStructureAsTxt, groupLyricsByRole } from '../../../utils/toadaTwoLineConverter';
import { computeSongStructure, generateEmptySilenceMeasure, rebuildLineFromCharAnchors } from '../../../utils/toadaLineEditorHelper';
import ToadaMusicalToolbar from './ToadaMusicalToolbar';
import ToadaMusicalLineRow from './ToadaMusicalLineRow';
import ToadaPrintStyloView from './ToadaPrintStyloView';
import ToadaScanPromptModal from './ToadaScanPromptModal';
import ToadaLegendModal from './ToadaLegendModal';
import { extractVaralLyricsFromScanned } from '../../../utils/toadaManuscriptScannerService';

export default function ToadaMusicalStructureEditor({
  value = '', onChange, tab1Lyrics = '', onUpdateTab1Lyrics, signature = '4/4', onChangeSignature,
  bpmDefaut = '', tonaliteDefaut = '', rythme = '', titre = '', disabled = false
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('time'), [activeStamp, setActiveStamp] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showPrintStylo, setShowPrintStylo] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false), [showLegendModal, setShowLegendModal] = useState(false);
  const lastCommittedRef = useRef('');
  const [lines, setLines] = useState(() => {
    const p = parseStructureTxt(value); return p.length > 0 ? p : [''];
  });

  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      const p = parseStructureTxt(value); setLines(p.length > 0 ? p : ['']);
    }
  }, [value]);

  const { totalMeasures, lineDetails } = useMemo(() => computeSongStructure(lines, signature), [lines, signature]);

  const activeToolbarSig = useMemo(() => {
    if (selectedCell && lineDetails[selectedCell.lineIdx]) {
      const ld = lineDetails[selectedCell.lineIdx];
      return (selectedCell.charIdx >= 0 ? ld.charEffectiveSigs?.[selectedCell.charIdx] : null) || ld.lineStartSig || signature;
    }
    return signature;
  }, [selectedCell, lineDetails, signature]);

  const commitLines = (next) => {
    setLines(next);
    const txt = exportStructureAsTxt(next.length > 0 ? next : [''], 'brackets');
    lastCommittedRef.current = txt;
    if (onChange) onChange(txt);
  };

  const handleUpdateLine = (idx, newText) => { const next = [...lines]; next[idx] = newText; commitLines(next); };

  const handleSelectStamp = (beat) => {
    if (selectedCell && selectedCell.lineIdx < lines.length) {
      const { lineIdx, charIdx } = selectedCell, ld = lineDetails[lineIdx];
      const nextA = charIdx >= 0 ? { ...ld.charAnchors, [charIdx]: beat } : ld.charAnchors;
      const leadBeat = charIdx === -1 ? beat : ld.leadingRestBeat, hasLead = charIdx === -1 ? true : ld.hasLeadingRest;
      handleUpdateLine(lineIdx, rebuildLineFromCharAnchors(ld.rawCleanChars, nextA, hasLead, leadBeat, ld.isPuxador, ld.lineSignature, ld.charSignatures));
    }
    setActiveStamp(activeStamp === beat ? null : beat);
  };

  const handleChangeMetric = (newSig) => {
    if (selectedCell && selectedCell.lineIdx < lines.length && selectedCell.charIdx >= 0) {
      const { lineIdx, charIdx } = selectedCell, ld = lineDetails[lineIdx];
      handleUpdateLine(lineIdx, rebuildLineFromCharAnchors(ld.rawCleanChars, ld.charAnchors, ld.hasLeadingRest, ld.leadingRestBeat, ld.isPuxador, ld.lineSignature, { ...ld.charSignatures, [charIdx]: newSig }));
    } else if (onChangeSignature) onChangeSignature(newSig);
  };

  const handleAddLineAfter = (idx) => { const next = [...lines]; next.splice(idx + 1, 0, ''); commitLines(next); };
  const handleAddSilenceMeasure = (idx = lines.length - 1) => {
    const next = [...lines]; next.splice(idx + 1, 0, generateEmptySilenceMeasure(lineDetails[idx]?.lineStartSig || signature)); commitLines(next);
  };
  const handleDeleteLine = (idx) => { if (lines.length <= 1) { commitLines(['']); return; } commitLines(lines.filter((_, i) => i !== idx)); };
  const handleSplitLine = (idx, l, r) => {
    const isPux = lines[idx]?.startsWith('*') && lines[idx]?.endsWith('*');
    let left = l.trim(), right = r.trim();
    if (isPux) {
      if (left && !left.endsWith('*')) left = `${left}*`;
      if (left && !left.startsWith('*')) left = `*${left}`;
      if (right && !right.startsWith('*')) right = `*${right}`;
      if (right && !right.endsWith('*')) right = `${right}*`;
    }
    const next = [...lines]; next.splice(idx, 1, left, right); commitLines(next);
  };
  const handleMergeWithPrev = (idx) => {
    if (idx <= 0) return;
    const next = [...lines], prev = next[idx - 1].trim(), curr = next[idx].trim();
    const prevPux = prev.startsWith('*') && prev.endsWith('*'), currPux = curr.startsWith('*') && curr.endsWith('*');
    const merged = prevPux && currPux ? `*${prev.slice(1, -1).trim()} ${curr.slice(1, -1).trim()}*` : `${prev} ${curr}`.trim();
    next.splice(idx - 1, 2, merged); commitLines(next);
  };
  const handlePullFromTab1 = () => { if (tab1Lyrics) { const g = groupLyricsByRole(tab1Lyrics); if (g.length) commitLines(g); } };
  const handleExportTxt = () => {
    const blob = new Blob([exportStructureAsTxt(lines, 'two-line')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `${titre ? titre.toLowerCase().replace(/\s+/g, '_') : 'toada'}_structure.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleApplyScanResult = (txt, alsoFill) => {
    if (!txt) return;
    const p = parseStructureTxt(txt); commitLines(p.length > 0 ? p : ['']);
    if (alsoFill && onUpdateTab1Lyrics) onUpdateTab1Lyrics(extractVaralLyricsFromScanned(txt));
  };

  return (
    <div className="flex flex-col gap-2.5 w-full text-left bg-stone-50/80 p-3 rounded border border-cordel-master-dark/25 shadow-xs">
      <ToadaMusicalToolbar
        signature={activeToolbarSig} onChangeSignature={handleChangeMetric} totalMeasures={totalMeasures}
        activeStamp={activeStamp} onSelectStamp={handleSelectStamp} mode={mode} onChangeMode={setMode} hasSelectedCell={Boolean(selectedCell)}
        onImportTxt={(c) => { const p = parseStructureTxt(c); if (p.length) commitLines(p); }} onExportTxt={handleExportTxt} onPullFromTab1={handlePullFromTab1}
        onOpenPrintStylo={() => setShowPrintStylo(true)} onOpenScanModal={() => setShowScanModal(true)} onOpenLegendModal={() => setShowLegendModal(true)} disabled={disabled}
      />
      <div className="bg-[#fefdfa] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md shadow-xs p-2 md:p-3 flex flex-col divide-y divide-stone-200/60 dark:divide-stone-800 w-full">
        {lines.map((line, idx) => (
          <ToadaMusicalLineRow
            key={idx} index={idx} lineText={line} parsedLine={lineDetails[idx]} mode={mode} activeStamp={activeStamp}
            selectedCharIdx={selectedCell?.lineIdx === idx ? selectedCell.charIdx : null}
            onSelectCharIdx={(cIdx) => setSelectedCell(cIdx === null ? null : { lineIdx: idx, charIdx: cIdx })}
            onChangeLine={(t) => handleUpdateLine(idx, t)} onDeleteLine={() => handleDeleteLine(idx)} onAddLineAfter={() => handleAddLineAfter(idx)}
            onSplitLine={handleSplitLine} onMergeWithPrevious={handleMergeWithPrev} disabled={disabled}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 w-full pt-1">
        <button type="button" onClick={() => handleAddLineAfter(lines.length - 1)} disabled={disabled}
          className="flex-1 py-1.5 text-[9.5px] font-black uppercase text-cordel-wood bg-white hover:bg-amber-50 border border-dashed border-cordel-master-dark/40 rounded cursor-pointer transition-colors shadow-2xs">
          + {t('toada.addMeasureBtn') || "Ajouter une ligne de chant"}
        </button>
        <button type="button" onClick={() => handleAddSilenceMeasure(lines.length - 1)} disabled={disabled}
          className="px-3 py-1.5 text-[9.5px] font-black uppercase text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer transition-colors shadow-2xs">
          🔇 + {t('toada.addSilenceBtn') || "Mesure vide"}
        </button>
      </div>
      <ToadaPrintStyloView isOpen={showPrintStylo} onClose={() => setShowPrintStylo(false)} lines={lines} metadata={{ titre, signature, bpmDefaut, tonaliteDefaut, rythme }} />
      <ToadaScanPromptModal isOpen={showScanModal} onClose={() => setShowScanModal(false)} onApplyResult={handleApplyScanResult} tab1Lyrics={tab1Lyrics} signature={signature} />
      <ToadaLegendModal isOpen={showLegendModal} onClose={() => setShowLegendModal(false)} />
    </div>
  );
}
