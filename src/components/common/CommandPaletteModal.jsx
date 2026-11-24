import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SETTINGS_INDEX,
  normalizeSearchToken,
  resolveSearchText,
  resolvePoleDisplayLabel
} from '../../config/settingsSearchIndex';
import { canAccessPole, canAccessTabPermission } from '../../utils/permissionUtils';
import { isSystemSuperAdminIdentity } from '../../utils/founderFallbackUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Palette de commande rapide bilingue (FR / PT-BR) dans Organizador (`Ctrl + K`).
 * Filtrage 100 % local selon les permissions effectives du membre et affichage sans aucun mot de code.
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
  const { t, locale, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const activeLang = (typeof i18n !== 'undefined' && i18n?.language) || locale || 'fr';
  const isPt = activeLang === 'pt' || String(activeLang).toLowerCase().startsWith('pt');

  useEffect(() => {
    if (!isOpen) return undefined;
    setQuery('');
    setSelectedIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const authorizedItems = useMemo(() => {
    if (!profileData) return [];
    const isSuperAdmin = Boolean(isSystemSuperAdminIdentity(profileData) || profileData?.role === 'mestre');

    return SETTINGS_INDEX.filter((item) => {
      if (item.requiredPermission === 'systemAdmin') return isSuperAdmin;
      if (canAccessPole(item.requiredPole, profileData, permissionsMatrice, userTags, breakGlassActive)) {
        return true;
      }
      return canAccessTabPermission(
        item.tabId,
        item.requiredPole,
        profileData,
        permissionsMatrice,
        userTags,
        breakGlassActive
      );
    });
  }, [profileData, permissionsMatrice, userTags, breakGlassActive]);

  const filteredItems = useMemo(() => {
    const cleanQuery = normalizeSearchToken(query);
    if (!cleanQuery) return authorizedItems;
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    return authorizedItems.filter((item) => {
      const frTitle = normalizeSearchToken(resolveSearchText(item.title, false));
      const ptTitle = normalizeSearchToken(resolveSearchText(item.title, true));
      const frDesc = normalizeSearchToken(resolveSearchText(item.description, false));
      const ptDesc = normalizeSearchToken(resolveSearchText(item.description, true));
      const poleLabel = normalizeSearchToken(resolvePoleDisplayLabel(item.poleId, t, isPt));
      const kwList = Array.isArray(item.keywords)
        ? item.keywords
        : [...(item.keywords?.fr || []), ...(item.keywords?.pt || [])];
      const kwText = kwList.map(normalizeSearchToken).join(' ');

      const haystack = `${frTitle} ${ptTitle} ${frDesc} ${ptDesc} ${poleLabel} ${kwText}`;
      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [authorizedItems, query, t, isPt]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    if (onNavigate) onNavigate(item.poleId, item.tabId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  const countLabel =
    filteredItems.length <= 1
      ? t('commandPalette.resultsSingular', { count: filteredItems.length })
      : t('commandPalette.resultsPlural', { count: filteredItems.length });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('commandPalette.ariaLabel')}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4 bg-encre-noire/65 backdrop-blur-xs animate-fade-in select-none outline-hidden"
    >
      <div
        className="max-w-xl w-full bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[8px_12px_10px_9px] shadow-[6px_6px_0px_0px_#181716] overflow-hidden flex flex-col animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b-2 border-dashed border-cordel-master-dark/25 bg-cordel-bg-light">
          <span className="text-base sm:text-lg text-cordel-master-dark/75 select-none" aria-hidden="true">
            🔍
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.searchPlaceholder')}
            aria-label={t('commandPalette.searchPlaceholder')}
            className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-encre-noire placeholder:text-cordel-master-dark/55 placeholder:font-normal focus:outline-hidden"
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
              title={t('commandPalette.clearSearchTitle')}
              aria-label={t('commandPalette.clearSearchTitle')}
            >
              ✕
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold text-cordel-master-dark/70 bg-cordel-bg px-1.5 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs">
            {t('commandPalette.escKey')}
          </kbd>
        </div>

        <div ref={listRef} role="listbox" className="max-h-72 sm:max-h-80 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-1.5 text-cordel-master-dark/75">
              <span className="text-2xl mb-1">📜</span>
              <p className="text-xs font-bold text-encre-noire">{t('commandPalette.emptyTitle')}</p>
              <p className="text-[11px] max-w-xs">{t('commandPalette.emptyDesc', { query })}</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const displayTitle = resolveSearchText(item.title, isPt);
              const displayDesc = resolveSearchText(item.description, isPt);
              const displayPole = resolvePoleDisplayLabel(item.poleId, t, isPt);

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-[4px_6px_3px_5px] cursor-pointer transition-all flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-cordel-bg border-cordel-wood shadow-xs translate-x-0.5'
                      : 'bg-transparent border-transparent hover:bg-cordel-bg/60'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className={`text-xs font-black tracking-wide ${isSelected ? 'text-cordel-wood' : 'text-encre-noire'}`}>
                      {displayTitle}
                    </span>
                    <p className="text-[10px] text-cordel-master-dark/75 font-medium truncate mt-0.5">{displayDesc}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_3px_4px] bg-cordel-bg-light border border-cordel-master-dark/25 text-cordel-wood">
                      {displayPole}
                    </span>
                    {isSelected && <span className="text-xs font-bold text-cordel-wood">↵</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-dashed border-cordel-master-dark/20 bg-cordel-bg/80 flex items-center justify-between text-[10px] text-cordel-master-dark/75 font-semibold select-none">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-cordel-bg-light px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">↑</kbd>
              <kbd className="font-mono bg-cordel-bg-light px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">↓</kbd>
              <span className="ml-0.5">{t('commandPalette.navHint')}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-cordel-bg-light px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">{t('commandPalette.enterKey')}</kbd>
              <span className="ml-0.5">{t('commandPalette.openHint')}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-cordel-bg-light px-1 py-0.5 rounded border border-cordel-master-dark/20 shadow-2xs text-[8px]">{t('commandPalette.escKey')}</kbd>
              <span className="ml-0.5">{t('commandPalette.closeHint')}</span>
            </span>
          </div>

          <span className="opacity-80 shrink-0">{countLabel}</span>
        </div>
      </div>
    </div>
  );
}
