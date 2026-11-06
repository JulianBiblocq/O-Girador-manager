import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import { parseStructureTxt } from '../../../utils/toadaTwoLineConverter';

export default function ToadaBulkPasteModal({ isOpen = false, onClose, lines = [], onApplyLines }) {
  const { language } = useTranslation();
  const isPt = language === 'pt';
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRawText((lines || []).filter((l) => l !== null && l !== undefined).join('\n'));
    }
  }, [isOpen, lines]);

  if (!isOpen) return null;

  const parsedLines = parseStructureTxt(rawText);

  const handleApply = (mode = 'replace') => {
    const next = parsedLines.length > 0 ? parsedLines : [''];
    if (onApplyLines) onApplyLines(next, mode);
    if (onClose) onClose();
  };

  const handleInsertPauseTag = () => {
    setRawText((prev) => `${prev.trimEnd()}\n[PAUSE 1M]\n`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3" onClick={onClose}>
      <div
        className="bg-[#fdfbf7] dark:bg-stone-900 border-2 border-cordel-master-dark rounded-lg shadow-2xl w-full max-w-2xl p-4 flex flex-col gap-3 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-300 dark:border-stone-700 pb-2">
          <div>
            <h3 className="text-sm font-black uppercase text-stone-900 dark:text-stone-100">
              📋 {isPt ? 'Colar / Editar todo o canto (Multi-linhas)' : 'Coller / Éditer tout le texte (Multi-lignes)'}
            </h3>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              {isPt
                ? '1 linha = 1 cartão • *Texto* para Puxador • [PAUSE 1M] para Pausa do Batuque'
                : '1 ligne = 1 carte • *Texte* pour Puxador • [PAUSE 1M] pour Pause Batuque'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="px-2 py-1 text-xs font-bold text-stone-500 hover:text-stone-900 cursor-pointer">✕</button>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] bg-amber-50/80 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700 rounded px-2.5 py-1.5">
          <span className="font-mono text-stone-700 dark:text-stone-300">
            {isPt ? `${parsedLines.length} cartão(ões) detectado(s)` : `${parsedLines.length} carte(s) détectée(s)`}
          </span>
          <button
            type="button" onClick={handleInsertPauseTag}
            className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
          >
            + 🔇 [PAUSE 1M]
          </button>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={12}
          autoFocus
          placeholder={
            isPt
              ? '*[3]De norte a [1]sul [3]deste pa[1]ís*\n[3]De norte a [1]sul [3]deste pa[1]ís\n[PAUSE 1M]\n*[3]Trouxe [1]meu baque [3]de [1]roda*'
              : '*[3]De norte a [1]sul [3]deste pa[1]ís*\n[3]De norte a [1]sul [3]deste pa[1]ís\n[PAUSE 1M]\n*[3]Trouxe [1]meu baque [3]de [1]roda*'
          }
          className="w-full font-mono text-xs p-2.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:border-cordel-wood outline-hidden resize-y"
        />

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button" onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-bold text-stone-600 hover:bg-stone-200 cursor-pointer"
          >
            {isPt ? 'Cancelar' : 'Annuler'}
          </button>
          <button
            type="button" onClick={() => handleApply('append')}
            className="px-3 py-1.5 rounded text-xs font-black uppercase bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
          >
            ➕ {isPt ? 'Adicionar ao final' : 'Ajouter à la suite'}
          </button>
          <button
            type="button" onClick={() => handleApply('replace')}
            className="px-3.5 py-1.5 rounded text-xs font-black uppercase bg-cordel-wood hover:bg-amber-900 text-white shadow-xs cursor-pointer"
          >
            ✓ {isPt ? `Aplicar (${parsedLines.length} cartões)` : `Valider tout le chant (${parsedLines.length} cartes)`}
          </button>
        </div>
      </div>
    </div>
  );
}

