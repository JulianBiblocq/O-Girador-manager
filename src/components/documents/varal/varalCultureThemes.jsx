import React from 'react';

/**
 * Thèmes culturels avec icônes vectorielles personnalisées pour le filtre du Varal Culture,
 * ainsi que la fonction pure de filtrage thématique.
 */
export const CULTURE_THEMES = [
  { id: 'all', label: 'Toute la Culture', icon: <span className="text-[12px] md:text-sm pt-0.5">✨</span> },
  {
    id: 'orixás',
    label: 'Orixás',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-orixa">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" />
              <line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" />
              <line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" />
              <line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" />
              <circle cx="60" cy="22" r="2" fill="black" stroke="none" />
              <path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-orixa)" d="M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z" />
      </svg>
    )
  },
  {
    id: 'cuisine',
    label: 'Cuisine',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-cuisine">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-cuisine)" d="M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35" />
      </svg>
    )
  },
  {
    id: 'histoire',
    label: 'Histoire',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-histoire">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" />
              <path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" /><path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-histoire)" d="M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z" />
      </svg>
    )
  },
  {
    id: 'musique',
    label: 'Musique',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs><mask id="icon-mask-musique"><rect width="100" height="100" fill="white" /><g stroke="black" strokeWidth="2" strokeDasharray="5 5"><line x1="10" y1="50" x2="90" y2="50" /><line x1="10" y1="40" x2="90" y2="40" /><line x1="10" y1="60" x2="90" y2="60" /></g></mask></defs>
        <path fill="currentColor" mask="url(#icon-mask-musique)" d="M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z" />
      </svg>
    )
  },
  {
    id: 'cortège',
    label: 'Cortège',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs><mask id="icon-mask-cortejo"><rect width="100" height="100" fill="white" /><g stroke="black" strokeWidth="2.5" strokeLinecap="round"><path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" /><path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" /><line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" /><line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" /></g></mask></defs>
        <path fill="currentColor" mask="url(#icon-mask-cortejo)" d="M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z" />
      </svg>
    )
  },
  {
    id: 'territoire',
    label: 'Territoire',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs><mask id="icon-mask-territoire"><rect width="100" height="100" fill="white" /><g stroke="black" strokeWidth="2.5"><line x1="35" y1="15" x2="35" y2="75" /><line x1="65" y1="25" x2="65" y2="85" /><path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" /><circle cx="75" cy="65" r="4" fill="black" stroke="none" /><circle cx="25" cy="45" r="4" fill="black" stroke="none" /></g></mask></defs>
        <path fill="currentColor" mask="url(#icon-mask-territoire)" d="M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z" />
      </svg>
    )
  },
  {
    id: 'folklore',
    label: 'Folklore',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs><mask id="icon-mask-folklore"><rect width="100" height="100" fill="white" /><g stroke="black" strokeWidth="2"><circle cx="42" cy="55" r="4" fill="black" stroke="none" /><circle cx="58" cy="55" r="4" fill="black" stroke="none" /><path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" /><path d="M 45 75 Q 50 85 55 75" fill="none" strokeDasharray="2 2" /></g></mask></defs>
        <path fill="currentColor" mask="url(#icon-mask-folklore)" d="M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z" />
      </svg>
    )
  }
];

/**
 * Filtre les fiches de la corde Culture selon le thème sélectionné.
 */
export function filterCultureDocsByTheme(docList = [], cultureFilter = 'all') {
  if (!cultureFilter || cultureFilter === 'all') return docList;
  const filterCat = cultureFilter.toLowerCase();
  return docList.filter((d) => {
    if (d.type !== 'culture_fiche') return false;
    const dCat = (d.categorieFiche || '').toLowerCase();
    const dTheme = (d.themeCulture || '').toLowerCase();
    if (filterCat === 'cuisine') return dCat.includes('cuisine') || dTheme.includes('cuisine') || dCat.includes('recette') || dTheme.includes('gastronomi');
    if (filterCat === 'cortège') return dCat.includes('cour') || dCat.includes('personnage') || dCat.includes('cortège') || dTheme.includes('cortejo') || dTheme.includes('cortège');
    if (filterCat === 'orixás') return dCat.includes('orix') || dCat.includes('spirit') || dTheme.includes('orixa');
    if (filterCat === 'histoire') return dCat.includes('histoire') || dCat.includes('origine') || dTheme.includes('histoire');
    if (filterCat === 'musique') return dCat.includes('musique') || dTheme.includes('musique');
    if (filterCat === 'territoire') return dCat.includes('territoire') || dTheme.includes('territoire') || dCat.includes('géographie') || dCat.includes('lieu');
    if (filterCat === 'folklore') return dCat.includes('folklore') || dTheme.includes('folklore');
    return dCat === filterCat || dTheme === filterCat;
  });
}

