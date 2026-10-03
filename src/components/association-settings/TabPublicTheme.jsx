import React from 'react';
import CordelCard from '../CordelCard';
import { XiloSparkles, XiloPalette } from '../XiloIcons';
import { useTranslation } from '../../hooks/useTranslation';

// Liste des polices sélectionnées pour le site vitrine (incluant Cactus, la typo locale Cordel)
export const GOOGLE_FONTS_OPTIONS = [
  { name: 'Cactus', category: 'display', labelKey: 'cactusTypoCordelOfficielle' },
  { name: 'Roboto', category: 'sans-serif', labelKey: 'robotoModernePolyvalente' },
  { name: 'Montserrat', category: 'sans-serif', labelKey: 'montserratGeometriqueEpuree' },
  { name: 'Open Sans', category: 'sans-serif', labelKey: 'openSansExcellenteLisibilite' },
  { name: 'Oswald', category: 'sans-serif', labelKey: 'oswaldTitresCondensesAFort' },
  { name: 'Playfair Display', category: 'serif', labelKey: 'playfairDisplaySerifElegante' },
  { name: 'Lato', category: 'sans-serif', labelKey: 'latoChaleureuseEquilibree' },
  { name: 'Poppins', category: 'sans-serif', labelKey: 'poppinsArrondieTendance' },
  { name: 'Cinzel', category: 'serif', labelKey: 'cinzelClassiquePrestigieuse' },
  { name: 'Rye', category: 'display', labelKey: 'ryeCordelGravureBois' },
  { name: 'Sancreek', category: 'display', labelKey: 'sancreekCordelTypoRetro' }
];

/**
 * Composant d'administration dédié à la personnalisation visuelle (Apparence, 6 couleurs et typographies)
 * du site vitrine public.
 */
export default function TabPublicTheme({ formData, handleChange, saving, t: propT }) {
  const { t: i18nT } = useTranslation();
  const t = propT || i18nT;

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
            {t('vitrine.admin.theme.tabPublicTheme.apparenceVisuelleCharteGraphique')}
          </h3>
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          {t('vitrine.admin.theme.tabPublicTheme.personnalisezFinementLaPaletteVisuelle')}
        </p>
      </CordelCard>

      {/* Grille : Couleurs & Typographies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Palette des 6 Couleurs Sémantiques */}
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
            {t('vitrine.admin.theme.tabPublicTheme.paletteDes6CouleursVitrine')}
          </h4>

          {/* 1. Couleur Primaire */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              {t('vitrine.admin.theme.tabPublicTheme.1CouleurPrimaireTitresMarqueurs')}
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
              {t('vitrine.admin.theme.tabPublicTheme.2CouleurSecondaireBadgesElements')}
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
              {t('vitrine.admin.theme.tabPublicTheme.3CouleurDeFondArriere')}
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
              {t('vitrine.admin.theme.tabPublicTheme.4CouleurDuTexteParagraphes')}
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
              {t('vitrine.admin.theme.tabPublicTheme.5CouleurDeFondDes')}
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
              {t('vitrine.admin.theme.tabPublicTheme.6CouleurDuTexteDes')}
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
            {t('vitrine.admin.theme.tabPublicTheme.policesDeCaracteres')}
          </h4>

          {/* Police des Titres */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              {t('vitrine.admin.theme.tabPublicTheme.policeDesTitresHeadings')}
            </label>
            <select
              value={publicTheme.headingFont || 'Oswald'}
              onChange={(e) => handleThemeChange('headingFont', e.target.value)}
              disabled={saving}
              className="text-xs font-semibold px-3 py-2 border border-encre-noire/30 rounded bg-white cursor-pointer"
            >
              {GOOGLE_FONTS_OPTIONS.map((font) => (
                <option key={`heading-${font.name}`} value={font.name}>
                  {t(`vitrine.admin.theme.tabPublicTheme.${font.labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Police du Texte */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              {t('vitrine.admin.theme.tabPublicTheme.policeDuTexteBody')}
            </label>
            <select
              value={publicTheme.bodyFont || 'Roboto'}
              onChange={(e) => handleThemeChange('bodyFont', e.target.value)}
              disabled={saving}
              className="text-xs font-semibold px-3 py-2 border border-encre-noire/30 rounded bg-white cursor-pointer"
            >
              {GOOGLE_FONTS_OPTIONS.map((font) => (
                <option key={`body-${font.name}`} value={font.name}>
                  {t(`vitrine.admin.theme.tabPublicTheme.${font.labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Note explicative Cactus */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-relaxed mt-2">
            💡 <strong>{t('vitrine.admin.theme.tabPublicTheme.policeCactus')}</strong>{' '}
            {t('vitrine.admin.theme.tabPublicTheme.laTypographieCordelOfficielleEst')}
          </div>

          {/* Réglage d'opacité de l'image de couverture (Hero Overlay) */}
          <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                {t('vitrine.admin.theme.tabPublicTheme.voileSurLImageD')}
              </label>
              <span className="text-xs font-extrabold text-cordel-wood bg-cordel-bg px-2 py-0.5 rounded border border-encre-noire/20">
                {publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}%
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium leading-tight">
              {t('vitrine.admin.theme.tabPublicTheme.ajustezLAssombrissementDeLa')}
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
                {t('vitrine.admin.theme.tabPublicTheme.10Eclatant')}
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('heroOverlayOpacity', 25)}
                className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 cursor-pointer"
              >
                {t('vitrine.admin.theme.tabPublicTheme.25Recommande')}
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('heroOverlayOpacity', 50)}
                className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 cursor-pointer"
              >
                {t('vitrine.admin.theme.tabPublicTheme.50Sombre')}
              </button>
            </div>
          </div>
        </CordelCard>
      </div>

      {/* Aperçu en direct des 6 couleurs */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-white">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3 mb-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-1.5">
            <XiloSparkles size={16} /> {t('vitrine.admin.theme.tabPublicTheme.apercuEnDirectDuTheme')}
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
            {t('vitrine.admin.theme.tabPublicTheme.titreDeLaVitrinePublique')}
          </h3>

          <p 
            className="text-xs leading-relaxed font-medium"
            style={{
              fontFamily: `'${publicTheme.bodyFont || 'Roboto'}', sans-serif`,
              color: publicTheme.textColor || '#1C1917'
            }}
          >
            {t('vitrine.admin.theme.tabPublicTheme.ceciEstUnExempleDe')}
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
              {t('vitrine.admin.theme.tabPublicTheme.exempleDeBoutonCta')}
            </button>

            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white"
              style={{ backgroundColor: publicTheme.secondaryColor || '#1976D2' }}
            >
              {t('vitrine.admin.theme.tabPublicTheme.badgeSecondaire')}
            </span>
          </div>
        </div>
      </CordelCard>
    </div>
  );
}
