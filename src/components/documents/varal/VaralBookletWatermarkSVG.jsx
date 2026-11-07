import React from 'react';
import { getInstrumentStamp } from '../../InstrumentStampSVG';

/**
 * Sous-composant dédié au rendu en filigrane (tampon xylogravure central)
 * de la couverture d'un livret Cordel sur le Varal.
 */
export default function VaralBookletWatermarkSVG({ docItem, category, docType, isDarkBg }) {
  if (!docItem) return null;

  const theme = ((docItem.themeCulture || '') + ' ' + (docItem.stampKey || '') + ' ' + (docItem.categorieFiche || '') + ' ' + (docItem.sousCategorieFiche || '')).toLowerCase();
  const isOrixa = theme.includes('orixa') || theme.includes('spiritualit');
  const isCortejo = theme.includes('cortejo') || theme.includes('cortège');
  const isCuisine = theme.includes('cuisine') || theme.includes('gastronomi');
  const isHistoire = theme.includes('histoire');
  const isMusique = theme.includes('musique');
  const isTerritoire = theme.includes('territoire') || theme.includes('geograph');
  const isFolklore = theme.includes('folklore');

  const isAdminOrCR = category?.id === 'Administratif' || category?.nom === 'Administratif' || category?.id === 'ComptesRendus' || category?.nom === 'Comptes-rendus' || category?.id === 'DocumentsFixes';
  const isTutoFab = category?.id === 'TutosFabrication' || category?.nom === 'TutosFabrication' || category?.nom === 'Tutos Fabrication';

  const renderIcon = (id, paths, maskLines, extraClasses = 'w-24 h-24 opacity-60') => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={`absolute inset-0 m-auto z-0 pointer-events-none ${isDarkBg ? 'text-encre-noire' : 'text-white'} ${extraClasses}`}>
      <defs>
        <mask id={`${id}-${docItem.id}`}>
          <rect width="100" height="100" fill="white" />
          <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {maskLines}
          </g>
        </mask>
      </defs>
      <path fill="currentColor" mask={`url(#${id}-${docItem.id})`} d={paths} />
    </svg>
  );

  if (docType === 'song') {
    return renderIcon(
      'song',
      'M 30 30 C 30 10, 70 10, 70 30 C 70 50, 30 50, 30 30 M 27 32 C 27 5, 73 5, 73 32 C 73 55, 27 55, 27 32 M 35 15 L 65 45 M 45 12 L 70 35 M 30 25 L 55 48 M 65 15 L 35 45 M 55 12 L 30 35 M 70 25 L 45 48 M 30 30 Q 50 35 70 30 M 35 20 Q 50 25 65 20 M 35 50 Q 50 55 65 50 M 33 53 Q 50 58 67 53 M 38 52 L 43 90 C 43 95, 57 95, 57 90 L 62 52 M 35 55 L 40 92 M 65 55 L 60 92 M 50 93 Q 45 105 60 98 Q 75 90 70 75 M 48 93 Q 43 108 62 100 Q 78 92 72 73',
      <></>,
      'w-16 h-16 opacity-80'
    );
  }

  if (isAdminOrCR) {
    return renderIcon(
      'admin',
      'M 50 10 C 27.9 10 10 27.9 10 50 C 10 72.1 27.9 90 50 90 C 72.1 90 90 72.1 90 50 C 90 27.9 72.1 10 50 10 Z M 50 15 C 69.3 15 85 30.7 85 50 C 85 69.3 69.3 85 50 85 C 30.7 85 15 69.3 15 50 C 15 30.7 30.7 15 50 15 Z M 50 25 C 36.2 25 25 36.2 25 50 C 25 63.8 36.2 75 50 75 C 63.8 75 75 63.8 75 50 C 75 36.2 63.8 25 50 25 Z M 50 33 L 55.3 43.8 L 67 45.5 L 58.5 53.8 L 60.5 65 L 50 59.5 L 39.5 65 L 41.5 53.8 L 33 45.5 L 44.7 43.8 L 50 33 Z',
      <path d="M 15 50 L 30 50 M 70 50 L 85 50 M 50 15 L 50 30 M 50 70 L 50 85" strokeWidth="2" strokeDasharray="3 3" />,
      'w-20 h-20 opacity-30'
    );
  }

  if (docType === 'video') {
    return renderIcon(
      'video',
      'M 20 30 L 60 30 C 65 30 70 35 70 40 L 70 60 C 70 65 65 70 60 70 L 20 70 C 15 70 10 65 10 60 L 10 40 C 10 35 15 30 20 30 Z M 70 40 L 90 25 L 90 75 L 70 60 Z M 30 50 C 30 44.5 34.5 40 40 40 C 45.5 40 50 44.5 50 50 C 50 55.5 45.5 60 40 60 C 34.5 60 30 55.5 30 50 Z',
      <><circle cx="40" cy="50" r="4" fill="black" /><line x1="20" y1="40" x2="60" y2="40" strokeWidth="1" strokeDasharray="2 2" /></>,
      'w-16 h-16 opacity-30'
    );
  }

  if (isTutoFab) {
    const isCostume = docItem.thematiqueFabrication === 'costumerie' || docItem.sousCategorie === 'costumerie' ||
      (docItem.titre && /costume|couture|patron|habit|veste|coiffe/i.test(docItem.titre)) ||
      (docItem.description && /costume|couture|patron/i.test(docItem.description));
    const instr = isCostume ? 'couture' : (docItem.instrument || docItem.familleInstrument || docItem.categorieFiche || docItem.categorie || 'Alfaia');
    return (
      <div className={`absolute inset-0 m-auto flex items-center justify-center z-0 pointer-events-none opacity-20 ${isDarkBg ? 'text-encre-noire' : 'text-[#523214]'}`}>
        <div className="scale-[1.2] origin-center mix-blend-multiply dark:mix-blend-normal">
          {getInstrumentStamp(instr, 'currentColor')}
        </div>
      </div>
    );
  }

  if (isOrixa) {
    return renderIcon(
      'orixa',
      'M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z',
      <><line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" /><line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" /><line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" /><line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" /><line x1="62" y1="37" x2="62" y2="51" strokeDasharray="3 3" /><path d="M 22 62 Q 50 78 78 61" fill="none" strokeWidth="2" strokeDasharray="4 2" /><path d="M 18 78 Q 50 95 82 77" fill="none" strokeWidth="3" /><path d="M 50 72 L 50 90" fill="none" strokeWidth="2" strokeDasharray="5 3" /><circle cx="50" cy="15" r="2.5" fill="black" stroke="none" /><circle cx="40" cy="22" r="2" fill="black" stroke="none" /><circle cx="60" cy="22" r="2" fill="black" stroke="none" /><path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" /></>
    );
  }

  if (isCortejo) {
    return renderIcon(
      'cortejo',
      'M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z',
      <><path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" /><path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" /><line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" /><line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" /></>
    );
  }

  if (isCuisine) {
    return renderIcon(
      'cuisine',
      'M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35',
      <><path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" /><line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" /></>
    );
  }

  if (isHistoire) {
    return renderIcon(
      'histoire',
      'M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z',
      <><line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" /><path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" /></>
    );
  }

  if (isMusique && docType !== 'song') {
    return renderIcon(
      'musique',
      'M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z',
      <><line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" /><line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" /><line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" /></>
    );
  }

  if (isTerritoire) {
    return renderIcon(
      'territoire',
      'M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z',
      <><line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" /><line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" /><path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" /><circle cx="75" cy="65" r="4" fill="black" stroke="none" /><circle cx="25" cy="45" r="4" fill="black" stroke="none" /></>
    );
  }

  if (isFolklore) {
    return renderIcon(
      'folklore',
      'M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z',
      <><circle cx="42" cy="55" r="4" fill="black" stroke="none" /><circle cx="58" cy="55" r="4" fill="black" stroke="none" /><path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" /><path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" /></>
    );
  }

  return null;
}

