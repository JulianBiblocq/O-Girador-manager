import React from 'react';
import CordelCard from '../CordelCard';
import TabPublicVisibilityManager from './TabPublicVisibilityManager';
import { DEFAULT_VITRINE_TEXTS } from '../../hooks/useAssociationSettings';

/**
 * Sous-composant d'administration dédié à la personnalisation des textes,
 * badges et titres des sections de la vitrine publique (Marque Blanche / SaaS).
 * 
 * Permet d'éditer les titres et phrases d'accroche de chaque section
 * avec des valeurs par défaut (fallback) pré-remplies en placeholders pour guider l'utilisateur.
 * 
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association.
 * @param {Function} props.handleChange - Fonction de mise à jour de l'état du formulaire.
 * @param {boolean} props.saving - État de sauvegarde en cours.
 */
export default function TabPublicSectionTexts({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || DEFAULT_VITRINE_TEXTS;

  /**
   * Met à jour une clé spécifique dans l'objet publicTheme.vitrineTexts.
   * 
   * @param {string} fieldKey - Clé du texte (ex: 'titrePresentation', 'accrocheGalerie')
   * @param {string} value - Nouvelle valeur saisie par l'administrateur
   */
  const handleTextChange = (fieldKey, value) => {
    const updatedTexts = {
      ...DEFAULT_VITRINE_TEXTS,
      ...(publicTheme.vitrineTexts || {}),
      [fieldKey]: value
    };

    const updatedTheme = {
      ...publicTheme,
      vitrineTexts: updatedTexts
    };

    handleChange('publicTheme', updatedTheme);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Sélecteur de Visibilité des Sections Vitrine (Interrupteurs On / Off) */}
      <TabPublicVisibilityManager
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />

      {/* En-tête explicatif */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>✏️ Titres & Accroches des Sections Vitrine (Marque Blanche)</span>
          </h4>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
            Personnalisation SaaS
          </span>
        </div>
        <p className="text-xs text-stone-600 font-medium leading-relaxed">
          Personnalisez les titres et phrases d'accroche de chaque section de la vitrine publique. 
          Les textes par défaut sont affichés en filigrane (placeholders). Si un champ est laissé vide, 
          le texte par défaut sera automatiquement utilisé.
        </p>
      </CordelCard>

      {/* Grille des sections d'édition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Section Présentation ("Qui sommes-nous ?") */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>👋 Section Présentation</span>
          </h4>

          {/* Titre Présentation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre de la section Présentation
            </label>
            <input
              type="text"
              value={vitrineTexts.titrePresentation || ''}
              onChange={(e) => handleTextChange('titrePresentation', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titrePresentation}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Présentation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Phrase d'accroche (Hero / Haut de page)
            </label>
            <textarea
              rows={3}
              value={vitrineTexts.accrochePresentation || ''}
              onChange={(e) => handleTextChange('accrochePresentation', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrochePresentation}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

        {/* 2. Section Galerie Photos */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>📸 Section Galerie Photos</span>
          </h4>

          {/* Badge Galerie */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Sur-titre / Badge Galerie
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeGalerie || ''}
              onChange={(e) => handleTextChange('badgeGalerie', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.badgeGalerie}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Titre Galerie */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre principal Galerie
            </label>
            <input
              type="text"
              value={vitrineTexts.titreGalerie || ''}
              onChange={(e) => handleTextChange('titreGalerie', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreGalerie}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Galerie */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Description / Accroche Galerie
            </label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheGalerie || ''}
              onChange={(e) => handleTextChange('accrocheGalerie', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrocheGalerie}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

        {/* 3. Section Agenda Public */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>📅 Section Agenda & Concerts</span>
          </h4>

          {/* Titre Agenda */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre de la section Agenda
            </label>
            <input
              type="text"
              value={vitrineTexts.titreAgenda || ''}
              onChange={(e) => handleTextChange('titreAgenda', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreAgenda}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Agenda */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Sous-titre / Accroche Agenda
            </label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheAgenda || ''}
              onChange={(e) => handleTextChange('accrocheAgenda', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrocheAgenda}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

        {/* 4. Section Organisateur / Nous Programmer */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>🎪 Section Espace Organisateur</span>
          </h4>

          {/* Badge Organisateur */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Badge / Sur-titre Espace Organisateur
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeProgrammer || ''}
              onChange={(e) => handleTextChange('badgeProgrammer', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.badgeProgrammer}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Titre Organisateur */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre "Nous Programmer"
            </label>
            <input
              type="text"
              value={vitrineTexts.titreProgrammer || ''}
              onChange={(e) => handleTextChange('titreProgrammer', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreProgrammer}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Organisateur */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Sous-titre / Explication Organisateur
            </label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheProgrammer || ''}
              onChange={(e) => handleTextChange('accrocheProgrammer', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrocheProgrammer}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

        {/* 5. Section Vie Associative ("Notre Quotidien") */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>🌿 Section Vie Associative</span>
          </h4>

          {/* Badge Vie Associative */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Badge / Sur-titre Vie Associative
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeVieAssociative || ''}
              onChange={(e) => handleTextChange('badgeVieAssociative', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.badgeVieAssociative}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Titre Vie Associative */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre principal Vie Associative
            </label>
            <input
              type="text"
              value={vitrineTexts.titreVieAssociative || ''}
              onChange={(e) => handleTextChange('titreVieAssociative', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreVieAssociative}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>
        </CordelCard>

        {/* 6. Section Recrutement */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>📣 Section Recrutement & Adhésion</span>
          </h4>

          {/* Badge Recrutement */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Badge / Sur-titre Recrutement
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeRecrutement || ''}
              onChange={(e) => handleTextChange('badgeRecrutement', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.badgeRecrutement}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Titre Recrutement */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre principal Recrutement
            </label>
            <input
              type="text"
              value={vitrineTexts.titreRecrutement || ''}
              onChange={(e) => handleTextChange('titreRecrutement', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreRecrutement}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>
        </CordelCard>

        {/* 7. Section Espace Pro Documents */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>📂 Section Documents Espace Pro</span>
          </h4>

          {/* Titre Pro Docs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre de l'Espace Pro
            </label>
            <input
              type="text"
              value={vitrineTexts.titreProDocs || ''}
              onChange={(e) => handleTextChange('titreProDocs', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreProDocs}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Pro Docs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Description Espace Pro
            </label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheProDocs || ''}
              onChange={(e) => handleTextChange('accrocheProDocs', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrocheProDocs}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

        {/* 8. Section Newsletter */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-1.5">
            <span>📬 Section Newsletter & Infolettre</span>
          </h4>

          {/* Badge Newsletter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Badge / Sur-titre Newsletter
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeNewsletter || ''}
              onChange={(e) => handleTextChange('badgeNewsletter', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.badgeNewsletter}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Titre Newsletter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Titre principal Newsletter
            </label>
            <input
              type="text"
              value={vitrineTexts.titreNewsletter || ''}
              onChange={(e) => handleTextChange('titreNewsletter', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.titreNewsletter}
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
            />
          </div>

          {/* Accroche Newsletter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
              Accroche / Description Newsletter
            </label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheNewsletter || ''}
              onChange={(e) => handleTextChange('accrocheNewsletter', e.target.value)}
              disabled={saving}
              placeholder={DEFAULT_VITRINE_TEXTS.accrocheNewsletter}
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
            />
          </div>
        </CordelCard>

      </div>
    </div>
  );
}
