import React from 'react';
import CordelCard from '../CordelCard';
import SubscriptionInvitationHeader from './identity/SubscriptionInvitationHeader';
import LegalInfoAccordion from './identity/LegalInfoAccordion';
import OfficialSignaturesAccordion from './identity/OfficialSignaturesAccordion';
import BankDetailsAccordion from './identity/BankDetailsAccordion';
import BureauMestriaAccordion from './identity/BureauMestriaAccordion';
import { useTranslation } from '../LanguageContext';

/**
 * Pôle Configuration - Onglet Identité Légale & Juridique.
 * Architecture compacte avec formulaires pliés par défaut et en-tête d'administration prioritaire.
 */
export default function TabIdentity({
  formData,
  handleChange,
  signaturePresidentFile,
  setSignaturePresidentFile,
  signatureTresorierFile,
  setSignatureTresorierFile,
  groupId,
  saving,
  t,
  onReopenOnboarding
}) {
  const { t: tHook } = useTranslation();
  const tFunc = t || tHook;
  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* 1. Encart d'en-tête : Abonnement SaaS & Invitation Groupe */}
      <SubscriptionInvitationHeader
        formData={formData}
        groupId={groupId}
        onReopenOnboarding={onReopenOnboarding}
      />

      {/* 2. Dénomination officielle & Nom court / Sigle de l'Association */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3 flex items-center gap-2">
          <span>🏛️</span> {tFunc('settings.identity.tabIdentity.denominationSigleDeLAssociation')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label htmlFor="nom" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {tFunc('settings.identity.tabIdentity.nomOfficielCompletDeL')}
            </label>
            <input
              id="nom"
              type="text"
              name="nom"
              value={formData.nom || ''}
              onChange={(e) => handleChange('nom', e.target.value)}
              disabled={saving}
              placeholder={tFunc('settings.identity.tabIdentity.exAssociacaoCulturalSamambaia')}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="shortName" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {tFunc('settings.identity.tabIdentity.nomCourtSigle')}
            </label>
            <input
              id="shortName"
              type="text"
              name="shortName"
              value={formData.shortName || ''}
              onChange={(e) => handleChange('shortName', e.target.value)}
              disabled={saving}
              placeholder={tFunc('settings.identity.tabIdentity.exSamambaia')}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>
        </div>
      </CordelCard>

      {/* 3. Informations Légales (Forme, SIRET, Siège) - Accordéon compact */}
      <div data-tour="config-identity-legal">
        <LegalInfoAccordion
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 4. Signatures Officielles - Accordéon compact avec pastilles d'état */}
      <div data-tour="config-identity-signatures">
        <OfficialSignaturesAccordion
          formData={formData}
          saving={saving}
          signaturePresidentFile={signaturePresidentFile}
          setSignaturePresidentFile={setSignaturePresidentFile}
          signatureTresorierFile={signatureTresorierFile}
          setSignatureTresorierFile={setSignatureTresorierFile}
        />
      </div>

      {/* 5. Coordonnées Bancaires & RIB - Accordéon compact */}
      <BankDetailsAccordion
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />

      {/* 6. Trombinoscope Bureau & Direction Artistique - Deux tiroirs repliés avec comptage */}
      <div data-tour="config-identity-bureau">
        <BureauMestriaAccordion
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>
    </div>
  );
}
