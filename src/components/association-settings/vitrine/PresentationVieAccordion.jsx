import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import RichTextEditor from '../../RichTextEditor';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Accordéon 2 : Présentation & Vie Associative
 * Gère les textes "Qui sommes-nous ?" et le quotidien du groupe / fonctionnement hebdomadaire.
 */
export default function PresentationVieAccordion({
  formData = {},
  handleChange,
  saving,
  defaultOpen = false
}) {
  const { t } = useTranslation();
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || {};

  const handleTextChange = (fieldKey, value) => {
    const updatedTexts = {
      ...(publicTheme.vitrineTexts || {}),
      [fieldKey]: value
    };
    handleChange('publicTheme', {
      ...publicTheme,
      vitrineTexts: updatedTexts
    });
  };

  const handleThemeChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    if (field === 'publicDescription') updatedTheme.aboutText = value;
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <CordelAccordion
      title={t('vitrine.admin.content.presentationVieAccordion.presentationVieAssociative')}
      subtitle={t('vitrine.admin.content.presentationVieAccordion.textesQuiSommesNousQuotidien')}
      icon="📖"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="flex flex-col gap-4 text-left pt-1">
        {/* Titre de la section Présentation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>{t('vitrine.admin.content.presentationVieAccordion.titreDeLaSectionPresentation')}</span>
          </label>
          <input
            type="text"
            value={vitrineTexts.titrePresentation || ''}
            onChange={(e) => handleTextChange('titrePresentation', e.target.value)}
            disabled={saving}
            placeholder={t('vitrine.admin.content.presentationVieAccordion.quiSommesNous')}
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Texte "Qui sommes-nous ?" */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            {t('vitrine.admin.content.presentationVieAccordion.presentationQuiSommesNous')}
          </label>
          <RichTextEditor
            value={publicTheme.publicDescription || publicTheme.aboutText || ''}
            onChange={(val) => handleThemeChange('publicDescription', val)}
            disabled={saving}
            placeholder={t('vitrine.admin.content.presentationVieAccordion.presentezLHistoireDeVotre')}
            minHeight="140px"
            showLists={true}
            showImage={false}
            showAlign={true}
          />
        </div>

        {/* Quotidien du Groupe & Vie Associative */}
        <div className="flex flex-col gap-3 p-3.5 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px] mt-1">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cordel-wood">
              {t('vitrine.admin.content.presentationVieAccordion.notreQuotidienOrganisation')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="afficherVieAssociative"
                checked={publicTheme.afficherVieAssociative !== false}
                onChange={(e) => handleThemeChange('afficherVieAssociative', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
              />
              <label htmlFor="afficherVieAssociative" className="text-[11px] font-bold text-encre-noire cursor-pointer select-none">
                {t('vitrine.admin.content.presentationVieAccordion.sectionActive')}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">
                {t('vitrine.admin.content.presentationVieAccordion.titreQuotidien')}
              </label>
              <input
                type="text"
                value={vitrineTexts.titreVieAssociative || ''}
                onChange={(e) => handleTextChange('titreVieAssociative', e.target.value)}
                disabled={saving}
                placeholder={t('vitrine.admin.content.presentationVieAccordion.notreQuotidienVieAssociative')}
                className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">
                {t('vitrine.admin.content.presentationVieAccordion.badgeQuotidien')}
              </label>
              <input
                type="text"
                value={vitrineTexts.badgeVieAssociative || ''}
                onChange={(e) => handleTextChange('badgeVieAssociative', e.target.value)}
                disabled={saving}
                placeholder={t('vitrine.admin.content.presentationVieAccordion.vieDeLaTroupe')}
                className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">
              {t('vitrine.admin.content.presentationVieAccordion.descriptionDuQuotidienAteliersRepetitions')}
            </label>
            <RichTextEditor
              value={publicTheme.texteVieAssociative || ''}
              onChange={(val) => handleThemeChange('texteVieAssociative', val)}
              disabled={saving}
              placeholder={t('vitrine.admin.content.presentationVieAccordion.exRepetitionsDEnsembleLe')}
              minHeight="120px"
              showLists={true}
              showImage={false}
              showAlign={true}
            />
          </div>
        </div>
      </div>
    </CordelAccordion>
  );
}

