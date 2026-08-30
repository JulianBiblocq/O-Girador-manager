import React, { useMemo, useState } from 'react';
import { getInstrumentStamp } from './InstrumentStampSVG';
import { XiloClose } from './XiloIcons';
import AutoEvalQuiz from './pedagogy/AutoEvalQuiz';

export default function InstrumentModelCard({ model, onClose }) {
  const [showQuiz, setShowQuiz] = useState(false);
  
  if (!model) return null;

  // Aggregate materials and tools from all parts for the summary
  const { globalMaterials, globalTools } = useMemo(() => {
    const mats = new Set();
    const tools = new Set();
    (model.parts || []).forEach(part => {
      (part.materiels || []).forEach(m => mats.add(m));
      (part.outils || []).forEach(t => tools.add(t));
    });
    return {
      globalMaterials: Array.from(mats),
      globalTools: Array.from(tools)
    };
  }, [model.parts]);

  const renderMedia = (url) => {
    if (!url) return null;
    const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('video');
    
    const mediaContainerClass = "relative bg-[var(--cordel-bg)] p-2 md:p-3 shadow-[3px_3px_0px_0px_var(--color-cordel-wood)] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-cordel-wood)] transform rotate-[1deg] w-full max-w-lg mx-auto";

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
          alt="Visuel" 
          className="w-full h-auto object-cover rounded-[var(--theme-border-radius)] block" 
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in outline-none"
      onClick={onClose}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div 
        className="relative bg-[var(--cordel-bg)] w-full max-w-4xl max-h-[95vh] flex flex-col rounded-[var(--theme-border-radius)] shadow-[5px_5px_0px_0px_#181716] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-5 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-cordel-wood)] mb-1">
              🛠️ Modèle d'Instrument & Tuto
            </span>
            <h2 className="font-cactus font-black text-2xl sm:text-3xl text-black leading-none">
              {model.nom}
            </h2>
            {model.type && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] uppercase font-bold text-gray-700 bg-black/10 px-2 py-0.5 rounded">
                  {model.type}
                </span>
                <div className="w-4 h-4 text-[var(--color-cordel-wood)] flex-shrink-0 opacity-80">
                   {getInstrumentStamp(model.type, "currentColor")}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--cordel-bg)]">
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            
            {/* Description */}
            {model.description && (
              <div className="bg-[#fdfaf2] p-4 sm:p-5 border-l-4 border-l-[var(--color-cordel-wood)] border-t-[var(--theme-border-width)] border-t-black/10 border-b-[var(--theme-border-width)] border-b-black/10 border-r-[var(--theme-border-width)] border-r-black/10 rounded-sm">
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-black">
                  {model.description}
                </div>
              </div>
            )}

            {/* Global Materials and Tools */}
            {(globalMaterials.length > 0 || globalTools.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalMaterials.length > 0 && (
                  <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm transform -rotate-[0.5deg]">
                    <h4 className="font-cactus font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80">
                      Nomenclature : Matériel Requis
                    </h4>
                    <ul className="list-disc pl-5 text-sm font-semibold text-black/90 space-y-1">
                      {globalMaterials.map((mat, idx) => (
                        <li key={idx}>{mat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {globalTools.length > 0 && (
                  <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm transform rotate-[0.5deg]">
                    <h4 className="font-cactus font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80">
                      Outils Nécessaires
                    </h4>
                    <ul className="list-disc pl-5 text-sm font-semibold text-black/90 space-y-1">
                      {globalTools.map((tool, idx) => (
                        <li key={idx}>{tool}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Parts List */}
            {model.parts && model.parts.length > 0 && (
              <div className="flex flex-col gap-6">
                <h3 className="font-cactus font-black text-2xl text-black border-b-[var(--theme-border-width)] border-dashed border-black/20 pb-2 text-center mt-4">
                  Les Pièces à Fabriquer ({model.parts.length})
                </h3>
                
                {model.parts.map((part, index) => (
                  <div key={part.id || index} className="flex flex-col gap-4 mb-8 bg-white/40 p-4 border border-dashed border-cordel-wood/30 rounded-lg">
                    <h4 className="font-black text-lg text-[var(--color-cordel-wood)] uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-[var(--color-cordel-wood)] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">
                        {index + 1}
                      </span>
                      {part.nom}
                    </h4>

                    {/* Steps for this part */}
                    {part.chapitres && part.chapitres.length > 0 ? (
                      <div className="flex flex-col gap-6 pl-4 md:pl-8">
                        {part.chapitres.map((step, stepIndex) => (
                          <div key={step.id || stepIndex} className="flex flex-col md:flex-row gap-4 sm:gap-6 bg-[#fdfaf2] p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black/10 rounded-sm">
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-[var(--color-cordel-ocre)] text-xl leading-none">
                                  {stepIndex + 1}.
                                </span>
                                {step.titre && (
                                  <h5 className="font-black text-base uppercase tracking-tight text-black">
                                    {step.titre}
                                  </h5>
                                )}
                              </div>
                              <div className="text-sm text-black/80 font-medium whitespace-pre-wrap leading-relaxed">
                                {step.texte}
                              </div>
                            </div>
                            
                            {step.photoUrl && (
                              <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
                                {renderMedia(step.photoUrl)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pl-4 md:pl-8 text-xs italic text-black/50">
                        Aucune étape de fabrication rédigée pour cette pièce.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>

        {/* Action Button: Lancer le Quiz */}
        {model.parts && model.parts.length > 0 && (
          <div className="flex justify-center p-4 bg-white/50 border-t border-dashed border-cordel-master-dark/10">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-cordel-wood text-white font-bold text-xs px-6 py-2 rounded shadow-[2px_2px_0px_0px_#181716] uppercase tracking-wider hover:bg-red-800 transition-colors active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
            >
              📝 Auto-Évaluation (Quiz)
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 p-3 bg-[#fdfaf2] border-t-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] text-center">
          <span className="font-cactus text-sm text-[var(--color-cordel-wood)] opacity-70">
            O Girador - Modèle Officiel
          </span>
        </div>
      </div>

      {showQuiz && (
        <AutoEvalQuiz 
          instrumentModelData={model}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
