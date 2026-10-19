import React from 'react';
import { useTranslation } from '../../LanguageContext';
import {
  DEFAULT_MARACATU_NOMENCLATURE,
  PRESET_NOMENCLATURES,
  normalizeGroupNomenclature
} from '../../../constants/nomenclature';

/**
 * Section d'administration épurée de la « Nomenclature de la Bateria » (< 130 lignes).
 * Permet de basculer instantanément entre Baque Virado, Ketu et Universel,
 * tout en personnalisant librement chaque voix d'Alfaia, Caixa et percussions.
 * Rétrocompatibilité 100 % avec les plans de scène existants.
 */
export default function BateriaNomenclatureSection({
  formData = {},
  handleChange,
  saving = false
}) {
  const { t } = useTranslation();

  const currentPresetId = formData?.nomenclaturePreset || 'traditional_baque_virado';
  const rawNomenclature = formData?.nomenclature?.maracatu || formData?.nomenclature || {};
  const activeNomenclature = {
    ...DEFAULT_MARACATU_NOMENCLATURE,
    ...normalizeGroupNomenclature(rawNomenclature, 'maracatu')
  };

  const handleSelectPreset = (presetId) => {
    const preset = PRESET_NOMENCLATURES.find((p) => p.id === presetId);
    if (!preset) return;
    handleChange('nomenclaturePreset', presetId);
    handleChange('nomenclature.maracatu', {
      ...DEFAULT_MARACATU_NOMENCLATURE,
      ...preset.mapping
    });
  };

  const handleRoleChange = (roleKey, value) => {
    handleChange('nomenclaturePreset', 'custom');
    handleChange(`nomenclature.maracatu.${roleKey}`, value);
  };

  // Liste des rôles fondamentaux de la Bateria
  const MAIN_ROLES = [
    { key: 'alfaia_grave', defaultLabel: 'Marcante', category: 'Fût Grave' },
    { key: 'alfaia_medio', defaultLabel: 'Meião', category: 'Fût Médium' },
    { key: 'alfaia_agudo', defaultLabel: 'Repique', category: 'Fût Aigu' },
    { key: 'caixa_baixo', defaultLabel: 'Caixa', category: 'Caisse Claire' },
    { key: 'caixa_alto', defaultLabel: 'Tarol', category: 'Caisse Haute' },
    { key: 'gongue', defaultLabel: 'Gonguê', category: 'Cloche Métal' },
    { key: 'agbe', defaultLabel: 'Agbê', category: 'Secoué' }
  ];

  return (
    <div className="flex flex-col gap-3.5 p-3.5 bg-white/70 rounded-[4px_6px_3px_5px] border border-encre-noire/20 text-left">
      {/* 1. Sélection des préconfigurations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-dashed border-stone-200">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🥁</span>
            <span>{t('settings.organization.pupitresNomenclatureAccordion.bateriaNomenclatureTitle') || "Nomenclature de la Bateria"}</span>
          </span>
          <p className="text-[9px] text-stone-500 font-semibold">
            {t('settings.organization.pupitresNomenclatureAccordion.bateriaNomenclatureSubtitle') || "Choisissez un préréglage traditionnel ou personnalisez les voix :"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_NOMENCLATURES.map((p) => {
            const isSelected = currentPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                disabled={saving}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
                title={p.description}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Grille d'édition des pupitres et voix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {MAIN_ROLES.map((role) => {
          const val = activeNomenclature[role.key] || role.defaultLabel;
          return (
            <div key={role.key} className="flex flex-col gap-0.5 p-2 bg-cordel-bg-light/50 rounded border border-encre-noire/15">
              <div className="flex justify-between items-center text-[8.5px] text-stone-500 font-bold uppercase">
                <span>{role.category}</span>
                <span className="text-[8px] opacity-60">({role.defaultLabel})</span>
              </div>
              <input
                type="text"
                value={val}
                onChange={(e) => handleRoleChange(role.key, e.target.value)}
                disabled={saving}
                className="theme-input text-xs font-black py-1 bg-white"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
