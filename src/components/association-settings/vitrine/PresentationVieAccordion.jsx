import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import RichTextEditor from '../../RichTextEditor';

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
      title="Présentation & Vie Associative"
      subtitle="Textes Qui sommes-nous, quotidien du groupe et ateliers hebdomadaires"
      icon="📖"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="flex flex-col gap-4 text-left pt-1">
        {/* Titre de la section Présentation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>👋 Titre de la section Présentation</span>
          </label>
          <input
            type="text"
            value={vitrineTexts.titrePresentation || ''}
            onChange={(e) => handleTextChange('titrePresentation', e.target.value)}
            disabled={saving}
            placeholder="Qui sommes-nous ?"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Texte "Qui sommes-nous ?" */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Présentation "Qui sommes-nous ?"
          </label>
          <RichTextEditor
            value={publicTheme.publicDescription || publicTheme.aboutText || ''}
            onChange={(val) => handleThemeChange('publicDescription', val)}
            disabled={saving}
            placeholder="Présentez l'histoire de votre association, vos racines, vos maîtres et votre énergie..."
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
              🌿 Notre Quotidien & Organisation
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
                Section Active
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Titre Quotidien</label>
              <input
                type="text"
                value={vitrineTexts.titreVieAssociative || ''}
                onChange={(e) => handleTextChange('titreVieAssociative', e.target.value)}
                disabled={saving}
                placeholder="Notre Quotidien / Vie Associative"
                className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Badge Quotidien</label>
              <input
                type="text"
                value={vitrineTexts.badgeVieAssociative || ''}
                onChange={(e) => handleTextChange('badgeVieAssociative', e.target.value)}
                disabled={saving}
                placeholder="Vie de la Troupe"
                className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">
              Description du Quotidien (Ateliers, Répétitions)
            </label>
            <RichTextEditor
              value={publicTheme.texteVieAssociative || ''}
              onChange={(val) => handleThemeChange('texteVieAssociative', val)}
              disabled={saving}
              placeholder="Ex: Répétitions d'ensemble le jeudi soir, ateliers lutherie le lundi..."
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
