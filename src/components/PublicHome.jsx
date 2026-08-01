import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { usePublicThemeContext } from './PublicThemeProvider';
import { usePublicEvents } from '../hooks/usePublicEvents';
import PublicEventCard from './public/PublicEventCard';
import PublicEventDetails from './public/PublicEventDetails';
import PublicPhotoGallery from './public/PublicPhotoGallery';
import PublicNewsletterForm from './public/PublicNewsletterForm';
import PublicRecruitmentSection from './public/PublicRecruitmentSection';
import PublicVieAssociativeSection from './public/PublicVieAssociativeSection';
import PublicProDocsSection from './public/PublicProDocsSection';
import PublicRichText from './public/PublicRichText';
import PublicSeoHead from './public/PublicSeoHead';
import PublicWatermarkLogo from './public/PublicWatermarkLogo';
import PublicMaintenancePage from './public/PublicMaintenancePage';
import PublicBookingModal from './public/PublicBookingModal';
import { canPreviewVitrineDraft } from '../utils/permissionUtils';

/**
 * Convertit une URL YouTube ou Vimeo classique en URL embed sécurisée pour iframe.
 */
const getEmbedVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    if (url.includes('youtube.com/watch')) {
      const parsedUrl = new URL(url);
      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      const videoId = parts[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    if (url.includes('vimeo.com/')) {
      const parts = url.split('vimeo.com/');
      const videoId = parts[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch (err) {
    console.warn("Format URL vidéo non reconnu :", url);
  }
  return null;
};

/**
 * Composant de la Page d'Accueil Vitrine Publique (One-Page) dynamique.
 * Alimenté par les paramètres publicTheme de Firestore et les événements publics réels.
 */
export default function PublicHome({ 
  groupId, 
  user, 
  profileData,
  permissionsMatrice,
  effectiveUserTags = [],
  isAdministrativeUser, 
  associationName, 
  branding, 
  onNavigateToApp, 
  onNavigateToLogin 
}) {
  const { publicTheme, loading: loadingTheme } = usePublicThemeContext();
  const { events: publicEvents, upcomingEvents = [], pastEvents = [], loading: loadingEvents } = usePublicEvents(groupId);
  const [selectedEventDetails, setSelectedEventDetails] = React.useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const logoSrc = branding?.logoUrl || publicTheme?.logoUrl || '';
  const groupTitle = associationName || publicTheme?.associationName || "Notre Association";

  const isPublished = publicTheme?.isPublished !== false;
  
  // Vérification de la permission dynamique de prévisualisation brouillon
  const userProfileToTest = profileData || {
    role: user ? (isAdministrativeUser ? 'admin' : 'membre') : null,
    isSystemAdmin: Boolean(isAdministrativeUser)
  };
  const canPreviewDraft = canPreviewVitrineDraft(userProfileToTest, permissionsMatrice, effectiveUserTags);
  const isAdminUser = Boolean(user && canPreviewDraft);

  // Publication rapide directe depuis la bannière d'avertissement
  const handleQuickPublish = async () => {
    if (!groupId) return;
    try {
      setPublishing(true);
      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        publicTheme: {
          ...publicTheme,
          isPublished: true
        }
      }, { merge: true });
    } catch (err) {
      console.error("Erreur lors de la publication rapide de la vitrine:", err);
    } finally {
      setPublishing(false);
    }
  };

  // ==========================================
  // ÉTAPE 1 : CHARGEMENT (Loading)
  // Tant que le thème de l'association est en cours de chargement depuis Firestore
  // ==========================================
  if (loadingTheme) {
    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ backgroundColor: 'var(--public-bg, #FAF6EE)', color: 'var(--public-text, #1C1917)' }}
      >
        <div className="relative w-14 h-14 animate-spin mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-amber-300/40 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-800 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
        <span className="font-black text-xs uppercase tracking-widest text-amber-900 animate-pulse">
          Chargement de la vitrine...
        </span>
      </div>
    );
  }

  // ==========================================
  // ÉTAPE 2 & 3A : VÉRIFICATION & MODE BROUILLON (Public bloqué)
  // Si isPublished === false ET que l'utilisateur n'est pas Admin -> Page "En construction"
  // ==========================================
  if (!isPublished && !isAdminUser) {
    return (
      <PublicMaintenancePage
        associationName={groupTitle}
        logoUrl={logoSrc}
        publicTheme={publicTheme}
        onOpenLogin={onNavigateToLogin}
      />
    );
  }

  // Récupération des contenus personnalisés depuis publicTheme et vitrineTexts
  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const heroImage = publicTheme?.publicHeroImage || '';
  const heroOverlayOpacity = publicTheme?.heroOverlayOpacity !== undefined ? Number(publicTheme.heroOverlayOpacity) : 25;
  const catchphrase = publicTheme?.publicCatchphrase 
    || publicTheme?.heroCatchphrase 
    || vitrineTexts?.accrocheHero 
    || vitrineTexts?.accrochePresentation 
    || "Découvrez la puissance du Maracatu, la richesse de nos rythmes traditionnels et la ferveur de nos prestations scéniques.";
  const descriptionText = publicTheme?.publicDescription || "Notre collectif rassemble des passionnés de percussions et de culture brésilienne. À travers les Alfaias, Agbês, Caixas et Gonguês, nous faisons vibrer l'héritage vivant du Maracatu de Baque Virado.";
  const embedVideoUrl = getEmbedVideoUrl(publicTheme?.publicVideoLink);

  // Titres et accroches dynamiques des sections (avec fallbacks)
  const titrePresentation = vitrineTexts.titrePresentation || "Qui sommes-nous ?";
  const titreAgenda = vitrineTexts.titreAgenda || "Prochaines Dates & Prestations";
  const accrocheAgenda = vitrineTexts.accrocheAgenda || "Événements ouverts au public. Venez nous rencontrer !";
  const badgeProgrammer = vitrineTexts.badgeProgrammer || "Espace Organisateur & Programmateurs";
  const titreProgrammer = vitrineTexts.titreProgrammer || "Nous Programmer / Fiche Technique";
  const accrocheProgrammer = vitrineTexts.accrocheProgrammer || "Toutes les informations pratiques pour accueillir notre groupe lors de vos festivals, défilés ou événements.";
  const titreFormats = vitrineTexts.titreFormats || "Nos Formats de Prestations";
  const titreFicheTechnique = vitrineTexts.titreFicheTechnique || "Fiche technique et besoin logistique";
  const titreContactReseaux = vitrineTexts.titreContactReseaux || "Contact & Réseaux Sociaux";
  const accrocheContactReseaux = vitrineTexts.accrocheContactReseaux || "Une question, un projet d'événement ou une demande de prestation ? Contactez-nous directement ou suivez l'actualité de la troupe sur nos réseaux sociaux !";
  const boutonContactEmail = vitrineTexts.boutonContactEmail || "Contactez-nous pour programmer";
  const boutonHeroProgrammer = vitrineTexts.boutonHeroProgrammer || "Nous Programmer";

  // Données Espace Organisateur
  const enableOrganizerSection = publicTheme?.enableOrganizerSection !== false;
  const technicalSheet = publicTheme?.publicTechnicalSheet || "• Effectif : 10 à 20 musiciens + 1 Mestre\n• Logistique : Loge fermée avec point d'eau & parking convoi\n• Sonorisation : Autonomie totale en défilé de rue, possibilité de reprise micro pour scène.";
  const performanceFormats = publicTheme?.publicPerformanceFormats || '';
  const dossierProPdfUrl = publicTheme?.dossierProPdfUrl || '';
  const contactEmail = publicTheme?.publicContactEmail || '';
  const contactPhone = publicTheme?.publicContactPhone || '';
  const socialLinks = publicTheme?.socialLinks || {};

  // Configuration dynamique des Boutons Hero CTA & Newsletter
  const heroCtaText = publicTheme?.heroCtaText?.trim() || "Prochaines dates";
  const heroCtaLink = publicTheme?.heroCtaLink?.trim() || "#agenda";
  const showHeroCtaIcon = publicTheme?.showHeroCtaIcon !== false;
  const heroCtaIcon = publicTheme?.heroCtaIcon !== undefined ? publicTheme.heroCtaIcon : "📅";
  const afficherNewsletter = publicTheme?.afficherNewsletter !== false;

  // Défilement fluide vers une section
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HelmetProvider>
      {/* Balises SEO & Référencement dynamique avec injection forcée O Girador */}
      <PublicSeoHead 
        publicTheme={publicTheme} 
        associationName={groupTitle} 
        branding={branding} 
      />

      {/* Filigrane (Watermark) fixe et centré du logo de l'association */}
      <PublicWatermarkLogo logoSrc={logoSrc} altText={groupTitle} />

      {/* Bannière Flottante Mode Brouillon (Visible uniquement par l'Admin quand isPublished === false) */}
      {!isPublished && isAdminUser && (
        <div className="bg-gradient-to-r from-red-800 via-amber-700 to-red-900 text-white px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs font-bold sticky top-0 z-[60] select-none border-b-2 border-encre-noire animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base animate-pulse">⚠️</span>
            <span>
              <strong>Mode Brouillon actif :</strong> La vitrine est actuellement invisible pour le grand public. Seuls les administrateurs connectés peuvent la prévisualiser.
            </span>
          </div>
          <button
            type="button"
            disabled={publishing}
            onClick={handleQuickPublish}
            className="bg-white text-stone-950 font-black uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-md shadow-xs hover:bg-amber-300 active:scale-95 transition-all cursor-pointer shrink-0 border border-encre-noire flex items-center gap-1"
          >
            <span>{publishing ? 'Publication...' : '🌍 Publier le site maintenant'}</span>
          </button>
        </div>
      )}

      <div 
        className="min-h-screen flex flex-col transition-colors duration-300 selection:bg-stone-200 public-paper-bg"
        style={{ 
          fontFamily: 'var(--public-font-body, sans-serif)',
          backgroundColor: 'var(--public-bg, #FAF6EE)',
          color: 'var(--public-text, #1C1917)'
        }}
      >
      {/* ==========================================
          EN-TÊTE / NAVIGATION (STICKY BAR)
         ========================================== */}
      <header className="sticky top-0 z-50 bg-[#faf6ee]/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Titre */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => scrollToSection('hero')}
          >
            {logoSrc && (
              <img 
                src={logoSrc} 
                alt={`Logo ${groupTitle}`} 
                className="w-9 h-9 object-contain select-none transition-transform group-hover:scale-105"
              />
            )}
            <span 
              className="text-lg font-bold tracking-tight"
              style={{ 
                fontFamily: 'var(--public-font-heading, sans-serif)',
                color: 'var(--public-primary, #D32F2F)' 
              }}
            >
              {groupTitle}
            </span>
          </div>

          {/* Navigation Dynamique Ordinateur */}
          <nav className="hidden md:flex items-center gap-5">
            {publicTheme?.afficherPresentation !== false && (
              <button
                type="button"
                onClick={() => scrollToSection('presentation')}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[var(--public-primary,#D32F2F)] transition-colors cursor-pointer"
              >
                {titrePresentation}
              </button>
            )}
            {publicTheme?.afficherRecrutement !== false && (
              <button
                type="button"
                onClick={() => scrollToSection('recrutement')}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[var(--public-primary,#D32F2F)] transition-colors cursor-pointer"
              >
                {vitrineTexts.titreRecrutement || publicTheme?.titreRecrutement || "Recrutement"}
              </button>
            )}
            {publicTheme?.afficherGalerie !== false && (
              <button
                type="button"
                onClick={() => scrollToSection('galerie')}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[var(--public-primary,#D32F2F)] transition-colors cursor-pointer"
              >
                {vitrineTexts.titreGalerie || "Galerie"}
              </button>
            )}
            {publicTheme?.afficherAgenda !== false && (
              <button
                type="button"
                onClick={() => scrollToSection('agenda')}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[var(--public-primary,#D32F2F)] transition-colors cursor-pointer"
              >
                {titreAgenda}
              </button>
            )}
            {enableOrganizerSection && (
              <button
                type="button"
                onClick={() => scrollToSection('programmer')}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-[var(--public-primary,#D32F2F)] transition-colors cursor-pointer"
              >
                {titreProgrammer}
              </button>
            )}
          </nav>

          {/* Espace Membre & Bouton Menu Mobile */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToApp || onNavigateToLogin}
              className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-md border border-stone-300 text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <span>🔒 Espace Membre</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-200 transition-all cursor-pointer flex items-center justify-center w-9 h-9 font-black text-sm"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-[#faf6ee] p-4 flex flex-col gap-3 shadow-xl animate-fade-in text-left">
            {publicTheme?.afficherPresentation !== false && (
              <button
                type="button"
                onClick={() => { scrollToSection('presentation'); setMobileMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[var(--public-primary,#D32F2F)] text-left py-1.5 border-b border-stone-200/60 cursor-pointer"
              >
                👉 {titrePresentation}
              </button>
            )}
            {publicTheme?.afficherRecrutement !== false && (
              <button
                type="button"
                onClick={() => { scrollToSection('recrutement'); setMobileMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[var(--public-primary,#D32F2F)] text-left py-1.5 border-b border-stone-200/60 cursor-pointer"
              >
                📣 {vitrineTexts.titreRecrutement || publicTheme?.titreRecrutement || "Recrutement"}
              </button>
            )}
            {publicTheme?.afficherGalerie !== false && (
              <button
                type="button"
                onClick={() => { scrollToSection('galerie'); setMobileMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[var(--public-primary,#D32F2F)] text-left py-1.5 border-b border-stone-200/60 cursor-pointer"
              >
                📸 {vitrineTexts.titreGalerie || "Galerie Photos"}
              </button>
            )}
            {publicTheme?.afficherAgenda !== false && (
              <button
                type="button"
                onClick={() => { scrollToSection('agenda'); setMobileMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[var(--public-primary,#D32F2F)] text-left py-1.5 border-b border-stone-200/60 cursor-pointer"
              >
                📅 {titreAgenda}
              </button>
            )}
            {enableOrganizerSection && (
              <button
                type="button"
                onClick={() => { scrollToSection('programmer'); setMobileMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[var(--public-primary,#D32F2F)] text-left py-1.5 cursor-pointer"
              >
                🎪 {titreProgrammer}
              </button>
            )}
          </div>
        )}
      </header>

      {/* ==========================================
          BLOC 1 - HERO SECTION (HAUT)
         ========================================== */}
      <section 
        id="hero"
        className="relative overflow-hidden min-h-[60vh] sm:min-h-[72vh] py-24 sm:py-36 md:py-44 flex items-center justify-center bg-cover bg-center border-b border-stone-200/60 transition-all duration-300"
        style={{
          backgroundImage: heroImage ? `url(${heroImage})` : 'none'
        }}
      >
        {/* Filtre assombrissant (overlay) à opacité dynamique réglable dans l'administration */}
        {heroImage && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 z-0"
            style={{ opacity: (heroOverlayOpacity / 100) }}
          />
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-7 relative z-10 w-full">
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight drop-shadow-xl"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: heroImage ? '#FFFFFF' : 'var(--public-primary, #D32F2F)',
              textShadow: heroImage ? '0 3px 12px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)' : 'none'
            }}
          >
            {groupTitle}
          </h1>

          <p 
            className={heroImage ? "text-base sm:text-xl text-white max-w-2xl leading-relaxed font-semibold drop-shadow-md" : "text-base sm:text-xl text-stone-700 max-w-2xl leading-relaxed font-medium"}
            style={{ 
              fontFamily: 'var(--public-font-body, sans-serif)',
              textShadow: heroImage ? '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)' : 'none'
            }}
          >
            {catchphrase}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {/* Bouton d'Action Principal (Hero CTA) 100% configurable */}
            {heroCtaLink && (
              heroCtaLink.startsWith('#') ? (
                <button
                  type="button"
                  onClick={() => scrollToSection(heroCtaLink.substring(1))}
                  className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider rounded-lg shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                    color: 'var(--public-btn-text, #FFFFFF)',
                    fontFamily: 'var(--public-font-heading, sans-serif)'
                  }}
                >
                  {showHeroCtaIcon && heroCtaIcon && <span>{heroCtaIcon}</span>}
                  <span>{heroCtaText}</span>
                </button>
              ) : (
                <a
                  href={heroCtaLink}
                  target={heroCtaLink.startsWith('http') ? "_blank" : "_self"}
                  rel={heroCtaLink.startsWith('http') ? "noopener noreferrer" : undefined}
                  className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider rounded-lg shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                    color: 'var(--public-btn-text, #FFFFFF)',
                    fontFamily: 'var(--public-font-heading, sans-serif)'
                  }}
                >
                  {showHeroCtaIcon && heroCtaIcon && <span>{heroCtaIcon}</span>}
                  <span>{heroCtaText}</span>
                </a>
              )
            )}

            {/* Bouton Secondaire Espace Organisateur (si activé) */}
            {enableOrganizerSection && (
              <button
                type="button"
                onClick={() => scrollToSection('programmer')}
                className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white rounded-lg shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--public-secondary, #1976D2)',
                  fontFamily: 'var(--public-font-heading, sans-serif)'
                }}
              >
                <span>🎪</span>
                <span>{boutonHeroProgrammer}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          BLOC 2 - PRÉSENTATION ("QUI SOMMES-NOUS ?")
         ========================================== */}
      <section id="presentation" className="py-16 sm:py-20 bg-[#faf6ee]/70 backdrop-blur-xs border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 
              className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase"
              style={{ 
                fontFamily: 'var(--public-font-heading, sans-serif)',
                color: 'var(--public-primary, #D32F2F)' 
              }}
            >
              {titrePresentation}
            </h2>
            <div 
              className="w-20 h-1 rounded-full"
              style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
            ></div>
          </div>

          {descriptionText && (
            <PublicRichText 
              content={descriptionText}
              className="text-base sm:text-lg lg:text-xl leading-relaxed text-stone-700 text-justify sm:text-center max-w-5xl w-full mx-auto px-2 sm:px-4 font-medium"
              style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
            />
          )}

          {embedVideoUrl ? (
            <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-stone-200 bg-black aspect-video">
              <iframe
                src={embedVideoUrl}
                title="Vidéo de présentation"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ==========================================
          BLOC VIE ASSOCIATIVE & QUOTIDIEN
         ========================================== */}
      <PublicVieAssociativeSection publicTheme={publicTheme} />

      {/* ==========================================
          BLOC RECRUTEMENT DYNAMIQUE & FORMULES
         ========================================== */}
      <PublicRecruitmentSection publicTheme={publicTheme} />

      {/* ==========================================
          GALERIE PHOTOS & CARROUSEL ("EN IMAGES")
         ========================================== */}
      {publicTheme?.afficherGalerie !== false && (
        <PublicPhotoGallery photos={publicTheme?.galleryPhotos} publicTheme={publicTheme} />
      )}

      {/* ==========================================
          BLOC 3 - AGENDA PUBLIC (PROCHAINES DATES & PRESTATIONS PASSÉES SOUVENIRS)
         ========================================== */}
      {publicTheme?.afficherAgenda !== false && (
        <section id="agenda" className="py-16 bg-stone-50 border-b border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-12 text-left">
            <div className="text-center flex flex-col items-center gap-3">
              <h2 
                className="text-3xl font-extrabold tracking-tight uppercase"
                style={{ 
                  fontFamily: 'var(--public-font-heading, sans-serif)',
                  color: 'var(--public-primary, #D32F2F)' 
                }}
              >
                {titreAgenda}
              </h2>
              <div 
                className="w-16 h-1 rounded-full"
                style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
              ></div>
              <p className="text-sm text-stone-500 max-w-md">
                {accrocheAgenda}
              </p>
            </div>

            {loadingEvents ? (
              <div className="py-12 text-center text-xs uppercase font-bold tracking-widest text-stone-400 animate-pulse">
                ⏳ Chargement des dates publiques...
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {/* 1. Événements à venir */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2 border-b border-stone-200 pb-2">
                    <span>🎺 Prochaines Dates</span>
                  </h3>

                  {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingEvents.map((evt) => (
                        <PublicEventCard
                          key={evt.id}
                          event={evt}
                          isPast={false}
                          onClickDetails={(selectedEvt) => setSelectedEventDetails(selectedEvt)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 px-6 rounded-xl border border-dashed border-stone-300 bg-white text-center flex flex-col items-center gap-2 max-w-md mx-auto">
                      <span className="text-2xl">🎺</span>
                      <p className="text-xs font-bold text-stone-600">
                        Aucune prochaine date programmée pour le moment.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Dernières prestations & Souvenirs (Photos / Vidéos) */}
                {pastEvents.length > 0 && (
                  <div className="flex flex-col gap-4 pt-4 border-t border-stone-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200 pb-2">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                        <span>📸 Dernières Prestations & Souvenirs</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-stone-500">
                        Partagez vos photos et vidéos des événements passés !
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pastEvents.map((evt) => (
                        <PublicEventCard
                          key={evt.id}
                          event={evt}
                          isPast={true}
                          onClickDetails={(selectedEvt) => setSelectedEventDetails(selectedEvt)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==========================================
          BLOC 4 - ESPACE ORGANISATEUR & FICHE TECHNIQUE ("NOUS PROGRAMMER")
         ========================================== */}
      {enableOrganizerSection && (
        <section 
          id="programmer" 
          className="py-16 border-b border-stone-200/60 relative overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--public-secondary, #1976D2) 6%, white 94%)'
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-12">
            {/* En-tête de section */}
            <div className="text-center flex flex-col items-center gap-3">
              <span 
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded text-white shadow-xs"
                style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
              >
                {badgeProgrammer}
              </span>
              <h2 
                className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase"
                style={{ 
                  fontFamily: 'var(--public-font-heading, sans-serif)',
                  color: 'var(--public-primary, #D32F2F)' 
                }}
              >
                {titreProgrammer}
              </h2>
              <div 
                className="w-16 h-1 rounded-full"
                style={{ backgroundColor: 'var(--public-primary, #D32F2F)' }}
              ></div>
              <p className="text-sm text-stone-600 max-w-xl">
                {accrocheProgrammer}
              </p>
            </div>

            {/* Grille dynamique (2 ou 3 colonnes sur PC selon l'activation de la Newsletter) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${afficherNewsletter ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
              {/* Partie Gauche : Nos Formats de Prestations */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
                <h3 
                  className="text-xl font-bold border-b border-stone-100 pb-3 flex items-center gap-2"
                  style={{ 
                    fontFamily: 'var(--public-font-heading, sans-serif)',
                    color: 'var(--public-primary, #D32F2F)' 
                  }}
                >
                  <span>🥁 {titreFormats}</span>
                </h3>

                {performanceFormats ? (
                  <PublicRichText 
                    content={performanceFormats}
                    className="text-xs sm:text-sm text-stone-700 leading-relaxed"
                    style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
                  />
                ) : (
                  <ul className="space-y-4 text-xs sm:text-sm text-stone-700">
                    <li className="flex items-start gap-3">
                      <span 
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
                      ></span>
                      <div>
                        <strong className="text-stone-900 block font-bold">Festivals & Fêtes de Ville</strong>
                        Défilés de rue déambulatoires, ouvertures de carnivals et passages scéniques à haute énergie.
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span 
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
                      ></span>
                      <div>
                        <strong className="text-stone-900 block font-bold">Animations Culturelles & Associatives</strong>
                        Parades populaires, inaugurations et moments de fête fédérateurs.
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span 
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
                      ></span>
                      <div>
                        <strong className="text-stone-900 block font-bold">Événements Privés & Sur-Mesure</strong>
                        Prestations adaptées à vos besoins logistiques et horaires de passage.
                      </div>
                    </li>
                  </ul>
                )}
              </div>

              {/* Partie Droite : Contact & Réseaux Sociaux */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <h3 
                    className="text-xl font-bold border-b border-stone-100 pb-3 flex items-center gap-2"
                    style={{ 
                      fontFamily: 'var(--public-font-heading, sans-serif)',
                      color: 'var(--public-primary, #D32F2F)' 
                    }}
                  >
                    <span>📞 {titreContactReseaux}</span>
                  </h3>

                  <p 
                    className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed"
                    style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
                  >
                    {accrocheContactReseaux}
                  </p>

                  {/* Badges / Boutons des Réseaux Sociaux Actifs */}
                  {Boolean(
                    socialLinks.facebook || 
                    socialLinks.instagram || 
                    socialLinks.youtube || 
                    socialLinks.tiktok || 
                    socialLinks.snapchat || 
                    socialLinks.whatsapp || 
                    socialLinks.linkedin || 
                    socialLinks.spotify
                  ) && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Nos Réseaux Sociaux
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.facebook && (
                          <a
                            href={socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>📘</span>
                            <span>Facebook</span>
                          </a>
                        )}

                        {socialLinks.instagram && (
                          <a
                            href={socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-pink-50 text-pink-800 border border-pink-200 hover:bg-pink-600 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>📸</span>
                            <span>Instagram</span>
                          </a>
                        )}

                        {socialLinks.youtube && (
                          <a
                            href={socialLinks.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-800 border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>🎬</span>
                            <span>YouTube</span>
                          </a>
                        )}

                        {socialLinks.tiktok && (
                          <a
                            href={socialLinks.tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-stone-100 text-stone-900 border border-stone-300 hover:bg-stone-900 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>🎵</span>
                            <span>TikTok</span>
                          </a>
                        )}

                        {socialLinks.snapchat && (
                          <a
                            href={socialLinks.snapchat}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-900 border border-yellow-300 hover:bg-yellow-400 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>👻</span>
                            <span>Snapchat</span>
                          </a>
                        )}

                        {socialLinks.whatsapp && (
                          <a
                            href={socialLinks.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {socialLinks.linkedin && (
                          <a
                            href={socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-700 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>💼</span>
                            <span>LinkedIn</span>
                          </a>
                        )}

                        {socialLinks.spotify && (
                          <a
                            href={socialLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-800 border border-green-200 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
                          >
                            <span>🎧</span>
                            <span>Spotify</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloc de Contact Direct & Appel à l'action Booking */}
                <div className="border-t border-stone-100 pt-5 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full py-3.5 px-6 text-sm font-bold uppercase tracking-wider rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                      color: 'var(--public-btn-text, #FFFFFF)',
                      fontFamily: 'var(--public-font-heading, sans-serif)'
                    }}
                  >
                    <span>📅</span>
                    <span>Demander un Devis / Nous Programmer</span>
                  </button>

                  <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 text-xs text-stone-600 font-medium pt-1">
                    {contactEmail && (
                      <a href={`mailto:${contactEmail}`} className="truncate hover:underline">
                        📧 {contactEmail}
                      </a>
                    )}
                    {contactPhone && (
                      <a href={`tel:${contactPhone}`} className="hover:underline font-semibold">
                        📞 {contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Partie Droite (3e Bloc) : Infolettre & Actualités */}
              <PublicNewsletterForm groupId={groupId} variant="card" publicTheme={publicTheme} />
            </div>

            {/* Encart Espace Pro & Organisateurs (4 Documents Téléchargeables) */}
            <PublicProDocsSection publicTheme={publicTheme} />
          </div>
        </section>
      )}

      {/* ==========================================
          BLOC 5 - PIED DE PAGE (FOOTER)
         ========================================== */}
      <footer className="mt-auto bg-stone-900 text-stone-300 py-12 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          {/* Identité */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              {logoSrc && (
                <img 
                  src={logoSrc} 
                  alt={`Logo ${groupTitle}`} 
                  className="w-7 h-7 object-contain select-none"
                />
              )}
              <span 
                className="text-base font-bold tracking-tight text-white"
                style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
              >
                {groupTitle}
              </span>
            </div>
          </div>

          {/* Réseaux sociaux dynamiques & Mention */}
          <div className="flex flex-col items-center md:items-end gap-3">
            {Boolean(
              socialLinks.facebook || 
              socialLinks.instagram || 
              socialLinks.youtube || 
              socialLinks.tiktok || 
              socialLinks.snapchat || 
              socialLinks.whatsapp || 
              socialLinks.linkedin || 
              socialLinks.spotify
            ) ? (
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 text-xs font-semibold text-stone-400">
                {socialLinks.facebook && (
                  <a 
                    href={socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>📘 Facebook</span>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>📸 Instagram</span>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>🎬 YouTube</span>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a 
                    href={socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>🎵 TikTok</span>
                  </a>
                )}
                {socialLinks.snapchat && (
                  <a 
                    href={socialLinks.snapchat} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>👻 Snapchat</span>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a 
                    href={socialLinks.whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a 
                    href={socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>💼 LinkedIn</span>
                  </a>
                )}
                {socialLinks.spotify && (
                  <a 
                    href={socialLinks.spotify} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>🎧 Spotify</span>
                  </a>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-4 text-xs">
              <span className="text-stone-500">
                Propulsé par <strong className="text-stone-300 font-semibold">O Girador</strong>
              </span>
              
              <button
                type="button"
                onClick={onNavigateToApp || onNavigateToLogin}
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
              >
                🔒 Accès Membre
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modale de Détails Publics de l'Événement */}
      {selectedEventDetails && (
        <PublicEventDetails
          event={selectedEventDetails}
          onClose={() => setSelectedEventDetails(null)}
        />
      )}

      {/* Modale Publique de Demande de Prestation / Booking */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        groupId={groupId}
        associationName={groupTitle}
        publicTheme={publicTheme}
      />
      </div>
    </HelmetProvider>
  );
}
