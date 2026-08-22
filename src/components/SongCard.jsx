import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PrintConfigModal from './PrintConfigModal';
import { getInstrumentStamp } from './InstrumentStampSVG';

/**
 * Modèle de données attendu pour une chanson (Fiche de Chant)
 * 
 * {
 *   id: string,
 *   titre: string,
 *   nacao: string,
 *   rythme: string,
 *   parolesOriginales: Array<{ puxador: string, coro: string }> | string,
 *   parolesPhonetiques: Array<{ puxador: string, coro: string }> | string,
 *   traduction: string,
 *   notesLexique: Array<{ mot: string, explication: string }> | string,
 *   anecdote: string (optionnel)
 * }
 */

export default function SongCard({ song, isPrintVersion = false, defaultRevisionMode = true, onPrintAll, printSections = null }) {
  const [activePuxador, setActivePuxador] = useState(false);
  const [activeChoeur, setActiveChoeur] = useState(false);
  const [localReveals, setLocalReveals] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [localPrintSections, setLocalPrintSections] = useState(null);
  
  const isRevealedMode = isPrintVersion || !defaultRevisionMode;
  const [isPrinting, setIsPrinting] = useState(false);

  const getSectionVisibility = (section) => {
    if (!isPrintVersion) return true;
    if (!printSections) return true;
    return !!printSections[section];
  };

  const renderFlashcard = (id, content, extraClass = "") => {
    if (isRevealedMode) {
      return <div className={`${extraClass}`}>{content}</div>;
    }

    if (localReveals[id]) {
      return (
        <div 
          onClick={() => setLocalReveals(prev => ({ ...prev, [id]: false }))} 
          className={`${extraClass} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {content}
        </div>
      );
    }
    return (
      <div 
        onClick={() => setLocalReveals(prev => ({ ...prev, [id]: true }))}
        className={`relative cursor-pointer group rounded border border-dashed border-cordel-master-dark/30 overflow-hidden bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center min-h-[1.5em] min-w-[60px] ${extraClass}`}
      >
        <div className="absolute inset-0 bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center transition-all group-hover:bg-[#fdfaf2]/90 dark:group-hover:bg-[#1a1816]/90 z-10">
          <span className="bg-cordel-wood text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-md transform group-hover:scale-105 transition-transform">
            👁️ Révéler
          </span>
        </div>
        <div className="opacity-0 select-none">
          {content}
        </div>
      </div>
    );
  };

  const renderHTMLorText = (content, extraClass = "") => {
    if (!content) return null;
    const isHtml = typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return <div className={`[&_p]:mb-2 [&_b]:font-black [&_strong]:font-black ${extraClass}`} dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return <div className={`whitespace-pre-wrap ${extraClass}`}>{content}</div>;
  };

  const parseLyricsString = (htmlString) => {
    if (!htmlString || typeof htmlString !== 'string') return htmlString;
    
    const isHtml = /<[a-z][\s\S]*>/i.test(htmlString);
    if (!isHtml) return htmlString;
    
    const div = document.createElement('div');
    div.innerHTML = htmlString
      .replace(/<\/?(p|div)[^>]*>/gi, (match) => match.startsWith('</') ? '<br/>' : '')
      .replace(/&nbsp;/gi, ' ');
      
    const blocks = [];
    let currentLineText = "";
    let currentLineHasBold = false;
    let hasAnyPuxador = false;

    const traverse = (node, isBold) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          currentLineText += text;
          if (isBold && text.trim().length > 0) {
            currentLineHasBold = true;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'br') {
          commitLine();
        } else {
          const tagName = node.tagName.toLowerCase();
          const isNodeBold = isBold || 
                             tagName === 'b' || 
                             tagName === 'strong' ||
                             (node.style && node.style.fontWeight && (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight, 10) >= 600)) ||
                             (node.classList && (node.classList.contains('font-bold') || node.classList.contains('font-black')));

          for (let i = 0; i < node.childNodes.length; i++) {
            traverse(node.childNodes[i], isNodeBold);
          }
        }
      }
    };

    const commitLine = () => {
      const textContent = currentLineText.trim();
      if (!textContent) {
        blocks.push(' ');
      } else {
        if (currentLineHasBold) {
          blocks.push({ puxador: textContent });
          hasAnyPuxador = true;
        } else {
          blocks.push({ coro: textContent });
        }
      }
      currentLineText = "";
      currentLineHasBold = false;
    };

    traverse(div, false);
    commitLine();
    
    if (!hasAnyPuxador) {
      return htmlString; // Fallback to raw string if no bold found
    }
    
    while (blocks.length > 0 && (typeof blocks[blocks.length - 1] === 'string' && blocks[blocks.length - 1].trim() === '')) {
      blocks.pop(); // Clean trailing empty spaces
    }
    
    return blocks;
  };

  const renderLyricsArray = (rawLyrics, sectionKey) => {
    let lyrics = rawLyrics;
    
    if (typeof rawLyrics === 'string') {
      const parsed = parseLyricsString(rawLyrics);
      if (Array.isArray(parsed)) {
        lyrics = parsed;
      }
    }

    if (!lyrics) return null;
    
    const isRevealed = !!localReveals[`${sectionKey}-section`];
    const nothingChecked = !activePuxador && !activeChoeur && !isRevealedMode;
    
    if (isRevealed && nothingChecked) {
      const messageContent = (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full w-full">
          <span className="text-2xl md:text-3xl mb-2 opacity-80">👆</span>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cordel-master-dark">
            Cochez "Puxador" ou "Coro" au-dessus pour afficher les paroles
          </p>
        </div>
      );
      return renderFlashcard(`${sectionKey}-section`, messageContent, "w-full min-h-[150px] p-2");
    }

    if (typeof lyrics === 'string') {
      const stringContent = (
        <div className="flex flex-col gap-2 w-full">
          {!isRevealedMode && (
            <div className="bg-[#f5f0e6] dark:bg-[#201d1a] text-[9px] text-cordel-master-dark p-2 rounded border border-dashed border-cordel-master-dark/30 italic mb-2">
              ⚠️ Ce chant est au format texte simple. Impossible de séparer automatiquement le Puxador et le Chœur.
            </div>
          )}
          {renderHTMLorText(lyrics, isRevealedMode ? 'leading-tight [&_p]:mb-1' : 'leading-relaxed')}
        </div>
      );
      return renderFlashcard(`${sectionKey}-section`, stringContent, "w-full min-h-[150px] p-2");
    }
    
    if (Array.isArray(lyrics)) {
      const arrayContent = (
        <div className={`flex flex-col ${isRevealedMode ? 'gap-1' : 'gap-3'} w-full`}>
          {lyrics.map((block, index) => {
            if (typeof block === 'string') {
              return <div key={index} className="whitespace-pre-wrap text-encre-noire font-medium">{block}</div>;
            }
            
            // On vérifie la clé JSON pour distinguer formellement le puxador du coro
            const puxadorText = block?.puxador;
            const coroText = block?.coro || block?.choeur;

            return (
              <div key={index} className={`flex flex-col ${isRevealedMode ? 'gap-0' : 'gap-1'} w-full`}>
                {puxadorText && (
                  <p className={`font-black text-encre-noire print:text-black transition-opacity duration-300 ${isRevealedMode ? 'leading-tight' : 'leading-relaxed'} ${activePuxador || isRevealedMode ? 'opacity-100' : 'opacity-0'}`}>
                    {puxadorText}
                  </p>
                )}
                {coroText && (
                  <p className={`font-medium text-encre-noire/90 print:text-black/90 italic pl-3 border-l-2 border-encre-noire/20 print:border-black/30 transition-opacity duration-300 ${isRevealedMode ? 'leading-tight' : 'leading-relaxed'} ${activeChoeur || isRevealedMode ? 'opacity-100' : 'opacity-0'}`}>
                    {coroText}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
      
      return renderFlashcard(`${sectionKey}-section`, arrayContent, "w-full min-h-[150px] p-2");
    }
    return null;
  };

  if (!song) return null;

  const handlePrint = ({ format, isBW, isBulk, printSections }) => {
    if (isBulk && onPrintAll) {
      setShowPrintModal(false);
      onPrintAll({ format, isBW, printSections });
      return;
    }
    setShowPrintModal(false);
    setLocalPrintSections(printSections);
    setIsPrinting(true);
    
    // Définir classes for print
    if (isBW) document.body.classList.add('print-bw');
    document.body.classList.add(`print-format-${format}`);
    document.body.classList.add('printing-song');

    // Inject @page size dynamically
    const styleId = 'dynamic-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const margins = { 'A5': '10mm', 'A4': '15mm', 'A3': '20mm' };
    styleEl.innerHTML = `@media print { @page { size: ${format}; margin: ${margins[format] || '15mm'}; } }`;

    setTimeout(() => {
      window.print();
      
      // Cleanup
      if (isBW) document.body.classList.remove('print-bw');
      document.body.classList.remove(`print-format-${format}`);
      document.body.classList.remove('printing-song');
      if (styleEl) styleEl.innerHTML = '';
      setIsPrinting(false);
    }, 100);
  };



  return (
    <>
      <div 
        id={`song-card-${song?.id || 'temp'}`}
        className="bg-[#fdfaf2] dark:bg-[#1a1816] border-2 border-encre-noire rounded-lg shadow-[3px_3px_0px_0px_#181716] w-full max-w-[560px] min-h-[790px] mx-auto overflow-hidden flex flex-col print:shadow-none print:border-none print:max-w-full print:min-h-0 print:h-auto print:mx-0 print:overflow-visible relative"
      >
      
      {/* Bouton d'impression uniquement */}
      {!isPrintVersion && (
        <div className="absolute top-3 left-3 z-20 print:hidden flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            title="Imprimer cette fiche"
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-cordel-master-dark/30 text-cordel-master-dark/60 hover:bg-neutral-100 transition-all hover:text-cordel-wood hover:border-cordel-wood"
          >
            🖨️
          </button>
        </div>
      )}

      {/* En-tête Carnet de Chants */}
      <table className="w-full table-fixed border-collapse">
        <thead className="table-header-group">
          <tr>
            <td className="p-4 md:p-6 pb-0 pt-4 print:pt-0">
              <div className="flex flex-col gap-1 md:gap-2 mt-2 md:mt-0">
                <div className="flex flex-col items-center justify-center relative w-full">
                  {/* En-tête titre centralisé */}
                  <h1 className="text-2xl md:text-4xl font-cactus tracking-widest text-[var(--color-cordel-ocre,#c05621)] text-center mt-1 print:mt-0 print:text-3xl relative z-20">
                    {song?.titre || "Titre Inconnu"}
                  </h1>
                </div>
                
                <div className="flex justify-between items-center mt-1 text-[10px] md:text-sm font-extrabold uppercase tracking-widest text-cordel-master-dark opacity-80">
                  <div className="text-left font-cactus text-base md:text-xl lowercase tracking-wider capitalize print:text-base">
                    {song?.nacao ? renderFlashcard('nacao', <span>{song.nacao}</span>) : null}
                  </div>
                  <div className="text-right font-cactus text-base md:text-xl lowercase tracking-wider capitalize print:text-base">
                    {song?.rythme ? renderFlashcard('rythme', <span>{song.rythme}</span>) : null}
                  </div>
                </div>
                
                <hr className="border-t-4 border-[var(--color-cordel-ocre,#c05621)] mt-2 print:mt-1 mb-1 md:mb-2" />
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 md:px-6 pb-6 pt-1 md:pt-2 print:pt-1">

      {/* Corps des Paroles (Grille 2 colonnes ou 1 colonne si trop étroit) */}
      <div className="w-full flex-1">
        {/* Toggles globaux pour les paroles */}
        {!isRevealedMode && (
          <div className="col-span-2 flex justify-center gap-4 md:gap-6 py-2 mb-4 bg-cordel-wood/5 rounded border border-cordel-wood/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={activePuxador} 
                onChange={(e) => setActivePuxador(e.target.checked)}
                className="accent-cordel-wood w-4 h-4 cursor-pointer"
              />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">👁️ Puxador (Soliste)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={activeChoeur} 
                onChange={(e) => setActiveChoeur(e.target.checked)}
                className="accent-cordel-wood w-4 h-4 cursor-pointer"
              />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">👁️ Coro (Chœur)</span>
            </label>
          </div>
        )}

        <div className={`grid ${getSectionVisibility('originale') && getSectionVisibility('phonetique') ? 'grid-cols-2' : 'grid-cols-1'} gap-3 md:gap-6 print:break-inside-avoid`}>
          {/* Colonne Originale */}
          {getSectionVisibility('originale') && (
            <div className="flex flex-col">
              <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 md:py-1.5 px-2 rounded font-cactus tracking-widest text-sm md:text-lg border border-encre-noire/10 mb-2 lowercase capitalize print:text-sm">
                Version Originale
              </h3>
              <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire px-1 md:px-2">
                {renderLyricsArray(song?.parolesOriginales, 'originales')}
              </div>
            </div>
          )}

          {/* Colonne Phonétique */}
          {getSectionVisibility('phonetique') && (
            <div className="flex flex-col">
              <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 text-center py-1 md:py-1.5 px-2 rounded font-cactus tracking-widest text-sm md:text-lg border border-encre-noire/10 mb-2 lowercase capitalize print:text-sm">
                Version Phonétique
              </h3>
              <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire/80 px-1 md:px-2">
                {renderLyricsArray(song?.parolesPhonetiques, 'phonetiques')}
              </div>
            </div>
          )}
        </div>

        {/* Sections additionnelles */}
        {(song?.traduction || (Array.isArray(song?.notesLexique) ? song.notesLexique.length > 0 : song?.notesLexique) || song?.anecdote) && (
          <div>
            {/* Séparateur pour la suite */}
            <hr className="border-t-4 border-encre-noire/10 my-4 md:my-6 print:hidden" />

            {/* Section Traduction */}
            {song?.traduction && getSectionVisibility('traduction') && (
              <div className="mb-4">
                <h3 className="text-lg md:text-2xl font-cactus tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 lowercase capitalize print:text-lg">
                  Traduction en français
                </h3>
                <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire px-1 md:px-2 italic">
                  {renderFlashcard('traduction', renderHTMLorText(song.traduction))}
                </div>
              </div>
            )}

            {/* Encart Lexique */}
            {((Array.isArray(song?.notesLexique) && song.notesLexique.length > 0) || (typeof song?.notesLexique === 'string' && song.notesLexique)) && getSectionVisibility('lexique') && (
              <div className="mt-4 bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-ocre,#c05621)] p-3 md:p-4 rounded-r-md print:mt-2">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 flex items-center gap-2 print:text-[10px]">
                  <span>📖</span> Lexique & Notes
                </h4>
                <div className="text-[10px] md:text-[11px] print:text-[9px] font-medium text-encre-noire leading-normal print:leading-snug">
                  {Array.isArray(song.notesLexique) ? (
                    <ul className="flex flex-col gap-2">
                      {song.notesLexique.map((note, index) => (
                        <li key={index} className="flex w-full">
                          {renderFlashcard(`lexique-${index}`, 
                            <div className="w-full"><span className="font-bold mr-1">{note?.mot || note?.mot_cle} :</span>{note?.explication || note?.definition}</div>,
                            "w-full"
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    renderFlashcard('lexique-all', <div className="whitespace-pre-wrap">{song.notesLexique}</div>)
                  )}
                </div>
              </div>
            )}

            {/* Section Anecdote */}
            {song?.anecdote && getSectionVisibility('anecdote') && (
              <div className="mt-4 bg-[#f5f0e6]/40 dark:bg-[#201d1a]/40 border border-dashed border-encre-noire/20 p-3 md:p-4 rounded-md print:mt-2">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cordel-master-dark opacity-75 mb-1 flex items-center gap-2 print:text-[10px]">
                  <span>💡</span> Anecdote
                </h4>
                <div className="text-[10px] md:text-[11px] print:text-[9px] font-medium text-encre-noire/90 leading-normal print:leading-snug italic">
                  {renderFlashcard('anecdote', renderHTMLorText(song.anecdote))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

    {showPrintModal && (
      <PrintConfigModal
        title={`Imprimer "${song.titre}"`}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handlePrint}
        allowBulk={!!onPrintAll}
      />
    )}

    {/* Portaled Print Version */}
    {isPrinting && createPortal(
      <div className="print:block bg-white w-full">
        <div className="print-song-page">
          <SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={localPrintSections} />
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
