import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Accordéon 1 : En-tête & Accroche (Hero)
 * Gère le titre principal, la phrase d'accroche, le visuel/vidéo de couverture et le bouton CTA.
 */
export default function HeroHeaderAccordion({
  formData = {},
  handleChange,
  heroImageFile,
  setHeroImageFile,
  saving,
  defaultOpen = false
}) {
  const { t } = useTranslation();
  const publicTheme = formData.publicTheme || {};

  const handleThemeChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    if (field === 'publicCatchphrase') updatedTheme.heroCatchphrase = value;
    if (field === 'publicVideoLink') updatedTheme.videoUrl = value;
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <CordelAccordion
      title={t('vitrine.admin.content.heroHeaderAccordion.enTeteAccrocheHero')}
      subtitle={t('vitrine.admin.content.heroHeaderAccordion.titrePhraseDAccrocheVisuel')}
      icon="🖼️"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="flex flex-col gap-4 text-left pt-1">
        {/* Titre principal du site */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>{t('vitrine.admin.content.heroHeaderAccordion.titrePrincipalDuSiteNom')}</span>
          </label>
          <input
            type="text"
            value={formData.nom || ''}
            onChange={(e) => handleChange('nom', e.target.value)}
            disabled={saving}
            placeholder={t('vitrine.admin.content.heroHeaderAccordion.exSamambaia')}
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Phrase d'accroche */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            {t('vitrine.admin.content.heroHeaderAccordion.phraseDAccrocheHeroSection')}
          </label>
          <input
            type="text"
            value={publicTheme.publicCatchphrase || publicTheme.heroCatchphrase || ''}
            onChange={(e) => handleThemeChange('publicCatchphrase', e.target.value)}
            disabled={saving}
            placeholder={t('vitrine.admin.content.heroHeaderAccordion.exLEnergiePercutanteEt')}
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Image de Couverture Hero */}
        <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            {t('vitrine.admin.content.heroHeaderAccordion.imageDeCouvertureHeroBanniere')}
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {setHeroImageFile && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setHeroImageFile(e.target.files[0]);
                  }
                }}
                disabled={saving}
                className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-cordel-bg file:text-encre-noire hover:file:brightness-95 cursor-pointer"
              />
            )}
            {heroImageFile && (
              <span className="text-xs font-bold text-[var(--color-cordel-vert,#2d6a4f)] flex items-center gap-1">
                {t('vitrine.admin.content.heroHeaderAccordion.nouvelleImage')}
                {Math.round(heroImageFile.size / 1024)}{' '}
                {t('vitrine.admin.content.heroHeaderAccordion.ko')}
              </span>
            )}
          </div>
          <input
            type="url"
            value={publicTheme.publicHeroImage || ''}
            onChange={(e) => handleThemeChange('publicHeroImage', e.target.value)}
            disabled={saving}
            placeholder="https://exemple.com/image-couverture.jpg"
            className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />

          {/* Opacité du voile Hero */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-encre-noire/15">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
                {t('vitrine.admin.content.heroHeaderAccordion.voileDAssombrissementSurL')}
              </label>
              <span className="text-[11px] font-black text-cordel-wood bg-cordel-bg px-2 py-0.5 rounded border border-encre-noire/20">
                {publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}%
              </span>
            </div>
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
              <span className="text-[10px] text-stone-500 font-medium">
                {publicTheme.heroOverlayOpacity <= 15
                  ? t('vitrine.admin.content.heroHeaderAccordion.eclatant')
                  : publicTheme.heroOverlayOpacity <= 35
                  ? t('vitrine.admin.content.heroHeaderAccordion.equilibre')
                  : t('vitrine.admin.content.heroHeaderAccordion.sombre')}
              </span>
            </div>
          </div>
        </div>

        {/* Lien Vidéo Optionnelle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            {t('vitrine.admin.content.heroHeaderAccordion.lienVideoYoutubeOuVimeo')}
          </label>
          <input
            type="url"
            value={publicTheme.publicVideoLink || publicTheme.videoUrl || ''}
            onChange={(e) => handleThemeChange('publicVideoLink', e.target.value)}
            disabled={saving}
            placeholder={t('vitrine.admin.content.heroHeaderAccordion.exHttpsWwwYoutubeCom')}
            className="text-xs font-mono px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Bouton d'Action Principal (Hero CTA) */}
        <div className="flex flex-col gap-3 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-stone-300 pb-1.5">
            <span>{t('vitrine.admin.content.heroHeaderAccordion.boutonDActionPrincipalHero')}</span>
            <span className="text-[10px] text-stone-500 font-normal">
              {t('vitrine.admin.content.heroHeaderAccordion.hautDeLaVitrine')}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">
                {t('vitrine.admin.content.heroHeaderAccordion.texteDuBoutonCta')}
              </label>
              <input
                type="text"
                value={publicTheme.heroCtaText !== undefined ? publicTheme.heroCtaText : 'Prochaines dates'}
                onChange={(e) => handleThemeChange('heroCtaText', e.target.value)}
                disabled={saving}
                placeholder={t('vitrine.admin.content.heroHeaderAccordion.exNousRejoindreProchainesDates')}
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">
                {t('vitrine.admin.content.heroHeaderAccordion.iconeEmoji')}
              </label>
              <input
                type="text"
                value={publicTheme.heroCtaIcon !== undefined ? publicTheme.heroCtaIcon : '📅'}
                onChange={(e) => handleThemeChange('heroCtaIcon', e.target.value)}
                disabled={saving}
                placeholder="📅"
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white text-center font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">
                {t('vitrine.admin.content.heroHeaderAccordion.lienRedirection')}
              </label>
              <input
                type="text"
                value={publicTheme.heroCtaLink !== undefined ? publicTheme.heroCtaLink : '#agenda'}
                onChange={(e) => handleThemeChange('heroCtaLink', e.target.value)}
                disabled={saving}
                placeholder={t('vitrine.admin.content.heroHeaderAccordion.exAgendaRecrutementMailto')}
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-3 sm:pt-4">
              <input
                type="checkbox"
                id="showHeroCtaIcon"
                checked={publicTheme.showHeroCtaIcon !== false}
                onChange={(e) => handleThemeChange('showHeroCtaIcon', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
              />
              <label htmlFor="showHeroCtaIcon" className="text-xs font-bold text-stone-800 cursor-pointer select-none">
                {t('vitrine.admin.content.heroHeaderAccordion.afficherLIcone')}
              </label>
            </div>
          </div>
        </div>
      </div>
    </CordelAccordion>
  );
}

