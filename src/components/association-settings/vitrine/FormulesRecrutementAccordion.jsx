import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import FormulesManager from '../FormulesManager';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Accordéon 3 : Formules & Recrutement
 * Gère la campagne de recrutement, les formules d'adhésion (Danse/Percu), tarifs et le bouton HelloAsso.
 */
export default function FormulesRecrutementAccordion({
  formData = {},
  handleChange,
  saving,
  defaultOpen = false
}) {
  const { t } = useTranslation();
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || {};

  const handleThemeChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

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

  const formulesList = Array.isArray(publicTheme.formulesRecrutement) ? publicTheme.formulesRecrutement : [];

  return (
    <CordelAccordion
      title={t('vitrine.admin.recruitment.formulesRecrutementAccordion.formulesRecrutement')}
      subtitle={t('vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree', {
        param: formulesList.length,
        count: formulesList.length,
        s: formulesList.length > 1 ? 's' : ''
      })}
      icon="🤝"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="flex flex-col gap-4 text-left pt-1">
        {/* Interrupteurs principaux */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2.5 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
            <input
              type="checkbox"
              id="afficherRecrutement"
              checked={publicTheme.afficherRecrutement !== false}
              onChange={(e) => handleThemeChange('afficherRecrutement', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
            />
            <label htmlFor="afficherRecrutement" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer select-none">
              {t('vitrine.admin.recruitment.formulesRecrutementAccordion.afficherLaSectionRecrutement')}
            </label>
          </div>

          <div className="flex-1 flex items-center gap-2.5 p-3 bg-emerald-50/80 border border-emerald-300 rounded-[4px_6px_3px_5px]">
            <input
              type="checkbox"
              id="activerHelloAssoRecrutement"
              checked={publicTheme.activerHelloAssoRecrutement !== false}
              onChange={(e) => handleThemeChange('activerHelloAssoRecrutement', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
            />
            <label htmlFor="activerHelloAssoRecrutement" className="text-xs font-bold uppercase tracking-wider text-emerald-950 cursor-pointer select-none">
              {t('vitrine.admin.recruitment.formulesRecrutementAccordion.activerLesBoutonsHelloasso')}
            </label>
          </div>
        </div>

        {/* Titres & Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">
              {t('vitrine.admin.recruitment.formulesRecrutementAccordion.titreRecrutement')}
            </label>
            <input
              type="text"
              value={vitrineTexts.titreRecrutement || publicTheme.titreRecrutement || ''}
              onChange={(e) => {
                handleThemeChange('titreRecrutement', e.target.value);
                handleTextChange('titreRecrutement', e.target.value);
              }}
              disabled={saving}
              placeholder={t('vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezLaTroupe')}
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">
              {t('vitrine.admin.recruitment.formulesRecrutementAccordion.badgeSurTitre')}
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeRecrutement || ''}
              onChange={(e) => handleTextChange('badgeRecrutement', e.target.value)}
              disabled={saving}
              placeholder={t('vitrine.admin.recruitment.formulesRecrutementAccordion.nousRejoindre')}
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>
        </div>

        {/* Phrase d'accroche / Explication */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-stone-700">
            {t('vitrine.admin.recruitment.formulesRecrutementAccordion.descriptionDeLInvitationA')}
          </label>
          <textarea
            rows={2}
            value={vitrineTexts.accrocheRecrutement || publicTheme.texteRecrutement || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleTextChange('accrocheRecrutement', val);
              handleThemeChange('texteRecrutement', val);
            }}
            disabled={saving}
            placeholder={t('vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezNosAteliersHebdomadairesEt')}
            className="text-xs font-medium px-2.5 py-1.5 border border-stone-300 rounded bg-white resize-none"
          />
        </div>

        {/* FormulesManager (Danse, Percu, etc.) */}
        <div className="pt-2 border-t border-dashed border-cordel-master-dark/20">
          <FormulesManager
            formules={publicTheme.formulesRecrutement}
            onChangeFormules={(updatedList) => handleThemeChange('formulesRecrutement', updatedList)}
            saving={saving}
          />
        </div>
      </div>
    </CordelAccordion>
  );
}

