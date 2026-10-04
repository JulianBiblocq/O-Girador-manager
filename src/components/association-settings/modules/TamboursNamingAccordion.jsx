import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import {
  DEFAULT_MARACATU_NOMENCLATURE,
  PRESET_NOMENCLATURES,
  MARACATU_ROLES_LIST
} from '../../../constants/nomenclature';

/**
 * Accordéon compact pour la nomenclature des tambours et pupitres de la troupe.
 */
export default function TamboursNamingAccordion({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const maracatuNom = formData.nomenclature?.maracatu || formData.nomenclature || DEFAULT_MARACATU_NOMENCLATURE;
  const currentPresetId = formData.nomenclaturePreset || 'traditional_baque_virado';
  const currentPreset = PRESET_NOMENCLATURES.find(p => p.id === currentPresetId) || { label: t('settings.modules.tamboursNamingAccordion.personnalise') || 'Personnalisé' };

  const handleSelectPreset = (presetId) => {
    const preset = PRESET_NOMENCLATURES.find(p => p.id === presetId);
    if (!preset) return;
    const newNomenclature = { ...DEFAULT_MARACATU_NOMENCLATURE, ...preset.mapping };
    handleChange('nomenclaturePreset', presetId);
    handleChange('nomenclature.maracatu', newNomenclature);
  };

  const handleRoleChange = (roleKey, value) => {
    const updated = { ...maracatuNom, [roleKey]: value };
    handleChange(`nomenclature.maracatu.${roleKey}`, value);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête compact */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🥁</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {t('settings.modules.tamboursNamingAccordion.nomenclatureDesTamboursPupitres') || 'Nomenclature des Tambours & Pupitres ('}{currentPreset.label}) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            {t('settings.modules.tamboursNamingAccordion.alfaiasCaissesClochesVoix') || '(Alfaias, caisses, cloches, voix...)'}
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? (t('settings.modules.tamboursNamingAccordion.fermer') || 'Fermer') : (t('settings.modules.tamboursNamingAccordion.ajuster') || 'Ajuster')}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          {/* Sélection rapide du preset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dashed border-stone-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.modules.tamboursNamingAccordion.traditionPreselectionRapide') || 'Tradition & Présélection Rapide'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NOMENCLATURES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  disabled={saving}
                  className={`px-2.5 py-1 text-[9.5px] font-bold rounded cursor-pointer transition-all ${
                    currentPresetId === p.id
                      ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
                      : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille concise de renommage des pupitres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {MARACATU_ROLES_LIST.map((role) => {
              const currentValue = maracatuNom[role.key] || DEFAULT_MARACATU_NOMENCLATURE[role.key] || role.label;
              return (
                <div key={role.key} className="flex flex-col gap-0.5 p-2 bg-white rounded border border-stone-200">
                  <span className="text-[9px] font-bold text-stone-500 uppercase">{role.label}</span>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleRoleChange(role.key, e.target.value)}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 bg-stone-50 w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CordelCard>
  );
}
