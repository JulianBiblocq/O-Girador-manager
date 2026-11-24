import React, { useState, useMemo, useCallback } from 'react';
import { usePoleGuide, getGuideKey } from '../hooks/usePoleGuide';
import { resolveLocalizedGuideText, resolveLocalizedGuideSteps } from '../config/poleGuides';
import PoleTourOverlay from './guided-tour/PoleTourOverlay';
import { useTranslation } from './LanguageContext';
import { useViewSimulator } from '../context/ViewSimulatorContext';
import { computeIsUserPoleManager } from '../utils/poleBannerRoleUtils';

/**
 * Bannière d'aide contextuelle bilingue (FR / PT-BR) aux couleurs du Design System Cordel.
 * Supporte la Double Vue (Vue Adhérent vs Vue Responsable / Mestre) et tous les guides simples.
 */
export default function InfoPoleBanner({
  currentPole,
  currentTab,
  forceShow = false,
  onClose,
  currentProfile,
  profileData,
  userTags,
  permissionsMatrice,
  isSystemOrSuperAdminOrMestre = false,
  isManager = undefined
}) {
  const { t, locale, i18n } = useTranslation();
  const { guide, guideKey, isHidden, hideBanner } = usePoleGuide(currentTab, currentPole);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [viewModeOverride, setViewModeOverride] = useState(null);

  const simContext = useViewSimulator();
  const activeProfile = currentProfile || profileData || simContext?.effectiveProfile || null;
  const activeUserTags = userTags || simContext?.effectiveUserTags || activeProfile?.tags || [];
  const effectiveKey = guideKey || getGuideKey(currentTab, currentPole);

  const activeLang = (typeof i18n !== 'undefined' && i18n?.language) || locale || 'fr';
  const isPt = activeLang === 'pt' || String(activeLang).toLowerCase().startsWith('pt');
  const resolveBilingual = useCallback((val) => resolveLocalizedGuideText(val, isPt), [isPt]);

  const hasDoubleView = Boolean(guide && (guide.memberGuide || guide.managerGuide));

  const isUserPoleManager = useMemo(
    () =>
      computeIsUserPoleManager({
        isManager,
        isSystemOrSuperAdminOrMestre,
        activeProfile,
        activeUserTags,
        effectiveKey,
        currentTab,
        currentPole,
        permissionsMatrice
      }),
    [isManager, isSystemOrSuperAdminOrMestre, activeProfile, activeUserTags, effectiveKey, currentTab, currentPole, permissionsMatrice]
  );

  const activeViewMode = isUserPoleManager && viewModeOverride ? viewModeOverride : isUserPoleManager ? 'manager' : 'member';
  const activeSubGuide = hasDoubleView
    ? activeViewMode === 'manager'
      ? guide?.managerGuide || guide?.memberGuide
      : guide?.memberGuide || guide?.managerGuide
    : null;

  const isDirectlyHidden =
    typeof window !== 'undefined' &&
    !(
      localStorage.getItem(`pole_guide_hidden_${effectiveKey}`) === 'false' ||
      (currentTab && localStorage.getItem(`pole_guide_hidden_${currentTab}`) === 'false') ||
      (currentPole && localStorage.getItem(`pole_guide_hidden_${currentPole}`) === 'false')
    );

  const handleHide = () => {
    try {
      if (effectiveKey && typeof window !== 'undefined') {
        localStorage.setItem(`pole_guide_hidden_${effectiveKey}`, 'true');
        if (currentTab) localStorage.setItem(`pole_guide_hidden_${currentTab}`, 'true');
        if (currentPole) localStorage.setItem(`pole_guide_hidden_${currentPole}`, 'true');
      }
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence locale", e);
    }
    hideBanner();
    if (onClose) onClose();
  };

  const isCaReunions = effectiveKey === 'ca-reunions' || currentTab === 'ca-reunions';

  // Repli sur les clés de traduction locales (notamment pour les onglets Vitrine)
  const lookupKey = effectiveKey && t(`poleGuides.${effectiveKey}.title`) !== `poleGuides.${effectiveKey}.title` && t(`poleGuides.${effectiveKey}.title`)
    ? effectiveKey
    : effectiveKey && t(`poleGuides.vitrine-${effectiveKey}.title`) !== `poleGuides.vitrine-${effectiveKey}.title` && t(`poleGuides.vitrine-${effectiveKey}.title`)
      ? `vitrine-${effectiveKey}`
      : null;

  const i18nTitle = lookupKey ? t(`poleGuides.${lookupKey}.title`) : null;
  const i18nDesc = lookupKey ? t(`poleGuides.${lookupKey}.description`) : null;
  const rawI18nSteps = lookupKey
    ? [1, 2, 3, 4, 5]
      .map((idx) => {
        const key = `poleGuides.${lookupKey}.step${idx}`;
        const val = t(key);
        return val && val !== key ? val : null;
      })
      .filter(Boolean)
    : [];
  const i18nSteps = rawI18nSteps.length > 0 ? rawI18nSteps : null;

  const localizedSimpleTitle = guide?.title && typeof guide.title === 'object' ? resolveBilingual(guide.title) : null;
  const localizedSimpleDesc = guide?.description && typeof guide.description === 'object' ? resolveBilingual(guide.description) : null;
  const localizedSimpleSteps = guide?.steps && !Array.isArray(guide.steps) && typeof guide.steps === 'object'
    ? resolveLocalizedGuideSteps(guide.steps, isPt)
    : null;

  const bannerTitle = hasDoubleView
    ? resolveBilingual(activeSubGuide?.title)
    : isCaReunions
      ? t('governance.meetingsTitle')
      : localizedSimpleTitle || i18nTitle || resolveBilingual(guide?.titre || guide?.title);

  const bannerDesc = hasDoubleView
    ? resolveBilingual(activeSubGuide?.summary || activeSubGuide?.description)
    : isCaReunions
      ? t('governance.meetingsSubtitle')
      : localizedSimpleDesc || i18nDesc || resolveBilingual(guide?.description);

  const bannerSteps = hasDoubleView
    ? activeSubGuide?.workflowSteps
      ? activeSubGuide.workflowSteps.map((s) => `${resolveBilingual(s.title)} : ${resolveBilingual(s.desc)}`)
      : activeSubGuide?.sections
        ? activeSubGuide.sections.map((s) => `${resolveBilingual(s.heading)} : ${resolveBilingual(s.text)}`)
        : resolveLocalizedGuideSteps(guide?.steps || guide?.etapes, isPt)
    : isCaReunions
      ? [t('governance.step1'), t('governance.step2'), t('governance.step3'), t('governance.step4')]
      : localizedSimpleSteps || i18nSteps || resolveLocalizedGuideSteps(guide?.steps || guide?.etapes, isPt);

  const isTourCompleted = typeof window !== 'undefined' ? localStorage.getItem(`pole_tour_completed_${currentTab}`) === 'true' : false;

  const tourGuide = useMemo(() => {
    if (!guide) return null;
    return { ...guide, titre: bannerTitle, title: bannerTitle, description: bannerDesc, etapes: bannerSteps, steps: bannerSteps };
  }, [guide, bannerTitle, bannerDesc, bannerSteps]);

  if (!guide) return null;
  if ((isDirectlyHidden || isHidden) && !forceShow && !isTourOpen) return null;

  return (
    <>
      <div className="w-full mb-4 p-4 sm:p-5 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] shadow-[2.5px_2.5px_0px_0px_#181716] transition-all animate-fade-in relative overflow-hidden select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-7 h-7 rounded-full theme-bg-ocre border border-encre-noire/30 text-encre-noire text-sm shrink-0">
              💡
            </span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
              {bannerTitle}
            </h3>

            {hasDoubleView && activeSubGuide?.roleBadge && activeViewMode === 'manager' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px_5px_3px_4px] text-[9.5px] font-black uppercase tracking-wider theme-bg-ocre text-encre-noire border border-encre-noire/30 select-none">
                <span>🎯</span>
                <span>{resolveBilingual(activeSubGuide.roleBadge)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {hasDoubleView && isUserPoleManager && guide.memberGuide && guide.managerGuide && (
              <div className="flex items-center gap-1 bg-encre-noire/5 p-0.5 rounded-[4px_6px_3px_5px] border border-encre-noire/20 text-[10px] font-black mr-1">
                <button
                  type="button"
                  onClick={() => setViewModeOverride('manager')}
                  className={`px-2 py-1 rounded-[3px_5px_2px_4px] transition-all cursor-pointer ${activeViewMode === 'manager'
                      ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                      : 'text-encre-noire/70 hover:text-encre-noire'
                    }`}
                  title={t('poleGuides.viewManagerTooltip')}
                >
                  {t('poleGuides.viewManagerBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewModeOverride('member')}
                  className={`px-2 py-1 rounded-[3px_5px_2px_4px] transition-all cursor-pointer ${activeViewMode === 'member'
                      ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                      : 'text-encre-noire/70 hover:text-encre-noire'
                    }`}
                  title={t('poleGuides.viewMemberTooltip')}
                >
                  {t('poleGuides.viewMemberBtn')}
                </button>
              </div>
            )}

            {isCaReunions && (
              <>
                <button
                  type="button"
                  onClick={() => document.getElementById('meeting-form-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:brightness-110 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1 shrink-0"
                >
                  <span>➕</span>
                  <span>{t('governance.btnNewMeeting')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('meetings-studio-table')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-encre-noire/40 bg-cordel-bg text-cordel-wood hover:bg-cordel-bg-light transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1 shrink-0"
                >
                  <span>📜</span>
                  <span>{t('governance.btnReportsArchives')}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire theme-bg-ocre text-encre-noire hover:brightness-105 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
              title={t('poleGuides.tourTooltip')}
            >
              <span>🧭</span>
              <span>{t('poleGuides.tourBtn')}</span>
              {isTourCompleted && (
                <span className="text-[var(--color-cordel-vert)] text-[9px] font-black" title={t('poleGuides.tourCompletedTooltip')}>✓</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleHide}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:brightness-110 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
              title={t('poleGuides.hideTooltip')}
            >
              <span>✓</span>
              <span>{t('common.understood')}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-encre-noire/90 font-medium leading-relaxed mb-3">{bannerDesc}</p>

        {hasDoubleView && Array.isArray(activeSubGuide?.sections) && activeSubGuide.sections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {t('poleGuides.tipsHeading')}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {activeSubGuide.sections.map((sec, idx) => (
                <div key={idx} className="flex flex-col gap-1 bg-cordel-bg/60 p-2.5 rounded-[4px_6px_3px_5px] border border-encre-noire/15 shadow-xs">
                  <h4 className="text-[11.5px] font-black text-cordel-wood flex items-center gap-1.5">{resolveBilingual(sec.heading)}</h4>
                  <p className="text-[11px] font-medium leading-snug text-encre-noire/90">{resolveBilingual(sec.text)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasDoubleView && Array.isArray(activeSubGuide?.workflowSteps) && activeSubGuide.workflowSteps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {t('poleGuides.workflowHeading')}
            </span>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {activeSubGuide.workflowSteps.map((ws, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-cordel-bg/60 p-2.5 rounded-[4px_6px_3px_5px] border border-encre-noire/15 shadow-xs">
                  <span className="w-5 h-5 rounded-full bg-cordel-wood text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {ws.step || idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11.5px] font-black text-cordel-wood leading-tight">{resolveBilingual(ws.title)}</h4>
                    <p className="text-[11px] font-medium leading-snug text-encre-noire/90 mt-1">{resolveBilingual(ws.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {hasDoubleView && Array.isArray(activeSubGuide?.videoTutorials) && activeSubGuide.videoTutorials.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/15 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
              <span>🎥</span>
              <span>{t('poleGuides.videoTutorialsHeading')}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeSubGuide.videoTutorials.map((tut) => (
                <span key={tut.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px_5px_3px_4px] bg-cordel-bg text-cordel-wood border border-encre-noire/25 text-[10px] font-bold shadow-xs select-none">
                  <span>▶️</span>
                  <span>{resolveBilingual(tut.label)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {!hasDoubleView && Array.isArray(bannerSteps) && bannerSteps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {t('poleGuides.stepsHeading')}
            </span>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {bannerSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-cordel-bg/60 p-2 rounded border border-encre-noire/15">
                  <span className="w-4 h-4 rounded-full bg-cordel-wood text-white text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] font-medium leading-snug text-encre-noire/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {isTourOpen && (
        <PoleTourOverlay guide={tourGuide} tabId={currentTab} isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      )}
    </>
  );
}

/**
 * Bouton déclencheur d'aide contextuelle (`💡`) intégré dans la barre d'onglets du pôle.
 */
export function InfoPoleHelpButton({ currentPole, currentTab }) {
  const { t } = useTranslation();
  const { guide, isHidden, toggleBanner } = usePoleGuide(currentTab, currentPole);

  if (!guide) return null;

  return (
    <button
      type="button"
      onClick={toggleBanner}
      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center p-0 rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer shrink-0 ${isHidden
          ? 'bg-cordel-bg-light text-cordel-wood border-encre-noire/60 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none'
          : 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
        }`}
      title={isHidden ? t('poleGuides.helpBtnShowTooltip') : t('poleGuides.helpBtnHideTooltip')}
      aria-label={t('poleGuides.helpBtnAria')}
    >
      <span className="text-sm select-none">💡</span>
    </button>
  );
}
