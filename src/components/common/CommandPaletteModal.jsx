import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SETTINGS_INDEX } from '../../config/settingsSearchIndex';
import { canAccessPole, canAccessTabPermission } from '../../utils/permissionUtils';

/**
 * Normalise une chaîne de caractères en minuscules et sans accents
 * pour faciliter les recherches textuelles insensibles aux accents.
 * 
 * @param {string} text - Chaîne brute
 * @returns {string} - Chaîne normalisée
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Composant : CommandPaletteModal
 * 
 * Palette de commande universelle (Spotlight / Raycast) pour O Girador.
 * Accessible via le raccourci Ctrl + K ou le bouton loupe dans l'en-tête.
 * Filtrage 100 % local et sécurisé selon les badges et permissions du profil connecté.
 * 
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} onNavigate - Callback de navigation : (poleId, tabId) => void
 * @param {Object} profileData - Données du profil connecté
 * @param {Object} permissionsMatrice - Matrice des permissions de l'association
 * @param {Array} userTags - Étiquettes / badges effectifs de l'utilisateur
 * @param {boolean} [breakGlassActive=false] - Mode intervention d'urgence actif
 */
export default function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
  profileData,
  permissionsMatrice,
  userTags = [],
  breakGlassActive = false
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 1. Autofocus et réinitialisation de l'état lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Temporisation légère pour s'assurer du rendu complet avant le focus
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 2. Filtrage des entrées autorisées selon les droits de l'utilisateur
  const authorizedItems = useMemo(() => {
    if (!profileData) return [];

    const isSuperAdmin = Boolean(profileData?.isSystemAdmin || profileData?.role === 'super-admin');

    return SETTINGS_INDEX.filter((item) => {
      // Vérification spécifique pour les réglages système exclusifs
      if (item.requiredPermission === 'systemAdmin') {
        return isSuperAdmin;
      }

      // Vérification des droits d'accès au pôle parent ou à l'onglet spécifique
      const hasPoleAccess = canAccessPole(
        item.requiredPole,
        profileData,
        permissionsMatrice,
        userTags,
        breakGlassActive
      );

      if (hasPoleAccess) return true;

      const hasTabAccess = canAccessTabPermission(
        item.tabId,
        item.requiredPole,
        profileData,
        permissionsMatrice,
        userTags,
        breakGlassActive
      );

      return hasTabAccess;
    });
  }, [profileData, permissionsMatrice, userTags, breakGlassActive]);

  // 3. Filtrage en direct selon le texte recherché
  const filteredItems = useMemo(() => {
    const cleanQuery = normalizeText(query);
    if (!cleanQuery) {
      return authorizedItems;
    }

    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    return authorizedItems.filter((item) => {
      const normalizedTitle = normalizeText(item.title);
      const normalizedDesc = normalizeText(item.description);
      const normalizedPole = normalizeText(item.poleId);
      const normalizedKeywords = (item.keywords || []).map(normalizeText).join(' ');

      const combinedSearchSpace = `${normalizedTitle} ${normalizedDesc} ${normalizedPole} ${normalizedKeywords}`;

      // Toutes les sous-mots-clés de la recherche doivent être présents
      return queryTokens.every((token) => combinedSearchSpace.includes(token));
    });
  }, [authorizedItems, query]);

  // Réinitialiser la sélection active si la liste change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  // Défilement automatique dans la liste pour suivre la sélection au clavier
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Exécution de la navigation vers la destination sélectionnée
  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    if (onNavigate) {
      onNavigate(item.poleId, item.tabId);
    }
  };

  // Gestion des touches du clavier (Navigation & Validation)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commande"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none outline-hidden"
    >
      <div 
        className="max-w-xl w-full bg-[var(--color-cordel-papier,#f4ecd8)] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_10px_9px] shadow-[6px_6px_0px_0px_#181716] overflow-hidden flex flex-col animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Barre de recherche avec icône loupe */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b-2 border-dashed border-cordel-master-dark/25 bg-white/60">
          <span className="text-base sm:text-lg text-cordel-master-dark/75 select-none" aria-hidden="true">
            🔍
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un réglage, un pôle, une fonction..."
            className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-encre-noire placeholder:text-cordel-master-dark/50 placeholder:font-normal focus:outline-hidden"
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-xs font-bold text-cordel-master-dark/60 hover:text-encre-noire px-1.5 py-0.5 rounded cursor-pointer"
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold text-cordel-master-dark/65 bg-stone-200/80 px-1.5 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs">
            Échap
          </kbd>
        </div>

        {/* Liste des résultats filtrés */}
        <div
          ref={listRef}
          role="listbox"
          className="max-h-72 sm:max-h-80 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-1.5 text-cordel-master-dark/70">
              <span className="text-2xl mb-1">📜</span>
              <p className="text-xs font-bold text-encre-noire">
                Aucun paramètre trouvé
              </p>
              <p className="text-[11px] max-w-xs">
                Aucun réglage ne correspond à « <span className="font-semibold italic">{query}</span> » ou à vos droits d'accès.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-[4px_6px_3px_5px] cursor-pointer transition-all flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-amber-100/90 border-cordel-wood shadow-xs translate-x-0.5'
                      : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black tracking-wide ${isSelected ? 'text-cordel-wood' : 'text-encre-noire'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-cordel-master-dark/75 font-medium truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_3px_4px] bg-white/80 border border-cordel-master-dark/20 text-cordel-master-dark">
                      {item.poleId}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-bold text-cordel-wood">
                        ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de modale : Raccourcis et aide à la navigation */}
        <div className="px-4 py-2 border-t border-dashed border-cordel-master-dark/20 bg-cordel-bg/80 flex items-center justify-between text-[10px] text-cordel-master-dark/70 font-semibold select-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">↑</kbd>
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">↓</kbd>
              <span className="ml-0.5">Naviguer</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">↵</kbd>
              <span className="ml-0.5">Ouvrir</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="opacity-75">{filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
