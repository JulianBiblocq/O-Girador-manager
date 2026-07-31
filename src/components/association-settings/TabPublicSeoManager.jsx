import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Sous-composant d'administration dédié au Référencement SEO Dynamique de la Vitrine.
 * Permet aux associations de configurer leur Titre Google, Méta-description et Mots-clés,
 * tout en rappelant la signature stratégique O Girador intégrée au code source.
 * 
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association.
 * @param {Function} props.handleChange - Callback de mise à jour des paramètres.
 * @param {boolean} props.saving - État de sauvegarde en cours.
 */
export default function TabPublicSeoManager({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};

  /**
   * Met à jour un champ SEO dans publicTheme.
   * 
   * @param {string} field - Clé ('seoTitle', 'seoDescription', 'seoKeywords')
   * @param {string} value - Valeur saisie par l'utilisateur
   */
  const handleSeoChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30 select-none">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
          <span>🔍 Référencement SEO Dynamique & Google (Stratégie Écosystème)</span>
        </h4>
        <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">
          Google & Moteurs de recherche
        </span>
      </div>

      <p className="text-xs text-stone-600 font-medium leading-relaxed">
        Définissez le titre et la description qui apparaîtront sur Google lors des recherches. 
        Pour renforcer la puissance du réseau, la signature de la plateforme <strong>O Girador</strong> est automatiquement liée au code source de votre vitrine.
      </p>

      <div className="flex flex-col gap-4">
        {/* Titre pour Google */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>🏷️ Titre pour Google (Balise Title)</span>
            <span className="text-[10px] text-stone-500 font-normal">Suffixe automatique : " | O Girador"</span>
          </label>
          <input
            type="text"
            value={publicTheme.seoTitle || ''}
            onChange={(e) => handleSeoChange('seoTitle', e.target.value)}
            disabled={saving}
            placeholder="Ex: Samambaia - Maracatu de Baque Virado à Paris"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
          />
        </div>

        {/* Description Google */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            📝 Description Google (Meta Description)
          </label>
          <textarea
            rows={3}
            value={publicTheme.seoDescription || ''}
            onChange={(e) => handleSeoChange('seoDescription', e.target.value)}
            disabled={saving}
            placeholder="Ex: Découvrez Samambaia, groupe de Maracatu de Baque Virado. Retrouvez nos dates de concert, nos ateliers de percussion, nos vidéos et notre dossier de presse."
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none resize-y"
          />
          <span className="text-[10px] text-stone-500 font-medium">
            💡 Conseil : Rédigez un résumé accrocheur de 140 à 160 caractères.
          </span>
        </div>

        {/* Mots-clés de l'association */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>🔑 Mots-clés de l'association (Meta Keywords)</span>
            <span className="text-[10px] text-stone-500 font-normal">Séparés par des virgules</span>
          </label>
          <input
            type="text"
            value={publicTheme.seoKeywords || ''}
            onChange={(e) => handleSeoChange('seoKeywords', e.target.value)}
            disabled={saving}
            placeholder="Ex: maracatu, percussions brésiliennes, batucada, spectacle de rue"
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white focus:border-cordel-vert outline-none"
          />
        </div>
      </div>

      {/* Note d'information stratégique */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px_6px_3px_5px] text-[11px] text-stone-600 flex items-center gap-2">
        <span className="text-base shrink-0">🌐</span>
        <span>
          Les balises Open Graph (partage réseaux sociaux Facebook, WhatsApp, LinkedIn) et la signature d'en-tête <strong>O Girador</strong> sont générées automatiquement.
        </span>
      </div>
    </CordelCard>
  );
}
