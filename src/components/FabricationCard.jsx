import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CordelButton from './CordelButton';
import { XiloClose } from './XiloIcons';
import { getInstrumentStamp } from './InstrumentStampSVG';

/**
 * Modèle de données attendu pour une fiche de fabrication (TutosFabrication)
 * 
 * {
 *   id: string,
 *   titre: string,
 *   instrumentConcerne: string,
 *   materielRequis: string,
 *   outilsNecessaires: string,
 *   contenuFabrication: string,
 *   visuelAnimeUrl: string, // URL vidéo mp4 ou gif
 *   etapesFabrication: Array<{ sousTitre: string, description: string, imageUrl: string }>,
 *   notesLexique: string,
 *   questionsQcm: Array<{}>
 * }
 */
export default function FabricationCard({ fabrication, onClose }) {
  if (!fabrication) return null;

  const renderMedia = (url) => {
    if (!url) return null;
    const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('video');
    
    // Style Cordel: Bordure irrégulière, shadow, léger rotate
    const mediaContainerClass = "relative bg-[#fdfaf2] p-2 md:p-3 shadow-[3px_3px_0px_0px_var(--color-cordel-wood)] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-cordel-wood)] transform rotate-[1deg] w-full max-w-lg mx-auto";

    if (isVideo) {
      return (
        <div className={mediaContainerClass}>
          <video 
            src={url} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-auto object-cover rounded-[var(--theme-border-radius)] block"
          />
        </div>
      );
    }
    
    return (
      <div className={mediaContainerClass}>
        <img 
          src={url} 
          alt="Visuel de fabrication" 
          className="w-full h-auto object-cover rounded-[var(--theme-border-radius)] block" 
        />
      </div>
    );
  };

  const hasEtapes = fabrication.etapesFabrication && fabrication.etapesFabrication.length > 0;
  
  const normalizeTags = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const allMateriels = useMemo(() => normalizeTags(fabrication.materielRequis), [fabrication.materielRequis]);
  const allOutils = useMemo(() => normalizeTags(fabrication.outilsNecessaires), [fabrication.outilsNecessaires]);

  const [selectedEtapeId, setSelectedEtapeId] = useState(null);
  const activeEtape = (fabrication.etapesFabrication || []).find((e, idx) => {
    const etapeId = e.id || idx;
    return etapeId === selectedEtapeId;
  });
  
  // Modale principale
  const cardContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in outline-none"
      onClick={onClose}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div 
        className="relative bg-[#fdfaf2] w-full max-w-3xl max-h-[95vh] flex flex-col rounded-[var(--theme-border-radius)] shadow-[5px_5px_0px_0px_#181716] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la Modale */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-5 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-cordel-wood)] mb-1">
              🧵 Atelier de Fabrication (Varal)
            </span>
            <h2 className="font-cactus font-black text-2xl sm:text-3xl text-black leading-none">
              {fabrication.titre}
            </h2>
            {fabrication.instrumentConcerne && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] uppercase font-bold text-gray-700 bg-black/10 px-2 py-0.5 rounded">
                  {fabrication.instrumentConcerne}
                </span>
                <div className="w-4 h-4 text-[var(--color-cordel-wood)] flex-shrink-0 opacity-80">
                   {getInstrumentStamp(fabrication.instrumentConcerne, "currentColor")}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--color-cordel-rouge)] hover:opacity-70 p-2 cursor-pointer transition-opacity"
            title="Fermer"
          >
            <XiloClose size={24} />
          </button>
        </div>

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fdfaf2]">
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            
            {/* Visuel Anime Principal (Proéminent) */}
            {fabrication.visuelAnimeUrl && (
              <div className="w-full flex justify-center py-4">
                {renderMedia(fabrication.visuelAnimeUrl)}
              </div>
            )}

            {/* Matériel & Outils */}
            {(allMateriels.length > 0 || allOutils.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allMateriels.length > 0 && (
                  <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm transform -rotate-[0.5deg]">
                    <h4 className="font-cactus font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80 flex items-center justify-between">
                      Matériel Requis
                      {selectedEtapeId !== null && <span className="text-[9px] font-sans uppercase font-bold tracking-widest text-black/50 bg-black/5 px-2 py-1 rounded">Étape Filtrée</span>}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allMateriels.map(mat => {
                        const isSelected = activeEtape?.materiaux?.includes(mat);
                        const isNeutral = selectedEtapeId === null;
                        
                        let badgeClass = "text-xs font-semibold px-2 py-1 rounded border transition-all ";
                        if (isNeutral) {
                          badgeClass += "bg-[#fdfaf2] text-black/90 border-black/20 shadow-sm opacity-100";
                        } else if (isSelected) {
                          badgeClass += "bg-[var(--color-cordel-wood)] text-white border-[var(--color-cordel-wood)] shadow-md font-bold scale-105";
                        } else {
                          badgeClass += "opacity-30 bg-black/5 text-black/40 border-black/10 scale-95";
                        }
                        
                        return (
                          <span key={mat} className={badgeClass}>
                            {mat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {allOutils.length > 0 && (
                  <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm transform rotate-[0.5deg]">
                    <h4 className="font-cactus font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80 flex items-center justify-between">
                      Outils Nécessaires
                      {selectedEtapeId !== null && <span className="text-[9px] font-sans uppercase font-bold tracking-widest text-black/50 bg-black/5 px-2 py-1 rounded">Étape Filtrée</span>}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allOutils.map(outil => {
                        const isSelected = activeEtape?.outils?.includes(outil);
                        const isNeutral = selectedEtapeId === null;
                        
                        let badgeClass = "text-xs font-semibold px-2 py-1 rounded border transition-all ";
                        if (isNeutral) {
                          badgeClass += "bg-[#fdfaf2] text-black/90 border-black/20 shadow-sm opacity-100";
                        } else if (isSelected) {
                          badgeClass += "bg-[var(--color-cordel-wood)] text-white border-[var(--color-cordel-wood)] shadow-md font-bold scale-105";
                        } else {
                          badgeClass += "opacity-30 bg-black/5 text-black/40 border-black/10 scale-95";
                        }
                        
                        return (
                          <span key={outil} className={badgeClass}>
                            {outil}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contenu global */}
            {fabrication.contenuFabrication && (
              <div className="bg-[#fdfaf2] p-4 sm:p-5 border-l-4 border-l-[var(--color-cordel-wood)] border-t-[var(--theme-border-width)] border-t-black/10 border-b-[var(--theme-border-width)] border-b-black/10 border-r-[var(--theme-border-width)] border-r-black/10 rounded-sm">
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-black">
                  {fabrication.contenuFabrication}
                </div>
              </div>
            )}

            {/* Étapes pas à pas */}
            {hasEtapes && (
              <div className="flex flex-col gap-6">
                <h3 className="font-cactus font-black text-2xl text-center text-black mt-4">
                  Étapes de Fabrication
                </h3>
                
                <div className="flex flex-col gap-8 relative before:absolute before:inset-y-0 before:left-[15px] sm:before:left-[27px] before:w-1 before:bg-[var(--color-cordel-wood)] before:opacity-20 before:rounded">
                  {fabrication.etapesFabrication.map((etape, idx) => {
                    const etapeId = etape.id || idx;
                    const isSelected = selectedEtapeId === etapeId;
                    
                    return (
                      <div 
                        key={etapeId} 
                        className={`relative pl-12 sm:pl-16 w-full flex flex-col md:flex-row gap-4 items-start cursor-pointer group transition-all ${isSelected ? 'scale-[1.01]' : ''}`}
                        onClick={() => setSelectedEtapeId(prev => prev === etapeId ? null : etapeId)}
                      >
                        {/* Numéro de l'étape */}
                        <div className={`absolute left-0 top-0 w-8 h-8 sm:w-14 sm:h-14 border-[var(--theme-border-width)] border-[var(--theme-border-style)] rounded-full flex items-center justify-center z-10 text-white font-cactus font-black text-lg sm:text-2xl transform -rotate-6 transition-all ${
                          isSelected ? 'bg-[var(--color-cordel-wood)] border-black shadow-[3px_3px_0px_0px_var(--color-cordel-wood)] scale-110' : 'bg-[var(--color-cordel-vert)] border-black shadow-[2px_2px_0px_0px_#181716] group-hover:scale-105'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        <div className={`flex-1 p-4 border-[var(--theme-border-width)] border-[var(--theme-border-style)] rounded-sm w-full transition-all ${
                          isSelected ? 'bg-[#fffaf5] border-[var(--color-cordel-wood)] shadow-[4px_4px_0px_0px_var(--color-cordel-wood)] ring-2 ring-[var(--color-cordel-wood)]/20' : 'bg-[#fdfaf2] border-black shadow-[2px_2px_0px_0px_#181716] group-hover:shadow-[3px_3px_0px_0px_#181716]'
                        }`}>
                          <div className="flex items-center justify-between mb-2 border-b-[var(--theme-border-width)] border-dashed border-gray-300 pb-1">
                            <h4 className={`font-black text-base transition-colors ${isSelected ? 'text-[var(--color-cordel-wood)]' : 'text-black'}`}>
                              {etape.sousTitre}
                            </h4>
                            {isSelected && (
                              <span className="text-[9px] uppercase font-bold text-white bg-[var(--color-cordel-wood)] px-2 py-0.5 rounded shadow-sm">
                                ✓ Étape Active
                              </span>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap text-xs sm:text-sm text-black/80 font-medium">
                            {etape.description}
                          </div>
                          
                          {/* Pastilles locales à l'étape */}
                          {((etape.materiaux && etape.materiaux.length > 0) || (etape.outils && etape.outils.length > 0)) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(etape.materiaux || []).map(mat => (
                                <span key={mat} className="text-[9px] font-bold text-[var(--color-cordel-wood)] bg-[var(--color-cordel-wood)]/10 px-2 py-1 rounded border border-[var(--color-cordel-wood)]/30">
                                  {mat}
                                </span>
                              ))}
                              {(etape.outils || []).map(outil => (
                                <span key={outil} className="text-[9px] font-bold text-[var(--color-cordel-wood)] bg-[var(--color-cordel-wood)]/10 px-2 py-1 rounded border border-[var(--color-cordel-wood)]/30">
                                  🛠 {outil}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Visuel de l'étape (Optionnel) */}
                        {etape.imageUrl && (
                          <div className="w-full md:w-[40%] flex-shrink-0 mt-2 md:mt-0">
                            {renderMedia(etape.imageUrl)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Astérisques / Vocabulaire */}
            {((Array.isArray(fabrication.notesLexique) && fabrication.notesLexique.length > 0) || (typeof fabrication.notesLexique === 'string' && fabrication.notesLexique)) && (
              <div className="mt-4 p-4 bg-gray-100/50 border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-gray-300 rounded-[var(--theme-border-radius)]">
                <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                  Lexique & Vocabulaire
                </h4>
                <div className="text-xs font-semibold text-black/70 whitespace-pre-wrap">
                  {Array.isArray(fabrication.notesLexique) ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {fabrication.notesLexique.map((note, idx) => (
                        <li key={idx}>
                          <span className="font-bold">{note.mot}</span> : {note.explication}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    fabrication.notesLexique
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2] flex justify-end">
          <CordelButton variant="default" onClick={onClose} className="px-6 py-2 text-sm">
            Fermer le tutoriel
          </CordelButton>
        </div>
      </div>
    </div>
  );

  return createPortal(cardContent, document.body);
}
