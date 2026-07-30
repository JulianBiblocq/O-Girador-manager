import React from 'react';
import CordelCard from '../CordelCard';
import RichTextEditor from '../RichTextEditor';

/**
 * Composant d'administration dédié à la configuration de la section Recrutement
 * du site vitrine public (Toggle d'activation, Titre, Message, URL du lien et Libellé du bouton).
 */
export default function TabPublicRecruitment({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};

  // Mise à jour locale des champs du thème public
  const handleThemeChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
      <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
        <span>📣 Section Recrutement (Vitrine Publique)</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          publicTheme.afficherRecrutement 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
            : 'bg-stone-100 text-stone-600 border-stone-300'
        }`}>
          {publicTheme.afficherRecrutement ? '✓ Active sur le site' : '⚪ Masquée'}
        </span>
      </h4>

      {/* Interrupteur Bascule (Toggle) d'activation de la section recrutement */}
      <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
        <input
          type="checkbox"
          id="afficherRecrutement"
          checked={publicTheme.afficherRecrutement || false}
          onChange={(e) => handleThemeChange('afficherRecrutement', e.target.checked)}
          disabled={saving}
          className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
        />
        <label htmlFor="afficherRecrutement" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
          <span>Afficher la section recrutement sur le site public</span>
        </label>
      </div>

      {/* Formulaire conditionnel d'édition (visible si le toggle est activé) */}
      {publicTheme.afficherRecrutement && (
        <div className="flex flex-col gap-4 pt-2 border-t border-dashed border-cordel-master-dark/20 animate-fade-in">
          {/* Titre du recrutement */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
              <span>🏷️ Titre de la section recrutement</span>
              <span className="text-[10px] text-stone-500 font-normal">Ex: Rejoignez la troupe !</span>
            </label>
            <input
              type="text"
              value={publicTheme.titreRecrutement || ''}
              onChange={(e) => handleThemeChange('titreRecrutement', e.target.value)}
              disabled={saving}
              placeholder="Rejoignez la troupe !"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>

          {/* Message d'invitation (RichTextEditor) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              💬 Message d'invitation / Texte de recrutement
            </label>
            <RichTextEditor
              value={publicTheme.texteRecrutement || ''}
              onChange={(val) => handleThemeChange('texteRecrutement', val)}
              disabled={saving}
              placeholder="Ex: Nous recherchons de nouveaux membres pour la saison ! Que vous soyez débutant ou percussionniste expérimenté, rejoignez nos ateliers..."
              minHeight="140px"
              showLists={true}
              showImage={false}
              showAlign={true}
            />
          </div>

          {/* Grille 2 colonnes : Lien & Libellé du bouton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* URL du lien (ex: HelloAsso) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                🔗 Lien d'adhésion / d'inscription (ex: HelloAsso)
              </label>
              <input
                type="url"
                value={publicTheme.lienRecrutement || ''}
                onChange={(e) => handleThemeChange('lienRecrutement', e.target.value)}
                disabled={saving}
                placeholder="https://www.helloasso.com/associations/..."
                className="text-xs font-mono px-3 py-2 border border-encre-noire/30 rounded bg-white"
              />
            </div>

            {/* Texte du bouton CTA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                🔘 Libellé du bouton d'action (Call to Action)
              </label>
              <input
                type="text"
                value={publicTheme.texteBoutonRecrutement || ''}
                onChange={(e) => handleThemeChange('texteBoutonRecrutement', e.target.value)}
                disabled={saving}
                placeholder="S'inscrire sur HelloAsso"
                className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
