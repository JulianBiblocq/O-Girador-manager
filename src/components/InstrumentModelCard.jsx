import React, { useMemo, useState, useEffect } from 'react';
import { getInstrumentStamp } from './InstrumentStampSVG';
import { XiloClose } from './XiloIcons';
import AutoEvalQuiz from './pedagogy/AutoEvalQuiz';
import { normalizePartSteps } from '../utils/workshopProjectionUtils';

/**
 * Modale technique de consultation interactive d'un modèle d'instrument
 * ou d'une pièce usinée spécifique avec déroulé des étapes pas-à-pas.
 *
 * @param {Object} props
 * @param {Object} props.model - Données du modèle d'instrument
 * @param {string|null} [props.initialPartId] - Identifiant éventuel de la pièce à focaliser au chargement
 * @param {Function} props.onClose - Callback de fermeture de la modale
 */
export default function InstrumentModelCard({ model, initialPartId = null, onClose, profileData }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(initialPartId || model?.focusedPartId || null);

  // Synchronisation si le prop initialPartId ou model change
  useEffect(() => {
    if (initialPartId) {
      setSelectedPartId(initialPartId);
    } else if (model?.focusedPartId) {
      setSelectedPartId(model.focusedPartId);
    }
  }, [initialPartId, model?.focusedPartId]);

  // Recherche de la pièce active focalisée
  const activePart = useMemo(() => {
    if (!selectedPartId || !model?.parts) return null;
    return model.parts.find((p, idx) => (
      (p.id && p.id === selectedPartId) ||
      `part_${idx}` === selectedPartId ||
      p.nom === selectedPartId
    )) || null;
  }, [model?.parts, selectedPartId]);

  // Agréger les matières et outils de toutes les pièces pour la fiche d'ensemble globale
  const { globalMaterials, globalTools } = useMemo(() => {
    const mats = new Set();
    const tools = new Set();
    (model?.parts || []).forEach(part => {
      (part.materiels || []).forEach(m => mats.add(m));
      (part.outils || []).forEach(t => tools.add(t));
    });
    return {
      globalMaterials: Array.from(mats),
      globalTools: Array.from(tools)
    };
  }, [model?.parts]);

  if (!model) return null;

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
          alt="Visuel technique"
          className="w-full h-auto object-cover rounded-[var(--theme-border-radius)] block"
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in outline-none select-none"
      onClick={onClose}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="relative bg-[var(--cordel-bg)] w-full max-w-4xl max-h-[95vh] flex flex-col rounded-[var(--theme-border-radius)] shadow-[5px_5px_0px_0px_#181716] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black overflow-hidden select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête principal */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-5 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-cordel-wood)]">
                🛠️ Atelier Lutherie
              </span>
              {activePart ? (
                <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-100 border border-amber-800/30 px-2 py-0.5 rounded">
                  Fiche Pièce d'Usinage
                </span>
              ) : (
                <span className="text-[9px] uppercase font-bold text-gray-700 bg-black/10 px-2 py-0.5 rounded">
                  Gabarit & Fiche d'Ensemble
                </span>
              )}
            </div>

            <h2 className="font-cactus font-black text-2xl sm:text-3xl text-black leading-none mt-1">
              {model.nom}
            </h2>

            {/* Fil d'Ariane contextuel */}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setSelectedPartId(null)}
                className={`text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${!activePart ? 'text-[var(--color-cordel-wood)] underline' : 'text-gray-600 hover:text-black'}`}
              >
                📐 Ensemble ({model.parts?.length || 0} pièces)
              </button>

              {activePart && (
                <>
                  <span className="text-gray-400">➜</span>
                  <span className="font-black text-encre-noire bg-amber-200/50 px-2 py-0.5 rounded border border-encre-noire/20">
                    ⚙️ {activePart.nom}
                  </span>
                </>
              )}

              {model.type && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[9px] uppercase font-bold text-gray-600 bg-black/5 px-2 py-0.5 rounded">
                    {model.type}
                  </span>
                  <div className="w-4 h-4 text-[var(--color-cordel-wood)] flex-shrink-0 opacity-80">
                    {getInstrumentStamp(model.type, "currentColor")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--color-cordel-rouge)] hover:opacity-70 p-2 cursor-pointer transition-opacity shrink-0 ml-2"
            title="Fermer"
          >
            <XiloClose size={24} />
          </button>
        </div>

        {/* Barre de navigation rapide entre les pièces si plusieurs pièces déclarées */}
        {model.parts && model.parts.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 sm:px-6 py-2 bg-cordel-bg-light border-b border-dashed border-cordel-master-dark/15 overflow-x-auto select-none">
            <span className="text-[9px] font-black uppercase tracking-wider text-cordel-wood shrink-0 mr-1">
              Pièces :
            </span>
            <button
              type="button"
              onClick={() => setSelectedPartId(null)}
              className={`text-[9.5px] font-bold px-2 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                !activePart
                  ? 'bg-cordel-wood text-white shadow-xs'
                  : 'bg-white/60 text-encre-noire hover:bg-white border border-encre-noire/15'
              }`}
            >
              Vue d'ensemble
            </button>
            {model.parts.map((p, idx) => {
              const partKey = p.id || `part_${idx}`;
              const isSelected = activePart && ((p.id && p.id === activePart.id) || p.nom === activePart.nom);
              const stepsCount = normalizePartSteps(p).length;

              return (
                <button
                  key={partKey}
                  type="button"
                  onClick={() => setSelectedPartId(partKey)}
                  className={`text-[9.5px] font-bold px-2 py-1 rounded transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-encre-noire text-[#FEF9E7] shadow-xs'
                      : 'bg-white/60 text-encre-noire hover:bg-white border border-encre-noire/15'
                  }`}
                  title={`${p.nom} (${stepsCount} étapes)`}
                >
                  <span>{idx + 1}. {p.nom}</span>
                  {stepsCount > 0 && (
                    <span className={`text-[8px] font-black px-1 rounded-full ${isSelected ? 'bg-white/20 text-[#FEF9E7]' : 'bg-black/10 text-gray-700'}`}>
                      {stepsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--cordel-bg)]">
          <div className="flex flex-col gap-6 max-w-3xl mx-auto">

            {/* CAS 1 : FOCUS SUR UNE PIÈCE SPÉCIFIQUE */}
            {activePart ? (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Bandeau d'en-tête de la pièce */}
                <div className="bg-[#fdfaf2] p-4 sm:p-5 border-l-4 border-l-[var(--color-cordel-wood)] border border-black/10 rounded-sm shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-cordel-wood)] block mb-0.5">
                      Fiche d'usinage détaillée
                    </span>
                    <h3 className="font-cactus font-black text-2xl text-black leading-tight">
                      {activePart.nom}
                    </h3>
                    {activePart.quantiteRequise && (
                      <span className="text-xs font-bold text-gray-700 mt-1 inline-block">
                        Quantité requise par instrument : <span className="text-black font-black">{activePart.quantiteRequise}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPartId(null)}
                    className="self-start sm:self-center text-xs font-bold px-3 py-1.5 rounded bg-white border border-encre-noire/30 hover:bg-neutral-100 shadow-xs cursor-pointer"
                  >
                    ⬅️ Retour à l'ensemble
                  </button>
                </div>

                {/* Encarts Outils et Matières spécifiques à la pièce */}
                {((activePart.materiels && activePart.materiels.length > 0) || (activePart.outils && activePart.outils.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePart.materiels && activePart.materiels.length > 0 && (
                      <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm">
                        <h4 className="font-cactus font-black text-base text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-85">
                          🪵 Matières Premières Nécessaires
                        </h4>
                        <ul className="list-disc pl-5 text-sm font-semibold text-black/90 space-y-1">
                          {activePart.materiels.map((mat, idx) => (
                            <li key={idx}>{mat}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activePart.outils && activePart.outils.length > 0 && (
                      <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm">
                        <h4 className="font-cactus font-black text-base text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-85">
                          🔨 Outils Nécessaires
                        </h4>
                        <ul className="list-disc pl-5 text-sm font-semibold text-black/90 space-y-1">
                          {activePart.outils.map((tool, idx) => (
                            <li key={idx}>{tool}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Déroulé pas-à-pas des étapes d'usinage de la pièce */}
                {(() => {
                  const steps = normalizePartSteps(activePart);
                  if (steps.length === 0) {
                    return (
                      <div className="bg-white/50 p-6 border border-dashed border-cordel-wood/30 rounded-lg text-center text-xs italic text-black/60">
                        Aucune étape d'usinage rédigée pour cette pièce dans l'Atelier.
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-5">
                      <h4 className="font-cactus font-black text-xl text-black border-b-[var(--theme-border-width)] border-dashed border-black/20 pb-2">
                        Étapes d'usinage & fabrication ({steps.length})
                      </h4>

                      {steps.map((step, stepIndex) => (
                        <div
                          key={step.id || stepIndex}
                          className="flex flex-col md:flex-row gap-4 sm:gap-6 bg-[#fdfaf2] p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black/10 rounded-sm"
                        >
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

                            {/* Matières et outils spécifiques à cette étape précise */}
                            {((step.materiaux && step.materiaux.length > 0) || (step.outils && step.outils.length > 0)) && (
                              <div className="flex flex-wrap gap-2 my-1 text-[9.5px]">
                                {step.materiaux && step.materiaux.length > 0 && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                                    Mat. : {step.materiaux.join(', ')}
                                  </span>
                                )}
                                {step.outils && step.outils.length > 0 && (
                                  <span className="bg-stone-200 text-stone-900 border border-stone-300 px-2 py-0.5 rounded font-bold">
                                    Outils : {step.outils.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}

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
                  );
                })()}
              </div>
            ) : (
              /* CAS 2 : VUE D'ENSEMBLE DU MODÈLE */
              <div className="flex flex-col gap-8 animate-fadeIn">
                {/* Description générale */}
                {model.description && (
                  <div className="bg-[#fdfaf2] p-4 sm:p-5 border-l-4 border-l-[var(--color-cordel-wood)] border-t-[var(--theme-border-width)] border-t-black/10 border-b-[var(--theme-border-width)] border-b-black/10 border-r-[var(--theme-border-width)] border-r-black/10 rounded-sm">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-black">
                      {model.description}
                    </div>
                  </div>
                )}

                {/* Nomenclature globale : Matières et Outils globaux */}
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

                {/* Liste de toutes les pièces */}
                {model.parts && model.parts.length > 0 && (
                  <div data-tour="lutherie-model-blueprint" className="flex flex-col gap-6">
                    <h3 className="font-cactus font-black text-2xl text-black border-b-[var(--theme-border-width)] border-dashed border-black/20 pb-2 text-center mt-2">
                      Nomenclature des Pièces à Fabriquer ({model.parts.length})
                    </h3>

                    {model.parts.map((part, index) => {
                      const steps = normalizePartSteps(part);
                      const partKey = part.id || `part_${index}`;

                      return (
                        <div key={partKey} className="flex flex-col gap-4 mb-4 bg-white/50 p-4 border border-dashed border-cordel-wood/30 rounded-lg shadow-xs">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-dashed border-black/10 pb-2">
                            <h4 className="font-black text-lg text-[var(--color-cordel-wood)] uppercase tracking-wider flex items-center gap-2">
                              <span className="bg-[var(--color-cordel-wood)] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">
                                {index + 1}
                              </span>
                              {part.nom}
                              {part.quantiteRequise && (
                                <span className="text-xs font-bold text-gray-600 normal-case">
                                  (Qté : {part.quantiteRequise})
                                </span>
                              )}
                            </h4>

                            {steps.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedPartId(partKey)}
                                className="text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-900 hover:bg-amber-500/30 border border-amber-800/30 rounded shadow-xs cursor-pointer self-start sm:self-auto flex items-center gap-1"
                              >
                                <span>⚙️ Usinage ({steps.length} étapes)</span>
                                <span>➜</span>
                              </button>
                            )}
                          </div>

                          {/* Résumé fournitures et outils de la pièce */}
                          {((part.materiels && part.materiels.length > 0) || (part.outils && part.outils.length > 0)) && (
                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-800">
                              {part.materiels && part.materiels.length > 0 && (
                                <div>
                                  <span className="font-bold text-cordel-wood">Matières : </span>
                                  {part.materiels.join(', ')}
                                </div>
                              )}
                              {part.outils && part.outils.length > 0 && (
                                <div>
                                  <span className="font-bold text-cordel-wood">Outils : </span>
                                  {part.outils.join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Étapes pour cette pièce */}
                          {steps.length > 0 ? (
                            <div className="flex flex-col gap-4 pl-2 sm:pl-4">
                              {steps.map((step, stepIndex) => (
                                <div key={step.id || stepIndex} className="flex flex-col md:flex-row gap-4 bg-[#fdfaf2] p-3 sm:p-4 shadow-xs border border-black/10 rounded-sm">
                                  <div className="flex-1 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-[var(--color-cordel-ocre)] text-base">
                                        {stepIndex + 1}.
                                      </span>
                                      {step.titre && (
                                        <h5 className="font-black text-sm uppercase tracking-tight text-black">
                                          {step.titre}
                                        </h5>
                                      )}
                                    </div>
                                    <div className="text-xs text-black/80 font-medium whitespace-pre-wrap leading-relaxed line-clamp-3">
                                      {step.texte}
                                    </div>
                                  </div>

                                  {step.photoUrl && (
                                    <div className="w-full md:w-36 shrink-0 flex items-center justify-center">
                                      {renderMedia(step.photoUrl)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="pl-4 text-xs italic text-black/50">
                              Aucune étape de fabrication rédigée pour cette pièce.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Bouton d'action : Lancer le Quiz d'auto-évaluation */}
        {model.parts && model.parts.length > 0 && (
          <div className="flex justify-center p-3 bg-white/50 border-t border-dashed border-cordel-master-dark/10">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-cordel-wood text-white font-bold text-xs px-6 py-2 rounded shadow-[2px_2px_0px_0px_#181716] uppercase tracking-wider hover:bg-red-800 transition-colors active:translate-y-[1px] active:translate-x-[1px] active:shadow-none cursor-pointer"
            >
              📝 Auto-Évaluation (Quiz Atelier)
            </button>
          </div>
        )}

        {/* Pied de page Cordel */}
        <div className="flex-shrink-0 p-2.5 bg-[#fdfaf2] border-t-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] text-center">
          <span className="font-cactus text-xs text-[var(--color-cordel-wood)] opacity-75">
            O Girador - Pôle Lutherie & Modèles d'Atelier
          </span>
        </div>
      </div>

      {showQuiz && (
        <AutoEvalQuiz
          instrumentModelData={model}
          profileData={profileData}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
