import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import FormulesManager from '../FormulesManager';

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
      title="Formules & Recrutement"
      subtitle={`Formules Danse/Percu (${formulesList.length} configurée${formulesList.length > 1 ? 's' : ''}), tarifs et adhésions HelloAsso`}
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
              Afficher la section Recrutement
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
              Activer les boutons HelloAsso
            </label>
          </div>
        </div>

        {/* Titres & Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Titre Recrutement</label>
            <input
              type="text"
              value={vitrineTexts.titreRecrutement || publicTheme.titreRecrutement || ''}
              onChange={(e) => {
                handleThemeChange('titreRecrutement', e.target.value);
                handleTextChange('titreRecrutement', e.target.value);
              }}
              disabled={saving}
              placeholder="Rejoignez la troupe !"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Badge / Sur-titre</label>
            <input
              type="text"
              value={vitrineTexts.badgeRecrutement || ''}
              onChange={(e) => handleTextChange('badgeRecrutement', e.target.value)}
              disabled={saving}
              placeholder="Nous Rejoindre"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>
        </div>

        {/* Phrase d'accroche / Explication */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-stone-700">
            Description de l'invitation à rejoindre
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
            placeholder="Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale unique."
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
