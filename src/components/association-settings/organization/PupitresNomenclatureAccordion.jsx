import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import InstrumentsCatalogBlock from '../blocks/InstrumentsCatalogBlock';
import {
  DEFAULT_MARACATU_NOMENCLATURE,
  PRESET_NOMENCLATURES,
  MARACATU_ROLES_LIST
} from '../../../constants/nomenclature';

/**
 * Accordéon d'administration pour la nomenclature des tambours, la gestion des pupitres
 * et les attributions de couleurs Cordel au sein du profil d'inscription.
 */
export default function PupitresNomenclatureAccordion({
  formData = {},
  handleChange,
  saving,
  t
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('nomenclature'); // 'nomenclature' | 'catalog'

  const maracatuNom = formData.nomenclature?.maracatu || formData.nomenclature || DEFAULT_MARACATU_NOMENCLATURE;
  const currentPresetId = formData.nomenclaturePreset || 'traditional_baque_virado';
  const currentPreset = PRESET_NOMENCLATURES.find(p => p.id === currentPresetId) || { label: 'Personnalisé' };

  // Nombre total d'instruments / pupitres configurés
  const instrumentsCount = Array.isArray(formData.instrumentsDisponibles) ? formData.instrumentsDisponibles.length : 0;
  const linkedCount = Array.isArray(formData.linkedInstruments) ? formData.linkedInstruments.length : 0;

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
      {/* Bandeau d'en-tête repliable */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🥁</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Pupitres, Tambours & Nomenclature ({currentPreset.label || currentPreset.name}) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            ({instrumentsCount} instrument{instrumentsCount > 1 ? 's' : ''}, {linkedCount} pupitre{linkedCount > 1 ? 's' : ''} lié{linkedCount > 1 ? 's' : ''})
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? 'Fermer' : 'Configurer'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-4 text-left animate-fade-in bg-white/40">
          
          {/* Sous-navigation par onglets internes */}
          <div className="flex gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <button
              type="button"
              onClick={() => setActiveSection('nomenclature')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === 'nomenclature'
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              🎵 Nomenclature & Voix (Marcante, Meião...)
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('catalog')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === 'catalog'
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              🎨 Pupitres, Couleurs & Instruments Liés
            </button>
          </div>

          {/* Section A : Nomenclature & Voix des Tambours */}
          {activeSection === 'nomenclature' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dashed border-stone-200">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood block">
                    Tradition & Préréglages Rapides
                  </span>
                  <p className="text-[9px] text-stone-500">
                    Sélectionnez un preset pour aligner les rôles ou personnalisez chaque nom de pupitre ci-dessous.
                  </p>
                </div>
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
                      {p.label || p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille de personnalisation des voix */}
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

          {/* Section B : Pupitres, Couleurs & Instruments Associés */}
          {activeSection === 'catalog' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <InstrumentsCatalogBlock
                formData={formData}
                handleChange={handleChange}
                saving={saving}
                t={t}
              />
            </div>
          )}

        </div>
      )}
    </CordelCard>
  );
}
