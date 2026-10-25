import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import AnnonceSelectedChips from './AnnonceSelectedChips';

/**
 * Composant : AnnonceTargetUserPicker
 * 
 * Sélecteur multi-membres nominatif pour le ciblage fin des annonces / pancartes.
 * Permet la recherche instantanée par prénom/nom et affiche les membres sous forme de chips supprimables.
 */
export default function AnnonceTargetUserPicker({
  selectedUserIds = [],
  onChange,
  allMembers = [],
  disabled = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(() => selectedUserIds.length > 0);

  // Filtrer uniquement les adhérents actifs (exclure inactifs et archivés)
  const activeMembers = useMemo(() => {
    if (!Array.isArray(allMembers)) return [];
    return allMembers.filter((m) => m?.id && m.statutActuel !== 'inactive' && m.statutActuel !== 'archived');
  }, [allMembers]);

  // Filtrer selon la recherche instantanée
  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activeMembers;

    return activeMembers.filter((m) => {
      const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const instrument = (m.instrument || m.instrumentPrincipal || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return fullName.includes(term) || surnom.includes(term) || instrument.includes(term) || email.includes(term);
    });
  }, [activeMembers, searchTerm]);

  // Map des membres pour affichage rapide des badges
  const memberMap = useMemo(() => {
    const map = new Map();
    activeMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, [activeMembers]);

  const handleToggleMember = (memberId) => {
    if (disabled) return;
    if (selectedUserIds.includes(memberId)) {
      onChange(selectedUserIds.filter((id) => id !== memberId));
    } else {
      onChange([...selectedUserIds, memberId]);
    }
  };

  const handleRemoveMember = (memberId, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    onChange(selectedUserIds.filter((id) => id !== memberId));
  };

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20 text-left select-none">
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark hover:text-cordel-wood flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>🎯 Membres spécifiques (nominatif)</span>
          <span className="text-[10px] text-cordel-wood font-bold">
            {isExpanded ? '▲ Réduire' : '▼ Déplier'}
          </span>
        </button>

        {selectedUserIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] font-extrabold text-cordel-wood bg-amber-100/70 border border-cordel-wood/30 px-1.5 py-0.5 rounded">
              {selectedUserIds.length} membre{selectedUserIds.length > 1 ? 's' : ''} sélectionné{selectedUserIds.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange([])}
              className="text-[8.5px] font-bold text-red-700 hover:underline cursor-pointer"
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-2.5 rounded border border-dashed border-cordel-master-dark/25 bg-[#fdfaf2] dark:bg-[#1f1d1a] space-y-2">
          {/* Recherche instantanée */}
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-xs opacity-60">🔍</span>
            <input
              type="text"
              disabled={disabled}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par prénom, nom, surnom ou instrument..."
              className="w-full pl-7 pr-7 py-1 text-xs font-semibold bg-white dark:bg-black/20 border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-xs text-cordel-master-dark/60 hover:text-cordel-wood font-bold cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chips badges des membres sélectionnés */}
          <AnnonceSelectedChips
            selectedUserIds={selectedUserIds}
            memberMap={memberMap}
            onRemoveMember={handleRemoveMember}
            disabled={disabled}
          />

          {/* Liste déroulante des membres */}
          <div className="max-h-40 overflow-y-auto overscroll-contain space-y-1 pr-1 text-left scrollbar-thin">
            {filteredMembers.length === 0 ? (
              <p className="text-[10px] italic font-semibold text-center py-2 text-cordel-master-dark/70">
                Aucun membre actif trouvé.
              </p>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedUserIds.includes(member.id);
                const displayName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
                const detail = member.surnom || member.instrument || member.role || '';

                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-100/80 border-encre-noire shadow-xs font-bold text-encre-noire'
                        : 'bg-white/80 dark:bg-black/10 border-cordel-master-dark/20 hover:bg-amber-50/50 text-encre-noire'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => {}}
                        className="accent-cordel-wood rounded scale-105 pointer-events-none"
                      />
                      <XiloAvatar user={member} size={20} className="shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-[10px] font-bold block truncate">{displayName}</span>
                        {detail && <span className="text-[8px] text-cordel-master-dark/70 block truncate">{detail}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
