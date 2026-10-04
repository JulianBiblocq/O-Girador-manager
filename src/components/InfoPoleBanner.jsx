import React, { useState, useMemo, useCallback } from 'react';
import { usePoleGuide, getGuideKey } from '../hooks/usePoleGuide';
import { POLE_GUIDES } from '../config/poleGuides';
import PoleTourOverlay from './guided-tour/PoleTourOverlay';
import { useTranslation } from './LanguageContext';
import { matchesAllowedKeyword, canAccessPole } from '../utils/permissionUtils';
import { useViewSimulator } from '../context/ViewSimulatorContext';

/**
 * Composant : InfoPoleBanner
 * 
 * Bannière d'aide contextuelle dépliable aux couleurs et motifs de la charte Cordel.
 * Supporte nativement la Double Vue (Vue Adhérent / Élève vs Vue Responsable / Mestre)
 * pour les pôles Agenda et Pédagogie, ainsi que les guides classiques des pôles métiers.
 * 
 * @param {string} currentPole - Identifiant du pôle actif
 * @param {string} currentTab - Identifiant de l'onglet actif
 * @param {boolean} [forceShow] - Optionnel : force l'affichage sans tenir compte de l'état masqué
 * @param {Function} [onClose] - Optionnel : callback de fermeture
 * @param {Object} [currentProfile] - Optionnel : profil utilisateur actif
 * @param {Object} [profileData] - Optionnel : profil utilisateur (alias)
 * @param {Array} [userTags] - Optionnel : étiquettes effectives
 * @param {Object} [permissionsMatrice] - Optionnel : matrice des permissions de l'association
 * @param {boolean} [isSystemOrSuperAdminOrMestre] - Optionnel : privilège global
 * @param {boolean} [isManager] - Optionnel : surcharge manuelle du statut gestionnaire
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

  // Consommation tolérante du contexte de simulation de vue (le hook fournit un fallback sécurisé sans throw)
  const simContext = useViewSimulator();
  const simulatedProfile = simContext?.effectiveProfile || null;
  const simulatedTags = simContext?.effectiveUserTags || null;

  const activeProfile = currentProfile || profileData || simulatedProfile;
  const activeUserTags = userTags || simulatedTags || activeProfile?.tags || [];

  // Clé résolue pour la persistance locale
  const effectiveKey = guideKey || getGuideKey(currentTab, currentPole);

  // Détection de la langue active (FR ou PT-BR)
  const activeLang = (typeof i18n !== 'undefined' && i18n?.language) || locale || 'fr';
  const isPt = activeLang === 'pt' || String(activeLang).toLowerCase().startsWith('pt');

  // Résolution bilingue d'un champ { fr, pt } ou chaîne brute
  const resolveBilingual = useCallback((val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return isPt ? (val.pt || val.fr || '') : (val.fr || val.pt || '');
  }, [isPt]);

  // Vérification de la présence d'une structure Double Vue (memberGuide / managerGuide)
  const hasDoubleView = Boolean(guide && (guide.memberGuide || guide.managerGuide));

  // Détermination fine du statut Gestionnaire / Mestre pour ce pôle / onglet
  const isUserPoleManager = useMemo(() => {
    if (typeof isManager === 'boolean') return isManager;
    if (isSystemOrSuperAdminOrMestre) return true;
    if (!activeProfile) return false;

    // Super-Administrateur racine réel (désactivé si en simulation)
    if (activeProfile.isSystemAdmin === true && !activeProfile.isSimulated) return true;

    const role = (activeProfile.role || '').toLowerCase();
    if (['super-admin', 'mestre', 'admin', 'bureau'].includes(role)) return true;

    const tagsList = (activeUserTags || [])
      .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
      .filter(t => t !== 'super-admin' && t !== 'superadmin');

    const GENERAL_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
    if (tagsList.some(t => GENERAL_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;

    // Règle spécifique Agenda (Secrétariat, Mestre, Logistique)
    if (effectiveKey === 'agenda' || currentTab === 'agenda' || currentPole === 'agenda' || currentTab === 'studio-events') {
      const AGENDA_KEYWORDS = ['secrétaire', 'secretaire', 'secretariat', 'secrétariat', 'logistique', 'mestre', 'bureau', 'direction', 'admin', 'ca'];
      if (tagsList.some(t => AGENDA_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['agenda'] || []), ...(permissionsMatrice['studio-events'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Règle spécifique Pédagogie & Répertoire (Mestre, Direction Artistique, Formateurs)
    if (['pedagogy', 'pedagogie', 'repertoire', 'mestre-repertoire', 'mestre-pedagogy-qcm', 'mestre-pedagogy-dashboard', 'varal-manager'].includes(effectiveKey) ||
        ['pedagogy', 'pedagogie', 'repertoire'].includes(currentTab) ||
        ['pedagogy', 'pedagogie', 'mestre'].includes(currentPole)) {
      const PEDAGOGY_KEYWORDS = ['mestre', 'mestria', 'direction', 'artistique', 'formateur', 'formatrice', 'pédagogie', 'pedagogie', 'chef de pupitre', 'admin', 'bureau'];
      if (tagsList.some(t => PEDAGOGY_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['pedagogie'] || []), ...(permissionsMatrice['mestre'] || []), ...(permissionsMatrice['mestre-repertoire'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Règle spécifique Porte-Voix & Vie du groupe (Modération, Bureau, Conseil d'Administration)
    if (['forum', 'porte-voix'].includes(effectiveKey) ||
        ['forum', 'porte-voix'].includes(currentTab) ||
        ['forum', 'porte-voix'].includes(currentPole)) {
      const FORUM_KEYWORDS = ['modérateur', 'modératrice', 'moderateur', 'moderatrice', 'modération', 'moderation', 'bureau', 'direction', 'admin', 'ca', 'conseil'];
      if (tagsList.some(t => FORUM_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['forum'] || []), ...(permissionsMatrice['moderation'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Règle spécifique Trésorerie & Finances (Trésorier, Comptabilité, Bureau)
    if (['treasury', 'tresorerie'].includes(effectiveKey) ||
        ['treasury', 'tresorerie'].includes(currentTab) ||
        ['treasury', 'tresorerie'].includes(currentPole)) {
      const TREASURY_KEYWORDS = ['trésorier', 'trésorière', 'tresorier', 'tresoriere', 'trésorerie', 'tresorerie', 'comptable', 'comptabilité', 'finance', 'finances', 'bureau', 'direction', 'admin', 'président', 'présidente'];
      if (tagsList.some(t => TREASURY_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['tresorerie'] || []), ...(permissionsMatrice['treasury'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Règle spécifique Secrétariat & Administration (Secrétaire, Bureau, CA)
    if (['secretariat'].includes(effectiveKey) ||
        ['secretariat'].includes(currentTab) ||
        ['secretariat'].includes(currentPole)) {
      const SECRETARIAT_KEYWORDS = ['secrétaire', 'secretaire', 'secretariat', 'secrétariat', 'bureau', 'direction', 'admin', 'ca', 'conseil'];
      if (tagsList.some(t => SECRETARIAT_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['secretariat'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Règle spécifique Studio & Communication (Communication, Presse, Webmaster, Bureau)
    if (['studio', 'communication', 'studio-photos', 'studio-newsletter', 'studio-social', 'studio-lexique'].includes(effectiveKey) ||
        ['studio', 'communication', 'studio-photos', 'studio-newsletter', 'studio-social', 'studio-lexique'].includes(currentTab) ||
        ['studio', 'communication'].includes(currentPole)) {
      const STUDIO_KEYWORDS = ['communication', 'com', 'presse', 'webmaster', 'médias', 'medias', 'photo', 'bureau', 'direction', 'admin'];
      if (tagsList.some(t => STUDIO_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)))) return true;
      if (permissionsMatrice && typeof permissionsMatrice === 'object') {
        const allowed = [...(permissionsMatrice['studio'] || []), ...(permissionsMatrice['communication'] || [])]
          .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
        if (tagsList.some(t => allowed.includes(t))) return true;
      }
    }

    // Repli générique pour les autres pôles d'administration
    if (currentPole && currentPole !== 'mon-espace' && currentPole !== 'accueil') {
      return canAccessPole(currentPole, activeProfile, permissionsMatrice, tagsList);
    }

    return false;
  }, [isManager, isSystemOrSuperAdminOrMestre, activeProfile, activeUserTags, effectiveKey, currentTab, currentPole, permissionsMatrice]);

  // Mode de vue actif pour les guides Double Vue (sélection automatique du rôle, commutable par le gestionnaire)
  const activeViewMode = (isUserPoleManager && viewModeOverride)
    ? viewModeOverride
    : (isUserPoleManager ? 'manager' : 'member');

  // Sous-guide ciblé selon le mode de vue actif
  const activeSubGuide = hasDoubleView
    ? (activeViewMode === 'manager' ? (guide?.managerGuide || guide?.memberGuide) : (guide?.memberGuide || guide?.managerGuide))
    : null;

  // Vérification synchrone immédiate du localStorage au montage (masqué par défaut)
  const isDirectlyHidden = typeof window !== 'undefined' && !(
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

  // Résolution i18n dynamique des bandeaux d'aide et consignes (avec détection de préfixe pour le Pôle Vitrine)
  const lookupKey = (effectiveKey && t(`poleGuides.${effectiveKey}.title`))
    ? effectiveKey
    : (effectiveKey && t(`poleGuides.vitrine-${effectiveKey}.title`)
      ? `vitrine-${effectiveKey}`
      : effectiveKey);

  const i18nTitle = lookupKey ? t(`poleGuides.${lookupKey}.title`) : null;
  const i18nDesc = lookupKey ? t(`poleGuides.${lookupKey}.description`) : null;
  const rawI18nSteps = lookupKey ? [
    t(`poleGuides.${lookupKey}.step1`),
    t(`poleGuides.${lookupKey}.step2`),
    t(`poleGuides.${lookupKey}.step3`),
    t(`poleGuides.${lookupKey}.step4`),
    t(`poleGuides.${lookupKey}.step5`)
  ].filter(Boolean) : [];
  const i18nSteps = rawI18nSteps.length > 0 ? rawI18nSteps : null;

  // Titre principal
  const bannerTitle = hasDoubleView
    ? resolveBilingual(activeSubGuide?.title)
    : (isCaReunions ? t('governance.meetingsTitle') : (i18nTitle || guide?.titre || guide?.title || ''));

  // Description / Résumé
  const bannerDesc = hasDoubleView
    ? resolveBilingual(activeSubGuide?.summary || activeSubGuide?.description)
    : (isCaReunions ? t('governance.meetingsSubtitle') : (i18nDesc || guide?.description || ''));

  // Étapes ou consignes
  const bannerSteps = hasDoubleView
    ? (activeSubGuide?.workflowSteps
        ? activeSubGuide.workflowSteps.map(s => `${resolveBilingual(s.title)} : ${resolveBilingual(s.desc)}`)
        : activeSubGuide?.sections
          ? activeSubGuide.sections.map(s => `${resolveBilingual(s.heading)} : ${resolveBilingual(s.text)}`)
          : (guide?.etapes || guide?.steps || []))
    : (isCaReunions
        ? [t('governance.step1'), t('governance.step2'), t('governance.step3'), t('governance.step4')]
        : (i18nSteps || guide?.etapes || guide?.steps || []));

  // Vérification de la complétion préalable du parcours guidé pour cet onglet
  const isTourCompleted = typeof window !== 'undefined'
    ? localStorage.getItem(`pole_tour_completed_${currentTab}`) === 'true'
    : false;

  // Objet de visite guidée adapté
  const tourGuide = useMemo(() => {
    if (!guide) return null;
    return {
      ...guide,
      titre: bannerTitle,
      title: bannerTitle,
      description: bannerDesc,
      etapes: bannerSteps,
      steps: bannerSteps
    };
  }, [guide, bannerTitle, bannerDesc, bannerSteps]);

  // Si aucun guide n'est défini pour cet onglet/pôle, ne rien afficher
  if (!guide) return null;

  // Si le guide est masqué par l'utilisateur (et pas forcé et pas en visite guidée active), retourner null
  if ((isDirectlyHidden || isHidden) && !forceShow && !isTourOpen) return null;

  return (
    <>
      <div className="w-full mb-4 p-4 sm:p-5 bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] shadow-[2.5px_2.5px_0px_0px_#181716] transition-all animate-fade-in relative overflow-hidden select-none">
        
        {/* Bandeau d'en-tête décoratif Cordel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/30 border border-encre-noire/30 text-amber-900 text-sm shrink-0">
              💡
            </span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
              {bannerTitle}
            </h3>

            {/* Badge de rôle pour la vue Responsable / Mestre */}
            {hasDoubleView && activeSubGuide?.roleBadge && activeViewMode === 'manager' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px_5px_3px_4px] text-[9.5px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-900/30 select-none">
                <span>🎯</span>
                <span>{resolveBilingual(activeSubGuide.roleBadge)}</span>
              </span>
            )}
          </div>

          {/* Actions : Commutateur de vue, Visite guidée et bouton de confirmation / masquage */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Commutateur de vue pour les gestionnaires (permet d'inspecter ce que voit l'adhérent) */}
            {hasDoubleView && isUserPoleManager && guide.memberGuide && guide.managerGuide && (
              <div className="flex items-center gap-1 bg-encre-noire/5 p-0.5 rounded-[4px_6px_3px_5px] border border-encre-noire/20 text-[10px] font-black mr-1">
                <button
                  type="button"
                  onClick={() => setViewModeOverride('manager')}
                  className={`px-2 py-1 rounded-[3px_5px_2px_4px] transition-all cursor-pointer ${
                    activeViewMode === 'manager'
                      ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                      : 'text-encre-noire/70 hover:text-encre-noire'
                  }`}
                  title={isPt ? "Exibir visão do gestor" : "Afficher la vue responsable"}
                >
                  {isPt ? "Visão Gestor" : "Vue Responsable"}
                </button>
                <button
                  type="button"
                  onClick={() => setViewModeOverride('member')}
                  className={`px-2 py-1 rounded-[3px_5px_2px_4px] transition-all cursor-pointer ${
                    activeViewMode === 'member'
                      ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                      : 'text-encre-noire/70 hover:text-encre-noire'
                  }`}
                  title={isPt ? "Exibir visão do membro / aluno" : "Afficher la vue adhérent / élève"}
                >
                  {isPt ? "Visão Aluno" : "Vue Adhérent"}
                </button>
              </div>
            )}

            {isCaReunions && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const formEl = document.getElementById('meeting-form-section');
                    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:brightness-110 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1 shrink-0"
                >
                  <span>➕</span>
                  <span>{t('governance.btnNewMeeting')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableEl = document.getElementById('meetings-studio-table');
                    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-amber-800/40 bg-amber-100 text-amber-900 hover:bg-amber-200 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1 shrink-0"
                >
                  <span>📜</span>
                  <span>{t('governance.btnReportsArchives')}</span>
                </button>
              </>
            )}

            {/* Bouton interactif Visite Guidée */}
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-amber-300 text-encre-noire hover:bg-amber-200 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
              title={t('poleGuides.tourTooltip') || "Lancer la visite guidée pas-à-pas de cet onglet"}
            >
              <span>🧭</span>
              <span>{t('poleGuides.tourBtn') || "Visite guidée"}</span>
              {isTourCompleted && (
                <span className="text-emerald-800 text-[9px] font-black" title="Visite déjà terminée">✓</span>
              )}
            </button>

            {/* Bouton de confirmation / masquage en Vert Validation officiel Cordel */}
            <button
              type="button"
              onClick={handleHide}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-900 bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5 shrink-0"
              title={t('poleGuides.hideTooltip') || "Masquer ce guide pour cet onglet (réouvrable via le bouton 💡 Aide du pôle)"}
            >
              <span>✓</span>
              <span>{t('common.understood') || "Compris / Masquer"}</span>
            </button>
          </div>
        </div>

        {/* Texte de description explicative */}
        <p className="text-xs text-encre-noire/90 font-medium leading-relaxed mb-3">
          {bannerDesc}
        </p>

        {/* 1. Rendu spécifique des Sections pour la Vue Adhérent (Double Vue) */}
        {hasDoubleView && Array.isArray(activeSubGuide?.sections) && activeSubGuide.sections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {isPt ? "Conselhos & Prática :" : "Conseils & Pratique :"}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {activeSubGuide.sections.map((sec, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col gap-1 bg-cordel-bg/60 p-2.5 rounded-[4px_6px_3px_5px] border border-encre-noire/15 shadow-xs"
                >
                  <h4 className="text-[11.5px] font-black text-cordel-wood flex items-center gap-1.5">
                    {resolveBilingual(sec.heading)}
                  </h4>
                  <p className="text-[11px] font-medium leading-snug text-encre-noire/90">
                    {resolveBilingual(sec.text)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Rendu spécifique du Workflow pour la Vue Gestionnaire (Double Vue) */}
        {hasDoubleView && Array.isArray(activeSubGuide?.workflowSteps) && activeSubGuide.workflowSteps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {isPt ? "Etapas do fluxo de trabalho :" : "Étapes du flux de travail :"}
            </span>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {activeSubGuide.workflowSteps.map((ws, idx) => (
                <li 
                  key={idx}
                  className="flex items-start gap-2.5 bg-cordel-bg/60 p-2.5 rounded-[4px_6px_3px_5px] border border-encre-noire/15 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-cordel-wood text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {ws.step || idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11.5px] font-black text-cordel-wood leading-tight">
                      {resolveBilingual(ws.title)}
                    </h4>
                    <p className="text-[11px] font-medium leading-snug text-encre-noire/90 mt-1">
                      {resolveBilingual(ws.desc)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 3. Tutoriels vidéo associés (Vue Gestionnaire) */}
        {hasDoubleView && Array.isArray(activeSubGuide?.videoTutorials) && activeSubGuide.videoTutorials.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/15 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
              <span>🎥</span>
              <span>{isPt ? "Tutoriais em vídeo :" : "Tutoriels vidéo :"}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeSubGuide.videoTutorials.map((tut) => (
                <span 
                  key={tut.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px_5px_3px_4px] bg-amber-100 text-amber-900 border border-amber-800/30 text-[10px] font-bold shadow-xs select-none"
                >
                  <span>▶️</span>
                  <span>{resolveBilingual(tut.label)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Rendu standard pour les guides classiques sans Double Vue */}
        {!hasDoubleView && Array.isArray(bannerSteps) && bannerSteps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/60 block mb-2">
              {t('poleGuides.stepsHeading') || "Étapes logiques à suivre :"}
            </span>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {bannerSteps.map((step, idx) => (
                <li 
                  key={idx}
                  className="flex items-start gap-2 bg-cordel-bg/60 p-2 rounded border border-encre-noire/15"
                >
                  <span className="w-4 h-4 rounded-full bg-cordel-wood text-white text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] font-medium leading-snug text-encre-noire/90">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Visite guidée pas-à-pas interactive Cordel */}
      {isTourOpen && (
        <PoleTourOverlay
          guide={tourGuide}
          tabId={currentTab}
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Bouton d'icône / déclencheur : InfoPoleHelpButton
 * 
 * S'intègre dans la barre d'onglets pour permettre à l'utilisateur
 * de réouvrir la bannière d'aide si elle a été masquée.
 * 
 * @param {string} currentPole - Identifiant du pôle actif
 * @param {string} currentTab - Identifiant de l'onglet actif
 */
export function InfoPoleHelpButton({ currentPole, currentTab }) {
  const { guide, isHidden, toggleBanner } = usePoleGuide(currentTab, currentPole);

  // Si aucun guide n'est disponible pour cet onglet, ne pas afficher le bouton
  if (!guide) return null;

  return (
    <button
      type="button"
      onClick={toggleBanner}
      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center p-0 rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer shrink-0 ${
        isHidden
          ? 'bg-amber-100/90 text-amber-900 border-amber-900/60 hover:bg-amber-200 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none'
          : 'bg-amber-300 text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
      }`}
      title={isHidden ? "💡 Afficher l'aide contextuelle de cet onglet" : "Masquer l'aide contextuelle"}
      aria-label="Aide contextuelle"
    >
      <span className="text-sm select-none">💡</span>
    </button>
  );
}
