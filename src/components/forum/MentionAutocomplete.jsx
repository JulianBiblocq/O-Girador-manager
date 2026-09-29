import React, { useEffect, useRef } from 'react';
import XiloAvatar from '../XiloAvatar';
export { getMentionQueryAtCursor, filterUsersByMentionQuery, extractMentionedUserIds } from '../../utils/mentionUtils';


/**
 * Menu déroulant flottant de suggestions de membres lors de la saisie d'un '@'.
 */
export function MentionDropdown({
  suggestions = [],
  onSelectUser,
  onClose,
  selectedIndex = 0,
  position = 'top' // 'top' ou 'bottom'
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute left-0 z-50 w-64 bg-cordel-bg border-2 border-encre-noire rounded-[6px_8px_6px_8px] shadow-[3px_3px_0px_0px_#181716] overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100 ${
        position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      }`}
    >
      <div className="p-1.5 bg-cordel-master-light/10 border-b border-dashed border-cordel-master-dark/20 text-[9px] font-black uppercase tracking-wider text-cordel-wood flex items-center justify-between">
        <span>👥 Mentionner un membre</span>
        <span className="opacity-60 text-[8px] font-normal">Entrée ou clic</span>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-cordel-master-dark/10">
        {suggestions.map((user, idx) => {
          const isSelected = idx === selectedIndex;
          const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Membre';
          const subtitle = user.apelido ? `"${user.apelido}"` : user.role || '';

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelectUser(user)}
              className={`w-full text-left p-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-amber-100/80 text-encre-noire font-bold'
                  : 'bg-cordel-bg-light hover:bg-white text-encre-noire font-medium'
              }`}
            >
              <XiloAvatar src={user.photoURL} name={fullName} size={28} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate text-encre-noire">
                  {fullName}
                </span>
                {subtitle && (
                  <span className="text-[8px] uppercase font-semibold text-cordel-wood opacity-80 truncate">
                    {subtitle}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black text-cordel-wood opacity-50">
                @
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
