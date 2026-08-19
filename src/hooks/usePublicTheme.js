import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_PUBLIC_THEME, DEFAULT_VITRINE_TEXTS } from './useAssociationSettings';

/**
 * Utilitaire d'aide à la construction d'un objet thème public à partir d'un snapshot Firestore
 */
const buildThemeData = (data) => {
  const officialEmail = data.emailOfficiel || data.email || '';
  const officialPhone = data.telephone || data.phone || '';

  return {
    ...DEFAULT_PUBLIC_THEME,
    ...data.publicTheme,
    associationName: data.nom || data.associationName || DEFAULT_PUBLIC_THEME.associationName || '',
    logoUrl: data.branding?.logoUrl || data.logoUrl || '',
    bureauMembres: Array.isArray(data.bureauMembres) ? data.bureauMembres : [],
    directionArtistique: Array.isArray(data.directionArtistique) ? data.directionArtistique : [],
    afficherMestriaPV: Boolean(data.afficherMestriaPV),
    officialEmail,
    officialPhone,
    publicContactEmail: data.publicTheme?.publicContactEmail?.trim() || officialEmail,
    publicContactPhone: data.publicTheme?.publicContactPhone?.trim() || officialPhone,
    vitrineTexts: {
      ...DEFAULT_VITRINE_TEXTS,
      ...(data.publicTheme?.vitrineTexts || {})
    },
    socialLinks: {
      ...DEFAULT_PUBLIC_THEME.socialLinks,
      ...(data.publicTheme?.socialLinks || {})
    },
    galleryPhotos: Array.isArray(data.publicTheme?.galleryPhotos) 
      ? data.publicTheme.galleryPhotos 
      : DEFAULT_PUBLIC_THEME.galleryPhotos,
    publicPerformanceFormats: data.publicTheme?.publicPerformanceFormats || '',
    brevoApiKey: data.publicTheme?.brevoApiKey || '',
    brevoListId: data.publicTheme?.brevoListId || '',
    dossierPresentationUrl: data.publicTheme?.dossierPresentationUrl || data.publicTheme?.dossierProPdfUrl || '',
    ficheTechniqueUrl: data.publicTheme?.ficheTechniqueUrl || '',
    planSceneUrl: data.publicTheme?.planSceneUrl || '',
    kitPresseUrl: data.publicTheme?.kitPresseUrl || '',
    texteVieAssociative: data.publicTheme?.texteVieAssociative || '',
    formulesRecrutement: Array.isArray(data.publicTheme?.formulesRecrutement)
      ? data.publicTheme.formulesRecrutement
      : (data.publicTheme?.formulesRecrutement || []),
    isPublished: data.publicTheme?.isPublished === true, // Stricte vérification boolean !
    afficherVieAssociative: data.publicTheme?.afficherVieAssociative !== false,
    afficherRecrutement: data.publicTheme?.afficherRecrutement !== false,
    afficherGalerie: data.publicTheme?.afficherGalerie !== false,
    afficherAgenda: data.publicTheme?.afficherAgenda !== false,
    afficherNewsletter: data.publicTheme?.afficherNewsletter !== false,
    seoTitle: data.publicTheme?.seoTitle || '',
    seoDescription: data.publicTheme?.seoDescription || '',
    seoKeywords: data.publicTheme?.seoKeywords || '',
    titreRecrutement: data.publicTheme?.titreRecrutement || "Rejoignez la troupe !",
    texteRecrutement: data.publicTheme?.texteRecrutement || '',
    lienRecrutement: data.publicTheme?.lienRecrutement || '',
    texteBoutonRecrutement: data.publicTheme?.texteBoutonRecrutement || "S'inscrire sur HelloAsso",
    showRecrutementCtaIcon: data.publicTheme?.showRecrutementCtaIcon !== false,
    activerHelloAssoRecrutement: data.publicTheme?.activerHelloAssoRecrutement !== false,
    heroCtaText: data.publicTheme?.heroCtaText || "Prochaines dates",
    heroCtaLink: data.publicTheme?.heroCtaLink || "#agenda",
    showHeroCtaIcon: data.publicTheme?.showHeroCtaIcon !== false,
    heroCtaIcon: data.publicTheme?.heroCtaIcon !== undefined ? data.publicTheme.heroCtaIcon : "📅",
    primaryColor: data.publicTheme?.primaryColor || DEFAULT_PUBLIC_THEME.primaryColor,
    secondaryColor: data.publicTheme?.secondaryColor || DEFAULT_PUBLIC_THEME.secondaryColor,
    headingFont: data.publicTheme?.headingFont || DEFAULT_PUBLIC_THEME.headingFont,
    bodyFont: data.publicTheme?.bodyFont || DEFAULT_PUBLIC_THEME.bodyFont
  };
};

export function usePublicTheme(groupId, themeOverride = null) {
  const [publicTheme, setPublicTheme] = useState(themeOverride || DEFAULT_PUBLIC_THEME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Écoute en temps réel du document Firestore de l'association si groupId fourni et pas d'override
  useEffect(() => {
    if (themeOverride) {
      setPublicTheme(themeOverride);
      setLoading(false);
      return;
    }

    setLoading(true);

    const tryFetchDefaultAssociation = async () => {
      try {
        const q = query(collection(db, 'associations'), limit(1));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const firstDocData = querySnap.docs[0].data();
          setPublicTheme(buildThemeData(firstDocData));
        } else {
          setPublicTheme(DEFAULT_PUBLIC_THEME);
        }
      } catch (err) {
        console.error("usePublicTheme - Erreur lors de la récupération de l'association par défaut :", err);
        setPublicTheme(DEFAULT_PUBLIC_THEME);
      } finally {
        setLoading(false);
      }
    };

    if (!groupId) {
      tryFetchDefaultAssociation();
      return;
    }

    const assocRef = doc(db, 'associations', groupId);

    const unsubscribe = onSnapshot(
      assocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPublicTheme(buildThemeData(data));
          setError(null);
        } else {
          // Si l'association spécifiée par groupId n'existe pas, on renvoie une erreur pour afficher 404
          setError('NOT_FOUND');
        }
        setLoading(false);
      },
      (err) => {
        console.error("usePublicTheme - Erreur lors de l'écoute Firestore :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, themeOverride]);

  // 2. Injection dynamique des balises <link> (Google Fonts) et <style> (Variables CSS) dans le DOM
  useEffect(() => {
    if (!publicTheme) return;

    const { primaryColor, secondaryColor, backgroundColor, textColor, buttonBgColor, buttonTextColor, headingFont, bodyFont } = publicTheme;

    // A. Injection du tag <link> Google Fonts dans le <head>
    const cleanHeadingFont = (headingFont || DEFAULT_PUBLIC_THEME.headingFont).trim();
    const cleanBodyFont = (bodyFont || DEFAULT_PUBLIC_THEME.bodyFont).trim();

    // Construction de l'URL Google Fonts optimisée (en excluant les polices locales comme 'Cactus')
    const externalFonts = [cleanHeadingFont, cleanBodyFont]
      .filter((font, index, self) => font && font.toLowerCase() !== 'cactus' && self.indexOf(font) === index); // Exclut 'Cactus' (police locale) et supprime les doublons

    if (externalFonts.length > 0) {
      const fontsParam = externalFonts
        .map(font => `family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800`)
        .join('&');

      const fontsUrl = `https://fonts.googleapis.com/css2?${fontsParam}&display=swap`;

      let fontLinkElement = document.getElementById('public-google-fonts');
      if (!fontLinkElement) {
        fontLinkElement = document.createElement('link');
        fontLinkElement.id = 'public-google-fonts';
        fontLinkElement.rel = 'stylesheet';
        document.head.appendChild(fontLinkElement);
      }
      if (fontLinkElement.href !== fontsUrl) {
        fontLinkElement.href = fontsUrl;
      }
    }

    // B. Injection de la balise <style> avec les variables CSS sémantiques
    const cssRules = `
      :root, [data-public-theme] {
        --public-primary: ${primaryColor || DEFAULT_PUBLIC_THEME.primaryColor};
        --public-secondary: ${secondaryColor || DEFAULT_PUBLIC_THEME.secondaryColor};
        --public-bg: ${backgroundColor || '#FAF6EE'};
        --public-text: ${textColor || '#1C1917'};
        --public-btn-bg: ${buttonBgColor || primaryColor || '#D32F2F'};
        --public-btn-text: ${buttonTextColor || '#FFFFFF'};
        --public-font-heading: '${cleanHeadingFont}', sans-serif;
        --public-font-body: '${cleanBodyFont}', sans-serif;
      }
    `;

    let styleElement = document.getElementById('public-theme-variables');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'public-theme-variables';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = cssRules;

    // C. Application directe sur documentElement pour réactivité instantanée
    document.documentElement.style.setProperty('--public-primary', primaryColor || DEFAULT_PUBLIC_THEME.primaryColor);
    document.documentElement.style.setProperty('--public-secondary', secondaryColor || DEFAULT_PUBLIC_THEME.secondaryColor);
    document.documentElement.style.setProperty('--public-font-heading', `'${cleanHeadingFont}', sans-serif`);
    document.documentElement.style.setProperty('--public-font-body', `'${cleanBodyFont}', sans-serif`);

  }, [publicTheme]);

  return {
    publicTheme,
    loading,
    error
  };
}
