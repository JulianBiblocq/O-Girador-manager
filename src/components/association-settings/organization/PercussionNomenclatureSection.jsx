import React from 'react';
import { useTranslation } from '../../LanguageContext';
import {
  DEFAULT_MARACATU_NOMENCLATURE,
  DEFAULT_MARACATU_NOMENCLATURE_ABBR,
  PRESET_NOMENCLATURES,
  MARACATU_ROLES_LIST,
  normalizeGroupNomenclature,
  normalizeGroupNomenclatureAbbr,
  formatRoleAbbr
} from '../../../constants/nomenclature';

/**
 * Section d'administration de la « Nomenclature des Percussions » (< 135 lignes).
 * Permet de basculer instantanément entre Baque Virado, Ketu et Universel,
 * et de personnaliser chaque nom de tambour et son code officiel de 2 lettres (Mc, Me, Rp...).
 */
export default function PercussionNomenclatureSection({
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

  const rawAbbr = formData?.nomenclatureAbbr?.maracatu || formData?.nomenclatureAbbr || {};
  const activeAbbr = {
    ...DEFAULT_MARACATU_NOMENCLATURE_ABBR,
    ...normalizeGroupNomenclatureAbbr(rawAbbr, 'maracatu')
  };

  const handleSelectPreset = (presetId) => {
    const preset = PRESET_NOMENCLATURES.find((p) => p.id === presetId);
    if (!preset) return;
    handleChange('nomenclaturePreset', presetId);
    handleChange('nomenclature.maracatu', {
      ...DEFAULT_MARACATU_NOMENCLATURE,
      ...preset.mapping
    });
    handleChange('nomenclatureAbbr.maracatu', {
      ...DEFAULT_MARACATU_NOMENCLATURE_ABBR,
      ...(preset.mappingAbbr || {})
    });
  };

  const handleRoleNameChange = (roleKey, newName, defaultAbbr) => {
    handleChange('nomenclaturePreset', 'custom');
    handleChange(`nomenclature.maracatu.${roleKey}`, newName);

    // Suggestion intelligente des 2 lettres si le code était resté par défaut
    const currentCode = activeAbbr[roleKey];
    if (!currentCode || currentCode === defaultAbbr) {
      const suggested = formatRoleAbbr(newName.slice(0, 2));
      if (suggested) handleChange(`nomenclatureAbbr.maracatu.${roleKey}`, suggested);
    }
  };

  const handleAbbrChange = (roleKey, value) => {
    handleChange('nomenclaturePreset', 'custom');
    handleChange(`nomenclatureAbbr.maracatu.${roleKey}`, formatRoleAbbr(value));
  };

  // Liste des 7 rôles fondamentaux de percussion
  const MAIN_ROLES = MARACATU_ROLES_LIST.slice(0, 7);

  return (
    <div className="flex flex-col gap-3.5 p-3.5 bg-white/70 rounded-[4px_6px_3px_5px] border border-encre-noire/20 text-left">
      {/* 1. Sélection des préconfigurations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-dashed border-stone-200">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🥁</span>
            <span>{t('settings.organization.pupitresNomenclatureAccordion.bateriaNomenclatureTitle') || "Nomenclature des Percussions"}</span>
          </span>
          <p className="text-[9px] text-stone-500 font-semibold">
            {t('settings.organization.pupitresNomenclatureAccordion.bateriaNomenclatureSubtitle') || "Choisissez un préréglage traditionnel ou personnalisez les voix et codes :"}
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

      {/* 2. Grille d'édition des percussions avec code 2 lettres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {MAIN_ROLES.map((role) => {
          const val = activeNomenclature[role.key] || role.defaultLabel;
          const code = activeAbbr[role.key] || role.defaultAbbr;
          return (
            <div key={role.key} className="flex flex-col gap-1 p-2 bg-cordel-bg-light/50 rounded border border-encre-noire/15">
              <div className="flex justify-between items-center text-[8.5px] text-stone-500 font-bold uppercase">
                <span>{role.category}</span>
                <span className="text-[8px] opacity-60">({role.defaultLabel} · {role.defaultAbbr})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleRoleNameChange(role.key, e.target.value, role.defaultAbbr)}
                  disabled={saving}
                  className="theme-input text-xs font-black py-1 px-2 bg-white flex-1 min-w-0"
                  placeholder={role.defaultLabel}
                />
                <input
                  type="text"
                  value={code}
                  maxLength={3}
                  onChange={(e) => handleAbbrChange(role.key, e.target.value)}
                  disabled={saving}
                  className="theme-input text-xs font-mono font-black py-1 px-1 bg-white w-12 text-center shrink-0"
                  placeholder={role.defaultAbbr}
                  title="Code officiel à 2 lettres (ex: Mc, Me, Rp)"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
