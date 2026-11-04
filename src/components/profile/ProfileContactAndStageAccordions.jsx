import React from 'react';
import CordelCard from '../CordelCard';
import {
  XiloEye,
  XiloEyeOff,
  XiloPhone,
  XiloHome,
  XiloBirthday,
  XiloPin,
  XiloShirt,
  XiloHand,
  XiloDocument
} from '../XiloIcons';
import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../../utils/pdfGenerator';

/**
 * Accordéons pliables du profil : « Coordonnées & Annuaire » et « Scène, Costumes & Santé ».
 */
export default function ProfileContactAndStageAccordions({
  profileData,
  formData,
  associationName,
  locale,
  t,
  isFieldVisible,
  isCostumerieEnabled,
  demanderDroitImage,
  demanderAttestationSante,
  openSections,
  toggleSection
}) {
  const isPhoneVisible = formData.afficherTelephone !== false && formData.publierTelephone !== false;
  const phoneSummary = formData.telephone ? (isPhoneVisible ? '📱 Visible' : '📱 Masqué') : '📱 Non renseigné';
  const citySummary = formData.afficherVille ? '📍 Ville visible' : '📍 Adresse masquée';

  const lateraliteLabel = formData.lateralite === 'gaucher' ? t('onboarding.handLeft') : t('onboarding.handRight');
  const costumeParts = [
    formData.tailleTshirt ? `T-shirt ${formData.tailleTshirt}` : null,
    formData.taillePantalon ? formData.taillePantalon : null
  ].filter(Boolean);
  const costumeSummary = isCostumerieEnabled && costumeParts.length > 0 ? ` • ${costumeParts.join(' / ')}` : '';
  const santeSummary = demanderAttestationSante
    ? ` • ${formData.aptitudeMedicale ? '✅ Apte' : '⚠️ Santé à valider'}`
    : '';

  return (
    <>
      {/* Accordéon 1 : Coordonnées & Visibilité */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 text-left">
        <button
          type="button"
          onClick={() => toggleSection('contact')}
          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-xs font-black text-encre-noire truncate">
            🔒 Coordonnées & Annuaire • <span className="font-bold text-cordel-wood">{phoneSummary} • {citySummary}</span>
          </span>
          <span className="text-xs font-black text-cordel-wood shrink-0">{openSections.contact ? '▴' : '▾'}</span>
        </button>
        {openSections.contact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-encre-noire font-semibold mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/20">
            {isFieldVisible('telephone') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1"><XiloPhone size={12} /> {t('userProfile.phone')}</span>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-extrabold">{formData.telephone || <span className="italic opacity-50">{t('userProfile.notSpecified')}</span>}</span>
                  {formData.telephone && (
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${isPhoneVisible ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'}`}>
                      {isPhoneVisible ? <><XiloEye size={10} /> {t('userProfile.phoneVisible')}</> : <><XiloEyeOff size={10} /> {t('userProfile.phoneHidden')}</>}
                    </span>
                  )}
                </div>
              </div>
            )}
            {isFieldVisible('dateNaissance') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1"><XiloBirthday size={12} /> {t('userProfile.birthdate')}</span>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{formData.dateNaissance ? new Date(formData.dateNaissance).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'fr-FR', formData.afficherDateNaissance ? { day: 'numeric', month: 'long' } : undefined) : <span className="italic opacity-50">{t('userProfile.notSpecified')}</span>}</span>
                </div>
              </div>
            )}
            {isFieldVisible('adresse') && (
              <div className="col-span-1 md:col-span-2 bg-cordel-bg-light/60 p-2 rounded border border-dashed border-cordel-master-dark/20 flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1"><XiloHome size={12} /> {formData.adresse || (profileData?.adresseRue ? `${profileData.adresseRue}, ${profileData.adresseCP || ''} ${profileData.adresseVille || ''}` : t('userProfile.notSpecifiedFem'))}</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${formData.afficherVille ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'}`}>
                  {formData.afficherVille ? <><XiloPin size={10} /> {t('userProfile.cityVisible')}</> : <><XiloEyeOff size={10} /> {t('userProfile.addressHidden')}</>}
                </span>
              </div>
            )}
          </div>
        )}
      </CordelCard>

      {/* Accordéon 2 : Placement, Costumes & Santé */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 text-left">
        <button
          type="button"
          onClick={() => toggleSection('stage')}
          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-xs font-black text-encre-noire truncate">
            🛡️ Scène, Costumes & Santé • <span className="font-bold text-cordel-wood">{lateraliteLabel}{costumeSummary}{santeSummary}</span>
          </span>
          <span className="text-xs font-black text-cordel-wood shrink-0">{openSections.stage ? '▴' : '▾'}</span>
        </button>
        {openSections.stage && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-encre-noire font-semibold mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/20">
            {isFieldVisible('lateralite') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1"><XiloHand size={11} /> {t('userProfile.lateraliteMestre')}</span>
                <span className="capitalize font-extrabold text-cordel-wood">{lateraliteLabel}</span>
              </div>
            )}
            {isCostumerieEnabled && (isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1"><XiloShirt size={11} /> {t('userProfile.costumeSizes')}</span>
                <span className="font-extrabold">{formData.tailleTshirt || '-'} / {formData.taillePantalon || '-'}</span>
              </div>
            )}
            {demanderDroitImage && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('userProfile.imageRights')}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{formData.droitImage ? `✅ ${t('userProfile.granted')}` : `❌ ${t('userProfile.refused')}`}</span>
                  {formData.droitImage && <button type="button" onClick={() => generateImageCharterPDF(profileData, associationName)} className="text-[9px] font-bold text-cordel-wood underline flex items-center gap-0.5"><XiloDocument size={10} /> PDF</button>}
                </div>
              </div>
            )}
            {demanderAttestationSante && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('userProfile.medicalAttestation')}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{formData.aptitudeMedicale ? `✅ ${t('userProfile.declaredFit')}` : `❌ ${t('userProfile.notSpecified')}`}</span>
                  {formData.aptitudeMedicale && <button type="button" onClick={() => generateMedicalAttestationPDF(profileData, associationName)} className="text-[9px] font-bold text-cordel-wood underline flex items-center gap-0.5"><XiloDocument size={10} /> PDF</button>}
                </div>
              </div>
            )}
          </div>
        )}
      </CordelCard>
    </>
  );
}
