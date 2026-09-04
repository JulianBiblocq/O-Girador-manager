import React, { useEffect, useRef } from 'react';
import XiloAvatar from '../XiloAvatar';

/**
 * Extrait la requête de mention (@quelquechose) située juste avant le curseur dans une chaîne de texte.
 *
 * @param {string} text Texte complet
 * @param {number} cursorIndex Position actuelle du curseur
 * @returns {{ query: string, start: number, end: number } | null}
 */
export function getMentionQueryAtCursor(text, cursorIndex) {
  if (typeof text !== 'string' || cursorIndex === undefined || cursorIndex === null) return null;
  const beforeCursor = text.slice(0, cursorIndex);
  const match = beforeCursor.match(/(?:^|\s)@([a-zA-ZÀ-ÿ0-9_-]*)$/);
  if (!match) return null;

  const query = match[1];
  // Calcul de la position du symbole '@'
  const atIndex = beforeCursor.length - query.length - 1;
  return {
    query,
    start: atIndex,
    end: cursorIndex
  };
}

/**
 * Filtre les membres selon la chaîne de recherche tapée après le '@'.
 *
 * @param {Array<object>} allUsers Liste des membres de l'association
 * @param {string} query Texte tapé (insensible à la casse et aux accents)
 * @param {number} maxResults Nombre maximum de suggestions à afficher
 * @returns {Array<object>} Liste filtrée des membres suggérés
 */
export function filterUsersByMentionQuery(allUsers = [], query = '', maxResults = 6) {
  if (!Array.isArray(allUsers) || allUsers.length === 0) return [];
  const cleanQuery = (query || '').toLowerCase().trim();

  return allUsers
    .filter((user) => {
      if (!user) return false;
      const prenom = (user.prenom || '').toLowerCase();
      const nom = (user.nom || '').toLowerCase();
      const apelido = (user.apelido || user.surnom || '').toLowerCase();
      const fullName = `${prenom} ${nom}`.trim();

      if (!cleanQuery) return true; // Si juste '@', proposer les premiers membres
      return (
        prenom.includes(cleanQuery) ||
        nom.includes(cleanQuery) ||
        fullName.includes(cleanQuery) ||
        apelido.includes(cleanQuery)
      );
    })
    .slice(0, maxResults);
}

/**
 * Extrait les identifiants d'utilisateurs mentionnés dans un texte contenant des mentions @Prénom Nom.
 *
 * @param {string} text Contenu du message
 * @param {Array<object>} allUsers Liste des membres
 * @returns {Array<string>} Liste unique des IDs de membres mentionnés
 */
export function extractMentionedUserIds(text = '', allUsers = []) {
  if (!text || !Array.isArray(allUsers)) return [];
  const cleanText = text.toLowerCase();
  const mentionedIds = new Set();

  allUsers.forEach((user) => {
    if (!user || !user.id) return;
    const prenom = (user.prenom || '').toLowerCase().trim();
    const nom = (user.nom || '').toLowerCase().trim();
    const apelido = (user.apelido || user.surnom || '').toLowerCase().trim();

    if (prenom && nom && cleanText.includes(`@${prenom} ${nom}`)) {
      mentionedIds.add(user.id);
    } else if (apelido && cleanText.includes(`@${apelido}`)) {
      mentionedIds.add(user.id);
    } else if (prenom && cleanText.includes(`@${prenom}`)) {
      mentionedIds.add(user.id);
    }
  });

  return Array.from(mentionedIds);
}

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
