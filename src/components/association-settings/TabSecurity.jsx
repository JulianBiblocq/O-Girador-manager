import React from 'react';
import CordelCard from '../CordelCard';
import { XiloMegaphone } from '../XiloIcons';
import { formatTagGender, getTagId } from '../../utils/tagUtils';

export default function TabSecurity({
  formData,
  handleChange,
  saving,
  t
}) {
  const { permissionsMatrice = {}, tagsDisponibles = [] } = formData;

  const handleTogglePermission = (section, tagId, checked) => {
    const sectionTags = permissionsMatrice[section] || [];
    const updatedSection = checked
      ? [...sectionTags, tagId]
      : sectionTags.filter(t => t !== tagId);
    
    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [section]: updatedSection
    });
  };

  const renderTagCheckboxes = (section) => {
    return tagsDisponibles.map(tag => {
      const tagId = getTagId(tag);
      const isChecked = (permissionsMatrice[section] || []).includes(tagId) || (typeof tag === 'string' && (permissionsMatrice[section] || []).includes(tag));
      const formattedLabel = formatTagGender(tag, null, formData?.majoriteFeminine, tagsDisponibles);

      return (
        <label key={tagId} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold select-none hover:opacity-85">
          <input 
            type="checkbox"
            checked={isChecked}
            onChange={(e) => handleTogglePermission(section, tagId, e.target.checked)}
            disabled={saving}
            className="rounded cursor-pointer w-3.5 h-3.5"
          />
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[8.5px] py-0.5 normal-case tracking-normal">
            {formattedLabel}
          </span>
        </label>
      );
    });
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        🪢 Permissions & Accès (Matrice)
      </h3>
      <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed mb-3 text-left">
        Déléguez l'accès aux différentes sections administratives en cochant les étiquettes correspondantes.
      </p>

      {tagsDisponibles.length === 0 ? (
        <div className="text-[10px] italic text-red-700 bg-red-100/20 p-3 border border-dashed border-red-700/20 rounded text-left">
          ⚠️ Aucune étiquette/badge n'est configuré pour cette association. Veuillez d'abord créer des badges dans le Gestionnaire de Badges.
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-left">
          {/* Gestion de la Troupe */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">👥 Gestion de la Troupe</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Annuaire &amp; Export, Admin Système, Badges
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('troupe')}
            </div>
          </div>

          {/* Trésorerie */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">🪙 Trésorerie</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Gestion des Cotisations, Remboursements Kilométriques
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('tresorerie')}
            </div>
          </div>

          {/* Logistique */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">📦 Logistique</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Inventaire Matériel &amp; Commandes
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('logistique')}
            </div>
          </div>

          {/* Vestiaire */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">👗 Vestiaire &amp; Costumes</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Inventaire Costumes &amp; Suivi Couture
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('vestiaire')}
            </div>
          </div>

          {/* Studio Social */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">📢 Studio Social &amp; Varal</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Publications réseaux sociaux, Varal de Médias &amp; Compte-Rendus
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('studio')}
            </div>
          </div>

          {/* Mestre & Pédagogie */}
          <div className="flex flex-col gap-1.5 border border-dashed border-cordel-master-dark/15 p-3 rounded bg-white/40 dark:bg-black/10">
            <span className="text-[11px] font-extrabold text-encre-noire">🥁 Mestre &amp; Direction Artistique</span>
            <span className="text-[9px] text-cordel-master-dark/65 font-semibold -mt-0.5 mb-1.5 block">
              Donne accès à : Séquenceur, Plan de Scène, Salons Forum &amp; Ateliers
            </span>
            <div className="flex flex-wrap gap-2">
              {renderTagCheckboxes('mestre')}
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
