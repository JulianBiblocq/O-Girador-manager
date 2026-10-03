import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import { useTranslation } from '../LanguageContext';

/**
 * Prédicat tolérant de détection du thème d'une fiche culturelle.
 * Recherche insensible à la casse dans theme, categorieFiche, nacao, selo, titre, description.
 */
function matchesCultureTheme(fiche, filterId) {
  if (!filterId || filterId === 'all') return true;

  const corpus = `${fiche.theme || ''} ${fiche.themeCulture || ''} ${fiche.categorieFiche || ''} ${fiche.nacao || ''} ${fiche.selo || ''} ${fiche.titre || ''} ${fiche.description || ''}`.toLowerCase();

  switch (filterId) {
    case 'orixas':
      return corpus.includes('orix') || corpus.includes('spirit') || corpus.includes('candombl') || corpus.includes('divin') || corpus.includes('entité');
    case 'musique':
      return corpus.includes('musique') || corpus.includes('música') || corpus.includes('naç') || corpus.includes('nacao') || corpus.includes('baque') || corpus.includes('rythme') || corpus.includes('toada');
    case 'histoire':
      return corpus.includes('histoire') || corpus.includes('história') || corpus.includes('cortège') || corpus.includes('cortejo') || corpus.includes('origine') || corpus.includes('roi') || corpus.includes('reine') || corpus.includes('dame');
    case 'cuisine':
      return corpus.includes('cuisin') || corpus.includes('recette') || corpus.includes('gastronom') || corpus.includes('plat') || corpus.includes('aliment');
    case 'territoire':
      return corpus.includes('territoire') || corpus.includes('territór') || corpus.includes('nordeste') || corpus.includes('recife') || corpus.includes('olinda') || corpus.includes('pernambuco') || corpus.includes('géograph');
    case 'cour_royale':
      return corpus.includes('cour royale') || corpus.includes('corte real') || corpus.includes('roi') || corpus.includes('reine') || corpus.includes('rainha') || corpus.includes('rei') || corpus.includes('dama');
    default:
      return corpus.includes(filterId.toLowerCase());
  }
}

/**
 * Traduit ou normalise le libellé d'un thème culturel affiché dans le badge tampon.
 */
function getThemeBadgeLabel(rawTheme, t) {
  if (!rawTheme) return t ? t('documents.catHistoireCortege') : 'Histoire & Cortège';
  const lower = rawTheme.toLowerCase();
  if (lower.includes('orix') || lower.includes('spirit') || lower.includes('candombl')) return t('documents.catOrixasSpiritualite');
  if (lower.includes('musique') || lower.includes('música') || lower.includes('naç') || lower.includes('nacao') || lower.includes('baque') || lower.includes('toada')) return t('documents.catMusiqueNacoes');
  if (lower.includes('cour royale') || lower.includes('corte real') || lower.includes('roi') || lower.includes('reine') || lower.includes('rainha')) return t('documents.catCourRoyale');
  if (lower.includes('histoire') || lower.includes('história') || lower.includes('cortège') || lower.includes('cortejo')) return t('documents.catHistoireCortege');
  if (lower.includes('cuisin') || lower.includes('recette') || lower.includes('gastronom')) return t('documents.catCuisineRecettes');
  if (lower.includes('territoire') || lower.includes('territór') || lower.includes('geograph')) return t('documents.catTerritoire');
  return rawTheme;
}

/**
 * Tableau B du Pôle Pédagogie : Fiches Culture & Histoire avec barre de filtres thématiques
 * Options par défaut : Tous, Orixás & Spiritualité, Musique & Nações, Histoire & Cortège, Cuisine & Recettes
 * + Détection dynamique de tout nouveau thème personnalisé.
 */
export default function CultureFichesTable({  fiches = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc
}) {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState('all');

  // Extraction dynamique des thèmes personnalisés présents dans les fiches
  const customThemes = useMemo(() => {
    const defaultKeywords = ['orix', 'spirit', 'musique', 'naç', 'nacao', 'baque', 'histoir', 'cortège', 'cortejo', 'cuisin', 'recette', 'territoire', 'territór', 'cour royale', 'corte real'];
    const customSet = new Set();

    fiches.forEach((f) => {
      const candidates = [f.theme, f.themeCulture, f.categorieFiche, f.selo];
      candidates.forEach((val) => {
        if (typeof val === 'string' && val.trim().length > 2) {
          const clean = val.trim();
          const lower = clean.toLowerCase();
          const isCovered = defaultKeywords.some(kw => lower.includes(kw));
          if (!isCovered) {
            customSet.add(clean);
          }
        }
      });
    });

    return Array.from(customSet);
  }, [fiches]);

  // Fiches filtrées selon le thème sélectionné
  const filteredFiches = useMemo(() => {
    return fiches.filter(f => matchesCultureTheme(f, selectedTheme));
  }, [fiches, selectedTheme]);

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3.5 text-left select-none">
      {/* 1. Barre de pastilles / boutons de filtres rapides (Pills Cordel) */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-dashed border-cordel-master-dark/15 pb-2.5">
        <button
          type="button"
          onClick={() => setSelectedTheme('all')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'all'
              ? 'bg-cordel-master-dark text-[#FEF9E7] border-cordel-master-dark shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >
          {t('pedagogy.progress.tous')}{fiches.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTheme('orixas')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'orixas'
              ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-amber-950 shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catOrixasSpiritualite')}</button>

        <button
          type="button"
          onClick={() => setSelectedTheme('musique')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'musique'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-emerald-950 shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catMusiqueNacoes')}</button>

        <button
          type="button"
          onClick={() => setSelectedTheme('histoire')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'histoire'
              ? 'bg-amber-400 text-encre-noire border-amber-900 shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catHistoireCortege')}</button>

        <button
          type="button"
          onClick={() => setSelectedTheme('cuisine')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'cuisine'
              ? 'bg-[#8b2a1a] text-white border-[#591b10] shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catCuisineRecettes')}</button>

        <button
          type="button"
          onClick={() => setSelectedTheme('territoire')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'territoire'
              ? 'bg-stone-700 text-white border-stone-900 shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catTerritoire')}</button>

        <button
          type="button"
          onClick={() => setSelectedTheme('cour_royale')}
          className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer ${
            selectedTheme === 'cour_royale'
              ? 'bg-amber-800 text-white border-amber-950 shadow-2xs font-extrabold'
              : 'bg-cordel-bg text-encre-noire/75 border-encre-noire/30 hover:border-encre-noire'
          }`}
        >{t('documents.catCourRoyale')}</button>

        {/* Thèmes dynamiques découverts dans les fiches */}
        {customThemes.map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setSelectedTheme(th)}
            className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
              selectedTheme === th
                ? 'bg-cordel-master-dark text-[#FEF9E7] border-cordel-master-dark shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            ✨ {th}
          </button>
        ))}
      </div>

      {/* 2. Tableau des fiches culturelles */}
      {filteredFiches.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
          {t('pedagogy.progress.aucuneFicheCulturelleTrouvee')}{selectedTheme !== 'all' ? selectedTheme : t('pedagogy.progress.toutes')}).
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
            <thead>
              <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                <th className="px-3 py-2">{t('documents.thCultureTitle')}</th>
                <th className="px-3 py-2">{t('documents.thThemeStamp')}</th>
                <th className="px-3 py-2 text-right">{t('pedagogy.progress.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
              {filteredFiches.map((fiche) => {
                const theme = fiche.themeCulture || fiche.categorieFiche || fiche.theme || "Histoire & Culture";

                return (
                  <tr key={fiche.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-encre-noire flex items-center gap-2">
                      <span className="text-sm">📖</span>
                      <button
                        type="button"
                        onClick={() => onSelectDoc && onSelectDoc(fiche)}
                        className="text-left font-bold hover:underline hover:text-cordel-wood truncate max-w-sm cursor-pointer"
                      >
                        {fiche.titre || t('pedagogy.progress.ficheSansTitre')}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8.5px] tracking-wider border-dashed">
                        {getThemeBadgeLabel(theme, t)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDoc && onSelectDoc(fiche)}
                        className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                        title={t('pedagogy.progress.consulterLaFicheCulturelle')}
                      >{t('documents.btnConsult')}</button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditDoc && onEditDoc(fiche)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                            title={t('pedagogy.progress.editerLeTexteExplicatifEt')}
                          >{t('documents.btnEditTextQcm')}</button>
                          <button
                            type="button"
                            onClick={() => onDeleteDoc && onDeleteDoc(fiche)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
                            title={t('pedagogy.progress.supprimerLaFiche')}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CordelCard>
  );
}
