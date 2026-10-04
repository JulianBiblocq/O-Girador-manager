import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';

/**
 * Accordéon compact pour l'identité visuelle, logo officiel et palette de couleurs.
 */
export default function BrandingLogoAccordion({
  formData = {},
  handleChange,
  logoFile,
  setLogoFile,
  uploadingLogo,
  saving
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { branding = {} } = formData;
  const colors = branding.colors || {
    primary: '#d99f4d',
    secondary: '#84967a',
    background: '#f4ecd8',
    text: '#1a1a1a'
  };

  const setColors = (updater) => {
    const updated = typeof updater === 'function' ? updater(colors) : updater;
    handleChange('branding.colors', updated);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau compact d'en-tête */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🎨</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {t('settings.modules.brandingLogoAccordion.identiteVisuelleLogoOfficiel') || 'Identité Visuelle & Logo Officiel'} {isOpen ? '▲' : '▾'}
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt={t('settings.modules.brandingLogoAccordion.logo') || "Logo"} className="w-5 h-5 object-contain rounded bg-white border border-stone-300" />
            )}
            <span className="w-3.5 h-3.5 rounded-full border border-stone-400" style={{ backgroundColor: colors.primary }} title={t('settings.modules.brandingLogoAccordion.couleurPrimaire') || "Couleur primaire"} />
            <span className="w-3.5 h-3.5 rounded-full border border-stone-400" style={{ backgroundColor: colors.secondary }} title={t('settings.modules.brandingLogoAccordion.couleurSecondaire') || "Couleur secondaire"} />
          </div>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? (t('settings.modules.brandingLogoAccordion.fermer') || 'Fermer') : (t('settings.modules.brandingLogoAccordion.personnaliser') || 'Personnaliser')}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3.5 text-left animate-fade-in bg-white/40">
          {/* Logo officiel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-3 border-b border-dashed border-stone-200">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={t('settings.modules.brandingLogoAccordion.logo') || "Logo"} className="w-14 h-14 object-contain border border-stone-300 rounded bg-white p-1 shrink-0" />
            ) : (
              <div className="w-14 h-14 border border-dashed border-stone-300 rounded flex items-center justify-center text-[10px] text-stone-400 font-bold bg-white shrink-0">
                {t('settings.modules.brandingLogoAccordion.aucun') || 'Aucun'}
              </div>
            )}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-extrabold uppercase text-cordel-master-dark">
                {t('settings.modules.brandingLogoAccordion.remplacerLeLogoSvgOu') || 'Remplacer le Logo (SVG ou PNG transparent)'}
              </span>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setLogoFile && setLogoFile(e.target.files?.[0] || null)}
                disabled={saving}
                className="text-[9px] font-bold cursor-pointer"
              />
              {logoFile && (
                <span className="text-[9px] text-emerald-700 font-bold">{t('settings.modules.brandingLogoAccordion.fichierPret') || '✓ Fichier prêt :'} {logoFile.name}</span>
              )}
              {uploadingLogo && (
                <span className="text-[9px] text-cordel-wood animate-pulse font-bold">{t('settings.modules.brandingLogoAccordion.envoiDuLogoEnCours') || 'Envoi du logo en cours...'}</span>
              )}
            </div>
          </div>

          {/* Palette de couleurs */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.modules.brandingLogoAccordion.charteGraphiqueDeLAssociation') || "Charte Graphique de l'Association"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold text-stone-700">
              <div className="flex items-center gap-2 p-1.5 rounded bg-white border border-stone-200">
                <input 
                  type="color" 
                  value={colors.primary}
                  onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                  disabled={saving}
                  className="w-7 h-7 cursor-pointer rounded border"
                />
                <span className="text-[10px]">{t('settings.modules.brandingLogoAccordion.primaire') || 'Primaire'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded bg-white border border-stone-200">
                <input 
                  type="color" 
                  value={colors.secondary}
                  onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                  disabled={saving}
                  className="w-7 h-7 cursor-pointer rounded border"
                />
                <span className="text-[10px]">{t('settings.modules.brandingLogoAccordion.secondaire') || 'Secondaire'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded bg-white border border-stone-200">
                <input 
                  type="color" 
                  value={colors.background}
                  onChange={(e) => setColors(prev => ({ ...prev, background: e.target.value }))}
                  disabled={saving}
                  className="w-7 h-7 cursor-pointer rounded border"
                />
                <span className="text-[10px]">{t('settings.modules.brandingLogoAccordion.arrierePlan') || 'Arrière-plan'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded bg-white border border-stone-200">
                <input 
                  type="color" 
                  value={colors.text}
                  onChange={(e) => setColors(prev => ({ ...prev, text: e.target.value }))}
                  disabled={saving}
                  className="w-7 h-7 cursor-pointer rounded border"
                />
                <span className="text-[10px]">{t('settings.modules.brandingLogoAccordion.texte') || 'Texte'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
