import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { useTranslation } from './LanguageContext';
import CordelButton from './CordelButton';
import { XiloClose } from './XiloIcons';
import { getInstrumentStamp } from './InstrumentStampSVG';

/**
 * Rendu sécurisé d'un contenu pouvant comporter du HTML riche (ex: généré par TipTap).
 * Préserve les balises de mise en forme (p, strong, b, ul, ol, li) avec un style Cordel soigné.
 */
function renderRichContent(content, className = '') {
  if (!content || typeof content !== 'string') return null;
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'a', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'hr'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
    });
    return (
      <div
        className={`[&_p]:mb-2.5 last:[&_p]:mb-0 [&_strong]:font-black [&_b]:font-black [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1 leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }
  return <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{content}</div>;
}

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
  const { t } = useTranslation();

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
          alt={fabrication?.titre || t('workshop.stepMediaLabel')} 
          className="w-full h-auto object-cover rounded-[var(--theme-border-radius)] block" 
        />
      </div>
    );
  };

  const hasEtapes = Boolean(fabrication?.etapesFabrication && fabrication.etapesFabrication.length > 0);
  
  const normalizeTags = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const allMateriels = useMemo(() => normalizeTags(fabrication?.materielRequis), [fabrication?.materielRequis]);
  const allOutils = useMemo(() => normalizeTags(fabrication?.outilsNecessaires), [fabrication?.outilsNecessaires]);

  const [selectedEtapeId, setSelectedEtapeId] = useState(null);

  // Clause de garde placée impérativement après tous les hooks (Rules of Hooks)
  if (!fabrication) return null;

  const activeEtape = (fabrication.etapesFabrication || []).find((e, idx) => {
    const etapeId = e.id || idx;
    return etapeId === selectedEtapeId;
  });

  const isArtisanat = fabrication?.thematiqueFabrication === 'artisanat' ||
    fabrication?.domaine === 'artisanat' ||
    fabrication?.sousCategorie === 'artisanat' ||
    /artisanat|reliure|carnet|livre|cuir|accessoire|pochoir/i.test(fabrication?.titre || '') ||
    /artisanat|reliure|carnet|livre|cuir|accessoire|pochoir/i.test(fabrication?.instrumentConcerne || '');

  const isCostumerie = !isArtisanat && (
    fabrication?.thematiqueFabrication === 'costumerie' ||
    fabrication?.sousCategorie === 'costumerie' ||
    /costume|couture|patron|habit|veste|coiffe/i.test(fabrication?.titre || '') ||
    /costume|couture|patron/i.test(fabrication?.instrumentConcerne || '')
  );

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
        className="relative bg-[#fdfaf2] w-full max-w-3xl max-h-[95vh] flex flex-col rounded-[var(--theme-border-radius)] shadow-[5px_5px_0px_0px_#181716] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black overflow-hidden mt-2 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la Modale */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-4 sm:p-5 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2]">
          <div className="flex-1 min-w-0 pr-2 flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-cordel-wood)] mb-1">
              {isArtisanat 
                ? `🎨 ${t('lutherie.craftDomainArtisanat')}` 
                : isCostumerie 
                  ? `🧵 ${t('lutherie.craftDomainCostumerie')}` 
                  : `🛠️ ${t('lutherie.craftDomainLutherie')}`}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-black leading-none break-words">
              {fabrication.titre}
            </h2>
            {(fabrication.instrumentConcerne || isCostumerie || isArtisanat) && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] uppercase font-bold text-gray-700 bg-black/10 px-2 py-0.5 rounded">
                  {fabrication.instrumentConcerne || (isArtisanat ? t('lutherie.filterCategoryArtisanat') : isCostumerie ? t('lutherie.craftDomainCostumerie') : t('lutherie.filterCategoryLutherie'))}
                </span>
                <div className="w-5 h-5 text-[var(--color-cordel-wood)] flex-shrink-0 opacity-90">
                  {getInstrumentStamp(isArtisanat ? "artisanat" : (isCostumerie ? "couture" : (fabrication.instrumentConcerne || "Alfaia")), "currentColor")}
                </div>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-[var(--color-cordel-wood,#8b2a1a)] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
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

            {/* Patron / Gabarit téléchargeable (PDF ou Image) */}
            {fabrication.patronUrl && (
              <div className="p-4 bg-[var(--color-cordel-vert)]/10 border-2 border-dashed border-[var(--color-cordel-vert)] rounded-[var(--theme-border-radius)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#181716]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-[var(--color-cordel-vert)] text-white rounded font-bold text-lg shadow-sm">
                    📐
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm text-[var(--color-cordel-vert)] uppercase tracking-wider">
                      {t('workshop.patternAndTemplate')}
                    </h4>
                    <p className="text-xs text-black/70">
                      {t('workshop.patternDescription')}
                    </p>
                  </div>
                </div>
                <a
                  href={fabrication.patronUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 bg-[var(--color-cordel-vert)] text-white text-xs font-black uppercase tracking-wider rounded border border-black shadow-[2px_2px_0px_0px_#181716] hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>📥</span> {t('workshop.downloadPattern')}
                </a>
              </div>
            )}

            {/* Matériel & Outils */}
            {(allMateriels.length > 0 || allOutils.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allMateriels.length > 0 && (
                  <div className="bg-[#fdfaf2] border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-black p-4 shadow-[2px_2px_0px_0px_#181716] rounded-sm transform -rotate-[0.5deg]">
                    <h4 className="font-heading font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80 flex items-center justify-between">
                      {t('workshop.materialsRequiredTitle')}
                      {selectedEtapeId !== null && <span className="text-[9px] font-sans uppercase font-bold tracking-widest text-black/50 bg-black/5 px-2 py-1 rounded">{t('workshop.stepFiltered')}</span>}
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
                    <h4 className="font-heading font-black text-lg text-[var(--color-cordel-wood)] mb-2 border-b-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] pb-1 opacity-80 flex items-center justify-between">
                      {t('workshop.toolsRequiredTitle')}
                      {selectedEtapeId !== null && <span className="text-[9px] font-sans uppercase font-bold tracking-widest text-black/50 bg-black/5 px-2 py-1 rounded">{t('workshop.stepFiltered')}</span>}
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

            {/* Métadonnées de l'atelier (Difficulté, Coût, Temps) */}
            {(fabrication.difficulte || fabrication.difficulty || fabrication.cout || fabrication.cost || fabrication.temps || fabrication.estimatedTime || fabrication.duree) && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white/70 border border-black/10 rounded-sm text-xs font-bold text-stone-700">
                {(fabrication.difficulte || fabrication.difficulty) && (
                  <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] uppercase px-2 py-0.5">
                    {t('workshop.difficultyLevel')} : {fabrication.difficulte || fabrication.difficulty}
                  </span>
                )}
                {(fabrication.cout || fabrication.cost) && (
                  <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] uppercase px-2 py-0.5">
                    {t('workshop.estimatedCost')} : {fabrication.cout || fabrication.cost}
                  </span>
                )}
                {(fabrication.temps || fabrication.estimatedTime || fabrication.duree) && (
                  <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px] uppercase px-2 py-0.5">
                    {t('workshop.estimatedTime')} : {fabrication.temps || fabrication.estimatedTime || fabrication.duree}
                  </span>
                )}
              </div>
            )}

            {/* Contenu global / Consignes d'atelier */}
            {fabrication.contenuFabrication && (
              <div className="bg-[#fdfaf2] p-4 sm:p-5 border-l-4 border-l-[var(--color-cordel-wood)] border-t-[var(--theme-border-width)] border-t-black/10 border-b-[var(--theme-border-width)] border-b-black/10 border-r-[var(--theme-border-width)] border-r-black/10 rounded-sm shadow-xs">
                <div className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-wood)] mb-2 opacity-90 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>{t('workshop.workshopInstructions')}</span>
                </div>
                {renderRichContent(fabrication.contenuFabrication, "text-sm text-black")}
              </div>
            )}

            {/* Conseils & Entretien */}
            {fabrication.anecdote && (
              <div className="bg-amber-50/70 p-4 border-l-4 border-l-[var(--color-cordel-ocre)] border border-amber-200/60 rounded-sm shadow-xs">
                <h4 className="font-heading font-black text-sm text-[var(--color-cordel-ocre)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{t('workshop.tipsAndMaintenance')}</span>
                </h4>
                {renderRichContent(fabrication.anecdote, "text-xs text-stone-700")}
              </div>
            )}

            {/* Matrice Multi-tailles pour Alfaia */}
            {fabrication.instrumentConcerne && fabrication.instrumentConcerne.toLowerCase().includes('alfaia') && (
              <div className="bg-cordel-master-dark/5 p-4 rounded-md border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-cordel-wood)]/50 shadow-sm">
                <h4 className="font-heading font-black text-xl text-[var(--color-cordel-wood)] mb-3 text-center">
                  {t('workshop.memoAlfaiaSizes')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-cordel-wood)] text-white">
                        <th className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold uppercase tracking-wider text-xs">{t('workshop.sizeInches')}</th>
                        <th className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold uppercase tracking-wider text-xs">{t('workshop.diameterTemplate')}</th>
                        <th className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold uppercase tracking-wider text-xs">{t('workshop.ropeLength')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white/60">
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold text-black">16"</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 40,6 cm</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 13 m</td>
                      </tr>
                      <tr className="bg-black/5">
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold text-black">18"</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 45,7 cm</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 15 m</td>
                      </tr>
                      <tr className="bg-white/60">
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold text-black">20"</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 50,8 cm</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 18 m</td>
                      </tr>
                      <tr className="bg-black/5">
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 font-bold text-black">22"</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 55,9 cm</td>
                        <td className="px-4 py-2 border border-[var(--color-cordel-wood)]/20 text-stone-700">~ 20 m</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Étapes pas à pas */}
            {hasEtapes && (
              <div className="flex flex-col gap-6">
                <h3 className="font-heading font-black text-2xl text-center text-black mt-4">
                  {t('workshop.fabricationStepsTitle')}
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
                        <div className={`absolute left-0 top-0 w-8 h-8 sm:w-14 sm:h-14 border-[var(--theme-border-width)] border-[var(--theme-border-style)] rounded-full flex items-center justify-center z-10 text-white font-heading font-black text-lg sm:text-2xl transform -rotate-6 transition-all ${
                          isSelected ? 'bg-[var(--color-cordel-wood)] border-black shadow-[3px_3px_0px_0px_var(--color-cordel-wood)] scale-110' : 'bg-[var(--color-cordel-vert)] border-black shadow-[2px_2px_0px_0px_#181716] group-hover:scale-105'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        <div className={`flex-1 p-4 border-[var(--theme-border-width)] border-[var(--theme-border-style)] rounded-sm w-full transition-all ${
                          isSelected ? 'bg-[#fffaf5] border-[var(--color-cordel-wood)] shadow-[4px_4px_0px_0px_var(--color-cordel-wood)] ring-2 ring-[var(--color-cordel-wood)]/20' : 'bg-[#fdfaf2] border-black shadow-[2px_2px_0px_0px_#181716] group-hover:shadow-[3px_3px_0px_0px_#181716]'
                        }`}>
                          <div className="flex items-center justify-between mb-2 border-b-[var(--theme-border-width)] border-dashed border-gray-300 pb-1">
                            <h4 className={`font-black text-base transition-colors ${isSelected ? 'text-[var(--color-cordel-wood)]' : 'text-black'}`}>
                              {etape.sousTitre || etape.titre || t('workshop.stepIndexTitle', { index: idx + 1 })}
                            </h4>
                            {isSelected && (
                              <span className="text-[9px] uppercase font-bold text-white bg-[var(--color-cordel-wood)] px-2 py-0.5 rounded shadow-sm">
                                {t('workshop.activeStep')}
                              </span>
                            )}
                          </div>
                          {renderRichContent(etape.description, "text-xs sm:text-sm text-black/80 font-medium")}
                          
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
                  {t('workshop.lexiqueAndVocab')}
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
        <div className="flex-shrink-0 p-4 border-t-[var(--theme-border-width)] border-dashed border-[var(--color-cordel-wood)] bg-[#fdfaf2] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase rounded border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🖨️</span>
            <span>{t('workshop.btnPrintTutorial')}</span>
          </button>
          <CordelButton variant="default" onClick={onClose} className="px-6 py-2 text-sm">
            {t('workshop.btnCloseTutorial')}
          </CordelButton>
        </div>
      </div>
    </div>
  );

  return createPortal(cardContent, document.body);
}
