import React from 'react';
import CordelCard from '../../CordelCard';

export default function BankDetailsBlock({ formData, handleChange, saving }) {
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        🏦 Coordonnées Bancaires & Facturation
      </h3>
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
          Ces informations apparaîtront sur vos factures et devis pour permettre les paiements par virement.
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

        {/* Titulaire du compte bancaire (Optional) */}
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
    </CordelCard>
  );
}
