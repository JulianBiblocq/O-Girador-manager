import React, { useState, useEffect } from 'react';
import CordelCard from '../../CordelCard';
import InstrumentsCatalogBlock from '../blocks/InstrumentsCatalogBlock';
import {
  getUniverseNomenclaturePresets,
  getUniverseRolesList,
  getDefaultUniverseNomenclature,
  getUniverseAccordionTitle,
  getUniverseNomenclatureTabTitle,
  DEFAULT_BATUCADA_NOMENCLATURE,
  MARACATU_ROLES_LIST
} from '../../../constants/universeNomenclaturePresets';
import { useTranslation } from '../../LanguageContext';

/**
 * Accordéon d'administration multi-univers pour la nomenclature des percussions/tambours,
 * la gestion des pupitres et les attributions de couleurs Cordel.
 */
export default function PupitresNomenclatureAccordion({ formData = {}, associationData, handleChange, saving, t }) {
  const { t: tHook } = useTranslation();
  const tFunc = t || tHook;
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('nomenclature'); // 'nomenclature' | 'catalog'

  const currentUniverse = (associationData?.universeId || associationData?.universe || formData?.universeId || formData?.universe || 'maracatu').toLowerCase().trim();
  const presetsList = getUniverseNomenclaturePresets(currentUniverse);
  const defaultPresetId = currentUniverse === 'batucada' ? 'batucada_standard' : 'traditional_baque_virado';
  const currentPresetId = formData.nomenclaturePreset || defaultPresetId;
  const rolesList = getUniverseRolesList(currentUniverse, currentPresetId);
  const currentPreset = presetsList.find(p => p.id === currentPresetId) || { label: tFunc('settings.organization.pupitresNomenclatureAccordion.personnalise') || 'Personnalisé' };

  // Nomenclature active pour l'univers courant
  const activeNomenclature = formData.nomenclature?.[currentUniverse] || 
    (currentUniverse === 'maracatu' ? (formData.nomenclature?.maracatu || formData.nomenclature) : null) || 
    getDefaultUniverseNomenclature(currentUniverse);

  // Initialisation et liaison automatique pour Batucada si non configuré
  useEffect(() => {
    if (currentUniverse === 'batucada') {
      if (!formData.nomenclature?.batucada) {
        handleChange('nomenclature.batucada', DEFAULT_BATUCADA_NOMENCLATURE);
        if (!formData.nomenclaturePreset) handleChange('nomenclaturePreset', 'batucada_standard');
      }
      if (!Array.isArray(formData.linkedInstruments) || formData.linkedInstruments.length === 0) {
        handleChange('linkedInstruments', [{ name: 'Surdos', instruments: ['Surdo 1', 'Surdo 2', 'Surdo 3'] }]);
      }
    }
  }, [currentUniverse]);

  const instrumentsCount = Array.isArray(formData.instrumentsDisponibles) ? formData.instrumentsDisponibles.length : 0;
  const linkedCount = Array.isArray(formData.linkedInstruments) ? formData.linkedInstruments.length : 0;

  const handleSelectPreset = (presetId) => {
    const preset = presetsList.find(p => p.id === presetId);
    if (!preset) return;
    const defaultNom = getDefaultUniverseNomenclature(currentUniverse);
    handleChange('nomenclaturePreset', presetId);
    handleChange(`nomenclature.${currentUniverse}`, { ...defaultNom, ...preset.mapping });
  };

  const handleRoleChange = (roleKey, value) => {
    handleChange(`nomenclature.${currentUniverse}.${roleKey}`, value);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête repliable titré dynamiquement selon l'univers */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🥁</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {getUniverseAccordionTitle(currentUniverse, currentPreset.label || currentPreset.name)} {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            ({instrumentsCount} {tFunc('settings.organization.pupitresNomenclatureAccordion.instrument')}{instrumentsCount > 1 ? 's' : ''}, {linkedCount} {tFunc('settings.organization.pupitresNomenclatureAccordion.pupitre')}{linkedCount > 1 ? 's' : ''} {tFunc('settings.organization.pupitresNomenclatureAccordion.lie')}{linkedCount > 1 ? 's' : ''})
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? tFunc('settings.organization.pupitresNomenclatureAccordion.fermer') : tFunc('settings.organization.pupitresNomenclatureAccordion.configurer')}
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
                activeSection === 'nomenclature' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              {getUniverseNomenclatureTabTitle(currentUniverse)}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('catalog')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeSection === 'catalog' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              {tFunc('settings.organization.pupitresNomenclatureAccordion.pupitresCouleursInstrumentsLies')}
            </button>
          </div>

          {/* Section A : Nomenclature & Voix */}
          {activeSection === 'nomenclature' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dashed border-stone-200">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood block">
                    {tFunc('settings.organization.pupitresNomenclatureAccordion.traditionPrereglagesRapides')}
                  </span>
                  <p className="text-[9px] text-stone-500">
                    {tFunc('settings.organization.pupitresNomenclatureAccordion.selectionnezUnPresetPourAligner')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presetsList.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      disabled={saving}
                      className={`px-2.5 py-1 text-[9.5px] font-bold rounded cursor-pointer transition-all ${
                        currentPresetId === p.id ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {p.label || p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille dynamique des voix selon l'univers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {rolesList.map((role) => {
                  const defaultNom = getDefaultUniverseNomenclature(currentUniverse);
                  const currentValue = activeNomenclature[role.key] ?? 
                    (role.key === 'chant' ? (activeNomenclature['puxador'] ?? defaultNom['chant']) : null) ?? 
                    (role.key === 'puxador' ? (activeNomenclature['chant'] ?? defaultNom['puxador']) : null) ?? 
                    (role.key === 'cuica' ? (activeNomenclature['timba'] ?? defaultNom['cuica']) : null) ?? 
                    defaultNom[role.key] ?? role.defaultLabel ?? role.label;
                  return (
                    <div key={role.key} className="flex flex-col gap-0.5 p-2 bg-white rounded border border-stone-200">
                      <span className="text-[9px] font-bold text-stone-500 uppercase">{role.label || role.defaultLabel || role.key}</span>
                      <input
                        type="text"
                        value={currentValue || ''}
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
              <InstrumentsCatalogBlock formData={formData} handleChange={handleChange} saving={saving} t={t} />
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
