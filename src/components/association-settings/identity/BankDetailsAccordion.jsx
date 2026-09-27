import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

/**
 * Accordéon compact pour les coordonnées bancaires et facturation.
 * Affiche en bandeau compact « IBAN : FR76 •••• [4 derniers chiffres] » + bouton [Modifier].
 */
export default function BankDetailsAccordion({ formData = {}, handleChange, saving }) {
  const [isOpen, setIsOpen] = useState(false);

  // Masquage sécurisé de l'IBAN pour aperçu compact
  const getMaskedIban = (rawIban) => {
    if (!rawIban || typeof rawIban !== 'string') return 'Non renseigné';
    const cleaned = rawIban.replace(/\s+/g, '');
    if (cleaned.length < 6) return cleaned;
    const prefix = cleaned.substring(0, 4);
    const suffix = cleaned.substring(cleaned.length - 4);
    return `${prefix} •••• ${suffix}`;
  };

  const rawIban = formData.ribIban || formData.iban || '';
  const maskedIban = getMaskedIban(rawIban);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête compact avec IBAN masqué */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏦</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Coordonnées Bancaires & RIB
            </span>
          </div>

          <span className="text-[10px] text-cordel-master-dark/75 font-semibold hidden sm:inline">
            •
          </span>

          <span className="text-[10px] font-mono font-bold text-stone-700 bg-white/70 px-2 py-0.5 rounded border border-stone-300">
            IBAN : {maskedIban}
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {isOpen ? '▲ Fermer' : '✏️ Modifier'}
        </button>
      </div>

      {/* Contenu dépliable pour saisie des coordonnées bancaires */}
      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            Ces informations apparaîtront sur vos factures et devis officiels pour permettre les règlements par virement bancaire.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mention Exonération TVA */}
            <div className="flex flex-col gap-1">
              <label htmlFor="mentionTVA" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Mention d'Exonération TVA
              </label>
              <input 
                id="mentionTVA"
                type="text"
                value={formData.mentionTVA || ''}
                onChange={(e) => handleChange('mentionTVA', e.target.value)}
                disabled={saving}
                placeholder="ex: TVA non applicable, art. 293 B du CGI"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            {/* RIB / IBAN */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ribIban" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Coordonnées Bancaires (IBAN / BIC)
              </label>
              <input 
                id="ribIban"
                type="text"
                value={formData.ribIban || formData.iban || ''}
                onChange={(e) => {
                  handleChange('ribIban', e.target.value);
                  handleChange('iban', e.target.value);
                }}
                disabled={saving}
                placeholder="ex: FR76 3000 4000 1234 5678 9012 345"
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>

          {/* Titulaire du compte bancaire */}
          <div className="flex flex-col gap-1">
            <label htmlFor="titulaireCompte" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Titulaire du compte bancaire
            </label>
            <input 
              id="titulaireCompte"
              type="text"
              value={formData.titulaireCompte || ''}
              onChange={(e) => handleChange('titulaireCompte', e.target.value)}
              disabled={saving}
              placeholder="ex: Association O Girador"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>
        </div>
      )}
    </CordelCard>
  );
}
