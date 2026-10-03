import React from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../../hooks/useTranslation';

export default function LegalInfoBlock({ formData = {}, handleChange, saving, signaturePresidentFile, setSignaturePresidentFile, signatureTresorierFile, setSignatureTresorierFile }) {
  const { t } = useTranslation();

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        {t('vitrine.admin.general.legalInfoBlock.informationsLegalesDevisFacturesVitrine')}
      </h3>
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
          {t('vitrine.admin.general.legalInfoBlock.cesCoordonneesAdministrativesSImprimeront')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Structure juridique */}
          <div className="flex flex-col gap-1">
            <label htmlFor="structureJuridique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {t('vitrine.admin.general.legalInfoBlock.structureJuridique')}
            </label>
            <input 
              id="structureJuridique"
              type="text"
              value={formData.structureJuridique || ''}
              onChange={(e) => handleChange('structureJuridique', e.target.value)}
              disabled={saving}
              placeholder={t('vitrine.admin.general.legalInfoBlock.exAssociationLoi1901')}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          {/* N° SIRET / RNA */}
          <div className="flex flex-col gap-1">
            <label htmlFor="siret" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {t('vitrine.admin.general.legalInfoBlock.numeroSiretNRna')}
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
              placeholder={t('vitrine.admin.general.legalInfoBlock.ex84912345600012')}
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>
        </div>

        {/* Adresse du Siège Social */}
        <div className="flex flex-col gap-1">
          <label htmlFor="adresseSiegeSocial" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            {t('vitrine.admin.general.legalInfoBlock.adresseDeDomiciliationSiegeSocial')}
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
            placeholder={t('vitrine.admin.general.legalInfoBlock.ex12RueDeLa')}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* E-mail Officiel de l'Association */}
        <div className="flex flex-col gap-1">
          <label htmlFor="emailOfficiel" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
            <span>{t('vitrine.admin.general.legalInfoBlock.eMailOfficielDeL')}</span>
            <span className="text-[8px] font-normal italic text-cordel-wood">
              {t('vitrine.admin.general.legalInfoBlock.renseigneSurLesDevisPdf')}
            </span>
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
            placeholder={t('vitrine.admin.general.legalInfoBlock.exContactVotreAssociationFr')}
            className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* Téléphone de Contact Officiel */}
        <div className="flex flex-col gap-1">
          <label htmlFor="telephone" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            {t('vitrine.admin.general.legalInfoBlock.telephoneOfficielDeLAssociation')}
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
            placeholder={t('vitrine.admin.general.legalInfoBlock.ex06123456')}
            className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* Clause Spécifique / Avertissement Contrat (Textarea Optionnel) */}
        <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
          <label htmlFor="clauseSpecifique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
            <span>{t('vitrine.admin.general.legalInfoBlock.clauseSpecifiqueAvertissementContratOptionnel')}</span>
            <span className="text-[8px] font-normal italic text-cordel-wood">
              {t('vitrine.admin.general.legalInfoBlock.sImprimeEnBasDes')}
            </span>
          </label>
          <textarea
            id="clauseSpecifique"
            rows={3}
            value={formData.clauseSpecifique || formData.legalClause || ''}
            onChange={(e) => {
              handleChange('clauseSpecifique', e.target.value);
              handleChange('legalClause', e.target.value);
            }}
            disabled={saving}
            placeholder={t('vitrine.admin.general.legalInfoBlock.exAvertissementSonoreLesPrestations')}
            className="theme-input text-xs font-bold p-2 bg-cordel-bg-light w-full resize-none"
          />
        </div>

        {/* Signatures Numérisées du Président et du Trésorier */}
        <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/15 pt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-wood">
            {t('vitrine.admin.general.legalInfoBlock.signaturesNumeriseesDesRepresentantsImprimees')}
          </span>
          <p className="text-[9px] text-cordel-master-dark/70 font-medium">
            {t('vitrine.admin.general.legalInfoBlock.conseilUtilisezUneImageAu')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {/* Signature du Président / Mestre */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                {t('vitrine.admin.general.legalInfoBlock.signatureDuPresidentMestre')}
              </span>
              <div className="flex items-center gap-2">
                {formData.signaturePresidentUrl ? (
                  <img
                    src={formData.signaturePresidentUrl}
                    alt={t('vitrine.admin.general.legalInfoBlock.signaturePresident')}
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    {t('vitrine.admin.general.legalInfoBlock.aucune')}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSignaturePresidentFile && setSignaturePresidentFile(e.target.files?.[0] || null)}
                  disabled={saving}
                  className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                />
              </div>
              {signaturePresidentFile && (
                <span className="text-[9px] text-green-700 font-bold">
                  {t('vitrine.admin.general.legalInfoBlock.selectionne')} {signaturePresidentFile.name}
                </span>
              )}
            </div>

            {/* Signature du Trésorier */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                {t('vitrine.admin.general.legalInfoBlock.signatureDuTresorier')}
              </span>
              <div className="flex items-center gap-2">
                {formData.signatureTresorierUrl ? (
                  <img
                    src={formData.signatureTresorierUrl}
                    alt={t('vitrine.admin.general.legalInfoBlock.signatureTresorier')}
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    {t('vitrine.admin.general.legalInfoBlock.aucune')}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSignatureTresorierFile && setSignatureTresorierFile(e.target.files?.[0] || null)}
                  disabled={saving}
                  className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                />
              </div>
              {signatureTresorierFile && (
                <span className="text-[9px] text-green-700 font-bold">
                  {t('vitrine.admin.general.legalInfoBlock.selectionne')} {signatureTresorierFile.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}

