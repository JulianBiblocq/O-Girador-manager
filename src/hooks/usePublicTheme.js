import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_PUBLIC_THEME, DEFAULT_VITRINE_TEXTS } from './useAssociationSettings';

/**
 * Hook personnalisé d'injection dynamique du thème public (vitrine marque blanche).
 * 
 * Il s'abonne aux données Firestore de l'association (via groupId) ou utilise un thème passé en paramètre,
 * puis injecte dynamiquement dans le DOM :
 * 1. Le tag <link> de Google Fonts dans le <head> pour les deux polices sélectionnées.
 * 2. Une balise <style> ainsi que des variables CSS natives sur le root/DOM :
 *    - --public-primary
 *    - --public-secondary
 *    - --public-font-heading
 *    - --public-font-body
 * 
 * @param {string} groupId - L'identifiant Firestore de l'association.
 * @param {Object} [themeOverride] - Surcharge optionnelle du thème pour prévisualisation directe.
 * @returns {{ publicTheme: Object, loading: boolean, error: Error|null }}
 */
export function usePublicTheme(groupId, themeOverride = null) {
  const [publicTheme, setPublicTheme] = useState(themeOverride || DEFAULT_PUBLIC_THEME);
  const [loading, setLoading] = useState(!themeOverride && !!groupId);
  const [error, setError] = useState(null);

  // 1. Écoute en temps réel du document Firestore de l'association si groupId fourni et pas d'override
  useEffect(() => {
    if (themeOverride) {
      setPublicTheme(themeOverride);
      setLoading(false);
      return;
    }

    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const assocRef = doc(db, 'associations', groupId);

    const unsubscribe = onSnapshot(
      assocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.publicTheme) {
            setPublicTheme({
              ...DEFAULT_PUBLIC_THEME,
              ...data.publicTheme,
              // Textes et titres dynamiques avec fallback
              vitrineTexts: {
                ...DEFAULT_VITRINE_TEXTS,
                ...(data.publicTheme?.vitrineTexts || {})
              },
              // Fusion dynamique des liens de réseaux sociaux
              socialLinks: {
                ...DEFAULT_PUBLIC_THEME.socialLinks,
                ...(data.publicTheme?.socialLinks || {})
              },
              // Galerie photos de la vitrine sous forme de tableau
              galleryPhotos: Array.isArray(data.publicTheme?.galleryPhotos) 
                ? data.publicTheme.galleryPhotos 
                : DEFAULT_PUBLIC_THEME.galleryPhotos,
              // Formats de prestations personnalisables
              publicPerformanceFormats: data.publicTheme?.publicPerformanceFormats || '',
              // Integration Brevo API
              brevoApiKey: data.publicTheme?.brevoApiKey || '',
              brevoListId: data.publicTheme?.brevoListId || '',
              // Documents Espace Pro (Organisateurs / Presse)
              dossierPresentationUrl: data.publicTheme?.dossierPresentationUrl || data.publicTheme?.dossierProPdfUrl || '',
              ficheTechniqueUrl: data.publicTheme?.ficheTechniqueUrl || '',
              planSceneUrl: data.publicTheme?.planSceneUrl || '',
              kitPresseUrl: data.publicTheme?.kitPresseUrl || '',
              // Section Vie Associative & Formules de Recrutement
              texteVieAssociative: data.publicTheme?.texteVieAssociative || '',
              formulesRecrutement: Array.isArray(data.publicTheme?.formulesRecrutement)
                ? data.publicTheme.formulesRecrutement
                : (data.publicTheme?.formulesRecrutement || []),
              // Champs de la section Recrutement
              afficherRecrutement: data.publicTheme?.afficherRecrutement || false,
              titreRecrutement: data.publicTheme?.titreRecrutement || "Rejoignez la troupe !",
              texteRecrutement: data.publicTheme?.texteRecrutement || '',
              lienRecrutement: data.publicTheme?.lienRecrutement || '',
              texteBoutonRecrutement: data.publicTheme?.texteBoutonRecrutement || "S'inscrire sur HelloAsso",
              primaryColor: data.publicTheme.primaryColor || DEFAULT_PUBLIC_THEME.primaryColor,
              secondaryColor: data.publicTheme.secondaryColor || DEFAULT_PUBLIC_THEME.secondaryColor,
              headingFont: data.publicTheme.headingFont || DEFAULT_PUBLIC_THEME.headingFont,
              bodyFont: data.publicTheme.bodyFont || DEFAULT_PUBLIC_THEME.bodyFont
            });
          } else {
            setPublicTheme(DEFAULT_PUBLIC_THEME);
          }
        } else {
          setPublicTheme(DEFAULT_PUBLIC_THEME);
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
