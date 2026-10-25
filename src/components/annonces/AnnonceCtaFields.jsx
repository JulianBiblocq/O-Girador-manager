import React from 'react';

/**
 * Composant : AnnonceCtaFields
 * 
 * Champs de configuration du bouton d'action optionnel (CTA) pour une annonce.
 */
export default function AnnonceCtaFields({
  actionText,
  setActionText,
  actionLink,
  setActionLink,
  disabled = false
}) {
  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
      <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
        🚀 Bouton d'action / Call to Action (Optionnel)
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
            value={actionLink}
            onChange={(e) => setActionLink(e.target.value)}
            disabled={disabled}
            className="theme-input text-xs py-1 font-bold bg-cordel-bg-light"
          >
            <option value="">Sélectionner une page...</option>
            <option value="/profil">👤 Mon Profil</option>
            <option value="/agenda">📅 Agenda</option>
            <option value="/forum">🗣️ Porte-Voix / Forum</option>
            <option value="/varal">📜 Varal / Documents</option>
            <option value="/treasury">💰 Trésorerie / Cotisations</option>
            <option value="/trombinoscope">👥 Trombinoscope</option>
            <option value="/materiel">🥁 Matériel</option>
            <option value="/vestiaire">👗 Vestiaire</option>
          </select>
        </div>
      </div>
    </div>
  );
}
