import React from 'react';
import CordelCard from '../CordelCard';
import RichTextEditor from '../RichTextEditor';
import FormulesManager from './FormulesManager';

/**
 * Composant d'administration dédié à la configuration de la Vie Associative et du Recrutement
 * sur le site vitrine public (Vie Associative, Cartes de Formules, Message d'invitation et Liens CTA).
 *
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association
 * @param {Function} props.handleChange - Handler de mise à jour des champs
 * @param {boolean} props.saving - État de sauvegarde
 */
export default function TabPublicRecruitment({ formData, handleChange, saving, groupId }) {
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || {};

  // Mise à jour locale des champs du thème public
  const handleThemeChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  // Mise à jour spécifique de vitrineTexts
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

  return (
    <div className="flex flex-col gap-6 select-none">
      
      {/* SECTION 1 : Vie Associative & Organisation (Notre Quotidien) */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
          <span>🌿 Vie Associative & Organisation (Notre Quotidien)</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            publicTheme.afficherVieAssociative !== false 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
              : 'bg-stone-100 text-stone-600 border-stone-300'
          }`}>
            {publicTheme.afficherVieAssociative !== false ? '✓ Section Active' : '⚪ Section Masquée'}
          </span>
        </h4>

        {/* Interrupteur Bascule d'activation de la section Vie Associative */}
        <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <input
            type="checkbox"
            id="afficherVieAssociative"
            checked={publicTheme.afficherVieAssociative !== false}
            onChange={(e) => handleThemeChange('afficherVieAssociative', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
          />
          <label htmlFor="afficherVieAssociative" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
            <span>Afficher la section Vie Associative & Organisation sur le site public</span>
          </label>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Décrivez ici le fonctionnement hebdomadaire et le quotidien de votre association (ex: Ateliers de fabrication d'instruments le lundi, Répétition tuteurée le jeudi, chant polyphonique, ateliers de danse...). Ce texte apparaîtra de manière aérée et accueillante sur la page d'accueil.
        </p>

        {/* Titres & Badge Vie Associative */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Titre principal Vie Associative
            </label>
            <input
              type="text"
              value={vitrineTexts.titreVieAssociative || ''}
              onChange={(e) => handleTextChange('titreVieAssociative', e.target.value)}
              disabled={saving}
              placeholder="Notre Quotidien / Vie Associative"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Sur-titre / Badge Vie Associative
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeVieAssociative || ''}
              onChange={(e) => handleTextChange('badgeVieAssociative', e.target.value)}
              disabled={saving}
              placeholder="Notre Quotidien"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            📝 Description de la Vie Associative (WYSIWYG)
          </label>
          <RichTextEditor
            value={publicTheme.texteVieAssociative || ''}
            onChange={(val) => handleThemeChange('texteVieAssociative', val)}
            disabled={saving}
            placeholder="Ex: Notre groupe se réunit tous les jeudis soir pour les répétitions d'ensemble. Le lundi est consacré aux ateliers de confection et d'entretien des instruments (alfaias, agbês)..."
            minHeight="150px"
            showLists={true}
            showImage={false}
            showAlign={true}
          />
        </div>
      </CordelCard>

      {/* SECTION 2 : Formules & Campagne de Recrutement */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
          <span>📣 Formules d'Adhésion & Recrutement</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            publicTheme.afficherRecrutement !== false 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
              : 'bg-stone-100 text-stone-600 border-stone-300'
          }`}>
            {publicTheme.afficherRecrutement !== false ? '✓ Section Active' : '⚪ Section Masquée'}
          </span>
        </h4>

        {/* Interrupteur Bascule (Basculer) d'activation de la section recrutement */}
        <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <input
            type="checkbox"
            id="afficherRecrutement"
            checked={publicTheme.afficherRecrutement !== false}
            onChange={(e) => handleThemeChange('afficherRecrutement', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
          />
          <label htmlFor="afficherRecrutement" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
            <span>Afficher la section recrutement & formules sur le site public</span>
          </label>
        </div>

        {/* Interrupteur Global d'activation HelloAsso */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-300 rounded-[4px_6px_3px_5px]">
          <input
            type="checkbox"
            id="activerHelloAssoRecrutement"
            checked={publicTheme.activerHelloAssoRecrutement !== false}
            onChange={(e) => handleThemeChange('activerHelloAssoRecrutement', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
          />
          <div className="flex flex-col text-left">
            <label htmlFor="activerHelloAssoRecrutement" className="text-xs font-bold uppercase tracking-wider text-emerald-950 cursor-pointer flex items-center gap-1.5">
              <span>💳 Activer le bouton d'inscription HelloAsso dans la section Recrutement</span>
            </label>
            <span className="text-[10px] text-emerald-800 font-medium">
              Si décoché, tous les boutons et liens de redirection externe vers HelloAsso seront masqués sur la vitrine publique.
            </span>
          </div>
        </div>

        {/* Formulaire conditionnel d'édition (visible si le basculer est activé) */}
        {publicTheme.afficherRecrutement !== false && (
          <div className="flex flex-col gap-6 pt-2 border-t border-dashed border-cordel-master-dark/20 animate-fade-in">
            
            {/* Titre & Badge du recrutement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                  Titre de la section recrutement
                </label>
                <input
                  type="text"
                  value={vitrineTexts.titreRecrutement || publicTheme.titreRecrutement || ''}
                  onChange={(e) => {
                    handleThemeChange('titreRecrutement', e.target.value);
                    handleTextChange('titreRecrutement', e.target.value);
                  }}
                  disabled={saving}
                  placeholder="Rejoignez la troupe !"
                  className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                  Sur-titre / Badge Recrutement
                </label>
                <input
                  type="text"
                  value={vitrineTexts.badgeRecrutement || ''}
                  onChange={(e) => handleTextChange('badgeRecrutement', e.target.value)}
                  disabled={saving}
                  placeholder="Nous Rejoindre"
                  className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Message d'invitation / Description de la section recrutement & formules */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                💬 Description / Phrase sous le titre "Nos formules / Rejoignez la troupe"
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
                placeholder="Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale humaine unique."
                className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none mb-1"
              />
              <span className="text-[10px] text-stone-500 font-medium">Contenu enrichi optionnel :</span>
              <RichTextEditor
                value={publicTheme.texteRecrutement || ''}
                onChange={(val) => {
                  handleThemeChange('texteRecrutement', val);
                  handleTextChange('accrocheRecrutement', val);
                }}
                disabled={saving}
                placeholder="Ex: Nous recherchons de nouveaux membres pour la saison ! Que vous soyez débutant ou percussionniste expérimenté, rejoignez nos ateliers..."
                minHeight="120px"
                showLists={true}
                showImage={false}
                showAlign={true}
              />
            </div>

            {/* Gestionnaire dynamique des Cartes de Formules d'Adhésion (Danse, Percu, etc.) */}
            <FormulesManager
              formules={publicTheme.formulesRecrutement}
              onChangeFormules={(updatedList) => handleThemeChange('formulesRecrutement', updatedList)}
              saving={saving}
              groupId={groupId}
            />

            {/* Grille 2 colonnes : Lien & Libellé du bouton + Basculer Icône */}
            <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* URL du lien (ex: HelloAsso, mailto...) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                    🔗 Lien d'adhésion / d'inscription (ex: HelloAsso, mailto...)
                  </label>
                  <input
                    type="text"
                    value={publicTheme.lienRecrutement || ''}
                    onChange={(e) => handleThemeChange('lienRecrutement', e.target.value)}
                    disabled={saving}
                    placeholder="https://www.helloasso.com/... ou mailto:contact@asso.com"
                    className="text-xs font-mono px-3 py-2 border border-encre-noire/30 rounded bg-white"
                  />
                </div>

                {/* Texte du bouton CTA */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                    🔘 Libellé du bouton d'action principal
                  </label>
                  <input
                    type="text"
                    value={publicTheme.texteBoutonRecrutement || ''}
                    onChange={(e) => handleThemeChange('texteBoutonRecrutement', e.target.value)}
                    disabled={saving}
                    placeholder="Ex: Rejoindre l'association, S'inscrire sur HelloAsso"
                    className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
                  />
                </div>
              </div>

              {/* Interrupteur Basculer Icône du bouton de recrutement */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showRecrutementCtaIcon"
                  checked={publicTheme.showRecrutementCtaIcon !== false}
                  onChange={(e) => handleThemeChange('showRecrutementCtaIcon', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
                />
                <label htmlFor="showRecrutementCtaIcon" className="text-xs font-bold text-stone-800 cursor-pointer select-none">
                  Afficher l'icône de redirection sur ce bouton
                </label>
              </div>
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
