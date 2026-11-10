import React, { useState } from 'react';
import {
  CUSTOM_EXTERNAL_LINK_VALUE,
  MEGAPHONE_INTERNAL_DESTINATIONS,
  isExternalActionLink
} from '../../utils/megaphoneNavigationUtils';

/**
 * Composant : AnnonceCtaFields
 * Champs de configuration du bouton d'action optionnel (CTA) pour une annonce du Mégaphone.
 * Propose les destinations internes officielles ainsi qu'une option de lien externe personnalisé (https://...).
 */
export default function AnnonceCtaFields({
  actionText,
  setActionText,
  actionLink,
  setActionLink,
  disabled = false
}) {
  const [customExternalMode, setCustomExternalMode] = useState(() => isExternalActionLink(actionLink));
  const isExternal = customExternalMode || isExternalActionLink(actionLink);

  // Valeur contrôlée du <select>
  const selectValue = isExternal ? CUSTOM_EXTERNAL_LINK_VALUE : (actionLink || '');

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === CUSTOM_EXTERNAL_LINK_VALUE) {
      setCustomExternalMode(true);
      if (!isExternalActionLink(actionLink)) {
        setActionLink('https://');
      }
    } else {
      setCustomExternalMode(false);
      setActionLink(val);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
      <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
        🚀 Bouton d&apos;action / Call to Action (Optionnel)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[8px] font-semibold text-cordel-wood uppercase">
            Texte du bouton (ex: Mettre à jour mon profil)
          </label>
          <input
            type="text"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            disabled={disabled}
            placeholder="Ex: Mettre à jour mon profil"
            className="theme-input text-xs py-1 font-medium"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[8px] font-semibold text-cordel-wood uppercase">
            Page de destination
          </label>
          <select
            value={selectValue}
            onChange={handleSelectChange}
            disabled={disabled}
            className="theme-input text-xs py-1 font-bold bg-cordel-bg-light"
          >
            <option value="">Sélectionner une page...</option>
            {MEGAPHONE_INTERNAL_DESTINATIONS.map((dest) => (
              <option key={dest.value} value={dest.value}>
                {dest.label}
              </option>
            ))}
            <option value={CUSTOM_EXTERNAL_LINK_VALUE}>
              🌐 Lien externe personnalisé (https://...)
            </option>
          </select>
        </div>
      </div>

      {/* Champ de saisie de l'URL externe lorsque l'option personnalisée est sélectionnée */}
      {isExternal && (
        <div className="flex flex-col gap-0.5 mt-1">
          <label className="text-[8px] font-semibold text-cordel-wood uppercase">
            URL externe personnalisée (HelloAsso, Drive, Framaspace...)
          </label>
          <input
            type="url"
            value={actionLink}
            onChange={(e) => setActionLink(e.target.value)}
            disabled={disabled}
            placeholder="https://..."
            className="theme-input text-xs py-1 font-semibold"
          />
        </div>
      )}
    </div>
  );
}
