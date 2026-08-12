import React from 'react';
import { extractYouTubeId } from '../utils/videoUtils';
import { QRCodeSVG } from 'qrcode.react';
import SeloAxeStamp from './SeloAxeStamp';
import { getInstrumentStamp } from './InstrumentStampSVG';

const renderHTMLorText = (content, extraClass = "") => {
  if (!content) return null;
  const isHtml = typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return <div className={`[&_p]:mb-2 [&_b]:font-black [&_strong]:font-black ${extraClass}`} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  const safeContent = typeof content === 'string' || typeof content === 'number' ? content : String(content);
  return <div className={`whitespace-pre-wrap ${extraClass}`}>{safeContent}</div>;
};

export default function CultureCard({ culture, isPrintVersion = false }) {
  if (!culture) return null;

  const primaryColor = culture.hexPrimary || (culture.couleurs && culture.couleurs[0]) || (culture.couleursTheme && culture.couleursTheme[0]) || 'var(--encre-noire)';
  const secondaryColor = culture.hexSecondary || (culture.couleurs && culture.couleurs[1]) || (culture.couleursTheme && culture.couleursTheme[1]) || '#FFFFFF';

  return (
    <div 
      className="bg-[#fdfaf2] dark:bg-[#1a1816] border-4 rounded-lg shadow-[3px_3px_0px_0px_#181716] w-full max-w-[600px] mx-auto flex flex-col print:shadow-none print:border-none print:max-w-full print:m-0 print:bg-transparent overflow-y-auto max-h-[85vh] print:max-h-none print:overflow-visible relative"
      style={{ borderColor: primaryColor }}
    >
      <table className="w-full table-fixed border-collapse">
        <thead className="table-header-group sticky top-0 z-20 bg-[#fdfaf2] dark:bg-[#1a1816] print:bg-transparent shadow-sm print:shadow-none">
          <tr>
            <td className="p-4 md:p-6 pb-2 pt-4 print:pt-0">
              <div className="flex flex-col gap-2 items-center relative">
                
                {/* Print only: Association Name */}
                <div className="hidden print:block absolute top-0 right-0 text-[8px] uppercase font-bold text-gray-500">
                  Fiche Culturelle
                </div>

                {/* Theme & Badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-1 items-center">
                  {culture.themeCulture && (
                    <SeloAxeStamp 
                      size="md" 
                      iconeStamp={culture.iconeStamp || culture.stampKey || 'axe-default'} 
                      hexSecondary={secondaryColor}
                      className="print:scale-75"
                    />
                  )}
                  {culture.categorieFiche && (
                    <span 
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#181716]"
                      style={{ backgroundColor: secondaryColor, color: '#1a1816' }}
                    >
                      {culture.categorieFiche}
                    </span>
                  )}
                  {culture.epoque && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-neutral-200 text-encre-noire px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#181716]">
                      ⏳ {culture.epoque}
                    </span>
                  )}
                </div>

                {/* Main Title */}
                <div className="flex flex-col items-center justify-center relative w-full">
                  {/* En-tête titre centralisé */}
                  <h1 className="text-2xl md:text-4xl font-cactus tracking-widest text-[var(--color-cordel-ocre,#c05621)] text-center mt-1 print:mt-0 print:text-3xl relative z-20">
                    {culture.titre || "Titre Inconnu"}
                  </h1>
                </div>
                
                {/* Sub-info */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-4 mt-1 text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-cordel-master-dark opacity-80 text-center">
                  {culture.personnageOrisha && (
                    <span className="font-cactus text-base md:text-xl lowercase tracking-wider capitalize print:text-base text-encre-noire">
                      {culture.personnageOrisha}
                    </span>
                  )}
                  {culture.personnageOrisha && culture.villeRegion && (
                    <span className="hidden sm:inline opacity-50">•</span>
                  )}
                  {culture.villeRegion && (
                    <span className="font-cactus text-base md:text-xl lowercase tracking-wider capitalize print:text-base">
                      📍 {culture.villeRegion}
                    </span>
                  )}
                </div>
                
                <hr className="border-t-4 border-[var(--color-cordel-ocre,#c05621)] mt-3 w-full print:mt-2 mb-1" />
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 md:px-6 pb-6 pt-1 md:pt-2 print:pt-1">
              <div className="w-full flex-1 flex flex-col gap-6">
                
                {/* Main Image Section */}
                {culture.fileUrl && (
                  <div className="flex flex-col items-center gap-2 mt-2 print:break-inside-avoid">
                    <div className="border-4 border-double border-encre-noire/80 p-1 bg-white shadow-sm inline-block">
                      <img 
                        src={culture.fileUrl} 
                        alt={culture.legendeImage || culture.titre} 
                        className="max-h-[300px] object-contain"
                      />
                    </div>
                    {culture.legendeImage && (
                      <p className="text-[10px] md:text-xs font-bold text-center text-cordel-master-dark italic px-4">
                        {culture.legendeImage}
                      </p>
                    )}
                  </div>
                )}

                {/* Symboles & Element (If Orixa) */}
                {culture.themeCulture === 'orixas' && (culture.elementNaturel || culture.symbolesSacres) && (
                  <div className="flex justify-center gap-6 mt-2 print:break-inside-avoid text-[10px] uppercase font-bold text-cordel-master-dark">
                    {culture.elementNaturel && (
                      <span>🌿 Élément : {culture.elementNaturel}</span>
                    )}
                    {culture.symbolesSacres && (
                      <span>⚔️ Symboles : {culture.symbolesSacres}</span>
                    )}
                  </div>
                )}

                {/* Chapters */}
                {Array.isArray(culture.chapitres) && culture.chapitres.length > 0 && (
                  <div className="flex flex-col gap-5 mt-2">
                    {culture.chapitres.map((chap, idx) => (
                      <div key={chap.id || idx} className="flex flex-col gap-2 print:break-inside-avoid">
                        {chap.sousTitre && (
                          <h3 className="bg-[#f5f0e6] dark:bg-[#2a2622] text-encre-noire dark:text-stone-200 py-1.5 px-3 rounded font-cactus tracking-widest text-lg md:text-xl border border-encre-noire/10 lowercase capitalize print:text-lg inline-block w-fit">
                            {chap.sousTitre}
                          </h3>
                        )}
                        <div className="font-medium text-[12px] md:text-[14px] leading-relaxed print:leading-snug print:text-[12px] text-encre-noire px-1 md:px-2">
                          {renderHTMLorText(chap.texte)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Danse & Gestuelle */}
                {culture.danseData && (culture.danseData.nomDuGeste || culture.danseData.descriptionGeste) && (
                  <div className="mt-4 flex flex-col gap-3 print:break-inside-avoid bg-cordel-wood/5 p-4 rounded-md border border-cordel-wood/20">
                    <h3 className="bg-[var(--color-cordel-vert,#2d6a4f)] text-[#fdfaf2] py-1.5 px-3 rounded font-cactus tracking-widest text-lg md:text-xl lowercase capitalize inline-block w-fit">
                      {culture.danseData.nomDuGeste || "Gestuelle"}
                    </h3>
                    
                    {culture.danseData.motsClesCorps && (
                      <div className="flex gap-2 font-bold text-[10px] uppercase tracking-wider text-cordel-master-dark">
                        <span>💪 Focus corps :</span>
                        <span className="text-cordel-wood">{culture.danseData.motsClesCorps}</span>
                      </div>
                    )}
                    
                    <div className="font-medium text-[12px] md:text-[14px] leading-relaxed text-encre-noire">
                      {culture.danseData.descriptionGeste}
                    </div>

                    {culture.danseData.mediaGesteUrl && (
                      <div className="mt-2 flex flex-col items-center gap-2">
                         <img src={culture.danseData.mediaGesteUrl} alt={culture.danseData.nomDuGeste} className="max-h-[250px] object-contain border border-encre-noire/20 shadow-sm" />
                      </div>
                    )}
                  </div>
                )}

                {/* Anecdote (Le Saviez-vous) */}
                {culture.anecdote && (
                  <div className="mt-4 bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-vert,#2d6a4f)] p-4 md:p-5 rounded-r-md shadow-sm print:break-inside-avoid">
                    <h4 className="text-[11px] md:text-sm font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] mb-2 flex items-center gap-2 print:text-[10px]">
                      <span>💡</span> Le saviez-vous ?
                    </h4>
                    <p className="text-[11px] md:text-[13px] print:text-[10px] font-bold text-encre-noire leading-relaxed italic">
                      "{culture.anecdote}"
                    </p>
                  </div>
                )}

                {/* Lexique Mots-Clés (Ancien / Simple) */}
                {culture.lexiqueMotsCles && (
                  <div className="mt-4 flex flex-col gap-2 print:break-inside-avoid">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark">
                      🏷️ Mots-Clés
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(culture.lexiqueMotsCles) ? culture.lexiqueMotsCles : (typeof culture.lexiqueMotsCles === 'string' ? culture.lexiqueMotsCles.split(',') : [])).map((mot, idx) => {
                        const trimmed = typeof mot === 'string' ? mot.trim() : '';
                        if (!trimmed) return null;
                        return (
                          <span key={idx} className="bg-neutral-100 dark:bg-neutral-800 border border-encre-noire/20 text-encre-noire px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider print:border-encre-noire">
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dictionnaire / Lexique Détaillé */}
                {culture.lexique && Array.isArray(culture.lexique) && culture.lexique.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 print:break-inside-avoid">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark border-b border-cordel-master-dark/10 pb-1">
                      📖 Dictionnaire & Lexique
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {culture.lexique.map((item, idx) => (
                        item.pt && (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 bg-[#fdfaf2] dark:bg-[#2a2622] p-2 sm:p-3 border border-cordel-wood/20 rounded shadow-sm">
                            <span className="text-[11px] sm:text-xs font-black text-cordel-wood whitespace-nowrap">
                              {item.pt} :
                            </span>
                            <span className="text-[11px] sm:text-xs text-encre-noire/90 dark:text-gray-300 font-medium leading-tight">
                              {item.fr}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Externe (Hidden on Print, Replace with QR) */}
                {culture.videoUrl && (
                  <div className="mt-6 flex flex-col items-center gap-2 pb-4 print:break-inside-avoid">
                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cordel-master-dark mb-2 border-b-2 border-cordel-master-dark/10 pb-1 text-center w-full">
                      🎬 Vidéo Associée
                    </h4>
                    
                    {/* Screen View */}
                    <div className="w-full flex flex-col items-center print:hidden">
                      {extractYouTubeId(culture.videoUrl) ? (
                        <div className="w-full max-w-[500px] aspect-video rounded overflow-hidden shadow-sm border border-cordel-wood/20 bg-black">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${extractYouTubeId(culture.videoUrl)}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full object-cover"
                          ></iframe>
                        </div>
                      ) : (
                        <a 
                          href={culture.videoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-cordel-wood text-[#fdfaf2] px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-red-800 transition-colors flex items-center gap-2"
                        >
                          ▶️ Regarder la vidéo externe
                        </a>
                      )}
                    </div>

                    {/* Print View: QR Code */}
                    <div className="hidden print:flex flex-col items-center justify-center p-4 border-2 border-dashed border-cordel-wood/50 rounded-lg max-w-[200px] mx-auto">
                      <QRCodeSVG value={culture.videoUrl} size={100} level="M" />
                      <p className="mt-2 text-[9px] font-bold uppercase text-center text-encre-noire">
                        📱 Scannez pour voir la vidéo
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
