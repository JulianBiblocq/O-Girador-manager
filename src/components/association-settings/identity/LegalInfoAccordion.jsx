import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';

/**
 * Accordéon compact pour les informations légales et coordonnées officielles de l'association.
 * Présente un bandeau synthétique fermé par défaut : Forme juridique • SIRET • Ville du siège.
 */
export default function LegalInfoAccordion({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Extraction synthétique de la ville depuis l'adresse du siège social
  const getCityFromAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    // Format typique français : "12 Rue de la Paix, 29200 Brest"
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return address.trim();
  };

  const structure = formData.structureJuridique || 'Association Loi 1901';
  const siretNumber = formData.siret || formData.rna || 'SIRET non renseigné';
  const address = formData.adresseSiegeSocial || formData.adresse || '';
  const city = getCityFromAddress(address) || 'Siège non renseigné';

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête compact avec résumé visible */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📜</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.identity.legalInfoAccordion.informationsLegalesCoordonnees')}
            </span>
          </div>

          <span className="text-[10px] text-cordel-master-dark/75 font-semibold hidden sm:inline">
            •
          </span>

          {/* Résumé compact : Forme juridique • SIRET • Ville */}
          <span className="text-[10px] font-bold text-stone-600 truncate max-w-xs sm:max-w-md">
            {structure} • {siretNumber} • {city}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
          >
            {isOpen ? t('settings.identity.legalInfoAccordion.fermer') : t('settings.identity.legalInfoAccordion.editer')}
          </button>
        </div>
      </div>

      {/* Contenu dépliable de l'accordéon */}
      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            {t('settings.identity.legalInfoAccordion.cesCoordonneesAdministrativesSImprimeront')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Structure juridique */}
            <div className="flex flex-col gap-1">
              <label htmlFor="structureJuridique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                {t('settings.identity.legalInfoAccordion.structureJuridique')}
              </label>
              <input 
                id="structureJuridique"
                type="text"
                value={formData.structureJuridique || ''}
                onChange={(e) => handleChange('structureJuridique', e.target.value)}
                disabled={saving}
                placeholder={t('settings.identity.legalInfoAccordion.exAssociationLoi1901')}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            {/* N° SIRET / RNA */}
            <div className="flex flex-col gap-1">
              <label htmlFor="siret" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                {t('settings.identity.legalInfoAccordion.numeroSiretNRna')}
              </label>
              <input 
                id="siret"
                type="text"
                value={formData.siret || formData.rna || ''}
                onChange={(e) => {
                  handleChange('siret', e.target.value);
                  handleChange('rna', e.target.value);
                }}
                disabled={saving}
                placeholder={t('settings.identity.legalInfoAccordion.ex84912345600012')}
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>

          {/* Adresse du Siège Social */}
          <div className="flex flex-col gap-1">
            <label htmlFor="adresseSiegeSocial" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {t('settings.identity.legalInfoAccordion.adresseDeDomiciliationSiegeSocial')}
            </label>
            <input 
              id="adresseSiegeSocial"
              type="text"
              value={formData.adresseSiegeSocial || formData.adresse || ''}
              onChange={(e) => {
                handleChange('adresseSiegeSocial', e.target.value);
                handleChange('adresse', e.target.value);
              }}
              disabled={saving}
              placeholder={t('settings.identity.legalInfoAccordion.ex12RueDeLa')}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* E-mail Officiel */}
            <div className="flex flex-col gap-1">
              <label htmlFor="emailOfficiel" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>{t('settings.identity.legalInfoAccordion.eMailOfficiel')}</span>
              </label>
              <input 
                id="emailOfficiel"
                type="email"
                value={formData.emailOfficiel || formData.email || ''}
                onChange={(e) => {
                  handleChange('emailOfficiel', e.target.value);
                  handleChange('email', e.target.value);
                }}
                disabled={saving}
                placeholder={t('settings.identity.legalInfoAccordion.exContactVotreAssociationFr')}
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            {/* Téléphone Officiel */}
            <div className="flex flex-col gap-1">
              <label htmlFor="telephone" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                {t('settings.identity.legalInfoAccordion.telephoneOfficiel')}
              </label>
              <input 
                id="telephone"
                type="tel"
                value={formData.telephone || formData.phone || ''}
                onChange={(e) => {
                  handleChange('telephone', e.target.value);
                  handleChange('phone', e.target.value);
                }}
                disabled={saving}
                placeholder={t('settings.identity.legalInfoAccordion.ex06123456')}
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
