import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';

/**
 * Accordéon compact pour les signatures officielles (Président et Trésorier).
 * Affiche en bandeau les pastilles d'état : « Président : Enregistrée ✓ | Trésorier : Enregistrée ✓ »
 */
export default function OfficialSignaturesAccordion({
  formData = {},
  saving,
  signaturePresidentFile,
  setSignaturePresidentFile,
  signatureTresorierFile,
  setSignatureTresorierFile
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const hasPresSig = Boolean(formData.signaturePresidentUrl || signaturePresidentFile);
  const hasTresSig = Boolean(formData.signatureTresorierUrl || signatureTresorierFile);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête compact avec pastilles de statut */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">✍️</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.identity.officialSignaturesAccordion.signaturesOfficielles')}
            </span>
          </div>

          <span className="text-[10px] text-cordel-master-dark/75 font-semibold hidden sm:inline">
            •
          </span>

          {/* Pastilles d'état en ligne */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
              hasPresSig 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-stone-200 text-stone-700 border border-stone-300'
            }`}>
              {t('settings.identity.officialSignaturesAccordion.president')} {hasPresSig ? t('settings.identity.officialSignaturesAccordion.enregistree') : t('settings.identity.officialSignaturesAccordion.nonRenseignee')}
            </span>

            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
              hasTresSig 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-stone-200 text-stone-700 border border-stone-300'
            }`}>
              {t('settings.identity.officialSignaturesAccordion.tresorier')} {hasTresSig ? t('settings.identity.officialSignaturesAccordion.enregistree') : t('settings.identity.officialSignaturesAccordion.nonRenseignee')}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {isOpen ? t('settings.identity.officialSignaturesAccordion.fermer') : t('settings.identity.officialSignaturesAccordion.voirRemplacer')}
        </button>
      </div>

      {/* Contenu dépliable d'upload */}
      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            {t('settings.identity.officialSignaturesAccordion.cesSignaturesNumeriquesSImpriment')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {/* Signature du Président / Mestre */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                {t('settings.identity.officialSignaturesAccordion.signatureDuPresidentMestre')}
              </span>
              <div className="flex items-center gap-2">
                {formData.signaturePresidentUrl ? (
                  <img
                    src={formData.signaturePresidentUrl}
                    alt={t('settings.identity.officialSignaturesAccordion.signaturePresident')}
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    {t('settings.identity.officialSignaturesAccordion.aucune')}
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
                <span className="text-[9px] text-emerald-700 font-bold">
                  {t('settings.identity.officialSignaturesAccordion.selectionne')} {signaturePresidentFile.name}
                </span>
              )}
            </div>

            {/* Signature du Trésorier */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                {t('settings.identity.officialSignaturesAccordion.signatureDuTresorier')}
              </span>
              <div className="flex items-center gap-2">
                {formData.signatureTresorierUrl ? (
                  <img
                    src={formData.signatureTresorierUrl}
                    alt={t('settings.identity.officialSignaturesAccordion.signatureTresorier')}
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    {t('settings.identity.officialSignaturesAccordion.aucune')}
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
                <span className="text-[9px] text-emerald-700 font-bold">
                  {t('settings.identity.officialSignaturesAccordion.selectionne')} {signatureTresorierFile.name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
