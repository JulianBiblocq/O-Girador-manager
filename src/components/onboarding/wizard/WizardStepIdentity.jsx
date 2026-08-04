import React from 'react';
import CordelCard from '../../CordelCard';

/**
 * Étape 1 du Wizard : Identité & Couleurs 🎨
 * Saisie du nom de l'association, upload du logo et choix de la palette de couleurs.
 */
export default function WizardStepIdentity({ wizardData, updateWizardData, logoFile, setLogoFile }) {
  const { nom = '', branding = {} } = wizardData;
  const colors = branding.colors || {
    primary: '#d99f4d',
    secondary: '#84967a',
    background: '#f4ecd8',
    text: '#1a1a1a'
  };

  // Palettes de couleurs prédéfinies thématiques Cordel & Maracatu
  const colorPresets = [
    {
      name: 'Cordel Traditionnel (Ocre & Vert)',
      primary: '#d99f4d',
      secondary: '#84967a',
      background: '#f4ecd8',
      text: '#1a1a1a'
    },
    {
      name: 'Terre Cuite & Soleil (Sertão)',
      primary: '#8b2a1a',
      secondary: '#c05621',
      background: '#fdfaf2',
      text: '#1a1a1a'
    },
    {
      name: 'Maracatu Ferveur (Rouge & Doré)',
      primary: '#9b2c2c',
      secondary: '#d69e2e',
      background: '#faf5ff',
      text: '#1a202c'
    },
    {
      name: 'Océan Recifense (Bleu & Émeraude)',
      primary: '#2b6cb0',
      secondary: '#276749',
      background: '#f0fff4',
      text: '#1a202c'
    }
  ];

  // Sélection d'un preset de couleurs
  const handleApplyPreset = (preset) => {
    updateWizardData('branding.colors', {
      primary: preset.primary,
      secondary: preset.secondary,
      background: preset.background,
      text: preset.text
    });
  };

  // Mise à jour d'une couleur spécifique
  const handleColorChange = (key, value) => {
    updateWizardData('branding.colors', {
      ...colors,
      [key]: value
    });
  };

  // Aperçu local de l'image importée
  const logoPreviewUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : (branding.logoUrl || '');

  return (
    <div className="flex flex-col gap-5 text-left animate-fade-in">
      <div className="border-b border-dashed border-stone-300 pb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>🎨</span>
          <span>Étape 1 : Identité visuelle & Couleurs du Groupe</span>
        </h3>
        <p className="text-xs text-stone-500 font-bold mt-1 leading-relaxed">
          Définissez le nom officiel de votre association, importez votre emblème et choisissez la palette de couleurs qui habillera votre espace.
        </p>
      </div>

      {/* 1. Nom de l'association */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800">
          Nom de l'association ou de la troupe *
        </label>
        <input
          type="text"
          required
          value={nom}
          onChange={(e) => updateWizardData('nom', e.target.value)}
          placeholder="Ex: Samambaia Maracatu, Estrela Brilhante..."
          className="text-xs px-3.5 py-2.5 border-2 border-stone-300 rounded-lg bg-white font-bold text-stone-900 focus:border-[var(--color-cordel-vert,#2d6a4f)] outline-none shadow-xs"
        />
      </div>

      {/* 2. Upload du Logo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800">
          Logo officiel de l'association
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 p-3.5 rounded-lg border-2 border-dashed border-stone-300">
          <div className="w-20 h-20 rounded-lg border border-stone-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
            {logoPreviewUrl ? (
              <img src={logoPreviewUrl} alt="Aperçu Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-2xl opacity-40">🥁</span>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1 text-center sm:text-left">
            <input
              type="file"
              accept="image/*"
              id="wizard-logo-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLogoFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label
              htmlFor="wizard-logo-input"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <span>📷 Choisir une image (PNG, JPG, SVG)</span>
            </label>
            <span className="text-[10px] text-stone-500 font-medium">
              Image carrée recommandée. Taille max conseillée : 2 Mo.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Choix des couleurs du thème */}
      <div className="flex flex-col gap-3 pt-2">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Palette de Couleurs & Thème Visuel</span>
          <span className="text-[10px] text-stone-500 font-normal">Personnalisable ultérieurement</span>
        </label>

        {/* Presets rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {colorPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-lg border border-stone-300 bg-white hover:border-stone-400 transition-all flex items-center justify-between text-left cursor-pointer group shadow-xs"
            >
              <span className="text-xs font-bold text-stone-800 group-hover:text-stone-900">
                {preset.name}
              </span>
              <div className="flex items-center gap-1 border border-stone-300 rounded p-1 bg-stone-50">
                <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.primary }}></span>
                <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.secondary }}></span>
                <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.background }}></span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Color Pickers */}
        <CordelCard variant="default" className="p-3 bg-stone-50 border border-stone-300 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase">Principale</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors.primary || '#d99f4d'}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-7 h-7 rounded border border-stone-300 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-stone-700">{colors.primary}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase">Secondaire</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors.secondary || '#84967a'}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-7 h-7 rounded border border-stone-300 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-stone-700">{colors.secondary}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase">Arrière-plan</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors.background || '#f4ecd8'}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-7 h-7 rounded border border-stone-300 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-stone-700">{colors.background}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-700 uppercase">Texte</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors.text || '#1a1a1a'}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="w-7 h-7 rounded border border-stone-300 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-stone-700">{colors.text}</span>
            </div>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
