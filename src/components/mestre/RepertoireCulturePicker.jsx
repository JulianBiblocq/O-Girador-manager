import React, { useState, useMemo } from 'react';

/**
 * Normalise une chaîne de caractères (minuscules, sans accents) pour la recherche.
 * @param {string} str - Chaîne source
 * @returns {string} Chaîne normalisée
 */
function normalizeSearchText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Sélecteur ergonomique de fiches culturelles du Varal Culture.
 * Offre une recherche textuelle en temps réel (titre, sous-titres, mots-clés, chapitres),
 * des filtres par catégorie ("Tous", "Orixás", "Histoire", "Musique & Groupes"),
 * des résultats sous forme de lignes compactes avec case à cocher,
 * et un bloc supérieur affichant les fiches sélectionnées sous forme de badges Cordel amovibles [✕].
 *
 * @param {Object} props
 * @param {Array<Object>} props.cultureDocsList - Liste de toutes les fiches culturelles du groupe
 * @param {Array<string>} props.selectedCultureIds - Identifiants des fiches actuellement liées
 * @param {Function} props.onChangeSelectedIds - Callback de mise à jour des identifiants sélectionnés
 * @param {Function} [props.onOpenCreateModal] - Callback pour ouvrir la modale de création d'une fiche
 * @param {boolean} [props.disabled=false] - Désactive les interactions pendant la soumission
 */
export default function RepertoireCulturePicker({
  cultureDocsList = [],
  selectedCultureIds = [],
  onChangeSelectedIds,
  onOpenCreateModal,
  disabled = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Toutes');

  // Extraction dynamique des catégories présentes dans cultureDocsList (calqué sur le Varal, zéro catégorie en dur)
  const categoriesDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        (cultureDocsList || [])
          .map((d) => d && (d.categorieFiche || d.categorie || d.rubrique))
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [cultureDocsList]);

  // Boutons de filtres rapides : "Toutes" + les catégories extraites du Varal
  const categoriesButtons = useMemo(() => {
    return ['Toutes', ...categoriesDisponibles];
  }, [categoriesDisponibles]);

  // Gestion du basculement d'une fiche sélectionnée
  const handleToggleDoc = (docId) => {
    if (disabled || !docId) return;
    if (selectedCultureIds.includes(docId)) {
      onChangeSelectedIds(selectedCultureIds.filter((id) => id !== docId));
    } else {
      onChangeSelectedIds([...selectedCultureIds, docId]);
    }
  };

  // Suppression d'un badge sélectionné
  const handleRemoveDoc = (docId) => {
    if (disabled || !docId) return;
    onChangeSelectedIds(selectedCultureIds.filter((id) => id !== docId));
  };

  // Filtrage combiné : recherche textuelle et catégorie
  const filteredDocs = useMemo(() => {
    const normQuery = normalizeSearchText(searchTerm);

    return cultureDocsList.filter((docItem) => {
      if (!docItem) return false;

      // 1. Filtrage dynamique par catégorie (calqué sur le Varal)
      if (activeCategory !== 'Toutes') {
        const itemCat = docItem.categorieFiche || docItem.categorie || docItem.rubrique;
        if (itemCat !== activeCategory) {
          return false;
        }
      }

      // 2. Filtrage textuel en temps réel
      if (normQuery) {
        const titleText = normalizeSearchText(docItem.titre || docItem.name || '');
        const subTitleText = normalizeSearchText(docItem.sousTitre || '');
        const keywordsText = normalizeSearchText(
          Array.isArray(docItem.keywords || docItem.motsCles || docItem.tags)
            ? (docItem.keywords || docItem.motsCles || docItem.tags).join(' ')
            : String(docItem.keywords || docItem.motsCles || docItem.tags || '')
        );
        const chapitresText = Array.isArray(docItem.chapitres)
          ? normalizeSearchText(
              docItem.chapitres
                .map((c) => `${c.titre || ''} ${c.sousTitre || ''} ${c.texte || ''} ${c.contenu || ''}`)
                .join(' ')
            )
          : '';
        const anecdoteText = normalizeSearchText(docItem.anecdote || docItem.description || '');

        const matches =
          titleText.includes(normQuery) ||
          subTitleText.includes(normQuery) ||
          keywordsText.includes(normQuery) ||
          chapitresText.includes(normQuery) ||
          anecdoteText.includes(normQuery);

        if (!matches) return false;
      }

      return true;
    });
  }, [cultureDocsList, searchTerm, activeCategory]);

  return (
    <div className="flex flex-col gap-2.5 md:col-span-2">
      {/* En-tête : Titre, compteur et bouton de création de fiche */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-[9.5px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
          <span>📖</span>
          <span>Fiche{selectedCultureIds.length > 1 ? 's' : ''} Culturelle{selectedCultureIds.length > 1 ? 's' : ''} associée{selectedCultureIds.length > 1 ? 's' : ''}</span>
          {selectedCultureIds.length > 0 && (
            <span className="text-[9px] font-black text-white px-1.5 py-0.2 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)]">
              {selectedCultureIds.length} liée{selectedCultureIds.length > 1 ? 's' : ''}
            </span>
          )}
        </label>

        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            disabled={disabled}
            className="text-[9.5px] font-extrabold text-amber-900 hover:text-amber-950 underline cursor-pointer flex items-center gap-1 transition-colors"
            title="Créer une fiche sur le Varal Culture pré-remplie"
          >
            <span>📜</span>
            <span>Créer une fiche Varal Culture</span>
          </button>
        )}
      </div>

      {/* Bloc supérieur : Badges Cordel amovibles des fiches actuellement sélectionnées */}
      {selectedCultureIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-amber-50/60 border border-amber-300/80 rounded-[4px_6px_3px_5px] shadow-2xs">
          {selectedCultureIds.map((cId) => {
            const docItem = cultureDocsList.find((c) => c.id === cId);
            const docTitle = docItem?.titre || docItem?.name || `Fiche Culture (${cId.slice(0, 6)}...)`;
            const docCat = docItem?.categorieFiche || docItem?.themeCulture;

            return (
              <span
                key={cId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-[4px_6px_3px_5px] bg-white text-blue-950 border border-blue-300 shadow-2xs transition-all hover:border-blue-400"
              >
                <span>📖</span>
                <span className="truncate max-w-[220px]" title={docTitle}>
                  {docTitle}
                </span>
                {docCat && (
                  <span className="text-[8.5px] font-semibold text-stone-500 uppercase">
                    ({docCat})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveDoc(cId)}
                  disabled={disabled}
                  className="text-stone-400 hover:text-red-700 font-black text-xs p-0.5 ml-0.5 cursor-pointer leading-none transition-colors"
                  title="Détacher cette fiche culturelle"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-stone-500 italic px-2 py-1 bg-cordel-bg-light/40 border border-dashed border-encre-noire/15 rounded">
          Aucune fiche culturelle liée pour le moment. Cochez les fiches correspondantes ci-dessous.
        </p>
      )}

      {/* Barre de recherche textuelle et filtres par catégories */}
      <div className="flex flex-col gap-2 pt-1 w-full">
        {/* Champ de recherche pleine largeur */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            placeholder="Rechercher une fiche (titre, mot-clé, orixá, histoire...)..."
            className="theme-input w-full text-xs font-semibold pl-7 pr-7 py-1.5 bg-white border border-encre-noire/30 rounded focus:border-amber-600 focus:outline-none"
          />
          <span className="absolute left-2 top-2 text-[11px] text-stone-400 pointer-events-none">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-xs text-stone-400 hover:text-stone-700 cursor-pointer font-bold"
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        {/* Puces de filtrage par catégorie (passage à la ligne adaptatif pour ne jamais déborder hors du cadre) */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-full">
          {categoriesButtons.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                disabled={disabled}
                className={`px-2.5 py-1 text-[9.5px] font-bold rounded-full transition-all cursor-pointer select-none border shrink-0 ${
                  isActive
                    ? 'bg-amber-200/90 text-amber-950 border-amber-400 shadow-2xs font-black'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des résultats sous forme de cartes/lignes compactes avec case à cocher */}
      <div className="max-h-48 overflow-y-auto p-1.5 bg-cordel-bg-light/60 border border-encre-noire/20 rounded flex flex-col gap-1">
        {filteredDocs.length === 0 ? (
          <p className="text-[10px] text-stone-500 italic p-3 text-center">
            {searchTerm || activeCategory !== 'Toutes'
              ? 'Aucune fiche culturelle ne correspond à votre filtre.'
              : 'Aucune fiche culturelle disponible dans le Varal Culture.'}
          </p>
        ) : (
          filteredDocs.map((docItem) => {
            const isSelected = selectedCultureIds.includes(docItem.id);
            const docTitle = docItem.titre || docItem.name || 'Fiche sans titre';
            const docSousTitre = docItem.sousTitre || (docItem.chapitres && docItem.chapitres[0]?.sousTitre);
            const docCategory = docItem.categorieFiche || docItem.themeCulture;

            return (
              <label
                key={docItem.id}
                className={`flex items-start gap-2 p-2 rounded text-xs cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 font-semibold'
                    : 'bg-white border-stone-200 hover:bg-amber-50/40 hover:border-amber-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleDoc(docItem.id)}
                  disabled={disabled}
                  className="mt-0.5 accent-[var(--color-cordel-vert,#2d6a4f)] cursor-pointer"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[11px] font-bold text-encre-noire truncate">
                      📖 {docTitle}
                    </span>
                    {docCategory && (
                      <span className="text-[8.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {docCategory}
                      </span>
                    )}
                  </div>
                  {docSousTitre && (
                    <span className="text-[9.5px] text-stone-500 font-normal truncate">
                      {docSousTitre}
                    </span>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
