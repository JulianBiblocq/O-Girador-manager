import React from 'react';
import CordelCard from '../CordelCard';
import { XiloSparkles, XiloPalette } from '../XiloIcons';

// Liste des polices sélectionnées pour le site vitrine (incluant Cactus, la typo locale Cordel)
export const GOOGLE_FONTS_OPTIONS = [
  { name: 'Cactus', category: 'display', label: 'Cactus (Typo Cordel Officielle)' },
  { name: 'Roboto', category: 'sans-serif', label: 'Roboto (Moderne & Polyvalente)' },
  { name: 'Montserrat', category: 'sans-serif', label: 'Montserrat (Géométrique & Épurée)' },
  { name: 'Open Sans', category: 'sans-serif', label: 'Open Sans (Excellente lisibilité)' },
  { name: 'Oswald', category: 'sans-serif', label: 'Oswald (Titres condensés à fort impact)' },
  { name: 'Playfair Display', category: 'serif', label: 'Playfair Display (Serif Élégante)' },
  { name: 'Lato', category: 'sans-serif', label: 'Lato (Chaleureuse & Équilibrée)' },
  { name: 'Poppins', category: 'sans-serif', label: 'Poppins (Arrondie & Tendance)' },
  { name: 'Cinzel', category: 'serif', label: 'Cinzel (Classique & Prestigieuse)' },
  { name: 'Rye', category: 'display', label: 'Rye (Cordel / Gravure Bois)' },
  { name: 'Sancreek', category: 'display', label: 'Sancreek (Cordel / Typo Rétro)' }
];

/**
 * Composant d'administration dédié à la personnalisation visuelle (Apparence, 6 couleurs et typographies)
 * du site vitrine public.
 */
export default function TabPublicTheme({ formData, handleChange, saving, t }) {
  const publicTheme = formData.publicTheme || {
    primaryColor: '#D32F2F',
    secondaryColor: '#1976D2',
    backgroundColor: '#FAF8F5',
    textColor: '#1C1917',
    buttonBgColor: '#D32F2F',
    buttonTextColor: '#FFFFFF',
    headingFont: 'Oswald',
    bodyFont: 'Roboto'
  };

  const handleThemeChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* En-tête de la section */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-cordel-bg">
        <div className="flex items-center gap-2 mb-2">
          <XiloPalette size={20} className="text-cordel-wood" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood">
            🎨 Apparence Visuelle & Charte Graphique
          </h3>
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          Personnalisez finement la palette visuelle (6 couleurs sémantiques) et la typographie de votre vitrine publique.
        </p>
      </CordelCard>

      {/* Grille : Couleurs & Typographies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Palette des 6 Couleurs Sémantiques */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
            🎨 Palette des 6 Couleurs Vitrine
          </h4>

          {/* 1. Couleur Primaire */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              1. Couleur Primaire (Titres, marqueurs)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.primaryColor || '#D32F2F'}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.primaryColor || '#D32F2F'}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                disabled={saving}
                placeholder="#D32F2F"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>

          {/* 2. Couleur Secondaire */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              2. Couleur Secondaire (Badges, éléments d'accent)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.secondaryColor || '#1976D2'}
                onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.secondaryColor || '#1976D2'}
                onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                disabled={saving}
                placeholder="#1976D2"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>

          {/* 3. Couleur de Fond */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              3. Couleur de Fond (Arrière-plan principal)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.backgroundColor || '#FAF8F5'}
                onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.backgroundColor || '#FAF8F5'}
                onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                disabled={saving}
                placeholder="#FAF8F5"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>

          {/* 4. Couleur du Texte */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              4. Couleur du Texte (Paragraphes & corps)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.textColor || '#1C1917'}
                onChange={(e) => handleThemeChange('textColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.textColor || '#1C1917'}
                onChange={(e) => handleThemeChange('textColor', e.target.value)}
                disabled={saving}
                placeholder="#1C1917"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>

          {/* 5. Couleur de Fond des Boutons */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              5. Couleur de Fond des Boutons (CTA)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.buttonBgColor || publicTheme.primaryColor || '#D32F2F'}
                onChange={(e) => handleThemeChange('buttonBgColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.buttonBgColor || publicTheme.primaryColor || '#D32F2F'}
                onChange={(e) => handleThemeChange('buttonBgColor', e.target.value)}
                disabled={saving}
                placeholder="#D32F2F"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>

          {/* 6. Couleur du Texte des Boutons */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              6. Couleur du Texte des Boutons
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={publicTheme.buttonTextColor || '#FFFFFF'}
                onChange={(e) => handleThemeChange('buttonTextColor', e.target.value)}
                disabled={saving}
                className="w-9 h-9 rounded cursor-pointer border border-encre-noire p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={publicTheme.buttonTextColor || '#FFFFFF'}
                onChange={(e) => handleThemeChange('buttonTextColor', e.target.value)}
                disabled={saving}
                placeholder="#FFFFFF"
                className="flex-1 text-xs font-mono font-bold uppercase px-3 py-1.5 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </div>
        </CordelCard>

        {/* Section 2: Typographie */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
            🔤 Polices de Caractères
          </h4>

          {/* Police des Titres */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Police des Titres (Headings)
            </label>
            <select
              value={publicTheme.headingFont || 'Oswald'}
              onChange={(e) => handleThemeChange('headingFont', e.target.value)}
              disabled={saving}
              className="text-xs font-semibold px-3 py-2 border border-encre-noire/30 rounded bg-white cursor-pointer"
            >
              {GOOGLE_FONTS_OPTIONS.map((font) => (
                <option key={`heading-${font.name}`} value={font.name}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Police du Texte */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Police du Texte (Body)
            </label>
            <select
              value={publicTheme.bodyFont || 'Roboto'}
              onChange={(e) => handleThemeChange('bodyFont', e.target.value)}
              disabled={saving}
              className="text-xs font-semibold px-3 py-2 border border-encre-noire/30 rounded bg-white cursor-pointer"
            >
              {GOOGLE_FONTS_OPTIONS.map((font) => (
                <option key={`body-${font.name}`} value={font.name}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Note explicative Cactus */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-relaxed mt-2">
            💡 <strong>Police Cactus :</strong> La typographie Cordel officielle est préchargée localement et ne nécessite aucun téléchargement externe.
          </div>

          {/* Réglage d'opacité de l'image de couverture (Hero Overlay) */}
          <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                🖼️ Voile sur l'image d'accueil (Hero Overlay)
              </label>
              <span className="text-xs font-extrabold text-cordel-wood bg-cordel-bg px-2 py-0.5 rounded border border-encre-noire/20">
                {publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}%
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium leading-tight">
              Ajustez l'assombrissement de la photo de couverture pour la rendre éclatante (0% = image brute, 25% = recommandé, 50% = sombre).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}
                onChange={(e) => handleThemeChange('heroOverlayOpacity', Number(e.target.value))}
                disabled={saving}
                className="flex-1 accent-cordel-wood cursor-pointer"
              />
            </div>
            <div className="flex gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => handleThemeChange('heroOverlayOpacity', 10)}
                className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 cursor-pointer"
              >
                10% (Éclatant)
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('heroOverlayOpacity', 25)}
                className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 cursor-pointer"
              >
                25% (Recommandé)
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('heroOverlayOpacity', 50)}
                className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 cursor-pointer"
              >
                50% (Sombre)
              </button>
            </div>
          </div>
        </CordelCard>
      </div>

      {/* Aperçu en direct des 6 couleurs */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-white">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3 mb-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-1.5">
            <XiloSparkles size={16} /> ⚡ Aperçu en direct du Thème
          </h4>
        </div>

        <div 
          className="p-6 rounded-lg border border-stone-300 flex flex-col gap-4 shadow-xs transition-colors"
          style={{ backgroundColor: publicTheme.backgroundColor || '#FAF8F5' }}
        >
          <h3 
            className="text-2xl font-extrabold uppercase tracking-tight"
            style={{
              fontFamily: `'${publicTheme.headingFont || 'Oswald'}', sans-serif`,
              color: publicTheme.primaryColor || '#D32F2F'
            }}
          >
            Titre de la Vitrine Publique
          </h3>

          <p 
            className="text-xs leading-relaxed font-medium"
            style={{
              fontFamily: `'${publicTheme.bodyFont || 'Roboto'}', sans-serif`,
              color: publicTheme.textColor || '#1C1917'
            }}
          >
            Ceci est un exemple de paragraphe. Il utilise la couleur de texte configurée ainsi que la typographie sélectionnée pour le corps de page.
          </p>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded shadow-md cursor-pointer transition-all"
              style={{
                backgroundColor: publicTheme.buttonBgColor || publicTheme.primaryColor || '#D32F2F',
                color: publicTheme.buttonTextColor || '#FFFFFF',
                fontFamily: `'${publicTheme.headingFont || 'Oswald'}', sans-serif`
              }}
            >
              Exemple de Bouton (CTA)
            </button>

            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white"
              style={{ backgroundColor: publicTheme.secondaryColor || '#1976D2' }}
            >
              Badge Secondaire
            </span>
          </div>
        </div>
      </CordelCard>
    </div>
  );
}
