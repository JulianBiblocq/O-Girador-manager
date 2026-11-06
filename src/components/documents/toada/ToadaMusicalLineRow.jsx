import React, { useState, useRef } from 'react';
import { useTranslation } from '../../LanguageContext';
import { parseLineToCharAnchors, rebuildLineFromCharAnchors, computePhraseMeasures } from '../../../utils/toadaLineEditorHelper';
import { parseStructureTxt } from '../../../utils/toadaTwoLineConverter';
import ToadaCharAnchorCell from './ToadaCharAnchorCell';

export default function ToadaMusicalLineRow({
  index = 0, totalLines = 1, lineText = '', onChangeLine, onDeleteLine, onAddLineAfter, onAddPauseAfter,
  onMoveLine, onPasteMultiLines, onSplitLine, onMergeWithPrevious,
  mode = 'time', activeStamp = null, selectedCharIdx = null, onSelectCharIdx, parsedLine = null, disabled = false
}) {
  const { t, language } = useTranslation();
  const [hoverIdx, setHoverIdx] = useState(null);
  const lastKeyTimeRef = useRef({ key: '', time: 0 });
  const p = parsedLine || parseLineToCharAnchors(lineText);
  const phraseInfo = p.phraseInfo || computePhraseMeasures(lineText, p);
  const { isPuxador, isTutti, isPauseBaque, pauseMeasures, hasLeadingRest, leadingRestBeat, rawCleanChars, charAnchors, charSignatures, charPuxadorFlags, charUnderlineFlags, lineSignature, charMeasureNums, charEffectiveSigs } = p;
  const pauseLabel = language === 'pt' ? '🔇 Pausa do Baque' : (t('toada.pauseBaqueCardTitle') || '🔇 Pause Baque');
  const badgeText = isPauseBaque ? `${pauseLabel} • ${pauseMeasures} M` : phraseInfo.badgeLabel;

  const handleCommit = (anchors, withRest = hasLeadingRest, restBeat = leadingRestBeat, sigs = charSignatures, nextPux = isPuxador, nextTutti = isTutti) => {
    onChangeLine(rebuildLineFromCharAnchors(rawCleanChars, anchors, withRest, restBeat, nextPux, lineSignature, sigs, charUnderlineFlags, nextTutti));
  };

  const handleCycleRole = () => {
    if (disabled || isPauseBaque) return;
    if (!isPuxador && !isTutti) handleCommit(charAnchors, hasLeadingRest, leadingRestBeat, charSignatures, true, false);
    else if (isPuxador && !isTutti) handleCommit(charAnchors, hasLeadingRest, leadingRestBeat, charSignatures, true, true);
    else handleCommit(charAnchors, hasLeadingRest, leadingRestBeat, charSignatures, false, false);
  };

  const handleCharClick = (cIdx) => {
    if (disabled || mode !== 'time') return;
    if (activeStamp) {
      if (cIdx === -1) handleCommit(charAnchors, true, activeStamp);
      else { const next = { ...charAnchors }; if (next[cIdx] === activeStamp) delete next[cIdx]; else next[cIdx] = activeStamp; handleCommit(next); }
    } else if (onSelectCharIdx) onSelectCharIdx(cIdx);
  };

  const handleDeleteAnchorAt = (cIdx) => {
    if (cIdx === -1) { handleCommit(charAnchors, false, null); return; }
    const next = { ...charAnchors }, nextSigs = { ...charSignatures };
    delete next[cIdx]; delete nextSigs[cIdx];
    handleCommit(next, hasLeadingRest, leadingRestBeat, nextSigs);
  };

  const handleKeyDownChar = (e, cIdx) => {
    if (mode !== 'time' || disabled) return;
    const now = Date.now(), last = lastKeyTimeRef.current;
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (onSelectCharIdx) onSelectCharIdx(cIdx > 0 ? cIdx - 1 : (hasLeadingRest && cIdx === 0 ? -1 : null)); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (onSelectCharIdx) onSelectCharIdx(cIdx === -1 ? 0 : (cIdx < rawCleanChars.length - 1 ? cIdx + 1 : null)); return; }
    if (['Backspace', 'Delete', '0'].includes(e.key)) { e.preventDefault(); handleDeleteAnchorAt(cIdx); return; }
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const currentSig = (cIdx >= 0 ? charEffectiveSigs?.[cIdx] : null) || '4/4';
      const maxBeats = currentSig === '2/4' ? 2 : currentSig === '3/4' ? 3 : currentSig === '6/8' ? 6 : currentSig === '12/8' ? 12 : 4;
      let beat = parseInt(e.key, 10);
      if (last.key === '1' && now - last.time < 500) { const combo = parseInt(`1${e.key}`, 10); if (combo <= maxBeats) beat = combo; }
      lastKeyTimeRef.current = { key: e.key, time: now };
      if (beat <= maxBeats) { if (cIdx === -1) handleCommit(charAnchors, true, beat); else handleCommit({ ...charAnchors, [cIdx]: beat }); }
    }
  };

  const handleTextKeyDown = (e) => {
    const ta = e.currentTarget, s = ta.selectionStart, end = ta.selectionEnd, val = ta.value;
    if (e.key === 'Enter') { e.preventDefault(); if (onSplitLine) onSplitLine(index, val.slice(0, s), val.slice(end)); }
    else if (e.key === 'Backspace' && s === 0 && end === 0 && index > 0) { e.preventDefault(); if (onMergeWithPrevious) onMergeWithPrevious(index); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && s !== end) {
      e.preventDefault(); const sel = val.slice(s, end), w = sel.startsWith('*') && sel.endsWith('*') ? sel.slice(1, -1) : `*${sel}*`;
      onChangeLine(val.slice(0, s) + w + val.slice(end));
    }
  };

  const handleTextPaste = (e) => {
    if (disabled || !onPasteMultiLines) return;
    const clip = e.clipboardData?.getData('text') || '';
    if (/\r?\n/.test(clip)) { e.preventDefault(); const parsed = parseStructureTxt(clip); if (parsed.length > 0) onPasteMultiLines(index, parsed); }
  };

  return (
    <div draggable={!disabled && Boolean(onMoveLine)} onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(e) => { if (!disabled && onMoveLine) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!Number.isNaN(from) && from !== index && onMoveLine) onMoveLine(from, index); }}
      className={`group relative flex items-start gap-2 py-1.5 px-2 rounded transition-colors text-left w-full ${isPauseBaque ? 'bg-stone-100/80 dark:bg-stone-800/60 border border-dashed border-stone-300 dark:border-stone-700 my-0.5' : 'hover:bg-amber-50/40'}`}>
      <div className="flex flex-col items-start gap-0.5 shrink-0 pt-1 select-none w-32 md:w-36">
        <div className="flex items-center gap-1 w-full">
          <span className="cursor-grab text-[10px] text-stone-400 hover:text-stone-700" title="Glisser pour déplacer">⠿</span>
          <span className="text-[9px] font-mono font-bold text-stone-400">#{index + 1}</span>
          {onMoveLine && (
            <div className="flex items-center gap-0.5 ml-auto">
              <button type="button" disabled={disabled || index === 0} onClick={() => onMoveLine(index, index - 1)} className="px-1 py-0 text-[9px] font-bold rounded text-stone-500 hover:text-cordel-wood hover:bg-stone-200/70 disabled:opacity-25 cursor-pointer" title="Monter cette carte">▲</button>
              <button type="button" disabled={disabled || index >= totalLines - 1} onClick={() => onMoveLine(index, index + 1)} className="px-1 py-0 text-[9px] font-bold rounded text-stone-500 hover:text-cordel-wood hover:bg-stone-200/70 disabled:opacity-25 cursor-pointer" title="Descendre cette carte">▼</button>
            </div>
          )}
        </div>
        <span onClick={handleCycleRole} title={!isPauseBaque ? 'Cliquer pour basculer : Coro → Puxador (*) → Ensemble Pux+Coro (***)' : undefined} className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border shadow-2xs truncate max-w-full ${!isPauseBaque && !disabled ? 'cursor-pointer hover:brightness-95' : ''} ${isPauseBaque ? 'bg-stone-200 text-stone-800 border-stone-400' : isTutti ? 'bg-purple-100 text-purple-950 border-purple-300' : isPuxador ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-stone-100 text-stone-700 border-stone-300'}`}>{badgeText}</span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {mode === 'text' ? (
          <input type="text" value={lineText} onChange={(e) => onChangeLine(e.target.value)} onKeyDown={handleTextKeyDown} onPaste={handleTextPaste} disabled={disabled}
            placeholder="[1] _ [2]Vovó falou [3]e'o... (*Puxador*) ou [PAUSE 2M] (Collez plusieurs lignes d'un coup)"
            className="w-full text-xs font-mono py-1 px-1.5 bg-transparent border-0 border-b border-stone-200 focus:border-cordel-wood focus:bg-white/80 outline-hidden transition-colors" />
        ) : isPauseBaque ? (
          <div className="flex flex-wrap items-center gap-2 py-1">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-200">🥁 {language === 'pt' ? 'O Baque toca sozinho :' : (t('toada.pauseBaqueSolo') || 'Le Baque joue seul :')}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
                <button key={m} type="button" disabled={disabled} onClick={() => onChangeLine(`${lineSignature ? `[sig:${lineSignature}] ` : ''}[PAUSE ${m}M]`)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border cursor-pointer transition-all ${pauseMeasures === m ? 'bg-cordel-wood text-white border-cordel-wood shadow-2xs scale-105' : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 hover:bg-amber-50'}`}>{m}M</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-x-0.5 gap-y-1 py-0.5 font-mono text-xs">
            {hasLeadingRest && (
              <ToadaCharAnchorCell key="leading-rest" char="_" cIdx={-1} anchor={leadingRestBeat || 1} measureNum={leadingRestBeat === 1 ? charMeasureNums?.[-1] : null} isSelected={selectedCharIdx === -1} isHovered={hoverIdx === -1}
                onMouseEnter={() => setHoverIdx(-1)} onMouseLeave={() => setHoverIdx(null)} onClick={() => handleCharClick(-1)} onDeleteAnchor={() => handleDeleteAnchorAt(-1)} onKeyDown={(e) => handleKeyDownChar(e, -1)} />
            )}
            {rawCleanChars.length === 0 && !hasLeadingRest ? (
              <div className="flex items-center gap-1.5 py-1 text-xs italic text-stone-400"><span>(Ligne vide — tapez en mode ✏️ Texte)</span></div>
            ) : (
              rawCleanChars.split('').map((char, cIdx) => (
                <ToadaCharAnchorCell key={cIdx} char={char} cIdx={cIdx} anchor={charAnchors[cIdx]} measureNum={charMeasureNums?.[cIdx]} sigChange={charSignatures?.[cIdx]}
                  isCharPuxador={charPuxadorFlags?.[cIdx]} isCharUnderlined={Boolean(charUnderlineFlags?.[cIdx])} isSelected={selectedCharIdx === cIdx} isHovered={hoverIdx === cIdx}
                  onMouseEnter={() => setHoverIdx(cIdx)} onMouseLeave={() => setHoverIdx(null)} onClick={() => handleCharClick(cIdx)} onDeleteAnchor={() => handleDeleteAnchorAt(cIdx)} onKeyDown={(e) => handleKeyDownChar(e, cIdx)} />
              ))
            )}
          </div>
        )}
      </div>

      <div className="opacity-75 group-hover:opacity-100 flex items-center gap-1 shrink-0 pt-2 transition-opacity">
        {index > 0 && !isPauseBaque && (
          <button type="button" onClick={() => onMergeWithPrevious?.(index)} disabled={disabled} className="p-1 rounded text-stone-400 hover:text-cordel-wood hover:bg-stone-100 cursor-pointer" title="Fusionner avec la ligne précédente (Backspace)">⬆️</button>
        )}
        {onAddPauseAfter && (
          <button type="button" onClick={onAddPauseAfter} disabled={disabled} className="px-1 py-0.5 rounded text-[10px] font-bold text-stone-600 hover:text-cordel-wood hover:bg-stone-200/80 cursor-pointer" title="Insérer une Pause Baque juste en dessous">+🔇</button>
        )}
        <button type="button" onClick={onAddLineAfter} disabled={disabled} className="p-1 rounded text-stone-400 hover:text-cordel-wood hover:bg-stone-100 cursor-pointer" title="Insérer une ligne juste en dessous">➕</button>
        <button type="button" onClick={onDeleteLine} disabled={disabled} className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Supprimer cette ligne">🗑️</button>
      </div>
    </div>
  );
}
